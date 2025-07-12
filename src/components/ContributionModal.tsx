/**
 * Contribution Analysis Modal Component
 * Provides user interface for configuring contribution analysis parameters
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ContributionAnalysisParams } from '../lib/analyzers/contributionTypes';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (params: ContributionAnalysisParams) => void;
  csvColumns: string[];
  csvData: unknown[];
}

interface ColumnSuggestion {
  columnName: string;
  confidence: number;
  type: 'numeric' | 'category' | 'date' | 'text';
  reasoning: string;
}

export default function ContributionModal({
  isOpen,
  onClose,
  onAnalyze,
  csvColumns,
  csvData
}: ContributionModalProps) {
  // Form state
  const [valueColumn, setValueColumn] = useState('');
  const [categoryColumn, setCategoryColumn] = useState('');
  const [subcategoryColumn, setSubcategoryColumn] = useState('');
  const [analysisScope, setAnalysisScope] = useState<'total' | 'average' | 'period'>('total');
  const [periodColumn, setPeriodColumn] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [minimumContribution, setMinimumContribution] = useState(1);
  const [showOthers, setShowOthers] = useState(true);
  const [sortBy, setSortBy] = useState<'contribution' | 'value' | 'alphabetical'>('contribution');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [includePercentiles, setIncludePercentiles] = useState(true);
  
  // NEW: Time period analysis state
  const [timePeriodEnabled, setTimePeriodEnabled] = useState(false);
  const [timePeriodType, setTimePeriodType] = useState<'quarter' | 'month'>('quarter');
  const [dateColumn, setDateColumn] = useState('');
  const [compareAcrossPeriods, setCompareAcrossPeriods] = useState(true);
  const [specificPeriod, setSpecificPeriod] = useState('');

  // Analysis state
  const [isAnalyzingColumns, setIsAnalyzingColumns] = useState(false);
  const [columnSuggestions, setColumnSuggestions] = useState<ColumnSuggestion[]>([]);

  /**
   * Analyze columns for contribution suitability
   */
  const analyzeColumns = useCallback(async () => {
    if (csvColumns.length === 0 || csvData.length === 0) return;

    setIsAnalyzingColumns(true);
    
    try {
      const suggestions: ColumnSuggestion[] = [];

      csvColumns.forEach(column => {
        const suggestion = analyzeColumnForContribution(column, csvData.map(row => {
          if (row && typeof row === 'object' && column in row) {
            return (row as Record<string, unknown>)[column];
          }
          return null;
        }));
        if (suggestion) {
          suggestions.push(suggestion);
        }
      });

      // Sort by confidence score
      suggestions.sort((a, b) => b.confidence - a.confidence);
      setColumnSuggestions(suggestions);
      
      // Auto-select best suggestions
      const bestNumeric = suggestions.find(s => s.type === 'numeric');
      const bestCategory = suggestions.find(s => s.type === 'category');
      const bestDate = suggestions.find(s => s.type === 'date');

      if (bestNumeric) setValueColumn(bestNumeric.columnName);
      if (bestCategory) setCategoryColumn(bestCategory.columnName);
      if (bestDate) setPeriodColumn(bestDate.columnName);

    } catch (error) {
      console.error('Column analysis failed:', error);
    } finally {
      setIsAnalyzingColumns(false);
    }
  }, [csvColumns, csvData]);

  // Run column analysis when modal opens
  useEffect(() => {
    if (isOpen && csvColumns.length > 0) {
      analyzeColumns();
    }
  }, [isOpen, csvColumns, analyzeColumns]);

  /**
   * Analyze individual column for contribution analysis suitability
   */
  const analyzeColumnForContribution = (columnName: string, data: unknown[]): ColumnSuggestion | null => {
    if (data.length === 0) return null;

    const lowerName = columnName.toLowerCase();
    let confidence = 0;
    let type: ColumnSuggestion['type'] = 'category';
    let reasoning = '';

    // Check for numeric data (suitable for value analysis)
    const numericValues = data.filter(val => !isNaN(Number(val)) && val !== null && val !== '');
    const numericRatio = numericValues.length / data.length;

    if (numericRatio > 0.8) {
      type = 'numeric';
      confidence += 40;
      reasoning = 'High numeric content suitable for value analysis';

      // Boost confidence for financial/business terms
      if (lowerName.includes('revenue') || lowerName.includes('sales') || 
          lowerName.includes('amount') || lowerName.includes('value') ||
          lowerName.includes('cost') || lowerName.includes('price')) {
        confidence += 30;
        reasoning += ' with business/financial terminology';
      }

      // Boost for units/quantity
      if (lowerName.includes('units') || lowerName.includes('quantity') || 
          lowerName.includes('count') || lowerName.includes('volume')) {
        confidence += 20;
        reasoning += ' representing quantities';
      }
    }

    // Check for categorical data (suitable for grouping)
    const uniqueValues = new Set(data.filter(val => val !== null && val !== ''));
    const uniquenessRatio = uniqueValues.size / data.length;

    if (uniquenessRatio < 0.5 && uniqueValues.size >= 2) {
      if (type !== 'numeric') {
        type = 'category';
        confidence += 35;
        reasoning = 'Good categorical distribution for grouping analysis';
      }

      // Boost for common business categories
      if (lowerName.includes('category') || lowerName.includes('type') || 
          lowerName.includes('region') || lowerName.includes('product') ||
          lowerName.includes('department') || lowerName.includes('segment')) {
        confidence += 25;
        reasoning += ' with business categorization terms';
      }
    }

    // Check for date/period data
    const dateValues = data.filter(val => {
      if (!val) return false;
      const str = String(val);
      return /\d{4}/.test(str) && (str.includes('-') || str.includes('/') || str.includes('Q'));
    });
    
    if (dateValues.length > data.length * 0.7) {
      type = 'date';
      confidence = Math.max(confidence, 30);
      reasoning = 'Contains date/period information for temporal analysis';

      if (lowerName.includes('date') || lowerName.includes('period') || 
          lowerName.includes('quarter') || lowerName.includes('month')) {
        confidence += 20;
        reasoning += ' with temporal terminology';
      }
    }

    return confidence > 20 ? {
      columnName,
      confidence,
      type,
      reasoning
    } : null;
  };

  /**
   * Handle form submission
   */
  const handleAnalyze = () => {
    if (!valueColumn || !categoryColumn) {
      alert('Please select both a value column and a category column');
      return;
    }

    // Validate time period analysis
    if (timePeriodEnabled && !dateColumn) {
      alert('Please select a date column for time period analysis');
      return;
    }

    const params: ContributionAnalysisParams = {
      valueColumn,
      categoryColumn,
      subcategoryColumn: subcategoryColumn || undefined,
      analysisScope,
      periodColumn: periodColumn || undefined,
      periodFilter: (analysisScope === 'period' && periodFilter) ? periodFilter : undefined,
      minimumContribution,
      showOthers,
      sortBy,
      sortOrder,
      includePercentiles,
      
      // NEW: Add time period analysis parameters
      timePeriodAnalysis: timePeriodEnabled ? {
        enabled: true,
        periodType: timePeriodType,
        compareAcrossPeriods,
        specificPeriod: specificPeriod || undefined,
        dateColumn
      } : undefined
    };

    onAnalyze(params);
    onClose();
  };

  /**
   * Reset form to defaults
   */
  const handleReset = () => {
    setValueColumn('');
    setCategoryColumn('');
    setSubcategoryColumn('');
    setAnalysisScope('total');
    setPeriodColumn('');
    setPeriodFilter('');
    setMinimumContribution(1);
    setShowOthers(true);
    setSortBy('contribution');
    setSortOrder('desc');
    setIncludePercentiles(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">📊</span>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Contribution Analysis</h2>
                <p className="text-gray-600">Analyze percentage contributions to totals</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Column Analysis Status */}
          {isAnalyzingColumns && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-blue-700">Analyzing columns for optimal contribution analysis...</span>
              </div>
            </div>
          )}

          {/* Column Selection */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Column Selection</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Value Column */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value Column *
                  <span className="text-gray-500 ml-1">(numeric data to analyze)</span>
                </label>
                <select
                  value={valueColumn}
                  onChange={(e) => setValueColumn(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  aria-label="Select value column"
                >
                  <option value="">Select value column...</option>
                  {columnSuggestions
                    .filter(s => s.type === 'numeric')
                    .map(suggestion => (
                      <option key={suggestion.columnName} value={suggestion.columnName}>
                        {suggestion.columnName} ({suggestion.confidence}% confidence)
                      </option>
                    ))}
                  {csvColumns
                    .filter(col => !columnSuggestions.some(s => s.columnName === col))
                    .map(column => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                </select>
              </div>

              {/* Category Column */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Column *
                  <span className="text-gray-500 ml-1">(groups to analyze)</span>
                </label>
                <select
                  value={categoryColumn}
                  onChange={(e) => setCategoryColumn(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  aria-label="Select category column"
                >
                  <option value="">Select category column...</option>
                  {columnSuggestions
                    .filter(s => s.type === 'category')
                    .map(suggestion => (
                      <option key={suggestion.columnName} value={suggestion.columnName}>
                        {suggestion.columnName} ({suggestion.confidence}% confidence)
                      </option>
                    ))}
                  {csvColumns
                    .filter(col => !columnSuggestions.some(s => s.columnName === col))
                    .map(column => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Subcategory Column (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory Column (Optional)
                <span className="text-gray-500 ml-1">(for hierarchical breakdown)</span>
              </label>
              <select
                value={subcategoryColumn}
                onChange={(e) => setSubcategoryColumn(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                aria-label="Select subcategory column"
              >
                <option value="">No subcategory breakdown</option>
                {csvColumns
                  .filter(col => col !== valueColumn && col !== categoryColumn)
                  .map(column => (
                    <option key={column} value={column}>{column}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Analysis Scope */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Analysis Scope</h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="analysisScope"
                  value="total"
                  checked={analysisScope === 'total'}
                  onChange={(e) => setAnalysisScope(e.target.value as 'total')}
                  className="text-purple-600"
                />
                <span>Total Contribution (sum all values by category)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="analysisScope"
                  value="average"
                  checked={analysisScope === 'average'}
                  onChange={(e) => setAnalysisScope(e.target.value as 'average')}
                  className="text-purple-600"
                />
                <span>Average Contribution (average values by category)</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="analysisScope"
                  value="period"
                  checked={analysisScope === 'period'}
                  onChange={(e) => setAnalysisScope(e.target.value as 'period')}
                  className="text-purple-600"
                />
                <span>Period-Based Analysis (filter by specific period)</span>
              </label>
            </div>

            {/* Period Selection (if period scope selected) */}
            {analysisScope === 'period' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period Column</label>
                  <select
                    value={periodColumn}
                    onChange={(e) => setPeriodColumn(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    aria-label="Select period column"
                  >
                    <option value="">Select period column...</option>
                    {columnSuggestions
                      .filter(s => s.type === 'date')
                      .map(suggestion => (
                        <option key={suggestion.columnName} value={suggestion.columnName}>
                          {suggestion.columnName}
                        </option>
                      ))}
                    {csvColumns
                      .filter(col => !columnSuggestions.some(s => s.columnName === col))
                      .map(column => (
                        <option key={column} value={column}>{column}</option>
                      ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period Filter</label>
                  <input
                    type="text"
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    placeholder="e.g., 2024-Q1, 2024-01, etc."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Display Options */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Display Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sorting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'contribution' | 'value' | 'alphabetical')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  aria-label="Select sort by option"
                >
                  <option value="contribution">Contribution %</option>
                  <option value="value">Absolute Value</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                  aria-label="Select sort order"
                >
                  <option value="desc">Descending (High to Low)</option>
                  <option value="asc">Ascending (Low to High)</option>
                </select>
              </div>
            </div>

            {/* Minimum Contribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Contribution % (filter out small contributors)
              </label>
              <input
                type="number"
                value={minimumContribution}
                onChange={(e) => setMinimumContribution(Number(e.target.value))}
                min="0"
                max="50"
                step="0.5"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                aria-label="Minimum contribution percentage"
              />
            </div>

            {/* NEW: Time Period Analysis Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">📅 Seasonal Analysis (NEW!)</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={timePeriodEnabled}
                    onChange={(e) => setTimePeriodEnabled(e.target.checked)}
                    className="text-purple-600"
                  />
                  <span className="text-sm font-medium">Enable quarterly/monthly analysis</span>
                </label>
              </div>

              {timePeriodEnabled && (
                <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-700">
                    🎯 Analyze contribution patterns across quarters or months to identify seasonal trends
                  </p>
                  
                  {/* Date Column Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Column <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={dateColumn}
                      onChange={(e) => setDateColumn(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                      required={timePeriodEnabled}
                      title="Select date column for time period analysis"
                      aria-label="Select date column for time period analysis"
                    >
                      <option value="">Select date column...</option>
                      {csvColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* Period Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Analysis Period
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-purple-50">
                        <input
                          type="radio"
                          name="timePeriodType"
                          value="quarter"
                          checked={timePeriodType === 'quarter'}
                          onChange={(e) => setTimePeriodType(e.target.value as 'quarter')}
                          className="text-purple-600"
                        />
                        <div>
                          <div className="font-medium">📊 Quarterly</div>
                          <div className="text-xs text-gray-600">Compare Q1, Q2, Q3, Q4</div>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-purple-50">
                        <input
                          type="radio"
                          name="timePeriodType"
                          value="month"
                          checked={timePeriodType === 'month'}
                          onChange={(e) => setTimePeriodType(e.target.value as 'month')}
                          className="text-purple-600"
                        />
                        <div>
                          <div className="font-medium">📅 Monthly</div>
                          <div className="text-xs text-gray-600">Compare Jan, Feb, Mar...</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Comparison Options */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={compareAcrossPeriods}
                        onChange={(e) => setCompareAcrossPeriods(e.target.checked)}
                        className="text-purple-600"
                      />
                      <span className="text-sm">Compare contributions across periods</span>
                    </label>
                  </div>

                  {/* Specific Period Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific Period (Optional)
                    </label>
                    <input
                      type="text"
                      value={specificPeriod}
                      onChange={(e) => setSpecificPeriod(e.target.value)}
                      placeholder={timePeriodType === 'quarter' ? 'e.g., 2024-Q1' : 'e.g., 2024-Jan'}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to analyze all periods. Format: {timePeriodType === 'quarter' ? '2024-Q1, 2024-Q2, etc.' : '2024-Jan, 2024-Feb, etc.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Options */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showOthers}
                  onChange={(e) => setShowOthers(e.target.checked)}
                  className="text-purple-600"
                />
                <span>Group small contributors as &quot;Others&quot;</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includePercentiles}
                  onChange={(e) => setIncludePercentiles(e.target.checked)}
                  className="text-purple-600"
                />
                <span>Include percentile analysis</span>
              </label>
            </div>
          </div>

          {/* Column Suggestions */}
          {columnSuggestions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Column Suggestions</h4>
              <div className="space-y-1 text-xs">
                {columnSuggestions.slice(0, 3).map(suggestion => (
                  <div key={suggestion.columnName} className="text-gray-600">
                    <span className="font-medium">{suggestion.columnName}</span> ({suggestion.type}): {suggestion.reasoning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Reset
            </button>
            
            <div className="space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!valueColumn || !categoryColumn}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Analyze Contributions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
