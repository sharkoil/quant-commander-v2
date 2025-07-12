// Top N Analysis - Main Analysis Engine
// Identifies highest and lowest performing categories with intelligent ranking algorithms

import {
  TopNAnalysisParams,
  FlexibleTopNData,
  TopNResult,
  RankingItem,
  AnalysisMetadata,
  AggregatedData,
  PeriodData,
  DefaultAnalysisSuggestion
} from './topNTypes';

import {
  groupBy,
  sumBy,
  meanBy,
  groupByPeriod,
  getPeriodStartDate,
  validateColumn,
  assignRanks,
  formatDisplayValue
} from './topNHelpers';

/**
 * Main Top N Analysis Function
 * Analyzes data to identify top and bottom performing categories
 * Supports total values, period-based, and growth rate analysis
 */
export function calculateTopNAnalysis(data: FlexibleTopNData[], params: TopNAnalysisParams): TopNResult {
  // Step 1: Validate input data and parameters
  validateInputData(data, params);
  
  // Step 2: Clean and preprocess data
  const cleanedData = preprocessData(data, params);
  
  // Step 3: Perform analysis based on scope
  let rankings: RankingItem[];
  
  switch (params.analysisScope) {
    case 'total':
      rankings = calculateTotalRankings(cleanedData, params);
      break;
    case 'period':
      rankings = calculateLatestPeriodRankings(cleanedData, params);
      break;
    case 'growth':
      rankings = calculateGrowthRankings(cleanedData, params);
      break;
    default:
      throw new Error(`Unsupported analysis scope: ${params.analysisScope}`);
  }
  
  // Step 4: Assign ranks and extract top/bottom N
  const rankedItems = assignRanks(rankings);
  const topResults = params.direction === 'bottom' ? [] : rankedItems.slice(0, params.n);
  const bottomResults = params.direction === 'top' ? [] : rankedItems.slice(-params.n).reverse();
  
  // Step 5: Generate metadata and insights
  const metadata = generateAnalysisMetadata(rankedItems, cleanedData, params);
  const insights = generateInsights(topResults, bottomResults, metadata, params);
  
  // Step 6: Generate HTML output
  const htmlOutput = generateTopNHTML(topResults, bottomResults, metadata, insights, params);
  
  return {
    topResults,
    bottomResults,
    metadata,
    htmlOutput,
    insights
  };
}

/**
 * Validates input data and parameters
 * Ensures all required fields are present and data is suitable for analysis
 */
function validateInputData(data: FlexibleTopNData[], params: TopNAnalysisParams): void {
  // Check basic requirements
  if (!data || data.length === 0) {
    throw new Error('No data provided for analysis');
  }
  
  if (!params.valueColumn) {
    throw new Error('Value column is required for ranking');
  }
  
  if (params.n <= 0) {
    throw new Error('N must be a positive number');
  }
  
  // Validate value column exists and is numeric
  const valueValidation = validateColumn(data, params.valueColumn);
  if (!valueValidation.isValid) {
    throw new Error(valueValidation.errorMessage || 'Value column validation failed');
  }
  
  if (valueValidation.dataType !== 'numeric') {
    throw new Error(`Value column '${params.valueColumn}' must contain numeric data`);
  }
  
  // Validate period/growth analysis requirements
  if ((params.analysisScope === 'period' || params.analysisScope === 'growth') && !params.dateColumn) {
    throw new Error('Date column is required for period and growth analysis');
  }
  
  if (params.dateColumn) {
    const dateValidation = validateColumn(data, params.dateColumn);
    if (!dateValidation.isValid) {
      throw new Error(`Date column validation failed: ${dateValidation.errorMessage}`);
    }
  }
  
  if (params.categoryColumn) {
    const categoryValidation = validateColumn(data, params.categoryColumn);
    if (!categoryValidation.isValid) {
      throw new Error(`Category column validation failed: ${categoryValidation.errorMessage}`);
    }
  }
}

