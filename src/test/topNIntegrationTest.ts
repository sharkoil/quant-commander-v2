// Quick test to verify TopN analysis integration
import { processTopNAnalysis } from '../lib/analyzers/topNProcessor';
import { TopNAnalysisParams } from '../lib/analyzers/topNTypes';

// Test data
const testData = [
  { product: 'Product A', category: 'Electronics', revenue: 1000, date: '2024-01-01' },
  { product: 'Product B', category: 'Electronics', revenue: 800, date: '2024-01-02' },
  { product: 'Product C', category: 'Home', revenue: 600, date: '2024-01-03' },
  { product: 'Product D', category: 'Home', revenue: 400, date: '2024-01-04' },
  { product: 'Product E', category: 'Sports', revenue: 200, date: '2024-01-05' }
];

// Test parameters
const params: TopNAnalysisParams = {
  valueColumn: 'revenue',
  categoryColumn: 'product',
  topN: 3,
  bottomN: 2,
  timePeriod: 'total',
  analysisScope: 'all',
  showPercentages: true
};

// Run test
console.log('Testing TopN Analysis...');
const result = processTopNAnalysis(testData, params);

if (result.success) {
  console.log('✅ TopN Analysis test passed!');
  console.log('📊 Result:', {
    totalValue: result.overallStats.totalValue,
    totalItems: result.overallStats.totalItems,
    topItem: result.overallStats.topItem.name,
    bottomItem: result.overallStats.bottomItem.name
  });
} else {
  console.log('❌ TopN Analysis test failed:', result.errorMessage);
}
