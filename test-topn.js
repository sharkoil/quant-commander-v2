/**
 * Test TopN Analysis functionality
 */

const { processTopNAnalysis } = require('./src/lib/analyzers/topNProcessor');

// Sample test data
const sampleData = [
  { category: 'Electronics', value: 15000, date: '2024-01-01' },
  { category: 'Clothing', value: 8000, date: '2024-01-01' },
  { category: 'Books', value: 3500, date: '2024-01-01' },
  { category: 'Sports', value: 12000, date: '2024-01-01' },
  { category: 'Home', value: 6500, date: '2024-01-01' },
  { category: 'Food', value: 9000, date: '2024-01-01' },
  { category: 'Beauty', value: 4500, date: '2024-01-01' },
  { category: 'Toys', value: 2000, date: '2024-01-01' },
  { category: 'Automotive', value: 18000, date: '2024-01-01' },
  { category: 'Garden', value: 3000, date: '2024-01-01' }
];

// Test parameters
const testParams = {
  valueColumn: 'value',
  categoryColumn: 'category',
  topN: 5,
  bottomN: 3,
  timePeriod: 'month',
  analysisScope: 'all',
  showPercentages: true
};

console.log('🧪 Testing TopN Analysis...');
console.log('📊 Sample data:', sampleData);
console.log('⚙️ Parameters:', testParams);

// Run the analysis
const result = processTopNAnalysis(sampleData, testParams);

console.log('\n✅ Analysis Result:');
console.log('📈 Success:', result.success);
console.log('📊 Total Value:', result.overallStats.totalValue);
console.log('📋 Total Items:', result.overallStats.totalItems);
console.log('📊 Average Value:', result.overallStats.avgValue);

if (result.success && result.periodData.length > 0) {
  const period = result.periodData[0];
  console.log('\n🏆 Top Items:');
  period.topItems.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.name}: ${item.value.toLocaleString()} (${item.percentage.toFixed(1)}%)`);
  });
  
  console.log('\n📉 Bottom Items:');
  period.bottomItems.forEach((item, index) => {
    console.log(`  ${item.rank}. ${item.name}: ${item.value.toLocaleString()} (${item.percentage.toFixed(1)}%)`);
  });
}

console.log('\n🎯 HTML Output Preview:');
console.log(result.htmlOutput.substring(0, 500) + '...');

console.log('\n✨ TopN Analysis Test Complete!');
