/**
 * Unit tests for Quarterly Contribution Analysis
 * Tests time period utilities and quarterly contribution analysis functionality
 */

import {
  parseDate,
  getQuarterFromDate,
  getQuarterLabel,
  getMonthLabel,
  createQuarterPeriod,
  createMonthPeriod,
  getAvailableQuarters,
  groupDataByPeriod,
  isDateInPeriod
} from '../lib/timePeriodUtils';

import {
  processQuarterlyContribution
} from '../lib/analyzers/contributionQuarterly';

import { ContributionAnalysisParams, FlexibleContributionData } from '../lib/analyzers/contributionTypes';

describe('Time Period Utils', () => {
  describe('parseDate', () => {
    it('should parse various date formats', () => {
      expect(parseDate('2024-01-15')).toEqual(new Date('2024-01-15'));
      expect(parseDate('01/15/2024')).toEqual(new Date('01/15/2024'));
      expect(parseDate(new Date('2024-01-15'))).toEqual(new Date('2024-01-15'));
      expect(parseDate(null)).toBeNull();
      expect(parseDate(undefined)).toBeNull();
      expect(parseDate('')).toBeNull();
    });

    it('should handle Excel serial numbers', () => {
      // Excel serial number for 2024-01-01
      const excelDate = 45292;
      const parsed = parseDate(excelDate);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getFullYear()).toBe(2024);
    });
  });

  describe('getQuarterFromDate', () => {
    it('should return correct quarter for each month', () => {
      expect(getQuarterFromDate(new Date('2024-01-15'))).toBe(1);
      expect(getQuarterFromDate(new Date('2024-02-15'))).toBe(1);
      expect(getQuarterFromDate(new Date('2024-03-15'))).toBe(1);
      expect(getQuarterFromDate(new Date('2024-04-15'))).toBe(2);
      expect(getQuarterFromDate(new Date('2024-05-15'))).toBe(2);
      expect(getQuarterFromDate(new Date('2024-06-15'))).toBe(2);
      expect(getQuarterFromDate(new Date('2024-07-15'))).toBe(3);
      expect(getQuarterFromDate(new Date('2024-08-15'))).toBe(3);
      expect(getQuarterFromDate(new Date('2024-09-15'))).toBe(3);
      expect(getQuarterFromDate(new Date('2024-10-15'))).toBe(4);
      expect(getQuarterFromDate(new Date('2024-11-15'))).toBe(4);
      expect(getQuarterFromDate(new Date('2024-12-15'))).toBe(4);
    });
  });

  describe('getQuarterLabel', () => {
    it('should return correctly formatted quarter labels', () => {
      expect(getQuarterLabel(new Date('2024-01-15'))).toBe('2024-Q1');
      expect(getQuarterLabel(new Date('2024-04-15'))).toBe('2024-Q2');
      expect(getQuarterLabel(new Date('2024-07-15'))).toBe('2024-Q3');
      expect(getQuarterLabel(new Date('2024-10-15'))).toBe('2024-Q4');
    });
  });

  describe('getMonthLabel', () => {
    it('should return correctly formatted month labels', () => {
      expect(getMonthLabel(new Date('2024-01-15'))).toBe('2024-Jan');
      expect(getMonthLabel(new Date('2024-02-15'))).toBe('2024-Feb');
      expect(getMonthLabel(new Date('2024-12-15'))).toBe('2024-Dec');
    });
  });

  describe('createQuarterPeriod', () => {
    it('should create correct quarter periods', () => {
      const q1 = createQuarterPeriod(2024, 1);
      
      expect(q1.type).toBe('quarter');
      expect(q1.year).toBe(2024);
      expect(q1.period).toBe(1);
      expect(q1.label).toBe('2024-Q1');
      expect(q1.start).toEqual(new Date(2024, 0, 1)); // Jan 1
      expect(q1.end).toEqual(new Date(2024, 2, 31)); // Mar 31
    });

    it('should handle Q4 correctly', () => {
      const q4 = createQuarterPeriod(2024, 4);
      
      expect(q4.start).toEqual(new Date(2024, 9, 1)); // Oct 1
      expect(q4.end).toEqual(new Date(2024, 11, 31)); // Dec 31
    });
  });

  describe('createMonthPeriod', () => {
    it('should create correct month periods', () => {
      const jan = createMonthPeriod(2024, 1);
      
      expect(jan.type).toBe('month');
      expect(jan.year).toBe(2024);
      expect(jan.period).toBe(1);
      expect(jan.label).toBe('2024-Jan');
      expect(jan.start).toEqual(new Date(2024, 0, 1)); // Jan 1
      expect(jan.end).toEqual(new Date(2024, 0, 31)); // Jan 31
    });

    it('should handle February correctly', () => {
      const feb2024 = createMonthPeriod(2024, 2);
      expect(feb2024.end).toEqual(new Date(2024, 1, 29)); // Feb 29, 2024 is leap year
      
      const feb2023 = createMonthPeriod(2023, 2);
      expect(feb2023.end).toEqual(new Date(2023, 1, 28)); // Feb 28, 2023 is not leap year
    });
  });

  describe('getAvailableQuarters', () => {
    it('should extract unique quarters from date array', () => {
      const dates = [
        new Date('2024-01-15'),
        new Date('2024-02-15'),
        new Date('2024-04-15'),
        new Date('2024-07-15'),
        new Date('2024-08-15'),
        new Date('2024-10-15')
      ];
      
      const quarters = getAvailableQuarters(dates);
      
      expect(quarters).toHaveLength(4);
      expect(quarters.map(q => q.label)).toEqual(['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4']);
    });

    it('should handle multiple years', () => {
      const dates = [
        new Date('2023-12-15'),
        new Date('2024-01-15'),
        new Date('2024-04-15')
      ];
      
      const quarters = getAvailableQuarters(dates);
      
      expect(quarters).toHaveLength(3);
      expect(quarters.map(q => q.label)).toEqual(['2023-Q4', '2024-Q1', '2024-Q2']);
    });

    it('should filter out invalid dates', () => {
      const dates = [
        new Date('2024-01-15'),
        new Date('invalid'),
        new Date('2024-04-15')
      ];
      
      const quarters = getAvailableQuarters(dates);
      
      expect(quarters).toHaveLength(2);
      expect(quarters.map(q => q.label)).toEqual(['2024-Q1', '2024-Q2']);
    });
  });

  describe('groupDataByPeriod', () => {
    const testData = [
      { id: 1, value: 100, date: new Date('2024-01-15') },
      { id: 2, value: 200, date: new Date('2024-02-15') },
      { id: 3, value: 300, date: new Date('2024-04-15') },
      { id: 4, value: 400, date: new Date('2024-07-15') }
    ];

    it('should group data by quarters', () => {
      const grouped = groupDataByPeriod(testData, 'quarter');
      
      expect(grouped.size).toBe(3);
      expect(grouped.has('2024-Q1')).toBe(true);
      expect(grouped.has('2024-Q2')).toBe(true);
      expect(grouped.has('2024-Q3')).toBe(true);
      
      expect(grouped.get('2024-Q1')).toHaveLength(2);
      expect(grouped.get('2024-Q2')).toHaveLength(1);
      expect(grouped.get('2024-Q3')).toHaveLength(1);
    });

    it('should group data by months', () => {
      const grouped = groupDataByPeriod(testData, 'month');
      
      expect(grouped.size).toBe(4);
      expect(grouped.has('2024-Jan')).toBe(true);
      expect(grouped.has('2024-Feb')).toBe(true);
      expect(grouped.has('2024-Apr')).toBe(true);
      expect(grouped.has('2024-Jul')).toBe(true);
    });
  });

  describe('isDateInPeriod', () => {
    it('should correctly identify dates within periods', () => {
      const q1 = createQuarterPeriod(2024, 1);
      
      expect(isDateInPeriod(new Date('2024-01-15'), q1)).toBe(true);
      expect(isDateInPeriod(new Date('2024-02-29'), q1)).toBe(true);
      expect(isDateInPeriod(new Date('2024-03-31'), q1)).toBe(true);
      expect(isDateInPeriod(new Date('2024-04-01'), q1)).toBe(false);
      expect(isDateInPeriod(new Date('2023-12-31'), q1)).toBe(false);
    });
  });
});

