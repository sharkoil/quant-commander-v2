// Interactive controls for period variance analysis
// Provides dropdowns for column mapping and period selection

import React from 'react';
import { getNumericFields, getDateFields } from '../lib/utils/csvFieldAnalyzer';

export interface PeriodVarianceControlsProps {
  /** CSV data for field analysis */
  csvData: unknown[];
  /** Currently selected value column */
  valueColumn: string;
  /** Currently selected date column */
  dateColumn: string;
  /** Currently selected period type */
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  /** Callback when value column changes */
  onValueColumnChange: (column: string) => void;
  /** Callback when date column changes */
  onDateColumnChange: (column: string) => void;
  /** Callback when period type changes */
  onPeriodTypeChange: (type: 'weekly' | 'monthly' | 'quarterly' | 'yearly') => void;
}

/**
 * Period variance analysis controls component
 * Provides independent controls for each analysis card
 * Uses high-contrast colors for optimal readability
 */
export const PeriodVarianceControls: React.FC<PeriodVarianceControlsProps> = ({
  csvData,
  valueColumn,
  dateColumn,
  periodType,
  onValueColumnChange,
  onDateColumnChange,
  onPeriodTypeChange
}) => {
  // Get available fields from CSV data
  const numericFields = getNumericFields(csvData);
  const dateFields = getDateFields(csvData);

  return (
    <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900">Period Variance Controls</div>
        <div className="text-xs text-gray-700">
          Configure period-over-period variance analysis
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Value Column Selector */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Value Column
          </label>
          <select
            value={valueColumn}
            onChange={(e) => onValueColumnChange(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
            title="Select the column containing numeric values to analyze"
          >
            {numericFields.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        {/* Date Column Selector */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Date Column
          </label>
          <select
            value={dateColumn}
            onChange={(e) => onDateColumnChange(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
            title="Select the column containing dates for period grouping"
          >
            {dateFields.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        {/* Period Type Selector */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Time Scale
          </label>
          <select
            value={periodType}
            onChange={(e) => onPeriodTypeChange(e.target.value as 'weekly' | 'monthly' | 'quarterly' | 'yearly')}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
            title="Select the time period for variance comparison"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Analysis Info Panel */}
      <div className="mt-3 pt-3 border-t border-purple-200">
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-600">
            <span className="font-medium">Analysis:</span> Compare {periodType} values period-over-period
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Metrics:</span> Variance amount & percentage change
          </div>
        </div>
      </div>
    </div>
  );
};