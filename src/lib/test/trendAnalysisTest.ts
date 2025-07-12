/**
 * Trend Analysis Analyzer Test Suite
 * Tests trend detection, moving averages, and HTML formatting
 */

import { 
  calculateTrendAnalysis, 
  TrendAnalysisArgs, 
  TrendAnalysis,
  formatTrendPercentage,
  formatTrendValue
} from '../analyzers/trendAnalysis';

export function testTrendAnalysis() {
  console.log('📈 Testing Trend Analysis Analyzer...');

  // Test Case 1: Strong Upward Trend (Sales Growth)
  const salesGrowth: TrendAnalysisArgs = {
    data: [
      { period: '2024-01', value: 50000, category: 'Sales' },
      { period: '2024-02', value: 55000, category: 'Sales' },
      { period: '2024-03', value: 62000, category: 'Sales' },
      { period: '2024-04', value: 68000, category: 'Sales' },
      { period: '2024-05', value: 75000, category: 'Sales' },
      { period: '2024-06', value: 82000, category: 'Sales' },
      { period: '2024-07', value: 89000, category: 'Sales' }
    ],
    metricName: 'Monthly Sales Revenue',
    windowSize: 3,
    trendType: 'simple'
  };

  // Test Case 2: Volatile Mixed Trend (Stock-like Data)
  const volatileData: TrendAnalysisArgs = {
    data: [
      { period: 'Week 1', value: 1200, category: 'Stock Price' },
      { period: 'Week 2', value: 1350, category: 'Stock Price' },
      { period: 'Week 3', value: 1180, category: 'Stock Price' },
      { period: 'Week 4', value: 1420, category: 'Stock Price' },
      { period: 'Week 5', value: 1290, category: 'Stock Price' },
      { period: 'Week 6', value: 1380, category: 'Stock Price' },
      { period: 'Week 7', value: 1450, category: 'Stock Price' },
      { period: 'Week 8', value: 1320, category: 'Stock Price' }
    ],
    metricName: 'Weekly Stock Performance',
    windowSize: 4,
    trendType: 'exponential'
  };

  // Test Case 3: Declining Trend (User Churn)
  const decliningTrend: TrendAnalysisArgs = {
    data: [
      { period: 'Q1 2024', value: 95000, category: 'Active Users' },
      { period: 'Q2 2024', value: 92000, category: 'Active Users' },
      { period: 'Q3 2024', value: 88000, category: 'Active Users' },
      { period: 'Q4 2024', value: 85000, category: 'Active Users' },
      { period: 'Q1 2025', value: 82000, category: 'Active Users' },
      { period: 'Q2 2025', value: 79000, category: 'Active Users' }
    ],
    metricName: 'Quarterly Active Users',
    windowSize: 3,
    trendType: 'simple'
  };

  const test1 = calculateTrendAnalysis(salesGrowth);
  const test2 = calculateTrendAnalysis(volatileData);
  const test3 = calculateTrendAnalysis(decliningTrend);

  return { test1, test2, test3 };
}

/**
 * Format Trend Analysis results as clean HTML cards
 * Uses the same card-based format as other analyzers for consistency
 */
