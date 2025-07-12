// Budget vs Actual Variance Analyzer - Financial Performance Analysis
// Compares actual performance against budgeted/planned values for financial metrics

export interface BudgetVarianceDataPoint {
  period: string;          // Period identifier (e.g., "2024-Q1", "Jan 2024", "Week 1")
  actual: number;          // Actual performance value
  budget: number;          // Budgeted/planned value
  category?: string;       // Optional category (e.g., "Revenue", "Sales", "Marketing")
}

export interface BudgetVarianceArgs {
  data: BudgetVarianceDataPoint[];
  metricName: string;      // Name of the metric being analyzed (e.g., "Sales", "Revenue")
  analysisType: 'favorable' | 'unfavorable' | 'both'; // Type of variance analysis focus
}

export interface BudgetVarianceResult {
  period: string;
  actualValue: number;
  budgetValue: number;
  variance: number;              // Actual - Budget
  percentageVariance: number;    // (Actual - Budget) / Budget * 100
  performance: 'favorable' | 'unfavorable' | 'on-target';
  emoji: string;                 // Visual indicator
  description: string;           // Human-readable description
}

export interface BudgetVarianceAnalysis {
  metricName: string;
  analysisType: string;
  totalPeriods: number;
  results: BudgetVarianceResult[];
  summary: {
    totalActual: number;
    totalBudget: number;
    overallVariance: number;
    overallPercentageVariance: number;
    favorablePeriods: number;
    unfavorablePeriods: number;
    onTargetPeriods: number;
    averageVariance: number;
    maxFavorableVariance: number;
    maxUnfavorableVariance: number;
    performanceScore: number;    // 0-100 score based on variance performance
  };
}

/**
 * Calculate Budget vs Actual Variance Analysis
 * Compares actual performance against budgeted values across periods
 */
export function calculateBudgetVariance(args: BudgetVarianceArgs): BudgetVarianceAnalysis {
  const { data, metricName, analysisType } = args;
  
  if (!data || data.length === 0) {
    throw new Error('Data array cannot be empty for budget variance analysis');
  }

  // Validate data integrity
  for (const point of data) {
    if (typeof point.actual !== 'number' || typeof point.budget !== 'number') {
      throw new Error('Actual and budget values must be numeric');
    }
    if (point.budget === 0) {
      throw new Error('Budget values cannot be zero (would cause division by zero)');
    }
  }

  const results: BudgetVarianceResult[] = [];

  // Calculate variance for each period
  for (const dataPoint of data) {
    const variance = dataPoint.actual - dataPoint.budget;
    const percentageVariance = (variance / dataPoint.budget) * 100;
    
    // Determine performance type
    let performance: BudgetVarianceResult['performance'];
    if (Math.abs(percentageVariance) < 2) { // Within 2% considered on-target
      performance = 'on-target';
    } else if (variance > 0) {
      performance = 'favorable';   // Actual > Budget is generally favorable
    } else {
      performance = 'unfavorable'; // Actual < Budget is generally unfavorable
    }

    const emoji = getBudgetVarianceEmoji(performance, Math.abs(percentageVariance));
    const description = getBudgetVarianceDescription(performance, percentageVariance);

    results.push({
      period: dataPoint.period,
      actualValue: dataPoint.actual,
      budgetValue: dataPoint.budget,
      variance,
      percentageVariance,
      performance,
      emoji,
      description
    });
  }

  // Calculate summary statistics
  const summary = calculateBudgetVarianceSummary(results);

  return {
    metricName,
    analysisType,
    totalPeriods: data.length,
    results,
    summary
  };
}

/**
 * Get emoji indicator based on budget variance performance
 */
function getBudgetVarianceEmoji(
  performance: BudgetVarianceResult['performance'], 
  absPercentage: number
): string {
  if (performance === 'on-target') {
    return '🎯'; // On target
  }
  
  if (performance === 'favorable') {
    if (absPercentage > 20) return '🚀'; // Exceptional performance
    if (absPercentage > 10) return '🔥'; // Strong performance
    return '📈'; // Good performance
  }
  
  // Unfavorable performance
  if (absPercentage > 20) return '💥'; // Critical underperformance
  if (absPercentage > 10) return '⚠️';  // Significant underperformance
  return '📉'; // Mild underperformance
}

/**
 * Get human-readable description of budget variance
 */
function getBudgetVarianceDescription(
  performance: BudgetVarianceResult['performance'],
  percentageVariance: number
): string {
  const absPercentage = Math.abs(percentageVariance);
  
  if (performance === 'on-target') {
    return 'On Target';
  }
  
  if (performance === 'favorable') {
    if (absPercentage > 20) return 'Exceptional Performance';
    if (absPercentage > 10) return 'Strong Performance';
    return 'Good Performance';
  }
  
  // Unfavorable
  if (absPercentage > 20) return 'Critical Underperformance';
  if (absPercentage > 10) return 'Significant Underperformance';
  return 'Mild Underperformance';
}

/**
 * Calculate comprehensive summary statistics for budget variance analysis
 */
function calculateBudgetVarianceSummary(results: BudgetVarianceResult[]): BudgetVarianceAnalysis['summary'] {
  const totalActual = results.reduce((sum, r) => sum + r.actualValue, 0);
  const totalBudget = results.reduce((sum, r) => sum + r.budgetValue, 0);
  const overallVariance = totalActual - totalBudget;
  const overallPercentageVariance = (overallVariance / totalBudget) * 100;
  
  const favorablePeriods = results.filter(r => r.performance === 'favorable').length;
  const unfavorablePeriods = results.filter(r => r.performance === 'unfavorable').length;
  const onTargetPeriods = results.filter(r => r.performance === 'on-target').length;
  
  const averageVariance = results.reduce((sum, r) => sum + r.percentageVariance, 0) / results.length;
  
  const favorableVariances = results
    .filter(r => r.performance === 'favorable')
    .map(r => r.percentageVariance);
  const maxFavorableVariance = favorableVariances.length > 0 ? Math.max(...favorableVariances) : 0;
  
  const unfavorableVariances = results
    .filter(r => r.performance === 'unfavorable')
    .map(r => Math.abs(r.percentageVariance));
  const maxUnfavorableVariance = unfavorableVariances.length > 0 ? Math.max(...unfavorableVariances) : 0;
  
  // Calculate performance score (0-100)
  // Higher score = better overall performance vs budget
  const favorableWeight = favorablePeriods / results.length * 50;
  const onTargetWeight = onTargetPeriods / results.length * 40;
  const varianceQuality = Math.max(0, 100 - Math.abs(overallPercentageVariance)) * 0.1;
  const performanceScore = Math.min(100, favorableWeight + onTargetWeight + varianceQuality);

  return {
    totalActual,
    totalBudget,
    overallVariance,
    overallPercentageVariance,
    favorablePeriods,
    unfavorablePeriods,
    onTargetPeriods,
    averageVariance,
    maxFavorableVariance,
    maxUnfavorableVariance,
    performanceScore
  };
}

/**
 * Helper function to format currency values
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Helper function to format percentage values
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}
