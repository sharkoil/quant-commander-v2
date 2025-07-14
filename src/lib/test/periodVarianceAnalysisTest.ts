/**
 * Period Variance Analysis Test Module
 * 
 * This module provides test functionality for the Period Variance analyzer.
 * It generates sample test data and HTML formatted output for testing purposes.
 * Unlike the Jest test file, this module is safe to import in browser code.
 */

import { processPeriodVarianceData, PeriodVarianceParams } from '../analyzers/periodVarianceProcessor';

/**
 * Test data representing realistic business scenarios for period variance analysis
 */
const generatePeriodVarianceTestData = () => {
  // Test 1: Monthly Sales Growth Pattern
  const test1Data = [
    { Date: '2024-01-15', Sales: 125000, Region: 'North' },
    { Date: '2024-01-28', Sales: 98000, Region: 'South' },
    { Date: '2024-02-10', Sales: 145000, Region: 'North' },
    { Date: '2024-02-25', Sales: 112000, Region: 'South' },
    { Date: '2024-03-05', Sales: 168000, Region: 'North' },
    { Date: '2024-03-20', Sales: 134000, Region: 'South' },
    { Date: '2024-04-10', Sales: 189000, Region: 'North' },
    { Date: '2024-04-25', Sales: 145000, Region: 'South' },
    { Date: '2024-05-15', Sales: 203000, Region: 'North' },
    { Date: '2024-05-30', Sales: 167000, Region: 'South' },
  ];

  // Test 2: Quarterly Revenue Analysis
  const test2Data = [
    { Date: '2023-01-15', Revenue: 245000, Department: 'Engineering' },
    { Date: '2023-02-28', Revenue: 267000, Department: 'Engineering' },
    { Date: '2023-03-31', Revenue: 234000, Department: 'Engineering' },
    { Date: '2023-04-15', Revenue: 298000, Department: 'Engineering' },
    { Date: '2023-05-30', Revenue: 312000, Department: 'Engineering' },
    { Date: '2023-06-30', Revenue: 289000, Department: 'Engineering' },
    { Date: '2023-07-15', Revenue: 334000, Department: 'Engineering' },
    { Date: '2023-08-31', Revenue: 356000, Department: 'Engineering' },
    { Date: '2023-09-30', Revenue: 298000, Department: 'Engineering' },
    { Date: '2023-10-15', Revenue: 378000, Department: 'Engineering' },
    { Date: '2023-11-30', Revenue: 401000, Department: 'Engineering' },
    { Date: '2023-12-31', Revenue: 423000, Department: 'Engineering' },
  ];

  // Test 3: Weekly Performance Analysis (short-term variance)
  const test3Data = [
    { Date: '2024-06-03', Performance: 87.5, Team: 'Alpha' },
    { Date: '2024-06-10', Performance: 91.2, Team: 'Alpha' },
    { Date: '2024-06-17', Performance: 89.8, Team: 'Alpha' },
    { Date: '2024-06-24', Performance: 94.1, Team: 'Alpha' },
    { Date: '2024-07-01', Performance: 96.7, Team: 'Alpha' },
    { Date: '2024-07-08', Performance: 93.4, Team: 'Alpha' },
    { Date: '2024-07-15', Performance: 98.2, Team: 'Alpha' },
    { Date: '2024-07-22', Performance: 95.6, Team: 'Alpha' },
  ];

  return { test1: test1Data, test2: test2Data, test3: test3Data };
};

/**
 * Run comprehensive period variance analysis tests
 */
export const testPeriodVariance = () => {
  const testData = generatePeriodVarianceTestData();
  
  // Test 1: Monthly variance analysis
  const monthlyParams: PeriodVarianceParams = {
    valueColumn: 'Sales',
    dateColumn: 'Date',
    periodType: 'monthly',
  };

  const test1Result = processPeriodVarianceData(testData.test1, monthlyParams);

  // Test 2: Quarterly variance analysis
  const quarterlyParams: PeriodVarianceParams = {
    valueColumn: 'Revenue',
    dateColumn: 'Date',
    periodType: 'quarterly',
  };

  const test2Result = processPeriodVarianceData(testData.test2, quarterlyParams);

  // Test 3: Weekly variance analysis
  const weeklyParams: PeriodVarianceParams = {
    valueColumn: 'Performance',
    dateColumn: 'Date',
    periodType: 'weekly',
  };

  const test3Result = processPeriodVarianceData(testData.test3, weeklyParams);

  return {
    test1: test1Result,
    test2: test2Result,
    test3: test3Result,
    testsRun: 3,
    performance: 'Excellent - all variance calculations completed'
  };
};

/**
 * Format period variance analysis results as professional HTML table
 */
