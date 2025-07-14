// Creates HTML visualization for budget variance analysis
// Generates interactive charts and tables from processed data

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
    return '<div class="text-yellow-500 p-4">No data available for budget variance analysis</div>';
  }

  const totalBudget = dataPoints.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = dataPoints.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalActual - totalBudget;
  const totalVariancePercentage = totalBudget === 0 ? 0 : (totalVariance / totalBudget) * 100;

  let html = `
    <div class="space-y-4">
      <div class="bg-gray-50 p-3 rounded-lg border">
        <h3 class="text-sm font-semibold text-gray-700 mb-2">
          ${budgetColumn} vs ${actualColumn} Analysis
        </h3>
        <div class="grid grid-cols-3 gap-4 text-sm mb-3">
          <div class="text-center">
            <div class="text-xs text-gray-500">Total ${budgetColumn}</div>
            <div class="font-semibold text-blue-600">
              ${formatCurrency(totalBudget)}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-500">Total ${actualColumn}</div>
            <div class="font-semibold text-green-600">
              ${formatCurrency(totalActual)}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-500">Total Variance</div>
            <div class="font-semibold ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}">
              ${formatCurrency(totalVariance)} (${totalVariancePercentage.toFixed(1)}%)
            </div>
          </div>
        </div>
        
        <!-- Data Summary -->
        <div class="text-xs text-gray-600 border-t pt-2">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <strong>Data Range:</strong> ${summary.dateRange.start.toLocaleDateString()} - ${summary.dateRange.end.toLocaleDateString()}
            </div>
            <div>
              <strong>Periods Found:</strong> ${summary.periodsFound} of ${summary.expectedPeriods} expected (${summary.totalRows} total rows)
            </div>
          </div>
        </div>
      </div>

      <!-- Period Breakdown Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-xs">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-2 py-1 text-left font-medium text-gray-700">Period</th>
              <th class="px-2 py-1 text-right font-medium text-gray-700">${budgetColumn}</th>
              <th class="px-2 py-1 text-right font-medium text-gray-700">${actualColumn}</th>
              <th class="px-2 py-1 text-right font-medium text-gray-700">Variance</th>
              <th class="px-2 py-1 text-center font-medium text-gray-700">Status</th>
              <th class="px-2 py-1 text-center font-medium text-gray-700">Rows</th>
            </tr>
          </thead>
          <tbody>`;

  dataPoints.forEach((item, index) => {
    const statusColor = item.status === 'favorable' ? 'text-green-600' : 
                       item.status === 'unfavorable' ? 'text-red-600' : 'text-gray-600';
    const statusIcon = item.status === 'favorable' ? '✅' : 
                      item.status === 'unfavorable' ? '❌' : '➖';
    
    html += `
      <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
        <td class="px-2 py-1 font-medium">${item.period}</td>
        <td class="px-2 py-1 text-right text-blue-600">${formatCurrency(item.budget)}</td>
        <td class="px-2 py-1 text-right text-green-600">${formatCurrency(item.actual)}</td>
        <td class="px-2 py-1 text-right ${statusColor}">
          ${formatCurrency(item.variance)} (${item.variancePercentage.toFixed(1)}%)
        </td>
        <td class="px-2 py-1 text-center ${statusColor}">
          ${statusIcon} ${item.status}
        </td>
        <td class="px-2 py-1 text-center text-gray-500">${item.rowCount}</td>
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