describe('Quarterly Contribution Analysis', () => {
  const mockData: FlexibleContributionData[] = [
    // Q1 data
    { category: 'Product A', value: 1000, date: '2024-01-15' },
    { category: 'Product B', value: 800, date: '2024-01-20' },
    { category: 'Product C', value: 600, date: '2024-02-15' },
    { category: 'Product A', value: 1200, date: '2024-03-15' },
    
    // Q2 data
    { category: 'Product A', value: 1500, date: '2024-04-15' },
    { category: 'Product B', value: 900, date: '2024-05-15' },
    { category: 'Product C', value: 700, date: '2024-06-15' },
    { category: 'Product D', value: 400, date: '2024-06-20' },
    
    // Q3 data
    { category: 'Product A', value: 1800, date: '2024-07-15' },
    { category: 'Product B', value: 1000, date: '2024-08-15' },
    { category: 'Product C', value: 800, date: '2024-09-15' },
    { category: 'Product D', value: 500, date: '2024-09-20' }
  ];

  const mockParams: ContributionAnalysisParams = {
    valueColumn: 'value',
    categoryColumn: 'category',
    analysisScope: 'total',
    sortBy: 'contribution',
    sortOrder: 'desc',
    timePeriodAnalysis: {
      enabled: true,
      periodType: 'quarter',
      dateColumn: 'date'
    }
  };

  describe('processQuarterlyContribution', () => {
    it('should process quarterly contribution analysis', () => {
      const result = processQuarterlyContribution(mockData, mockParams);
      
      expect(result).toHaveProperty('quarterlyAnalysis');
      expect(result).toHaveProperty('periodComparison');
      expect(result).toHaveProperty('seasonalInsights');
      expect(result).toHaveProperty('trendInsights');
    });

    it('should create quarterly analysis for each quarter', () => {
      const result = processQuarterlyContribution(mockData, mockParams);
      
      expect(result.quarterlyAnalysis).toHaveProperty('2024-Q1');
      expect(result.quarterlyAnalysis).toHaveProperty('2024-Q2');
      expect(result.quarterlyAnalysis).toHaveProperty('2024-Q3');
      
      // Check Q1 analysis
      const q1Analysis = result.quarterlyAnalysis['2024-Q1'];
      expect(q1Analysis).toBeDefined();
      expect(q1Analysis.length).toBeGreaterThan(0);
      
      // Verify structure
      q1Analysis.forEach(item => {
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('value');
        expect(item).toHaveProperty('contributionPercent');
        expect(item).toHaveProperty('rank');
        expect(item).toHaveProperty('emoji');
        expect(item).toHaveProperty('significance');
      });
    });

    it('should calculate correct contributions by quarter', () => {
      const result = processQuarterlyContribution(mockData, mockParams);
      
      // Check Q1 totals
      const q1Analysis = result.quarterlyAnalysis['2024-Q1'];
      const q1ProductA = q1Analysis.find(item => item.category === 'Product A');
      
      // Q1 data: Product A: 1000 + 1200 = 2200
      // Q1 data: Product B: 800
      // Q1 data: Product C: 600
      // Q1 Total: 2200 + 800 + 600 = 3600
      // Product A contribution: 2200/3600 * 100 = 61.11%
      
      expect(q1ProductA?.value).toBe(2200); // 1000 + 1200
      expect(q1ProductA?.contributionPercent).toBeCloseTo(61.1, 1); // 2200/3600 * 100
    });

    it('should generate period comparison', () => {
      const result = processQuarterlyContribution(mockData, mockParams);
      
      expect(result.periodComparison).toBeDefined();
      expect(result.periodComparison.periods).toEqual(['2024-Q1', '2024-Q2', '2024-Q3']);
      expect(result.periodComparison.categoryTrends).toBeDefined();
      
      // Check if Product A trend is calculated
      const productATrend = result.periodComparison.categoryTrends.find(
        trend => trend.category === 'Product A'
      );
      
      expect(productATrend).toBeDefined();
      expect(productATrend?.trend).toMatch(/increasing|decreasing|stable|volatile/);
      expect(productATrend?.values).toHaveLength(3);
    });

    it('should generate seasonal insights', () => {
      const result = processQuarterlyContribution(mockData, mockParams);
      
      expect(result.seasonalInsights).toBeDefined();
      expect(Array.isArray(result.seasonalInsights)).toBe(true);
    });

    it('should generate trend insights', () => {
      const result = processQuarterlyContribution(mockData, mockParams);
      
      expect(result.trendInsights).toBeDefined();
      expect(Array.isArray(result.trendInsights)).toBe(true);
    });

    it('should handle missing or invalid date column', () => {
      const invalidParams = {
        ...mockParams,
        timePeriodAnalysis: {
          enabled: true,
          periodType: 'quarter' as const,
          dateColumn: 'invalidColumn'
        }
      };
      
      expect(() => processQuarterlyContribution(mockData, invalidParams)).toThrow();
    });

    it('should handle data with no valid dates', () => {
      const invalidData = [
        { category: 'Product A', value: 1000, date: 'invalid-date' },
        { category: 'Product B', value: 800, date: null }
      ];
      
      expect(() => processQuarterlyContribution(invalidData, mockParams)).toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now();
      
      // Generate large dataset
      const largeData = Array.from({ length: 5000 }, (_, i) => ({
        category: `Category ${i % 20}`,
        value: Math.random() * 1000,
        date: new Date(2024, Math.floor(i / 500), (i % 30) + 1).toISOString()
      }));
      
      const result = processQuarterlyContribution(largeData, mockParams);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.quarterlyAnalysis).toBeDefined();
      expect(Object.keys(result.quarterlyAnalysis).length).toBeGreaterThan(0);
    });
  });
});
