/**
 * Analysis Tab Component
 * Provides draggable lists for managing analysis results
 * Uses real CSV data and removes demo data references
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  DraggableAnalysisItem, 
  AnalysisFilters, 
  AnalysisType
} from '../types/analysis';
import { 
  getAnalysisTypes,
  getAnalysisTypeConfig,
  registerAnalysisUpdateCallback,
  getCurrentAnalysisResults
} from '../lib/analysisService';
import { BudgetVarianceControls } from './BudgetVarianceControls';
import { 
  processBudgetVarianceData, 
  BudgetVarianceParams 
} from '../lib/analyzers/budgetVarianceProcessor';
import { generateBudgetVarianceVisualization } from '../lib/visualizations/budgetVarianceVisualizer';
import { 
  getDefaultBudgetColumn, 
  getDefaultActualColumn,
  getDateFields
} from '../lib/utils/csvFieldAnalyzer';

interface AnalysisTabProps {
  csvData: (string | number | Date | boolean)[][];
  csvColumns: string[];
}

export default function AnalysisTab({ csvData, csvColumns }: AnalysisTabProps) {
  // State management for analysis results and UI
  const [analysisItems, setAnalysisItems] = useState<DraggableAnalysisItem[]>([]);
  const [filters, setFilters] = useState<AnalysisFilters>({});
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');
  const [isLoading, setIsLoading] = useState(true);
  
  // State for budget variance analysis controls
  const [budgetVarianceControls, setBudgetVarianceControls] = useState<{
    [analysisId: string]: {
      budgetColumn: string;
      actualColumn: string;
      dateColumn?: string;
      periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    }
  }>({});
  
  // Force re-render trigger for budget variance
  const [budgetRenderTrigger, setBudgetRenderTrigger] = useState(0);

  // Refs for draggable containers
  const pinnedContainerRef = useRef<HTMLDivElement>(null);
  const unpinnedContainerRef = useRef<HTMLDivElement>(null);

  // Initialize analysis items on component mount
  useEffect(() => {
    const initializeItems = () => {
      try {
        const items = getCurrentAnalysisResults();
        setAnalysisItems(items);
        
        // Initialize control states for budget variance analysis
        const initialBudgetControls: typeof budgetVarianceControls = {};
        
        // Convert CSV data to format expected by field analyzer
        const csvDataForAnalysis = csvData.length > 0 ? csvData.slice(1).map(row => 
          Object.fromEntries(
            csvColumns.map((col, index) => [col, row[index]])
          )
        ) : [];
        
        items.forEach(item => {
          if (item.result.type === 'budget-variance') {
            // Use real CSV data for smart column detection
            const budgetCol = getDefaultBudgetColumn(csvDataForAnalysis);
            const actualCol = getDefaultActualColumn(csvDataForAnalysis);
            const dateFields = getDateFields(csvDataForAnalysis);
            
            initialBudgetControls[item.id] = {
              budgetColumn: budgetCol,
              actualColumn: actualCol,
              dateColumn: dateFields.length > 0 ? dateFields[0] : undefined,
              periodType: 'monthly'
            };
            
            console.log(`🎯 Auto-detected columns for ${item.id}:`, {
              budget: budgetCol,
              actual: actualCol,
              date: dateFields[0],
              availableColumns: csvColumns
            });
          }
        });
        
        setBudgetVarianceControls(initialBudgetControls);
      } catch (error) {
        console.error('Error initializing analysis items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeItems();

    // Register callback for analysis updates
    const unregister = registerAnalysisUpdateCallback((newItems) => {
      setAnalysisItems(newItems);
    });

    return unregister;
  }, [csvData, csvColumns]); // Re-initialize when CSV data changes

  // Auto-generate visualizations when controls change
  useEffect(() => {
    Object.keys(budgetVarianceControls).forEach(analysisId => {
      const controls = budgetVarianceControls[analysisId];
      if (controls && controls.budgetColumn && controls.actualColumn) {
        // Trigger visualization update
        console.log(`🔄 Auto-refreshing visualization for ${analysisId}`, controls);
      }
    });
  }, [budgetVarianceControls, csvData]);

  // Update budget variance controls handler
  const updateBudgetVarianceControls = (
    analysisId: string, 
    updates: Partial<BudgetVarianceParams>
  ) => {
    setBudgetVarianceControls(prev => {
      const updated = {
        ...prev,
        [analysisId]: {
          ...prev[analysisId],
          ...updates
        }
      };
      
      // Trigger re-render when controls change
      setBudgetRenderTrigger(prev => prev + 1);
      
      return updated;
    });
  };

  // Generate budget variance visualization
  const generateBudgetVarianceHTML = (analysisId: string): string => {
    try {
      const item = analysisItems.find(item => item.id === analysisId);
      if (!item || item.result.type !== 'budget-variance') {
        return '<div>No budget variance data available</div>';
      }

      const controls = budgetVarianceControls[analysisId];
      if (!controls) {
        return '<div>Loading budget variance controls...</div>';
      }

      // Use real CSV data instead of mock data
      const realData = csvData.length > 0 ? csvData.slice(1).map(row => 
        Object.fromEntries(
          csvColumns.map((col, index) => [col, row[index]])
        )
      ) : [];

      if (realData.length === 0) {
        return '<div class="text-yellow-600">No data available for budget variance analysis</div>';
      }

      const processedResult = processBudgetVarianceData(
        realData,
        {
          budgetColumn: controls.budgetColumn,
          actualColumn: controls.actualColumn,
          dateColumn: controls.dateColumn,
          periodType: controls.periodType
        }
      );

      return generateBudgetVarianceVisualization(
        processedResult,
        controls.budgetColumn,
        controls.actualColumn
      );
    } catch (error) {
      console.error('Error generating budget variance visualization:', error);
      return '<div class="text-red-600">Error generating budget variance analysis</div>';
    }
  };

  // Filter and sort items
  const filteredItems = analysisItems.filter(item => {
    if (filters.type && item.result.type !== filters.type) return false;
    if (filters.searchQuery && !item.result.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.result.title.localeCompare(b.result.title);
      case 'type':
        return a.result.type.localeCompare(b.result.type);
      case 'date':
      default:
        return new Date(b.result.createdAt).getTime() - new Date(a.result.createdAt).getTime();
    }
  });

  const pinnedItems = sortedItems.filter(item => item.isPinned);
  const unpinnedItems = sortedItems.filter(item => !item.isPinned);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analysis results...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Analysis Results</h1>
          <p className="text-gray-600 mt-1">
            Manage and explore your data analysis results with real-time CSV data processing
          </p>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search analyses..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              title="Search analyses"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.type || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as AnalysisType || undefined }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            title="Filter by analysis type"
          >
            <option value="">All Types</option>
            {getAnalysisTypes().map(config => (
              <option key={config.type} value={config.type}>{config.name}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'type')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            title="Sort order"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {sortedItems.length > 0 ? (
        <div className="space-y-6">
          {/* Pinned Items */}
          {pinnedItems.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  📌 Pinned Analyses
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({pinnedItems.length} pinned)
                  </span>
                </h2>
              </div>
              
              <div 
                ref={pinnedContainerRef}
                className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
              >
                {pinnedItems.map(item => (
                  <AnalysisCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
          
          {/* Unpinned Items */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📈 All Analyses
            </h2>
            
            <div 
              ref={unpinnedContainerRef}
              className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            >
              {unpinnedItems.map(item => (
                <AnalysisCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No results match your filters</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search or filter criteria to see more results.
          </p>
          <button
            onClick={() => setFilters({})}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Analysis Results</h3>
          <p className="text-gray-600">
            Upload data and run analyses to see results here.
          </p>
        </div>
      )}
    </div>
  );

  // Analysis Card Component
  function AnalysisCard({ item }: { item: DraggableAnalysisItem }) {
    const typeConfig = getAnalysisTypeConfig(item.result.type);
    
    if (!typeConfig) {
      return null; // Skip rendering if config is not found
    }
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">{typeConfig.icon}</span>
                <h3 className="font-semibold text-gray-900 truncate">{item.result.title}</h3>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                {typeConfig.name}
              </span>
            </div>
          </div>

          {/* Budget Variance Controls */}
          {item.result.type === 'budget-variance' && (
            <div className="mb-4">
              <BudgetVarianceControls
                csvData={csvData.length > 0 ? csvData.slice(1).map(row => 
                  Object.fromEntries(
                    csvColumns.map((col, index) => [col, row[index]])
                  )
                ) : []}
                budgetColumn={budgetVarianceControls[item.id]?.budgetColumn || getDefaultBudgetColumn(csvColumns)}
                actualColumn={budgetVarianceControls[item.id]?.actualColumn || getDefaultActualColumn(csvColumns)}
                dateColumn={budgetVarianceControls[item.id]?.dateColumn}
                periodType={budgetVarianceControls[item.id]?.periodType || 'monthly'}
                onBudgetColumnChange={(column) => updateBudgetVarianceControls(item.id, { budgetColumn: column })}
                onActualColumnChange={(column) => updateBudgetVarianceControls(item.id, { actualColumn: column })}
                onDateColumnChange={(column) => updateBudgetVarianceControls(item.id, { dateColumn: column })}
                onPeriodTypeChange={(type) => updateBudgetVarianceControls(item.id, { periodType: type })}
              />
            </div>
          )}

          {/* Content */}
          <div className="text-sm text-gray-600 mb-3">
            Created: {new Date(item.result.createdAt).toLocaleDateString()}
          </div>

          {/* Visualization */}
          <div 
            className="border border-gray-200 rounded p-3 bg-gray-50 min-h-32"
            dangerouslySetInnerHTML={{
              __html: item.result.type === 'budget-variance' 
                ? generateBudgetVarianceHTML(item.id)
                : item.result.htmlOutput || '<div>Visualization not available</div>'
            }}
          />
        </div>
      </div>
    );
  }
}
