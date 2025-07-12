// Test file for Period Variance Analyzer - Time Series Version
import { calculatePeriodVariance, PeriodVarianceArgs, TimeSeriesDataPoint } from '../analyzers/periodVariance';

/**
 * Simple test function to verify period variance calculations with time series data
 */
export function testPeriodVariance() {
  console.log('Testing Period Variance Analyzer (Time Series)...\n');
  
  // Test 1: Weekly Revenue Growth Pattern
  const weeklyRevenueData: TimeSeriesDataPoint[] = [
    { date: '2024-01-01', value: 1200 },
    { date: '2024-01-08', value: 1350 },
    { date: '2024-01-15', value: 1400 },
    { date: '2024-01-22', value: 1500 },
    { date: '2024-01-29', value: 1450 }
  ];
  
  const test1: PeriodVarianceArgs = {
    data: weeklyRevenueData,
    periodType: 'WoW',
    metricName: 'Revenue'
  };
  
  const result1 = calculatePeriodVariance(test1);
  console.log('Test 1 - Weekly Revenue Analysis:');
  console.log(`Total Periods: ${result1.totalPeriods}`);
  console.log(`Overall Trend: ${result1.summary.overallEmoji} ${result1.summary.overallTrend}`);
  console.log('Period-by-Period Results:');
  result1.results.forEach(r => {
    console.log(`  ${r.emoji} ${r.period}: ${r.variance > 0 ? '+' : ''}${r.variance.toFixed(0)} (${r.percentageVariance.toFixed(1)}%) - ${r.trend}`);
  });
  console.log('');
  
  // Test 2: Monthly Sales with Mixed Performance
  const monthlySalesData: TimeSeriesDataPoint[] = [
    { date: '2024-01-01', value: 5000 },
    { date: '2024-02-01', value: 4500 }, // Down
    { date: '2024-03-01', value: 6000 }, // Up significantly
    { date: '2024-04-01', value: 5800 }  // Down slightly
  ];
  
  const test2: PeriodVarianceArgs = {
    data: monthlySalesData,
    periodType: 'MoM',
    metricName: 'Sales'
  };
  
  const result2 = calculatePeriodVariance(test2);
  console.log('Test 2 - Monthly Sales Analysis:');
  console.log(`Total Periods: ${result2.totalPeriods}`);
  console.log(`Overall Trend: ${result2.summary.overallEmoji} ${result2.summary.overallTrend}`);
  console.log('Period-by-Period Results:');
  result2.results.forEach(r => {
    console.log(`  ${r.emoji} ${r.period}: ${r.variance > 0 ? '+' : ''}${r.variance.toFixed(0)} (${r.percentageVariance.toFixed(1)}%) - ${r.trend}`);
  });
  console.log('');
  
  // Test 3: Strong Growth Pattern
  const growthData: TimeSeriesDataPoint[] = [
    { date: '2023-01-01', value: 1000 },
    { date: '2024-01-01', value: 1250 } // 25% YoY growth
  ];
  
  const test3: PeriodVarianceArgs = {
    data: growthData,
    periodType: 'YoY',
    metricName: 'Annual Revenue'
  };
  
  const result3 = calculatePeriodVariance(test3);
  console.log('Test 3 - Year-over-Year Growth:');
  console.log(`Overall Trend: ${result3.summary.overallEmoji} ${result3.summary.overallTrend}`);
  result3.results.forEach(r => {
    console.log(`  ${r.emoji} ${r.period}: ${r.variance > 0 ? '+' : ''}${r.variance.toFixed(0)} (${r.percentageVariance.toFixed(1)}%) - ${r.trend}`);
  });
  console.log('');
  
  return {
    test1: result1,
    test2: result2,
    test3: result3
  };
}

/**
 * Format results as HTML cards for display in chat - each period is a separate card
 */
export function formatPeriodVarianceTable(analysis: {
  metricName: string;
  periodType: string;
  results: Array<{
    period: string;
    previousValue: number;
    currentValue: number;
    variance: number;
    percentageVariance: number;
    emoji: string;
    trend: string;
  }>;
  summary: {
    overallEmoji: string;
    overallTrend: string;
    positiveChanges: number;
    negativeChanges: number;
    stableChanges: number;
    averagePercentageVariance: number;
  };
}): string {
  // Generate HTML cards for each period
  const periodCards = analysis.results.map((r, index) => {
    const changeStr = r.variance > 0 ? `+${r.variance.toLocaleString()}` : r.variance.toLocaleString();
    const percentStr = r.percentageVariance > 0 ? `+${r.percentageVariance.toFixed(1)}%` : `${r.percentageVariance.toFixed(1)}%`;
    
    // Color coding based on performance
    const cardColor = r.variance > 0 ? '#dcfce7' : r.variance < 0 ? '#fef2f2' : '#f8fafc';
    const borderColor = r.variance > 0 ? '#16a34a' : r.variance < 0 ? '#dc2626' : '#64748b';
    
    return `
      <div style="
        background: ${cardColor}; 
        border: 2px solid ${borderColor}; 
        border-radius: 8px; 
        padding: 12px; 
        margin: 8px 0; 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
            ${r.emoji} Period ${index + 1}: ${r.period}
          </div>
          <div style="font-size: 14px; color: #6b7280;">
            ${r.previousValue.toLocaleString()} → ${r.currentValue.toLocaleString()}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 600; font-size: 16px; color: ${r.variance > 0 ? '#16a34a' : r.variance < 0 ? '#dc2626' : '#64748b'};">
            ${changeStr}
          </div>
          <div style="font-size: 14px; color: #6b7280;">
            ${percentStr} • ${r.trend}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Summary card
  const summaryCard = `
    <div style="
      background: #f1f5f9; 
      border: 2px solid #3b82f6; 
      border-radius: 8px; 
      padding: 16px; 
      margin: 16px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="font-weight: 600; color: #1f2937; margin-bottom: 12px; font-size: 16px;">
        📈 ${analysis.metricName} ${analysis.periodType} Summary
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
        <div>
          <span style="color: #16a34a; font-weight: 600;">↗️ Positive:</span> ${analysis.summary.positiveChanges} periods
        </div>
        <div>
          <span style="color: #dc2626; font-weight: 600;">↘️ Negative:</span> ${analysis.summary.negativeChanges} periods
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">➡️ Stable:</span> ${analysis.summary.stableChanges} periods
        </div>
        <div>
          <span style="color: #3b82f6; font-weight: 600;">📊 Avg Change:</span> ${analysis.summary.averagePercentageVariance.toFixed(1)}%
        </div>
      </div>
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #cbd5e1;">
        <span style="font-weight: 600; color: #1f2937;">Overall Trend:</span>
        <span style="color: #3b82f6;">${analysis.summary.overallEmoji} ${analysis.summary.overallTrend}</span>
      </div>
    </div>
  `;

  return `
    <div style="max-width: 100%; margin: 16px 0;">
      <div style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        📊 ${analysis.metricName} ${analysis.periodType} Analysis
      </div>
      ${periodCards}
      ${summaryCard}
    </div>
  `;
}
