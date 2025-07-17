/**
 * AI-Driven Column Detection Service
 * Uses intelligent heuristics and pattern matching to automatically detect column types
 * Provides confidence scores and multiple suggestions for each column type
 */

import { getNumericFields, getDateFields, getTextFields } from './csvFieldAnalyzer';

export interface ColumnSuggestion {
  column: string;
  confidence: number; // 0-100
  reason: string;
  alternatives?: string[];
}

export interface AIColumnDetectionResult {
  primaryValue: ColumnSuggestion;
  secondaryValue?: ColumnSuggestion;
  date: ColumnSuggestion;
  primaryCategory: ColumnSuggestion;
  secondaryCategory?: ColumnSuggestion;
  confidence: number; // Overall confidence score
  suggestions?: string[]; // Additional suggestions for improvement
}

/**
 * Advanced pattern matching for value columns
 * Uses semantic analysis and domain knowledge
 */
const VALUE_PATTERNS = {
  // Revenue patterns (high confidence)
  revenue: {
    keywords: ['revenue', 'sales', 'income', 'gross', 'net', 'total_sales', 'turnover', 'sales_amount'],
    confidence: 95,
    priority: 1
  },
  // Actual vs budget patterns
  actual: {
    keywords: ['actual', 'real', 'current', 'ytd', 'mtd', 'qtd', 'achieved', 'actual_spend'],
    confidence: 90,
    priority: 2
  },
  budget: {
    keywords: ['budget', 'plan', 'forecast', 'target', 'projected', 'expected', 'planned', 'planned_spend', 'forecast_amount'],
    confidence: 85,
    priority: 3
  },
  // Cost patterns
  cost: {
    keywords: ['cost', 'expense', 'spend', 'expenditure', 'opex', 'capex'],
    confidence: 80,
    priority: 4
  },
  // Quantity patterns
  quantity: {
    keywords: ['quantity', 'qty', 'units', 'volume', 'count', 'amount'],
    confidence: 75,
    priority: 5
  },
  // Generic value patterns
  value: {
    keywords: ['value', 'sum', 'total', 'figure', 'number'],
    confidence: 60,
    priority: 6
  }
};

/**
 * Category column patterns
 * Identifies grouping and classification columns
 */
const CATEGORY_PATTERNS = {
  product: {
    keywords: ['product', 'item', 'sku', 'model', 'variant', 'goods'],
    confidence: 90,
    priority: 1
  },
  category: {
    keywords: ['category', 'class', 'type', 'group', 'segment', 'division'],
    confidence: 85,
    priority: 2
  },
  region: {
    keywords: ['region', 'territory', 'area', 'location', 'zone', 'country', 'state'],
    confidence: 80,
    priority: 3
  },
  department: {
    keywords: ['department', 'dept', 'team', 'unit', 'business_unit', 'division'],
    confidence: 75,
    priority: 4
  },
  channel: {
    keywords: ['channel', 'source', 'medium', 'platform', 'outlet'],
    confidence: 70,
    priority: 5
  },
  customer: {
    keywords: ['customer', 'client', 'account', 'buyer', 'user'],
    confidence: 65,
    priority: 6
  }
};

/**
 * Date column patterns
 * Identifies temporal columns with various formats
 */
const DATE_PATTERNS = {
  date: {
    keywords: ['date', 'time', 'timestamp', 'created', 'updated', 'modified'],
    confidence: 95,
    priority: 1
  },
  transaction: {
    keywords: ['transaction_date', 'order_date', 'purchase_date', 'invoice_date', 'transaction'],
    confidence: 90,
    priority: 2
  },
  period: {
    keywords: ['period', 'month', 'quarter', 'year', 'week', 'day'],
    confidence: 85,
    priority: 3
  }
};

/**
 * Analyzes column content to determine data type and patterns
 */
