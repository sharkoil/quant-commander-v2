// Creates HTML visualization for budget variance analysis
// Generates interactive charts and tables from processed data
// Uses high-contrast colors for optimal readability

import { BudgetVarianceDataPoint, ProcessingResult } from '../analyzers/budgetVarianceProcessor';

/**
 * Generates HTML visualization for budget variance data with enhanced summary
 * @param result - Processing result with data points and summary
 * @param budgetColumn - Name of budget column for labeling
 * @param actualColumn - Name of actual column for labeling
 * @returns HTML string for visualization
 */
export const generateBudgetVarianceVisualization = (
  result: ProcessingResult,
  budgetColumn: string,
  actualColumn: string
): string => {
  const { dataPoints, summary } = result;
  
  if (dataPoints.length === 0) {
    return '<div class="text-orange-600 p-4 font-medium">No data available for budget variance analysis</div>';
  }

  const totalBudget = dataPoints.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = dataPoints.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalActual - totalBudget;
  const totalVariancePercentage = totalBudget === 0 ? 0 : (totalVariance / totalBudget) * 100;

  let html = `
    <div class="space-y-4">
      <div class="bg-gray-50 p-4 rounded-lg border">
        <h3 class="text-base font-semibold text-gray-900 mb-3">
          ${budgetColumn} vs ${actualColumn} Analysis
        </h3>
        <div class="grid grid-cols-3 gap-4 text-sm mb-4">
          <div class="text-center p-3 bg-blue-50 rounded-lg">
            <div class="text-xs font-medium text-gray-900 mb-1">Total ${budgetColumn}</div>
            <div class="text-lg font-bold text-blue-700">
              ${formatCurrency(totalBudget)}
            </div>
          </div>
          <div class="text-center p-3 bg-green-50 rounded-lg">
            <div class="text-xs font-medium text-gray-900 mb-1">Total ${actualColumn}</div>
            <div class="text-lg font-bold text-green-700">
              ${formatCurrency(totalActual)}
            </div>
          </div>
          <div class="text-center p-3 ${totalVariance >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg">
            <div class="text-xs font-medium text-gray-900 mb-1">Total Variance</div>
            <div class="text-lg font-bold ${totalVariance >= 0 ? 'text-green-700' : 'text-red-700'}">
              ${formatCurrency(totalVariance)}
            </div>
            <div class="text-sm font-medium ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}">
              (${totalVariancePercentage.toFixed(1)}%)
            </div>
          </div>
        </div>
        
        <!-- Data Summary -->
        <div class="text-sm text-gray-800 border-t pt-3 bg-white p-3 rounded border">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="font-medium text-gray-900">Data Range:</span> 
              <span class="text-gray-800">${summary.dateRange.start.toLocaleDateString()} - ${summary.dateRange.end.toLocaleDateString()}</span>
            </div>
            <div>
              <span class="font-medium text-gray-900">Periods Found:</span> 
              <span class="text-gray-800">${summary.periodsFound} of ${summary.expectedPeriods} expected (${summary.totalRows} total rows)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Period Breakdown Table -->
      <div class="overflow-x-auto bg-white rounded-lg border">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-900">Period</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-900">${budgetColumn}</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-900">${actualColumn}</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-900">Variance</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody>`;

  dataPoints.forEach((item, index) => {
    const statusColor = item.status === 'favorable' ? 'text-green-700' : 
                       item.status === 'unfavorable' ? 'text-red-700' : 'text-gray-700';
    const statusBg = item.status === 'favorable' ? 'bg-green-50' : 
                    item.status === 'unfavorable' ? 'bg-red-50' : 'bg-gray-50';
    const statusIcon = item.status === 'favorable' ? '✅' : 
                      item.status === 'unfavorable' ? '❌' : '➖';
    
    html += `
      <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors">
        <td class="px-4 py-3 font-medium text-gray-900 border-b">${item.period}</td>
        <td class="px-4 py-3 text-right text-blue-700 font-medium border-b">${formatCurrency(item.budget)}</td>
        <td class="px-4 py-3 text-right text-green-700 font-medium border-b">${formatCurrency(item.actual)}</td>
        <td class="px-4 py-3 text-right font-medium border-b">
          <span class="${item.variance >= 0 ? 'text-green-700' : 'text-red-700'}">
            ${formatCurrency(item.variance)}
          </span>
          <div class="text-xs ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}">
            (${item.variancePercentage.toFixed(1)}%)
          </div>
        </td>
        <td class="px-4 py-3 text-center border-b">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}">
            ${statusIcon} ${item.status}
          </span>
        </td>
      </tr>`;
  });

  html += `
          </tbody>
        </table>
      </div>
    </div>`;

  return html;
};

/**
 * Generates HTML row for individual variance data point
 * @param item - Single budget variance data point
 * @returns HTML string for variance row
 */
const generateVarianceRow = (item: BudgetVarianceDataPoint): string => {
  const statusColor = getStatusColor(item.status);
  const varianceIcon = item.variance >= 0 ? '↗️' : '↘️';

  return `
    <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div class="flex items-center space-x-3">
        <div class="w-2 h-2 ${statusColor} rounded-full"></div>
        <div>
          <div class="text-sm font-medium text-gray-800">${item.period}</div>
          <div class="text-xs text-gray-500">${item.status}</div>
        </div>
      </div>
      
      <div class="flex items-center space-x-6 text-sm">
        <div class="text-right">
          <div class="text-xs text-gray-500">Budget</div>
          <div class="font-medium text-blue-600">${formatCurrency(item.budget)}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-500">Actual</div>
          <div class="font-medium text-green-600">${formatCurrency(item.actual)}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-gray-500">Variance</div>
          <div class="font-medium ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}">
            ${varianceIcon} ${formatCurrency(Math.abs(item.variance))} (${Math.abs(item.variancePercentage).toFixed(1)}%)
          </div>
        </div>
      </div>
    </div>
  `;
};

/**
 * Gets CSS color class for variance status
 * @param status - Variance status
 * @returns CSS color class
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'favorable':
      return 'bg-green-500';
    case 'unfavorable':
      return 'bg-red-500';
    default:
      return 'bg-yellow-500';
  }
};

/**
 * Formats number as currency
 * @param amount - Number to format
 * @returns Formatted currency string
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
