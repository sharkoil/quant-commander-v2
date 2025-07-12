/**
 * TypeScript interfaces and types for Contribution Analysis
 * Provides comprehensive type definitions for contribution calculations and hierarchical breakdowns
 */

export interface ContributionAnalysisParams {
  valueColumn: string;
  categoryColumn: string;
  subcategoryColumn?: string; // For hierarchical breakdown
  analysisScope: 'total' | 'average' | 'period';
  periodColumn?: string; // For period-based contribution
  periodFilter?: string; // Specific period to analyze
  minimumContribution?: number; // Minimum % to be included (default: 1%)
  showOthers?: boolean; // Group small contributions as "Others"
  sortBy: 'contribution' | 'value' | 'alphabetical';
  sortOrder: 'desc' | 'asc';
  includePercentiles?: boolean; // Include quartile analysis
  
  // NEW: Quarterly and monthly analysis support
  timePeriodAnalysis?: {
    enabled: boolean;
    periodType: 'quarter' | 'month' | 'all';
    compareAcrossPeriods?: boolean; // Compare quarters or months side-by-side
    specificPeriod?: string; // e.g., "2024-Q1" or "2024-Jan"
    dateColumn: string; // Required when time period analysis is enabled
  };
}

export interface ContributionItem {
  category: string;
  subcategory?: string;
  value: number;
  contributionPercent: number;
  contributionAmount: number;
  rank: number;
  percentile: 'Top 25%' | 'Top 50%' | 'Top 75%' | 'Bottom 25%';
  emoji: string;
  significance: 'Major' | 'Moderate' | 'Minor' | 'Negligible';
}

export interface HierarchicalContribution {
  category: string;
  totalValue: number;
  totalContribution: number;
  subcategories: ContributionItem[];
  emoji: string;
}

export interface ContributionAnalysisResult {
  success: boolean;
  analysis: ContributionItem[];
  hierarchical?: HierarchicalContribution[];
  
  // NEW: Quarterly comparison results
  quarterlyAnalysis?: {
    [quarterLabel: string]: ContributionItem[];
  };
  monthlyAnalysis?: {
    [monthLabel: string]: ContributionItem[];
  };
  periodComparison?: {
    periods: string[];
    categoryTrends: {
      category: string;
      values: number[];
      trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
      variance: number;
    }[];
  };
  
  metadata: {
    totalValue: number;
    totalCategories: number;
    topContributor: string;
    topContribution: number;
    concentrationRatio: number; // Top 3 categories' combined %
    diversityIndex: number; // Simpson's diversity index
    analysisScope: string;
    periodAnalyzed?: string;
    dataQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    
    // NEW: Time period metadata
    timePeriodAnalysis?: {
      periodType: 'quarter' | 'month' | 'all';
      periodsAnalyzed: string[];
      dateRange: { start: Date; end: Date };
    };
  };
  insights: {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    concentrationLevel: 'High' | 'Medium' | 'Low';
    diversityLevel: 'High' | 'Medium' | 'Low';
    
    // NEW: Seasonal insights
    seasonalInsights?: string[];
    trendInsights?: string[];
  };
  htmlOutput: string;
  errorMessage?: string;
}

export interface FlexibleContributionData {
  [key: string]: string | number | Date | null | undefined;
}

export interface ContributionValidation {
  isValid: boolean;
  errorMessage?: string;
  dataQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  nullCount: number;
  uniqueCategories: number;
  totalValue: number;
  sampleValues: (string | number)[];
}