function analyzeColumnContent(data: unknown[], columnName: string): {
  isNumeric: boolean;
  isDate: boolean;
  isText: boolean;
  uniqueValues: number;
  sampleValues: unknown[];
  patterns: string[];
} {
  const values = data.map(row => (row as any)[columnName]).filter(v => v != null);
  const uniqueValues = new Set(values).size;
  const sampleValues = values.slice(0, 10);
  const patterns: string[] = [];

  // Check for numeric patterns
  const numericCount = values.filter(v => !isNaN(Number(v))).length;
  const isNumeric = numericCount > values.length * 0.8;

  // Check for date patterns
  const dateCount = values.filter(v => {
    const date = new Date(v as string);
    return !isNaN(date.getTime());
  }).length;
  const isDate = dateCount > values.length * 0.6;

  // Check for text patterns
  const isText = !isNumeric && !isDate;

  // Pattern detection
  if (isNumeric) {
    patterns.push('numeric');
    if (values.some(v => String(v).includes('.'))) patterns.push('decimal');
    if (values.some(v => Number(v) < 0)) patterns.push('negative');
  }

  if (isDate) {
    patterns.push('temporal');
    if (values.some(v => String(v).includes('/'))) patterns.push('date_slash');
    if (values.some(v => String(v).includes('-'))) patterns.push('date_dash');
  }

  if (isText) {
    patterns.push('categorical');
    if (uniqueValues < values.length * 0.1) patterns.push('low_cardinality');
    if (uniqueValues > values.length * 0.8) patterns.push('high_cardinality');
  }

  return {
    isNumeric,
    isDate,
    isText,
    uniqueValues,
    sampleValues,
    patterns
  };
}

/**
 * Calculates confidence score for a column suggestion
 */
function calculateConfidence(
  columnName: string,
  patterns: any,
  contentAnalysis: any,
  expectedType: 'value' | 'category' | 'date'
): number {
  let confidence = 0;
  let bestMatch = '';
  let bestScore = 0;

  // Check pattern matches - use exact keyword matching with partial matches
  for (const [patternName, pattern] of Object.entries(patterns)) {
    const patternInfo = pattern as any;
    const columnLower = columnName.toLowerCase();
    
    // Check for exact keyword matches
    const exactMatches = patternInfo.keywords.filter((keyword: string) => 
      columnLower.includes(keyword.toLowerCase())
    );
    
    if (exactMatches.length > 0) {
      // Higher score for exact matches
      const exactScore = (exactMatches.length / patternInfo.keywords.length) * patternInfo.confidence;
      
      // Bonus for multiple keyword matches
      const multiMatchBonus = exactMatches.length > 1 ? 10 : 0;
      
      // Bonus for full word matches vs partial
      const fullWordBonus = exactMatches.some((keyword: string) => 
        columnLower === keyword.toLowerCase() || 
        columnLower.endsWith('_' + keyword.toLowerCase()) ||
        columnLower.startsWith(keyword.toLowerCase() + '_')
      ) ? 15 : 0;
      
      const totalScore = exactScore + multiMatchBonus + fullWordBonus;
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMatch = patternName;
      }
    }
  }

  confidence = bestScore;

  // Content analysis boost
  if (expectedType === 'value' && contentAnalysis.isNumeric) {
    confidence += 15;
  } else if (expectedType === 'date' && contentAnalysis.isDate) {
    confidence += 20;
  } else if (expectedType === 'category' && contentAnalysis.isText) {
    confidence += 10;
  }

  // Uniqueness considerations for categories
  if (expectedType === 'category') {
    if (contentAnalysis.uniqueValues < 20) {
      confidence += 15; // Good for primary categories
    } else if (contentAnalysis.uniqueValues > 100) {
      confidence -= 10; // Too many unique values
    }
  }

  // Penalty for mismatched content types
  if (expectedType === 'value' && !contentAnalysis.isNumeric) {
    confidence -= 30;
  } else if (expectedType === 'date' && !contentAnalysis.isDate) {
    confidence -= 20;
  }

  return Math.min(100, Math.max(0, confidence));
}

/**
 * Main AI-driven column detection function
 */