/**
 * Preprocesses and cleans data for analysis
 * Removes invalid records and standardizes data types
 */
function preprocessData(data: FlexibleTopNData[], params: TopNAnalysisParams): FlexibleTopNData[] {
  return data.filter(row => {
    // Remove rows with invalid value data
    const value = row[params.valueColumn];
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(numValue)) return false;
    
    // Remove rows with invalid dates (if date column specified)
    if (params.dateColumn) {
      const dateValue = row[params.dateColumn];
      const date = dateValue instanceof Date ? dateValue : new Date(String(dateValue));
      if (isNaN(date.getTime())) return false;
    }
    
    // Remove rows with empty categories (if category column specified)
    if (params.categoryColumn) {
      const category = row[params.categoryColumn];
      if (!category || String(category).trim() === '') return false;
    }
    
    return true;
  });
}

/**
 * Calculates rankings based on total values across all periods
 * Groups by category and sums all values for each category
 */
function calculateTotalRankings(data: FlexibleTopNData[], params: TopNAnalysisParams): RankingItem[] {
  // Group by category (or treat each row as separate category if no category column)
  let categoryGroups: Record<string, FlexibleTopNData[]>;
  
  if (params.categoryColumn) {
    categoryGroups = groupBy(data, params.categoryColumn);
  } else {
    // Each row is its own category - use row index or generate unique identifiers
    categoryGroups = {};
    data.forEach((row, index) => {
      const categoryKey = `Item ${index + 1}`;
      categoryGroups[categoryKey] = [row];
    });
  }
  
  const totalSum = sumBy(data, params.valueColumn);
  
  return Object.entries(categoryGroups).map(([category, records]) => {
    const totalValue = sumBy(records, params.valueColumn);
    const averageValue = meanBy(records, params.valueColumn);
    
    // Generate period breakdown if date column available
    let periodBreakdown: PeriodData[] | undefined;
    if (params.dateColumn && params.periodAggregation) {
      periodBreakdown = generatePeriodBreakdown(records, params);
    }
    
    return {
      category,
      value: totalValue,
      rank: 0, // Will be assigned by assignRanks function
      percentageOfTotal: totalSum > 0 ? (totalValue / totalSum) * 100 : 0,
      recordCount: records.length,
      averageValue,
      periodBreakdown
    };
  });
}

/**
 * Calculates rankings based on latest period values
 * Groups by period, then ranks categories within the most recent period
 */
function calculateLatestPeriodRankings(data: FlexibleTopNData[], params: TopNAnalysisParams): RankingItem[] {
  if (!params.dateColumn || !params.periodAggregation) {
    throw new Error('Date column and period aggregation are required for period analysis');
  }
  
  // Group data by periods
  const periodGroups = groupByPeriod(data, params.dateColumn, params.periodAggregation);
  
  // Find the latest period
  const periods = Object.keys(periodGroups);
  const sortedPeriods = periods.sort((a, b) => {
    const dateA = getPeriodStartDate(a, params.periodAggregation!);
    const dateB = getPeriodStartDate(b, params.periodAggregation!);
    return dateB.getTime() - dateA.getTime(); // Most recent first
  });
  
  if (sortedPeriods.length === 0) {
    throw new Error('No valid periods found in data');
  }
  
  const latestPeriod = sortedPeriods[0];
  const latestPeriodData = periodGroups[latestPeriod];
  
  // Calculate rankings for the latest period
  return calculateTotalRankings(latestPeriodData, {
    ...params,
    analysisScope: 'total' // Use total logic but only for latest period data
  });
}

/**
 * Calculates rankings based on growth rates between first and last periods
 * Requires multiple periods to calculate meaningful growth
 */
