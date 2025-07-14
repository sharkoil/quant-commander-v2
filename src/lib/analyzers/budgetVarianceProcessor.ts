// Budget variance analysis data processor
// Handles mapping CSV columns to budget and actual values with dynamic recalculation

import { removeDemoData } from '../utils/dataCleanup';

export interface BudgetVarianceDataPoint {
  period: string;
  periodStart: Date;
  periodEnd: Date;
  budget: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'favorable' | 'unfavorable' | 'neutral';
  rowCount: number; // Number of rows that contributed to this period
}

export interface BudgetVarianceParams {
  budgetColumn: string;
  actualColumn: string;
  dateColumn?: string;
  categoryColumn?: string;
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export interface ProcessingResult {
  dataPoints: BudgetVarianceDataPoint[];
  summary: {
    totalRows: number;
    periodsFound: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    expectedPeriods: number;
  };
}

/**
 * Formats period label with clear start date
 */
const formatPeriodLabel = (date: Date, periodType: string): string => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  switch (periodType) {
    case 'weekly':
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    case 'monthly':
      return `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    case 'quarterly':
      const quarter = Math.floor(month / 3) + 1;
      return `Q${quarter} ${year}`;
    case 'yearly':
      return `${year}`;
    default:
      return date.toLocaleDateString('en-US');
  }
};

/**
 * Gets period start and end dates
 */
const getPeriodDates = (date: Date, periodType: string): { start: Date; end: Date } => {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  switch (periodType) {
    case 'weekly':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return { start: weekStart, end: weekEnd };
      
    case 'monthly':
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0); // Last day of month
      return { start: monthStart, end: monthEnd };
      
    case 'quarterly':
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const quarterStart = new Date(year, quarterStartMonth, 1);
      const quarterEnd = new Date(year, quarterStartMonth + 3, 0);
      return { start: quarterStart, end: quarterEnd };
      
    case 'yearly':
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      return { start: yearStart, end: yearEnd };
      
    default:
      return { start: date, end: date };
  }
};

/**
 * Processes CSV data for budget variance analysis with dynamic recalculation
 * @param csvData - Raw CSV data from upload
 * @param params - Analysis parameters from user controls
 * @returns Processed budget variance data points with summary
 */
export const processBudgetVarianceData = (
  csvData: unknown[],
  params: BudgetVarianceParams
): ProcessingResult => {
  console.log('📊 Processing budget variance data:', { 
    rowCount: csvData.length, 
    params 
  });

  // Remove any demo data first
  const cleanData = removeDemoData(csvData);
  
  if (cleanData.length === 0) {
    console.warn('⚠️ No valid data after demo data removal');
    return {
      dataPoints: [],
      summary: {
        totalRows: 0,
        periodsFound: 0,
        dateRange: { start: new Date(), end: new Date() },
        expectedPeriods: 0
      }
    };
  }

  // Convert to typed data
  const typedData = cleanData.map(row => row as Record<string, unknown>);
  
  // Validate required columns exist
  const firstRow = typedData[0];
  if (!firstRow[params.budgetColumn] || !firstRow[params.actualColumn]) {
    console.error(`❌ Required columns not found: ${params.budgetColumn}, ${params.actualColumn}`);
    return {
      dataPoints: [],
      summary: {
        totalRows: 0,
        periodsFound: 0,
        dateRange: { start: new Date(), end: new Date() },
        expectedPeriods: 0
      }
    };
  }

  // Process data and group by periods
  const periodMap = new Map<string, {
    budget: number;
    actual: number;
    rowCount: number;
    periodStart: Date;
    periodEnd: Date;
    firstDate: Date;
  }>();

  let minDate = new Date();
  let maxDate = new Date(0);
  let validRowCount = 0;

  typedData.forEach(row => {
    const budgetValue = parseFloat(String(row[params.budgetColumn] || '0'));
    const actualValue = parseFloat(String(row[params.actualColumn] || '0'));
    
    if (isNaN(budgetValue) || isNaN(actualValue)) return;
    
    validRowCount++;
    
    // Handle date grouping if date column is provided
    if (params.dateColumn && row[params.dateColumn]) {
      const dateValue = new Date(String(row[params.dateColumn]));
      if (!isNaN(dateValue.getTime())) {
        minDate = validRowCount === 1 ? dateValue : new Date(Math.min(minDate.getTime(), dateValue.getTime()));
        maxDate = new Date(Math.max(maxDate.getTime(), dateValue.getTime()));
        
        const { start, end } = getPeriodDates(dateValue, params.periodType);
        const periodKey = formatPeriodLabel(start, params.periodType);
        
        if (!periodMap.has(periodKey)) {
          periodMap.set(periodKey, {
            budget: 0,
            actual: 0,
            rowCount: 0,
            periodStart: start,
            periodEnd: end,
            firstDate: dateValue
          });
        }
        
        const period = periodMap.get(periodKey)!;
        period.budget += budgetValue;
        period.actual += actualValue;
        period.rowCount++;
      }
    } else {
      // No date grouping - create single "All Data" period
      const periodKey = 'All Data';
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          budget: 0,
          actual: 0,
          rowCount: 0,
          periodStart: new Date(),
          periodEnd: new Date(),
          firstDate: new Date()
        });
      }
      
      const period = periodMap.get(periodKey)!;
      period.budget += budgetValue;
      period.actual += actualValue;
      period.rowCount++;
    }
  });

  // Convert to data points and sort by date
  const dataPoints: BudgetVarianceDataPoint[] = Array.from(periodMap.entries())
    .map(([periodKey, data]) => {
      const variance = data.actual - data.budget;
      const variancePercentage = data.budget !== 0 ? (variance / data.budget) * 100 : 0;
      
      let status: 'favorable' | 'unfavorable' | 'neutral' = 'neutral';
      if (Math.abs(variancePercentage) > 0.1) { // More than 0.1% difference
        status = variance >= 0 ? 'favorable' : 'unfavorable';
      }
      
      return {
        period: periodKey,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        budget: data.budget,
        actual: data.actual,
        variance,
        variancePercentage,
        status,
        rowCount: data.rowCount
      };
    })
    .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());

  // Calculate expected periods based on date range
  let expectedPeriods = 1;
  if (params.dateColumn && minDate && maxDate && validRowCount > 1) {
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (params.periodType) {
      case 'weekly':
        expectedPeriods = Math.ceil(totalDays / 7);
        break;
      case 'monthly':
        const months = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + 
                      (maxDate.getMonth() - minDate.getMonth()) + 1;
        expectedPeriods = months;
        break;
      case 'quarterly':
        const monthsPeriod = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + 
                           (maxDate.getMonth() - minDate.getMonth()) + 1;
        expectedPeriods = Math.ceil(monthsPeriod / 3);
        break;
      case 'yearly':
        expectedPeriods = maxDate.getFullYear() - minDate.getFullYear() + 1;
        break;
    }
  }

  console.log('✅ Processed budget variance data:', {
    periodsFound: dataPoints.length,
    expectedPeriods,
    dateRange: { start: minDate, end: maxDate },
    totalRows: validRowCount
  });

  return {
    dataPoints,
    summary: {
      totalRows: validRowCount,
      periodsFound: dataPoints.length,
      dateRange: { start: minDate, end: maxDate },
      expectedPeriods
    }
  };
};
