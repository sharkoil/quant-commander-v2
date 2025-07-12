// Top N Analysis - Helper Utilities
// Utility functions for data aggregation, period grouping, and statistical calculations

import { 
  FlexibleTopNData, 
  PeriodData, 
  ColumnValidation
} from './topNTypes';

/**
 * Groups data by a specified column value
 * Essential for category-based analysis (group by region, product, etc.)
 */
export function groupBy<T>(data: T[], key: string): Record<string, T[]> {
  return data.reduce((groups, item) => {
    // Handle both string and object property access
    const groupKey = typeof item === 'object' && item !== null && key in item 
      ? String((item as Record<string, unknown>)[key]) 
      : 'Unknown';
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Calculates sum of values for a specific column in a dataset
 * Handles string-to-number conversion for CSV data
 */
export function sumBy(data: FlexibleTopNData[], column: string): number {
  return data.reduce((sum, item) => {
    const value = item[column];
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    return sum + (isNaN(numValue) ? 0 : numValue);
  }, 0);
}

/**
 * Calculates average (mean) of values for a specific column
 * Returns 0 for empty datasets to avoid division by zero
 */
export function meanBy(data: FlexibleTopNData[], column: string): number {
  if (data.length === 0) return 0;
  return sumBy(data, column) / data.length;
}

/**
 * Calculates median value for statistical analysis
 * Handles even and odd length arrays correctly
 */
export function medianBy(data: FlexibleTopNData[], column: string): number {
  const values = data
    .map(item => {
      const value = item[column];
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      return isNaN(numValue) ? 0 : numValue;
    })
    .sort((a, b) => a - b);

  if (values.length === 0) return 0;
  
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 0 
    ? (values[middle - 1] + values[middle]) / 2 
    : values[middle];
}

/**
 * Calculates standard deviation for distribution analysis
 * Uses population standard deviation formula
 */
export function standardDeviationBy(data: FlexibleTopNData[], column: string): number {
  if (data.length === 0) return 0;
  
  const mean = meanBy(data, column);
  const squaredDifferences = data.map(item => {
    const value = item[column];
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    const actualValue = isNaN(numValue) ? 0 : numValue;
    return Math.pow(actualValue - mean, 2);
  });
  
  const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * Groups data by time periods (week, month, quarter, year)
 * Handles various date formats and creates period identifiers
 */
export function groupByPeriod(
  data: FlexibleTopNData[], 
  dateColumn: string, 
  aggregationType: 'week' | 'month' | 'quarter' | 'year'
): Record<string, FlexibleTopNData[]> {
  
  return data.reduce((groups, item) => {
    const dateValue = item[dateColumn];
    let date: Date;
    
    // Handle different date formats
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else {
      // Skip records with invalid dates
      return groups;
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      return groups;
    }
    
    // Generate period key based on aggregation type
    const periodKey = generatePeriodKey(date, aggregationType);
    
    if (!groups[periodKey]) {
      groups[periodKey] = [];
    }
    groups[periodKey].push(item);
    return groups;
  }, {} as Record<string, FlexibleTopNData[]>);
}

/**
 * Generates standardized period keys for grouping
 * Creates consistent period identifiers across different aggregation types
 */
export function generatePeriodKey(date: Date, aggregationType: 'week' | 'month' | 'quarter' | 'year'): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  
  switch (aggregationType) {
    case 'year':
      return `${year}`;
    
    case 'quarter':
      const quarter = Math.floor(month / 3) + 1;
      return `${year}-Q${quarter}`;
    
    case 'month':
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[month]} ${year}`;
    
    case 'week':
      // Get ISO week number
      const oneJan = new Date(year, 0, 1);
      const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
      return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    
    default:
      return `${year}-${(month + 1).toString().padStart(2, '0')}`;
  }
}

/**
 * Gets the start date of a period for chronological sorting
 * Essential for maintaining temporal order in period analysis
 */
export function getPeriodStartDate(periodKey: string, aggregationType: 'week' | 'month' | 'quarter' | 'year'): Date {
  const year = parseInt(periodKey.split('-')[0]);
  
  switch (aggregationType) {
    case 'year':
      return new Date(year, 0, 1);
    
    case 'quarter':
      const quarter = parseInt(periodKey.split('Q')[1]);
      const startMonth = (quarter - 1) * 3;
      return new Date(year, startMonth, 1);
    
    case 'month':
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = periodKey.split(' ')[0];
      const monthIndex = monthNames.indexOf(monthName);
      return new Date(year, monthIndex, 1);
    
    case 'week':
      const weekNumber = parseInt(periodKey.split('W')[1]);
      const oneJan = new Date(year, 0, 1);
      const daysToAdd = (weekNumber - 1) * 7 - oneJan.getDay() + 1;
      return new Date(year, 0, 1 + daysToAdd);
    
    default:
      return new Date(year, 0, 1);
  }
}

/**
 * Validates that a column exists and contains appropriate data for analysis
 * Performs data type detection and quality checks
 */
export function validateColumn(data: FlexibleTopNData[], column: string): ColumnValidation {
  // Check if column exists
  const sampleRow = data.find(row => row[column] !== undefined);
  if (!sampleRow) {
    return {
      isValid: false,
      errorMessage: `Column '${column}' not found in data`,
      dataType: 'text',
      nullCount: data.length,
      uniqueValues: 0,
      sampleValues: []
    };
  }
  
  // Analyze column data
  const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
  const nullCount = data.length - values.length;
  const uniqueValues = new Set(values).size;
  const sampleValues = values.slice(0, 5).map(val => 
    val instanceof Date ? val.toISOString() : val
  ) as (string | number)[]; // First 5 non-null values, convert dates to strings
  
  // Detect data type
  let dataType: 'numeric' | 'text' | 'date' | 'mixed' = 'text';
  const numericValues = values.filter(val => {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return !isNaN(num);
  });
  
  const dateValues = values.filter(val => {
    const date = new Date(String(val));
    return !isNaN(date.getTime());
  });
  
  if (numericValues.length === values.length && values.length > 0) {
    dataType = 'numeric';
  } else if (dateValues.length === values.length && values.length > 0) {
    dataType = 'date';
  } else if (numericValues.length > 0 && dateValues.length > 0) {
    dataType = 'mixed';
  } else {
    dataType = 'text';
  }
  
  // Validation rules
  const isValid = values.length > 0 && nullCount < data.length * 0.5; // Less than 50% null
  const errorMessage = !isValid ? `Column '${column}' has too many missing values (${nullCount}/${data.length})` : undefined;
  
  return {
    isValid,
    errorMessage,
    dataType,
    nullCount,
    uniqueValues,
    sampleValues
  };
}

/**
 * Sorts ranking items by value in descending order and assigns ranks
 * Handles tied values appropriately
 */
export function assignRanks<T extends { value: number }>(items: T[]): (T & { rank: number })[] {
  // Sort by value descending
  const sorted = [...items].sort((a, b) => b.value - a.value);
  
  // Assign ranks, handling ties
  let currentRank = 1;
  return sorted.map((item, index) => {
    // If this value is different from the previous, update rank
    if (index > 0 && item.value < sorted[index - 1].value) {
      currentRank = index + 1;
    }
    
    return {
      ...item,
      rank: currentRank
    };
  });
}

/**
 * Calculates growth rate between first and last period
 * Returns percentage growth (positive for increase, negative for decrease)
 */
export function calculateGrowthRate(periodData: PeriodData[]): number {
  if (periodData.length < 2) return 0;
  
  // Sort by period start date
  const sorted = [...periodData].sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
  
  const firstValue = sorted[0].value;
  const lastValue = sorted[sorted.length - 1].value;
  
  if (firstValue === 0) return lastValue > 0 ? 100 : 0; // Avoid division by zero
  
  return ((lastValue - firstValue) / firstValue) * 100;
}

/**
 * Formats numbers for display with appropriate precision and units
 * Handles large numbers with K, M, B suffixes
 */
export function formatDisplayValue(value: number): string {
  const absValue = Math.abs(value);
  
  if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  } else if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  } else if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  } else if (absValue >= 1) {
    return value.toFixed(0);
  } else {
    return value.toFixed(2);
  }
}