export function formatTrendAnalysisTable(analysis: TrendAnalysis): string {
  const { metricName, results, summary, windowSize, trendType } = analysis;
  
  // Generate individual period trend cards
  const trendCards = results.map(result => {
    const trendColor = result.trendDirection === 'upward' ? '#d1fae5' : 
                      result.trendDirection === 'stable' ? '#dbeafe' : '#fee2e2';
    const borderColor = result.trendDirection === 'upward' ? '#10b981' : 
                       result.trendDirection === 'stable' ? '#3b82f6' : '#ef4444';
    
    const strengthIndicator = result.trendStrength === 'strong' ? '💪' :
                             result.trendStrength === 'moderate' ? '👍' : '👌';
    
    return `
      <div style="background: ${trendColor}; border-left: 4px solid ${borderColor}; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 16px; color: #1f2937;">${result.emoji} ${result.period}</strong>
          <span style="font-size: 14px; color: #6b7280;">${strengthIndicator} ${result.description}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 10px;">
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Actual Value</div>
            <div style="font-size: 18px; font-weight: bold; color: #1f2937;">${formatTrendValue(result.value)}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Moving Avg</div>
            <div style="font-size: 18px; font-weight: bold; color: #6b7280;">${formatTrendValue(result.movingAverage)}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Trend Strength</div>
            <div style="font-size: 16px; font-weight: bold; color: ${borderColor};">
              ${result.trendStrength.toUpperCase()}
            </div>
          </div>
        </div>
        <div style="text-align: center; background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px;">
          <span style="font-size: 16px; font-weight: bold; color: ${result.percentChange >= 0 ? '#10b981' : '#ef4444'};">
            ${formatTrendPercentage(result.percentChange)} vs Moving Avg
          </span>
        </div>
      </div>
    `;
  }).join('');

  // Generate trend summary card
  const overallTrendColor = summary.overallTrend === 'upward' ? '#10b981' :
                           summary.overallTrend === 'downward' ? '#ef4444' :
                           summary.overallTrend === 'stable' ? '#3b82f6' : '#6b7280';
  
  const momentumIcon = summary.currentMomentum === 'accelerating' ? '⚡' :
                      summary.currentMomentum === 'decelerating' ? '🐌' : '⚖️';

  const summaryCard = `
    <div style="background: #f8fafc; border: 2px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px;">
      <h4 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">📊 Trend Analysis Summary</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div style="text-align: center; background: white; padding: 12px; border-radius: 6px;">
          <div style="font-size: 12px; color: #6b7280;">Overall Trend</div>
          <div style="font-size: 20px; font-weight: bold; color: ${overallTrendColor};">
            ${summary.overallTrend.toUpperCase()}
          </div>
        </div>
        <div style="text-align: center; background: white; padding: 12px; border-radius: 6px;">
          <div style="font-size: 12px; color: #6b7280;">Trend Score</div>
          <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">
            ${Math.round(summary.trendScore)}/100
          </div>
        </div>
        <div style="text-align: center; background: white; padding: 12px; border-radius: 6px;">
          <div style="font-size: 12px; color: #6b7280;">Consistency</div>
          <div style="font-size: 20px; font-weight: bold; color: #8b5cf6;">
            ${Math.round(summary.trendConsistency)}%
          </div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div style="text-align: center; background: #e0f2fe; padding: 10px; border-radius: 6px;">
          <div style="font-size: 12px; color: #0277bd;">Avg Growth Rate</div>
          <div style="font-size: 16px; font-weight: bold; color: #0277bd;">
            ${formatTrendPercentage(summary.averageGrowthRate)}
          </div>
        </div>
        <div style="text-align: center; background: #f3e8ff; padding: 10px; border-radius: 6px;">
          <div style="font-size: 12px; color: #7c3aed;">Strong Trends</div>
          <div style="font-size: 16px; font-weight: bold; color: #7c3aed;">
            ${summary.strongTrendPeriods} periods
          </div>
        </div>
        <div style="text-align: center; background: #fef3c7; padding: 10px; border-radius: 6px;">
          <div style="font-size: 12px; color: #d97706;">Current Momentum</div>
          <div style="font-size: 14px; font-weight: bold; color: #d97706;">
            ${momentumIcon} ${summary.currentMomentum.toUpperCase()}
          </div>
        </div>
      </div>
      <div style="text-align: center; background: #f1f5f9; padding: 12px; border-radius: 6px;">
        <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">
          <strong>Analysis Parameters:</strong> ${windowSize}-period ${trendType} moving average
        </div>
        <div style="font-size: 14px; color: #64748b;">
          <strong>Volatility:</strong> ${summary.volatility.toFixed(1)}% | 
          <strong>Periods Analyzed:</strong> ${results.length} of ${analysis.totalPeriods}
        </div>
      </div>
    </div>
  `;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h3 style="color: #1e40af; margin-bottom: 20px; font-size: 20px;">📈 ${metricName} - Trend Analysis</h3>
      ${trendCards}
      ${summaryCard}
    </div>
  `;
}
