/**
 * Contribution Analysis Visualizer
 * Generates HTML visualizations for contribution analysis results
 * Follows the same pattern as budgetVarianceVisualizer for consistency
 */

import { ContributionProcessingResult, ProcessedContributionData } from '../analyzers/contributionProcessor';

/**
 * Generate contribution analysis visualization HTML
 */
export function generateContributionVisualization(
  processedData: ProcessedContributionData,
  valueColumn: string,
  categoryColumn: string
): string {
  if (!processedData.success || processedData.data.length === 0) {
    return `
      <div class="text-center py-8">
        <div class="text-red-600 text-lg font-semibold mb-2">No Contribution Data</div>
        <div class="text-gray-600">
          Unable to process contribution analysis. Please check your data and column selections.
        </div>
      </div>
    `;
  }

  const results = processedData.data;
  const isMultiplePeriods = results.length > 1;

  let html = `
    <div class="contribution-analysis-visualization">
      <div class="mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-2">📊 Contribution Analysis</h3>
        <div class="text-sm text-gray-600 mb-4">
          Analyzing ${valueColumn} contributions by ${categoryColumn}
          ${processedData.summary.totalRecords ? `• ${processedData.summary.totalRecords.toLocaleString()} total records` : ''}
          ${processedData.summary.categories.length ? `• ${processedData.summary.categories.length} categories` : ''}
        </div>
      </div>
  `;

  if (isMultiplePeriods) {
    // Multi-period view with tabs
    html += generateMultiPeriodView(results);
  } else {
    // Single period view
    html += generateSinglePeriodView(results[0]);
  }

  html += `
      </div>
    </div>
  `;

  // Add event delegation script for period tabs if multiple periods
  if (isMultiplePeriods) {
    html += eventDelegationScript;
  }

  return html;
}

/**
 * Generate visualization for a single time period
 */
