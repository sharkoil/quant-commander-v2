/**
 * Contribution Analysis Helper Functions
 * Utility functions for calculating contributions, percentiles, and statistical analysis
 */

import { 
  FlexibleContributionData, 
  ContributionItem, 
  ContributionValidation,
  HierarchicalContribution,
  ContributionAnalysisParams 
} from './contributionTypes';

/**
 * Validates that columns exist and contain appropriate data for contribution analysis
 * Performs comprehensive data quality checks
 */
export function validateContributionColumns(
  data: FlexibleContributionData[], 
  valueColumn: string, 
  categoryColumn: string
): ContributionValidation {
  // Check if columns exist
  const sampleRow = data.find(row => row[valueColumn] !== undefined && row[categoryColumn] !== undefined);
  if (!sampleRow) {
    return {
      isValid: false,
      errorMessage: `Columns '${valueColumn}' or '${categoryColumn}' not found in data`,
      dataQuality: 'Poor',
      nullCount: data.length,
      uniqueCategories: 0,
      totalValue: 0,
      sampleValues: []
    };
  }

  // Analyze value column data
  const values = data.map(row => row[valueColumn])
    .filter(val => val !== null && val !== undefined && val !== '' && !isNaN(Number(val)))
    .map(val => Number(val));
  
  const categories = data.map(row => row[categoryColumn])
    .filter(val => val !== null && val !== undefined && val !== '');

  const nullCount = data.length - values.length;
  const uniqueCategories = new Set(categories).size;
  const totalValue = values.reduce((sum, val) => sum + val, 0);
  
  // Data quality assessment
  const completenessRatio = values.length / data.length;
  let dataQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  
  if (completenessRatio >= 0.95 && uniqueCategories >= 3) {
    dataQuality = 'Excellent';
  } else if (completenessRatio >= 0.85 && uniqueCategories >= 2) {
    dataQuality = 'Good';
  } else if (completenessRatio >= 0.7 && uniqueCategories >= 2) {
    dataQuality = 'Fair';
  } else {
    dataQuality = 'Poor';
  }

  return {
    isValid: values.length > 0 && uniqueCategories > 0,
    dataQuality,
    nullCount,
    uniqueCategories,
    totalValue,
    sampleValues: values.slice(0, 5)
  };
}

/**
 * Calculate contribution percentages and rankings for each category
 */
export function calculateContributions(
  data: FlexibleContributionData[],
  valueColumn: string,
  categoryColumn: string,
  params: ContributionAnalysisParams
): ContributionItem[] {
  // Group data by category and calculate totals
  const categoryTotals = new Map<string, number>();
  
  data.forEach(row => {
    const category = String(row[categoryColumn] || 'Unknown');
    const value = Number(row[valueColumn] || 0);
    
    if (!isNaN(value)) {
      const currentTotal = categoryTotals.get(category) || 0;
      categoryTotals.set(category, currentTotal + value);
    }
  });

  const totalValue = Array.from(categoryTotals.values()).reduce((sum, val) => sum + val, 0);
  
  // Convert to contribution items
  const contributions: ContributionItem[] = Array.from(categoryTotals.entries()).map(([category, value]) => {
    const contributionPercent = totalValue > 0 ? (value / totalValue) * 100 : 0;
    
    return {
      category,
      value,
      contributionPercent,
      contributionAmount: value,
      rank: 0, // Will be set after sorting
      percentile: 'Bottom 25%' as const,
      emoji: '', // Will be set based on contribution level
      significance: 'Negligible' as const // Will be calculated
    };
  });

  // Sort contributions
  contributions.sort((a, b) => {
    switch (params.sortBy) {
      case 'value':
        return params.sortOrder === 'desc' ? b.value - a.value : a.value - b.value;
      case 'alphabetical':
        return params.sortOrder === 'desc' 
          ? b.category.localeCompare(a.category)
          : a.category.localeCompare(b.category);
      case 'contribution':
      default:
        return params.sortOrder === 'desc' 
          ? b.contributionPercent - a.contributionPercent 
          : a.contributionPercent - b.contributionPercent;
    }
  });

  // Assign ranks and percentiles
  contributions.forEach((item, index) => {
    item.rank = index + 1;
    
    // Assign percentiles based on rank
    const percentileThreshold = contributions.length * 0.25;
    if (index < percentileThreshold) {
      item.percentile = 'Top 25%';
    } else if (index < percentileThreshold * 2) {
      item.percentile = 'Top 50%';
    } else if (index < percentileThreshold * 3) {
      item.percentile = 'Top 75%';
    } else {
      item.percentile = 'Bottom 25%';
    }

    // Assign significance and emoji based on contribution percentage
    if (item.contributionPercent >= 20) {
      item.significance = 'Major';
      item.emoji = '🎯'; // Major contributor
    } else if (item.contributionPercent >= 10) {
      item.significance = 'Moderate';
      item.emoji = '📊'; // Moderate contributor
    } else if (item.contributionPercent >= 5) {
      item.significance = 'Minor';
      item.emoji = '📈'; // Minor contributor
    } else {
      item.significance = 'Negligible';
      item.emoji = '📉'; // Negligible contributor
    }
  });

  // Filter by minimum contribution if specified
  const minimumContribution = params.minimumContribution || 1;
  return contributions.filter(item => item.contributionPercent >= minimumContribution);
}

