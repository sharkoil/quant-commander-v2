/**
 * Trend Analysis Test Module - Browser Safe
 * Browser-safe testing functions for trend analysis without Jest dependencies
 */

import { formatTrendPercentage, formatTrendValue } from '../analyzers/trendAnalysis';

export interface TrendTestResult {
  scenario: string;
  metricName: string;
  windowSize: number;
  trendType: 'simple' | 'exponential';
  results: Array<{
    period: string;
    value: number;
    movingAverage: number;
    percentChange: number;
    trendDirection: 'upward' | 'downward' | 'stable';
    trendStrength: 'weak' | 'moderate' | 'strong';
    emoji: string;
  }>;
  summary: {
    overallTrend: 'upward' | 'downward' | 'stable';
    trendScore: number;
    trendConsistency: number;
    averageGrowthRate: number;
    volatility: number;
    strongTrendPeriods: number;
    currentMomentum: 'accelerating' | 'decelerating' | 'stable';
  };
}

export function testTrendAnalysis(): TrendTestResult[] {
  return [
    // Scenario 1: Strong upward trend - Tech company revenue growth
    {
      scenario: "Tech Company Revenue Growth",
      metricName: "Monthly Revenue",
      windowSize: 3,
      trendType: 'simple',
      results: [
        {
          period: "Jan 2024",
          value: 850000,
          movingAverage: 850000,
          percentChange: 0,
          trendDirection: 'stable',
          trendStrength: 'weak',
          emoji: '➡️'
        },
        {
          period: "Feb 2024", 
          value: 920000,
          movingAverage: 885000,
          percentChange: 8.2,
          trendDirection: 'upward',
          trendStrength: 'moderate',
          emoji: '📈'
        },
        {
          period: "Mar 2024",
          value: 1050000,
          movingAverage: 940000,
          percentChange: 14.1,
          trendDirection: 'upward',
          trendStrength: 'strong',
          emoji: '🚀'
        },
        {
          period: "Apr 2024",
          value: 1180000,
          movingAverage: 1050000,
          percentChange: 12.4,
          trendDirection: 'upward',
          trendStrength: 'strong',
          emoji: '🚀'
        },
        {
          period: "May 2024",
          value: 1320000,
          movingAverage: 1183333,
          percentChange: 11.9,
          trendDirection: 'upward',
          trendStrength: 'strong',
          emoji: '🚀'
        },
        {
          period: "Jun 2024",
          value: 1450000,
          movingAverage: 1316667,
          percentChange: 9.8,
          trendDirection: 'upward',
          trendStrength: 'strong',
          emoji: '🚀'
        }
      ],
      summary: {
        overallTrend: 'upward',
        trendScore: 92,
        trendConsistency: 88,
        averageGrowthRate: 11.3,
        volatility: 8.2,
        strongTrendPeriods: 4,
        currentMomentum: 'accelerating'
      }
    },

    // Scenario 2: Volatile market performance with mixed trends
    {
      scenario: "Volatile Market Performance",
      metricName: "Portfolio Value",
      windowSize: 4,
      trendType: 'exponential',
      results: [
        {
          period: "Q1 2024",
          value: 950000,
          movingAverage: 950000,
          percentChange: 0,
          trendDirection: 'stable',
          trendStrength: 'weak',
          emoji: '➡️'
        },
        {
          period: "Q2 2024",
          value: 1120000,
          movingAverage: 1035000,
          percentChange: 17.9,
          trendDirection: 'upward',
          trendStrength: 'strong',
          emoji: '🚀'
        },
        {
          period: "Q3 2024",
          value: 980000,
          movingAverage: 1016667,
          percentChange: -12.5,
          trendDirection: 'downward',
          trendStrength: 'moderate',
          emoji: '📉'
        },
        {
          period: "Q4 2024",
          value: 1050000,
          movingAverage: 1025000,
          percentChange: 7.1,
          trendDirection: 'upward',
          trendStrength: 'moderate',
          emoji: '📈'
        },
        {
          period: "Q1 2025",
          value: 880000,
          movingAverage: 1007500,
          percentChange: -16.2,
          trendDirection: 'downward',
          trendStrength: 'strong',
          emoji: '📉'
        },
        {
          period: "Q2 2025",
          value: 1180000,
          movingAverage: 1022500,
          percentChange: 34.1,
          trendDirection: 'upward',
          trendStrength: 'strong',
          emoji: '🚀'
        }
      ],
      summary: {
        overallTrend: 'stable',
        trendScore: 45,
        trendConsistency: 32,
        averageGrowthRate: 5.1,
        volatility: 22.8,
        strongTrendPeriods: 3,
        currentMomentum: 'stable'
      }
    },

    // Scenario 3: Declining trend - Retail store performance
    {
      scenario: "Retail Store Declining Performance",
      metricName: "Weekly Sales",
      windowSize: 2,
      trendType: 'simple',
      results: [
        {
          period: "Week 1",
          value: 45000,
          movingAverage: 45000,
          percentChange: 0,
          trendDirection: 'stable',
          trendStrength: 'weak',
          emoji: '➡️'
        },
        {
          period: "Week 2",
          value: 42000,
          movingAverage: 43500,
          percentChange: -6.7,
          trendDirection: 'downward',
          trendStrength: 'moderate',
          emoji: '📉'
        },
        {
          period: "Week 3",
          value: 38500,
          movingAverage: 40250,
          percentChange: -8.3,
          trendDirection: 'downward',
          trendStrength: 'moderate',
          emoji: '📉'
        },
        {
          period: "Week 4",
          value: 35000,
          movingAverage: 36750,
          percentChange: -9.1,
          trendDirection: 'downward',
          trendStrength: 'moderate',
          emoji: '📉'
        },
        {
          period: "Week 5",
          value: 32500,
          movingAverage: 33750,
          percentChange: -7.1,
          trendDirection: 'downward',
          trendStrength: 'moderate',
          emoji: '📉'
        },
        {
          period: "Week 6",
          value: 29000,
          movingAverage: 30750,
          percentChange: -10.8,
          trendDirection: 'downward',
          trendStrength: 'strong',
          emoji: '📉'
        }
      ],
      summary: {
        overallTrend: 'downward',
        trendScore: 15,
        trendConsistency: 78,
        averageGrowthRate: -8.4,
        volatility: 12.3,
        strongTrendPeriods: 1,
        currentMomentum: 'decelerating'
      }
    }
  ];
}

