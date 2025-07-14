import { startOfWeek, startOfMonth, startOfQuarter, startOfYear, format, sub } from 'date-fns';

export interface PeriodVarianceParams {
  valueColumn: string;
  dateColumn: string;
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface PeriodVarianceResult {
  title: string;
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  data: { 
    period: string;
    value: number;
    previousValue: number | null;
    variance: number | null;
    variancePercentage: number | null;
  }[];
  metadata: { recordCount: number };
}

export function processPeriodVarianceData(csvData: Record<string, any>[], params: PeriodVarianceParams): PeriodVarianceResult {
  const { valueColumn, dateColumn, periodType } = params;

  if (!valueColumn || !dateColumn) {
    throw new Error('Value column and date column must be specified.');
  }

  const groupedData: Record<string, number> = {};

  for (const row of csvData) {
    const date = new Date(row[dateColumn]);
    const value = Number(row[valueColumn]);

    if (isNaN(date.getTime()) || isNaN(value)) {
      continue;
    }

    let periodKey: string;
    switch (periodType) {
      case 'weekly':
        periodKey = format(startOfWeek(date), 'yyyy-MM-dd');
        break;
      case 'monthly':
        periodKey = format(startOfMonth(date), 'yyyy-MM');
        break;
      case 'quarterly':
        periodKey = format(startOfQuarter(date), "yyyy-'Q'q");
        break;
      case 'yearly':
        periodKey = format(startOfYear(date), 'yyyy');
        break;
    }

    if (!groupedData[periodKey]) {
      groupedData[periodKey] = 0;
    }
    groupedData[periodKey] += value;
  }

  const sortedPeriods = Object.keys(groupedData).sort();
  const data = sortedPeriods.map((period, index) => {
    const value = groupedData[period];
    const previousPeriodKey = index > 0 ? sortedPeriods[index - 1] : null;
    const previousValue = previousPeriodKey ? groupedData[previousPeriodKey] : null;
    const variance = previousValue !== null ? value - previousValue : null;
    const variancePercentage = previousValue !== null && previousValue !== 0 ? (variance! / previousValue) * 100 : null;

    return {
      period,
      value,
      previousValue,
      variance,
      variancePercentage
    };
  });

  return {
    title: 'Period-over-Period Variance',
    periodType: periodType,
    data: data,
    metadata: { recordCount: csvData.length }
  };
}