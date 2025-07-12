/**
 * Contribution Analysis Engine
 * Calculates percentage contributions to totals with hierarchical breakdowns and beautiful card formatting
 */

import {
  ContributionAnalysisParams,
  ContributionAnalysisResult,
  FlexibleContributionData,
  ContributionItem,
  HierarchicalContribution
} from './contributionTypes';

import {
  validateContributionColumns,
  calculateContributions,
  calculateHierarchicalContributions,
  calculateConcentrationRatio,
  calculateDiversityIndex,
  formatContributionValue,
  filterDataByPeriod
} from './contributionHelpers';

import {
  processQuarterlyContribution
} from './contributionQuarterly';

/**
 * Main function to calculate contribution analysis with comprehensive insights
 */
export function calculateContributionAnalysis(
  data: FlexibleContributionData[],
  params: ContributionAnalysisParams
): ContributionAnalysisResult {
  try {
    // Validate input data and columns
    const validation = validateContributionColumns(data, params.valueColumn, params.categoryColumn);
    
    if (!validation.isValid) {
      return {
        success: false,
        analysis: [],
        metadata: {
          totalValue: 0,
          totalCategories: 0,
          topContributor: '',
          topContribution: 0,
          concentrationRatio: 0,
          diversityIndex: 0,
          analysisScope: params.analysisScope,
          dataQuality: validation.dataQuality
        },
        insights: {
          summary: 'Analysis failed due to data validation errors',
          keyFindings: [],
          recommendations: [],
          concentrationLevel: 'Low',
          diversityLevel: 'Low'
        },
        htmlOutput: '',
        errorMessage: validation.errorMessage
      };
    }

    // Filter data by period if specified
    let analysisData = data;
    let periodAnalyzed: string | undefined;
    
    if (params.analysisScope === 'period' && params.periodColumn && params.periodFilter) {
      analysisData = filterDataByPeriod(data, params.periodColumn, params.periodFilter);
      periodAnalyzed = params.periodFilter;
      
      if (analysisData.length === 0) {
        return {
          success: false,
          analysis: [],
          metadata: {
            totalValue: 0,
            totalCategories: 0,
            topContributor: '',
            topContribution: 0,
            concentrationRatio: 0,
            diversityIndex: 0,
            analysisScope: params.analysisScope,
            periodAnalyzed,
            dataQuality: 'Poor'
          },
          insights: {
            summary: `No data found for period: ${params.periodFilter}`,
            keyFindings: [],
            recommendations: [],
            concentrationLevel: 'Low',
            diversityLevel: 'Low'
          },
          htmlOutput: '',
          errorMessage: `No data found for period: ${params.periodFilter}`
        };
      }
    }

    // Calculate contributions
    const contributions = calculateContributions(analysisData, params.valueColumn, params.categoryColumn, params);
    
    // Calculate quarterly analysis if enabled
    let quarterlyAnalysis: { [quarterLabel: string]: ContributionItem[] } | undefined;
    let monthlyAnalysis: { [monthLabel: string]: ContributionItem[] } | undefined;
    let periodComparison: {
      periods: string[];
      categoryTrends: {
        category: string;
        values: number[];
        trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
        variance: number;
      }[];
    } | undefined;
    let seasonalInsights: string[] = [];
    let trendInsights: string[] = [];
    let timePeriodMetadata: {
      periodType: 'quarter' | 'month';
      periodsAnalyzed: string[];
      dateRange: { start: Date; end: Date };
    } | undefined;
    
    if (params.timePeriodAnalysis?.enabled && params.timePeriodAnalysis.dateColumn) {
      try {
        if (params.timePeriodAnalysis.periodType === 'quarter') {
          const quarterlyResults = processQuarterlyContribution(analysisData, params);
          quarterlyAnalysis = quarterlyResults.quarterlyAnalysis;
          periodComparison = quarterlyResults.periodComparison;
          seasonalInsights = quarterlyResults.seasonalInsights;
          trendInsights = quarterlyResults.trendInsights;
          
          // Add time period metadata
          const periods = Object.keys(quarterlyAnalysis);
          if (periods.length > 0) {
            const allDates = analysisData
              .map(row => row[params.timePeriodAnalysis!.dateColumn])
              .filter(date => date)
              .map(date => new Date(date as string))
              .filter(date => !isNaN(date.getTime()));
                  timePeriodMetadata = {
            periodType: 'quarter' as const,
            periodsAnalyzed: periods.sort(),
            dateRange: {
              start: new Date(Math.min(...allDates.map(d => d.getTime()))),
              end: new Date(Math.max(...allDates.map(d => d.getTime())))
            }
          };
          }
        }
        // Monthly analysis would be implemented similarly here
      } catch (error) {
        console.warn('Quarterly analysis failed:', error);
        // Continue with standard analysis
      }
    }
    
    // Calculate hierarchical contributions if subcategory specified
    let hierarchical: HierarchicalContribution[] | undefined;
    if (params.subcategoryColumn) {
      hierarchical = calculateHierarchicalContributions(
        analysisData, 
        params.valueColumn, 
        params.categoryColumn, 
        params.subcategoryColumn
      );
    }

    // Group small contributions as "Others" if specified
    let finalContributions = [...contributions];
    if (params.showOthers && contributions.length > 10) {
      const mainContributions = contributions.slice(0, 9);
      const otherContributions = contributions.slice(9);
      
      if (otherContributions.length > 0) {
        const othersValue = otherContributions.reduce((sum, item) => sum + item.value, 0);
        const othersPercent = otherContributions.reduce((sum, item) => sum + item.contributionPercent, 0);
        
        const othersItem: ContributionItem = {
          category: `Others (${otherContributions.length} categories)`,
          value: othersValue,
          contributionPercent: othersPercent,
          contributionAmount: othersValue,
          rank: 10,
          percentile: 'Bottom 25%',
          emoji: '📋',
          significance: othersPercent >= 10 ? 'Moderate' : 'Minor'
        };
        
        finalContributions = [...mainContributions, othersItem];
      }
    }

    // Calculate metadata
    const totalValue = validation.totalValue;
    const totalCategories = validation.uniqueCategories;
    const topContributor = contributions.length > 0 ? contributions[0].category : '';
    const topContribution = contributions.length > 0 ? contributions[0].contributionPercent : 0;
    const concentrationRatio = calculateConcentrationRatio(contributions);
    const diversityIndex = calculateDiversityIndex(contributions);

    // Generate insights
    const insights = generateContributionInsights(finalContributions, {
      totalValue,
      totalCategories,
      topContributor,
      topContribution,
      concentrationRatio,
      diversityIndex,
      analysisScope: params.analysisScope,
      periodAnalyzed,
      dataQuality: validation.dataQuality
    });

    // Generate HTML output
    const htmlOutput = generateContributionHTML(finalContributions, hierarchical, {
      totalValue,
      totalCategories,
      topContributor,
      topContribution,
      concentrationRatio,
      diversityIndex,
      analysisScope: params.analysisScope,
      periodAnalyzed,
      dataQuality: validation.dataQuality
    }, insights);

    return {
      success: true,
      analysis: finalContributions,
      hierarchical,
      
      // NEW: Add quarterly and monthly analysis results
      quarterlyAnalysis,
      monthlyAnalysis,
      periodComparison,
      
      metadata: {
        totalValue,
        totalCategories,
        topContributor,
        topContribution,
        concentrationRatio,
        diversityIndex,
        analysisScope: params.analysisScope,
        periodAnalyzed,
        dataQuality: validation.dataQuality,
        
        // NEW: Add time period metadata
        timePeriodAnalysis: timePeriodMetadata
      },
      insights: {
        ...insights,
        // NEW: Add seasonal and trend insights
        seasonalInsights: seasonalInsights.length > 0 ? seasonalInsights : undefined,
        trendInsights: trendInsights.length > 0 ? trendInsights : undefined
      },
      htmlOutput
    };

  } catch (error) {
    console.error('Contribution analysis failed:', error);
    return {
      success: false,
      analysis: [],
      metadata: {
        totalValue: 0,
        totalCategories: 0,
        topContributor: '',
        topContribution: 0,
        concentrationRatio: 0,
        diversityIndex: 0,
        analysisScope: params.analysisScope,
        dataQuality: 'Poor'
      },
      insights: {
        summary: 'Analysis failed due to unexpected error',
        keyFindings: [],
        recommendations: [],
        concentrationLevel: 'Low',
        diversityLevel: 'Low'
      },
      htmlOutput: '',
      errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate insights and recommendations based on contribution analysis
 */
function generateContributionInsights(
  contributions: ContributionItem[],
  metadata: ContributionAnalysisResult['metadata']
): ContributionAnalysisResult['insights'] {
  const keyFindings: string[] = [];
  const recommendations: string[] = [];

  // Analyze concentration
  let concentrationLevel: 'High' | 'Medium' | 'Low';
  if (metadata.concentrationRatio >= 70) {
    concentrationLevel = 'High';
    keyFindings.push(`<strong>High concentration detected:</strong> Top 3 contributors account for <strong>${metadata.concentrationRatio.toFixed(1)}%</strong> of total value`);
    recommendations.push('Consider diversification strategies to reduce dependency on major contributors');
  } else if (metadata.concentrationRatio >= 50) {
    concentrationLevel = 'Medium';
    keyFindings.push(`<strong>Moderate concentration:</strong> Top 3 contributors represent <strong>${metadata.concentrationRatio.toFixed(1)}%</strong> of total value`);
    recommendations.push('Monitor top contributors closely while developing secondary categories');
  } else {
    concentrationLevel = 'Low';
    keyFindings.push(`<strong>Well-distributed portfolio:</strong> Top 3 contributors account for <strong>${metadata.concentrationRatio.toFixed(1)}%</strong> of total value`);
    recommendations.push('Maintain balanced approach while identifying growth opportunities in top performers');
  }

  // Analyze diversity
  let diversityLevel: 'High' | 'Medium' | 'Low';
  if (metadata.diversityIndex >= 0.8) {
    diversityLevel = 'High';
    keyFindings.push('<strong>High diversity detected</strong> with well-distributed contributions across categories');
  } else if (metadata.diversityIndex >= 0.6) {
    diversityLevel = 'Medium';
    keyFindings.push('<strong>Moderate diversity</strong> with some concentration in top performers');
  } else {
    diversityLevel = 'Low';
    keyFindings.push('<strong>Low diversity</strong> indicates heavy concentration in few categories');
  }

  // Analyze top contributor
  if (contributions.length > 0) {
    const topContributor = contributions[0];
    keyFindings.push(`<strong>${topContributor.category}</strong> is the leading contributor at <strong>${topContributor.contributionPercent.toFixed(1)}%</strong> (${formatContributionValue(topContributor.value)})`);
    
    if (topContributor.contributionPercent >= 30) {
      recommendations.push(`Monitor <strong>${topContributor.category}</strong> closely as it represents significant portion of total value`);
    }
  }

  // Analyze tail contributors
  const smallContributors = contributions.filter(item => item.contributionPercent < 5);
  if (smallContributors.length > 0) {
    keyFindings.push(`<strong>${smallContributors.length} categories</strong> contribute less than 5% each`);
    recommendations.push('Evaluate potential for optimization or consolidation of smaller categories');
  }

  // Generate summary
  const summary = `Analysis of ${metadata.totalCategories} categories totaling ${formatContributionValue(metadata.totalValue)}. ${concentrationLevel.toLowerCase()} concentration with ${diversityLevel.toLowerCase()} diversity distribution.`;

  return {
    summary,
    keyFindings,
    recommendations,
    concentrationLevel,
    diversityLevel
  };
}

/**
 * Generate beautiful HTML output for contribution analysis
 */
function generateContributionHTML(
  contributions: ContributionItem[],
  hierarchical: HierarchicalContribution[] | undefined,
  metadata: ContributionAnalysisResult['metadata'],
  insights: ContributionAnalysisResult['insights']
): string {
  let html = `
    <div class="space-y-6">
      <!-- Summary Header -->
      <div class="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
        <div class="flex items-center space-x-3 mb-4">
          <div class="text-3xl">📊</div>
          <div>
            <h2 class="text-xl font-bold text-purple-800">Contribution Analysis</h2>
            <p class="text-purple-600">${insights.summary}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div class="text-center p-3 bg-white rounded-lg border border-purple-100">
            <div class="text-2xl font-bold text-purple-700">${metadata.totalCategories}</div>
            <div class="text-sm text-purple-600">Categories</div>
          </div>
          <div class="text-center p-3 bg-white rounded-lg border border-purple-100">
            <div class="text-2xl font-bold text-purple-700">${formatContributionValue(metadata.totalValue)}</div>
            <div class="text-sm text-purple-600">Total Value</div>
          </div>
          <div class="text-center p-3 bg-white rounded-lg border border-purple-100">
            <div class="text-2xl font-bold text-purple-700">${metadata.concentrationRatio.toFixed(1)}%</div>
            <div class="text-sm text-purple-600">Top 3 Share</div>
          </div>
          <div class="text-center p-3 bg-white rounded-lg border border-purple-100">
            <div class="text-2xl font-bold text-purple-700">${(metadata.diversityIndex * 100).toFixed(0)}%</div>
            <div class="text-sm text-purple-600">Diversity</div>
          </div>
        </div>
      </div>

      <!-- Contribution Breakdown -->
      <div class="grid gap-4">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <span>🎯</span>
          <span>Contribution Breakdown</span>
        </h3>
  `;

  // Generate contribution cards
  contributions.forEach((item, index) => {
    const isTopPerformer = index < 3;
    const cardColor = isTopPerformer 
      ? 'from-green-50 to-emerald-50 border-green-200' 
      : item.contributionPercent >= 10
        ? 'from-blue-50 to-cyan-50 border-blue-200'
        : 'from-gray-50 to-slate-50 border-gray-200';
    
    const textColor = isTopPerformer 
      ? 'text-green-800' 
      : item.contributionPercent >= 10
        ? 'text-blue-800'
        : 'text-gray-800';

    html += `
      <div class="bg-gradient-to-r ${cardColor} border rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">${item.emoji}</span>
            <div>
              <h4 class="font-semibold ${textColor}">${item.category}</h4>
              <span class="text-sm text-gray-600">${item.significance} Contributor • Rank #${item.rank}</span>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xl font-bold ${textColor}">${item.contributionPercent.toFixed(1)}%</div>
            <div class="text-sm text-gray-600">${formatContributionValue(item.value)}</div>
          </div>
        </div>
        
        <!-- Contribution Bar -->
        <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div class="h-2 rounded-full ${isTopPerformer ? 'bg-green-500' : item.contributionPercent >= 10 ? 'bg-blue-500' : 'bg-gray-400'}" 
               style="width: ${Math.min(item.contributionPercent, 100)}%"></div>
        </div>
        
        <div class="flex justify-between text-sm text-gray-600">
          <span>${item.percentile}</span>
          <span>${item.contributionPercent >= 20 ? 'Major Impact' : item.contributionPercent >= 10 ? 'Moderate Impact' : 'Minor Impact'}</span>
        </div>
      </div>
    `;
  });

  html += `
      </div>

      <!-- Insights and Recommendations -->
      <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-amber-800 mb-4 flex items-center space-x-2">
          <span>💡</span>
          <span>Key Insights</span>
        </h3>
        
        <div class="space-y-3 mb-4">
  `;

  insights.keyFindings.forEach(finding => {
    html += `
      <div class="flex items-start space-x-2">
        <span class="text-amber-600 mt-1">▪</span>
        <span class="text-amber-800">${finding}</span>
      </div>
    `;
  });

  html += `
        </div>
        
        <h4 class="font-semibold text-amber-800 mb-2">📋 Recommendations</h4>
        <div class="space-y-2">
  `;

  insights.recommendations.forEach(recommendation => {
    html += `
      <div class="flex items-start space-x-2">
        <span class="text-amber-600 mt-1">→</span>
        <span class="text-amber-700">${recommendation}</span>
      </div>
    `;
  });

  html += `
        </div>
      </div>
    </div>
  `;

  return html;
}

/**
 * Generate default contribution analysis suggestions based on data structure
 */
export function generateDefaultContributionSuggestions(data: FlexibleContributionData[]): ContributionAnalysisParams[] {
  if (data.length === 0) return [];

  const suggestions: ContributionAnalysisParams[] = [];
  const columns = Object.keys(data[0] || {});
  
  // Find potential value columns (numeric)
  const valueColumns = columns.filter(col => {
    const sampleValues = data.slice(0, 10).map(row => row[col]);
    const numericCount = sampleValues.filter(val => !isNaN(Number(val)) && val !== null && val !== '').length;
    return numericCount >= 5;
  });

  // Find potential category columns (text/categorical)
  const categoryColumns = columns.filter(col => {
    const sampleValues = data.slice(0, 20).map(row => row[col]).filter(val => val !== null && val !== '');
    const uniqueValues = new Set(sampleValues);
    return uniqueValues.size >= 2 && uniqueValues.size <= sampleValues.length * 0.8;
  });

  // Generate suggestions
  valueColumns.forEach(valueCol => {
    categoryColumns.forEach(categoryCol => {
      if (valueCol !== categoryCol) {
        suggestions.push({
          valueColumn: valueCol,
          categoryColumn: categoryCol,
          analysisScope: 'total',
          sortBy: 'contribution',
          sortOrder: 'desc',
          minimumContribution: 1,
          showOthers: true,
          includePercentiles: true
        });
      }
    });
  });

  return suggestions.slice(0, 5); // Return top 5 suggestions
}
