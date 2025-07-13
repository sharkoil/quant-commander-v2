/**
 * Analysis Tab Component
 * Provides draggable lists for managing analysis results
 * Uses Shopify Draggable for drag-and-drop functionality
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sortable } from '@shopify/draggable';
import { 
  DraggableAnalysisItem, 
  AnalysisFilters, 
  AnalysisType,
  AnalysisTypeConfig 
} from '../types/analysis';
import { 
  getAnalysisTypes,
  getAnalysisTypeConfig,
  registerAnalysisUpdateCallback,
  getCurrentAnalysisResults,
  initializeAnalysisService
} from '../lib/analysisService';

export default function AnalysisTab() {
  // State management for analysis results and UI
  const [analysisItems, setAnalysisItems] = useState<DraggableAnalysisItem[]>([]);
  const [filters, setFilters] = useState<AnalysisFilters>({});
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [isLoading, setIsLoading] = useState(true);
  
  // State for contribution analysis controls
  const [contributionControls, setContributionControls] = useState<{
    [analysisId: string]: {
      selectedField: string;
      timeScale: 'total' | 'quarterly' | 'monthly';
    }
  }>({});
  
  // Refs for draggable containers
  const pinnedContainerRef = useRef<HTMLDivElement>(null);
  const unpinnedContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Initialize Shopify Draggable for both containers
   */
  const initializeDraggable = useCallback(() => {
    if (!pinnedContainerRef.current || !unpinnedContainerRef.current) return;

    // Create sortable instance for pinned items
    const pinnedSortable = new Sortable([pinnedContainerRef.current], {
      draggable: '.draggable-analysis-item',
      handle: '.drag-handle',
      mirror: {
        appendTo: 'body',
        constrainDimensions: true,
      },
    });

    // Create sortable instance for unpinned items
    const unpinnedSortable = new Sortable([unpinnedContainerRef.current], {
      draggable: '.draggable-analysis-item',
      handle: '.drag-handle',
      mirror: {
        appendTo: 'body',
        constrainDimensions: true,
      },
    });

    // Handle drag events
    pinnedSortable.on('sortable:stop', handleDragEnd);
    unpinnedSortable.on('sortable:stop', handleDragEnd);

    // Cleanup function
    return () => {
      pinnedSortable.destroy();
      unpinnedSortable.destroy();
    };
  }, []);

  // Initialize mock data and draggable functionality
  useEffect(() => {
    console.log('🎭 AnalysisTab component initializing...');
    
    // DON'T initialize clean state here - we want to preserve any existing analysis results
    // that might have been added before this component mounted
    
    // Load initial analysis results (get whatever is currently in the global store)
    const currentItems = getCurrentAnalysisResults();
    console.log('📋 Initial analysis items from global store:', currentItems);
    setAnalysisItems(currentItems);
    
    // Register for real-time analysis updates
    registerAnalysisUpdateCallback((updatedItems) => {
      console.log('📬 Analysis update callback received in AnalysisTab:', updatedItems);
      console.log('📊 Setting analysis items to:', updatedItems.length, 'items');
      setAnalysisItems(updatedItems);
    });
    
    // Initialize contribution controls for contribution analysis items
    const initialControls: typeof contributionControls = {};
    currentItems.forEach(item => {
      if (item.result.type === 'contribution') {
        // Use the first available column as default, preferring numeric columns
        const availableColumns = item.result.metadata.columns;
        const defaultField = availableColumns.find(col => 
          col.toLowerCase().includes('revenue') || 
          col.toLowerCase().includes('sales') || 
          col.toLowerCase().includes('amount')
        ) || availableColumns[0] || 'Revenue';
        
        initialControls[item.id] = {
          selectedField: defaultField,
          timeScale: 'total'
        };
      }
    });
    setContributionControls(initialControls);
    
    setIsLoading(false);

    // Initialize Shopify Draggable after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeDraggable();
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeDraggable]);

  /**
   * Handle drag end event to update item order
   */
  const handleDragEnd = (event: { oldIndex: number; newIndex: number }) => {
    const { oldIndex, newIndex } = event;
    if (oldIndex === newIndex) return;

    setAnalysisItems(prevItems => {
      const newItems = [...prevItems];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);
      
      // Update order values
      return newItems.map((item, index) => ({
        ...item,
        order: index
      }));
    });
  };

  /**
   * Toggle pin status of an analysis item
   */
  const togglePin = (itemId: string) => {
    setAnalysisItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, isPinned: !item.isPinned } : item
      )
    );
  };

  /**
   * Delete an analysis item
   */
  const deleteItem = (itemId: string) => {
    setAnalysisItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  /**
   * Update contribution analysis controls
   */
  const updateContributionControls = (analysisId: string, field: string, timeScale: 'total' | 'quarterly' | 'monthly') => {
    setContributionControls(prev => ({
      ...prev,
      [analysisId]: {
        selectedField: field,
        timeScale: timeScale
      }
    }));
  };

  /**
   * Generate updated HTML output for contribution analysis based on controls
   */
  const generateContributionHTML = (analysisId: string): string => {
    const controls = contributionControls[analysisId];
    
    // Use defaults if controls not yet initialized
    const selectedField = controls?.selectedField || 'Revenue';
    const timeScale = controls?.timeScale || 'total';
    
    // Mock data for demonstration - in real implementation this would call the actual analyzer
    type ContributionItem = { name: string; percentage: number; value: number; };
    type DataStructure = Record<string, ContributionItem[]>;
    
    const mockData: Record<string, DataStructure> = {
      total: {
        'Revenue': [
          { name: 'North America', percentage: 45.2, value: 2345678 },
          { name: 'Europe', percentage: 32.1, value: 1666543 },
          { name: 'Asia Pacific', percentage: 22.7, value: 1178901 }
        ],
        'Customer_Count': [
          { name: 'North America', percentage: 38.5, value: 15420 },
          { name: 'Europe', percentage: 35.2, value: 14088 },
          { name: 'Asia Pacific', percentage: 26.3, value: 10528 }
        ],
        'Product_Mix': [
          { name: 'Electronics', percentage: 42.1, value: 1890000 },
          { name: 'Apparel', percentage: 28.6, value: 1285000 },
          { name: 'Home & Garden', percentage: 29.3, value: 1315000 }
        ]
      },
      quarterly: {
        'Revenue': [
          { name: 'Q1 2024', percentage: 24.1, value: 1250000 },
          { name: 'Q2 2024', percentage: 26.3, value: 1365000 },
          { name: 'Q3 2024', percentage: 25.8, value: 1340000 },
          { name: 'Q4 2024', percentage: 23.8, value: 1235000 }
        ],
        'Customer_Count': [
          { name: 'Q1 2024', percentage: 23.2, value: 9280 },
          { name: 'Q2 2024', percentage: 27.1, value: 10840 },
          { name: 'Q3 2024', percentage: 26.4, value: 10560 },
          { name: 'Q4 2024', percentage: 23.3, value: 9320 }
        ],
        'Product_Mix': [
          { name: 'Q1 2024', percentage: 25.2, value: 1130000 },
          { name: 'Q2 2024', percentage: 26.8, value: 1202000 },
          { name: 'Q3 2024', percentage: 24.9, value: 1117000 },
          { name: 'Q4 2024', percentage: 23.1, value: 1037000 }
        ]
      },
      monthly: {
        'Revenue': [
          { name: 'Jan 2024', percentage: 8.2, value: 425000 },
          { name: 'Feb 2024', percentage: 7.9, value: 410000 },
          { name: 'Mar 2024', percentage: 8.0, value: 415000 },
          { name: 'Apr 2024', percentage: 8.8, value: 455000 },
          { name: 'May 2024', percentage: 8.7, value: 450000 },
          { name: 'Jun 2024', percentage: 8.8, value: 460000 }
        ],
        'Customer_Count': [
          { name: 'Jan 2024', percentage: 7.8, value: 3120 },
          { name: 'Feb 2024', percentage: 7.6, value: 3040 },
          { name: 'Mar 2024', percentage: 7.8, value: 3120 },
          { name: 'Apr 2024', percentage: 9.2, value: 3680 },
          { name: 'May 2024', percentage: 9.0, value: 3600 },
          { name: 'Jun 2024', percentage: 9.1, value: 3640 }
        ],
        'Product_Mix': [
          { name: 'Jan 2024', percentage: 8.5, value: 382000 },
          { name: 'Feb 2024', percentage: 8.3, value: 373000 },
          { name: 'Mar 2024', percentage: 8.4, value: 377000 },
          { name: 'Apr 2024', percentage: 8.6, value: 386000 },
          { name: 'May 2024', percentage: 8.8, value: 395000 },
          { name: 'Jun 2024', percentage: 8.2, value: 368000 }
        ]
      }
    };

    const data = mockData[timeScale]?.[selectedField] || mockData.total[selectedField] || [];
    
    return `
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-800">Contribution Analysis - ${selectedField}</h3>
        <div class="text-sm text-gray-600 mb-3">
          Time Scale: <span class="font-medium capitalize">${timeScale}</span>
        </div>
        <div class="space-y-3">
          ${data.map((item: ContributionItem, index: number) => {
            const colorClasses = [
              'bg-blue-50 text-blue-700',
              'bg-green-50 text-green-700', 
              'bg-yellow-50 text-yellow-700',
              'bg-purple-50 text-purple-700',
              'bg-red-50 text-red-700',
              'bg-indigo-50 text-indigo-700'
            ];
            const colorClass = colorClasses[index % colorClasses.length];
            
            return `
              <div class="flex items-center justify-between p-3 ${colorClass.split(' ')[0]} rounded">
                <span class="font-medium">${item.name}</span>
                <div class="text-right">
                  <div class="font-bold ${colorClass.split(' ')[1]}">${item.percentage.toFixed(1)}%</div>
                  <div class="text-sm text-gray-600">$${item.value.toLocaleString()}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  };

  /**
   * Get analysis type configuration for styling
   */
  const getTypeConfig = (type: AnalysisType): AnalysisTypeConfig => {
    return getAnalysisTypeConfig(type) || {
      type,
      icon: '📊',
      name: type,
      color: 'bg-gray-100 text-gray-800',
      description: 'Unknown analysis type'
    };
  };

  // Filter and sort items
  const filteredItems = analysisItems.filter(item => {
    if (filters.type && item.result.type !== filters.type) return false;
    if (filters.showPinnedOnly && !item.isPinned) return false;
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return item.result.title.toLowerCase().includes(query) ||
             item.result.metadata.datasetName.toLowerCase().includes(query);
    }
    return true;
  });

  const pinnedItems = filteredItems.filter(item => item.isPinned);
  const unpinnedItems = filteredItems.filter(item => !item.isPinned);

  /**
   * Render individual analysis item
   */
  const renderAnalysisItem = (item: DraggableAnalysisItem) => {
    const typeConfig = getTypeConfig(item.result.type);
    
    return (
      <div 
        key={item.id}
        className="draggable-analysis-item bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      >
        {/* Header with drag handle and controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            {/* Drag handle */}
            <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM17 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
              </svg>
            </div>
            
            {/* Analysis type badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
              <span className="mr-1">{typeConfig.icon}</span>
              {typeConfig.name}
            </span>
            
            {/* Pin indicator */}
            {item.isPinned && (
              <span className="text-yellow-500" title="Pinned">
                📌
              </span>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => togglePin(item.id)}
              className={`text-sm px-2 py-1 rounded transition-colors ${
                item.isPinned 
                  ? 'text-yellow-600 hover:bg-yellow-50' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              title={item.isPinned ? 'Unpin' : 'Pin'}
            >
              {item.isPinned ? '📌' : '📍'}
            </button>
            <button
              onClick={() => deleteItem(item.id)}
              className="text-red-500 hover:bg-red-50 text-sm px-2 py-1 rounded transition-colors"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Title and metadata */}
          <div className="mb-3">
            <h3 className="font-semibold text-gray-800 mb-1">{item.result.title}</h3>
            <div className="text-sm text-gray-500 space-y-1">
              <div>📄 {item.result.metadata.datasetName}</div>
              <div className="flex items-center space-x-4">
                <span>📊 {item.result.metadata.recordCount.toLocaleString()} records</span>
                <span>⏱️ {item.result.metadata.processingTime}s</span>
                <span>📅 {formatDate(item.result.createdAt)}</span>
              </div>
            </div>
          </div>
          
          {/* Contribution Analysis Controls */}
          {item.result.type === 'contribution' ? (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <h4 className="text-sm font-semibold mb-2 text-gray-700">🔧 Analysis Controls</h4>
              <div className="flex flex-wrap items-center gap-4">
                {/* Field selector */}
                <div className="flex-1 min-w-40">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Field to Analyze</label>
                  <select
                    value={contributionControls[item.id]?.selectedField || item.result.metadata.columns[0] || 'Revenue'}
                    onChange={(e) => updateContributionControls(item.id, e.target.value, contributionControls[item.id]?.timeScale || 'total')}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
                    title="Select field for contribution analysis"
                    aria-label="Select field for contribution analysis"
                  >
                    {item.result.metadata.columns.map(column => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                </div>
                
                {/* Time scale radio buttons */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Time Scale</label>
                  <div className="flex items-center space-x-3">
                    {(['total', 'quarterly', 'monthly'] as const).map(scale => (
                      <label key={scale} className="flex items-center text-sm">
                        <input
                          type="radio"
                          name={`timeScale-${item.id}`}
                          value={scale}
                          checked={(contributionControls[item.id]?.timeScale || 'total') === scale}
                          onChange={(e) => updateContributionControls(item.id, contributionControls[item.id]?.selectedField || item.result.metadata.columns[0] || 'Revenue', e.target.value as 'total' | 'quarterly' | 'monthly')}
                          className="mr-1"
                        />
                        <span className="capitalize">{scale}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          
          {/* Analysis output */}
          <div className="text-sm">
            {item.result.type === 'contribution' ? (
              <div dangerouslySetInnerHTML={{ __html: generateContributionHTML(item.id) }} />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: item.result.htmlOutput }} />
            )}
          </div>
          
          {/* Key insights */}
          {item.result.metadata.insights.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h4 className="text-xs font-medium text-gray-600 mb-2">💡 Key Insights</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {item.result.metadata.insights.slice(0, 2).map((insight, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <span>•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analysis Results</h2>
          <p className="text-gray-600">Drag and drop to organize your analysis results</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'cards' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
          </div>
          
          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'type')}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
            title="Sort analysis results"
            aria-label="Sort analysis results"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Type filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Filter by Type</label>
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                type: e.target.value as AnalysisType || undefined 
              }))}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
              title="Filter by analysis type"
              aria-label="Filter by analysis type"
            >
              <option value="">All Types</option>
              {getAnalysisTypes().map(type => (
                <option key={type.type} value={type.type}>
                  {type.icon} {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search filter */}
          <div className="flex-1 max-w-md">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
            <input
              type="text"
              placeholder="Search by title or dataset..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
            />
          </div>

          {/* Pinned only filter */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="pinnedOnly"
              checked={filters.showPinnedOnly || false}
              onChange={(e) => setFilters(prev => ({ ...prev, showPinnedOnly: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="pinnedOnly" className="text-sm font-medium text-gray-700">
              Show pinned only
            </label>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredItems.length} of {analysisItems.length} results
          {pinnedItems.length > 0 && ` (${pinnedItems.length} pinned)`}
        </span>
        <span>Last updated: {formatDate(new Date())}</span>
      </div>

      {/* Main content - only show if we have analysis items */}
      {analysisItems.length > 0 && (
        <>
          {/* Pinned Results Section */}
          {pinnedItems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <span className="mr-2">📌</span>
                Pinned Results ({pinnedItems.length})
              </h3>
              <div 
                ref={pinnedContainerRef}
                className={`grid gap-4 ${
                  viewMode === 'cards' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {pinnedItems.map(renderAnalysisItem)}
              </div>
            </div>
          )}

          {/* All Results Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">📊</span>
              {pinnedItems.length > 0 ? 'Other Results' : 'All Results'} ({unpinnedItems.length})
            </h3>
            <div 
              ref={unpinnedContainerRef}
              className={`grid gap-4 ${
                viewMode === 'cards' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {unpinnedItems.map(renderAnalysisItem)}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {analysisItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-8xl mb-6">�</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Ready for Analysis</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first analysis by clicking one of the test buttons in the chat interface, 
            or run a custom analysis on your data.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              💡 Tip: Start with "Test Contribution Analysis"
            </span>
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
      ) : null}
    </div>
  );
}
