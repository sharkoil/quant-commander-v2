// Quick test of enhanced budget variance system with sample data
import { processBudgetVarianceData } from './src/lib/analyzers/budgetVarianceProcessor.js';
import { analyzeDateRange, getDateFields } from './src/lib/utils/csvFieldAnalyzer.js';
import fs from 'fs';

console.log('🧪 Testing Enhanced Budget Variance System...\n');

// Sample data that matches user's format
const sampleData = [
  { Date: '2024-01-01', Budget: '32934', Actuals: '38861', Product: 'Coffee Machine' },
  { Date: '2024-01-03', Budget: '72733', Actuals: '60337', Product: 'Coffee Machine' },
  { Date: '2024-01-05', Budget: '169029', Actuals: '209534', Product: 'Laptop Pro' },
  { Date: '2024-01-17', Budget: '97415', Actuals: '98365', Product: 'Security System' },
  { Date: '2024-01-25', Budget: '142780', Actuals: '138427', Product: 'Gaming Headset' },
  { Date: '2024-02-01', Budget: '102268', Actuals: '89399', Product: 'Coffee Machine' },
  { Date: '2024-02-07', Budget: '110476', Actuals: '94272', Product: 'Gaming Headset' },
  { Date: '2024-02-13', Budget: '189051', Actuals: '237490', Product: 'Coffee Machine' }
];

console.log('📊 Sample Data Info:');
console.log(`- Total Records: ${sampleData.length}`);
console.log(`- Date Range: ${sampleData[0].Date} to ${sampleData[sampleData.length-1].Date}`);

console.log('\n🔍 Testing Date Field Detection...');
try {
  const dateFields = getDateFields(sampleData);
  console.log(`- Detected Date Fields: ${JSON.stringify(dateFields)}`);
} catch (error) {
  console.log(`- Date detection error: ${error.message}`);
}

console.log('\n📅 Testing Date Range Analysis...');
try {
  const dateAnalysis = analyzeDateRange(sampleData, 'Date');
  console.log('- Date Analysis Result:', JSON.stringify(dateAnalysis, null, 2));
} catch (error) {
  console.log(`- Date analysis error: ${error.message}`);
}

console.log('\n💰 Testing Monthly Budget Variance Processing...');
try {
  const monthlyResult = processBudgetVarianceData(sampleData, {
    budgetColumn: 'Budget',
    actualColumn: 'Actuals',
    dateColumn: 'Date',
    periodType: 'monthly'
  });
  
  console.log(`- Processing Result: ${monthlyResult.dataPoints.length} periods found`);
  console.log('- Summary:', JSON.stringify(monthlyResult.summary, null, 2));
  console.log('- First Period:', JSON.stringify(monthlyResult.dataPoints[0], null, 2));
  
} catch (error) {
  console.error('❌ Monthly processing error:', error.message);
}

console.log('\n📈 Testing Weekly Budget Variance Processing...');
try {
  const weeklyResult = processBudgetVarianceData(sampleData, {
    budgetColumn: 'Budget',
    actualColumn: 'Actuals',
    dateColumn: 'Date',
    periodType: 'weekly'
  });
  
  console.log(`- Processing Result: ${weeklyResult.dataPoints.length} periods found`);
  console.log('- Summary:', JSON.stringify(weeklyResult.summary, null, 2));
  console.log('- First Period:', JSON.stringify(weeklyResult.dataPoints[0], null, 2));
  
} catch (error) {
  console.error('❌ Weekly processing error:', error.message);
}

console.log('\n✅ Enhanced Budget Variance System Test Complete!');
