// Trend Analysis Analyzer - Time Series Trend Detection
// Identifies trends using moving averages, trend direction, and trend strength analysis

export interface TrendDataPoint {
  period: string;          // Period identifier (e.g., "2024-Q1", "Week 5", "Jan 2024")
  value: number;           // Numeric value for the period
  category?: string;       // Optional category (e.g., "Sales", "Revenue", "Users")
}

export interface TrendAnalysisArgs {
  data: TrendDataPoint[];
  metricName: string;      // Name of the metric being analyzed
  windowSize: number;      // Moving average window size (e.g., 3, 5, 7)
  trendType: 'simple' | 'exponential'; // Type of moving average
}

export interface TrendResult {
  period: string;
  value: number;
  movingAverage: number;
  trendDirection: 'upward' | 'downward' | 'stable';
  trendStrength: 'weak' | 'moderate' | 'strong';
  percentChange: number;    // % change from moving average
  emoji: string;           // Visual trend indicator
  description: string;     // Human-readable trend description
}

export interface TrendAnalysis {
  metricName: string;
  windowSize: number;
  trendType: string;
  totalPeriods: number;
  results: TrendResult[];
  summary: {
    overallTrend: 'upward' | 'downward' | 'stable' | 'mixed';
    trendConsistency: number;     // 0-100 score for trend consistency
    averageGrowthRate: number;    // Average period-over-period growth
    volatility: number;           // Measure of data volatility
    strongTrendPeriods: number;   // Count of periods with strong trends
    currentMomentum: 'accelerating' | 'decelerating' | 'steady';
    trendScore: number;           // 0-100 overall trend health score
  };
}

/**
 * Calculate Trend Analysis with Moving Averages
 * Identifies trend direction, strength, and momentum over time
 */
export function calculateTrendAnalysis(args: TrendAnalysisArgs): TrendAnalysis {
  const { data, metricName, windowSize, trendType } = args;
  
  if (!data || data.length === 0) {
    throw new Error('Data array cannot be empty for trend analysis');
  }

  if (windowSize < 2 || windowSize > data.length) {
    throw new Error(`Window size must be between 2 and ${data.length}`);
  }

  // Validate data integrity
  for (const point of data) {
    if (typeof point.value !== 'number' || isNaN(point.value)) {
      throw new Error('All values must be valid numbers');
    }
  }

  // Sort data by period (assuming chronological order)
  const sortedData = [...data].sort((a, b) => a.period.localeCompare(b.period));
  
  const results: TrendResult[] = [];
  const movingAverages: number[] = [];

  // Calculate moving averages and trend indicators
  for (let i = 0; i < sortedData.length; i++) {
    const dataPoint = sortedData[i];
    
    if (i >= windowSize - 1) {
      // Calculate moving average
      const movingAverage = calculateMovingAverage(
        sortedData.slice(i - windowSize + 1, i + 1).map(d => d.value),
        trendType
      );
      
      movingAverages.push(movingAverage);
      
      // Determine trend direction and strength
      const percentChange = ((dataPoint.value - movingAverage) / movingAverage) * 100;
      const trendDirection = getTrendDirection(dataPoint.value, movingAverage);
      const trendStrength = getTrendStrength(Math.abs(percentChange));
      const emoji = getTrendEmoji(trendDirection, trendStrength);
      const description = getTrendDescription(trendDirection, trendStrength);

      results.push({
        period: dataPoint.period,
        value: dataPoint.value,
        movingAverage,
        trendDirection,
        trendStrength,
        percentChange,
        emoji,
        description
      });
    }
  }

  // Calculate summary statistics
  const summary = calculateTrendSummary(results, sortedData);

  return {
    metricName,
    windowSize,
    trendType,
    totalPeriods: data.length,
    results,
    summary
  };
}

/**
 * Calculate moving average (simple or exponential)
 */
