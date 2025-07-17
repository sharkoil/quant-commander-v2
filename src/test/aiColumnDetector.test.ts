/**
 * Unit tests for AI Column Detector
 * Tests the intelligent column detection system with pattern matching and confidence scoring
 */

import { 
  detectColumnsWithAI, 
  convertToGlobalSettings, 
  AIColumnDetectionResult 
} from '../lib/utils/aiColumnDetector';

describe('AI Column Detector', () => {
  describe('detectColumnsWithAI', () => {
    // Test data samples
    const businessData = [
      { Date: '2024-01-01', Product: 'Widget A', Revenue: 1000, Budget: 900, Region: 'North' },
      { Date: '2024-01-02', Product: 'Widget B', Revenue: 1200, Budget: 1100, Region: 'South' },
      { Date: '2024-01-03', Product: 'Widget C', Revenue: 800, Budget: 950, Region: 'East' }
    ];

    const ecommerceData = [
      { transaction_date: '2024-01-01', item_name: 'Laptop', sales_amount: 1500, forecast_amount: 1400, category: 'Electronics' },
      { transaction_date: '2024-01-02', item_name: 'Mouse', sales_amount: 25, forecast_amount: 30, category: 'Accessories' },
      { transaction_date: '2024-01-03', item_name: 'Keyboard', sales_amount: 75, forecast_amount: 80, category: 'Accessories' }
    ];

    const financialData = [
      { period: '2024-Q1', department: 'Marketing', actual_spend: 50000, planned_spend: 48000, cost_center: 'CC001' },
      { period: '2024-Q2', department: 'Sales', actual_spend: 75000, planned_spend: 70000, cost_center: 'CC002' },
      { period: '2024-Q3', department: 'Engineering', actual_spend: 120000, planned_spend: 115000, cost_center: 'CC003' }
    ];

    it('should detect columns correctly for business data', () => {
      const result = detectColumnsWithAI(businessData);
      
      expect(result).toBeDefined();
      expect(result.primaryValue.column).toBe('Revenue');
      expect(result.secondaryValue?.column).toBe('Budget');
      expect(result.date.column).toBe('Date');
      expect(result.primaryCategory.column).toBe('Product');
      expect(result.secondaryCategory?.column).toBe('Region');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect columns correctly for e-commerce data', () => {
      const result = detectColumnsWithAI(ecommerceData);
      
      expect(result).toBeDefined();
      expect(result.primaryValue.column).toBe('sales_amount');
      expect(result.secondaryValue?.column).toBe('forecast_amount');
      expect(result.date.column).toBe('transaction_date');
      expect(result.primaryCategory.column).toBe('item_name');
      expect(result.secondaryCategory?.column).toBe('category');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect columns correctly for financial data', () => {
      const result = detectColumnsWithAI(financialData);
      
      expect(result).toBeDefined();
      expect(result.primaryValue.column).toBe('planned_spend');
      expect(result.secondaryValue?.column).toBe('actual_spend');
      expect(result.primaryCategory.column).toBe('department');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should provide confidence scores for all detections', () => {
      const result = detectColumnsWithAI(businessData);
      
      expect(result.primaryValue.confidence).toBeGreaterThan(0);
      expect(result.primaryValue.confidence).toBeLessThanOrEqual(100);
      expect(result.secondaryValue?.confidence).toBeGreaterThan(0);
      expect(result.date.confidence).toBeGreaterThan(0);
      expect(result.primaryCategory.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should provide meaningful reasons for detections', () => {
      const result = detectColumnsWithAI(businessData);
      
      expect(result.primaryValue.reason).toBeDefined();
      expect(result.primaryValue.reason).toContain('column');
      expect(result.date.reason).toBeDefined();
      expect(result.primaryCategory.reason).toBeDefined();
    });

    it('should handle data with missing columns gracefully', () => {
      const incompleteData = [
        { Value: 100, Name: 'Item1' },
        { Value: 200, Name: 'Item2' }
      ];

      const result = detectColumnsWithAI(incompleteData);
      
      expect(result).toBeDefined();
      expect(result.primaryValue.column).toBe('Value');
      expect(result.primaryCategory.column).toBe('Name');
      expect(result.date.confidence).toBeLessThan(50); // Should have low confidence for missing date
    });

    it('should provide suggestions when confidence is low', () => {
      const ambiguousData = [
        { col1: 100, col2: 'text1' },
        { col1: 200, col2: 'text2' }
      ];

      const result = detectColumnsWithAI(ambiguousData);
      
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(70);
    });

    it('should handle empty data array', () => {
      expect(() => detectColumnsWithAI([])).toThrow();
    });

    it('should handle null/undefined data', () => {
      expect(() => detectColumnsWithAI(null as any)).toThrow();
      expect(() => detectColumnsWithAI(undefined as any)).toThrow();
    });

    it('should prioritize revenue over other value columns', () => {
      const revenueData = [
        { revenue: 1000, sales: 800, cost: 200, product: 'A' },
        { revenue: 1200, sales: 900, cost: 300, product: 'B' }
      ];

      const result = detectColumnsWithAI(revenueData);
      
      expect(result.primaryValue.column).toBe('revenue');
      expect(result.primaryValue.confidence).toBeGreaterThan(50);
    });

    it('should detect transaction_date with higher confidence than generic date', () => {
      const transactionData = [
        { transaction_date: '2024-01-01', date: '2024-01-01', amount: 100 },
        { transaction_date: '2024-01-02', date: '2024-01-02', amount: 200 }
      ];

      const result = detectColumnsWithAI(transactionData);
      
      expect(result.date.column).toBe('transaction_date');
      expect(result.date.confidence).toBeGreaterThan(70);
    });
  });

  describe('convertToGlobalSettings', () => {
    it('should convert AI detection results to global settings format', () => {
      const mockDetection: AIColumnDetectionResult = {
        primaryValue: { column: 'Revenue', confidence: 80, reason: 'Revenue column detected' },
        secondaryValue: { column: 'Budget', confidence: 75, reason: 'Budget column detected' },
        date: { column: 'Date', confidence: 90, reason: 'Date column detected' },
        primaryCategory: { column: 'Product', confidence: 70, reason: 'Product column detected' },
        secondaryCategory: { column: 'Region', confidence: 65, reason: 'Region column detected' },
        confidence: 76,
        suggestions: []
      };

      const settings = convertToGlobalSettings(mockDetection);
      
      expect(settings.primaryValueColumn).toBe('Revenue');
      expect(settings.secondaryValueColumn).toBe('Budget');
      expect(settings.dateColumn).toBe('Date');
      expect(settings.primaryCategoryColumn).toBe('Product');
      expect(settings.secondaryCategoryColumn).toBe('Region');
      expect(settings.defaultTimeScale).toBe('month');
      expect(settings.defaultTopN).toBe(5);
      expect(settings.defaultConfidenceLevel).toBe(95);
      expect(settings.showPercentages).toBe(true);
      expect(settings.currencyFormat).toBe('USD');
    });

    it('should handle missing optional fields', () => {
      const mockDetection: AIColumnDetectionResult = {
        primaryValue: { column: 'Value', confidence: 60, reason: 'Value column' },
        date: { column: 'Date', confidence: 70, reason: 'Date column' },
        primaryCategory: { column: 'Category', confidence: 50, reason: 'Category column' },
        confidence: 60,
        suggestions: []
      };

      const settings = convertToGlobalSettings(mockDetection);
      
      expect(settings.primaryValueColumn).toBe('Value');
      expect(settings.secondaryValueColumn).toBeUndefined();
      expect(settings.dateColumn).toBe('Date');
      expect(settings.primaryCategoryColumn).toBe('Category');
      expect(settings.secondaryCategoryColumn).toBeUndefined();
    });
  });

  describe('Pattern Matching', () => {
    it('should recognize revenue patterns with high confidence', () => {
      const revenueData = [
        { total_sales: 1000, gross_revenue: 800, net_income: 600 },
        { total_sales: 1200, gross_revenue: 900, net_income: 700 }
      ];

      const result = detectColumnsWithAI(revenueData);
      
      expect(['total_sales', 'gross_revenue', 'net_income']).toContain(result.primaryValue.column);
      expect(result.primaryValue.confidence).toBeGreaterThan(60);
    });

    it('should recognize budget patterns', () => {
      const budgetData = [
        { planned_budget: 1000, forecast: 900, target: 800 },
        { planned_budget: 1200, forecast: 1100, target: 1000 }
      ];

      const result = detectColumnsWithAI(budgetData);
      
      expect(['planned_budget', 'forecast', 'target']).toContain(result.primaryValue.column);
      expect(result.primaryValue.confidence).toBeGreaterThan(50);
    });

    it('should recognize category patterns', () => {
      const categoryData = [
        { product_category: 'Electronics', business_unit: 'Tech', region: 'North' },
        { product_category: 'Clothing', business_unit: 'Fashion', region: 'South' }
      ];

      const result = detectColumnsWithAI(categoryData);
      
      expect(['product_category', 'business_unit', 'region']).toContain(result.primaryCategory.column);
      expect(result.primaryCategory.confidence).toBeGreaterThan(50);
    });

    it('should prefer exact keyword matches over partial matches', () => {
      const exactMatchData = [
        { revenue: 1000, revenue_total: 1100, other: 200 },
        { revenue: 1200, revenue_total: 1300, other: 300 }
      ];

      const result = detectColumnsWithAI(exactMatchData);
      
      // Should prefer 'revenue' over 'revenue_total' due to exact match
      expect(result.primaryValue.column).toBe('revenue');
      expect(result.primaryValue.confidence).toBeGreaterThan(70);
    });
  });

  describe('Content Analysis', () => {
    it('should boost confidence for numeric columns when detecting value fields', () => {
      const numericData = [
        { amount: 100.50, name: 'Item1' },
        { amount: 200.75, name: 'Item2' }
      ];

      const result = detectColumnsWithAI(numericData);
      
      expect(result.primaryValue.column).toBe('amount');
      expect(result.primaryValue.confidence).toBeGreaterThan(50);
    });

    it('should penalize non-numeric columns for value detection', () => {
      const textData = [
        { amount: 'high', description: 'Item1' },
        { amount: 'low', description: 'Item2' }
      ];

      const result = detectColumnsWithAI(textData);
      
      // Should have lower confidence since 'amount' contains text
      expect(result.primaryValue.confidence).toBeLessThan(50);
    });

    it('should boost confidence for date columns with actual date content', () => {
      const dateData = [
        { created_at: '2024-01-01', updated_at: '2024-01-02' },
        { created_at: '2024-01-03', updated_at: '2024-01-04' }
      ];

      const result = detectColumnsWithAI(dateData);
      
      expect(['created_at', 'updated_at']).toContain(result.date.column);
      expect(result.date.confidence).toBeGreaterThan(70);
    });

    it('should consider uniqueness for category detection', () => {
      const categoryData = [
        { type: 'A', id: 'unique1' },
        { type: 'B', id: 'unique2' },
        { type: 'A', id: 'unique3' }
      ];

      const result = detectColumnsWithAI(categoryData);
      
      // 'type' should be preferred over 'id' for categories due to lower cardinality
      expect(result.primaryCategory.column).toBe('type');
      expect(result.primaryCategory.confidence).toBeGreaterThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single row data', () => {
      const singleRowData = [
        { revenue: 1000, product: 'Widget', date: '2024-01-01' }
      ];

      const result = detectColumnsWithAI(singleRowData);
      
      expect(result).toBeDefined();
      expect(result.primaryValue.column).toBe('revenue');
      expect(result.primaryCategory.column).toBe('product');
      expect(result.date.column).toBe('date');
    });

    it('should handle data with null values', () => {
      const nullData = [
        { amount: 100, name: 'Item1', date: null },
        { amount: null, name: 'Item2', date: '2024-01-01' }
      ];

      const result = detectColumnsWithAI(nullData);
      
      expect(result).toBeDefined();
      expect(result.primaryValue.column).toBe('amount');
      expect(result.primaryCategory.column).toBe('name');
    });

    it('should provide low confidence when no clear patterns exist', () => {
      const ambiguousData = [
        { x: 1, y: 2, z: 3 },
        { x: 4, y: 5, z: 6 }
      ];

      const result = detectColumnsWithAI(ambiguousData);
      
      expect(result.confidence).toBeLessThan(50);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });
  });
});
