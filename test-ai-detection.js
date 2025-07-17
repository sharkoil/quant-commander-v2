/**
 * Test file for AI Column Detection
 * Verifies that the AI-driven column detection works correctly
 */

const { detectColumnsWithAI, convertToGlobalSettings } = require('./src/lib/utils/aiColumnDetector');

// Test data samples
const sampleData1 = [
  { Date: '2024-01-01', Product: 'Widget A', Revenue: 1000, Budget: 900, Region: 'North' },
  { Date: '2024-01-02', Product: 'Widget B', Revenue: 1200, Budget: 1100, Region: 'South' },
  { Date: '2024-01-03', Product: 'Widget C', Revenue: 800, Budget: 950, Region: 'East' }
];

const sampleData2 = [
  { transaction_date: '2024-01-01', item_name: 'Laptop', sales_amount: 1500, forecast_amount: 1400, category: 'Electronics' },
  { transaction_date: '2024-01-02', item_name: 'Mouse', sales_amount: 25, forecast_amount: 30, category: 'Accessories' },
  { transaction_date: '2024-01-03', item_name: 'Keyboard', sales_amount: 75, forecast_amount: 80, category: 'Accessories' }
];

const sampleData3 = [
  { period: '2024-Q1', department: 'Marketing', actual_spend: 50000, planned_spend: 48000, cost_center: 'CC001' },
  { period: '2024-Q2', department: 'Sales', actual_spend: 75000, planned_spend: 70000, cost_center: 'CC002' },
  { period: '2024-Q3', department: 'Engineering', actual_spend: 120000, planned_spend: 115000, cost_center: 'CC003' }
];

function testAIDetection() {
  console.log('🧪 Testing AI Column Detection...\n');

  // Test 1: Standard business data
  console.log('Test 1: Standard business data');
  try {
    const detection1 = detectColumnsWithAI(sampleData1);
    console.log('✅ Detection results:', detection1);
    console.log('Overall confidence:', detection1.confidence);
    console.log('Primary value:', detection1.primaryValue.column, `(${detection1.primaryValue.confidence}%)`);
    console.log('Secondary value:', detection1.secondaryValue?.column, `(${detection1.secondaryValue?.confidence}%)`);
    console.log('Date column:', detection1.date.column, `(${detection1.date.confidence}%)`);
    console.log('Primary category:', detection1.primaryCategory.column, `(${detection1.primaryCategory.confidence}%)`);
    console.log('Suggestions:', detection1.suggestions);
    console.log('');

    const settings1 = convertToGlobalSettings(detection1);
    console.log('Global settings:', settings1);
    console.log('');
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: E-commerce data
  console.log('Test 2: E-commerce data');
  try {
    const detection2 = detectColumnsWithAI(sampleData2);
    console.log('✅ Detection results:', detection2);
    console.log('Overall confidence:', detection2.confidence);
    console.log('Primary value:', detection2.primaryValue.column, `(${detection2.primaryValue.confidence}%)`);
    console.log('Secondary value:', detection2.secondaryValue?.column, `(${detection2.secondaryValue?.confidence}%)`);
    console.log('Date column:', detection2.date.column, `(${detection2.date.confidence}%)`);
    console.log('Primary category:', detection2.primaryCategory.column, `(${detection2.primaryCategory.confidence}%)`);
    console.log('Suggestions:', detection2.suggestions);
    console.log('');

    const settings2 = convertToGlobalSettings(detection2);
    console.log('Global settings:', settings2);
    console.log('');
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  // Test 3: Financial data
  console.log('Test 3: Financial data');
  try {
    const detection3 = detectColumnsWithAI(sampleData3);
    console.log('✅ Detection results:', detection3);
    console.log('Overall confidence:', detection3.confidence);
    console.log('Primary value:', detection3.primaryValue.column, `(${detection3.primaryValue.confidence}%)`);
    console.log('Secondary value:', detection3.secondaryValue?.column, `(${detection3.secondaryValue?.confidence}%)`);
    console.log('Date column:', detection3.date.column, `(${detection3.date.confidence}%)`);
    console.log('Primary category:', detection3.primaryCategory.column, `(${detection3.primaryCategory.confidence}%)`);
    console.log('Suggestions:', detection3.suggestions);
    console.log('');

    const settings3 = convertToGlobalSettings(detection3);
    console.log('Global settings:', settings3);
    console.log('');
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  console.log('🎯 All tests completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAIDetection();
}

module.exports = { testAIDetection };
