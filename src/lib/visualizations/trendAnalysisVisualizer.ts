/**
 * Trend Analysis Visualizer
 * 
 * Creates beautiful HTML output for trend analysis results that matches
 * the card-style design of other analyzers like Budget Variance and Period Variance.
 */

import { TrendAnalysisResult } from '../analyzers/trendAnalysisProcessor';
import { formatTrendPercentage, formatTrendValue } from '../analyzers/trendAnalysis';

export function generateTrendAnalysisVisualization(result: TrendAnalysisResult): string {
  const { analysis, metricName, params } = result;
  const { results, summary } = analysis;

  if (results.length === 0) {
    return `
<div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 12px 0;">
  <h4 style="color: #dc2626; margin: 0 0 8px 0; font-weight: 600;">
    ⚠️ No Trend Analysis Data Available
  </h4>
  <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
    Unable to calculate trend analysis - insufficient data or invalid parameters.
  </p>
</div>`;
  }

  // Calculate summary statistics
  const totalPeriods = results.length;
  const upwardTrends = results.filter(r => r.trendDirection === 'upward').length;
  const downwardTrends = results.filter(r => r.trendDirection === 'downward').length;
  const stableTrends = results.filter(r => r.trendDirection === 'stable').length;
  
  // Determine overall trend indicator
  const trendDirection = summary.overallTrend;
  const trendIndicator = trendDirection === 'upward' ? '📈' : 
                        trendDirection === 'downward' ? '📉' : 
                        trendDirection === 'stable' ? '➡️' : '📊';

  // Format individual period data
  const dataRows = results.map((item) => {
    const trendColor = item.trendDirection === 'upward' ? '#059669' : 
                      item.trendDirection === 'downward' ? '#dc2626' : '#6b7280';
    
    const strengthIcon = item.trendStrength === 'strong' ? '💪' :
                        item.trendStrength === 'moderate' ? '👍' : '👌';

    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 16px; font-weight: 500; color: #374151;">${item.period}</td>
        <td style="padding: 12px 16px; text-align: right; font-family: monospace; color: #1f2937;">
          ${formatTrendValue(item.value)}
        </td>
        <td style="padding: 12px 16px; text-align: right; font-family: monospace; color: #6b7280;">
          ${formatTrendValue(item.movingAverage)}
        </td>
        <td style="padding: 12px 16px; text-align: right; font-family: monospace; color: ${trendColor};">
          ${formatTrendPercentage(item.percentChange)}
        </td>
        <td style="padding: 12px 16px; text-align: center; color: ${trendColor};">
          ${item.emoji} ${item.trendDirection.charAt(0).toUpperCase() + item.trendDirection.slice(1)}
        </td>
        <td style="padding: 12px 16px; text-align: center; font-size: 12px;">
          ${strengthIcon} ${item.trendStrength.charAt(0).toUpperCase() + item.trendStrength.slice(1)}
        </td>
      </tr>`;
  }).join('');

  // Momentum indicator
  const momentumIcon = summary.currentMomentum === 'accelerating' ? '⚡' :
                      summary.currentMomentum === 'decelerating' ? '🐌' : '⚖️';

  return `
<div style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
  
  <!-- Header Section -->
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 20px; color: white;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
      <h3 style="margin: 0; font-size: 18px; font-weight: 600;">
        📈 Trend Analysis - ${params.valueColumn}
      </h3>
      <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
        ${trendIndicator} ${summary.overallTrend.charAt(0).toUpperCase() + summary.overallTrend.slice(1)} Trend
      </span>
    </div>
    <p style="margin: 0; opacity: 0.9; font-size: 14px;">
      ${params.windowSize}-period ${params.trendType} moving average analysis
    </p>
  </div>

  <!-- Summary Cards -->
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Trend Score</div>
      <div style="color: #1f2937; font-size: 20px; font-weight: 700;">${Math.round(summary.trendScore)}/100</div>
    </div>
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Consistency</div>
      <div style="color: #1f2937; font-size: 20px; font-weight: 700;">${Math.round(summary.trendConsistency)}%</div>
    </div>
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Upward Trends</div>
      <div style="color: #059669; font-size: 20px; font-weight: 700;">${upwardTrends}</div>
    </div>
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Downward Trends</div>
      <div style="color: #dc2626; font-size: 20px; font-weight: 700;">${downwardTrends}</div>
    </div>
  </div>

  <!-- Data Table -->
  <div style="overflow-x: auto;">
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">
          <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151; font-size: 14px;">Period</th>
          <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; font-size: 14px;">Actual Value</th>
          <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; font-size: 14px;">Moving Avg</th>
          <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; font-size: 14px;">Deviation</th>
          <th style="padding: 16px; text-align: center; font-weight: 600; color: #374151; font-size: 14px;">Trend Direction</th>
          <th style="padding: 16px; text-align: center; font-weight: 600; color: #374151; font-size: 14px;">Strength</th>
        </tr>
      </thead>
      <tbody>
        ${dataRows}
      </tbody>
    </table>
  </div>

  <!-- Advanced Insights Footer -->
  <div style="background: #f9fafb; padding: 16px; border-top: 1px solid #e5e7eb;">
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 12px;">
      <div style="text-align: center; background: #fff7ed; padding: 10px; border-radius: 6px;">
        <div style="color: #ea580c; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Avg Growth Rate</div>
        <div style="color: #ea580c; font-size: 16px; font-weight: 700;">
          ${formatTrendPercentage(summary.averageGrowthRate)}
        </div>
      </div>
      <div style="text-align: center; background: #f0f9ff; padding: 10px; border-radius: 6px;">
        <div style="color: #0369a1; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Strong Trends</div>
        <div style="color: #0369a1; font-size: 16px; font-weight: 700;">
          ${summary.strongTrendPeriods} periods
        </div>
      </div>
      <div style="text-align: center; background: #fefce8; padding: 10px; border-radius: 6px;">
        <div style="color: #ca8a04; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 2px;">Current Momentum</div>
        <div style="color: #ca8a04; font-size: 14px; font-weight: 700;">
          ${momentumIcon} ${summary.currentMomentum.charAt(0).toUpperCase() + summary.currentMomentum.slice(1)}
        </div>
      </div>
    </div>
    
    <div style="display: flex; align-items: center; justify-content: between; flex-wrap: wrap; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Analysis Type:</span>
        <span style="color: #374151; font-size: 14px; font-weight: 600;">
          ${params.windowSize}-Period ${params.trendType.charAt(0).toUpperCase() + params.trendType.slice(1)} Moving Average
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #6b7280; font-size: 14px; font-weight: 500;">Volatility:</span>
        <span style="color: #374151; font-size: 14px; font-weight: 600;">
          ${summary.volatility.toFixed(1)}% ${trendIndicator}
        </span>
      </div>
    </div>
  </div>
</div>`;
}
