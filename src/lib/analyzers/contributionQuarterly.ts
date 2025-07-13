/**
 * Quarterly contribution analysis utilities
 * Handles quarter-over-quarter contribution analysis and seasonal insights
 */

import { 
  ContributionAnalysisParams, 
  ContributionItem, 
  FlexibleContributionData 
} from './contributionTypes';
import { 
  parseDate,
  getAvailableQuarters,
  groupDataByPeriod
} from '../timePeriodUtils';

/**
 * Process data for quarterly contribution analysis
 */
export function processQuarterlyContribution(
  data: FlexibleContributionData[],
  params: ContributionAnalysisParams
): {
  quarterlyAnalysis: { [quarterLabel: string]: ContributionItem[] };
  periodComparison: {
    periods: string[];
    categoryTrends: {
      category: string;
      values: number[];
      trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
      variance: number;
    }[];
  };
  seasonalInsights: string[];
  trendInsights: string[];
} {
  if (!params.timePeriodAnalysis?.enabled || !params.timePeriodAnalysis.dateColumn) {
    throw new Error('Time period analysis must be enabled with a valid date column');
  }

  // Parse and prepare data with dates
  const processedData = data.map(row => {
    const dateValue = row[params.timePeriodAnalysis!.dateColumn];
    const parsedDate = parseDate(dateValue);
    const value = Number(row[params.valueColumn]) || 0;
    return {
      category: String(row[params.categoryColumn] || 'Unknown'),
      subcategory: params.subcategoryColumn ? String(row[params.subcategoryColumn]) : undefined,
      value: value,
      date: parsedDate
    };
  });

  const filteredData = processedData.filter(item => item.date !== null && !isNaN(item.value));

  // Get available quarters
  const validDates = filteredData.map(item => item.date!);
  const availableQuarters = getAvailableQuarters(validDates);
  
  if (availableQuarters.length === 0) {
    throw new Error('No valid quarterly data found');
  }

  // Group data by quarters
  const quarterlyData = groupDataByPeriod(
    filteredData.map(item => ({ ...item, date: item.date! })),
    'quarter'
  );

  // Calculate contribution for each quarter
  const quarterlyAnalysis: { [quarterLabel: string]: ContributionItem[] } = {};
  
  availableQuarters.forEach(quarter => {
    const quarterData = quarterlyData.get(quarter.label) || [];
    if (quarterData.length > 0) {
      quarterlyAnalysis[quarter.label] = calculateContributionItems(
        quarterData
      );
    }
  });

  // Generate period comparison and trends
  const periodComparison = generatePeriodComparison(quarterlyAnalysis);
  
  // Generate insights
  const seasonalInsights = generateSeasonalInsights(quarterlyAnalysis);
  const trendInsights = generateTrendInsights(periodComparison);

  return {
    quarterlyAnalysis,
    periodComparison,
    seasonalInsights,
    trendInsights
  };
}

/**
 * Calculate contribution items for a dataset
 */
function calculateContributionItems(
  data: Array<{ category: string; value: number }>
): ContributionItem[] {
  // Group by category and sum values
  const categoryTotals = new Map<string, number>();
  
  data.forEach(item => {
    const current = categoryTotals.get(item.category) || 0;
    categoryTotals.set(item.category, current + item.value);
  });

  // Calculate total value
  const totalValue = Array.from(categoryTotals.values()).reduce((sum, val) => sum + val, 0);
  
  if (totalValue === 0) {
    return [];
  }

  // Create contribution items
  const items: ContributionItem[] = [];
  let rank = 1;

  categoryTotals.forEach((value, category) => {
    const contributionPercent = (value / totalValue) * 100;
    
    items.push({
      category,
      value,
      contributionPercent,
      contributionAmount: value,
      rank,
      percentile: getPercentile(contributionPercent),
      emoji: getContributionEmoji(contributionPercent),
      significance: getSignificance(contributionPercent)
    });
    
    rank++;
  });

  // Sort by contribution percentage (descending)
  return items.sort((a, b) => b.contributionPercent - a.contributionPercent)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

/**
 * Generate period comparison analysis
 */
function generatePeriodComparison(
  quarterlyAnalysis: { [quarterLabel: string]: ContributionItem[] }
): {
  periods: string[];
  categoryTrends: {
    category: string;
    values: number[];
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    variance: number;
  }[];
} {
  const periods = Object.keys(quarterlyAnalysis).sort();
  const allCategories = new Set<string>();
  
  // Collect all unique categories
  Object.values(quarterlyAnalysis).forEach(items => {
    items.forEach(item => allCategories.add(item.category));
  });

  // Calculate trends for each category
  const categoryTrends = Array.from(allCategories).map(category => {
    const values = periods.map(period => {
      const item = quarterlyAnalysis[period].find(item => item.category === category);
      return item?.contributionPercent || 0;
    });

    const trend = calculateTrend(values);
    const variance = calculateVariance(values);

    return {
      category,
      values,
      trend,
      variance
    };
  });

  return {
    periods,
    categoryTrends: categoryTrends.sort((a, b) => b.variance - a.variance) // Sort by volatility
  };
}

/**
 * Calculate trend direction for a series of values
 */
function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
  if (values.length < 2) return 'stable';
  
  const nonZeroValues = values.filter(v => v > 0);
  if (nonZeroValues.length < 2) return 'stable';
  
  // Calculate linear trend
  const n = values.length;
  const sumX = values.reduce((sum, _, i) => sum + i, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
  const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const variance = calculateVariance(values);
  
  // High variance = volatile
  if (variance > 50) return 'volatile';
  
  // Determine trend based on slope
  if (Math.abs(slope) < 0.1) return 'stable';
  return slope > 0 ? 'increasing' : 'decreasing';
}

/**
 * Calculate variance for a series of values
 */
function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance); // Return standard deviation
}

