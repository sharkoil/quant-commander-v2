import { PeriodVarianceResult } from '../analyzers/periodVarianceProcessor';

export function generatePeriodVarianceVisualization(result: PeriodVarianceResult): string {
  const { title, data } = result;

  if (data.length === 0) {
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
  const periods = data.length;
  const validVariances = data.filter(d => d.variance !== null);
  const avgVariance = validVariances.length > 0 
    ? validVariances.reduce((sum, d) => sum + Math.abs(d.variance!), 0) / validVariances.length 
    : 0;
  
  const positiveVariances = validVariances.filter(d => d.variance! > 0).length;
  const negativeVariances = validVariances.filter(d => d.variance! < 0).length;
  
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
  const dataRows = data.map((item, index) => {
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

  // Determine period type from first period string
  let periodType = 'period';
  if (data.length > 0) {
    const firstPeriod = data[0].period;
    if (firstPeriod.includes('Q')) periodType = 'quarterly';
    else if (firstPeriod.match(/^\d{4}-\d{2}$/)) periodType = 'monthly';
    else if (firstPeriod.match(/^\d{4}-\d{2}-\d{2}$/)) periodType = 'weekly';
    else if (firstPeriod.match(/^\d{4}$/)) periodType = 'yearly';
  }

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
      ${periodType.charAt(0).toUpperCase()}${periodType.slice(1)} analysis across ${periods} periods
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
          ${periodType} Period Variance
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
}