export function detectColumnsWithAI(csvData: unknown[]): AIColumnDetectionResult {
  if (!csvData || csvData.length === 0) {
    throw new Error('No data provided for column detection');
  }

  const numericFields = getNumericFields(csvData);
  const dateFields = getDateFields(csvData);
  const textFields = getTextFields(csvData);

  const suggestions: string[] = [];
  let overallConfidence = 0;

  // Analyze each column
  const columnAnalysis = [...numericFields, ...dateFields, ...textFields].map(col => ({
    name: col,
    analysis: analyzeColumnContent(csvData, col)
  }));

  // Detect primary value column
  const valueColumnCandidates = numericFields.map(col => ({
    column: col,
    confidence: calculateConfidence(col, VALUE_PATTERNS, 
      columnAnalysis.find(c => c.name === col)?.analysis, 'value'),
    reason: `Numeric column with value-related naming patterns`
  })).sort((a, b) => b.confidence - a.confidence);

  const primaryValue: ColumnSuggestion = valueColumnCandidates[0] || {
    column: numericFields[0] || 'Value',
    confidence: 30,
    reason: 'Fallback to first numeric column',
    alternatives: valueColumnCandidates.slice(1, 3).map(c => c.column)
  };

  // Detect secondary value column (budget/forecast)
  const secondaryValueCandidates = numericFields
    .filter(col => col !== primaryValue.column)
    .map(col => ({
      column: col,
      confidence: calculateConfidence(col, VALUE_PATTERNS, 
        columnAnalysis.find(c => c.name === col)?.analysis, 'value'),
      reason: `Secondary value column for comparison`
    }))
    .sort((a, b) => b.confidence - a.confidence);

  const secondaryValue: ColumnSuggestion | undefined = secondaryValueCandidates[0];

  // Detect date column
  const dateColumnCandidates = dateFields.map(col => ({
    column: col,
    confidence: calculateConfidence(col, DATE_PATTERNS, 
      columnAnalysis.find(c => c.name === col)?.analysis, 'date'),
    reason: 'Date/time column for temporal analysis'
  })).sort((a, b) => b.confidence - a.confidence);

  const date: ColumnSuggestion = dateColumnCandidates[0] || {
    column: dateFields[0] || 'Date',
    confidence: dateFields.length > 0 ? 80 : 20,
    reason: dateFields.length > 0 ? 'Detected date column' : 'No date column found',
    alternatives: dateColumnCandidates.slice(1, 2).map(c => c.column)
  };

  // Detect primary category column
  const categoryColumnCandidates = textFields.map(col => ({
    column: col,
    confidence: calculateConfidence(col, CATEGORY_PATTERNS, 
      columnAnalysis.find(c => c.name === col)?.analysis, 'category'),
    reason: 'Primary grouping column for categorization'
  })).sort((a, b) => b.confidence - a.confidence);

  const primaryCategory: ColumnSuggestion = categoryColumnCandidates[0] || {
    column: textFields[0] || 'Category',
    confidence: textFields.length > 0 ? 60 : 10,
    reason: textFields.length > 0 ? 'First text column' : 'No category column found',
    alternatives: categoryColumnCandidates.slice(1, 3).map(c => c.column)
  };

  // Detect secondary category column
  const secondaryCategory: ColumnSuggestion | undefined = categoryColumnCandidates
    .filter(c => c.column !== primaryCategory.column)[0];

  // Calculate overall confidence
  overallConfidence = Math.round(
    (primaryValue.confidence + date.confidence + primaryCategory.confidence + 
     (secondaryValue?.confidence || 0) + (secondaryCategory?.confidence || 0)) / 
    (secondaryValue && secondaryCategory ? 5 : secondaryValue || secondaryCategory ? 4 : 3)
  );

  // Generate suggestions
  if (overallConfidence < 70) {
    suggestions.push('Consider reviewing column mappings - some auto-detections have low confidence');
  }
  
  if (numericFields.length > 2) {
    suggestions.push('Multiple numeric columns detected - verify primary/secondary value selections');
  }
  
  if (dateFields.length === 0) {
    suggestions.push('No date columns detected - temporal analysis may be limited');
  }

  if (textFields.length === 0) {
    suggestions.push('No text columns detected - categorization analysis may be limited');
  }

  return {
    primaryValue,
    secondaryValue,
    date,
    primaryCategory,
    secondaryCategory,
    confidence: overallConfidence,
    suggestions
  };
}

/**
 * Converts AI detection result to GlobalAnalysisSettings format
 */
export function convertToGlobalSettings(
  detection: AIColumnDetectionResult
): {
  primaryValueColumn: string;
  secondaryValueColumn?: string;
  dateColumn: string;
  primaryCategoryColumn: string;
  secondaryCategoryColumn?: string;
  defaultTimeScale: 'year' | 'quarter' | 'month' | 'week';
  defaultTopN: number;
  defaultConfidenceLevel: number;
  showPercentages: boolean;
  currencyFormat: string;
} {
  return {
    primaryValueColumn: detection.primaryValue.column,
    secondaryValueColumn: detection.secondaryValue?.column,
    dateColumn: detection.date.column,
    primaryCategoryColumn: detection.primaryCategory.column,
    secondaryCategoryColumn: detection.secondaryCategory?.column,
    defaultTimeScale: 'month',
    defaultTopN: 5,
    defaultConfidenceLevel: 95,
    showPercentages: true,
    currencyFormat: 'USD'
  };
}
