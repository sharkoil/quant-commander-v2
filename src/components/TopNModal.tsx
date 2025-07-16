/**
 * Top N and Bottom N Analy  // Form state managed by TopN analysis
  const [analysisParams, setAnalysisParams] = useState<TopNAnalysisParams>({
    valueColumn: '',
    categoryColumn: '',
    topN: 5,
    bottomN: 5,
    timePeriod: 'month',
    dateColumn: '',
    analysisScope: 'all',
    showPercentages: true
  });omponent
 * Provides user interface for configuring Top N analysis parameters
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TopNAnalysisParams } from '../lib/analyzers/topNTypes';

interface TopNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (params: TopNAnalysisParams) => void;
  csvColumns: string[];
  csvData: unknown[];
}

interface ColumnSuggestion {
  columnName: string;
  confidence: number;
  type: 'numeric' | 'category' | 'date' | 'text';
  reasoning: string;
}

export default function TopNModal({
  isOpen,
  onClose,
  onAnalyze,
  csvColumns,
  csvData
}: TopNModalProps) {
  // Form state managed by TopNControls
  const [analysisParams, setAnalysisParams] = useState<TopNAnalysisParams>({
    valueColumn: '',
    categoryColumn: '',
    topN: 5,
    bottomN: 5,
    timePeriod: 'total',
    dateColumn: '',
    analysisScope: 'all',
    showPercentages: true
  });

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [columnSuggestions, setColumnSuggestions] = useState<ColumnSuggestion[]>([]);
  const [isAnalyzingColumns, setIsAnalyzingColumns] = useState(false);

  // Column analysis function
  const analyzeColumns = useCallback(async () => {
    if (csvColumns.length === 0 || csvData.length === 0) return;

    setIsAnalyzingColumns(true);
    try {
      const suggestions: ColumnSuggestion[] = [];
      
      // Sample first few rows for analysis
      const sampleData = csvData.slice(0, Math.min(100, csvData.length));
      
      for (const column of csvColumns) {
        const values = sampleData.map(row => (row as any)[column]).filter(val => val !== null && val !== undefined && val !== '');
        
        if (values.length === 0) continue;
        
        // Check if column is numeric
        const numericValues = values.filter(val => !isNaN(Number(val)));
        const numericRatio = numericValues.length / values.length;
        
        // Check if column is date-like
        const dateValues = values.filter(val => {
          const str = String(val);
          return /^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(str) || !isNaN(Date.parse(str));
        });
        const dateRatio = dateValues.length / values.length;
        
        // Check uniqueness for category detection
        const uniqueValues = new Set(values).size;
        const uniqueRatio = uniqueValues / values.length;
        
        // Determine column type and confidence
        if (numericRatio > 0.8) {
          suggestions.push({
            columnName: column,
            confidence: numericRatio,
            type: 'numeric',
            reasoning: `${Math.round(numericRatio * 100)}% numeric values - good for value analysis`
          });
        } else if (dateRatio > 0.7) {
          suggestions.push({
            columnName: column,
            confidence: dateRatio,
            type: 'date',
            reasoning: `${Math.round(dateRatio * 100)}% date values - good for time period analysis`
          });
        } else if (uniqueRatio < 0.5 && uniqueValues > 1) {
          suggestions.push({
            columnName: column,
            confidence: 1 - uniqueRatio,
            type: 'category',
            reasoning: `${uniqueValues} unique values - good for category analysis`
          });
        } else {
          suggestions.push({
            columnName: column,
            confidence: 0.3,
            type: 'text',
            reasoning: 'Text column - may be suitable for categorical analysis'
          });
        }
      }
      
      // Sort by confidence
      suggestions.sort((a, b) => b.confidence - a.confidence);
      setColumnSuggestions(suggestions);
      
    } catch (error) {
      console.error('Error analyzing columns:', error);
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

  // Handle analyze button click
  const handleAnalyze = useCallback(() => {
    if (!analysisParams.valueColumn || !analysisParams.categoryColumn) {
      return;
    }

    setIsAnalyzing(true);
    onAnalyze(analysisParams);
  }, [analysisParams, onAnalyze]);

  // Handle reset
  const handleReset = useCallback(() => {
    setAnalysisParams({
      valueColumn: '',
      categoryColumn: '',
      topN: 5,
      bottomN: 5,
      timePeriod: 'month',
      dateColumn: '',
      analysisScope: 'all',
      showPercentages: true
    });
  }, []);

  // Handle parameter changes from controls
  const handleParamsChange = useCallback((newParams: Partial<TopNAnalysisParams>) => {
    setAnalysisParams(prev => ({ ...prev, ...newParams }));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🏆</span>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Top N & Bottom N Analysis</h2>
                <p className="text-gray-600">Analyze highest and lowest performing items</p>
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-700">Analyzing columns...</span>
              </div>
            </div>
          )}

          {/* TopN Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Value Column
              </label>
              <select
                value={analysisParams.valueColumn}
                onChange={(e) => handleParamsChange({ valueColumn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isAnalyzing}
                aria-label="Select value column for analysis"
              >
                <option value="">Select value column...</option>
                {csvColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Category Column
              </label>
              <select
                value={analysisParams.categoryColumn}
                onChange={(e) => handleParamsChange({ categoryColumn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isAnalyzing}
                aria-label="Select category column for grouping"
              >
                <option value="">Select category column...</option>
                {csvColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Top N Items
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={analysisParams.topN}
                  onChange={(e) => handleParamsChange({ topN: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isAnalyzing}
                  aria-label="Number of top items to show"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Bottom N Items
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={analysisParams.bottomN}
                  onChange={(e) => handleParamsChange({ bottomN: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isAnalyzing}
                  aria-label="Number of bottom items to show"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Time Period
              </label>
              <select
                value={analysisParams.timePeriod}
                onChange={(e) => handleParamsChange({ timePeriod: e.target.value as 'total' | 'year' | 'quarter' | 'month' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isAnalyzing}
                aria-label="Time period for analysis"
              >
                <option value="total">Total (No time grouping)</option>
                <option value="year">By Year</option>
                <option value="quarter">By Quarter</option>
                <option value="month">By Month (Default)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Analysis Scope
              </label>
              <select
                value={analysisParams.analysisScope}
                onChange={(e) => handleParamsChange({ analysisScope: e.target.value as 'all' | 'positive' | 'negative' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isAnalyzing}
                aria-label="Analysis scope"
              >
                <option value="all">All Values</option>
                <option value="positive">Positive Values Only</option>
                <option value="negative">Negative Values Only</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPercentages"
                checked={analysisParams.showPercentages}
                onChange={(e) => handleParamsChange({ showPercentages: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isAnalyzing}
              />
              <label htmlFor="showPercentages" className="ml-2 block text-sm text-gray-600">
                Show percentages of total
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
                disabled={!analysisParams.valueColumn || !analysisParams.categoryColumn || isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Top N'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