function calculateMovingAverage(values: number[], type: 'simple' | 'exponential'): number {
  if (type === 'exponential') {
    // Exponential Moving Average (EMA)
    const alpha = 2 / (values.length + 1);
    let ema = values[0];
    
    for (let i = 1; i < values.length; i++) {
      ema = alpha * values[i] + (1 - alpha) * ema;
    }
    
    return ema;
  } else {
    // Simple Moving Average (SMA)
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

/**
 * Determine trend direction based on current value vs moving average
 */
function getTrendDirection(currentValue: number, movingAverage: number): TrendResult['trendDirection'] {
  const percentDiff = Math.abs((currentValue - movingAverage) / movingAverage) * 100;
  
  if (percentDiff < 2) {
    return 'stable';
  } else if (currentValue > movingAverage) {
    return 'upward';
  } else {
    return 'downward';
  }
}

/**
 * Determine trend strength based on percentage deviation from moving average
 */
function getTrendStrength(absPercentChange: number): TrendResult['trendStrength'] {
  if (absPercentChange < 5) {
    return 'weak';
  } else if (absPercentChange < 15) {
    return 'moderate';
  } else {
    return 'strong';
  }
}

/**
 * Get emoji indicator for trend direction and strength
 */
function getTrendEmoji(direction: TrendResult['trendDirection'], strength: TrendResult['trendStrength']): string {
  if (direction === 'stable') {
    return '➡️';  // Stable/sideways trend
  }
  
  if (direction === 'upward') {
    switch (strength) {
      case 'strong': return '🚀';   // Strong upward trend
      case 'moderate': return '📈'; // Moderate upward trend
      case 'weak': return '↗️';     // Weak upward trend
    }
  }
  
  if (direction === 'downward') {
    switch (strength) {
      case 'strong': return '📉';   // Strong downward trend
      case 'moderate': return '↘️'; // Moderate downward trend
      case 'weak': return '↙️';     // Weak downward trend
    }
  }
  
  return '📊'; // Default
}

/**
 * Get human-readable trend description
 */
function getTrendDescription(
  direction: TrendResult['trendDirection'],
  strength: TrendResult['trendStrength']
): string {
  const strengthText = strength.charAt(0).toUpperCase() + strength.slice(1);
  const directionText = direction === 'upward' ? 'Growth' : 
                       direction === 'downward' ? 'Decline' : 'Stability';
  
  if (direction === 'stable') {
    return 'Stable Trend';
  }
  
  return `${strengthText} ${directionText}`;
}

/**
 * Calculate comprehensive trend summary statistics
 */
function calculateTrendSummary(results: TrendResult[], originalData: TrendDataPoint[]): TrendAnalysis['summary'] {
  // Overall trend determination
  const upwardCount = results.filter(r => r.trendDirection === 'upward').length;
  const downwardCount = results.filter(r => r.trendDirection === 'downward').length;
  const stableCount = results.filter(r => r.trendDirection === 'stable').length;
  
  let overallTrend: TrendAnalysis['summary']['overallTrend'];
  if (upwardCount > downwardCount && upwardCount > stableCount) {
    overallTrend = 'upward';
  } else if (downwardCount > upwardCount && downwardCount > stableCount) {
    overallTrend = 'downward';
  } else if (stableCount > upwardCount && stableCount > downwardCount) {
    overallTrend = 'stable';
  } else {
    overallTrend = 'mixed';
  }
  
  // Trend consistency (how consistent the trend direction is)
  const dominantTrendCount = Math.max(upwardCount, downwardCount, stableCount);
  const trendConsistency = (dominantTrendCount / results.length) * 100;
  
  // Average growth rate (period-over-period)
  let totalGrowthRate = 0;
  for (let i = 1; i < originalData.length; i++) {
    const growthRate = ((originalData[i].value - originalData[i-1].value) / originalData[i-1].value) * 100;
    totalGrowthRate += growthRate;
  }
  const averageGrowthRate = totalGrowthRate / (originalData.length - 1);
  
  // Volatility calculation (standard deviation of percentage changes)
  const percentChanges = results.map(r => r.percentChange);
  const avgPercentChange = percentChanges.reduce((sum, pc) => sum + pc, 0) / percentChanges.length;
  const variance = percentChanges.reduce((sum, pc) => sum + Math.pow(pc - avgPercentChange, 2), 0) / percentChanges.length;
  const volatility = Math.sqrt(variance);
  
  // Strong trend periods
  const strongTrendPeriods = results.filter(r => r.trendStrength === 'strong').length;
  
  // Current momentum (last 3 periods if available)
  let currentMomentum: TrendAnalysis['summary']['currentMomentum'] = 'steady';
  if (results.length >= 3) {
    const recentResults = results.slice(-3);
    const recentGrowthRates = recentResults.map(r => r.percentChange);
    
    // Check if growth rates are increasing (accelerating) or decreasing (decelerating)
    const isAccelerating = recentGrowthRates[2] > recentGrowthRates[1] && recentGrowthRates[1] > recentGrowthRates[0];
    const isDecelerating = recentGrowthRates[2] < recentGrowthRates[1] && recentGrowthRates[1] < recentGrowthRates[0];
    
    if (isAccelerating) {
      currentMomentum = 'accelerating';
    } else if (isDecelerating) {
      currentMomentum = 'decelerating';
    }
  }
  
  // Overall trend score (0-100)
  let trendScore = 50; // Start with neutral
  
  // Adjust based on overall trend direction
  if (overallTrend === 'upward') trendScore += 20;
  else if (overallTrend === 'downward') trendScore -= 20;
  
  // Adjust based on consistency
  trendScore += (trendConsistency - 50) * 0.3;
  
  // Adjust based on volatility (lower volatility = higher score)
  trendScore -= Math.min(volatility, 20);
  
  // Adjust based on momentum
  if (currentMomentum === 'accelerating') trendScore += 10;
  else if (currentMomentum === 'decelerating') trendScore -= 10;
  
  // Ensure score is between 0-100
  trendScore = Math.max(0, Math.min(100, trendScore));

  return {
    overallTrend,
    trendConsistency,
    averageGrowthRate,
    volatility,
    strongTrendPeriods,
    currentMomentum,
    trendScore
  };
}

/**
 * Helper function to format percentage values for trend analysis
 */
export function formatTrendPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Helper function to format large numbers with appropriate units
 */
export function formatTrendValue(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  } else {
    return value.toLocaleString();
  }
}
