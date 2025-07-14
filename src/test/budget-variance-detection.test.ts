/**
 * Test for budget variance column detection
 * Validates that the field analyzer correctly identifies Budget and Actuals columns
 */

import { getDefaultBudgetColumn, getDefaultActualColumn, getNumericFields, getDateFields } from '../lib/utils/csvFieldAnalyzer';

describe('Budget Variance Column Detection', () => {
  // Test data matching SAMPLE300.csv format exactly
  const sampleCSVData = [
    { Date: '1/5/2025', Category: 'Truck', State: 'Florida', Budget: 57404, Forecast: 57404, Actual: 57404 },
    { Date: '1/21/2025', Category: 'SUV', State: 'California', Budget: 41049, Forecast: 41049, Actual: 41049 },
    { Date: '2/5/2025', Category: 'Car', State: 'Alaska', Budget: 53573, Forecast: 53573, Actual: 53573 }
  ];

  const columnNames = ['Date', 'Category', 'State', 'Budget', 'Forecast', 'Actual'];

  test('should detect Budget column correctly from CSV data', () => {
    const budgetColumn = getDefaultBudgetColumn(sampleCSVData);
    expect(budgetColumn).toBe('Budget');
  });

  test('should detect Actual column correctly from CSV data', () => {
    const actualColumn = getDefaultActualColumn(sampleCSVData);
    expect(actualColumn).toBe('Actual');
  });

  test('should detect Budget column from column names array', () => {
    const budgetColumn = getDefaultBudgetColumn(columnNames);
    expect(budgetColumn).toBe('Budget');
  });

  test('should detect Actual column from column names array', () => {
    const actualColumn = getDefaultActualColumn(columnNames);
    expect(actualColumn).toBe('Actual');
  });

  test('should identify numeric fields correctly', () => {
    const numericFields = getNumericFields(sampleCSVData);
    expect(numericFields).toContain('Budget');
    expect(numericFields).toContain('Actual');
    expect(numericFields).toContain('Forecast');
    expect(numericFields).not.toContain('Date');
    expect(numericFields).not.toContain('Category');
    expect(numericFields).not.toContain('State');
  });

  test('should identify date fields correctly with SAMPLE300.csv format', () => {
    const dateFields = getDateFields(sampleCSVData);
    expect(dateFields).toContain('Date');
    expect(dateFields).not.toContain('Budget');
    expect(dateFields).not.toContain('Category');
    expect(dateFields).not.toContain('State');
  });

  test('should handle empty data gracefully', () => {
    expect(getDefaultBudgetColumn([])).toBe('Budget');
    expect(getDefaultActualColumn([])).toBe('Actual');
    expect(getNumericFields([])).toEqual([]);
    expect(getDateFields([])).toEqual([]);
  });

  test('should detect Date field by name pattern', () => {
    // Test that field named "Date" is detected even with minimal data
    const minimalData = [{ Date: '1/1/2025', Value: 100 }];
    const dateFields = getDateFields(minimalData);
    expect(dateFields).toContain('Date');
  });
});