function calculateGrowthRankings(data: FlexibleTopNData[], params: TopNAnalysisParams): RankingItem[] {
  if (!params.dateColumn || !params.periodAggregation) {
    throw new Error('Date column and period aggregation are required for growth analysis');
  }
  
  // Aggregate data by period and category
  const aggregatedData = aggregateByPeriod(data, params);
  
  // Group aggregated data by category
  const categoryGroups = groupBy(aggregatedData, 'category');
  
  return Object.entries(categoryGroups).map(([category, periods]) => {
    // Sort periods chronologically
    const sortedPeriods = periods.sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
    
    if (sortedPeriods.length < 2) {
      // Can't calculate growth with less than 2 periods
      return {
        category,
        value: sortedPeriods[0]?.totalValue || 0,
        rank: 0,
        percentageOfTotal: 0,
        recordCount: sortedPeriods[0]?.recordCount || 0,
        averageValue: sortedPeriods[0]?.averageValue || 0,
        growthRate: 0,
        periodBreakdown: sortedPeriods.map(p => ({
          period: p.period,
          value: p.totalValue,
          recordCount: p.recordCount,
          periodStart: p.periodStart
        }))
      };
    }
    
    // Calculate growth rate
    const firstValue = sortedPeriods[0].totalValue;
    const lastValue = sortedPeriods[sortedPeriods.length - 1].totalValue;
    const growthRate = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    
    // Use growth rate as the ranking value
    const totalRecords = sortedPeriods.reduce((sum, p) => sum + p.recordCount, 0);
    const totalValue = sortedPeriods.reduce((sum, p) => sum + p.totalValue, 0);
    
    return {
      category,
      value: growthRate, // Rank by growth rate
      rank: 0,
      percentageOfTotal: 0, // Will calculate after all growth rates are known
      recordCount: totalRecords,
      averageValue: totalValue / totalRecords,
      growthRate,
      periodBreakdown: sortedPeriods.map(p => ({
        period: p.period,
        value: p.totalValue,
        recordCount: p.recordCount,
        periodStart: p.periodStart
      }))
    };
  });
}

/**
 * Aggregates data by period and category for time-series analysis
 * Creates intermediate data structure for period-based calculations
 */
function aggregateByPeriod(data: FlexibleTopNData[], params: TopNAnalysisParams): AggregatedData[] {
  if (!params.dateColumn || !params.periodAggregation) {
    throw new Error('Date column and period aggregation required');
  }
  
  // Group by periods first
  const periodGroups = groupByPeriod(data, params.dateColumn, params.periodAggregation);
  
  const result: AggregatedData[] = [];
  
  Object.entries(periodGroups).forEach(([period, periodData]) => {
    // Within each period, group by category
    let categoryGroups: Record<string, FlexibleTopNData[]>;
    
    if (params.categoryColumn) {
      categoryGroups = groupBy(periodData, params.categoryColumn);
    } else {
      categoryGroups = { 'All Data': periodData };
    }
    
    Object.entries(categoryGroups).forEach(([category, records]) => {
      const totalValue = sumBy(records, params.valueColumn);
      const averageValue = meanBy(records, params.valueColumn);
      const periodStart = getPeriodStartDate(period, params.periodAggregation!);
      
      result.push({
        period,
        category,
        totalValue,
        recordCount: records.length,
        averageValue,
        periodStart
      });
    });
  });
  
  return result;
}

/**
 * Generates period breakdown for a category
 * Creates time series data showing performance across periods
 */
function generatePeriodBreakdown(records: FlexibleTopNData[], params: TopNAnalysisParams): PeriodData[] {
  if (!params.dateColumn || !params.periodAggregation) return [];
  
  const periodGroups = groupByPeriod(records, params.dateColumn, params.periodAggregation);
  
  return Object.entries(periodGroups).map(([period, periodRecords]) => ({
    period,
    value: sumBy(periodRecords, params.valueColumn),
    recordCount: periodRecords.length,
    periodStart: getPeriodStartDate(period, params.periodAggregation!)
  })).sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
}

