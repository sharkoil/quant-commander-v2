/**
 * Column Intelligence System
 * Uses LLM to automatically detect and map CSV columns to analyzer requirements
 */

export interface ColumnMapping {
  dateColumn?: string;
  valueColumns: {
    actual?: string;
    budget?: string;
    forecast?: string;
    previous?: string;
    target?: string;
  };
  categoryColumns: string[];
  metricType: 'revenue' | 'sales' | 'expenses' | 'profit' | 'units' | 'other';
  confidence: number; // 0-1 score
}

export interface AnalyzerRequirements {
  requiredColumns: string[];
  optionalColumns: string[];
  columnTypes: Record<string, 'date' | 'numeric' | 'categorical'>;
}

/**
 * Analyzer-specific column requirements
 */
export const ANALYZER_REQUIREMENTS: Record<string, AnalyzerRequirements> = {
  periodVariance: {
    requiredColumns: ['date', 'value'],
    optionalColumns: ['category'],
    columnTypes: {
      date: 'date',
      value: 'numeric',
      category: 'categorical'
    }
  },
  budgetVariance: {
    requiredColumns: ['period', 'actual', 'budget'],
    optionalColumns: ['category', 'forecast'],
    columnTypes: {
      period: 'date',
      actual: 'numeric',
      budget: 'numeric',
      forecast: 'numeric',
      category: 'categorical'
    }
  }
};

/**
 * Analyze CSV headers and sample data to detect column semantics
 */
export async function analyzeColumnSemantics(
  headers: string[],
  sampleRows: Record<string, string | number>[],
  analyzerType: string
): Promise<ColumnMapping> {
  
  // Step 1: Basic pattern matching for common column names
  const datePatterns = /^(date|period|time|month|quarter|year|week)$/i;
  const actualPatterns = /^(actual|real|current|achieved|performance)$/i;
  const budgetPatterns = /^(budget|planned|target|goal|expected)$/i;
  const forecastPatterns = /^(forecast|predicted|projected|estimate)$/i;
  
  const mapping: ColumnMapping = {
    valueColumns: {},
    categoryColumns: [],
    metricType: 'other',
    confidence: 0
  };

  // Step 2: Analyze each header
  for (const header of headers) {
    const lowerHeader = header.toLowerCase();
    
    if (datePatterns.test(lowerHeader)) {
      mapping.dateColumn = header;
    } else if (actualPatterns.test(lowerHeader)) {
      mapping.valueColumns.actual = header;
    } else if (budgetPatterns.test(lowerHeader)) {
      mapping.valueColumns.budget = header;
    } else if (forecastPatterns.test(lowerHeader)) {
      mapping.valueColumns.forecast = header;
    } else if (isNumericColumn(header, sampleRows)) {
      // Potential value column - will need LLM analysis
      if (!mapping.valueColumns.actual) {
        mapping.valueColumns.actual = header;
      }
    } else {
      mapping.categoryColumns.push(header);
    }
  }

  // Step 3: Detect metric type from column names and data
  mapping.metricType = detectMetricType(headers);
  
  // Step 4: Calculate confidence based on matches
  mapping.confidence = calculateMappingConfidence(mapping, ANALYZER_REQUIREMENTS[analyzerType]);

  return mapping;
}

/**
 * Check if a column contains numeric data
 */
function isNumericColumn(columnName: string, sampleRows: Record<string, string | number>[]): boolean {
  if (sampleRows.length === 0) return false;
  
  const sampleValues = sampleRows.slice(0, 5).map(row => row[columnName]);
  const numericCount = sampleValues.filter(val => {
    const strVal = String(val);
    return !isNaN(parseFloat(strVal)) && isFinite(Number(strVal));
  }).length;
  
  return numericCount / sampleValues.length >= 0.8; // 80% numeric threshold
}

/**
 * Detect the type of metric from column names and data patterns
 */
