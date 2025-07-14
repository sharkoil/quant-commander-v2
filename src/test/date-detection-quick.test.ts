/**
 * Quick test for date detection with actual SAMPLE300.csv format
 */

import { getDateFields } from '../lib/utils/csvFieldAnalyzer';

// Test with exact format from SAMPLE300.csv
const testData = [
  { Date: '1/5/2025', Category: 'Truck', State: 'Florida', Budget: '57404', Forecast: '57404', Actual: '57404' },
  { Date: '1/21/2025', Category: 'SUV', State: 'California', Budget: '41049', Forecast: '41049', Actual: '41049' },
  { Date: '2/5/2025', Category: 'Car', State: 'Alaska', Budget: '53573', Forecast: '53573', Actual: '53573' }
];

console.log('Testing date detection with SAMPLE300.csv format:');
console.log('Sample data:', testData[0]);

const dateFields = getDateFields(testData);
console.log('Detected date fields:', dateFields);

// Should detect 'Date' field
if (dateFields.includes('Date')) {
  console.log('✅ SUCCESS: Date field detected correctly');
} else {
  console.log('❌ FAILED: Date field not detected');
  console.log('Available fields:', Object.keys(testData[0]));
}
