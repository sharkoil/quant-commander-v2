/**
 * Time period utilities for contribution analysis
 * Handles quarter and month grouping, parsing, and filtering
 */

/**
 * Represents a time period for analysis
 */
export interface TimePeriod {
  type: 'month' | 'quarter';
  year: number;
  period: number; // 1-12 for months, 1-4 for quarters
  label: string;   // "2024-Q1" or "2024-Jan"
  start: Date;
  end: Date;
}

/**
 * Parse date from various formats commonly found in CSV files
 */
export function parseDate(dateValue: unknown): Date | null {
  if (!dateValue) return null;
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // Handle string dates
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Handle numeric dates (Excel serial numbers)
  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const msPerDay = 24 * 60 * 60 * 1000;
    const parsed = new Date(excelEpoch.getTime() + dateValue * msPerDay);
    
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return null;
}

/**
 * Get quarter number (1-4) from date
 */
export function getQuarterFromDate(date: Date): number {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  return Math.ceil(month / 3);
}

/**
 * Get quarter label (e.g., "2024-Q1")
 */
export function getQuarterLabel(date: Date): string {
  const year = date.getFullYear();
  const quarter = getQuarterFromDate(date);
  return `${year}-Q${quarter}`;
}

/**
 * Get month label (e.g., "2024-Jan")
 */
export function getMonthLabel(date: Date): string {
  const year = date.getFullYear();
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${year}-${month}`;
}

/**
 * Create a TimePeriod object for a quarter
 */
export function createQuarterPeriod(year: number, quarter: number): TimePeriod {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, endMonth + 1, 0); // Last day of the quarter
  
  return {
    type: 'quarter',
    year,
    period: quarter,
    label: `${year}-Q${quarter}`,
    start,
    end
  };
}

/**
 * Create a TimePeriod object for a month
 */
export function createMonthPeriod(year: number, month: number): TimePeriod {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // Last day of the month
  
  const monthName = start.toLocaleString('en-US', { month: 'short' });
  
  return {
    type: 'month',
    year,
    period: month,
    label: `${year}-${monthName}`,
    start,
    end
  };
}

/**
 * Get all quarters present in a dataset
 */
export function getAvailableQuarters(dates: Date[]): TimePeriod[] {
  const quarters = new Set<string>();
  
  dates.forEach(date => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      const year = date.getFullYear();
      const quarter = getQuarterFromDate(date);
      quarters.add(`${year}-${quarter}`);
    }
  });
  
  return Array.from(quarters)
    .map(quarterKey => {
      const [year, quarter] = quarterKey.split('-').map(Number);
      return createQuarterPeriod(year, quarter);
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.period - b.period;
    });
}

/**
 * Get all months present in a dataset
 */
export function getAvailableMonths(dates: Date[]): TimePeriod[] {
  const months = new Set<string>();
  
  dates.forEach(date => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      months.add(`${year}-${month}`);
    }
  });
  
  return Array.from(months)
    .map(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      return createMonthPeriod(year, month);
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.period - b.period;
    });
}

/**
 * Check if a date falls within a time period
 */
export function isDateInPeriod(date: Date, period: TimePeriod): boolean {
  return date >= period.start && date <= period.end;
}

/**
 * Group data by time period
 */
export function groupDataByPeriod<T extends { date: Date }>(
  data: T[],
  periodType: 'quarter' | 'month'
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  data.forEach(item => {
    if (item.date instanceof Date && !isNaN(item.date.getTime())) {
      const label = periodType === 'quarter' 
        ? getQuarterLabel(item.date)
        : getMonthLabel(item.date);
      
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(item);
    }
  });
  
  return groups;
}
