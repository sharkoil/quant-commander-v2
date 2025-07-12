/**
 * Top N / Bottom N Analysis Modal Component
 * Provides intelligent parameter selection for ranking analysis
 * Uses column intelligence to suggest appropriate analysis options
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Define types for the modal interface
export interface TopNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (params: TopNAnalysisParams) => void;
  csvData: (string | number | Date | boolean)[][];
  csvColumns: string[];
}

export interface TopNAnalysisParams {
  analysisType: 'top' | 'bottom' | 'both';
  numberOfItems: number;
  valueColumn: string;
  categoryColumn: string;
  periodColumn?: string;
  analysisScope: 'total' | 'period' | 'growth';
  periodType?: 'MoM' | 'QoQ' | 'YoY';
  periodAggregation?: 'week' | 'month' | 'quarter' | 'year';
  metricName: string;
}

interface ColumnSuggestion {
  columnName: string;
  confidence: number;
  type: 'numeric' | 'category' | 'date' | 'period';
  reasoning: string;
}

const TopNModal: React.FC<TopNModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  csvData,
  csvColumns
}) => {
  // State for form parameters
  const [analysisType, setAnalysisType] = useState<'top' | 'bottom' | 'both'>('top');
  const [numberOfItems, setNumberOfItems] = useState<number>(5);
  const [valueColumn, setValueColumn] = useState<string>('');
  const [categoryColumn, setCategoryColumn] = useState<string>('');
  const [periodColumn, setPeriodColumn] = useState<string>('');
  const [analysisScope, setAnalysisScope] = useState<'total' | 'period' | 'growth'>('total');
  const [periodType, setPeriodType] = useState<'MoM' | 'QoQ' | 'YoY'>('MoM');
  const [periodAggregation, setPeriodAggregation] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [metricName, setMetricName] = useState<string>('Performance Analysis');

  // State for column intelligence
  const [columnSuggestions, setColumnSuggestions] = useState<ColumnSuggestion[]>([]);
  const [isAnalyzingColumns, setIsAnalyzingColumns] = useState<boolean>(false);

  /**
   * Analyze CSV columns to provide intelligent suggestions
   * This mimics the column intelligence system for Top N analysis
   */
  const analyzeColumns = useCallback(async () => {
    if (csvColumns.length === 0 || csvData.length === 0) return;

    setIsAnalyzingColumns(true);
    
    try {
      const suggestions: ColumnSuggestion[] = [];

      // Analyze each column for its suitability
      csvColumns.forEach((column, index) => {
        const columnData = csvData.slice(1).map(row => row[index]); // Skip header
        const suggestion = analyzeColumnForTopN(column, columnData);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      });

      // Sort by confidence score
      suggestions.sort((a, b) => b.confidence - a.confidence);
      setColumnSuggestions(suggestions);        // Auto-select best suggestions
        const bestNumeric = suggestions.find(s => s.type === 'numeric');
        const bestCategory = suggestions.find(s => s.type === 'category');
        const bestPeriod = suggestions.find(s => s.type === 'date' || s.type === 'period');

        if (bestNumeric) setValueColumn(bestNumeric.columnName);
        if (bestCategory) setCategoryColumn(bestCategory.columnName);
        if (bestPeriod) {
          setPeriodColumn(bestPeriod.columnName);
          
          // Auto-select appropriate aggregation based on period column name
          const periodName = bestPeriod.columnName.toLowerCase();
          if (periodName.includes('week')) {
            setPeriodAggregation('week');
          } else if (periodName.includes('quarter') || periodName.includes('q')) {
            setPeriodAggregation('quarter');
          } else if (periodName.includes('year')) {
            setPeriodAggregation('year');
          } else {
            setPeriodAggregation('month'); // default
          }
        }

    } catch (error) {
      console.error('Column analysis failed:', error);
    } finally {
      setIsAnalyzingColumns(false);
    }
  }, [csvColumns, csvData]);

  /**
   * Analyze individual column for Top N suitability
   */
  const analyzeColumnForTopN = (columnName: string, data: unknown[]): ColumnSuggestion | null => {
    if (data.length === 0) return null;

    const lowerName = columnName.toLowerCase();
    let confidence = 0;
    let type: ColumnSuggestion['type'] = 'category';
    let reasoning = '';

    // Check for numeric data (suitable for ranking)
    const numericValues = data.filter(val => !isNaN(Number(val)) && val !== null && val !== '');
    const numericRatio = numericValues.length / data.length;

    if (numericRatio > 0.8) {
      type = 'numeric';
      confidence = 80;
      reasoning = 'High numeric content suitable for ranking';

      // Boost confidence for common value column patterns
      if (lowerName.includes('revenue') || lowerName.includes('sales') || 
          lowerName.includes('amount') || lowerName.includes('value') ||
          lowerName.includes('total') || lowerName.includes('sum')) {
        confidence = 95;
        reasoning = 'Financial metric ideal for Top N analysis';
      } else if (lowerName.includes('count') || lowerName.includes('quantity') ||
                 lowerName.includes('volume') || lowerName.includes('units')) {
        confidence = 90;
        reasoning = 'Quantity metric suitable for ranking';
      } else if (lowerName.includes('percent') || lowerName.includes('rate') ||
                 lowerName.includes('ratio') || lowerName.includes('%')) {
        confidence = 85;
        reasoning = 'Percentage metric good for comparison';
      }
    }
    
    // Check for categorical data (suitable for grouping)
    else if (numericRatio < 0.2) {
      const uniqueValues = new Set(data.filter(val => val !== null && val !== '')).size;
      const uniqueRatio = uniqueValues / data.length;

      if (uniqueRatio > 0.1 && uniqueRatio < 0.8) {
        type = 'category';
        confidence = 75;
        reasoning = 'Good categorical diversity for grouping';

        // Boost confidence for common category patterns
        if (lowerName.includes('category') || lowerName.includes('type') ||
            lowerName.includes('segment') || lowerName.includes('group') ||
            lowerName.includes('department') || lowerName.includes('region') ||
            lowerName.includes('product') || lowerName.includes('customer')) {
          confidence = 90;
          reasoning = 'Ideal categorical column for Top N grouping';
        }
      }
    }

    // Check for date/period data
    const datePattern = /date|time|period|month|quarter|year|q[1-4]|[0-9]{4}|week/i;
    if (datePattern.test(lowerName)) {
      if (lowerName.includes('week')) {
        type = 'period';
        confidence = 90;
        reasoning = 'Weekly period column - ideal for week/month aggregation';
      } else if (lowerName.includes('quarter') || lowerName.includes('q')) {
        type = 'period';
        confidence = 95;
        reasoning = 'Quarterly period column - perfect for quarter/year aggregation';
      } else if (lowerName.includes('month')) {
        type = 'period';
        confidence = 95;
        reasoning = 'Monthly period column - ideal for month/quarter/year aggregation';
      } else if (lowerName.includes('year')) {
        type = 'period';
        confidence = 90;
        reasoning = 'Yearly period column - suitable for year aggregation';
      } else {
        type = 'date';
        confidence = 85;
        reasoning = 'Time-based column for period analysis';
      }
    }

    // Only return suggestions with reasonable confidence
    return confidence > 60 ? {
      columnName,
      confidence,
      type,
      reasoning
    } : null;
  };

  // Run column analysis when modal opens
  useEffect(() => {
    if (isOpen && csvColumns.length > 0) {
      analyzeColumns();
    }
  }, [isOpen, csvColumns, analyzeColumns]);

  /**
   * Handle form submission
   */
  const handleAnalyze = () => {
    if (!valueColumn || !categoryColumn) {
      alert('Please select both a value column and a category column');
      return;
    }

    const params: TopNAnalysisParams = {
      analysisType,
      numberOfItems,
      valueColumn,
      categoryColumn,
      periodColumn: periodColumn || undefined,
      analysisScope,
      periodType: analysisScope === 'growth' ? periodType : undefined,
      periodAggregation: (periodColumn && (analysisScope === 'period' || analysisScope === 'growth')) ? periodAggregation : undefined,
      metricName
    };

    onAnalyze(params);
    onClose();
  };

  /**
   * Reset form to defaults
   */
  const handleReset = () => {
    setAnalysisType('top');
    setNumberOfItems(5);
    setValueColumn('');
    setCategoryColumn('');
    setPeriodColumn('');
    setAnalysisScope('total');
    setPeriodType('MoM');
    setPeriodAggregation('month');
    setMetricName('Performance Analysis');
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🏆 Top N / Bottom N Analysis</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Configuration */}
          <div className="space-y-6">
            {/* Analysis Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['top', 'bottom', 'both'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setAnalysisType(type as 'top' | 'bottom' | 'both')}
                    className={`px-3 py-2 rounded-md text-sm font-medium capitalize ${
                      analysisType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'both' ? 'Top & Bottom' : `${type} N`}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Items */}
            <div>
              <label htmlFor="numberOfItems" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Items (N)
              </label>
              <select
                id="numberOfItems"
                value={numberOfItems}
                onChange={(e) => setNumberOfItems(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select number of items to analyze"
              >
                {[3, 5, 10, 15, 20].map(n => (
                  <option key={n} value={n}>{n} items</option>
                ))}
              </select>
            </div>

            {/* Analysis Scope */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Scope
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="total"
                    checked={analysisScope === 'total'}
                    onChange={(e) => setAnalysisScope(e.target.value as 'total' | 'period' | 'growth')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Total Values (Sum across all periods)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="period"
                    checked={analysisScope === 'period'}
                    onChange={(e) => setAnalysisScope(e.target.value as 'total' | 'period' | 'growth')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Latest Period Values (requires period aggregation)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="growth"
                    checked={analysisScope === 'growth'}
                    onChange={(e) => setAnalysisScope(e.target.value as 'total' | 'period' | 'growth')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Growth Rate Analysis (requires period aggregation)</span>
                </label>
              </div>
            </div>

            {/* Period Type (only for growth analysis) */}
            {analysisScope === 'growth' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Growth Period Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['MoM', 'QoQ', 'YoY'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setPeriodType(type as 'MoM' | 'QoQ' | 'YoY')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        periodType === type
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Period Aggregation (only when period column is selected) */}
            {(periodColumn && (analysisScope === 'period' || analysisScope === 'growth')) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Aggregation Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['week', 'month', 'quarter', 'year'].map((agg) => (
                    <button
                      key={agg}
                      onClick={() => setPeriodAggregation(agg as 'week' | 'month' | 'quarter' | 'year')}
                      className={`px-3 py-2 rounded-md text-sm font-medium capitalize ${
                        periodAggregation === agg
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {agg}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  💡 <strong>Tip:</strong> Data will be grouped by {periodAggregation} before analysis
                </div>
              </div>
            )}

            {/* Metric Name */}
            <div>
              <label htmlFor="metricName" className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Name
              </label>
              <input
                id="metricName"
                type="text"
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
                placeholder="e.g., Top Revenue Performers"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Enter analysis name"
              />
            </div>
          </div>

          {/* Right Column: Column Selection */}
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🧠 Intelligent Column Detection</h3>
              {isAnalyzingColumns ? (
                <div className="text-blue-700">Analyzing columns...</div>
              ) : (
                <div className="text-sm text-blue-700">
                  Columns analyzed with confidence scores and suggestions
                </div>
              )}
            </div>

            {/* Value Column Selection */}
            <div>
              <label htmlFor="valueColumn" className="block text-sm font-medium text-gray-700 mb-2">
                Value Column (for ranking) *
              </label>
              <select
                id="valueColumn"
                value={valueColumn}
                onChange={(e) => setValueColumn(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select column for ranking values"
              >
                <option value="">Select a numeric column...</option>
                {columnSuggestions
                  .filter(s => s.type === 'numeric')
                  .map(suggestion => (
                    <option key={suggestion.columnName} value={suggestion.columnName}>
                      {suggestion.columnName} ({suggestion.confidence}% confidence)
                    </option>
                  ))}
                {csvColumns
                  .filter(col => !columnSuggestions.some(s => s.columnName === col))
                  .map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
              </select>
              {valueColumn && columnSuggestions.find(s => s.columnName === valueColumn) && (
                <div className="mt-1 text-xs text-green-600">
                  ✓ {columnSuggestions.find(s => s.columnName === valueColumn)?.reasoning}
                </div>
              )}
            </div>

            {/* Category Column Selection */}
            <div>
              <label htmlFor="categoryColumn" className="block text-sm font-medium text-gray-700 mb-2">
                Category Column (for grouping) *
              </label>
              <select
                id="categoryColumn"
                value={categoryColumn}
                onChange={(e) => setCategoryColumn(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select column for grouping categories"
              >
                <option value="">Select a category column...</option>
                {columnSuggestions
                  .filter(s => s.type === 'category')
                  .map(suggestion => (
                    <option key={suggestion.columnName} value={suggestion.columnName}>
                      {suggestion.columnName} ({suggestion.confidence}% confidence)
                    </option>
                  ))}
                {csvColumns
                  .filter(col => !columnSuggestions.some(s => s.columnName === col))
                  .map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
              </select>
              {categoryColumn && columnSuggestions.find(s => s.columnName === categoryColumn) && (
                <div className="mt-1 text-xs text-green-600">
                  ✓ {columnSuggestions.find(s => s.columnName === categoryColumn)?.reasoning}
                </div>
              )}
            </div>

            {/* Period Column Selection (optional) */}
            <div>
              <label htmlFor="periodColumn" className="block text-sm font-medium text-gray-700 mb-2">
                Period Column (optional, for time-based analysis)
              </label>
              <select
                id="periodColumn"
                value={periodColumn}
                onChange={(e) => setPeriodColumn(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select column for period analysis"
              >
                <option value="">No period analysis</option>
                {columnSuggestions
                  .filter(s => s.type === 'date' || s.type === 'period')
                  .map(suggestion => (
                    <option key={suggestion.columnName} value={suggestion.columnName}>
                      {suggestion.columnName} ({suggestion.confidence}% confidence)
                    </option>
                  ))}
                {csvColumns
                  .filter(col => !columnSuggestions.some(s => s.columnName === col))
                  .map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
              </select>
            </div>

            {/* Column Suggestions Display */}
            {columnSuggestions.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Column Analysis Results:</h4>
                <div className="space-y-1 text-xs">
                  {columnSuggestions.slice(0, 5).map(suggestion => (
                    <div key={suggestion.columnName} className="flex justify-between">
                      <span className="font-medium text-gray-900">{suggestion.columnName}</span>
                      <span className="text-gray-500">
                        {suggestion.type} ({suggestion.confidence}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Reset to Defaults
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!valueColumn || !categoryColumn}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              🚀 Run Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNModal;
