// Period-Based Variance Analyzer - Time Series Analysis
// Calculates variance between consecutive periods (WoW, MoM, etc.) for entire datasets

export interface TimeSeriesDataPoint {
  date: string | Date;
  value: number;
  label?: string; // Optional label for the period
}

// Enhanced interface for flexible CSV data input
export interface FlexibleTimeSeriesData {
  [key: string]: string | number; // Raw CSV row data
}

export interface PeriodVarianceArgs {
  data: TimeSeriesDataPoint[];
  periodType: 'WoW' | 'MoM' | 'YoY' | 'QoQ' | 'DoD'; // Day-over-Day added
  metricName: string;
  // Column mapping for flexible data - future enhancement
  columnMapping?: {
    dateColumn: string;
    valueColumn: string;
    labelColumn?: string;
  };
}

export interface PeriodVarianceResult {
  period: string;
  currentValue: number;
  previousValue: number;
  variance: number;
  percentageVariance: number;
  direction: 'increase' | 'decrease' | 'stable';
  emoji: string;
  trend: string;
}

export interface PeriodVarianceAnalysis {
  metricName: string;
  periodType: string;
  totalPeriods: number;
  results: PeriodVarianceResult[];
  summary: {
    averageVariance: number;
    averagePercentageVariance: number;
    positiveChanges: number;
    negativeChanges: number;
    stableChanges: number;
    overallTrend: string;
    overallEmoji: string;
  };
}

/**
 * Calculate period-based variance for time series data
 * @param args - Period variance calculation arguments with time series data
 * @returns Complete variance analysis with table-ready results
 */
export function calculatePeriodVariance(args: PeriodVarianceArgs): PeriodVarianceAnalysis {
  const { data, periodType, metricName } = args;
  
  if (data.length < 2) {
    throw new Error('At least 2 data points are required for period variance analysis');
  }
  
  // Sort data by date to ensure chronological order
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });
  
  const results: PeriodVarianceResult[] = [];
  
  // Calculate variance for each consecutive period
  for (let i = 1; i < sortedData.length; i++) {
    const current = sortedData[i];
    const previous = sortedData[i - 1];
    
    if (previous.value === 0) {
      continue; // Skip if previous value is zero to avoid division by zero
    }
    
    const variance = current.value - previous.value;
    const percentageVariance = (variance / previous.value) * 100;
    
    const direction = getDirection(percentageVariance);
    const emoji = getEmoji(direction, percentageVariance);
    const trend = getTrendDescription(direction, Math.abs(percentageVariance));
    
    const periodLabel = formatPeriodLabel(previous.date, current.date);
    
    results.push({
      period: periodLabel,
      currentValue: current.value,
      previousValue: previous.value,
      variance,
      percentageVariance,
      direction,
      emoji,
      trend
    });
  }
  
  // Calculate summary statistics
  const summary = calculateSummary(results);
  
  return {
    metricName,
    periodType,
    totalPeriods: results.length,
    results,
    summary
  };
}

/**
 * Determine direction of change
 */
function getDirection(percentageVariance: number): 'increase' | 'decrease' | 'stable' {
  if (Math.abs(percentageVariance) < 0.5) { // Less than 0.5% considered stable
    return 'stable';
  } else if (percentageVariance > 0) {
    return 'increase';
  } else {
    return 'decrease';
  }
}

/**
 * Get emoji based on direction and magnitude
 */
function getEmoji(direction: string, percentageVariance: number): string {
  const absPercentage = Math.abs(percentageVariance);
  
  switch (direction) {
    case 'increase':
      if (absPercentage >= 20) return '🚀'; // Rocket for big gains
      if (absPercentage >= 10) return '📈'; // Chart up for good gains
      if (absPercentage >= 5) return '⬆️';  // Arrow up for moderate gains
      return '🔼'; // Small triangle for small gains
    
    case 'decrease':
      if (absPercentage >= 20) return '💥'; // Explosion for big drops
      if (absPercentage >= 10) return '📉'; // Chart down for significant drops
      if (absPercentage >= 5) return '⬇️';  // Arrow down for moderate drops
      return '🔽'; // Small triangle for small drops
    
    case 'stable':
      return '➡️'; // Right arrow for stable
    
    default:
      return '📊'; // Generic chart emoji
  }
}

