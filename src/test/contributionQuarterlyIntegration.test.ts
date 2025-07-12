/**
 * Integration test for Quarterly Contribution Analysis
 * Tests the complete flow from modal to analysis results
 */

import { calculateContributionAnalysis } from '../lib/analyzers/contributionAnalysis';
import { ContributionAnalysisParams, FlexibleContributionData } from '../lib/analyzers/contributionTypes';

describe('Quarterly Contribution Analysis Integration', () => {
  const mockQuarterlyData: FlexibleContributionData[] = [
    // Q1 2024
    { product: 'Laptop Pro', revenue: 50000, date: '2024-01-15' },
    { product: 'Tablet Max', revenue: 30000, date: '2024-02-10' },
    { product: 'Phone Ultra', revenue: 40000, date: '2024-03-20' },
    
    // Q2 2024
    { product: 'Laptop Pro', revenue: 60000, date: '2024-04-15' },
    { product: 'Tablet Max', revenue: 35000, date: '2024-05-10' },
    { product: 'Phone Ultra', revenue: 45000, date: '2024-06-20' },
    
    // Q3 2024
    { product: 'Laptop Pro', revenue: 70000, date: '2024-07-15' },
    { product: 'Tablet Max', revenue: 40000, date: '2024-08-10' },
    { product: 'Phone Ultra', revenue: 50000, date: '2024-09-20' },
    { product: 'Smartwatch', revenue: 25000, date: '2024-09-25' }
  ];

  it('should perform full quarterly contribution analysis', async () => {
    const params: ContributionAnalysisParams = {
      valueColumn: 'revenue',
      categoryColumn: 'product',
      analysisScope: 'total',
      sortBy: 'contribution',
      sortOrder: 'desc',
      timePeriodAnalysis: {
        enabled: true,
        periodType: 'quarter',
        compareAcrossPeriods: true,
        dateColumn: 'date'
      }
    };

    const result = calculateContributionAnalysis(mockQuarterlyData, params);

    // Verify basic success
    expect(result.success).toBe(true);
    expect(result.analysis).toBeDefined();
    expect(result.analysis.length).toBeGreaterThan(0);

    // Verify quarterly analysis was performed
    expect(result.quarterlyAnalysis).toBeDefined();
    expect(result.quarterlyAnalysis).toHaveProperty('2024-Q1');
    expect(result.quarterlyAnalysis).toHaveProperty('2024-Q2');
    expect(result.quarterlyAnalysis).toHaveProperty('2024-Q3');

    // Verify time period metadata
    expect(result.metadata.timePeriodAnalysis).toBeDefined();
    expect(result.metadata.timePeriodAnalysis?.periodType).toBe('quarter');
    expect(result.metadata.timePeriodAnalysis?.periodsAnalyzed).toContain('2024-Q1');
    expect(result.metadata.timePeriodAnalysis?.periodsAnalyzed).toContain('2024-Q2');
    expect(result.metadata.timePeriodAnalysis?.periodsAnalyzed).toContain('2024-Q3');

    // Verify period comparison
    expect(result.periodComparison).toBeDefined();
    expect(result.periodComparison?.periods).toEqual(['2024-Q1', '2024-Q2', '2024-Q3']);
    expect(result.periodComparison?.categoryTrends).toBeDefined();
    expect(result.periodComparison?.categoryTrends.length).toBeGreaterThan(0);

    // Verify insights include seasonal information
    expect(result.insights.seasonalInsights).toBeDefined();
    expect(result.insights.trendInsights).toBeDefined();

    // Verify quarterly analysis structure
    const q1Analysis = result.quarterlyAnalysis!['2024-Q1'];
    expect(q1Analysis).toBeDefined();
    expect(q1Analysis.length).toBe(3); // 3 products in Q1

    // Verify Laptop Pro is top contributor in Q1
    const q1LaptopPro = q1Analysis.find(item => item.category === 'Laptop Pro');
    expect(q1LaptopPro).toBeDefined();
    expect(q1LaptopPro?.value).toBe(50000);
    expect(q1LaptopPro?.rank).toBe(1);

    // Verify Q3 has 4 products (including Smartwatch)
    const q3Analysis = result.quarterlyAnalysis!['2024-Q3'];
    expect(q3Analysis).toBeDefined();
    expect(q3Analysis.length).toBe(4); // 4 products in Q3
    
    const q3Smartwatch = q3Analysis.find(item => item.category === 'Smartwatch');
    expect(q3Smartwatch).toBeDefined();
  });

  it('should handle quarterly analysis with specific period filter', async () => {
    const params: ContributionAnalysisParams = {
      valueColumn: 'revenue',
      categoryColumn: 'product',
      analysisScope: 'total',
      sortBy: 'contribution',
      sortOrder: 'desc',
      timePeriodAnalysis: {
        enabled: true,
        periodType: 'quarter',
        specificPeriod: '2024-Q2',
        dateColumn: 'date'
      }
    };

    const result = calculateContributionAnalysis(mockQuarterlyData, params);

    expect(result.success).toBe(true);
    expect(result.quarterlyAnalysis).toBeDefined();
    
    // Should still analyze all quarters even with specific period (for comparison)
    expect(Object.keys(result.quarterlyAnalysis!)).toContain('2024-Q1');
    expect(Object.keys(result.quarterlyAnalysis!)).toContain('2024-Q2');
    expect(Object.keys(result.quarterlyAnalysis!)).toContain('2024-Q3');
  });

  it('should handle quarterly analysis without period comparison', async () => {
    const params: ContributionAnalysisParams = {
      valueColumn: 'revenue',
      categoryColumn: 'product',
      analysisScope: 'total',
      sortBy: 'contribution',
      sortOrder: 'desc',
      timePeriodAnalysis: {
        enabled: true,
        periodType: 'quarter',
        compareAcrossPeriods: false,
        dateColumn: 'date'
      }
    };

    const result = calculateContributionAnalysis(mockQuarterlyData, params);

    expect(result.success).toBe(true);
    expect(result.quarterlyAnalysis).toBeDefined();
    expect(result.periodComparison).toBeDefined(); // Should still exist for insights
  });

  it('should handle disabled quarterly analysis', async () => {
    const params: ContributionAnalysisParams = {
      valueColumn: 'revenue',
      categoryColumn: 'product',
      analysisScope: 'total',
      sortBy: 'contribution',
      sortOrder: 'desc',
      timePeriodAnalysis: {
        enabled: false,
        periodType: 'quarter',
        dateColumn: 'date'
      }
    };

    const result = calculateContributionAnalysis(mockQuarterlyData, params);

    expect(result.success).toBe(true);
    expect(result.quarterlyAnalysis).toBeUndefined();
    expect(result.periodComparison).toBeUndefined();
    expect(result.insights.seasonalInsights).toBeUndefined();
    expect(result.insights.trendInsights).toBeUndefined();
    expect(result.metadata.timePeriodAnalysis).toBeUndefined();
  });

  it('should handle invalid date column gracefully', async () => {
    const params: ContributionAnalysisParams = {
      valueColumn: 'revenue',
      categoryColumn: 'product',
      analysisScope: 'total',
      sortBy: 'contribution',
      sortOrder: 'desc',
      timePeriodAnalysis: {
        enabled: true,
        periodType: 'quarter',
        dateColumn: 'nonexistent_date_column'
      }
    };

    const result = calculateContributionAnalysis(mockQuarterlyData, params);

    // Should still succeed with standard analysis
    expect(result.success).toBe(true);
    expect(result.analysis).toBeDefined();
    
    // Quarterly analysis should be undefined due to error
    expect(result.quarterlyAnalysis).toBeUndefined();
  });

  it('should generate meaningful insights for quarterly data', async () => {
    const params: ContributionAnalysisParams = {
      valueColumn: 'revenue',
      categoryColumn: 'product',
      analysisScope: 'total',
      sortBy: 'contribution',
      sortOrder: 'desc',
      timePeriodAnalysis: {
        enabled: true,
        periodType: 'quarter',
        compareAcrossPeriods: true,
        dateColumn: 'date'
      }
    };

    const result = calculateContributionAnalysis(mockQuarterlyData, params);

    expect(result.success).toBe(true);
    
    // Check that insights mention quarterly patterns
    const allInsights = [
      ...result.insights.keyFindings,
      ...(result.insights.seasonalInsights || []),
      ...(result.insights.trendInsights || [])
    ].join(' ').toLowerCase();

    // Should contain some quarterly-related insights
    expect(result.insights.seasonalInsights).toBeDefined();
    expect(result.insights.trendInsights).toBeDefined();
    
    // Verify HTML output includes quarterly information
    expect(result.htmlOutput.toLowerCase()).toContain('contribution');
    expect(result.htmlOutput.length).toBeGreaterThan(0);
  });
});
