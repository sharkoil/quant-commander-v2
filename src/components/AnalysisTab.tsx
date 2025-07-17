/**
 * Analysis Tab Component
 * Provides draggable lists for managing analysis results
 * Uses real CSV data and removes demo data references
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sortable } from '@shopify/draggable';
import { 
  DraggableAnalysisItem, 
  AnalysisFilters, 
  AnalysisType
} from '../types/analysis';
import { TopNAnalysisParams } from '../lib/analyzers/topNTypes';
import { 
  getAnalysisTypes,
  getAnalysisTypeConfig,
  registerAnalysisUpdateCallback,
  getCurrentAnalysisResults
} from '../lib/analysisService';
import { BudgetVarianceControls } from './BudgetVarianceControls';
import { ContributionControls } from './ContributionControls';
import { PeriodVarianceControls } from './PeriodVarianceControls';
import { TrendAnalysisControls } from './TrendAnalysisControls';
import { 
  processBudgetVarianceData, 
  BudgetVarianceParams 
} from '../lib/analyzers/budgetVarianceProcessor';
import {
  ContributionAnalysisParams
} from '../lib/analyzers/contributionTypes';
import {
  processContributionData
} from '../lib/analyzers/contributionProcessor';
import {
  processPeriodVarianceData,
  PeriodVarianceParams
} from '../lib/analyzers/periodVarianceProcessor';
import {
  processTrendAnalysisData,
  TrendAnalysisParams
} from '../lib/analyzers/trendAnalysisProcessor';
import {
  generateContributionVisualization
} from '../lib/visualizations/contributionVisualizer';
import { generateBudgetVarianceVisualization } from '../lib/visualizations/budgetVarianceVisualizer';
import { generatePeriodVarianceVisualization } from '../lib/visualizations/periodVarianceVisualizer';
import { generateTrendAnalysisVisualization } from '../lib/visualizations/trendAnalysisVisualizer';
import { 
  getDefaultBudgetColumn, 
  getDefaultActualColumn,
  getDateFields,
  getNumericFields,
  getTextFields
} from '../lib/utils/csvFieldAnalyzer';
import { GlobalAnalysisSettings, GlobalAnalysisSettings as GlobalAnalysisSettingsType } from './GlobalAnalysisSettings';
import { AIColumnInsights } from './AIColumnInsights';
import { SmartColumnSelector } from './SmartColumnSelector';

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
  
  // Collapse state for cards
  const [collapsedCards, setCollapsedCards] = useState<{[key: string]: boolean}>({});
  
  // Pin management state
  const [pinnedState, setPinnedState] = useState<{[key: string]: boolean}>({});
  
  // View mode state
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  
  // State for budget variance analysis controls
  const [budgetVarianceControls, setBudgetVarianceControls] = useState<{
    [analysisId: string]: {
      budgetColumn: string;
      actualColumn: string;
      dateColumn?: string;
      periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    }
  }>({});
  
  // State for contribution analysis controls
  const [contributionControls, setContributionControls] = useState<{
    [analysisId: string]: {
      valueColumn: string;
      categoryColumn: string;
      subcategoryColumn?: string;
      analysisScope: 'total' | 'average' | 'period';
      showOthers: boolean;
      sortBy: 'contribution' | 'value' | 'alphabetical';
      sortOrder: 'desc' | 'asc';
      timePeriodAnalysis?: {
        enabled: boolean;
        periodType: 'quarter' | 'month' | 'all';
        dateColumn: string;
      };
    }
  }>({});

  // State for period variance analysis controls
  const [periodVarianceControls, setPeriodVarianceControls] = useState<{
    [analysisId: string]: {
      valueColumn: string;
      dateColumn: string;
      periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    }
  }>({});

  // State for trend analysis controls
  const [trendAnalysisControls, setTrendAnalysisControls] = useState<{
    [analysisId: string]: {
      valueColumn: string;
      dateColumn: string;
      windowSize: number;
      trendType: 'simple' | 'exponential';
    }
  }>({});

  // State for Top N analysis controls
  const [topNControls, setTopNControls] = useState<{
    [analysisId: string]: TopNAnalysisParams;
  }>({});

  // Force re-render trigger for budget variance
  // Note: Currently not used but kept for future auto-refresh functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [budgetRenderTrigger, setBudgetRenderTrigger] = useState(0);

  // Force re-render trigger for contribution analysis
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [contributionRenderTrigger, setContributionRenderTrigger] = useState(0);

  // Refs for draggable containers
  const pinnedContainerRef = useRef<HTMLDivElement>(null);
  const unpinnedContainerRef = useRef<HTMLDivElement>(null);
  const sortableRefs = useRef<{[key: string]: Sortable}>({});

  // Global analysis settings state
  const [globalSettings, setGlobalSettings] = useState<GlobalAnalysisSettingsType>({
    primaryValueColumn: 'Value',
    secondaryValueColumn: undefined,
    dateColumn: 'Date',
    primaryCategoryColumn: 'Category',
    secondaryCategoryColumn: undefined,
    defaultTimeScale: 'month',
    defaultTopN: 5,
    defaultConfidenceLevel: 95,
    showPercentages: true,
    currencyFormat: 'USD'
  });

  // Magical AI Experience State
  const [showMagicalAI, setShowMagicalAI] = useState(false);
  const [useSmartSelector, setUseSmartSelector] = useState(false);
  const [smartColumns, setSmartColumns] = useState<Record<string, string>>({});
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false);

  // Initialize analysis items on component mount
  useEffect(() => {
    const initializeItems = () => {
      try {
        const items = getCurrentAnalysisResults();
        setAnalysisItems(items);
        
        // Initialize control states for budget variance analysis
        const initialBudgetControls: typeof budgetVarianceControls = {};
        const initialContributionControls: typeof contributionControls = {};
        const initialPeriodVarianceControls: typeof periodVarianceControls = {};
        const initialTrendAnalysisControls: typeof trendAnalysisControls = {};
        const initialTopNControls: typeof topNControls = {};
        
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
          
          if (item.result.type === 'contribution') {
            // Auto-detect columns for contribution analysis
            const numericFields = getNumericFields(csvDataForAnalysis);
            const textFields = getTextFields(csvDataForAnalysis);
            
            initialContributionControls[item.id] = {
              valueColumn: numericFields[0] || csvColumns[0] || 'Value',
              categoryColumn: textFields[0] || csvColumns[1] || 'Category',
              analysisScope: 'total',
              showOthers: true,
              sortBy: 'contribution',
              sortOrder: 'desc'
            };
            
            console.log(`🎯 Auto-detected columns for contribution ${item.id}:`, {
              value: numericFields[0],
              category: textFields[0],
              availableNumeric: numericFields,
              availableText: textFields
            });
          }

          if (item.result.type === 'period-variance') {
            // Auto-detect columns for period variance analysis
            const numericFields = getNumericFields(csvDataForAnalysis);
            const dateFields = getDateFields(csvDataForAnalysis);
            
            initialPeriodVarianceControls[item.id] = {
              valueColumn: numericFields[0] || csvColumns[0] || 'Value',
              dateColumn: dateFields[0] || csvColumns[0] || 'Date',
              periodType: 'monthly'
            };
            
            console.log(`🎯 Auto-detected columns for period variance ${item.id}:`, {
              value: numericFields[0],
              date: dateFields[0],
              availableNumeric: numericFields,
              availableDate: dateFields
            });
          }

          if (item.result.type === 'trend-analysis') {
            // Auto-detect columns for trend analysis
            const numericFields = getNumericFields(csvDataForAnalysis);
            const dateFields = getDateFields(csvDataForAnalysis);
            
            initialTrendAnalysisControls[item.id] = {
              valueColumn: numericFields[0] || csvColumns[0] || 'Value',
              dateColumn: dateFields[0] || csvColumns[0] || 'Date',
              windowSize: 3,
              trendType: 'simple'
            };
            
            console.log(`🎯 Auto-detected columns for trend analysis ${item.id}:`, {
              value: numericFields[0],
              date: dateFields[0],
              availableNumeric: numericFields,
              availableDate: dateFields
            });
          }

          if (item.result.type === 'top-n') {
            // Auto-detect columns for Top N analysis
            const numericFields = getNumericFields(csvDataForAnalysis);
            const textFields = getTextFields(csvDataForAnalysis);
            const dateFields = getDateFields(csvDataForAnalysis);
            
            initialTopNControls[item.id] = {
              valueColumn: numericFields[0] || csvColumns[0] || 'Value',
              categoryColumn: textFields[0] || csvColumns[1] || 'Category',
              dateColumn: dateFields[0] || csvColumns[0] || 'Date',
              topN: 3,
              bottomN: 3,
              timePeriod: 'total',
              showPercentages: true,
              analysisScope: 'all'
            };
            
            console.log(`🎯 Auto-detected columns for Top N ${item.id}:`, {
              value: numericFields[0],
              category: textFields[0],
              date: dateFields[0],
              availableNumeric: numericFields,
              availableText: textFields,
              availableDate: dateFields
            });
          }
        });
        
        setBudgetVarianceControls(initialBudgetControls);
        setContributionControls(initialContributionControls);
        setPeriodVarianceControls(initialPeriodVarianceControls);
        setTrendAnalysisControls(initialTrendAnalysisControls);
        setTopNControls(initialTopNControls);
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

  // Initialize Shopify Draggable after items are loaded
  useEffect(() => {
    if (isLoading || analysisItems.length === 0) return;

    // Initialize draggable for both containers
    const initializeDraggable = (containerRef: React.RefObject<HTMLDivElement | null>, containerId: string) => {
      if (!containerRef.current) return;

      // Clean up existing sortable instance
      if (sortableRefs.current[containerId]) {
        sortableRefs.current[containerId].destroy();
      }

      const sortable = new Sortable(containerRef.current, {
        draggable: '.analysis-card',
        handle: '.drag-handle',
        mirror: {
          appendTo: 'body',
          constrainDimensions: true,
        },
      });

      // Handle drag events
      sortable.on('drag:start', () => {
        console.log('🎯 Drag started');
        document.body.style.cursor = 'grabbing';
      });

      sortable.on('drag:stop', () => {
        console.log('🎯 Drag stopped');
        document.body.style.cursor = '';
      });

      sortable.on('sortable:stop', (evt: { oldIndex: number; newIndex: number }) => {
        console.log('🎯 Sort completed', evt);
        // Here you could update the order in your state/backend
        const sourceIndex = evt.oldIndex;
        const targetIndex = evt.newIndex;
        
        if (sourceIndex !== targetIndex) {
          console.log(`Moved item from ${sourceIndex} to ${targetIndex}`);
          // You can implement position persistence here
        }
      });

      sortableRefs.current[containerId] = sortable;
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      initializeDraggable(pinnedContainerRef, 'pinned');
      initializeDraggable(unpinnedContainerRef, 'unpinned');
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      // Clean up sortable instances
      Object.values(sortableRefs.current).forEach(sortable => {
        if (sortable) sortable.destroy();
      });
      sortableRefs.current = {};
    };
  }, [analysisItems, isLoading]);

  // Toggle card collapse
  const toggleCardCollapse = (cardId: string) => {
    setCollapsedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Toggle pin state
  const togglePinState = (itemId: string) => {
    setPinnedState(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Enhanced filtering with pin consideration
  const getFilteredAndSortedItems = () => {
    // Filter items
    const filtered = analysisItems.filter(item => {
      if (filters.type && item.result.type !== filters.type) return false;
      if (filters.searchQuery && !item.result.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      return true;
    });

    // Sort items
    const sorted = [...filtered].sort((a, b) => {
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

    // Separate pinned and unpinned based on state and item property
    const pinned = sorted.filter(item => item.isPinned || pinnedState[item.id]);
    const unpinned = sorted.filter(item => !item.isPinned && !pinnedState[item.id]);

    return { pinned, unpinned };
  };

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

  // Update contribution analysis controls handler
  const updateContributionControls = (
    analysisId: string, 
    updates: Partial<ContributionAnalysisParams>
  ) => {
    setContributionControls(prev => {
      const updated = {
        ...prev,
        [analysisId]: {
          ...prev[analysisId],
          ...updates
        }
      };
      
      // Trigger re-render when controls change
      setContributionRenderTrigger(prev => prev + 1);
      
      return updated;
    });
  };

  const updatePeriodVarianceControls = (
    analysisId: string, 
    updates: Partial<PeriodVarianceParams>
  ) => {
    setPeriodVarianceControls(prev => {
      const updated = {
        ...prev,
        [analysisId]: {
          ...prev[analysisId],
          ...updates
        }
      };
      
      return updated;
    });
  };

  const updateTrendAnalysisControls = (
    analysisId: string, 
    updates: Partial<TrendAnalysisParams>
  ) => {
    setTrendAnalysisControls(prev => {
      const updated = {
        ...prev,
        [analysisId]: {
          ...prev[analysisId],
          ...updates
        }
      };
      
      return updated;
    });
  };

  const updateTopNControls = (
    analysisId: string, 
    updates: Partial<TopNAnalysisParams>
  ) => {
    setTopNControls(prev => {
      const updated = {
        ...prev,
        [analysisId]: {
          ...prev[analysisId],
          ...updates
        }
      };
      
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
          budgetColumn: controls?.budgetColumn || getDefaultBudgetColumn(realData),
          actualColumn: controls?.actualColumn || getDefaultActualColumn(realData),
          dateColumn: controls?.dateColumn,
          periodType: controls?.periodType || 'monthly'
        }
      );

      return generateBudgetVarianceVisualization(
        processedResult,
        controls?.budgetColumn || getDefaultBudgetColumn(realData),
        controls?.actualColumn || getDefaultActualColumn(realData)
      );
    } catch (error) {
      console.error('Error generating budget variance visualization:', error);
      return '<div class="text-red-600">Error generating budget variance analysis</div>';
    }
  };

  // Generate contribution analysis visualization
  const generateContributionHTML = (analysisId: string): string => {
    try {
      const item = analysisItems.find(item => item.id === analysisId);
      if (!item || item.result.type !== 'contribution') {
        return '<div>No contribution analysis data available</div>';
      }

      const controls = contributionControls[analysisId];
      
      // Use real CSV data instead of mock data
      const realData = csvData.length > 0 ? csvData.slice(1).map(row => 
        Object.fromEntries(
          csvColumns.map((col, index) => [col, row[index]])
        )
      ) : [];

      if (realData.length === 0) {
        return '<div class="text-yellow-600">No data available for contribution analysis</div>';
      }

      const processedResult = processContributionData(
        realData,
        {
          valueColumn: controls?.valueColumn || getNumericFields(realData)[0] || 'Value',
          categoryColumn: controls?.categoryColumn || getTextFields(realData)[0] || 'Category',
          subcategoryColumn: controls?.subcategoryColumn,
          analysisScope: controls?.analysisScope || 'total',
          showOthers: controls?.showOthers ?? true,
          sortBy: controls?.sortBy || 'contribution',
          sortOrder: controls?.sortOrder || 'desc',
          timePeriodAnalysis: controls?.timePeriodAnalysis
        }
      );

      return generateContributionVisualization(
        processedResult,
        controls?.valueColumn || getNumericFields(realData)[0] || 'Value',
        controls?.categoryColumn || getTextFields(realData)[0] || 'Category'
      );
    } catch (error) {
      console.error('Error generating contribution visualization:', error);
      return '<div class="text-red-600">Error generating contribution analysis</div>';
    }
  };

  const generatePeriodVarianceHTML = (analysisId: string): string => {
    try {
      const item = analysisItems.find(item => item.id === analysisId);
      if (!item || item.result.type !== 'period-variance') {
        return '<div>No period variance data available</div>';
      }

      const controls = periodVarianceControls[analysisId];
      
      const realData = csvData.length > 0 ? csvData.slice(1).map(row => 
        Object.fromEntries(
          csvColumns.map((col, index) => [col, row[index]])
        )
      ) : [];

      if (realData.length === 0) {
        return '<div class="text-yellow-600">No data available for period variance analysis</div>';
      }

      const processedResult = processPeriodVarianceData(
        realData,
        {
          valueColumn: controls?.valueColumn || getNumericFields(realData)[0] || 'Value',
          dateColumn: controls?.dateColumn || getDateFields(realData)[0] || 'Date',
          periodType: controls?.periodType || 'monthly'
        }
      );

      return generatePeriodVarianceVisualization(processedResult);
    } catch (error) {
      console.error('Error generating period variance visualization:', error);
      return '<div class="text-red-600">Error generating period variance analysis</div>';
    }
  };

  const generateTrendAnalysisHTML = (analysisId: string): string => {
    try {
      const item = analysisItems.find(item => item.id === analysisId);
      if (!item || item.result.type !== 'trend-analysis') {
        return '<div>No trend analysis data available</div>';
      }

      const controls = trendAnalysisControls[analysisId];
      
      const realData = csvData.length > 0 ? csvData.slice(1).map(row => 
        Object.fromEntries(
          csvColumns.map((col, index) => [col, row[index]])
        )
      ) : [];

      if (realData.length === 0) {
        return '<div class="text-yellow-600">No data available for trend analysis</div>';
      }

      const processedResult = processTrendAnalysisData(
        realData,
        {
          valueColumn: controls?.valueColumn || getNumericFields(realData)[0] || 'Value',
          dateColumn: controls?.dateColumn || getDateFields(realData)[0] || 'Date',
          windowSize: controls?.windowSize || 3,
          trendType: controls?.trendType || 'linear'
        }
      );

      return generateTrendAnalysisVisualization(processedResult);
    } catch (error) {
      console.error('Error generating trend analysis visualization:', error);
      return '<div class="text-red-600">Error generating trend analysis</div>';
    }
  };

  // Generate TopN Analysis HTML - Real Implementation with Time Periods
  const generateTopNHTML = (analysisId: string): string => {
    if (!csvData || csvData.length === 0) {
      return '<div class="text-gray-700 p-4">No data available for TopN analysis</div>';
    }

    // Get the TopN controls for this analysis
    const controls = topNControls[analysisId];
    
    const valueColumn = controls?.valueColumn || getNumericFields(csvData.slice(1).map(row => 
      Object.fromEntries(csvColumns.map((col, index) => [col, row[index]]))
    ))[0] || 'Value';
    
    const categoryColumn = controls?.categoryColumn || getTextFields(csvData.slice(1).map(row => 
      Object.fromEntries(csvColumns.map((col, index) => [col, row[index]]))
    ))[0] || 'Category';
    
    if (!valueColumn || !categoryColumn) {
      return `
        <div class="text-center p-6">
          <div class="text-4xl mb-4">🔧</div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Configuration Required</h3>
          <p class="text-gray-600">Please select value and category columns above to run TopN analysis</p>
        </div>
      `;
    }

    const { topN = 3, bottomN = 3, timePeriod = 'total', dateColumn } = controls || {};
    
    // Check if time period analysis requires a date column
    if (timePeriod !== 'total' && !dateColumn) {
      return `
        <div class="text-center p-6">
          <div class="text-4xl mb-4">📅</div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Date Column Required</h3>
          <p class="text-gray-600">Please select a date column for time-based analysis</p>
        </div>
      `;
    }
    
    try {
      // Convert CSV data to objects for processing
      const dataObjects = csvData.slice(1).map(row => 
        Object.fromEntries(
          csvColumns.map((col, index) => [col, row[index]])
        )
      );

      // Function to get period key from date
      const getPeriodKey = (dateValue: any): string => {
        if (!dateValue) return 'Unknown';
        
        let date: Date;
        if (dateValue instanceof Date) {
          date = dateValue;
        } else {
          date = new Date(dateValue);
        }
        
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        switch (timePeriod) {
          case 'year':
            return date.getFullYear().toString();
          case 'quarter':
            const quarter = Math.ceil((date.getMonth() + 1) / 3);
            return `Q${quarter} ${date.getFullYear()}`;
          case 'month':
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          default:
            return 'Total';
        }
      };

      // Function to get display name for period
      const getPeriodDisplay = (periodKey: string): string => {
        switch (timePeriod) {
          case 'year':
            return periodKey;
          case 'quarter':
            return periodKey;
          case 'month':
            const [year, month] = periodKey.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          default:
            return 'All Time';
        }
      };

      // Group data by time period if needed
      const periodData: { [period: string]: { [category: string]: number } } = {};
      
      dataObjects.forEach(row => {
        const category = (row as any)[categoryColumn];
        const value = parseFloat((row as any)[valueColumn]);
        const dateValue = timePeriod !== 'total' && dateColumn ? (row as any)[dateColumn] : null;
        
        if (category && !isNaN(value)) {
          const period = timePeriod === 'total' ? 'Total' : getPeriodKey(dateValue);
          
          if (!periodData[period]) {
            periodData[period] = {};
          }
          
          periodData[period][category] = (periodData[period][category] || 0) + value;
        }
      });

      // Sort periods chronologically
      const sortedPeriods = Object.keys(periodData).sort((a, b) => {
        if (timePeriod === 'total') return 0;
        if (a === 'Unknown' || a === 'Invalid Date') return 1;
        if (b === 'Unknown' || b === 'Invalid Date') return -1;
        return a.localeCompare(b);
      });

      // Generate HTML for each period
      const periodHtml = sortedPeriods.map(period => {
        const categoryTotals = periodData[period];
        const totalValue = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
        
        const sortedItems = Object.entries(categoryTotals)
          .map(([category, value]) => ({
            category,
            value,
            percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
          }))
          .sort((a, b) => b.value - a.value);

        const topItems = sortedItems.slice(0, topN);
        const bottomItems = sortedItems.slice(-bottomN).reverse();

        return `
          <div class="mb-8 border border-gray-200 rounded-lg p-6 bg-white">
            <div class="text-center mb-6">
              <h3 class="text-xl font-semibold text-gray-800 mb-2">
                ${timePeriod === 'total' ? '🏆' : '📅'} ${getPeriodDisplay(period)}
              </h3>
              <p class="text-sm text-gray-600">Top ${topN} & Bottom ${bottomN} ${categoryColumn} by ${valueColumn}</p>
              <p class="text-xs text-gray-500 mt-1">${sortedItems.length} categories • ${totalValue.toLocaleString()} total</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Top Items -->
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 class="font-semibold text-green-800 mb-3 flex items-center">
                  🔝 Top ${topN} ${categoryColumn}
                </h4>
                <div class="space-y-2">
                  ${topItems.map((item, index) => `
                    <div class="flex items-center justify-between p-2 bg-white rounded border">
                      <div class="flex items-center">
                        <span class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          ${index + 1}
                        </span>
                        <span class="font-medium text-gray-800">${item.category}</span>
                      </div>
                      <div class="text-right">
                        <div class="font-semibold text-gray-900">${item.value.toLocaleString()}</div>
                        <div class="text-sm text-gray-500">${item.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Bottom Items -->
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 class="font-semibold text-red-800 mb-3 flex items-center">
                  📉 Bottom ${bottomN} ${categoryColumn}
                </h4>
                <div class="space-y-2">
                  ${bottomItems.map((item, index) => `
                    <div class="flex items-center justify-between p-2 bg-white rounded border">
                      <div class="flex items-center">
                        <span class="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          ${index + 1}
                        </span>
                        <span class="font-medium text-gray-800">${item.category}</span>
                      </div>
                      <div class="text-right">
                        <div class="font-semibold text-gray-900">${item.value.toLocaleString()}</div>
                        <div class="text-sm text-gray-500">${item.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Period Summary -->
            <div class="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 class="font-semibold text-gray-800 mb-3">� Period Summary</h4>
              <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div class="text-xl font-bold text-blue-600">${sortedItems.length}</div>
                  <div class="text-sm text-gray-600">Categories</div>
                </div>
                <div>
                  <div class="text-xl font-bold text-green-600">${totalValue.toLocaleString()}</div>
                  <div class="text-sm text-gray-600">Total Value</div>
                </div>
                <div>
                  <div class="text-xl font-bold text-purple-600">${(totalValue / sortedItems.length).toLocaleString()}</div>
                  <div class="text-sm text-gray-600">Average</div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Overall summary for multi-period analysis
      const overallSummary = timePeriod !== 'total' && sortedPeriods.length > 1 ? `
        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-semibold text-blue-800 mb-3">� Overall Analysis</h4>
          <div class="text-sm text-blue-700 space-y-2">
            <p>• <strong>Time Period:</strong> ${getPeriodDisplay(sortedPeriods[0])} to ${getPeriodDisplay(sortedPeriods[sortedPeriods.length - 1])}</p>
            <p>• <strong>Total Periods:</strong> ${sortedPeriods.length} ${timePeriod}${sortedPeriods.length !== 1 ? 's' : ''}</p>
            <p>• <strong>Analysis Scope:</strong> Top ${topN} and Bottom ${bottomN} ${categoryColumn} by ${valueColumn}</p>
          </div>
        </div>
      ` : '';

      return `
        <div class="space-y-6">
          ${periodHtml}
          ${overallSummary}
        </div>
      `;
    } catch (error) {
      console.error('Error generating TopN analysis:', error);
      return `
        <div class="text-center p-6">
          <div class="text-4xl mb-4">❌</div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">Analysis Error</h3>
          <p class="text-gray-600">Unable to process TopN analysis. Please check your column selections.</p>
          <p class="text-sm text-gray-500 mt-2">Error: ${error}</p>
        </div>
      `;
    }
  };

  // Get organized items using enhanced filtering
  const { pinned: pinnedItems, unpinned: unpinnedItems } = getFilteredAndSortedItems();

  // Function to get analysis description for info tooltips
  const getAnalysisDescription = (analysisType: string): string => {
    switch (analysisType) {
      case 'budget-variance':
        return 'Budget vs Actual Analysis: Compares planned budget amounts with actual spending to identify favorable, unfavorable, and on-target performance. Shows percentage variances and helps track financial performance against expectations.';
      case 'contribution':
        return 'Contribution Analysis: Analyzes how different categories contribute to the total value. Shows percentage breakdowns, top contributors, and allows drilling down into subcategories for detailed insights.';
      case 'period-variance':
        return 'Period Variance Analysis: Compares values across different time periods (weekly, monthly, quarterly, yearly) to identify trends, seasonal patterns, and period-over-period changes with statistical significance.';
      case 'trend-analysis':
        return 'Trend Analysis: Calculates moving averages and detects trend directions (upward, downward, stable). Analyzes trend strength, growth rates, volatility, and momentum to understand data patterns over time.';
      case 'outlier-detection':
        return 'Outlier Detection: Identifies data points that deviate significantly from normal patterns using statistical methods (Z-score, IQR). Helps find anomalies, errors, or exceptional cases in your data.';
      case 'top-n':
        return 'Top N Analysis: Ranks and highlights the highest or lowest values in your dataset. Useful for identifying best/worst performers, largest contributors, or most significant outliers.';
      default:
        return 'This analysis provides insights and patterns from your data using advanced statistical methods and visualization techniques.';
    }
  };

  // Update controls when global settings change
  useEffect(() => {
    if (globalSettings) {
      // Update budget variance controls
      setBudgetVarianceControls(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          updated[id] = {
            ...updated[id],
            budgetColumn: globalSettings.secondaryValueColumn || globalSettings.primaryValueColumn,
            actualColumn: globalSettings.primaryValueColumn,
            dateColumn: globalSettings.dateColumn,
            periodType: globalSettings.defaultTimeScale === 'year' ? 'yearly' : 
                       globalSettings.defaultTimeScale === 'quarter' ? 'quarterly' :
                       globalSettings.defaultTimeScale === 'week' ? 'weekly' : 'monthly'
          };
        });
        return updated;
      });

      // Update contribution controls
      setContributionControls(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          updated[id] = {
            ...updated[id],
            valueColumn: globalSettings.primaryValueColumn,
            categoryColumn: globalSettings.primaryCategoryColumn,
            subcategoryColumn: globalSettings.secondaryCategoryColumn,
            timePeriodAnalysis: {
              enabled: updated[id].timePeriodAnalysis?.enabled || false,
              periodType: updated[id].timePeriodAnalysis?.periodType || 'month',
              dateColumn: globalSettings.dateColumn
            }
          };
        });
        return updated;
      });

      // Update period variance controls
      setPeriodVarianceControls(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          updated[id] = {
            ...updated[id],
            valueColumn: globalSettings.primaryValueColumn,
            dateColumn: globalSettings.dateColumn,
            periodType: globalSettings.defaultTimeScale === 'year' ? 'yearly' : 
                       globalSettings.defaultTimeScale === 'quarter' ? 'quarterly' :
                       globalSettings.defaultTimeScale === 'week' ? 'weekly' : 'monthly'
          };
        });
        return updated;
      });

      // Update trend analysis controls
      setTrendAnalysisControls(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          updated[id] = {
            ...updated[id],
            valueColumn: globalSettings.primaryValueColumn,
            dateColumn: globalSettings.dateColumn
          };
        });
        return updated;
      });

      // Update top N controls
      setTopNControls(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          updated[id] = {
            ...updated[id],
            valueColumn: globalSettings.primaryValueColumn,
            categoryColumn: globalSettings.primaryCategoryColumn,
            topN: globalSettings.defaultTopN,
            dateColumn: globalSettings.dateColumn
          };
        });
        return updated;
      });
    }
  }, [globalSettings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analysis results...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Analysis Results</h1>
          <p className="text-gray-700 mt-1">
            Manage and explore your data analysis results with real-time CSV data processing
          </p>
        </div>
      </div>

      {/* Global Analysis Settings */}
      <GlobalAnalysisSettings
        csvData={csvData.length > 0 ? csvData.slice(1).map(row => 
          Object.fromEntries(
            csvColumns.map((col, index) => [col, row[index]])
          )
        ) : []}
        settings={globalSettings}
        onSettingsChange={setGlobalSettings}
      />

      {/* Magical AI Experience Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧠</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">AI-Powered Analysis</h2>
              <p className="text-gray-600">Let AI help you understand your data better</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAiInsightsOpen(!aiInsightsOpen)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {aiInsightsOpen ? 'Hide' : 'Show'} AI Insights
            </button>
            <button
              onClick={() => setUseSmartSelector(!useSmartSelector)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {useSmartSelector ? 'Use Traditional' : 'Use Smart'} Selector
            </button>
          </div>
        </div>

        {aiInsightsOpen && (
          <div className="mb-4">
            <AIColumnInsights 
              csvData={csvData.length > 0 ? csvData.slice(1).map(row => 
                Object.fromEntries(
                  csvColumns.map((col, index) => [col, row[index]])
                )
              ) : []}
              csvColumns={csvColumns}
              onColumnSelect={(type, column) => {
                setSmartColumns(prev => ({
                  ...prev,
                  [type]: column
                }));
                setGlobalSettings(prev => ({
                  ...prev,
                  ...(type === 'value' ? { primaryValueColumn: column } : {}),
                  ...(type === 'category' ? { primaryCategoryColumn: column } : {}),
                  ...(type === 'date' ? { dateColumn: column } : {})
                }));
              }}
            />
          </div>
        )}

        {useSmartSelector && (
          <div className="mb-4">
            <SmartColumnSelector
              csvData={csvData.length > 0 ? csvData.slice(1).map(row => 
                Object.fromEntries(
                  csvColumns.map((col, index) => [col, row[index]])
                )
              ) : []}
              csvColumns={csvColumns}
              selectedColumns={smartColumns}
              onColumnChange={(type, column) => {
                setSmartColumns(prev => ({
                  ...prev,
                  [type]: column
                }));
                setGlobalSettings(prev => ({
                  ...prev,
                  ...(type === 'value' ? { primaryValueColumn: column } : {}),
                  ...(type === 'category' ? { primaryCategoryColumn: column } : {}),
                  ...(type === 'date' ? { dateColumn: column } : {})
                }));
              }}
              title="Smart Column Detection"
            />
          </div>
        )}

        {(aiInsightsOpen || useSmartSelector) && (
          <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-indigo-600">💡</span>
              <span className="font-medium">AI Tip:</span>
              <span>
                The AI has analyzed your data structure and content to provide intelligent column recommendations. 
                Confidence scores help you understand how certain the AI is about each suggestion.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Sort Controls */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search analyses..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              title="Search analyses"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <select
            value={filters.type || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as AnalysisType || undefined }))}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            title="Sort order"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>

        {/* View Mode and Analysis Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    viewMode === 'cards' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="Card view"
                >
                  📊 Cards
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="List view"
                >
                  📋 List
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Expand all cards
                  setCollapsedCards({});
                }}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                title="Expand all cards"
              >
                📂 Expand All
              </button>
              <button
                onClick={() => {
                  // Collapse all cards
                  const allCollapsed: {[key: string]: boolean} = {};
                  analysisItems.forEach(item => {
                    allCollapsed[item.id] = true;
                  });
                  setCollapsedCards(allCollapsed);
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                title="Collapse all cards"
              >
                📁 Collapse All
              </button>
            </div>
          </div>

          {/* Analysis Statistics */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              📊 Total: {analysisItems.length}
            </span>
            <span>
              📌 Pinned: {pinnedItems.length}
            </span>
            <span>
              🔍 Filtered: {pinnedItems.length + unpinnedItems.length}
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      {(pinnedItems.length + unpinnedItems.length) > 0 ? (
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
                className="grid gap-6 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3"
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
              className="grid gap-6 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3"
            >
              {unpinnedItems.map(item => (
                <AnalysisCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      ) : analysisItems.length > 0 ? (
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
    const isCollapsed = collapsedCards[item.id] || false;
    
    if (!typeConfig) {
      return null; // Skip rendering if config is not found
    }
    
    return (
      <div className="analysis-card bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 min-h-96">
        <div className="p-6">
          {/* Header with drag handle and collapse button */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center flex-1">
              {/* Drag Handle */}
              <div 
                className="drag-handle cursor-move mr-3 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Drag to reorder"
              >
                <div className="flex flex-col space-y-1">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">{typeConfig.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{item.result.title}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeConfig.color} mt-1`}>
                      {typeConfig.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Info Button */}
              <button
                className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
                title={getAnalysisDescription(item.result.type)}
              >
                ℹ️
              </button>
              
              {/* Pin Button */}
              <button
                onClick={() => togglePinState(item.id)}
                className={`p-2 transition-colors ${
                  pinnedState[item.id] 
                    ? 'text-yellow-600 hover:text-yellow-700' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={pinnedState[item.id] ? "Unpin analysis" : "Pin analysis"}
              >
                {pinnedState[item.id] ? '📌' : '📍'}
              </button>
              
              {/* Collapse Button */}
              <button
                onClick={() => toggleCardCollapse(item.id)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? '📂' : '📁'}
              </button>
            </div>
          </div>

          {/* Collapsible Content */}
          {!isCollapsed && (
            <>
              {/* Budget Variance Controls */}
              {item.result.type === 'budget-variance' && (
                <div className="mb-6">
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

              {/* Contribution Analysis Controls */}
              {item.result.type === 'contribution' && (
                <div className="mb-6">
                  <ContributionControls
                    csvData={csvData.length > 0 ? csvData.slice(1).map(row => 
                      Object.fromEntries(
                        csvColumns.map((col, index) => [col, row[index]])
                      )
                    ) : []}
                    valueColumn={contributionControls[item.id]?.valueColumn || getNumericFields(csvData.length > 0 ? csvData.slice(1).map(row => 
                      Object.fromEntries(
                        csvColumns.map((col, index) => [col, row[index]])
                      )
                    ) : [])[0] || csvColumns[0] || 'Value'}
                    categoryColumn={contributionControls[item.id]?.categoryColumn || getTextFields(csvData.length > 0 ? csvData.slice(1).map(row => 
                      Object.fromEntries(
                        csvColumns.map((col, index) => [col, row[index]])
                      )
                    ) : [])[0] || csvColumns[0] || 'Category'}
                    subcategoryColumn={contributionControls[item.id]?.subcategoryColumn}
                    analysisScope={contributionControls[item.id]?.analysisScope || 'total'}
                    showOthers={contributionControls[item.id]?.showOthers ?? true}
                    sortBy={contributionControls[item.id]?.sortBy || 'contribution'}
                    sortOrder={contributionControls[item.id]?.sortOrder || 'desc'}
                    timePeriodAnalysis={contributionControls[item.id]?.timePeriodAnalysis}
                    onValueColumnChange={(column) => updateContributionControls(item.id, { valueColumn: column })}
                    onCategoryColumnChange={(column) => updateContributionControls(item.id, { categoryColumn: column })}
                    onSubcategoryColumnChange={(column) => updateContributionControls(item.id, { subcategoryColumn: column })}
                    onAnalysisScopeChange={(scope) => updateContributionControls(item.id, { analysisScope: scope })}
                    onShowOthersChange={(value) => updateContributionControls(item.id, { showOthers: value })}
                    onSortByChange={(sort) => updateContributionControls(item.id, { sortBy: sort })}
                    onSortOrderChange={(order) => updateContributionControls(item.id, { sortOrder: order })}
                    onTimePeriodAnalysisChange={(analysis) => updateContributionControls(item.id, { timePeriodAnalysis: analysis })}
                  />
                </div>
              )}

              {/* Period Variance Controls */}
              {item.result.type === 'period-variance' && (
                <div className="mb-6">
                  <PeriodVarianceControls
                    csvData={csvData.length > 0 ? csvData.slice(1).map(row => 
                      Object.fromEntries(
                        csvColumns.map((col, index) => [col, row[index]])
                      )
                    ) : []}
                    valueColumn={periodVarianceControls[item.id]?.valueColumn}
                    dateColumn={periodVarianceControls[item.id]?.dateColumn}
                    periodType={periodVarianceControls[item.id]?.periodType}
                    onValueColumnChange={(column) => updatePeriodVarianceControls(item.id, { valueColumn: column })}
                    onDateColumnChange={(column) => updatePeriodVarianceControls(item.id, { dateColumn: column })}
                    onPeriodTypeChange={(type) => updatePeriodVarianceControls(item.id, { periodType: type })}
                  />
                </div>
              )}

              {/* Trend Analysis Controls */}
              {item.result.type === 'trend-analysis' && (
                <div className="mb-6">
                  <TrendAnalysisControls
                    csvData={csvData.length > 0 ? csvData.slice(1).map(row => 
                      Object.fromEntries(
                        csvColumns.map((col, index) => [col, row[index]])
                      )
                    ) : []}
                    valueColumn={trendAnalysisControls[item.id]?.valueColumn}
                    dateColumn={trendAnalysisControls[item.id]?.dateColumn}
                    windowSize={trendAnalysisControls[item.id]?.windowSize}
                    trendType={trendAnalysisControls[item.id]?.trendType}
                    onValueColumnChange={(column) => updateTrendAnalysisControls(item.id, { valueColumn: column })}
                    onDateColumnChange={(column) => updateTrendAnalysisControls(item.id, { dateColumn: column })}
                    onWindowSizeChange={(size) => updateTrendAnalysisControls(item.id, { windowSize: size })}
                    onTrendTypeChange={(type) => updateTrendAnalysisControls(item.id, { trendType: type })}
                  />
                </div>
              )}

              {/* Top N Analysis Controls */}
              {item.result.type === 'top-n' && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value Column
                      </label>
                      <select
                        value={topNControls[item.id]?.valueColumn}
                        onChange={(e) => updateTopNControls(item.id, { valueColumn: e.target.value })}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        title="Select the column for values"
                      >
                        <option value="">Select a value column</option>
                        {getNumericFields(csvData.length > 0 ? csvData.slice(1).map(row => 
                          Object.fromEntries(
                            csvColumns.map((col, index) => [col, row[index]])
                          )
                        ) : []).map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Column
                      </label>
                      <select
                        value={topNControls[item.id]?.categoryColumn}
                        onChange={(e) => updateTopNControls(item.id, { categoryColumn: e.target.value })}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        title="Select the column for categories"
                      >
                        <option value="">Select a category column</option>
                        {getTextFields(csvData.length > 0 ? csvData.slice(1).map(row => 
                          Object.fromEntries(
                            csvColumns.map((col, index) => [col, row[index]])
                          )
                        ) : []).map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time Period
                      </label>
                      <select
                        value={topNControls[item.id]?.timePeriod || 'total'}
                        onChange={(e) => updateTopNControls(item.id, { timePeriod: e.target.value as 'total' | 'year' | 'quarter' | 'month' })}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        title="Select time period for analysis"
                      >
                        <option value="total">Total (No Time Grouping)</option>
                        <option value="year">By Year</option>
                        <option value="quarter">By Quarter</option>
                        <option value="month">By Month</option>
                      </select>
                    </div>

                    {topNControls[item.id]?.timePeriod !== 'total' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date Column
                        </label>
                        <select
                          value={topNControls[item.id]?.dateColumn}
                          onChange={(e) => updateTopNControls(item.id, { dateColumn: e.target.value })}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                          title="Select the column for dates"
                        >
                          <option value="">Select a date column</option>
                          {getDateFields(csvData.length > 0 ? csvData.slice(1).map(row => 
                            Object.fromEntries(
                              csvColumns.map((col, index) => [col, row[index]])
                            )
                          ) : []).map(field => (
                            <option key={field} value={field}>{field}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Top N
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={topNControls[item.id]?.topN || 3}
                        onChange={(e) => updateTopNControls(item.id, { topN: Math.max(1, Number(e.target.value)) })}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        title="Number of top/bottom items to display"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bottom N Items
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={topNControls[item.id]?.bottomN || 3}
                        onChange={(e) => updateTopNControls(item.id, { bottomN: Math.max(1, Number(e.target.value)) })}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                        title="Number of bottom items to display"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="text-sm text-gray-700 mb-4 border-b pb-3">
                <div className="flex justify-between items-center">
                  <span>Created: {new Date(item.result.createdAt).toLocaleDateString()}</span>
                  {item.result.metadata?.recordCount && (
                    <span className="text-blue-600 font-medium">
                      {item.result.metadata.recordCount.toLocaleString()} records
                    </span>
                  )}
                </div>
              </div>

              {/* Visualization */}
              <div 
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-64 overflow-auto"
                dangerouslySetInnerHTML={{
                  __html: item.result.type === 'budget-variance' 
                    ? generateBudgetVarianceHTML(item.id)
                    : item.result.type === 'contribution'
                    ? generateContributionHTML(item.id)
                    : item.result.type === 'period-variance'
                    ? generatePeriodVarianceHTML(item.id)
                    : item.result.type === 'trend-analysis'
                    ? generateTrendAnalysisHTML(item.id)
                    : item.result.type === 'top-n'
                    ? generateTopNHTML(item.id)
                    : item.result.htmlOutput || '<div class="text-gray-700 p-4">Visualization not available</div>'
                }}
              />
            </>
          )}
          
          {/* Collapsed state preview */}
          {isCollapsed && (
            <div className="text-sm text-gray-600 flex items-center justify-between">
              <span>Analysis collapsed</span>
              <span className="text-gray-400">
                {new Date(item.result.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
}