/**
 * Get trend description
 */
function getTrendDescription(direction: string, absPercentage: number): string {
  switch (direction) {
    case 'increase':
      if (absPercentage >= 20) return 'Strong Growth';
      if (absPercentage >= 10) return 'Solid Growth';
      if (absPercentage >= 5) return 'Moderate Growth';
      return 'Slight Growth';
    
    case 'decrease':
      if (absPercentage >= 20) return 'Sharp Decline';
      if (absPercentage >= 10) return 'Significant Drop';
      if (absPercentage >= 5) return 'Moderate Decline';
      return 'Slight Drop';
    
    case 'stable':
      return 'Stable';
    
    default:
      return 'Unknown';
  }
}

/**
 * Format period label based on dates
 */
function formatPeriodLabel(previousDate: string | Date, currentDate: string | Date): string {
  const prevStr = new Date(previousDate).toLocaleDateString();
  const currStr = new Date(currentDate).toLocaleDateString();
  return `${currStr} vs ${prevStr}`;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(results: PeriodVarianceResult[]): {
  averageVariance: number;
  averagePercentageVariance: number;
  positiveChanges: number;
  negativeChanges: number;
  stableChanges: number;
  overallTrend: string;
  overallEmoji: string;
} {
  if (results.length === 0) {
    return {
      averageVariance: 0,
      averagePercentageVariance: 0,
      positiveChanges: 0,
      negativeChanges: 0,
      stableChanges: 0,
      overallTrend: 'No Data',
      overallEmoji: '❓'
    };
  }
  
  const totalVariance = results.reduce((sum, r) => sum + r.variance, 0);
  const totalPercentageVariance = results.reduce((sum, r) => sum + r.percentageVariance, 0);
  
  const positiveChanges = results.filter(r => r.direction === 'increase').length;
  const negativeChanges = results.filter(r => r.direction === 'decrease').length;
  const stableChanges = results.filter(r => r.direction === 'stable').length;
  
  const averageVariance = totalVariance / results.length;
  const averagePercentageVariance = totalPercentageVariance / results.length;
  
  // Determine overall trend
  let overallTrend: string;
  let overallEmoji: string;
  
  if (positiveChanges > negativeChanges) {
    overallTrend = 'Generally Positive';
    overallEmoji = '📈';
  } else if (negativeChanges > positiveChanges) {
    overallTrend = 'Generally Negative';
    overallEmoji = '📉';
  } else {
    overallTrend = 'Mixed/Stable';
    overallEmoji = '➡️';
  }
  
  return {
    averageVariance,
    averagePercentageVariance,
    positiveChanges,
    negativeChanges,
    stableChanges,
    overallTrend,
    overallEmoji
  };
}

// Function calling schema for LLM integration
export const PERIOD_VARIANCE_FUNCTION_SCHEMA = {
  name: "calculate_period_variance",
  description: "Analyze time series data to calculate variance between consecutive periods (Week-over-Week, Month-over-Month, etc.) with trend analysis and emoji indicators",
  parameters: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "Date in ISO format (YYYY-MM-DD) or any parseable date string"
            },
            value: {
              type: "number",
              description: "Numeric value for this time period"
            },
            label: {
              type: "string",
              description: "Optional label for the period"
            }
          },
          required: ["date", "value"]
        },
        description: "Array of time series data points with dates and values"
      },
      periodType: {
        type: "string",
        enum: ["WoW", "MoM", "YoY", "QoQ", "DoD"],
        description: "The type of period comparison: DoD (Day-over-Day), WoW (Week-over-Week), MoM (Month-over-Month), QoQ (Quarter-over-Quarter), YoY (Year-over-Year)"
      },
      metricName: {
        type: "string",
        description: "The name of the metric being analyzed (e.g., 'Sales', 'Revenue', 'Units', 'Profit')"
      }
    },
    required: ["data", "periodType", "metricName"]
  }
};
