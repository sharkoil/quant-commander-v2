/**
 * Service for managing analysis results and mock data
 * Provides functions for retrieving, filtering, and organizing analysis data
 */

import { 
  AnalysisResult, 
  AnalysisType, 
  DraggableAnalysisItem, 
  AnalysisFilters,
  AnalysisTypeConfig 
} from '../types/analysis';

// Analysis type configurations for UI display
export const ANALYSIS_TYPES: AnalysisTypeConfig[] = [
  {
    type: 'period-variance',
    icon: '📊',
    name: 'Period Variance',
    color: 'bg-blue-100 text-blue-800',
    description: 'Compare data across different time periods'
  },
  {
    type: 'budget-variance',
    icon: '💰',
    name: 'Budget Variance',
    color: 'bg-green-100 text-green-800',
    description: 'Track actual vs budgeted performance'
  },
  {
    type: 'trend-analysis',
    icon: '📈',
    name: 'Trend Analysis',
    color: 'bg-purple-100 text-purple-800',
    description: 'Identify patterns and trends over time'
  },
  {
    type: 'contribution',
    icon: '🥧',
    name: 'Contribution Analysis',
    color: 'bg-red-100 text-red-800',
    description: 'Analyze how items contribute to totals'
  },
  {
    type: 'column-intelligence',
    icon: '🔍',
    name: 'Column Intelligence',
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Smart insights about data columns'
  },
  {
    type: 'outlier-detection',
    icon: '🚨',
    name: 'Outlier Detection',
    color: 'bg-orange-100 text-orange-800',
    description: 'Identify statistical anomalies and data outliers'
  },
  {
    type: 'top-n',
    icon: '🏆',
    name: 'Top N Analysis',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Analyze highest and lowest performing items'
  }
];