function detectMetricType(headers: string[]): ColumnMapping['metricType'] {
  const headerText = headers.join(' ').toLowerCase();
  
  if (/revenue|income|earnings/.test(headerText)) return 'revenue';
  if (/sales|sold|orders/.test(headerText)) return 'sales';
  if (/expense|cost|spend/.test(headerText)) return 'expenses';
  if (/profit|margin|net/.test(headerText)) return 'profit';
  if (/units|quantity|count/.test(headerText)) return 'units';
  
  return 'other';
}

/**
 * Calculate confidence score for column mapping
 */
function calculateMappingConfidence(
  mapping: ColumnMapping, 
  requirements: AnalyzerRequirements
): number {
  let score = 0;
  const totalRequired = requirements.requiredColumns.length;
  
  // Check if required columns are mapped
  if (mapping.dateColumn && requirements.requiredColumns.includes('date')) score++;
  if (mapping.dateColumn && requirements.requiredColumns.includes('period')) score++;
  if (mapping.valueColumns.actual && requirements.requiredColumns.includes('actual')) score++;
  if (mapping.valueColumns.budget && requirements.requiredColumns.includes('budget')) score++;
  if (mapping.valueColumns.actual && requirements.requiredColumns.includes('value')) score++;
  
  return Math.min(score / totalRequired, 1.0);
}

/**
 * Generate LLM prompt for column analysis when confidence is low
 */
export function generateColumnAnalysisPrompt(
  headers: string[],
  sampleRows: Record<string, string | number>[],
  analyzerType: string
): string {
  const requirements = ANALYZER_REQUIREMENTS[analyzerType];
  
  return `
Analyze this CSV data structure for ${analyzerType} analysis:

Headers: ${headers.join(', ')}

Sample data (first 3 rows):
${sampleRows.slice(0, 3).map(row => 
  headers.map(h => `${h}: ${row[h]}`).join(', ')
).join('\n')}

Required columns for ${analyzerType}:
${requirements.requiredColumns.map(col => `- ${col} (${requirements.columnTypes[col]})`).join('\n')}

Optional columns:
${requirements.optionalColumns.map(col => `- ${col} (${requirements.columnTypes[col]})`).join('\n')}

Please identify which CSV columns map to the required analyzer columns. Return a JSON object with the mapping:

{
  "dateColumn": "column_name_for_dates",
  "valueColumns": {
    "actual": "column_name_for_actual_values",
    "budget": "column_name_for_budget_values",
    "forecast": "column_name_for_forecast_values"
  },
  "categoryColumns": ["category_column_names"],
  "metricType": "revenue|sales|expenses|profit|units|other",
  "confidence": 0.95,
  "reasoning": "Explanation of the mapping decisions"
}
`;
}

/**
 * Transform CSV data according to column mapping for analyzer
 */
export function transformDataForAnalyzer(
  csvData: Record<string, string | number>[],
  mapping: ColumnMapping,
  analyzerType: string
): Record<string, string | number | undefined>[] {
  
  switch (analyzerType) {
    case 'periodVariance':
      return csvData.map(row => ({
        date: row[mapping.dateColumn!],
        value: parseFloat(String(row[mapping.valueColumns.actual!])) || 0,
        category: mapping.categoryColumns[0] ? row[mapping.categoryColumns[0]] : undefined
      }));
      
    case 'budgetVariance':
      return csvData.map(row => ({
        period: row[mapping.dateColumn!],
        actual: parseFloat(String(row[mapping.valueColumns.actual!])) || 0,
        budget: parseFloat(String(row[mapping.valueColumns.budget!])) || 0,
        forecast: mapping.valueColumns.forecast ? parseFloat(String(row[mapping.valueColumns.forecast])) : undefined,
        category: mapping.categoryColumns[0] ? row[mapping.categoryColumns[0]] : undefined
      }));
      
    default:
      return csvData;
  }
}
