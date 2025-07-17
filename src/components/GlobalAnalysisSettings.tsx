// Global analysis settings component
// Provides centralized column mapping and time scale configuration
// All analysis cards inherit these settings for consistency

import React, { useState } from 'react';
import { getNumericFields, getDateFields, getTextFields } from '../lib/utils/csvFieldAnalyzer';
import { detectColumnsWithAI, convertToGlobalSettings, AIColumnDetectionResult } from '../lib/utils/aiColumnDetector';

export interface GlobalAnalysisSettings {
  // Core Data Columns
  primaryValueColumn: string;      // Main metric (revenue, sales, actual, etc.)
  secondaryValueColumn?: string;   // Budget, forecast, planned, etc.
  dateColumn: string;              // Date/time field
  primaryCategoryColumn: string;   // Main grouping (vector, category, region, etc.)
  secondaryCategoryColumn?: string; // Sub-grouping (subcategory, department, etc.)
  
  // Time Analysis Settings
  defaultTimeScale: 'year' | 'quarter' | 'month' | 'week';
  
  // Analysis Preferences
  defaultTopN: number;
  defaultConfidenceLevel: number; // For outlier detection
  showPercentages: boolean;
  currencyFormat: string;
}

export interface GlobalAnalysisSettingsProps {
  csvData: unknown[];
  settings: GlobalAnalysisSettings;
  onSettingsChange: (settings: GlobalAnalysisSettings) => void;
}

