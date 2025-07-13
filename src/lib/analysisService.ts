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
    type: 'top-n',
    icon: '🏆',
    name: 'Top N Analysis',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Find top performing items by criteria'
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
    id: 'analysis-004',
    type: 'top-n',
    title: 'Top 5 Products by Revenue',
    createdAt: new Date('2024-01-12T14:20:00'),
    htmlOutput: `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Top N Analysis</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-yellow-50 border-l-4 border-yellow-400">
            <div class="flex items-center space-x-3">
              <span class="text-xl">🥇</span>
              <span class="font-medium">Premium Laptop Pro</span>
            </div>
            <span class="font-bold text-yellow-700">$1,234,567</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 border-l-4 border-gray-400">
            <div class="flex items-center space-x-3">
              <span class="text-xl">🥈</span>
              <span class="font-medium">Wireless Headphones Elite</span>
            </div>
            <span class="font-bold text-gray-700">$987,654</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-orange-50 border-l-4 border-orange-400">
            <div class="flex items-center space-x-3">
              <span class="text-xl">🥉</span>
              <span class="font-medium">Smart Watch Series X</span>
            </div>
            <span class="font-bold text-orange-700">$756,432</span>
          </div>
        </div>
      </div>
    `,
    metadata: {
      datasetName: 'Product_Sales_2024.csv',
      recordCount: 2341,
      processingTime: 1.9,
      columns: ['Product_Name', 'Revenue', 'Units_Sold', 'Category'],
      insights: ['Technology products dominate', 'Premium items show strong performance']
    },
    parameters: { rankBy: 'Revenue', topN: 5, groupBy: 'Product_Name' },
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
