// Interactive controls for contribution analysis
// Provides dropdowns for column mapping and analysis configuration

import React from 'react';
import { getNumericFields, getDateFields, getTextFields } from '../lib/utils/csvFieldAnalyzer';

export interface ContributionControlsProps {
  /** CSV data for field analysis */
  csvData: unknown[];
  /** Currently selected value column */
  valueColumn: string;
  /** Currently selected category column */
  categoryColumn: string;
  /** Currently selected subcategory column (optional) */
  subcategoryColumn?: string;
  /** Currently selected analysis scope */
  analysisScope: 'total' | 'average' | 'period';
  /** Whether to show others grouping */
  showOthers: boolean;
  /** Sort order */
  sortBy: 'contribution' | 'value' | 'alphabetical';
  /** Sort order direction */
  sortOrder: 'desc' | 'asc';
  /** Time period analysis settings */
  timePeriodAnalysis?: {
    enabled: boolean;
    periodType: 'quarter' | 'month' | 'all';
    dateColumn: string;
  };
  /** Callback when value column changes */
  onValueColumnChange: (column: string) => void;
  /** Callback when category column changes */
  onCategoryColumnChange: (column: string) => void;
  /** Callback when subcategory column changes */
  onSubcategoryColumnChange: (column: string) => void;
  /** Callback when analysis scope changes */
  onAnalysisScopeChange: (scope: 'total' | 'average' | 'period') => void;
  /** Callback when show others changes */
  onShowOthersChange: (show: boolean) => void;
  /** Callback when sort by changes */
  onSortByChange: (sortBy: 'contribution' | 'value' | 'alphabetical') => void;
  /** Callback when sort order changes */
  onSortOrderChange: (order: 'desc' | 'asc') => void;
  /** Callback when time period analysis changes */
  onTimePeriodAnalysisChange: (analysis: { enabled: boolean; periodType: 'quarter' | 'month' | 'all'; dateColumn: string }) => void;
}

/**
 * Contribution analysis controls component
 * Provides independent controls for each contribution analysis card
 * Uses high-contrast colors for optimal readability
 */
export const ContributionControls: React.FC<ContributionControlsProps> = ({
  csvData,
  valueColumn,
  categoryColumn,
  subcategoryColumn,
  analysisScope,
  showOthers,
  sortBy,
  sortOrder,
  timePeriodAnalysis,
  onValueColumnChange,
  onCategoryColumnChange,
  onSubcategoryColumnChange,
  onAnalysisScopeChange,
  onShowOthersChange,
  onSortByChange,
  onSortOrderChange,
  onTimePeriodAnalysisChange
}) => {
  // Get available fields from CSV data
  const numericFields = getNumericFields(csvData);
  const textFields = getTextFields(csvData);
  const dateFields = getDateFields(csvData);

  return (
    <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900">Contribution Analysis Controls</div>
        <div className="text-xs text-gray-700">
          Configure how to calculate percentage contributions
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-3">
        {/* Value Column Selector */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Value Column
          </label>
          <select
            value={valueColumn}
            onChange={(e) => onValueColumnChange(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
            title="Select the column containing values to analyze"
          >
            {numericFields.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        {/* Category Column Selector */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Category Column
          </label>
          <select
            value={categoryColumn}
            onChange={(e) => onCategoryColumnChange(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
            title="Select the column containing categories to group by"
          >
            {textFields.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Column Selector */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Subcategory (Optional)
          </label>
          <select
            value={subcategoryColumn || ''}
            onChange={(e) => onSubcategoryColumnChange(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
            title="Select a column for hierarchical breakdown"
          >
            <option value="">No subcategory</option>
            {textFields.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Analysis Scope */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Analysis Scope
          </label>
          <select
            value={analysisScope}
            onChange={(e) => onAnalysisScopeChange(e.target.value as 'total' | 'average' | 'period')}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
            title="Choose how to calculate contributions"
          >
            <option value="total">Total Values</option>
            <option value="average">Average Values</option>
            <option value="period">Period Analysis</option>
          </select>
        </div>

        {/* Time Period Analysis */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Time Analysis
          </label>
          <select
            value={timePeriodAnalysis?.enabled ? timePeriodAnalysis.periodType : 'all'}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'all') {
                onTimePeriodAnalysisChange({ enabled: false, periodType: 'all', dateColumn: '' });
              } else {
                onTimePeriodAnalysisChange({ 
                  enabled: true, 
                  periodType: value as 'quarter' | 'month', 
                  dateColumn: timePeriodAnalysis?.dateColumn || dateFields[0] || ''
                });
              }
            }}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
            title="Choose time analysis type"
          >
            <option value="all">All Time</option>
            <option value="quarter">Quarterly</option>
            <option value="month">Monthly</option>
          </select>
        </div>

        {/* Date Column (for time analysis) */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Date Column
          </label>
          <select
            value={timePeriodAnalysis?.dateColumn || ''}
            onChange={(e) => {
              if (timePeriodAnalysis?.enabled) {
                onTimePeriodAnalysisChange({
                  ...timePeriodAnalysis,
                  dateColumn: e.target.value
                });
              }
            }}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
            title="Select date column for time-based analysis"
            disabled={!timePeriodAnalysis?.enabled}
          >
            <option value="">No date column</option>
            {dateFields.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as 'contribution' | 'value' | 'alphabetical')}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
            title="Choose how to sort results"
          >
            <option value="contribution">By Contribution %</option>
            <option value="value">By Value</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Sort Order
          </label>
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'desc' | 'asc')}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none"
            title="Choose sort direction"
          >
            <option value="desc">Descending (High to Low)</option>
            <option value="asc">Ascending (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Show Others Toggle */}
      <div className="flex items-center mt-3 pt-3 border-t border-red-200">
        <label className="flex items-center text-xs font-medium text-gray-900 cursor-pointer">
          <input
            type="checkbox"
            checked={showOthers}
            onChange={(e) => onShowOthersChange(e.target.checked)}
            className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          Group small contributions as &quot;Others&quot;
        </label>
        <span className="ml-2 text-xs text-gray-600">
          (Groups contributions &lt; 2% into a single &quot;Others&quot; category)
        </span>
      </div>
    </div>
  );
};
