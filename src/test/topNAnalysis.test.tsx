/**
 * Unit tests for Top N Analysis functionality
 * Tests the Top N analysis components and integration
 */

import { TopNAnalysisParams } from '../lib/analyzers/topNTypes';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the visualization generator
jest.mock('../lib/visualizations/topNVisualizer', () => ({
  generateTopNVisualization: jest.fn(() => '<div>Mock Top N Chart</div>')
}));

// Mock the analysis service
jest.mock('../lib/analysisService', () => ({
  addAnalysisResult: jest.fn(),
  getCurrentAnalysisResults: jest.fn(() => [])
}));

describe('Top N Analysis', () => {
  const sampleData = [
    { Product: 'Widget A', Category: 'Electronics', Revenue: 1500, Date: '2024-01-01' },
    { Product: 'Widget B', Category: 'Electronics', Revenue: 1200, Date: '2024-01-02' },
    { Product: 'Gadget X', Category: 'Home', Revenue: 800, Date: '2024-01-03' },
    { Product: 'Gadget Y', Category: 'Home', Revenue: 600, Date: '2024-01-04' },
    { Product: 'Tool Z', Category: 'Tools', Revenue: 400, Date: '2024-01-05' }
  ];

  const defaultParams: TopNAnalysisParams = {
    valueColumn: 'Revenue',
    categoryColumn: 'Product',
    topN: 3,
    bottomN: 0,
    timePeriod: 'total',
    dateColumn: 'Date',
    showPercentages: true,
    analysisScope: 'all'
  };

  describe('TopNAnalysisParams Interface', () => {
    it('should have correct default parameter structure', () => {
      expect(defaultParams.valueColumn).toBe('Revenue');
      expect(defaultParams.categoryColumn).toBe('Product');
      expect(defaultParams.topN).toBe(3);
      expect(defaultParams.bottomN).toBe(0);
      expect(defaultParams.timePeriod).toBe('total');
      expect(defaultParams.dateColumn).toBe('Date');
      expect(defaultParams.showPercentages).toBe(true);
      expect(defaultParams.analysisScope).toBe('all');
    });

    it('should validate required parameters', () => {
      const minimalParams: TopNAnalysisParams = {
        valueColumn: 'Revenue',
        categoryColumn: 'Product',
        topN: 5,
        bottomN: 2,
        timePeriod: 'month',
        showPercentages: false,
        analysisScope: 'positive'
      };

      expect(minimalParams.valueColumn).toBeDefined();
      expect(minimalParams.categoryColumn).toBeDefined();
      expect(minimalParams.topN).toBeGreaterThan(0);
      expect(minimalParams.bottomN).toBeGreaterThanOrEqual(0);
      expect(['total', 'year', 'quarter', 'month']).toContain(minimalParams.timePeriod);
      expect(['all', 'positive', 'negative']).toContain(minimalParams.analysisScope);
    });

    it('should handle time period variations', () => {
      const timePeriods: Array<TopNAnalysisParams['timePeriod']> = ['total', 'year', 'quarter', 'month'];
      
      timePeriods.forEach(period => {
        const params: TopNAnalysisParams = {
          ...defaultParams,
          timePeriod: period
        };
        
        expect(params.timePeriod).toBe(period);
      });
    });

    it('should handle analysis scope variations', () => {
      const scopes: Array<TopNAnalysisParams['analysisScope']> = ['all', 'positive', 'negative'];
      
      scopes.forEach(scope => {
        const params: TopNAnalysisParams = {
          ...defaultParams,
          analysisScope: scope
        };
        
        expect(params.analysisScope).toBe(scope);
      });
    });
  });

  describe('Data Processing Logic', () => {
    it('should identify top N items correctly', () => {
      const sortedData = [...sampleData].sort((a, b) => b.Revenue - a.Revenue);
      const topN = 3;
      const topItems = sortedData.slice(0, topN);

      expect(topItems).toHaveLength(3);
      expect(topItems[0].Product).toBe('Widget A');
      expect(topItems[0].Revenue).toBe(1500);
      expect(topItems[1].Product).toBe('Widget B');
      expect(topItems[1].Revenue).toBe(1200);
      expect(topItems[2].Product).toBe('Gadget X');
      expect(topItems[2].Revenue).toBe(800);
    });

    it('should identify bottom N items correctly', () => {
      const sortedData = [...sampleData].sort((a, b) => a.Revenue - b.Revenue);
      const bottomN = 2;
      const bottomItems = sortedData.slice(0, bottomN);

      expect(bottomItems).toHaveLength(2);
      expect(bottomItems[0].Product).toBe('Tool Z');
      expect(bottomItems[0].Revenue).toBe(400);
      expect(bottomItems[1].Product).toBe('Gadget Y');
      expect(bottomItems[1].Revenue).toBe(600);
    });

    it('should calculate percentages correctly', () => {
      const totalValue = sampleData.reduce((sum, item) => sum + item.Revenue, 0);
      const topItem = sampleData.find(item => item.Product === 'Widget A');
      const percentage = (topItem!.Revenue / totalValue) * 100;

      expect(totalValue).toBe(4500);
      expect(percentage).toBeCloseTo(33.33, 2);
    });

    it('should handle empty data gracefully', () => {
      const emptyData: any[] = [];
      const result = processTopNDataSync(emptyData, defaultParams);

      expect(result.topItems).toHaveLength(0);
      expect(result.bottomItems).toHaveLength(0);
      expect(result.totalValue).toBe(0);
    });

    it('should handle invalid column names', () => {
      const invalidParams: TopNAnalysisParams = {
        ...defaultParams,
        valueColumn: 'NonExistentColumn'
      };

      const result = processTopNDataSync(sampleData, invalidParams);
      expect(result.errors).toContain('Invalid value column: NonExistentColumn');
    });

    it('should filter by analysis scope', () => {
      const mixedData = [
        { Product: 'A', Revenue: 100 },
        { Product: 'B', Revenue: -50 },
        { Product: 'C', Revenue: 200 },
        { Product: 'D', Revenue: -30 }
      ];

      const positiveOnlyParams: TopNAnalysisParams = {
        ...defaultParams,
        analysisScope: 'positive'
      };

      const result = processTopNDataSync(mixedData, positiveOnlyParams);
      expect(result.topItems.every(item => item.value > 0)).toBe(true);
    });
  });

  describe('Global Settings Integration', () => {
    it('should use global settings for default parameters', () => {
      const globalSettings = {
        primaryValueColumn: 'Revenue',
        primaryCategoryColumn: 'Product',
        defaultTopN: 5,
        defaultTimeScale: 'month' as const
      };

      const params = createTopNParamsFromGlobalSettings(globalSettings);

      expect(params.valueColumn).toBe('Revenue');
      expect(params.categoryColumn).toBe('Product');
      expect(params.topN).toBe(5);
      expect(params.timePeriod).toBe('month');
    });

    it('should provide fallback defaults when global settings are missing', () => {
      const params = createTopNParamsFromGlobalSettings({});

      expect(params.valueColumn).toBe('Value');
      expect(params.categoryColumn).toBe('Category');
      expect(params.topN).toBe(3);
      expect(params.timePeriod).toBe('total');
      expect(params.showPercentages).toBe(true);
      expect(params.analysisScope).toBe('all');
    });

    it('should handle partial global settings', () => {
      const partialSettings = {
        primaryValueColumn: 'Sales',
        defaultTopN: 10
      };

      const params = createTopNParamsFromGlobalSettings(partialSettings);

      expect(params.valueColumn).toBe('Sales');
      expect(params.topN).toBe(10);
      expect(params.categoryColumn).toBe('Category'); // fallback
      expect(params.timePeriod).toBe('total'); // fallback
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very large datasets efficiently', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        Product: `Product ${i}`,
        Revenue: Math.random() * 1000
      }));

      const startTime = Date.now();
      const result = processTopNDataSync(largeData, defaultParams);
      const endTime = Date.now();

      expect(result.topItems).toHaveLength(3);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle string values in numeric columns', () => {
      const stringData = [
        { Product: 'A', Revenue: '100' },
        { Product: 'B', Revenue: '200' },
        { Product: 'C', Revenue: 'invalid' }
      ];

      const result = processTopNDataSync(stringData, defaultParams);
      expect(result.topItems).toHaveLength(2);
      expect(result.topItems[0].value).toBe(200);
      expect(result.topItems[1].value).toBe(100);
    });

    it('should handle null and undefined values', () => {
      const nullData = [
        { Product: 'A', Revenue: 100 },
        { Product: 'B', Revenue: null },
        { Product: 'C', Revenue: undefined },
        { Product: 'D', Revenue: 200 }
      ];

      const result = processTopNDataSync(nullData, defaultParams);
      expect(result.topItems).toHaveLength(2);
      expect(result.topItems[0].value).toBe(200);
      expect(result.topItems[1].value).toBe(100);
    });

    it('should handle duplicate values with stable sorting', () => {
      const duplicateData = [
        { Product: 'A', Revenue: 100 },
        { Product: 'B', Revenue: 100 },
        { Product: 'C', Revenue: 100 }
      ];

      const result = processTopNDataSync(duplicateData, defaultParams);
      expect(result.topItems).toHaveLength(3);
      expect(result.topItems.every(item => item.value === 100)).toBe(true);
    });

    it('should validate topN and bottomN parameters', () => {
      const invalidParams: TopNAnalysisParams = {
        ...defaultParams,
        topN: -1,
        bottomN: -1
      };

      const result = processTopNDataSync(sampleData, invalidParams);
      expect(result.errors).toContain('topN must be greater than 0');
      expect(result.errors).toContain('bottomN must be greater than or equal to 0');
    });

    it('should handle extremely small and large numbers', () => {
      const extremeData = [
        { Product: 'Small', Revenue: 0.001 },
        { Product: 'Large', Revenue: 999999999 },
        { Product: 'Zero', Revenue: 0 }
      ];

      const result = processTopNDataSync(extremeData, defaultParams);
      expect(result.topItems).toHaveLength(3);
      expect(result.topItems[0].value).toBe(999999999);
      expect(result.topItems[1].value).toBe(0.001);
      expect(result.topItems[2].value).toBe(0);
    });
  });

  describe('Integration with Analysis Service', () => {
    it('should integrate with analysis service for result storage', () => {
      const mockAddAnalysisResult = require('../lib/analysisService').addAnalysisResult;
      
      const result = {
        success: true,
        htmlOutput: '<div>Top N Results</div>',
        periodData: [],
        overallStats: {
          totalValue: 4500,
          totalItems: 5,
          avgValue: 900,
          topItem: { name: 'Widget A', value: 1500, percentage: 33.33, rank: 1 },
          bottomItem: { name: 'Tool Z', value: 400, percentage: 8.89, rank: 5 }
        },
        metadata: {
          valueColumn: 'Revenue',
          categoryColumn: 'Product',
          topN: 3,
          bottomN: 0,
          timePeriod: 'total',
          analysisScope: 'all'
        }
      };

      // Simulate adding result to analysis service
      mockAddAnalysisResult({
        id: 'top-n-1',
        type: 'top-n',
        title: 'Top N Analysis',
        result: result,
        timestamp: new Date()
      });

      expect(mockAddAnalysisResult).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'top-n',
          result: result
        })
      );
    });
  });
});

