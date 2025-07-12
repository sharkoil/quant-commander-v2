// Top N Analysis - TypeScript Interfaces and Types
// Defines data structures for ranking and categorization analysis

/**
 * Parameters for configuring Top N/Bottom N analysis
 * These mirror the TopNModal interface for consistency
 */
export interface TopNAnalysisParams {
  n: number;                                    // Number of top/bottom items to return
  analysisScope: 'total' | 'period' | 'growth'; // Type of analysis to perform
  valueColumn: string;                          // Column to rank by (must be numeric)
  categoryColumn?: string;                      // Optional grouping column (defaults to row-level analysis)
  dateColumn?: string;                          // Required for period/growth analysis
  periodAggregation?: 'week' | 'month' | 'quarter' | 'year'; // How to group time periods
  direction: 'top' | 'bottom' | 'both';        // Which rankings to return
}

/**
 * Flexible input data structure - raw CSV row data
 * Allows any column names and data types for maximum compatibility
 */
export interface FlexibleTopNData {
  [key: string]: string | number | Date; // Raw CSV row data with any column names
}

/**
 * Individual ranking item result
 * Contains all information about a ranked category/entity
 */
export interface RankingItem {
  category: string;                    // The entity being ranked (region, product, etc.)
  value: number;                       // The ranking value (sales, revenue, etc.)
  rank: number;                        // Position in the ranking (1, 2, 3...)
  percentageOfTotal: number;           // Percentage contribution to total
  periodBreakdown?: PeriodData[];      // Time series data if period analysis
  growthRate?: number;                 // Growth percentage if growth analysis
  recordCount: number;                 // Number of records contributing to this ranking
  averageValue?: number;               // Average value if multiple records
}

/**
 * Time period data point for trend analysis
 * Used in period breakdown within ranking items
 */
export interface PeriodData {
  period: string;                      // Period identifier (2024-Q1, Jan-2024, etc.)
  value: number;                       // Value for this period
  recordCount: number;                 // Number of records in this period
  periodStart: Date;                   // Start date of period (for sorting)
}

/**
 * Aggregated data structure for period-based analysis
 * Intermediate format after grouping by periods and categories
 */
export interface AggregatedData {
  period: string;                      // Period identifier
  category: string;                    // Category/entity name
  totalValue: number;                  // Sum of values in this period/category
  recordCount: number;                 // Count of records
  averageValue: number;                // Average value per record
  periodStart: Date;                   // Period start date for sorting
}

/**
 * Analysis metadata and summary statistics
 * Provides context and insights about the overall analysis
 */
export interface AnalysisMetadata {
  totalCategories: number;             // Number of unique categories analyzed
  totalRecords: number;                // Total data records processed
  dateRange: {                         // Date range of the dataset
    start: Date;
    end: Date;
  };
  analysisType: string;                // Human-readable description of analysis
  topPerformerValue: number;           // Highest value found
  bottomPerformerValue: number;        // Lowest value found
  totalSum: number;                    // Sum of all values
  averageValue: number;                // Overall average value
  valueDistribution: {                 // Statistical distribution info
    median: number;
    standardDeviation: number;
    variance: number;
  };
}

/**
 * Main result structure returned by Top N analysis
 * Contains rankings, metadata, and formatted HTML output
 */
export interface TopNResult {
  topResults: RankingItem[];           // Top N performers
  bottomResults: RankingItem[];        // Bottom N performers  
  metadata: AnalysisMetadata;          // Analysis summary and statistics
  htmlOutput: string;                  // Formatted HTML display
  insights: string[];                  // Key findings and recommendations
}

/**
 * Period grouping configuration
 * Defines how dates are aggregated into periods
 */
export interface PeriodGroupingConfig {
  aggregationType: 'week' | 'month' | 'quarter' | 'year';
  dateFormat: string;                  // Output format for period labels
  sortOrder: 'asc' | 'desc';          // Chronological sorting direction
}

/**
 * Column validation result
 * Used to ensure data quality before analysis
 */
export interface ColumnValidation {
  isValid: boolean;                    // Whether column exists and has valid data
  errorMessage?: string;               // Error description if invalid
  dataType: 'numeric' | 'text' | 'date' | 'mixed'; // Detected data type
  nullCount: number;                   // Number of null/empty values
  uniqueValues: number;                // Count of unique values
  sampleValues: (string | number)[];   // Sample data for validation
}

/**
 * Default analysis suggestions
 * Used for out-of-the-box analysis when CSV is loaded
 */
export interface DefaultAnalysisSuggestion {
  analysisName: string;                // Human-readable name
  params: TopNAnalysisParams;          // Pre-configured parameters
  confidence: number;                  // Confidence in this suggestion (0-100)
  reasoning: string;                   // Why this analysis is suggested
}
