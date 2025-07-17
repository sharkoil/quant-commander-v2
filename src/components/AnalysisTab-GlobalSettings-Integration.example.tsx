// Example of how to integrate GlobalAnalysisSettings into AnalysisTab.tsx
// This shows the key changes needed for implementation

import React, { useState, useEffect } from 'react';
import { GlobalAnalysisSettings, GlobalAnalysisSettingsProps } from './GlobalAnalysisSettings';

// Add global settings state to AnalysisTab
const [globalSettings, setGlobalSettings] = useState<GlobalAnalysisSettings>({
  primaryValueColumn: 'Revenue',
  secondaryValueColumn: 'Budget', 
  dateColumn: 'Date',
  primaryCategoryColumn: 'Vector',
  secondaryCategoryColumn: 'Category',
  defaultTimeScale: 'month',
  defaultTopN: 5,
  defaultConfidenceLevel: 95,
  showPercentages: true,
  currencyFormat: 'USD'
});

// Auto-initialize settings when CSV data changes
useEffect(() => {
  if (csvData.length > 0) {
    const csvDataForAnalysis = csvData.slice(1).map(row => 
      Object.fromEntries(
        csvColumns.map((col, index) => [col, row[index]])
      )
    );

    const numericFields = getNumericFields(csvDataForAnalysis);
    const dateFields = getDateFields(csvDataForAnalysis);
    const textFields = getTextFields(csvDataForAnalysis);

    // Smart defaults based on detected columns
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
      primaryCategoryColumn: textFields[0] || 'Vector',
      secondaryCategoryColumn: textFields[1],
      defaultTimeScale: 'month',
      defaultTopN: 5,
      defaultConfidenceLevel: 95,
      showPercentages: true,
      currencyFormat: 'USD'
    };

    setGlobalSettings(smartDefaults);
  }
}, [csvData, csvColumns]);

// Individual analysis card initialization becomes much simpler
items.forEach(item => {
  if (item.result.type === 'budget-variance') {
    initialBudgetControls[item.id] = {
      budgetColumn: globalSettings.secondaryValueColumn || globalSettings.primaryValueColumn,
      actualColumn: globalSettings.primaryValueColumn,
      dateColumn: globalSettings.dateColumn,
      periodType: globalSettings.defaultTimeScale === 'week' ? 'weekly' : 
                  globalSettings.defaultTimeScale === 'month' ? 'monthly' :
                  globalSettings.defaultTimeScale === 'quarter' ? 'quarterly' : 'yearly'
    };
  }
  
  if (item.result.type === 'top-n') {
    initialTopNControls[item.id] = {
      valueColumn: globalSettings.primaryValueColumn,
      categoryColumn: globalSettings.primaryCategoryColumn,
      timePeriod: globalSettings.defaultTimeScale,
      dateColumn: globalSettings.dateColumn,
      topN: globalSettings.defaultTopN,
      bottomN: globalSettings.defaultTopN
    };
  }
  
  if (item.result.type === 'contribution') {
    initialContributionControls[item.id] = {
      valueColumn: globalSettings.primaryValueColumn,
      categoryColumn: globalSettings.primaryCategoryColumn,
      subcategoryColumn: globalSettings.secondaryCategoryColumn,
      analysisScope: 'total',
      showOthers: true,
      sortBy: 'contribution',
      sortOrder: 'desc',
      timePeriodAnalysis: {
        enabled: true,
        periodType: globalSettings.defaultTimeScale === 'quarter' ? 'quarter' : 'month',
        dateColumn: globalSettings.dateColumn
      }
    };
  }
});

// Add global settings component to render
return (
  <div className="w-full space-y-6">
    {/* Global Settings Panel */}
    <GlobalAnalysisSettings
      csvData={csvData.length > 0 ? csvData.slice(1).map(row => 
        Object.fromEntries(
          csvColumns.map((col, index) => [col, row[index]])
        )
      ) : []}
      settings={globalSettings}
      onSettingsChange={setGlobalSettings}
    />
    
    {/* Existing header and filters remain the same */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📊 Analysis Results</h1>
        <p className="text-gray-700 mt-1">
          Unified analysis with consistent column mapping across all cards
        </p>
      </div>
    </div>
    
    {/* Rest of existing component... */}
  </div>
);