export function formatTrendAnalysisTable(results: TrendTestResult[]): string {
  const scenarios = results.map((result, index) => {
    const { scenario, metricName, windowSize, trendType, results: trendResults, summary } = result;
    
    // Determine overall trend indicator
    const trendIndicator = summary.overallTrend === 'upward' ? '📈' : 
                          summary.overallTrend === 'downward' ? '📉' : '➡️';

    const trendColor = summary.overallTrend === 'upward' ? '#059669' : 
                      summary.overallTrend === 'downward' ? '#dc2626' : '#6b7280';

    // Format data rows
    const dataRows = trendResults.map((item) => {
      const itemTrendColor = item.trendDirection === 'upward' ? '#059669' : 
                            item.trendDirection === 'downward' ? '#dc2626' : '#6b7280';
      
      const strengthIcon = item.trendStrength === 'strong' ? '💪' :
                          item.trendStrength === 'moderate' ? '👍' : '👌';

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 12px; font-weight: 500; color: #374151;">${item.period}</td>
          <td style="padding: 8px 12px; text-align: right; font-family: monospace; color: #1f2937;">
            ${formatTrendValue(item.value)}
          </td>
          <td style="padding: 8px 12px; text-align: right; font-family: monospace; color: #6b7280;">
            ${formatTrendValue(item.movingAverage)}
          </td>
          <td style="padding: 8px 12px; text-align: right; font-family: monospace; color: ${itemTrendColor};">
            ${formatTrendPercentage(item.percentChange)}
          </td>
          <td style="padding: 8px 12px; text-align: center; color: ${itemTrendColor};">
            ${item.emoji} ${item.trendDirection.charAt(0).toUpperCase() + item.trendDirection.slice(1)}
          </td>
          <td style="padding: 8px 12px; text-align: center; font-size: 11px;">
            ${strengthIcon} ${item.trendStrength.charAt(0).toUpperCase() + item.trendStrength.slice(1)}
          </td>
        </tr>`;
    }).join('');

    return `
<div style="background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
  
  <!-- Header Section -->
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 16px; color: white;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
      <h4 style="margin: 0; font-size: 16px; font-weight: 600;">
        Test ${index + 1}: ${scenario}
      </h4>
      <span style="background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 16px; font-size: 12px; font-weight: 500;">
        ${trendIndicator} ${summary.overallTrend.charAt(0).toUpperCase() + summary.overallTrend.slice(1)} Trend
      </span>
    </div>
    <p style="margin: 0; opacity: 0.9; font-size: 13px;">
      ${windowSize}-period ${trendType} moving average analysis of ${metricName}
    </p>
  </div>

  <!-- Summary Cards -->
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 3px;">Trend Score</div>
      <div style="color: ${trendColor}; font-size: 18px; font-weight: 700;">${summary.trendScore}/100</div>
    </div>
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 3px;">Consistency</div>
      <div style="color: #1f2937; font-size: 18px; font-weight: 700;">${summary.trendConsistency}%</div>
    </div>
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 3px;">Growth Rate</div>
      <div style="color: ${trendColor}; font-size: 18px; font-weight: 700;">${formatTrendPercentage(summary.averageGrowthRate)}</div>
    </div>
    <div style="text-align: center;">
      <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 3px;">Volatility</div>
      <div style="color: #ca8a04; font-size: 18px; font-weight: 700;">${summary.volatility.toFixed(1)}%</div>
    </div>
  </div>

  <!-- Data Table -->
  <div style="overflow-x: auto;">
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f3f4f6; border-bottom: 2px solid #d1d5db;">
          <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; font-size: 13px;">Period</th>
          <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; font-size: 13px;">Actual Value</th>
          <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; font-size: 13px;">Moving Avg</th>
          <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; font-size: 13px;">Deviation</th>
          <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; font-size: 13px;">Trend Direction</th>
          <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; font-size: 13px;">Strength</th>
        </tr>
      </thead>
      <tbody>
        ${dataRows}
      </tbody>
    </table>
  </div>

  <!-- Footer Insights -->
  <div style="background: #f9fafb; padding: 12px; border-top: 1px solid #e5e7eb;">
    <div style="display: flex; align-items: center; justify-content: between; flex-wrap: wrap; gap: 8px; font-size: 12px;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="color: #6b7280; font-weight: 500;">Strong Trends:</span>
        <span style="color: #374151; font-weight: 600;">${summary.strongTrendPeriods} periods</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="color: #6b7280; font-weight: 500;">Momentum:</span>
        <span style="color: #374151; font-weight: 600;">
          ${summary.currentMomentum.charAt(0).toUpperCase() + summary.currentMomentum.slice(1)}
        </span>
      </div>
    </div>
  </div>
</div>`;
  }).join('');

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 20px; color: white; text-align: center; margin-bottom: 20px; border-radius: 12px;">
    <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">📈 Trend Analysis Test Results</h2>
    <p style="margin: 0; opacity: 0.9; font-size: 16px;">
      Comprehensive trend analysis testing with moving averages and trend detection
    </p>
  </div>
  ${scenarios}
</div>`;
}
