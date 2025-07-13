// Outlier Detection Modal Component
// Provides user interface for configuring outlier detection analysis

import React, { useState, useEffect } from 'react';
import { 
  calculateOutlierDetection, 
  OutlierDetectionParams, 
  FlexibleOutlierData,
  OutlierDetectionAnalysis,
  generateDefaultOutlierSuggestions 
} from '../lib/analyzers/outlierDetection';
import ScatterPlot from './ScatterPlot';

interface OutlierModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvData: unknown[];
  csvColumns: string[];
  onAnalysisComplete: (analysis: OutlierDetectionAnalysis) => void;
}

interface ColumnSuggestion {
  columnName: string;
  confidence: number;
  type: 'date' | 'actual' | 'budget' | 'forecast';
  reasoning: string;
}

export const OutlierModal: React.FC<OutlierModalProps> = ({
  isOpen,
  onClose,
  csvData,
  csvColumns,
  onAnalysisComplete
}) => {
  // Form state
  const [method, setMethod] = useState<'iqr' | 'zscore' | 'both'>('both');
  const [analysisTarget, setAnalysisTarget] = useState<'actual' | 'variance' | 'budget'>('actual');
  const [threshold, setThreshold] = useState<number>(2);
  const [iqrMultiplier, setIqrMultiplier] = useState<number>(1.5);
  
  // Column mapping state
  const [dateColumn, setDateColumn] = useState<string>('');
  const [actualColumn, setActualColumn] = useState<string>('');
  const [budgetColumn, setBudgetColumn] = useState<string>('');
  
  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingColumns, setIsAnalyzingColumns] = useState(false);
  const [columnSuggestions, setColumnSuggestions] = useState<ColumnSuggestion[]>([]);
  const [analysisResult, setAnalysisResult] = useState<OutlierDetectionAnalysis | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);

  // Auto-analyze columns when modal opens
  useEffect(() => {
    if (isOpen && csvColumns.length > 0) {
      analyzeColumns();
    }
  }, [isOpen, csvColumns]);

  /**
   * Analyze CSV columns to suggest appropriate mappings
   */
  const analyzeColumns = async () => {
    setIsAnalyzingColumns(true);
    
    try {
      const suggestions: ColumnSuggestion[] = [];
      
      // Analyze each column
      csvColumns.forEach(columnName => {
        const suggestion = analyzeColumnForOutlier(columnName, csvData as FlexibleOutlierData[]);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      });
      
      setColumnSuggestions(suggestions);
      
      // Auto-select best suggestions
      const bestDate = suggestions.find(s => s.type === 'date' && s.confidence > 70);
      const bestActual = suggestions.find(s => s.type === 'actual' && s.confidence > 70);
      const bestBudget = suggestions.find(s => s.type === 'budget' && s.confidence > 60);
      
      if (bestDate) setDateColumn(bestDate.columnName);
      if (bestActual) setActualColumn(bestActual.columnName);
      if (bestBudget) setBudgetColumn(bestBudget.columnName);
      
      // Set appropriate analysis target based on available columns
      if (bestActual && bestBudget) {
        setAnalysisTarget('variance'); // Default to variance if both available
      } else if (bestActual) {
        setAnalysisTarget('actual');
      } else if (bestBudget) {
        setAnalysisTarget('budget');
      }
      
    } catch (error) {
      console.error('Column analysis failed:', error);
    } finally {
      setIsAnalyzingColumns(false);
    }
  };

  /**
   * Analyze individual column for outlier detection suitability
   */
  const analyzeColumnForOutlier = (columnName: string, data: FlexibleOutlierData[]): ColumnSuggestion | null => {
    if (data.length === 0) return null;

    const lowerName = columnName.toLowerCase();
    let confidence = 0;
    let type: ColumnSuggestion['type'] = 'actual';
    let reasoning = '';

    // Check for date columns
    if (lowerName.includes('date') || lowerName.includes('time') || lowerName.includes('period')) {
      // Validate that values look like dates
      const sampleValues = data.slice(0, 5).map(row => String(row[columnName]));
      const validDates = sampleValues.filter(val => !isNaN(new Date(val).getTime())).length;
      
      if (validDates >= 3) {
        confidence = 85 + (validDates / sampleValues.length) * 15;
        type = 'date';
        reasoning = `Column contains date-like values (${validDates}/${sampleValues.length} valid dates)`;
      }
    }
    // Check for budget columns
    else if (lowerName.includes('budget') || lowerName.includes('planned') || lowerName.includes('target') || lowerName.includes('forecast')) {
      // Validate numeric values
      const sampleValues = data.slice(0, 10).map(row => row[columnName]);
      const numericValues = sampleValues.filter(val => !isNaN(Number(val)) && val !== null && val !== '').length;
      
      if (numericValues >= 7) {
        confidence = 80 + (numericValues / sampleValues.length) * 20;
        type = lowerName.includes('forecast') ? 'forecast' : 'budget';
        reasoning = `Column appears to contain ${type} values (${numericValues}/${sampleValues.length} numeric)`;
      }
    }
    // Check for actual value columns
    else if (lowerName.includes('actual') || lowerName.includes('real') || lowerName.includes('result') || 
             lowerName.includes('sales') || lowerName.includes('revenue') || lowerName.includes('amount')) {
      // Validate numeric values
      const sampleValues = data.slice(0, 10).map(row => row[columnName]);
      const numericValues = sampleValues.filter(val => !isNaN(Number(val)) && val !== null && val !== '').length;
      
      if (numericValues >= 7) {
        confidence = 75 + (numericValues / sampleValues.length) * 25;
        type = 'actual';
        reasoning = `Column appears to contain actual values (${numericValues}/${sampleValues.length} numeric)`;
      }
    }
    // Generic numeric columns
    else {
      const sampleValues = data.slice(0, 10).map(row => row[columnName]);
      const numericValues = sampleValues.filter(val => !isNaN(Number(val)) && val !== null && val !== '').length;
      
      if (numericValues >= 8) {
        confidence = 60;
        type = 'actual';
        reasoning = `Numeric column suitable for analysis (${numericValues}/${sampleValues.length} numeric)`;
      }
    }

    return confidence > 50 ? { columnName, confidence, type, reasoning } : null;
  };

  /**
   * Run outlier detection analysis
   */
  const runAnalysis = async () => {
    if (!dateColumn || !actualColumn) {
      alert('Please select date and actual value columns');
      return;
    }

    if (analysisTarget === 'variance' && !budgetColumn) {
      alert('Budget column is required for variance analysis');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Convert CSV data to outlier detection format
      const outlierData = csvData.map(row => {
        const rowData = row as Record<string, unknown>;
        return {
          date: String(rowData[dateColumn]),
          actual: Number(rowData[actualColumn]) || 0,
          budget: budgetColumn ? Number(rowData[budgetColumn]) || undefined : undefined,
          label: String(rowData[Object.keys(rowData)[0]] || '')
        };
      });

      const params: OutlierDetectionParams = {
        data: outlierData,
        method,
        analysisTarget,
        threshold,
        iqrMultiplier,
        columnMapping: {
          dateColumn,
          actualColumn,
          budgetColumn: budgetColumn || undefined
        }
      };

      const result = calculateOutlierDetection(params);
      setAnalysisResult(result);
      onAnalysisComplete(result);
      
    } catch (error) {
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Get column suggestions by type
   */
  const getColumnsByType = (type: ColumnSuggestion['type']) => {
    return columnSuggestions
      .filter(s => s.type === type)
      .sort((a, b) => b.confidence - a.confidence);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🔍 Outlier Detection Analysis</h2>
            <p className="text-gray-600 mt-1">Identify statistical anomalies in your financial data</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          
          {/* Column Mapping Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Column Mapping</h3>
            
            {isAnalyzingColumns ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Analyzing columns...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Date Column */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Date Column <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={dateColumn}
                    onChange={(e) => setDateColumn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Select date column"
                  >
                    <option value="">Select date column...</option>
                    {getColumnsByType('date').map(suggestion => (
                      <option key={suggestion.columnName} value={suggestion.columnName}>
                        {suggestion.columnName} ({suggestion.confidence.toFixed(0)}% confidence)
                      </option>
                    ))}
                    {csvColumns.filter(col => !getColumnsByType('date').find(s => s.columnName === col)).map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                {/* Actual Column */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 Actual Values Column <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={actualColumn}
                    onChange={(e) => setActualColumn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Select actual values column"
                  >
                    <option value="">Select actual values column...</option>
                    {getColumnsByType('actual').map(suggestion => (
                      <option key={suggestion.columnName} value={suggestion.columnName}>
                        {suggestion.columnName} ({suggestion.confidence.toFixed(0)}% confidence)
                      </option>
                    ))}
                    {csvColumns.filter(col => !getColumnsByType('actual').find(s => s.columnName === col)).map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                {/* Budget Column */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📋 Budget Column {analysisTarget === 'variance' && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={budgetColumn}
                    onChange={(e) => setBudgetColumn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Select budget column"
                  >
                    <option value="">Select budget column...</option>
                    {getColumnsByType('budget').concat(getColumnsByType('forecast')).map(suggestion => (
                      <option key={suggestion.columnName} value={suggestion.columnName}>
                        {suggestion.columnName} ({suggestion.confidence.toFixed(0)}% confidence)
                      </option>
                    ))}
                    {csvColumns.filter(col => 
                      !getColumnsByType('budget').find(s => s.columnName === col) &&
                      !getColumnsByType('forecast').find(s => s.columnName === col)
                    ).map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

              </div>
            )}
          </div>

          {/* Analysis Configuration */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Analysis Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Analysis Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Target</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="analysisTarget"
                      value="actual"
                      checked={analysisTarget === 'actual'}
                      onChange={(e) => setAnalysisTarget(e.target.value as 'actual')}
                      className="mr-2"
                    />
                    <span>Actual Values - Find outliers in raw actual data</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="analysisTarget"
                      value="variance"
                      checked={analysisTarget === 'variance'}
                      onChange={(e) => setAnalysisTarget(e.target.value as 'variance')}
                      className="mr-2"
                      disabled={!budgetColumn}
                    />
                    <span>Variance Analysis - Find outliers in actual vs budget variance</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="analysisTarget"
                      value="budget"
                      checked={analysisTarget === 'budget'}
                      onChange={(e) => setAnalysisTarget(e.target.value as 'budget')}
                      className="mr-2"
                      disabled={!budgetColumn}
                    />
                    <span>Budget Values - Find outliers in budget data</span>
                  </label>
                </div>
              </div>

              {/* Detection Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Detection Method</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="method"
                      value="both"
                      checked={method === 'both'}
                      onChange={(e) => setMethod(e.target.value as 'both')}
                      className="mr-2"
                    />
                    <span>Both IQR & Z-Score (Recommended)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="method"
                      value="iqr"
                      checked={method === 'iqr'}
                      onChange={(e) => setMethod(e.target.value as 'iqr')}
                      className="mr-2"
                    />
                    <span>IQR Method (Quartile-based)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="method"
                      value="zscore"
                      checked={method === 'zscore'}
                      onChange={(e) => setMethod(e.target.value as 'zscore')}
                      className="mr-2"
                    />
                    <span>Z-Score Method (Standard deviation)</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Advanced Parameters */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Z-Score Threshold (default: 2.0)
                </label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  step="0.1"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Z-Score threshold value"
                />
                <p className="text-xs text-gray-500 mt-1">Higher values = fewer outliers detected</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IQR Multiplier (default: 1.5)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={iqrMultiplier}
                  onChange={(e) => setIqrMultiplier(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="IQR multiplier value"
                />
                <p className="text-xs text-gray-500 mt-1">Higher values = fewer outliers detected</p>
              </div>

            </div>
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">📈 Analysis Results</h3>
                <button
                  onClick={() => setShowVisualization(!showVisualization)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {showVisualization ? 'Hide' : 'Show'} Visualization
                </button>
              </div>
              
              {showVisualization && (
                <div className="mb-6">
                  <ScatterPlot 
                    data={analysisResult.scatterPlotData}
                    title="Outlier Detection Scatter Plot"
                    width={800}
                    height={400}
                    analysisTarget={analysisTarget}
                  />
                </div>
              )}
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{analysisResult.totalDataPoints}</div>
                    <div className="text-sm text-gray-600">Total Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{analysisResult.outlierCount}</div>
                    <div className="text-sm text-gray-600">Outliers Found</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{analysisResult.summary.extremeOutliers}</div>
                    <div className="text-sm text-gray-600">Extreme Outliers</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      analysisResult.summary.riskLevel === 'low' ? 'text-green-600' :
                      analysisResult.summary.riskLevel === 'medium' ? 'text-yellow-600' :
                      analysisResult.summary.riskLevel === 'high' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {analysisResult.summary.riskLevel.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">Risk Level</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing || !dateColumn || !actualColumn}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </span>
              ) : (
                'Run Outlier Analysis'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OutlierModal;
