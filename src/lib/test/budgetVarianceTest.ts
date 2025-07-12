/**
 * Budget vs Actual Variance Analyzer Test Suite
 * Tests the budget variance calculation and HTML formatting
 */

import { 
  calculateBudgetVariance, 
  BudgetVarianceArgs, 
  BudgetVarianceAnalysis,
  formatCurrency,
  formatPercentage
} from '../analyzers/budgetVariance';

export function testBudgetVariance() {
  console.log('🎯 Testing Budget vs Actual Variance Analyzer...');

  // Test Case 1: Quarterly Revenue Analysis (Mixed Performance)
  const quarterlyRevenue: BudgetVarianceArgs = {
    data: [
      { period: '2024-Q1', actual: 275000, budget: 250000, category: 'Revenue' },
      { period: '2024-Q2', actual: 320000, budget: 300000, category: 'Revenue' },
      { period: '2024-Q3', actual: 280000, budget: 320000, category: 'Revenue' },
      { period: '2024-Q4', actual: 410000, budget: 380000, category: 'Revenue' }
    ],
    metricName: 'Quarterly Revenue',
    analysisType: 'both'
  };

  // Test Case 2: Monthly Sales Performance (Strong Performance)
  const monthlySales: BudgetVarianceArgs = {
    data: [
      { period: 'Jan 2024', actual: 85000, budget: 80000, category: 'Sales' },
      { period: 'Feb 2024', actual: 92000, budget: 85000, category: 'Sales' },
      { period: 'Mar 2024', actual: 88000, budget: 90000, category: 'Sales' },
      { period: 'Apr 2024', actual: 95000, budget: 88000, category: 'Sales' }
    ],
    metricName: 'Monthly Sales',
    analysisType: 'favorable'
  };

  // Test Case 3: Department Budget Performance (Challenging Performance)
  const departmentBudget: BudgetVarianceArgs = {
    data: [
      { period: 'Q1 Marketing', actual: 45000, budget: 50000, category: 'Marketing' },
      { period: 'Q1 Operations', actual: 120000, budget: 110000, category: 'Operations' },
      { period: 'Q1 R&D', actual: 75000, budget: 85000, category: 'R&D' },
      { period: 'Q1 Sales', actual: 95000, budget: 90000, category: 'Sales' }
    ],
    metricName: 'Department Budget',
    analysisType: 'both'
  };

  const test1 = calculateBudgetVariance(quarterlyRevenue);
  const test2 = calculateBudgetVariance(monthlySales);
  const test3 = calculateBudgetVariance(departmentBudget);

  return { test1, test2, test3 };
}

/**
 * Format Budget Variance Analysis results as clean HTML cards
 * Uses the same card-based format as Period Variance for consistency
 */
export function formatBudgetVarianceTable(analysis: BudgetVarianceAnalysis): string {
  const { metricName, results, summary } = analysis;
  
  // Generate individual period cards
  const periodCards = results.map(result => {
    const varianceColor = result.performance === 'favorable' ? '#d1fae5' : 
                         result.performance === 'on-target' ? '#dbeafe' : '#fee2e2';
    const borderColor = result.performance === 'favorable' ? '#10b981' : 
                       result.performance === 'on-target' ? '#3b82f6' : '#ef4444';
    
    return `
      <div style="background: ${varianceColor}; border-left: 4px solid ${borderColor}; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 16px; color: #1f2937;">${result.emoji} ${result.period}</strong>
          <span style="font-size: 14px; color: #6b7280;">${result.description}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 10px;">
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Actual</div>
            <div style="font-size: 18px; font-weight: bold; color: #1f2937;">${formatCurrency(result.actualValue)}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Budget</div>
            <div style="font-size: 18px; font-weight: bold; color: #1f2937;">${formatCurrency(result.budgetValue)}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">Variance</div>
            <div style="font-size: 18px; font-weight: bold; color: ${result.variance >= 0 ? '#10b981' : '#ef4444'};">
              ${formatCurrency(result.variance)}
            </div>
          </div>
        </div>
        <div style="text-align: center; background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px;">
          <span style="font-size: 16px; font-weight: bold; color: ${result.percentageVariance >= 0 ? '#10b981' : '#ef4444'};">
            ${formatPercentage(result.percentageVariance)}
          </span>
        </div>
      </div>
    `;
  }).join('');

  // Generate summary card
  const summaryCard = `
    <div style="background: #f8fafc; border: 2px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 20px;">
      <h4 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">📊 Analysis Summary</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div style="text-align: center; background: white; padding: 12px; border-radius: 6px;">
          <div style="font-size: 12px; color: #6b7280;">Overall Performance</div>
          <div style="font-size: 20px; font-weight: bold; color: ${summary.overallPercentageVariance >= 0 ? '#10b981' : '#ef4444'};">
            ${formatPercentage(summary.overallPercentageVariance)}
          </div>
        </div>
        <div style="text-align: center; background: white; padding: 12px; border-radius: 6px;">
          <div style="font-size: 12px; color: #6b7280;">Performance Score</div>
          <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">
            ${Math.round(summary.performanceScore)}/100
          </div>
        </div>
        <div style="text-align: center; background: white; padding: 12px; border-radius: 6px;">
          <div style="font-size: 12px; color: #6b7280;">Total Variance</div>
          <div style="font-size: 20px; font-weight: bold; color: ${summary.overallVariance >= 0 ? '#10b981' : '#ef4444'};">
            ${formatCurrency(summary.overallVariance)}
          </div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
        <div style="text-align: center; background: #d1fae5; padding: 10px; border-radius: 6px;">
          <div style="font-size: 12px; color: #065f46;">Favorable</div>
          <div style="font-size: 16px; font-weight: bold; color: #065f46;">${summary.favorablePeriods} periods</div>
        </div>
        <div style="text-align: center; background: #dbeafe; padding: 10px; border-radius: 6px;">
          <div style="font-size: 12px; color: #1e40af;">On Target</div>
          <div style="font-size: 16px; font-weight: bold; color: #1e40af;">${summary.onTargetPeriods} periods</div>
        </div>
        <div style="text-align: center; background: #fee2e2; padding: 10px; border-radius: 6px;">
          <div style="font-size: 12px; color: #dc2626;">Unfavorable</div>
          <div style="font-size: 16px; font-weight: bold; color: #dc2626;">${summary.unfavorablePeriods} periods</div>
        </div>
      </div>
      <div style="margin-top: 15px; text-align: center; font-size: 14px; color: #6b7280;">
        <strong>Total Actual:</strong> ${formatCurrency(summary.totalActual)} | 
        <strong>Total Budget:</strong> ${formatCurrency(summary.totalBudget)} | 
        <strong>Avg Variance:</strong> ${formatPercentage(summary.averageVariance)}
      </div>
    </div>
  `;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h3 style="color: #1e40af; margin-bottom: 20px; font-size: 20px;">🎯 ${metricName} - Budget vs Actual Analysis</h3>
      ${periodCards}
      ${summaryCard}
    </div>
  `;
}