/**
 * Generate seasonal insights
 */
function generateSeasonalInsights(
  quarterlyAnalysis: { [quarterLabel: string]: ContributionItem[] }
): string[] {
  const insights: string[] = [];
  const periods = Object.keys(quarterlyAnalysis).sort();
  
  if (periods.length < 2) {
    insights.push('Insufficient data for seasonal analysis (need at least 2 quarters)');
    return insights;
  }

  // Identify the top contributor in each quarter
  const topContributors = periods.map(period => {
    const items = quarterlyAnalysis[period];
    return items.length > 0 ? items[0] : null;
  }).filter(item => item !== null);

  if (topContributors.length > 0) {
    const dominantCategory = findMostFrequentCategory(topContributors.map(item => item!.category));
    if (dominantCategory) {
      insights.push(`${dominantCategory} consistently dominates across quarters`);
    }
  }

  // Check for seasonal patterns
  if (periods.length >= 4) {
    const q1Pattern = analyzeQuarterPattern(quarterlyAnalysis, periods, 1);
    const q4Pattern = analyzeQuarterPattern(quarterlyAnalysis, periods, 4);
    
    if (q1Pattern) insights.push(q1Pattern);
    if (q4Pattern) insights.push(q4Pattern);
  }

  // Volatility insights
  const categories = new Set<string>();
  Object.values(quarterlyAnalysis).forEach(items => {
    items.forEach(item => categories.add(item.category));
  });

  categories.forEach(category => {
    const contributions = periods.map(period => {
      const item = quarterlyAnalysis[period].find(item => item.category === category);
      return item?.contributionPercent || 0;
    });
    
    const variance = calculateVariance(contributions);
    if (variance > 15) {
      insights.push(`${category} shows high seasonal volatility (σ=${variance.toFixed(1)}%)`);
    }
  });

  return insights;
}

/**
 * Generate trend insights
 */
function generateTrendInsights(periodComparison: {
  periods: string[];
  categoryTrends: {
    category: string;
    values: number[];
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    variance: number;
  }[];
}): string[] {
  const insights: string[] = [];
  const { categoryTrends } = periodComparison;

  // Increasing trends
  const increasing = categoryTrends.filter(trend => trend.trend === 'increasing');
  if (increasing.length > 0) {
    const strongest = increasing[0];
    insights.push(`${strongest.category} shows strongest growth trend across quarters`);
  }

  // Decreasing trends
  const decreasing = categoryTrends.filter(trend => trend.trend === 'decreasing');
  if (decreasing.length > 0) {
    const steepest = decreasing[0];
    insights.push(`${steepest.category} is declining in contribution over time`);
  }

  // Volatile categories
  const volatile = categoryTrends.filter(trend => trend.trend === 'volatile');
  if (volatile.length > 0) {
    insights.push(`${volatile.length} categories show high volatility, requiring attention`);
  }

  // Stable categories
  const stable = categoryTrends.filter(trend => trend.trend === 'stable');
  if (stable.length > 0 && stable.length > categoryTrends.length * 0.6) {
    insights.push('Most categories show stable contribution patterns');
  }

  return insights;
}

/**
 * Helper functions
 */
function getPercentile(percent: number): 'Top 25%' | 'Top 50%' | 'Top 75%' | 'Bottom 25%' {
  if (percent >= 25) return 'Top 25%';
  if (percent >= 10) return 'Top 50%';
  if (percent >= 5) return 'Top 75%';
  return 'Bottom 25%';
}

function getContributionEmoji(percent: number): string {
  if (percent >= 30) return '🏆';
  if (percent >= 15) return '🥇';
  if (percent >= 10) return '🥈';
  if (percent >= 5) return '🥉';
  return '📊';
}

function getSignificance(percent: number): 'Major' | 'Moderate' | 'Minor' | 'Negligible' {
  if (percent >= 20) return 'Major';
  if (percent >= 10) return 'Moderate';
  if (percent >= 5) return 'Minor';
  return 'Negligible';
}

function findMostFrequentCategory(categories: string[]): string | null {
  const counts = new Map<string, number>();
  categories.forEach(cat => {
    counts.set(cat, (counts.get(cat) || 0) + 1);
  });
  
  let maxCount = 0;
  let mostFrequent: string | null = null;
  
  counts.forEach((count, category) => {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = category;
    }
  });
  
  return mostFrequent;
}

function analyzeQuarterPattern(
  quarterlyAnalysis: { [quarterLabel: string]: ContributionItem[] },
  periods: string[],
  targetQuarter: number
): string | null {
  const targetPeriods = periods.filter(period => period.includes(`-Q${targetQuarter}`));
  if (targetPeriods.length < 2) return null;
  
  // Analyze patterns for this specific quarter across years
  // const quarterLabel = targetQuarter === 1 ? 'Q1' : targetQuarter === 4 ? 'Q4' : `Q${targetQuarter}`;
  
  // This could be enhanced with more sophisticated pattern detection
  return null; // Placeholder for now
}
