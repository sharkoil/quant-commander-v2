// Interactive controls for trend analysis
// Provides dropdowns for column mapping and trend analysis parameters

import React from 'react';
import { getNumericFields, getDateFields } from '../lib/utils/csvFieldAnalyzer';

export interface TrendAnalysisControlsProps {
  /** CSV data for field analysis */
  csvData: unknown[];
  /** Currently selected value column */
  valueColumn: string;
  /** Currently selected date column */
  dateColumn: string;
  /** Currently selected window size */
  windowSize: number;
  /** Currently selected trend type */
  trendType: 'simple' | 'exponential';
  /** Callback when value column changes */
  onValueColumnChange: (column: string) => void;
  /** Callback when date column changes */
  onDateColumnChange: (column: string) => void;
  /** Callback when window size changes */
  onWindowSizeChange: (size: number) => void;
  /** Callback when trend type changes */
  onTrendTypeChange: (type: 'simple' | 'exponential') => void;
}

/**
 * Trend analysis controls component
 * Provides independent controls for each analysis card
 * Uses high-contrast colors for optimal readability
 */
export const TrendAnalysisControls: React.FC<TrendAnalysisControlsProps> = ({
  csvData,
  valueColumn,
  dateColumn,
  windowSize,
  trendType,
  onValueColumnChange,
  onDateColumnChange,
  onWindowSizeChange,
  onTrendTypeChange
}) => {
  // Get available fields from CSV data
  const numericFields = getNumericFields(csvData);
  const dateFields = getDateFields(csvData);

  // Generate window size options (2-10 periods)
  const windowSizeOptions = Array.from({ length: 9 }, (_, i) => i + 2);

  return (
    <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900">Trend Analysis Controls</div>
        <div className="text-xs text-gray-700">
          Configure moving average trend detection
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Value Column Selector */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Value Column
          </label>
          <select
            value={valueColumn}
            onChange={(e) => onValueColumnChange(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
            title="Select the column containing numeric values to analyze for trends"
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
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
            title="Select the column containing dates for time series analysis"
          >
            {dateFields.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>

        {/* Window Size Selector */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Window Size
          </label>
          <select
            value={windowSize}
            onChange={(e) => onWindowSizeChange(Number(e.target.value))}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
            title="Select the number of periods for moving average calculation"
          >
            {windowSizeOptions.map(size => (
              <option key={size} value={size}>
                {size} periods
              </option>
            ))}
          </select>
        </div>

        {/* Trend Type Selector */}
        <div>
          <label className="text-xs font-medium text-gray-900 mb-2 block">
            Trend Type
          </label>
          <select
            value={trendType}
            onChange={(e) => onTrendTypeChange(e.target.value as 'simple' | 'exponential')}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
            title="Select the type of moving average for trend calculation"
          >
            <option value="simple">Simple MA</option>
            <option value="exponential">Exponential MA</option>
          </select>
        </div>
      </div>

      {/* Analysis Info Panel */}
      <div className="mt-3 pt-3 border-t border-orange-200">
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-600">
            <span className="font-medium">Analysis:</span> {windowSize}-period {trendType} moving average
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Detection:</span> Trend direction & strength analysis
          </div>
        </div>
      </div>
    </div>
  );
};
