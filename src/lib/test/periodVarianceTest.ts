// src/lib/test/periodVarianceTest.ts

import { processPeriodVarianceData, PeriodVarianceParams } from '../analyzers/periodVarianceProcessor';

describe('processPeriodVarianceData', () => {
  const mockCsvData = [
    { Date: '2024-01-15', Sales: 100 },
    { Date: '2024-01-20', Sales: 150 },
    { Date: '2024-02-10', Sales: 200 },
    { Date: '2024-02-25', Sales: 250 },
    { Date: '2024-03-05', Sales: 300 },
    { Date: '2024-04-10', Sales: 400 }, // Q2
    { Date: '2024-07-15', Sales: 500 }, // Q3
  ];

  it('should calculate monthly variance correctly', () => {
    const params: PeriodVarianceParams = {
      valueColumn: 'Sales',
      dateColumn: 'Date',
      periodType: 'monthly',
    };

    const result = processPeriodVarianceData(mockCsvData, params);

    expect(result.data.length).toBe(5);

    // Check January
    expect(result.data[0].period).toBe('2024-01');
    expect(result.data[0].value).toBe(250); // 100 + 150
    expect(result.data[0].previousValue).toBeNull();
    expect(result.data[0].variance).toBeNull();

    // Check February
    expect(result.data[1].period).toBe('2024-02');
    expect(result.data[1].value).toBe(450); // 200 + 250
    expect(result.data[1].previousValue).toBe(250);
    expect(result.data[1].variance).toBe(200);
    expect(result.data[1].variancePercentage).toBeCloseTo(80);
    
    // Check March
    expect(result.data[2].period).toBe('2024-03');
    expect(result.data[2].value).toBe(300);
    expect(result.data[2].previousValue).toBe(450);
    expect(result.data[2].variance).toBe(-150);
    expect(result.data[2].variancePercentage).toBeCloseTo(-33.33);
  });

  it('should calculate quarterly variance correctly', () => {
    const params: PeriodVarianceParams = {
      valueColumn: 'Sales',
      dateColumn: 'Date',
      periodType: 'quarterly',
    };

    const result = processPeriodVarianceData(mockCsvData, params);

    expect(result.data.length).toBe(3);

    // Check Q1
    expect(result.data[0].period).toBe('2024-Q1');
    expect(result.data[0].value).toBe(1000); // 250 (Jan) + 450 (Feb) + 300 (Mar)
    expect(result.data[0].previousValue).toBeNull();

    // Check Q2
    expect(result.data[1].period).toBe('2024-Q2');
    expect(result.data[1].value).toBe(400);
    expect(result.data[1].previousValue).toBe(1000);
    expect(result.data[1].variance).toBe(-600);
    expect(result.data[1].variancePercentage).toBeCloseTo(-60);

    // Check Q3
    expect(result.data[2].period).toBe('2024-Q3');
    expect(result.data[2].value).toBe(500);
    expect(result.data[2].previousValue).toBe(400);
    expect(result.data[2].variance).toBe(100);
    expect(result.data[2].variancePercentage).toBeCloseTo(25);
  });

  it('should handle empty data', () => {
    const params: PeriodVarianceParams = {
      valueColumn: 'Sales',
      dateColumn: 'Date',
      periodType: 'monthly',
    };

    const result = processPeriodVarianceData([], params);
    expect(result.data.length).toBe(0);
  });

  it('should handle data with invalid rows', () => {
    const dirtyData = [
        ...mockCsvData,
        { Date: 'invalid-date', Sales: 100 },
        { Date: '2024-08-01', Sales: 'not-a-number' },
    ];
    const params: PeriodVarianceParams = {
      valueColumn: 'Sales',
      dateColumn: 'Date',
      periodType: 'monthly',
    };
    const result = processPeriodVarianceData(dirtyData, params);
    // Should process the valid rows and ignore the invalid ones
    expect(result.data.length).toBe(5); 
    expect(result.data.find(d => d.period === '2024-08')).toBeUndefined();
  });

  it('should throw an error if columns are not provided', () => {
    const params = {
      valueColumn: '',
      dateColumn: '',
      periodType: 'monthly',
    } as PeriodVarianceParams;
    expect(() => processPeriodVarianceData(mockCsvData, params)).toThrow('Value column and date column must be specified.');
  });
});