/**
 * Generates analysis metadata and summary statistics
 * Provides context and statistical insights about the analysis
 */
function generateAnalysisMetadata(
  rankings: RankingItem[], 
  originalData: FlexibleTopNData[], 
  params: TopNAnalysisParams
): AnalysisMetadata {
  
  const values = rankings.map(r => r.value);
  const totalSum = values.reduce((sum, val) => sum + val, 0);
  
  // Calculate date range if date column available
  let dateRange = { start: new Date(), end: new Date() };
  if (params.dateColumn) {
    const dates = originalData
      .map(row => {
        const dateVal = row[params.dateColumn!];
        return dateVal instanceof Date ? dateVal : new Date(String(dateVal));
      })
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length > 0) {
      dateRange = { start: dates[0], end: dates[dates.length - 1] };
    }
  }
  
  // Calculate statistical measures
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues.length > 0 
    ? sortedValues.length % 2 === 0 
      ? (sortedValues[Math.floor(sortedValues.length / 2) - 1] + sortedValues[Math.floor(sortedValues.length / 2)]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)]
    : 0;
  
  const mean = values.length > 0 ? totalSum / values.length : 0;
  const variance = values.length > 0 
    ? values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length 
    : 0;
  const standardDeviation = Math.sqrt(variance);
  
  // Generate analysis type description
  let analysisType = `Top ${params.n} Analysis`;
  if (params.direction === 'bottom') analysisType = `Bottom ${params.n} Analysis`;
  if (params.direction === 'both') analysisType = `Top & Bottom ${params.n} Analysis`;
  
  if (params.analysisScope === 'period') analysisType += ` (Latest Period)`;
  if (params.analysisScope === 'growth') analysisType += ` (Growth Rate)`;
  
  return {
    totalCategories: rankings.length,
    totalRecords: originalData.length,
    dateRange,
    analysisType,
    topPerformerValue: sortedValues.length > 0 ? sortedValues[sortedValues.length - 1] : 0,
    bottomPerformerValue: sortedValues.length > 0 ? sortedValues[0] : 0,
    totalSum,
    averageValue: mean,
    valueDistribution: {
      median,
      standardDeviation,
      variance
    }
  };
}

/**
 * Generates insights and key findings from the analysis
 * Provides actionable recommendations based on the data
 */
function generateInsights(
  topResults: RankingItem[], 
  bottomResults: RankingItem[], 
  metadata: AnalysisMetadata, 
  params: TopNAnalysisParams
): string[] {
  
  const insights: string[] = [];
  
  // Performance concentration insights
  if (topResults.length > 0) {
    const topPercentage = topResults.reduce((sum, item) => sum + item.percentageOfTotal, 0);
    insights.push(`📊 Top ${topResults.length} performers account for ${topPercentage.toFixed(1)}% of total ${params.valueColumn}`);
    
    if (topPercentage > 80) {
      insights.push(`⚡ High concentration: Top performers dominate the distribution`);
    } else if (topPercentage < 20) {
      insights.push(`📈 Balanced distribution: Performance is spread across categories`);
    }
  }
  
  // Growth rate insights
  if (params.analysisScope === 'growth' && topResults.length > 0) {
    const avgGrowth = topResults.reduce((sum, item) => sum + (item.growthRate || 0), 0) / topResults.length;
    insights.push(`📈 Average growth rate among top performers: ${avgGrowth.toFixed(1)}%`);
    
    const positiveGrowth = topResults.filter(item => (item.growthRate || 0) > 0).length;
    insights.push(`🔥 ${positiveGrowth} out of ${topResults.length} top performers show positive growth`);
  }
  
  // Period analysis insights
  if (params.analysisScope === 'period' && params.periodAggregation) {
    insights.push(`📅 Analysis based on latest ${params.periodAggregation} period`);
  }
  
  // Statistical insights
  const coefficient = metadata.averageValue > 0 
    ? metadata.valueDistribution.standardDeviation / metadata.averageValue 
    : 0;
  
  if (coefficient > 1) {
    insights.push(`📊 High variability detected: Values vary significantly across categories`);
  } else if (coefficient < 0.3) {
    insights.push(`⚖️ Low variability: Values are relatively consistent across categories`);
  }
  
  // Performance gap insights
  if (topResults.length > 0 && bottomResults.length > 0) {
    const gap = topResults[0].value - bottomResults[0].value;
    const gapPercentage = bottomResults[0].value > 0 
      ? (gap / bottomResults[0].value) * 100 
      : 0;
    insights.push(`📏 Performance gap: ${formatDisplayValue(gap)} (${gapPercentage.toFixed(0)}% difference)`);
  }
  
  return insights;
}