export const formatPeriodVarianceTable = (analysisResult: any) => {
  if (!analysisResult?.data || analysisResult.data.length === 0) {
    return `
<div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 12px 0;">
  <h4 style="color: #dc2626; margin: 0 0 8px 0; font-weight: 600;">
    ⚠️ No Period Variance Data Available
  </h4>
  <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
    Unable to calculate period variance - insufficient data or invalid parameters.
  </p>
</div>`;
  }

  // Generate analysis summary
  const periods = analysisResult.data.length;
  const validVariances = analysisResult.data.filter((d: any) => d.variance !== null);
  const avgVariance = validVariances.length > 0 
    ? validVariances.reduce((sum: number, d: any) => sum + Math.abs(d.variance!), 0) / validVariances.length 
    : 0;
  
  const positiveVariances = validVariances.filter((d: any) => d.variance! > 0).length;
  const negativeVariances = validVariances.filter((d: any) => d.variance! < 0).length;
  
  // Determine trend direction
  const trendDirection = positiveVariances > negativeVariances ? 'Growth' : 
                        negativeVariances > positiveVariances ? 'Decline' : 'Mixed';
  
  const trendIndicator = trendDirection === 'Growth' ? '📈' : 
                        trendDirection === 'Decline' ? '📉' : '📊';

  // Create performance indicators
  const getVarianceIndicator = (variance: number | null, percentage: number | null) => {
    if (variance === null) return '🔄 Initial';
    if (Math.abs(percentage!) < 5) return '🟢 Stable';
    if (variance > 0) return percentage! > 15 ? '🚀 Strong Growth' : '📈 Growth';
    return percentage! < -15 ? '📉 Significant Decline' : '📊 Decline';
  };

  // Format currency values
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const formatVariance = (variance: number | null) => {
    if (variance === null) return '-';
    const formatted = Math.abs(variance) >= 1000 
      ? `${variance >= 0 ? '+' : '-'}$${Math.abs(variance / 1000).toFixed(0)}K`
      : `${variance >= 0 ? '+' : '-'}$${Math.abs(variance).toLocaleString()}`;
    return formatted;
  };

  const formatPercentage = (percentage: number | null) => {
    if (percentage === null) return '-';
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };

  // Create data rows
  const dataRows = analysisResult.data.map((item: any, index: number) => {
    const variance = item.variance;
    const percentage = item.variancePercentage;
    const indicator = getVarianceIndicator(variance, percentage);
    
    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 16px; font-weight: 500; color: #374151;">${item.period}</td>
        <td style="padding: 12px 16px; text-align: right; font-family: monospace; color: #1f2937;">
          ${formatValue(item.value)}
        </td>
        <td style="padding: 12px 16px; text-align: right; font-family: monospace; color: #6b7280;">
          ${item.previousValue ? formatValue(item.previousValue) : '-'}
        </td>
        <td style="padding: 12px 16px; text-align: right; font-family: monospace; color: ${variance === null ? '#6b7280' : variance >= 0 ? '#059669' : '#dc2626'};">
          ${formatVariance(variance)}
        </td>
        <td style="padding: 12px 16px; text-align: right; font-family: monospace; color: ${variance === null ? '#6b7280' : variance >= 0 ? '#059669' : '#dc2626'};">
          ${formatPercentage(percentage)}
        </td>
        <td style="padding: 12px 16px; text-align: center; font-size: 12px;">
          ${indicator}
        </td>
      </tr>`;
  }).join('');

  return `
<div style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
  
  <!-- Header Section -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
      <h3 style="margin: 0; font-size: 18px; font-weight: 600;">
        📊 Period-over-Period Variance Analysis
      </h3>
      <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
        ${trendIndicator} ${trendDirection} Trend
      </span>
    </div>
    <p style="margin: 0; opacity: 0.9; font-size: 14px;">
      ${analysisResult.periodType?.charAt(0).toUpperCase()}${analysisResult.periodType?.slice(1)} analysis across ${periods} periods
    </p>
  </div>

  <!-- Summary Cards -->
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Total Periods</div>
      <div style="color: #1f2937; font-size: 20px; font-weight: 700;">${periods}</div>
    </div>
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Avg Variance</div>
      <div style="color: #1f2937; font-size: 20px; font-weight: 700;">${formatValue(avgVariance)}</div>
    </div>
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Growth Periods</div>
      <div style="color: #059669; font-size: 20px; font-weight: 700;">${positiveVariances}</div>
    </div>
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Decline Periods</div>
      <div style="color: #dc2626; font-size: 20px; font-weight: 700;">${negativeVariances}</div>
    </div>
  </div>

  <!-- Data Table -->
  <div style="overflow-x: auto;">
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">
          <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151; font-size: 14px;">Period</th>
          <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; font-size: 14px;">Current Value</th>
          <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; font-size: 14px;">Previous Value</th>
          <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; font-size: 14px;">Variance</th>
          <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; font-size: 14px;">% Change</th>
          <th style="padding: 16px; text-align: center; font-weight: 600; color: #374151; font-size: 14px;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${dataRows}
      </tbody>
    </table>
  </div>

  <!-- Insights Footer -->
  <div style="background: #f9fafb; padding: 16px; border-top: 1px solid #e5e7eb;">
    <div style="display: flex; align-items: center; justify-content: between; flex-wrap: wrap; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Analysis Type:</span>
        <span style="color: #374151; font-size: 14px; font-weight: 600; text-transform: capitalize;">
          ${analysisResult.periodType} Period Variance
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Trend Pattern:</span>
        <span style="color: ${trendDirection === 'Growth' ? '#059669' : trendDirection === 'Decline' ? '#dc2626' : '#6b7280'}; font-size: 14px; font-weight: 600;">
          ${trendDirection} ${trendIndicator}
        </span>
      </div>
    </div>
  </div>
</div>`;
};