function generateSinglePeriodView(result: ContributionProcessingResult): string {
  const { contributions, totalValue, metadata } = result;
  
  if (contributions.length === 0) {
    return `
      <div class="text-center py-8 text-gray-600">
        No contribution data available for analysis.
      </div>
    `;
  }

  // Top contributors (top 10)
  const topContributors = contributions.slice(0, 10);
  
  return `
    <div class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="text-blue-600 text-sm font-medium">Total Value</div>
          <div class="text-2xl font-bold text-blue-900">$${totalValue.toLocaleString()}</div>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="text-green-600 text-sm font-medium">Top Contributor</div>
          <div class="text-lg font-bold text-green-900">${metadata.topContributor}</div>
          <div class="text-sm text-green-700">${metadata.topPercentage.toFixed(1)}% of total</div>
        </div>
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div class="text-purple-600 text-sm font-medium">Total Categories</div>
          <div class="text-2xl font-bold text-purple-900">${metadata.categoriesCount}</div>
        </div>
      </div>

      <!-- Top Contributors Chart -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h4 class="text-lg font-semibold text-gray-900 mb-4">🏆 Top Contributors</h4>
        <div class="space-y-3">
          ${topContributors.map((contrib, index) => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                  ${index + 1}
                </div>
                <div>
                  <div class="font-medium text-gray-900">${contrib.category}</div>
                  ${contrib.subcategory ? `<div class="text-sm text-gray-600">${contrib.subcategory}</div>` : ''}
                </div>
              </div>
              <div class="text-right">
                <div class="font-bold text-gray-900">$${contrib.value.toLocaleString()}</div>
                <div class="text-sm text-red-600 font-medium">${contrib.percentage.toFixed(1)}%</div>
              </div>
              <!-- Progress bar -->
              <div class="w-24 ml-4">
                <div class="bg-gray-200 rounded-full h-2">
                  <div class="bg-red-500 h-2 rounded-full" style="width: ${(contrib.percentage / metadata.topPercentage * 100).toFixed(1)}%"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Contribution Distribution -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h4 class="text-lg font-semibold text-gray-900 mb-4">📈 Contribution Distribution</h4>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Pie Chart Representation -->
          <div>
            <h5 class="text-md font-medium text-gray-700 mb-3">Top 5 Categories</h5>
            <div class="space-y-2">
              ${topContributors.slice(0, 5).map((contrib, index) => {
                const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                return `
                  <div class="flex items-center space-x-2">
                    <div class="w-4 h-4 ${colors[index]} rounded"></div>
                    <span class="text-sm text-gray-700 flex-1">${contrib.category}</span>
                    <span class="text-sm font-medium text-gray-900">${contrib.percentage.toFixed(1)}%</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <!-- Statistics -->
          <div>
            <h5 class="text-md font-medium text-gray-700 mb-3">Statistics</h5>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Pareto Ratio (80/20):</span>
                <span class="font-medium">${calculateParetoRatio(contributions)}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Concentration (Top 3):</span>
                <span class="font-medium">${calculateTopNPercentage(contributions, 3)}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Average Contribution:</span>
                <span class="font-medium">${(100 / contributions.length).toFixed(1)}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Categories Count:</span>
                <span class="font-medium">${contributions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Add event delegation script at the end of the HTML
const eventDelegationScript = `
  <script>
    // Immediate execution with DOM ready check
    (function initContributionTabs() {
      console.log('Initializing contribution tabs...');
      
      function setupEventListener() {
        console.log('Setting up contribution tab event listener');
        
        // Remove any existing listeners to prevent duplicates
        if (window.contributionTabListener) {
          document.removeEventListener('click', window.contributionTabListener);
        }
        
        // Create new listener function
        function handlePeriodTabClick(event) {
          console.log('Click detected on:', event.target);
          
          if (event.target && event.target.classList && event.target.classList.contains('period-tab')) {
            console.log('Period tab clicked:', event.target);
            
            const periodId = event.target.getAttribute('data-period');
            console.log('Period ID:', periodId);
            
            if (periodId) {
              try {
                // Hide all period content
                const periodContents = document.querySelectorAll('.period-content');
                console.log('Found period contents:', periodContents.length);
                periodContents.forEach(el => {
                  el.classList.add('hidden');
                  console.log('Hidden:', el.id);
                });
                
                // Show selected period
                const targetEl = document.getElementById('period-' + periodId);
                console.log('Target element for period-' + periodId + ':', targetEl);
                if (targetEl) {
                  targetEl.classList.remove('hidden');
                  console.log('Showed period:', periodId);
                } else {
                  console.warn('Period element not found:', 'period-' + periodId);
                  // List all period elements for debugging
                  const allPeriodElements = document.querySelectorAll('[id^="period-"]');
                  console.log('Available period elements:', Array.from(allPeriodElements).map(el => el.id));
                }
                
                // Update tab styles
                const allTabs = document.querySelectorAll('.period-tab');
                console.log('Found tabs:', allTabs.length);
                allTabs.forEach(tab => {
                  tab.classList.remove('bg-red-50', 'border-red-200', 'text-red-700');
                  tab.classList.add('bg-gray-50', 'border-gray-200', 'text-gray-700');
                });
                
                // Update clicked button style
                event.target.classList.remove('bg-gray-50', 'border-gray-200', 'text-gray-700');
                event.target.classList.add('bg-red-50', 'border-red-200', 'text-red-700');
                console.log('Updated button styles for:', periodId);
                
              } catch (error) {
                console.error('Error in period tab click handler:', error);
              }
            }
          }
        }
        
        // Store listener reference for cleanup
        window.contributionTabListener = handlePeriodTabClick;
        
        // Add event listener
        document.addEventListener('click', handlePeriodTabClick, true); // Use capture phase
        console.log('Event listener attached for contribution tabs');
        
        // Also try adding listener to document body as fallback
        if (document.body) {
          document.body.addEventListener('click', handlePeriodTabClick);
          console.log('Fallback event listener attached to body');
        }
      }
      
      // Execute immediately if DOM is ready, otherwise wait
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEventListener);
        console.log('Waiting for DOMContentLoaded...');
      } else {
        setupEventListener();
      }
      
      // Also set up with a small delay as fallback
      setTimeout(setupEventListener, 100);
      console.log('Contribution tabs initialization complete');
    })();
  </script>
`;

/**
 * Generate visualization for multiple time periods
 */
function generateMultiPeriodView(results: ContributionProcessingResult[]): string {
  // Sort results by period to ensure consistency between buttons and content
  const sortedResults = [...results].sort((a, b) => {
    const periodA = a.metadata.period || 'Unknown';
    const periodB = b.metadata.period || 'Unknown';
    return periodA.localeCompare(periodB);
  });
  
  return `
    <div class="space-y-6">
      <!-- Period Selector -->
      <div class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex flex-wrap gap-2">
          ${sortedResults.map((result, index) => `
            <button 
              class="period-tab px-4 py-2 rounded-lg border ${index === 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-700'}"
              data-period="${result.metadata.period}"
              onclick="
                console.log('Inline click handler for ${result.metadata.period}');
                // Hide all period content
                document.querySelectorAll('.period-content').forEach(el => el.classList.add('hidden'));
                // Show selected period  
                const target = document.getElementById('period-${result.metadata.period}');
                if (target) target.classList.remove('hidden');
                // Update tab styles
                document.querySelectorAll('.period-tab').forEach(tab => {
                  tab.classList.remove('bg-red-50', 'border-red-200', 'text-red-700');
                  tab.classList.add('bg-gray-50', 'border-gray-200', 'text-gray-700');
                });
                // Update clicked button
                this.classList.remove('bg-gray-50', 'border-gray-200', 'text-gray-700');
                this.classList.add('bg-red-50', 'border-red-200', 'text-red-700');
              "
            >
              ${result.metadata.period}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Period Data -->
      ${sortedResults.map((result, index) => `
        <div id="period-${result.metadata.period}" class="period-content ${index !== 0 ? 'hidden' : ''}">
          <h4 class="text-lg font-semibold text-gray-900 mb-4">📅 ${result.metadata.period}</h4>
          ${generateSinglePeriodView(result)}
        </div>
      `).join('')}

      <!-- Period Comparison -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h4 class="text-lg font-semibold text-gray-900 mb-4">📊 Period Comparison</h4>
        ${generatePeriodComparisonTable(sortedResults)}
      </div>
    </div>


  `;
}

/**
 * Generate period comparison table
 */
function generatePeriodComparisonTable(results: ContributionProcessingResult[]): string {
  // Get all unique categories across periods
  const allCategories = new Set<string>();
  results.forEach(result => {
    result.contributions.forEach(contrib => {
      allCategories.add(contrib.category);
    });
  });

  const sortedCategories = Array.from(allCategories).sort();
  const periods = results.map(r => r.metadata.period || 'Unknown');

  return `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-2 px-3 font-medium text-gray-900">Category</th>
            ${periods.map(period => `<th class="text-right py-2 px-3 font-medium text-gray-900">${period}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${sortedCategories.slice(0, 10).map(category => {
            return `
              <tr class="border-b border-gray-100">
                <td class="py-2 px-3 font-medium text-gray-900">${category}</td>
                ${periods.map(period => {
                  const periodResult = results.find(r => r.metadata.period === period);
                  const contrib = periodResult?.contributions.find(c => c.category === category);
                  return `<td class="py-2 px-3 text-right text-gray-600">
                    ${contrib ? `${contrib.percentage.toFixed(1)}%` : '-'}
                  </td>`;
                }).join('')}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Calculate what percentage of top contributors make up 80% of total
 */
function calculateParetoRatio(contributions: Array<{percentage: number}>): number {
  let cumulative = 0;
  let count = 0;
  
  for (const contrib of contributions) {
    cumulative += contrib.percentage;
    count++;
    if (cumulative >= 80) break;
  }
  
  return Math.round((count / contributions.length) * 100);
}

/**
 * Calculate percentage contributed by top N contributors
 */
function calculateTopNPercentage(contributions: Array<{percentage: number}>, n: number): number {
  const topN = contributions.slice(0, n);
  const totalPercent = topN.reduce((sum, contrib) => sum + contrib.percentage, 0);
  return Math.round(totalPercent * 10) / 10;
}