/**
 * Generates HTML output for the Top N analysis results
 * Creates formatted cards and visualizations matching the app's design
 */
function generateTopNHTML(
  topResults: RankingItem[], 
  bottomResults: RankingItem[], 
  metadata: AnalysisMetadata,
  insights: string[],
  params: TopNAnalysisParams
): string {
  
  const scopeEmoji = params.analysisScope === 'growth' ? '📈' : 
                   params.analysisScope === 'period' ? '📅' : '📊';
  
  return `
    <div class="top-n-analysis-results" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Analysis Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 28px; font-weight: bold;">
          ${scopeEmoji} ${metadata.analysisType}
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px;">
          <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; backdrop-filter: blur(10px);">
            <div style="font-size: 24px; font-weight: bold;">${metadata.totalCategories}</div>
            <div style="font-size: 14px; opacity: 0.9;">Categories Analyzed</div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; backdrop-filter: blur(10px);">
            <div style="font-size: 24px; font-weight: bold;">${formatDisplayValue(metadata.totalSum)}</div>
            <div style="font-size: 14px; opacity: 0.9;">Total ${params.valueColumn}</div>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; backdrop-filter: blur(10px);">
            <div style="font-size: 24px; font-weight: bold;">${metadata.totalRecords}</div>
            <div style="font-size: 14px; opacity: 0.9;">Data Records</div>
          </div>
        </div>
      </div>

      <!-- Top Performers Section -->
      ${topResults.length > 0 ? `
        <div style="margin-bottom: 32px;">
          <h3 style="color: #059669; font-size: 24px; font-weight: bold; margin-bottom: 16px; display: flex; align-items: center;">
            🏆 Top ${params.n} Performers
          </h3>
          <div style="display: grid; gap: 16px;">
            ${topResults.map((item, index) => generateRankingCard(item, index, 'top', params)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Bottom Performers Section -->
      ${bottomResults.length > 0 ? `
        <div style="margin-bottom: 32px;">
          <h3 style="color: #dc2626; font-size: 24px; font-weight: bold; margin-bottom: 16px; display: flex; align-items: center;">
            📉 Bottom ${params.n} Performers
          </h3>
          <div style="display: grid; gap: 16px;">
            ${bottomResults.map((item, index) => generateRankingCard(item, index, 'bottom', params)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Insights Section -->
      ${insights.length > 0 ? `
        <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #1e293b; font-size: 20px; font-weight: bold; margin-bottom: 16px;">
            💡 Key Insights
          </h3>
          <div style="display: grid; gap: 12px;">
            ${insights.map(insight => `
              <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <div style="color: #64748b; font-size: 14px; line-height: 1.5;">${insight}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generates individual ranking card HTML
 * Creates styled cards for each ranked item with appropriate metrics
 */
function generateRankingCard(item: RankingItem, index: number, type: 'top' | 'bottom', params: TopNAnalysisParams): string {
  const isGrowthAnalysis = params.analysisScope === 'growth';
  const cardColor = type === 'top' ? '#059669' : '#dc2626';
  const bgColor = type === 'top' ? '#ecfdf5' : '#fef2f2';
  const rankEmoji = type === 'top' 
    ? ['🥇', '🥈', '🥉', '🏅', '⭐'][index] || '🏆'
    : ['🔴', '🟠', '🟡', '🔶', '📊'][index] || '📉';
  
  return `
    <div style="background: ${bgColor}; border: 2px solid ${cardColor}; border-radius: 12px; padding: 20px; transition: transform 0.2s;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">${rankEmoji}</span>
          <div>
            <h4 style="margin: 0; font-size: 18px; font-weight: bold; color: ${cardColor};">
              #${item.rank} ${item.category}
            </h4>
            <div style="font-size: 14px; color: #64748b; margin-top: 4px;">
              ${item.recordCount} record${item.recordCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 24px; font-weight: bold; color: ${cardColor};">
            ${isGrowthAnalysis ? `${item.growthRate?.toFixed(1)}%` : formatDisplayValue(item.value)}
          </div>
          ${!isGrowthAnalysis ? `
            <div style="font-size: 14px; color: #64748b;">
              ${item.percentageOfTotal.toFixed(1)}% of total
            </div>
          ` : ''}
        </div>
      </div>
      
      ${item.periodBreakdown && item.periodBreakdown.length > 1 ? `
        <div style="background: white; border-radius: 8px; padding: 12px; margin-top: 16px;">
          <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Period Breakdown:</div>
          <div style="display: grid; gap: 4px;">
            ${item.periodBreakdown.slice(-5).map(period => `
              <div style="display: flex; justify-content: space-between; font-size: 13px;">
                <span style="color: #64748b;">${period.period}</span>
                <span style="font-weight: 500;">${formatDisplayValue(period.value)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generates default analysis suggestions when CSV is loaded
 * Provides out-of-the-box analysis options based on detected columns
 */
export function generateDefaultTopNSuggestions(data: FlexibleTopNData[]): DefaultAnalysisSuggestion[] {
  if (data.length === 0) return [];
  
  const suggestions: DefaultAnalysisSuggestion[] = [];
  const sampleRow = data[0];
  const columns = Object.keys(sampleRow);
  
  // Find numeric columns for value analysis
  const numericColumns = columns.filter(col => {
    const validation = validateColumn(data, col);
    return validation.dataType === 'numeric' && validation.isValid;
  });
  
  // Find text columns for category analysis
  const textColumns = columns.filter(col => {
    const validation = validateColumn(data, col);
    return validation.dataType === 'text' && validation.isValid && validation.uniqueValues > 1;
  });
  
  // Find date columns for time-based analysis
  const dateColumns = columns.filter(col => {
    const validation = validateColumn(data, col);
    return validation.dataType === 'date' && validation.isValid;
  });
  
  // Generate suggestions based on available columns
  numericColumns.forEach(valueCol => {
    // Total value analysis
    suggestions.push({
      analysisName: `Top 5 by ${valueCol}`,
      params: {
        n: 5,
        analysisScope: 'total',
        valueColumn: valueCol,
        categoryColumn: textColumns[0],
        direction: 'both'
      },
      confidence: textColumns.length > 0 ? 85 : 70,
      reasoning: `Analyze top and bottom performers by ${valueCol}${textColumns.length > 0 ? ` grouped by ${textColumns[0]}` : ''}`
    });
    
    // Growth analysis if date column available
    if (dateColumns.length > 0) {
      suggestions.push({
        analysisName: `Growth Analysis: ${valueCol}`,
        params: {
          n: 5,
          analysisScope: 'growth',
          valueColumn: valueCol,
          categoryColumn: textColumns[0],
          dateColumn: dateColumns[0],
          periodAggregation: 'month',
          direction: 'both'
        },
        confidence: 80,
        reasoning: `Identify fastest growing and declining categories in ${valueCol} over time`
      });
    }
  });
  
  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}
