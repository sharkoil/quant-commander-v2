// Unit tests for budget variance processor
// Tests data processing and calculation accuracy

import { 
  processBudgetVarianceData,
  BudgetVarianceParams 
} from '../../src/lib/analyzers/budgetVarianceProcessor';

describe('Budget Variance Processor', () => {
  const mockCSVData = [
    { Date: '2024-01-15', Budget: 1000, Actual: 1200, Category: 'Sales' },
    { Date: '2024-01-20', Budget: 500, Actual: 450, Category: 'Marketing' },
    { Date: '2024-02-10', Budget: 800, Actual: 900, Category: 'Sales' },
    { Date: '2024-02-15', Budget: 300, Actual: 320, Category: 'Marketing' }
  ];

  const baseParams: BudgetVarianceParams = {
    budgetColumn: 'Budget',
    actualColumn: 'Actual',
    dateColumn: 'Date',
    periodType: 'monthly'
  };

  it('should process budget variance data correctly for monthly periods', () => {
    const result = processBudgetVarianceData(mockCSVData, baseParams);
    
    expect(result).toHaveLength(2); // January and February
    expect(result[0].period).toBe('2024-01');
    expect(result[0].budget).toBe(1500); // 1000 + 500
    expect(result[0].actual).toBe(1650); // 1200 + 450
    expect(result[0].variance).toBe(150); // 1650 - 1500
    expect(result[0].variancePercentage).toBeCloseTo(10, 1);
  });

  it('should handle quarterly periods correctly', () => {
    const quarterlyParams = { ...baseParams, periodType: 'quarterly' as const };
    const result = processBudgetVarianceData(mockCSVData, quarterlyParams);
    
    expect(result).toHaveLength(1); // All data in Q1
    expect(result[0].period).toBe('2024-Q1');
    expect(result[0].budget).toBe(2600); // Sum of all budget
    expect(result[0].actual).toBe(2870); // Sum of all actual
  });

  it('should handle missing date column gracefully', () => {
    const noDateParams = { ...baseParams, dateColumn: undefined };
    const result = processBudgetVarianceData(mockCSVData, noDateParams);
    
    expect(result).toHaveLength(1);
    expect(result[0].period).toBe('All Data');
  });

  it('should handle invalid numeric values', () => {
    const invalidData = [
      { Budget: 'invalid', Actual: 1000 },
      { Budget: 500, Actual: 'invalid' },
      { Budget: 1000, Actual: 1200 }
    ];
    
    const result = processBudgetVarianceData(invalidData, {
      budgetColumn: 'Budget',
      actualColumn: 'Actual',
      periodType: 'monthly'
    });
    
    expect(result).toHaveLength(1);
    expect(result[0].budget).toBe(1000);
    expect(result[0].actual).toBe(1200);
  });

  it('should determine variance status correctly', () => {
    const result = processBudgetVarianceData(mockCSVData, baseParams);
    
    const january = result.find(r => r.period === '2024-01');
    expect(january?.status).toBe('favorable'); // Actual > Budget
    
    const february = result.find(r => r.period === '2024-02');
    expect(february?.status).toBe('favorable'); // Actual > Budget
  });

  it('should handle empty data gracefully', () => {
    const result = processBudgetVarianceData([], baseParams);
    expect(result).toHaveLength(0);
  });

  it('should filter out demo data', () => {
    const dataWithDemo = [
      ...mockCSVData,
      { Date: '2024-01-01', Budget: 5000, Actual: 5500, Category: 'Premium Laptop Pro' },
      { Date: '2024-01-02', Budget: 3000, Actual: 3200, Category: 'demo_product' }
    ];
    
    const result = processBudgetVarianceData(dataWithDemo, baseParams);
    
    // Should only include real data, not demo data
    expect(result.every(r => r.budget <= 2600)).toBe(true);
  });
});