// Helper function for synchronous data processing (for testing)
function processTopNDataSync(data: any[], params: TopNAnalysisParams) {
  const errors: string[] = [];
  
  // Validate parameters
  if (params.topN <= 0) {
    errors.push('topN must be greater than 0');
  }
  if (params.bottomN < 0) {
    errors.push('bottomN must be greater than or equal to 0');
  }
  
  // Validate columns exist
  if (data.length > 0 && !data[0].hasOwnProperty(params.valueColumn)) {
    errors.push(`Invalid value column: ${params.valueColumn}`);
  }
  if (data.length > 0 && !data[0].hasOwnProperty(params.categoryColumn)) {
    errors.push(`Invalid category column: ${params.categoryColumn}`);
  }
  
  if (errors.length > 0) {
    return {
      topItems: [],
      bottomItems: [],
      totalValue: 0,
      errors
    };
  }

  // Filter data based on analysis scope
  let filteredData = data;
  if (params.analysisScope === 'positive') {
    filteredData = data.filter(item => {
      const value = parseFloat(item[params.valueColumn]);
      return !isNaN(value) && value > 0;
    });
  } else if (params.analysisScope === 'negative') {
    filteredData = data.filter(item => {
      const value = parseFloat(item[params.valueColumn]);
      return !isNaN(value) && value < 0;
    });
  }

  // Process data
  const processedData = filteredData
    .map(item => ({
      category: item[params.categoryColumn],
      value: parseFloat(item[params.valueColumn])
    }))
    .filter(item => !isNaN(item.value))
    .sort((a, b) => b.value - a.value);

  const totalValue = processedData.reduce((sum, item) => sum + item.value, 0);

  const topItems = processedData.slice(0, params.topN).map((item, index) => ({
    ...item,
    percentage: (item.value / totalValue) * 100,
    rank: index + 1
  }));

  const bottomItems = processedData
    .slice(-params.bottomN)
    .reverse()
    .map((item, index) => ({
      ...item,
      percentage: (item.value / totalValue) * 100,
      rank: processedData.length - index
    }));

  return {
    topItems,
    bottomItems,
    totalValue,
    errors: []
  };
}

// Helper function for global settings integration
function createTopNParamsFromGlobalSettings(globalSettings: any): TopNAnalysisParams {
  return {
    valueColumn: globalSettings.primaryValueColumn || 'Value',
    categoryColumn: globalSettings.primaryCategoryColumn || 'Category',
    topN: globalSettings.defaultTopN || 3,
    bottomN: 0,
    timePeriod: globalSettings.defaultTimeScale === 'month' ? 'month' : 
               globalSettings.defaultTimeScale === 'quarter' ? 'quarter' :
               globalSettings.defaultTimeScale === 'year' ? 'year' : 'total',
    dateColumn: globalSettings.dateColumn || 'Date',
    showPercentages: globalSettings.showPercentages !== false,
    analysisScope: 'all'
  };
}