// Mock analysis results for testing and development
const MOCK_ANALYSIS_RESULTS: AnalysisResult[] = [
  {
    id: 'analysis-001',
    type: 'period-variance',
    title: 'Q1 vs Q2 Sales Performance',
    createdAt: new Date('2024-01-15T10:30:00'),
    htmlOutput: `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Period Variance Analysis</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-green-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600">Q1 Total Sales</p>
            <p class="text-2xl font-bold text-green-700">$245,320</p>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600">Q2 Total Sales</p>
            <p class="text-2xl font-bold text-blue-700">$287,650</p>
          </div>
        </div>
        <div class="bg-yellow-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600">Variance</p>
          <p class="text-xl font-bold text-yellow-700">+17.3% increase</p>
        </div>
      </div>
    `,
    metadata: {
      datasetName: 'Sales_Q1Q2_2024.csv',
      recordCount: 1547,
      processingTime: 2.3,
      columns: ['Date', 'Product', 'Sales_Amount', 'Region'],
      insights: ['Significant growth in Q2', 'Technology products leading increase']
    },
    parameters: { period1: 'Q1', period2: 'Q2', metric: 'Sales_Amount' },
    status: 'completed'
  },
  {
    id: 'analysis-002',
    type: 'budget-variance',
    title: 'Marketing Budget vs Actual Spend',
    createdAt: new Date('2024-01-14T15:45:00'),
    htmlOutput: `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Budget Variance Analysis</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center p-3 bg-red-50 rounded">
            <span class="font-medium">Digital Advertising</span>
            <span class="text-red-600 font-bold">-15.2% over budget</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-green-50 rounded">
            <span class="font-medium">Content Marketing</span>
            <span class="text-green-600 font-bold">+8.7% under budget</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-yellow-50 rounded">
            <span class="font-medium">Events & Trade Shows</span>
            <span class="text-yellow-600 font-bold">-2.1% over budget</span>
          </div>
        </div>
      </div>
    `,
    metadata: {
      datasetName: 'Marketing_Budget_2024.csv',
      recordCount: 234,
      processingTime: 1.8,
      columns: ['Category', 'Budget', 'Actual', 'Month'],
      insights: ['Digital advertising needs cost control', 'Content marketing performing efficiently']
    },
    parameters: { budgetColumn: 'Budget', actualColumn: 'Actual', categoryColumn: 'Category' },
    status: 'completed'
  },
  {
    id: 'analysis-003',
    type: 'trend-analysis',
    title: 'Customer Acquisition Trends',
    createdAt: new Date('2024-01-13T09:15:00'),
    htmlOutput: `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Trend Analysis</h3>
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600 mb-2">Overall Trend</p>
          <p class="text-xl font-bold text-purple-700">📈 Positive Growth</p>
          <p class="text-sm text-gray-600 mt-2">23% increase over 6 months</p>
        </div>
        <div class="grid grid-cols-3 gap-2 text-sm">
          <div class="text-center p-2 bg-green-100 rounded">
            <div class="font-bold text-green-700">Jan</div>
            <div class="text-green-600">+12%</div>
          </div>
          <div class="text-center p-2 bg-blue-100 rounded">
            <div class="font-bold text-blue-700">Feb</div>
            <div class="text-blue-600">+8%</div>
          </div>
          <div class="text-center p-2 bg-purple-100 rounded">
            <div class="font-bold text-purple-700">Mar</div>
            <div class="text-purple-600">+15%</div>
          </div>
        </div>
      </div>
    `,
    metadata: {
      datasetName: 'Customer_Acquisition.csv',
      recordCount: 892,
      processingTime: 3.1,
      columns: ['Date', 'New_Customers', 'Source', 'Cost'],
      insights: ['Strong growth trajectory', 'Social media driving acquisition']
    },
    parameters: { dateColumn: 'Date', valueColumn: 'New_Customers', timeframe: '6_months' },
    status: 'completed'
  },
  {
    id: 'analysis-005',
    type: 'contribution',
    title: 'Revenue Contribution by Region',
    createdAt: new Date('2024-01-11T11:30:00'),
    htmlOutput: `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Contribution Analysis</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-blue-50 rounded">
            <span class="font-medium">North America</span>
            <div class="text-right">
              <div class="font-bold text-blue-700">45.2%</div>
              <div class="text-sm text-gray-600">$2,345,678</div>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-green-50 rounded">
            <span class="font-medium">Europe</span>
            <div class="text-right">
              <div class="font-bold text-green-700">32.1%</div>
              <div class="text-sm text-gray-600">$1,666,543</div>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-yellow-50 rounded">
            <span class="font-medium">Asia Pacific</span>
            <div class="text-right">
              <div class="font-bold text-yellow-700">22.7%</div>
              <div class="text-sm text-gray-600">$1,178,901</div>
            </div>
          </div>
        </div>
      </div>
    `,
    metadata: {
      datasetName: 'Regional_Sales_2024.csv',
      recordCount: 1876,
      processingTime: 2.7,
      columns: ['Region', 'Revenue', 'Customer_Count', 'Product_Mix'],
      insights: ['North America leads revenue', 'Balanced regional distribution']
    },
    parameters: { valueColumn: 'Revenue', categoryColumn: 'Region', showPercentages: true },
    status: 'completed'
  },
  {
    id: 'analysis-006',
    type: 'column-intelligence',
    title: 'Data Quality Assessment',
    createdAt: new Date('2024-01-10T16:45:00'),
    htmlOutput: `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Column Intelligence</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <h4 class="font-medium text-gray-700">Data Quality Score</h4>
            <div class="bg-green-100 p-3 rounded-lg">
              <div class="text-2xl font-bold text-green-700">94.3%</div>
              <div class="text-sm text-green-600">Excellent</div>
            </div>
          </div>
          <div class="space-y-2">
            <h4 class="font-medium text-gray-700">Completeness</h4>
            <div class="bg-blue-100 p-3 rounded-lg">
              <div class="text-2xl font-bold text-blue-700">98.7%</div>
              <div class="text-sm text-blue-600">Very High</div>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <h4 class="font-medium text-gray-700">Key Insights</h4>
          <ul class="space-y-1 text-sm">
            <li class="flex items-center space-x-2">
              <span class="text-green-500">✓</span>
              <span>All required fields populated</span>
            </li>
            <li class="flex items-center space-x-2">
              <span class="text-yellow-500">⚠</span>
              <span>Some date formats inconsistent</span>
            </li>
            <li class="flex items-center space-x-2">
              <span class="text-green-500">✓</span>
              <span>No duplicate records found</span>
            </li>
          </ul>
        </div>
      </div>
    `,
    metadata: {
      datasetName: 'Customer_Database.csv',
      recordCount: 5420,
      processingTime: 4.2,
      columns: ['ID', 'Name', 'Email', 'Registration_Date', 'Status', 'Revenue'],
      insights: ['High data quality overall', 'Minor date format inconsistencies', 'Clean dataset ready for analysis']
    },
    parameters: { checkCompleteness: true, validateFormats: true, findDuplicates: true },
    status: 'completed'
  },
  {
    id: 'analysis-007',
    type: 'outlier-detection',
    title: 'Sales Data Outlier Analysis',
    createdAt: new Date('2024-01-20T14:45:00'),
    htmlOutput: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; color: white;">
          <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">🔍 Outlier Detection Analysis</h2>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">IQR & Z-Score Method • Variance Analysis</p>
        </div>

        <!-- Summary Statistics Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
          
          <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 14px; color: #6b7280; font-weight: 500; margin-bottom: 8px;">Risk Level</div>
            <div style="font-size: 24px; font-weight: 700; color: #d97706;">MEDIUM</div>
          </div>

          <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 14px; color: #6b7280; font-weight: 500; margin-bottom: 8px;">Total Outliers</div>
            <div style="font-size: 24px; font-weight: 700; color: #1f2937;">7</div>
          </div>

          <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 14px; color: #6b7280; font-weight: 500; margin-bottom: 8px;">Upper Outliers</div>
            <div style="font-size: 24px; font-weight: 700; color: #dc2626;">📈 4</div>
          </div>

          <div style="background: #eff6ff; border: 2px solid #93c5fd; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 14px; color: #6b7280; font-weight: 500; margin-bottom: 8px;">Lower Outliers</div>
            <div style="font-size: 24px; font-weight: 700; color: #2563eb;">📉 3</div>
          </div>

        </div>

        <!-- Detected Outliers -->
        <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1f2937;">🚨 Detected Outliers</h3>
          <div style="display: grid; gap: 12px;">
            
            <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">🚨 2024-01-15: extremely above normal variance</div>
                <div style="font-size: 14px; color: #6b7280;">Value: 25.5K • Deviation: 15.8K • Severity: extreme • Z-Score: 3.2</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 20px; font-weight: 700; color: #dc2626;">25,500</div>
              </div>
            </div>

            <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">💥 2024-01-22: extremely below normal variance</div>
                <div style="font-size: 14px; color: #6b7280;">Value: -8.2K • Deviation: 12.3K • Severity: extreme • Z-Score: -2.9</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 20px; font-weight: 700; color: #2563eb;">-8,200</div>
              </div>
            </div>

            <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">⚠️ 2024-01-28: significantly above normal variance</div>
                <div style="font-size: 14px; color: #6b7280;">Value: 18.7K • Deviation: 8.9K • Severity: moderate • Z-Score: 2.4</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 20px; font-weight: 700; color: #dc2626;">18,700</div>
              </div>
            </div>

          </div>
        </div>

        <!-- Assessment Summary -->
        <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937;">🎯 Assessment Summary</h3>
          <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #4b5563;">
            <strong>Moderate outlier presence suggests data quality issues requiring attention</strong>
          </p>
          <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Mild Outliers</div>
              <div style="font-size: 18px; font-weight: 600; color: #f59e0b;">📈 2</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Moderate Outliers</div>
              <div style="font-size: 18px; font-weight: 600; color: #dc2626;">⚠️ 3</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Extreme Outliers</div>
              <div style="font-size: 18px; font-weight: 600; color: #7f1d1d;">🚨 2</div>
            </div>
          </div>
        </div>

      </div>
    `,
    metadata: {
      datasetName: 'Sales_Monthly_Data.csv',
      recordCount: 120,
      processingTime: 1.8,
      columns: ['date', 'actual_sales', 'budget_sales', 'region'],
      insights: [
        '7 outliers detected (5.8% of data points)',
        '2 extreme outliers require immediate investigation',
        'Variance analysis reveals budget planning issues',
        'January 2024 shows highest volatility'
      ]
    },
    parameters: { 
      method: 'both', 
      analysisTarget: 'variance', 
      threshold: 2, 
      iqrMultiplier: 1.5,
      dateColumn: 'date',
      actualColumn: 'actual_sales',
      budgetColumn: 'budget_sales'
    },
    status: 'completed'
  }
];

/**
 * Get all analysis type configurations
 */
export function getAnalysisTypes(): AnalysisTypeConfig[] {
  return ANALYSIS_TYPES;
}

/**
 * Get analysis type configuration by type
 */
export function getAnalysisTypeConfig(type: AnalysisType): AnalysisTypeConfig | undefined {
  return ANALYSIS_TYPES.find(config => config.type === type);
}

/**
 * Get all mock analysis results
 */
export function getMockAnalysisResults(): AnalysisResult[] {
  return MOCK_ANALYSIS_RESULTS;
}

/**
 * Get analysis results as draggable items
 */
export function getAnalysisResultsAsDraggableItems(): DraggableAnalysisItem[] {
  return MOCK_ANALYSIS_RESULTS.map((result, index) => ({
    id: result.id,
    order: index,
    isPinned: index < 2, // First two items are pinned by default
    result
  }));
}

/**
 * Filter analysis results based on criteria
 */
export function filterAnalysisResults(
  results: AnalysisResult[], 
  filters: AnalysisFilters
): AnalysisResult[] {
  let filtered = results;

  // Filter by type
  if (filters.type) {
    filtered = filtered.filter(result => result.type === filters.type);
  }

  // Filter by search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(result => 
      result.title.toLowerCase().includes(query) ||
      result.metadata.datasetName.toLowerCase().includes(query) ||
      result.metadata.insights.some(insight => insight.toLowerCase().includes(query))
    );
  }

  // Filter by date range
  if (filters.dateRange) {
    filtered = filtered.filter(result => 
      result.createdAt >= filters.dateRange!.start &&
      result.createdAt <= filters.dateRange!.end
    );
  }

  return filtered;
}

/**
 * Sort analysis results by different criteria
 */
export function sortAnalysisResults(
  results: AnalysisResult[], 
  sortBy: 'date' | 'title' | 'type' = 'date'
): AnalysisResult[] {
  const sorted = [...results];
  
  switch (sortBy) {
    case 'date':
      return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'type':
      return sorted.sort((a, b) => a.type.localeCompare(b.type));
    default:
      return sorted;
  }
}

/**
 * Global analysis results store for real-time analysis management
 */
let globalAnalysisResults: DraggableAnalysisItem[] = [];
let analysisUpdateCallback: ((items: DraggableAnalysisItem[]) => void) | null = null;

/**
 * Register a callback to be notified when analysis results change
 */
export function registerAnalysisUpdateCallback(callback: (items: DraggableAnalysisItem[]) => void) {
  analysisUpdateCallback = callback;
}

/**
 * Add a new analysis result to the global store
 */
export function addAnalysisResult(result: AnalysisResult): void {
  console.log('🔥 addAnalysisResult called with:', result);
  console.log('📦 Current globalAnalysisResults before adding:', globalAnalysisResults);
  
  const newItem: DraggableAnalysisItem = {
    id: result.id,
    order: globalAnalysisResults.length,
    isPinned: false,
    result
  };
  
  globalAnalysisResults = [newItem, ...globalAnalysisResults];
  console.log('📦 Global analysis results updated:', globalAnalysisResults);
  console.log('🔢 Total items now:', globalAnalysisResults.length);
  
  // Notify subscribers of the update
  if (analysisUpdateCallback) {
    console.log('📡 Calling update callback with:', globalAnalysisResults);
    analysisUpdateCallback(globalAnalysisResults);
    console.log('✅ Update callback completed');
  } else {
    console.warn('⚠️ No update callback registered!');
  }
}

/**
 * Get current global analysis results (real results only)
 */
export function getCurrentAnalysisResults(): DraggableAnalysisItem[] {
  // Return only real analysis results - no mock data
  return globalAnalysisResults;
}

/**
 * Clear all global analysis results
 */
export function clearGlobalAnalysisResults(): void {
  globalAnalysisResults = [];
  if (analysisUpdateCallback) {
    analysisUpdateCallback([]);
  }
}

/**
 * Check if we're using real analysis results or mock data
 */
export function isUsingRealAnalysis(): boolean {
  return globalAnalysisResults.length > 0;
}

/**
 * Get only real analysis results (no mock data)
 */
export function getRealAnalysisResults(): DraggableAnalysisItem[] {
  return globalAnalysisResults;
}

/**
 * Get only mock analysis results as draggable items
 */
export function getMockAnalysisResultsAsDraggableItems(): DraggableAnalysisItem[] {
  return getAnalysisResultsAsDraggableItems();
}

/**
 * Initialize clean state - clear any existing results on app start
 */
export function initializeAnalysisService(): void {
  globalAnalysisResults = [];
}
