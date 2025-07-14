// Interactive controls for budget variance analysis
// Provides dropdowns for column mapping and period selection

import React from 'react';
import { getNumericFields, getDateFields } from '../lib/utils/csvFieldAnalyzer';

export interface BudgetVarianceControlsProps {
  /** CSV data for field analysis */
  csvData: unknown[];
  /** Currently selected budget column */
  budgetColumn: string;
  /** Currently selected actual column */
  actualColumn: string;
  /** Currently selected date column (optional) */
  dateColumn?: string;
  /** Currently selected period type */
  periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  /** Callback when budget column changes */
  onBudgetColumnChange: (column: string) => void;
  /** Callback when actual column changes */
  onActualColumnChange: (column: string) => void;
  /** Callback when date column changes */
  onDateColumnChange: (column: string) => void;
  /** Callback when period type changes */
  onPeriodTypeChange: (type: 'weekly' | 'monthly' | 'quarterly' | 'yearly') => void;
}

/**
 * Budget variance analysis controls component
 * Provides independent controls for each analysis card
 */
export const BudgetVarianceControls: React.FC<BudgetVarianceControlsProps> = ({
  csvData,
  budgetColumn,
  actualColumn,
  dateColumn,
  periodType,
  onBudgetColumnChange,
  onActualColumnChange,
  onDateColumnChange,
  onPeriodTypeChange
}) => {
  // Get available fields from CSV data
  const numericFields = getNumericFields(csvData);
  const dateFields = getDateFields(csvData);

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">Budget Variance Controls</div>
        <div className="text-xs text-gray-500">
          Map your CSV columns to analysis parameters
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Budget Column Selector */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Budget Column
          </label>
          <select
            value={budgetColumn}
            onChange={(e) => onBudgetColumnChange(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 focus:border-blue-500 focus:outline-none"
            title="Select the column containing budget values"
          >
            {numericFields.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        {/* Actual Column Selector */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Actual Column
          </label>
          <select
            value={actualColumn}
            onChange={(e) => onActualColumnChange(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 focus:border-blue-500 focus:outline-none"
            title="Select the column containing actual values"
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
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Date Column (Optional)
          </label>
          <select
            value={dateColumn || ''}
            onChange={(e) => onDateColumnChange(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 focus:border-blue-500 focus:outline-none"
            title="Select the column containing dates for period analysis"
          >
            <option value="">No date grouping</option>
            {dateFields.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        {/* Period Type Selector */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">
            Period Type
          </label>
          <select
            value={periodType}
            onChange={(e) => onPeriodTypeChange(e.target.value as 'weekly' | 'monthly' | 'quarterly' | 'yearly')}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 focus:border-blue-500 focus:outline-none"
            title="Select how to group data by time periods"
            disabled={!dateColumn}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>
    </div>
  );
};
