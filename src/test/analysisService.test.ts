/**
 * Unit tests for Analysis Service
 * Tests all functions related to analysis data management and filtering
 */

import {
  getAnalysisTypes,
  getAnalysisTypeConfig,
  getMockAnalysisResults,
  getAnalysisResultsAsDraggableItems,
  filterAnalysisResults,
  sortAnalysisResults
} from '../lib/analysisService';
import { AnalysisType, AnalysisFilters, AnalysisResult, AnalysisTypeConfig, DraggableAnalysisItem } from '../types/analysis';

describe('Analysis Service', () => {
  describe('getAnalysisTypes', () => {
    it('should return all analysis type configurations', () => {
      const types = getAnalysisTypes();
      
      expect(types).toHaveLength(5);
      expect(types.map((t: AnalysisTypeConfig) => t.type)).toEqual([
        'period-variance',
        'budget-variance',
        'trend-analysis',
        'contribution',
        'column-intelligence'
      ]);
      
      // Verify each type has required properties
      types.forEach((type: AnalysisTypeConfig) => {
        expect(type).toHaveProperty('type');
        expect(type).toHaveProperty('icon');
        expect(type).toHaveProperty('name');
        expect(type).toHaveProperty('color');
        expect(type).toHaveProperty('description');
      });
    });
  });

  describe('getAnalysisTypeConfig', () => {
    it('should return correct config for valid type', () => {
      const config = getAnalysisTypeConfig('period-variance');
      
      expect(config).toBeDefined();
      expect(config?.type).toBe('period-variance');
      expect(config?.name).toBe('Period Variance');
      expect(config?.icon).toBe('📊');
    });

    it('should return undefined for invalid type', () => {
      const config = getAnalysisTypeConfig('invalid-type' as AnalysisType);
      expect(config).toBeUndefined();
    });
  });

  describe('getMockAnalysisResults', () => {
    it('should return mock analysis results', () => {
      const results = getMockAnalysisResults();
      
      expect(results).toHaveLength(5);
      
      // Verify structure of first result
      const firstResult = results[0];
      expect(firstResult).toHaveProperty('id');
      expect(firstResult).toHaveProperty('type');
      expect(firstResult).toHaveProperty('title');
      expect(firstResult).toHaveProperty('createdAt');
      expect(firstResult).toHaveProperty('htmlOutput');
      expect(firstResult).toHaveProperty('metadata');
      expect(firstResult).toHaveProperty('parameters');
      expect(firstResult).toHaveProperty('status');
      
      // Verify metadata structure
      expect(firstResult.metadata).toHaveProperty('datasetName');
      expect(firstResult.metadata).toHaveProperty('recordCount');
      expect(firstResult.metadata).toHaveProperty('processingTime');
      expect(firstResult.metadata).toHaveProperty('columns');
      expect(firstResult.metadata).toHaveProperty('insights');
      
      // Verify types are correct
      expect(typeof firstResult.id).toBe('string');
      expect(firstResult.createdAt instanceof Date).toBe(true);
      expect(typeof firstResult.htmlOutput).toBe('string');
      expect(Array.isArray(firstResult.metadata.columns)).toBe(true);
      expect(Array.isArray(firstResult.metadata.insights)).toBe(true);
    });

    it('should include all analysis types', () => {
      const results = getMockAnalysisResults();
      const types = results.map((r: AnalysisResult) => r.type);
      
      expect(types).toContain('period-variance');
      expect(types).toContain('budget-variance');
      expect(types).toContain('trend-analysis');
      expect(types).toContain('contribution');
      expect(types).toContain('column-intelligence');
    });
  });

  describe('getAnalysisResultsAsDraggableItems', () => {
    it('should convert results to draggable items', () => {
      const items = getAnalysisResultsAsDraggableItems();
      
      expect(items).toHaveLength(5);
      
      // Verify structure
      items.forEach((item: DraggableAnalysisItem, index: number) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('order');
        expect(item).toHaveProperty('isPinned');
        expect(item).toHaveProperty('result');
        expect(item.order).toBe(index);
      });
      
      // First two items should be pinned by default
      expect(items[0].isPinned).toBe(true);
      expect(items[1].isPinned).toBe(true);
      expect(items[2].isPinned).toBe(false);
    });
  });

  describe('filterAnalysisResults', () => {
    const mockResults = getMockAnalysisResults();

    it('should filter by type', () => {
      const filters: AnalysisFilters = { type: 'period-variance' };
      const filtered = filterAnalysisResults(mockResults, filters);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('period-variance');
    });

    it('should filter by search query in title', () => {
      const filters: AnalysisFilters = { searchQuery: 'sales' };
      const filtered = filterAnalysisResults(mockResults, filters);
      
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((result: AnalysisResult) => {
        expect(
          result.title.toLowerCase().includes('sales') ||
          result.metadata.datasetName.toLowerCase().includes('sales') ||
          result.metadata.insights.some((insight: string) => insight.toLowerCase().includes('sales'))
        ).toBe(true);
      });
    });

    it('should filter by search query in dataset name', () => {
      const filters: AnalysisFilters = { searchQuery: 'marketing' };
      const filtered = filterAnalysisResults(mockResults, filters);
      
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((result: AnalysisResult) => {
        expect(
          result.title.toLowerCase().includes('marketing') ||
          result.metadata.datasetName.toLowerCase().includes('marketing') ||
          result.metadata.insights.some((insight: string) => insight.toLowerCase().includes('marketing'))
        ).toBe(true);
      });
    });

    it('should filter by date range', () => {
      const filters: AnalysisFilters = {
        dateRange: {
          start: new Date('2024-01-12'),
          end: new Date('2024-01-15')
        }
      };
      const filtered = filterAnalysisResults(mockResults, filters);
      
      filtered.forEach((result: AnalysisResult) => {
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(filters.dateRange!.start.getTime());
        expect(result.createdAt.getTime()).toBeLessThanOrEqual(filters.dateRange!.end.getTime());
      });
    });

    it('should handle multiple filters', () => {
      const filters: AnalysisFilters = {
        type: 'contribution',
        searchQuery: 'products'
      };
      const filtered = filterAnalysisResults(mockResults, filters);
      
      filtered.forEach((result: AnalysisResult) => {
        expect(result.type).toBe('contribution');
        expect(
          result.title.toLowerCase().includes('products') ||
          result.metadata.datasetName.toLowerCase().includes('products') ||
          result.metadata.insights.some((insight: string) => insight.toLowerCase().includes('products'))
        ).toBe(true);
      });
    });

    it('should return all results when no filters', () => {
      const filtered = filterAnalysisResults(mockResults, {});
      expect(filtered).toHaveLength(mockResults.length);
    });
  });

  describe('sortAnalysisResults', () => {
    const mockResults = getMockAnalysisResults();

    it('should sort by date (newest first) by default', () => {
      const sorted = sortAnalysisResults(mockResults);
      
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          sorted[i + 1].createdAt.getTime()
        );
      }
    });

    it('should sort by date when specified', () => {
      const sorted = sortAnalysisResults(mockResults, 'date');
      
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          sorted[i + 1].createdAt.getTime()
        );
      }
    });

    it('should sort by title alphabetically', () => {
      const sorted = sortAnalysisResults(mockResults, 'title');
      
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].title.localeCompare(sorted[i + 1].title)).toBeLessThanOrEqual(0);
      }
    });

    it('should sort by type alphabetically', () => {
      const sorted = sortAnalysisResults(mockResults, 'type');
      
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].type.localeCompare(sorted[i + 1].type)).toBeLessThanOrEqual(0);
      }
    });

    it('should not mutate original array', () => {
      const originalOrder = [...mockResults];
      const sorted = sortAnalysisResults(mockResults, 'title');
      
      expect(mockResults).toEqual(originalOrder);
      expect(sorted).not.toEqual(originalOrder);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now();
      
      // Generate large mock dataset
      const largeResults = Array.from({ length: 1000 }, (_, i) => ({
        ...getMockAnalysisResults()[0],
        id: `analysis-${i}`,
        title: `Analysis ${i}`,
        createdAt: new Date(Date.now() - i * 1000)
      }));
      
      // Test filtering
      const filtered = filterAnalysisResults(largeResults, { searchQuery: 'Analysis 1' });
      
      // Test sorting
      const sorted = sortAnalysisResults(filtered, 'date');
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete within reasonable time (less than 100ms)
      expect(executionTime).toBeLessThan(100);
      expect(sorted.length).toBeGreaterThan(0);
    });
  });
});
