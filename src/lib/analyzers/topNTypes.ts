/**
 * TypeScript interfaces for Top N Analysis functionality
 * Provides type safety for Top N analysis parameters and results
 */

export interface TopNAnalysisParams {
  /** The column to analyze for Top N values */
  valueColumn: string;
  /** The column to group by for Top N analysis */
  categoryColumn: string;
  /** Number of top items to show */
  topN: number;
  /** Number of bottom items to show */
  bottomN: number;
  /** Time period for analysis */
  timePeriod: 'total' | 'year' | 'quarter' | 'month';
  /** Date column for time-based analysis */
  dateColumn?: string;
  /** Whether to show percentages */
  showPercentages: boolean;
  /** Analysis scope */
  analysisScope: 'all' | 'positive' | 'negative';
}

export interface TopNItem {
  /** Name of the category/item */
  name: string;
  /** Value for this item */
  value: number;
  /** Percentage of total */
  percentage: number;
  /** Rank position */
  rank: number;
}

export interface TopNPeriodData {
  /** Period identifier */
  period: string;
  /** Top N items for this period */
  topItems: TopNItem[];
  /** Bottom N items for this period */
  bottomItems: TopNItem[];
  /** Total value for this period */
  totalValue: number;
  /** Number of items analyzed */
  itemCount: number;
}

export interface TopNAnalysisResult {
  /** Whether the analysis was successful */
  success: boolean;
  /** HTML output for display */
  htmlOutput: string;
  /** Analysis data by period */
  periodData: TopNPeriodData[];
  /** Overall statistics */
  overallStats: {
    totalValue: number;
    totalItems: number;
    avgValue: number;
    topItem: TopNItem;
    bottomItem: TopNItem;
  };
  /** Analysis metadata */
  metadata: {
    valueColumn: string;
    categoryColumn: string;
    topN: number;
    bottomN: number;
    timePeriod: string;
    analysisScope: string;
  };
  /** Error message if analysis failed */
  errorMessage?: string;
}
