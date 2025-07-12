/**
 * Smart CSV Processor with Column Intelligence
 * Automatically detects column types and maps them to analyzer requirements
 */

import { analyzeColumnSemantics, transformDataForAnalyzer, generateColumnAnalysisPrompt, ColumnMapping } from './columnIntelligence';

export interface ProcessedCSVData {
  originalData: Record<string, string | number>[];
  columnMapping: ColumnMapping;
  transformedData: Record<string, string | number | undefined>[];
  suggestedAnalyzers: string[];
  warnings: string[];
}

export interface CSVProcessingOptions {
  analyzerType?: string;
  requireUserConfirmation?: boolean;
  fallbackToManualMapping?: boolean;
}

/**
 * Process CSV data with intelligent column detection
 */
export async function processCSVWithIntelligence(
  csvContent: string,
  options: CSVProcessingOptions = {}
): Promise<ProcessedCSVData> {
  
  // Step 1: Parse CSV
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, string | number> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });

  // Step 2: Analyze column semantics
  const analyzerType = options.analyzerType || 'periodVariance';
  const columnMapping = await analyzeColumnSemantics(headers, rows.slice(0, 5), analyzerType);
  
  const warnings: string[] = [];
  
  // Step 3: Handle low confidence mappings
  if (columnMapping.confidence < 0.7) {
    warnings.push(`Low confidence (${Math.round(columnMapping.confidence * 100)}%) in column mapping for ${analyzerType}`);
    
    if (options.requireUserConfirmation) {
      // Generate prompt for LLM analysis
      const analysisPrompt = generateColumnAnalysisPrompt(headers, rows, analyzerType);
      warnings.push('Manual column mapping may be required');
      warnings.push(`LLM Analysis Prompt: ${analysisPrompt}`);
    }
  }

  // Step 4: Validate required columns are present
  const missingColumns = validateRequiredColumns(columnMapping, analyzerType);
  if (missingColumns.length > 0) {
    warnings.push(`Missing required columns for ${analyzerType}: ${missingColumns.join(', ')}`);
  }

  // Step 5: Transform data for analyzer
  const transformedData = transformDataForAnalyzer(rows, columnMapping, analyzerType);
  
  // Step 6: Suggest appropriate analyzers based on available columns
  const suggestedAnalyzers = suggestAnalyzers(columnMapping);

  return {
    originalData: rows,
    columnMapping,
    transformedData,
    suggestedAnalyzers,
    warnings
  };
}

/**
 * Validate that required columns are mapped
 */
function validateRequiredColumns(mapping: ColumnMapping, analyzerType: string): string[] {
  const missing: string[] = [];
  
  if (analyzerType === 'periodVariance') {
    if (!mapping.dateColumn) missing.push('date/period column');
    if (!mapping.valueColumns.actual) missing.push('value column');
  }
  
  if (analyzerType === 'budgetVariance') {
    if (!mapping.dateColumn) missing.push('date/period column');
    if (!mapping.valueColumns.actual) missing.push('actual values column');
    if (!mapping.valueColumns.budget) missing.push('budget values column');
  }
  
  return missing;
}

/**
 * Suggest appropriate analyzers based on available columns
 */
function suggestAnalyzers(mapping: ColumnMapping): string[] {
  const suggested: string[] = [];
  
  // Period Variance - needs date + numeric value
  if (mapping.dateColumn && mapping.valueColumns.actual) {
    suggested.push('periodVariance');
  }
  
  // Budget Variance - needs date + actual + budget
  if (mapping.dateColumn && mapping.valueColumns.actual && mapping.valueColumns.budget) {
    suggested.push('budgetVariance');
  }
  
  // Trend Analysis - needs date + numeric value (same as period variance)
  if (mapping.dateColumn && mapping.valueColumns.actual) {
    suggested.push('trendAnalysis');
  }
  
  // Top N Analysis - needs categories + numeric values
  if (mapping.categoryColumns.length > 0 && mapping.valueColumns.actual) {
    suggested.push('topBottomAnalysis');
  }
  
  return suggested;
}

/**
 * Manual column mapping interface for user confirmation
 */
export interface ManualColumnMapping {
  dateColumn: string;
  actualColumn: string;
  budgetColumn?: string;
  forecastColumn?: string;
  categoryColumn?: string;
  metricType: 'revenue' | 'sales' | 'expenses' | 'profit' | 'units' | 'other';
}

/**
 * Apply manual column mapping when automatic detection fails
 */
export function applyManualMapping(
  csvData: Record<string, string | number>[],
  manualMapping: ManualColumnMapping,
  analyzerType: string
): Record<string, string | number | undefined>[] {
  
  const columnMapping: ColumnMapping = {
    dateColumn: manualMapping.dateColumn,
    valueColumns: {
      actual: manualMapping.actualColumn,
      budget: manualMapping.budgetColumn,
      forecast: manualMapping.forecastColumn,
    },
    categoryColumns: manualMapping.categoryColumn ? [manualMapping.categoryColumn] : [],
    metricType: manualMapping.metricType,
    confidence: 1.0 // User confirmed
  };
  
  return transformDataForAnalyzer(csvData, columnMapping, analyzerType);
}

/**
 * Get user-friendly column suggestions for manual mapping
 */
export function getColumnSuggestions(headers: string[]): Record<string, string[]> {
  const suggestions: Record<string, string[]> = {
    date: [],
    actual: [],
    budget: [],
    forecast: [],
    category: []
  };
  
  headers.forEach(header => {
    const lower = header.toLowerCase();
    
    if (/date|period|time|month|quarter|year|week/.test(lower)) {
      suggestions.date.push(header);
    }
    if (/actual|real|current|achieved|performance/.test(lower)) {
      suggestions.actual.push(header);
    }
    if (/budget|planned|target|goal|expected/.test(lower)) {
      suggestions.budget.push(header);
    }
    if (/forecast|predicted|projected|estimate/.test(lower)) {
      suggestions.forecast.push(header);
    }
    if (!/date|period|time|month|quarter|year|week/.test(lower) && 
        !/actual|real|current|achieved|performance/.test(lower) &&
        !/budget|planned|target|goal|expected/.test(lower) &&
        !/forecast|predicted|projected|estimate/.test(lower)) {
      suggestions.category.push(header);
    }
  });
  
  return suggestions;
}