export const GlobalAnalysisSettings: React.FC<GlobalAnalysisSettingsProps> = ({
  csvData,
  settings,
  onSettingsChange
}) => {
  const numericFields = getNumericFields(csvData);
  const dateFields = getDateFields(csvData);
  const textFields = getTextFields(csvData);

  // State for AI detection results
  const [aiDetection, setAiDetection] = useState<AIColumnDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const updateSetting = (key: keyof GlobalAnalysisSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  // AI-driven auto-detection handler
  const handleAIDetection = async () => {
    setIsDetecting(true);
    try {
      const detection = detectColumnsWithAI(csvData);
      setAiDetection(detection);
      
      // Apply AI-detected settings
      const aiSettings = convertToGlobalSettings(detection);
      onSettingsChange(aiSettings);
      
      console.log('🤖 AI Detection Results:', detection);
    } catch (error) {
      console.error('AI detection failed:', error);
      // Fallback to simple auto-detection
      const smartDefaults: GlobalAnalysisSettings = {
        primaryValueColumn: numericFields.find(f => 
          f.toLowerCase().includes('revenue') || 
          f.toLowerCase().includes('sales') ||
          f.toLowerCase().includes('actual')
        ) || numericFields[0] || 'Value',
        secondaryValueColumn: numericFields.find(f => 
          f.toLowerCase().includes('budget') || 
          f.toLowerCase().includes('forecast') ||
          f.toLowerCase().includes('planned')
        ),
        dateColumn: dateFields[0] || 'Date',
        primaryCategoryColumn: textFields[0] || 'Category',
        secondaryCategoryColumn: textFields[1],
        defaultTimeScale: 'month',
        defaultTopN: 5,
        defaultConfidenceLevel: 95,
        showPercentages: true,
        currencyFormat: 'USD'
      };
      onSettingsChange(smartDefaults);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🌐 Global Analysis Settings</h3>
          <p className="text-sm text-gray-600">Configure columns and preferences for all analysis cards</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAIDetection}
            disabled={isDetecting}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDetecting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                🤖 AI Detecting...
              </>
            ) : (
              <>🤖 AI Auto-Detect</>
            )}
          </button>
          <button
            onClick={() => {
              // Reset to smart defaults
              const smartDefaults: GlobalAnalysisSettings = {
                primaryValueColumn: numericFields.find(f => 
                  f.toLowerCase().includes('revenue') || 
                  f.toLowerCase().includes('sales') ||
                  f.toLowerCase().includes('actual')
                ) || numericFields[0] || 'Value',
                secondaryValueColumn: numericFields.find(f => 
                  f.toLowerCase().includes('budget') || 
                  f.toLowerCase().includes('forecast') ||
                  f.toLowerCase().includes('planned')
                ),
                dateColumn: dateFields[0] || 'Date',
                primaryCategoryColumn: textFields[0] || 'Category',
                secondaryCategoryColumn: textFields[1],
                defaultTimeScale: 'month',
                defaultTopN: 5,
                defaultConfidenceLevel: 95,
                showPercentages: true,
                currencyFormat: 'USD'
              };
              onSettingsChange(smartDefaults);
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            🔄 Simple Auto-Detect
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Primary Value Column */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            💰 Primary Value Column
          </label>
          <select
            value={settings.primaryValueColumn}
            onChange={(e) => updateSetting('primaryValueColumn', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            title="Select primary value column"
          >
            {numericFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Main metric for analysis (revenue, sales, actual values, etc.)</p>
        </div>

        {/* Secondary Value Column */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📊 Secondary Value Column
          </label>
          <select
            value={settings.secondaryValueColumn || ''}
            onChange={(e) => updateSetting('secondaryValueColumn', e.target.value || undefined)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            title="Select secondary value column"
          >
            <option value="">None</option>
            {numericFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Budget, forecast, planned values, or comparison metric</p>
        </div>

        {/* Date Column */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 Date Column
          </label>
          <select
            value={settings.dateColumn}
            onChange={(e) => updateSetting('dateColumn', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            title="Select date column"
          >
            {dateFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Date/time field for temporal analysis</p>
        </div>

        {/* Primary Category Column */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🏷️ Primary Category Column
          </label>
          <select
            value={settings.primaryCategoryColumn}
            onChange={(e) => updateSetting('primaryCategoryColumn', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            title="Select primary category column"
          >
            {textFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Main grouping field (vector, category, region, product, etc.)</p>
        </div>

        {/* Time Scale */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ⏰ Default Time Scale
          </label>
          <select
            value={settings.defaultTimeScale}
            onChange={(e) => updateSetting('defaultTimeScale', e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            title="Select default time scale"
          >
            <option value="year">Year</option>
            <option value="quarter">Quarter</option>
            <option value="month">Month</option>
            <option value="week">Week</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Default time grouping for temporal analysis</p>
        </div>

        {/* Top N Default */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔝 Default Top N
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={settings.defaultTopN}
            onChange={(e) => updateSetting('defaultTopN', parseInt(e.target.value))}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            title="Default number of top items to show"
          />
          <p className="text-xs text-gray-500 mt-1">Number of top items to show</p>
        </div>

        {/* Confidence Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🎯 Confidence Level (%)
          </label>
          <select
            value={settings.defaultConfidenceLevel}
            onChange={(e) => updateSetting('defaultConfidenceLevel', parseInt(e.target.value))}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            title="Select confidence level for statistical analysis"
          >
            <option value={90}>90%</option>
            <option value={95}>95%</option>
            <option value={99}>99%</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Statistical confidence for outlier detection</p>
        </div>

        {/* Show Percentages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📊 Display Options
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showPercentages}
                onChange={(e) => updateSetting('showPercentages', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show percentages</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">Display preferences for analysis results</p>
        </div>
      </div>

      {/* Applied Settings Summary */}
      <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">📋 Current Configuration</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>💰 Primary Value: <span className="font-medium">{settings.primaryValueColumn}</span></div>
          <div>📊 Secondary Value: <span className="font-medium">{settings.secondaryValueColumn || 'None'}</span></div>
          <div>📅 Date: <span className="font-medium">{settings.dateColumn}</span></div>
          <div>🏷️ Primary Category: <span className="font-medium">{settings.primaryCategoryColumn}</span></div>
          <div>⏰ Time Scale: <span className="font-medium">{settings.defaultTimeScale}</span></div>
        </div>
      </div>

      {/* AI Detection Results */}
      {aiDetection && (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
              🤖 AI Detection Results
              <span className={`px-2 py-1 text-xs rounded-full ${
                aiDetection.confidence >= 80 ? 'bg-green-100 text-green-800' :
                aiDetection.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {aiDetection.confidence}% confidence
              </span>
            </h4>
            <button
              onClick={() => setAiDetection(null)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-2 rounded border">
              <div className="font-medium text-gray-700">💰 Primary Value</div>
              <div className="text-purple-600">{aiDetection.primaryValue.column}</div>
              <div className="text-gray-500 text-xs mt-1">
                {aiDetection.primaryValue.confidence}% - {aiDetection.primaryValue.reason}
              </div>
            </div>
            
            {aiDetection.secondaryValue && (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700">📊 Secondary Value</div>
                <div className="text-purple-600">{aiDetection.secondaryValue.column}</div>
                <div className="text-gray-500 text-xs mt-1">
                  {aiDetection.secondaryValue.confidence}% - {aiDetection.secondaryValue.reason}
                </div>
              </div>
            )}
            
            <div className="bg-white p-2 rounded border">
              <div className="font-medium text-gray-700">📅 Date</div>
              <div className="text-purple-600">{aiDetection.date.column}</div>
              <div className="text-gray-500 text-xs mt-1">
                {aiDetection.date.confidence}% - {aiDetection.date.reason}
              </div>
            </div>
            
            <div className="bg-white p-2 rounded border">
              <div className="font-medium text-gray-700">🏷️ Primary Category</div>
              <div className="text-purple-600">{aiDetection.primaryCategory.column}</div>
              <div className="text-gray-500 text-xs mt-1">
                {aiDetection.primaryCategory.confidence}% - {aiDetection.primaryCategory.reason}
              </div>
            </div>
            
            {aiDetection.secondaryCategory && (
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-700">🏷️ Secondary Category</div>
                <div className="text-purple-600">{aiDetection.secondaryCategory.column}</div>
                <div className="text-gray-500 text-xs mt-1">
                  {aiDetection.secondaryCategory.confidence}% - {aiDetection.secondaryCategory.reason}
                </div>
              </div>
            )}
          </div>
          
          {aiDetection.suggestions && aiDetection.suggestions.length > 0 && (
            <div className="mt-3 p-2 bg-amber-50 rounded border border-amber-200">
              <div className="font-medium text-amber-800 text-xs mb-1">💡 Suggestions:</div>
              <ul className="text-xs text-amber-700 space-y-1">
                {aiDetection.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
