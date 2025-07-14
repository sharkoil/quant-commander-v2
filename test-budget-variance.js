// Quick test of enhanced budget variance system
const { processBudgetVarianceData } = require('./src/lib/analyzers/budgetVarianceProcessor');
const { analyzeDateRange, getDateFields } = require('./src/lib/utils/csvFieldAnalyzer');
const fs = require('fs');

console.log('🧪 Testing Enhanced Budget Variance System...\n');

// Read the sample CSV data
const csvContent = fs.readFileSync('./Sample Data/oob_test.csv', 'utf8');
const lines = csvContent.split('\n').filter(line => line.trim());
const headers = lines[0].split(',');
const data = lines.slice(1).map(line => {
  const values = line.split(',');
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = values[index];
  });
  return obj;
});

console.log('📊 Sample Data Info:');
console.log(`- Total Records: ${data.length}`);
console.log(`- Columns: ${headers.join(', ')}`);
console.log(`- Date Range: ${data[0].Date} to ${data[data.length-1].Date}`);

console.log('\n🔍 Testing Date Field Detection...');
const dateFields = getDateFields(data);
console.log(`- Detected Date Fields: ${JSON.stringify(dateFields)}`);

console.log('\n📅 Testing Date Range Analysis...');
const dateAnalysis = analyzeDateRange(data, 'Date');
console.log('- Date Analysis Result:', JSON.stringify(dateAnalysis, null, 2));

console.log('\n💰 Testing Monthly Budget Variance Processing...');
try {
  const monthlyResult = processBudgetVarianceData(data, {
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
  const weeklyResult = processBudgetVarianceData(data, {
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
