/**
 * Trend Analysis Processor
 * 
 * Processes CSV data for trend analysis with moving averages, trend direction detection,
 * and comprehensive trend statistics. Designed to work with interactive controls
 * and real-time recalculation.
 */

import { 
  calculateTrendAnalysis, 
  TrendDataPoint, 
  TrendAnalysisArgs, 
  TrendAnalysis,
  formatTrendPercentage,
  formatTrendValue 
} from './trendAnalysis';

export interface TrendAnalysisParams {
  valueColumn: string;
  dateColumn: string;
  windowSize: number;
  trendType: 'simple' | 'exponential';
}

export interface TrendAnalysisResult {
  title: string;
  metricName: string;
  params: TrendAnalysisParams;
  analysis: TrendAnalysis;
  metadata: { 
    recordCount: number;
    periodsAnalyzed: number;
    windowSize: number;
    trendType: string;
  };
}

/**
 * Process CSV data for trend analysis
 * Converts raw CSV data into trend analysis with moving averages and trend detection
 */
export function processTrendAnalysisData(
  csvData: Record<string, any>[], 
  params: TrendAnalysisParams
): TrendAnalysisResult {
  const { valueColumn, dateColumn, windowSize, trendType } = params;

  // Validate input parameters
  if (!valueColumn || !dateColumn) {
    throw new Error('Value column and date column must be specified.');
  }

  if (windowSize < 2 || windowSize > 20) {
    throw new Error('Window size must be between 2 and 20.');
  }

  if (!csvData || csvData.length === 0) {
    throw new Error('CSV data cannot be empty.');
  }

  // Convert CSV data to trend data points
  const trendDataPoints: TrendDataPoint[] = [];
  
  for (const row of csvData) {
    const dateValue = row[dateColumn];
    const numericValue = row[valueColumn];

    // Skip invalid rows
    if (!dateValue || numericValue === null || numericValue === undefined) {
      continue;
    }

    // Convert to number
    const value = Number(numericValue);
    if (isNaN(value)) {
      continue;
    }

    // Create period string from date
    let period: string;
    if (dateValue instanceof Date) {
      period = dateValue.toISOString().substring(0, 10);
    } else {
      // Try to parse as date string
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        // If not a valid date, use the raw value as period
        period = String(dateValue);
      } else {
        period = date.toISOString().substring(0, 10);
      }
    }

    trendDataPoints.push({
      period,
      value,
      category: valueColumn
    });
  }

  // Validate we have enough data points
  if (trendDataPoints.length < windowSize) {
    throw new Error(`Need at least ${windowSize} data points for trend analysis. Found ${trendDataPoints.length}.`);
  }

  // Sort data points by period (chronological order)
  trendDataPoints.sort((a, b) => a.period.localeCompare(b.period));

  // Prepare trend analysis arguments
  const trendArgs: TrendAnalysisArgs = {
    data: trendDataPoints,
    metricName: `${valueColumn} Trend Analysis`,
    windowSize,
    trendType
  };

  // Calculate trend analysis
  const analysis = calculateTrendAnalysis(trendArgs);

  return {
    title: `${valueColumn} - Trend Analysis`,
    metricName: `${valueColumn} Trend Analysis`,
    params,
    analysis,
    metadata: {
      recordCount: csvData.length,
      periodsAnalyzed: trendDataPoints.length,
      windowSize,
      trendType
    }
  };
}
