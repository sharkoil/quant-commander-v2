/**
 * Integration test for budget variance with real CSV data
 * Tests the complete workflow from CSV loading to analysis generation
 */

import { processBudgetVarianceData } from '../lib/analyzers/budgetVarianceProcessor';
import { getDefaultBudgetColumn, getDefaultActualColumn, getDateFields } from '../lib/utils/csvFieldAnalyzer';

describe('Budget Variance Integration with Real CSV', () => {
  // Sample data that matches the format from oob_test.csv
  const realCSVData = [
    { Date: '2024-01-01', Product: 'Coffee Machine', Category: 'Home & Garden', State: 'Texas', City: 'Dallas', Budget: 32934, Actuals: 38861, Channel: 'Partner' },
    { Date: '2024-01-03', Product: 'Laptop Pro', Category: 'Electronics', State: 'Oklahoma', City: 'Oklahoma City', Budget: 72733, Actuals: 60337, Channel: 'Partner' },
    { Date: '2024-01-05', Product: 'Security System', Category: 'Home & Garden', State: 'New Jersey', City: 'Paterson', Budget: 169029, Actuals: 209534, Channel: 'Online' },
    { Date: '2024-02-01', Product: 'Gaming Headset', Category: 'Electronics', State: 'Idaho', City: 'Meridian', Budget: 168230, Actuals: 177755, Channel: 'Retail' },
    { Date: '2024-02-15', Product: 'Coffee Machine', Category: 'Home & Garden', State: 'Alaska', City: 'Anchorage', Budget: 97415, Actuals: 98365, Channel: 'Retail' }
  ];

  test('should auto-detect Budget and Actuals columns correctly', () => {
    const budgetColumn = getDefaultBudgetColumn(realCSVData);
    const actualColumn = getDefaultActualColumn(realCSVData);
    const dateFields = getDateFields(realCSVData);

    expect(budgetColumn).toBe('Budget');
    expect(actualColumn).toBe('Actuals');
    expect(dateFields).toContain('Date');
  });

  test('should process budget variance analysis with auto-detected columns', () => {
    const budgetColumn = getDefaultBudgetColumn(realCSVData);
    const actualColumn = getDefaultActualColumn(realCSVData);
    const dateFields = getDateFields(realCSVData);

    const processedData = processBudgetVarianceData(realCSVData, {
      budgetColumn,
      actualColumn,
      dateColumn: dateFields[0],
      periodType: 'monthly'
    });

    expect(processedData).toHaveLength(2); // 2024-01 and 2024-02
    expect(processedData[0]).toHaveProperty('period', '2024-01');
    expect(processedData[0]).toHaveProperty('budget');
    expect(processedData[0]).toHaveProperty('actual');
    expect(processedData[0]).toHaveProperty('variance');
    expect(processedData[0]).toHaveProperty('status');
  });

  test('should handle CSV data format correctly', () => {
    // Test that the CSV data transformation works
    const csvColumns = ['Date', 'Product', 'Category', 'State', 'City', 'Budget', 'Actuals', 'Channel'];
    const csvRows = [
      ['Date', 'Product', 'Category', 'State', 'City', 'Budget', 'Actuals', 'Channel'], // Header
      ['2024-01-01', 'Coffee Machine', 'Home & Garden', 'Texas', 'Dallas', '32934', '38861', 'Partner'],
      ['2024-01-03', 'Laptop Pro', 'Electronics', 'Oklahoma', 'Oklahoma City', '72733', '60337', 'Partner']
    ];

    // Convert to object format (like AnalysisTab does)
    const convertedData = csvRows.slice(1).map(row => 
      Object.fromEntries(
        csvColumns.map((col, index) => [col, row[index]])
      )
    );

    const budgetColumn = getDefaultBudgetColumn(convertedData);
    const actualColumn = getDefaultActualColumn(convertedData);

    expect(budgetColumn).toBe('Budget');
    expect(actualColumn).toBe('Actuals');

    // Should work with the processor
    const processedData = processBudgetVarianceData(convertedData, {
      budgetColumn,
      actualColumn,
      dateColumn: 'Date',
      periodType: 'monthly'
    });

    expect(processedData).toHaveLength(1); // Only 2024-01 data
    expect(processedData[0].period).toBe('2024-01');
  });
});
