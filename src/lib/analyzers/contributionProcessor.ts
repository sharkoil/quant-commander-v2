/**
 * Contribution Analysis Data Processor
 * Processes CSV data for contribution analysis with multiple time scales
 * Follows the same pattern as budgetVarianceProcessor for consistency
 */

import { ContributionAnalysisParams } from './contributionTypes';
import { calculateContributionAnalysis } from './contributionAnalysis';

export interface ContributionProcessingResult {
  totalValue: number;
  contributions: Array<{
    category: string;
    subcategory?: string;
    value: number;
    percentage: number;
    rank: number;
  }>;
  metadata: {
    recordCount: number;
    categoriesCount: number;
    topContributor: string;
    topPercentage: number;
    period?: string;
    periodType?: string;
  };
}

export interface ProcessedContributionData {
  success: boolean;
  data: ContributionProcessingResult[];
  summary: {
    totalRecords: number;
    dateRange: { start: string; end: string } | null;
    categories: string[];
  };
}

/**
 * Process CSV data for contribution analysis
 * Handles multiple time scales: all time, quarterly, monthly
 */
export function processContributionData(
  csvData: unknown[],
  params: ContributionAnalysisParams
): ProcessedContributionData {
  console.log('🔄 Processing contribution analysis data:', {
    recordCount: csvData.length,
    params: {
      valueColumn: params.valueColumn,
      categoryColumn: params.categoryColumn,
      subcategoryColumn: params.subcategoryColumn,
      analysisScope: params.analysisScope,
      timePeriodAnalysis: params.timePeriodAnalysis
    }
  });

  try {
    if (!csvData || csvData.length === 0) {
      return {
        success: false,
        data: [],
        summary: {
          totalRecords: 0,
          dateRange: null,
          categories: []
        }
      };
    }

    // Validate required columns exist
    const sampleRow = csvData[0] as Record<string, unknown>;
    const availableColumns = Object.keys(sampleRow);
    
    if (!availableColumns.includes(params.valueColumn)) {
      throw new Error(`Value column "${params.valueColumn}" not found in data`);
    }
    
    if (!availableColumns.includes(params.categoryColumn)) {
      throw new Error(`Category column "${params.categoryColumn}" not found in data`);
    }

    // Convert CSV data to contribution format
    const contributionData = csvData.map((row, index) => {
      const rowData = row as Record<string, unknown>;
      const value = parseFloat(String(rowData[params.valueColumn] || 0));
      
      if (isNaN(value)) {
        console.warn(`Invalid value in row ${index}: ${rowData[params.valueColumn]}`);
        return null;
      }

      const result: Record<string, unknown> = {
        [params.valueColumn]: value,
        [params.categoryColumn]: String(rowData[params.categoryColumn] || 'Unknown')
      };

      // Add subcategory if specified
      if (params.subcategoryColumn && rowData[params.subcategoryColumn]) {
        result[params.subcategoryColumn] = String(rowData[params.subcategoryColumn]);
      }

      // Add date column if time period analysis is enabled
      if (params.timePeriodAnalysis?.enabled && params.timePeriodAnalysis.dateColumn) {
        const dateValue = rowData[params.timePeriodAnalysis.dateColumn];
        if (dateValue) {
          result[params.timePeriodAnalysis.dateColumn] = String(dateValue);
        }
      }

      return result;
    }).filter(row => row !== null);

    console.log(`✅ Converted ${contributionData.length} valid records for contribution analysis`);

    let processedResults: ContributionProcessingResult[] = [];

    // Check if time period analysis is enabled
    if (params.timePeriodAnalysis?.enabled && params.timePeriodAnalysis.dateColumn) {
      // Process by time periods (quarterly or monthly)
      processedResults = processDataByTimePeriods(contributionData, params);
    } else {
      // Process all data as a single period
      processedResults = [processAllTimeData(contributionData, params)];
    }

    // Get unique categories for summary
    const categorySet = new Set<string>();
    contributionData.forEach(row => {
      categorySet.add(String(row[params.categoryColumn]));
    });
    const uniqueCategories = Array.from(categorySet);

    // Calculate date range
    let dateRange: { start: string; end: string } | null = null;
    if (params.timePeriodAnalysis?.enabled && params.timePeriodAnalysis.dateColumn) {
      const dates = contributionData
        .map(row => row[params.timePeriodAnalysis!.dateColumn])
        .filter(date => date)
        .map(date => new Date(String(date)))
        .filter(date => !isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      if (dates.length > 0) {
        dateRange = {
          start: dates[0].toISOString().split('T')[0],
          end: dates[dates.length - 1].toISOString().split('T')[0]
        };
      }
    }

    return {
      success: true,
      data: processedResults,
      summary: {
        totalRecords: contributionData.length,
        dateRange,
        categories: uniqueCategories
      }
    };

  } catch (error) {
    console.error('❌ Error processing contribution data:', error);
    return {
      success: false,
      data: [],
      summary: {
        totalRecords: 0,
        dateRange: null,
        categories: []
      }
    };
  }
}

/**
 * Process data for all time (no time period breakdown)
 */
function processAllTimeData(
  data: Record<string, unknown>[],
  params: ContributionAnalysisParams
): ContributionProcessingResult {
  // Calculate contributions using existing analysis engine
  const analysisResult = calculateContributionAnalysis(data as any[], params);
  
  if (!analysisResult.success || !analysisResult.analysis) {
    return {
      totalValue: 0,
      contributions: [],
      metadata: {
        recordCount: data.length,
        categoriesCount: 0,
        topContributor: '',
        topPercentage: 0
      }
    };
  }

  const totalValue = analysisResult.metadata?.totalValue || 0;
  const contributions = analysisResult.analysis.map((item, index) => ({
    category: item.category,
    subcategory: item.subcategory,
    value: item.value,
    percentage: item.contributionPercent,
    rank: index + 1
  }));

  return {
    totalValue,
    contributions,
    metadata: {
      recordCount: data.length,
      categoriesCount: analysisResult.metadata?.totalCategories || 0,
      topContributor: analysisResult.metadata?.topContributor || '',
      topPercentage: analysisResult.metadata?.topContribution || 0
    }
  };
}

/**
 * Process data by time periods (quarterly or monthly)
 */
function processDataByTimePeriods(
  data: Record<string, unknown>[],
  params: ContributionAnalysisParams
): ContributionProcessingResult[] {
  const dateColumn = params.timePeriodAnalysis!.dateColumn;
  const periodType = params.timePeriodAnalysis!.periodType;

  // Group data by time periods
  const groupedData: { [period: string]: any[] } = {};

  data.forEach(row => {
    const dateValue = row[dateColumn];
    if (!dateValue) return;

    const date = new Date(String(dateValue));
    if (isNaN(date.getTime())) return;

    let period: string;
    
    if (periodType === 'quarter') {
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      period = `${date.getFullYear()}-Q${quarter}`;
    } else if (periodType === 'month') {
      period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      period = 'All Time';
    }

    if (!groupedData[period]) {
      groupedData[period] = [];
    }
    groupedData[period].push(row as any);
  });

  // Process each period
  const results: ContributionProcessingResult[] = [];
  
  Object.entries(groupedData).forEach(([period, periodData]) => {
    const analysisResult = calculateContributionAnalysis(periodData as any[], params);
    
    if (analysisResult.success && analysisResult.analysis) {
      const totalValue = analysisResult.metadata?.totalValue || 0;
      const contributions = analysisResult.analysis.map((item, index) => ({
        category: item.category,
        subcategory: item.subcategory,
        value: item.value,
        percentage: item.contributionPercent,
        rank: index + 1
      }));

      results.push({
        totalValue,
        contributions,
        metadata: {
          recordCount: periodData.length,
          categoriesCount: analysisResult.metadata?.totalCategories || 0,
          topContributor: analysisResult.metadata?.topContributor || '',
          topPercentage: analysisResult.metadata?.topContribution || 0,
          period,
          periodType
        }
      });
    }
  });

  // Sort results by period
  results.sort((a, b) => {
    const periodA = a.metadata.period || '';
    const periodB = b.metadata.period || '';
    return periodA.localeCompare(periodB);
  });

  return results;
}