/**
 * Calculate hierarchical contributions (category -> subcategory breakdown)
 */
export function calculateHierarchicalContributions(
  data: FlexibleContributionData[],
  valueColumn: string,
  categoryColumn: string,
  subcategoryColumn: string
): HierarchicalContribution[] {
  // Group by category, then by subcategory
  const hierarchicalData = new Map<string, Map<string, number>>();
  
  data.forEach(row => {
    const category = String(row[categoryColumn] || 'Unknown');
    const subcategory = String(row[subcategoryColumn] || 'Other');
    const value = Number(row[valueColumn] || 0);
    
    if (!isNaN(value)) {
      if (!hierarchicalData.has(category)) {
        hierarchicalData.set(category, new Map());
      }
      
      const subcategoryMap = hierarchicalData.get(category)!;
      const currentValue = subcategoryMap.get(subcategory) || 0;
      subcategoryMap.set(subcategory, currentValue + value);
    }
  });

  const totalValue = Array.from(hierarchicalData.values())
    .flatMap(subMap => Array.from(subMap.values()))
    .reduce((sum, val) => sum + val, 0);

  const result: HierarchicalContribution[] = [];

  hierarchicalData.forEach((subcategoryMap, category) => {
    const categoryTotal = Array.from(subcategoryMap.values()).reduce((sum, val) => sum + val, 0);
    const categoryContribution = totalValue > 0 ? (categoryTotal / totalValue) * 100 : 0;

    const subcategories: ContributionItem[] = Array.from(subcategoryMap.entries()).map(([subcategory, value]) => {
      const contributionPercent = totalValue > 0 ? (value / totalValue) * 100 : 0;
      
      return {
        category: subcategory,
        value,
        contributionPercent,
        contributionAmount: value,
        rank: 0,
        percentile: 'Bottom 25%' as const,
        emoji: contributionPercent >= 10 ? '🎯' : contributionPercent >= 5 ? '📊' : '📈',
        significance: contributionPercent >= 10 ? 'Major' : contributionPercent >= 5 ? 'Moderate' : 'Minor'
      };
    });

    // Sort subcategories by contribution
    subcategories.sort((a, b) => b.contributionPercent - a.contributionPercent);
    subcategories.forEach((item, index) => item.rank = index + 1);

    result.push({
      category,
      totalValue: categoryTotal,
      totalContribution: categoryContribution,
      subcategories,
      emoji: categoryContribution >= 20 ? '🏆' : categoryContribution >= 10 ? '🥈' : '🥉'
    });
  });

  // Sort categories by total contribution
  result.sort((a, b) => b.totalContribution - a.totalContribution);

  return result;
}

/**
 * Calculate concentration ratio (top N categories' combined contribution)
 */
export function calculateConcentrationRatio(contributions: ContributionItem[], topN: number = 3): number {
  const topNContributions = contributions
    .slice(0, topN)
    .reduce((sum, item) => sum + item.contributionPercent, 0);
  
  return Math.min(topNContributions, 100);
}

/**
 * Calculate Simpson's Diversity Index for contribution distribution
 */
export function calculateDiversityIndex(contributions: ContributionItem[]): number {
  const totalValue = contributions.reduce((sum, item) => sum + item.value, 0);
  
  if (totalValue === 0) return 0;
  
  const sumOfSquaredProportions = contributions.reduce((sum, item) => {
    const proportion = item.value / totalValue;
    return sum + (proportion * proportion);
  }, 0);
  
  // Simpson's Diversity Index: 1 - sum of squared proportions
  // Higher values indicate more diversity (more even distribution)
  return Math.max(0, 1 - sumOfSquaredProportions);
}

/**
 * Format numbers for display with appropriate units
 */
export function formatContributionValue(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(0)}`;
  }
}

/**
 * Generate period-based contribution analysis
 */
export function filterDataByPeriod(
  data: FlexibleContributionData[],
  periodColumn: string,
  periodFilter: string
): FlexibleContributionData[] {
  return data.filter(row => {
    const periodValue = row[periodColumn];
    if (!periodValue) return false;
    
    const periodStr = String(periodValue).toLowerCase();
    const filterStr = periodFilter.toLowerCase();
    
    return periodStr.includes(filterStr);
  });
}
