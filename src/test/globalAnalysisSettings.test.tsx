/**
 * Unit tests for GlobalAnalysisSettings component
 * Tests the React component for centralized column mapping and preferences
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalAnalysisSettings, GlobalAnalysisSettings as GlobalAnalysisSettingsType } from '../components/GlobalAnalysisSettings';
import type { AIColumnDetectionResult } from '../lib/utils/aiColumnDetector';

// Mock the AI detector
jest.mock('../lib/utils/aiColumnDetector', () => ({
  detectColumnsWithAI: jest.fn(),
  convertToGlobalSettings: jest.fn()
}));

// Mock the field analyzer
jest.mock('../lib/utils/csvFieldAnalyzer', () => ({
  getNumericFields: jest.fn(),
  getDateFields: jest.fn(),
  getTextFields: jest.fn()
}));

const mockDetectColumnsWithAI = require('../lib/utils/aiColumnDetector').detectColumnsWithAI as jest.Mock;
const mockConvertToGlobalSettings = require('../lib/utils/aiColumnDetector').convertToGlobalSettings as jest.Mock;

describe('GlobalAnalysisSettings Component', () => {
  const mockCsvData = [
    { Date: '2024-01-01', Product: 'Widget A', Revenue: 1000, Budget: 900, Region: 'North' },
    { Date: '2024-01-02', Product: 'Widget B', Revenue: 1200, Budget: 1100, Region: 'South' }
  ];

  const defaultSettings: GlobalAnalysisSettingsType = {
    primaryValueColumn: 'Revenue',
    secondaryValueColumn: 'Budget',
    dateColumn: 'Date',
    primaryCategoryColumn: 'Product',
    secondaryCategoryColumn: 'Region',
    defaultTimeScale: 'month',
    defaultTopN: 5,
    defaultConfidenceLevel: 95,
    showPercentages: true,
    currencyFormat: 'USD'
  };

  const mockOnSettingsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock field analyzer functions
    const { getNumericFields, getDateFields, getTextFields } = require('../lib/utils/csvFieldAnalyzer');
    (getNumericFields as jest.Mock).mockReturnValue(['Revenue', 'Budget']);
    (getDateFields as jest.Mock).mockReturnValue(['Date']);
    (getTextFields as jest.Mock).mockReturnValue(['Product', 'Region']);
  });

  describe('Component Rendering', () => {
    it('should render all form fields correctly', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      expect(screen.getByText('🌐 Global Analysis Settings')).toBeInTheDocument();
      expect(screen.getByText('💰 Primary Value Column')).toBeInTheDocument();
      expect(screen.getByText('📊 Secondary Value Column')).toBeInTheDocument();
      expect(screen.getByText('📅 Date Column')).toBeInTheDocument();
      expect(screen.getByText('🏷️ Primary Category Column')).toBeInTheDocument();
      expect(screen.getByText('⏰ Default Time Scale')).toBeInTheDocument();
      expect(screen.getByText('🔝 Default Top N')).toBeInTheDocument();
      expect(screen.getByText('🎯 Confidence Level (%)')).toBeInTheDocument();
      expect(screen.getByText('📊 Display Options')).toBeInTheDocument();
    });

    it('should display current settings values', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      expect(screen.getByDisplayValue('Revenue')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Budget')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Date')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('month')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('95')).toBeInTheDocument();
    });

    it('should show current configuration summary', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      expect(screen.getByText('📋 Current Configuration')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Budget')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('month')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      expect(screen.getByText('🤖 AI Auto-Detect')).toBeInTheDocument();
      expect(screen.getByText('🔄 Simple Auto-Detect')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onSettingsChange when primary value column changes', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const primaryValueSelect = screen.getByLabelText('💰 Primary Value Column');
      fireEvent.change(primaryValueSelect, { target: { value: 'Budget' } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        primaryValueColumn: 'Budget'
      });
    });

    it('should call onSettingsChange when secondary value column changes', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const secondaryValueSelect = screen.getByLabelText('📊 Secondary Value Column');
      fireEvent.change(secondaryValueSelect, { target: { value: 'Revenue' } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        secondaryValueColumn: 'Revenue'
      });
    });

    it('should handle secondary value column being set to none', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const secondaryValueSelect = screen.getByLabelText('📊 Secondary Value Column');
      fireEvent.change(secondaryValueSelect, { target: { value: '' } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        secondaryValueColumn: undefined
      });
    });

    it('should call onSettingsChange when date column changes', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const dateSelect = screen.getByLabelText('📅 Date Column');
      fireEvent.change(dateSelect, { target: { value: 'Date' } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        dateColumn: 'Date'
      });
    });

    it('should call onSettingsChange when primary category column changes', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const categorySelect = screen.getByLabelText('🏷️ Primary Category Column');
      fireEvent.change(categorySelect, { target: { value: 'Region' } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        primaryCategoryColumn: 'Region'
      });
    });

    it('should call onSettingsChange when time scale changes', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const timeScaleSelect = screen.getByLabelText('⏰ Default Time Scale');
      fireEvent.change(timeScaleSelect, { target: { value: 'quarter' } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        defaultTimeScale: 'quarter'
      });
    });

    it('should call onSettingsChange when top N changes', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const topNInput = screen.getByLabelText('🔝 Default Top N');
      fireEvent.change(topNInput, { target: { value: '10' } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        defaultTopN: 10
      });
    });

    it('should call onSettingsChange when confidence level changes', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const confidenceSelect = screen.getByLabelText('🎯 Confidence Level (%)');
      fireEvent.change(confidenceSelect, { target: { value: '90' } });

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        defaultConfidenceLevel: 90
      });
    });

    it('should call onSettingsChange when show percentages checkbox changes', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const showPercentagesCheckbox = screen.getByLabelText('Show percentages');
      fireEvent.click(showPercentagesCheckbox);

      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        showPercentages: false
      });
    });
  });

  describe('Simple Auto-Detect', () => {
    it('should trigger simple auto-detect when button is clicked', () => {
      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const simpleAutoDetectButton = screen.getByText('🔄 Simple Auto-Detect');
      fireEvent.click(simpleAutoDetectButton);

      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultTimeScale: 'month',
          defaultTopN: 5,
          defaultConfidenceLevel: 95,
          showPercentages: true,
          currencyFormat: 'USD'
        })
      );
    });

    it('should detect revenue column as primary value', () => {
      const { getNumericFields } = require('../lib/utils/csvFieldAnalyzer');
      (getNumericFields as jest.Mock).mockReturnValue(['Revenue', 'Budget', 'Cost']);

      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const simpleAutoDetectButton = screen.getByText('🔄 Simple Auto-Detect');
      fireEvent.click(simpleAutoDetectButton);

      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryValueColumn: 'Revenue'
        })
      );
    });

    it('should detect budget column as secondary value', () => {
      const { getNumericFields } = require('../lib/utils/csvFieldAnalyzer');
      (getNumericFields as jest.Mock).mockReturnValue(['Revenue', 'Budget', 'Forecast']);

      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const simpleAutoDetectButton = screen.getByText('🔄 Simple Auto-Detect');
      fireEvent.click(simpleAutoDetectButton);

      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          secondaryValueColumn: 'Budget'
        })
      );
    });
  });

  describe('AI Auto-Detect', () => {
    it('should show loading state when AI detection is running', async () => {
      mockDetectColumnsWithAI.mockImplementation(() => 
        new Promise<AIColumnDetectionResult>(resolve => {
          setTimeout(() => resolve({
            primaryValue: { column: 'Revenue', confidence: 80, reason: 'Revenue detected' },
            date: { column: 'Date', confidence: 90, reason: 'Date detected' },
            primaryCategory: { column: 'Product', confidence: 70, reason: 'Product detected' },
            confidence: 80,
            suggestions: []
          }), 100);
        })
      );

      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const aiDetectButton = screen.getByText('🤖 AI Auto-Detect');
      fireEvent.click(aiDetectButton);

      expect(screen.getByText('🤖 AI Detecting...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ai detecting/i })).toBeDisabled();
    });

    it('should call detectColumnsWithAI when AI button is clicked', async () => {
      const mockAIResult = {
        primaryValue: { column: 'Revenue', confidence: 80, reason: 'Revenue detected' },
        secondaryValue: { column: 'Budget', confidence: 75, reason: 'Budget detected' },
        date: { column: 'Date', confidence: 90, reason: 'Date detected' },
        primaryCategory: { column: 'Product', confidence: 70, reason: 'Product detected' },
        confidence: 79,
        suggestions: []
      };

      mockDetectColumnsWithAI.mockResolvedValue(mockAIResult);
      mockConvertToGlobalSettings.mockReturnValue({
        primaryValueColumn: 'Revenue',
        secondaryValueColumn: 'Budget',
        dateColumn: 'Date',
        primaryCategoryColumn: 'Product',
        defaultTimeScale: 'month',
        defaultTopN: 5,
        defaultConfidenceLevel: 95,
        showPercentages: true,
        currencyFormat: 'USD'
      });

      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const aiDetectButton = screen.getByText('🤖 AI Auto-Detect');
      fireEvent.click(aiDetectButton);

      await waitFor(() => {
        expect(mockDetectColumnsWithAI).toHaveBeenCalledWith(mockCsvData);
      });
    });

    it('should display AI detection results', async () => {
      const mockAIResult = {
        primaryValue: { column: 'Revenue', confidence: 80, reason: 'Revenue column detected' },
        secondaryValue: { column: 'Budget', confidence: 75, reason: 'Budget column detected' },
        date: { column: 'Date', confidence: 90, reason: 'Date column detected' },
        primaryCategory: { column: 'Product', confidence: 70, reason: 'Product column detected' },
        confidence: 79,
        suggestions: ['Consider reviewing column mappings']
      };

      mockDetectColumnsWithAI.mockResolvedValue(mockAIResult);
      mockConvertToGlobalSettings.mockReturnValue(defaultSettings);

      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const aiDetectButton = screen.getByText('🤖 AI Auto-Detect');
      fireEvent.click(aiDetectButton);

      await waitFor(() => {
        expect(screen.getByText('🤖 AI Detection Results')).toBeInTheDocument();
        expect(screen.getByText('79% confidence')).toBeInTheDocument();
        expect(screen.getByText('Revenue column detected')).toBeInTheDocument();
        expect(screen.getByText('Budget column detected')).toBeInTheDocument();
        expect(screen.getByText('💡 Suggestions:')).toBeInTheDocument();
      });
    });

    it('should handle AI detection errors gracefully', async () => {
      mockDetectColumnsWithAI.mockRejectedValue(new Error('AI detection failed'));

      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const aiDetectButton = screen.getByText('🤖 AI Auto-Detect');
      fireEvent.click(aiDetectButton);

      await waitFor(() => {
        expect(mockOnSettingsChange).toHaveBeenCalled();
      });

      // Should still call onSettingsChange with fallback values
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryValueColumn: 'Value',
          primaryCategoryColumn: 'Category',
          dateColumn: 'Date',
          defaultAnalysisScope: 'all',
          defaultTimeScale: 'month',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          showPercentages: true,
          precision: 2,
          theme: 'light'
        })
      );
    });
      expect(mockOnSettingsChange).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultTimeScale: 'month',
          defaultTopN: 5,
          defaultConfidenceLevel: 95,
          showPercentages: true,
          currencyFormat: 'USD'
        })
      );
    });

    it('should allow dismissing AI detection results', async () => {
      const mockAIResult = {
        primaryValue: { column: 'Revenue', confidence: 80, reason: 'Revenue detected' },
        date: { column: 'Date', confidence: 90, reason: 'Date detected' },
        primaryCategory: { column: 'Product', confidence: 70, reason: 'Product detected' },
        confidence: 80,
        suggestions: []
      };

      mockDetectColumnsWithAI.mockResolvedValue(mockAIResult);
      mockConvertToGlobalSettings.mockReturnValue(defaultSettings);

      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const aiDetectButton = screen.getByText('🤖 AI Auto-Detect');
      fireEvent.click(aiDetectButton);

      await waitFor(() => {
        const dismissButton = screen.getByText('✕');
        fireEvent.click(dismissButton);

        expect(screen.queryByText('🤖 AI Detection Results')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty CSV data', () => {
      const { getNumericFields, getDateFields, getTextFields } = require('../lib/utils/csvFieldAnalyzer');
      (getNumericFields as jest.Mock).mockReturnValue([]);
      (getDateFields as jest.Mock).mockReturnValue([]);
      (getTextFields as jest.Mock).mockReturnValue([]);

      render(
        <GlobalAnalysisSettings
          csvData={[]}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      expect(screen.getByText('🌐 Global Analysis Settings')).toBeInTheDocument();
    });

    it('should handle settings with undefined optional fields', () => {
      const settingsWithUndefined: GlobalAnalysisSettingsType = {
        primaryValueColumn: 'Revenue',
        secondaryValueColumn: undefined,
        dateColumn: 'Date',
        primaryCategoryColumn: 'Product',
        secondaryCategoryColumn: undefined,
        defaultTimeScale: 'month',
        defaultTopN: 5,
        defaultConfidenceLevel: 95,
        showPercentages: true,
        currencyFormat: 'USD'
      };

      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={settingsWithUndefined}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      expect(screen.getByText('None')).toBeInTheDocument(); // Secondary value should show "None"
    });

    it('should display high confidence with green badge', async () => {
      const highConfidenceResult = {
        primaryValue: { column: 'Revenue', confidence: 95, reason: 'High confidence' },
        date: { column: 'Date', confidence: 90, reason: 'Date detected' },
        primaryCategory: { column: 'Product', confidence: 85, reason: 'Product detected' },
        confidence: 90,
        suggestions: []
      };

      mockDetectColumnsWithAI.mockResolvedValue(highConfidenceResult);
      mockConvertToGlobalSettings.mockReturnValue(defaultSettings);

      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const aiDetectButton = screen.getByText('🤖 AI Auto-Detect');
      fireEvent.click(aiDetectButton);

      await waitFor(() => {
        const confidenceBadge = screen.getByText('90% confidence');
        expect(confidenceBadge).toBeInTheDocument();
        expect(confidenceBadge.className).toContain('bg-green-100');
      });
    });

    it('should display medium confidence with yellow badge', async () => {
      const mediumConfidenceResult = {
        primaryValue: { column: 'Revenue', confidence: 70, reason: 'Medium confidence' },
        date: { column: 'Date', confidence: 65, reason: 'Date detected' },
        primaryCategory: { column: 'Product', confidence: 60, reason: 'Product detected' },
        confidence: 65,
        suggestions: []
      };

      mockDetectColumnsWithAI.mockResolvedValue(mediumConfidenceResult);
      mockConvertToGlobalSettings.mockReturnValue(defaultSettings);

      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const aiDetectButton = screen.getByText('🤖 AI Auto-Detect');
      fireEvent.click(aiDetectButton);

      await waitFor(() => {
        const confidenceBadge = screen.getByText('65% confidence');
        expect(confidenceBadge).toBeInTheDocument();
        expect(confidenceBadge.className).toContain('bg-yellow-100');
      });
    });

    it('should display low confidence with red badge', async () => {
      const lowConfidenceResult = {
        primaryValue: { column: 'Revenue', confidence: 40, reason: 'Low confidence' },
        date: { column: 'Date', confidence: 30, reason: 'Date detected' },
        primaryCategory: { column: 'Product', confidence: 35, reason: 'Product detected' },
        confidence: 35,
        suggestions: ['Consider manual review']
      };

      mockDetectColumnsWithAI.mockResolvedValue(lowConfidenceResult);
      mockConvertToGlobalSettings.mockReturnValue(defaultSettings);

      render(
        <GlobalAnalysisSettings
          csvData={mockCsvData}
          settings={defaultSettings}
          onSettingsChange={mockOnSettingsChange}
        />
      );

      const aiDetectButton = screen.getByText('🤖 AI Auto-Detect');
      fireEvent.click(aiDetectButton);

      await waitFor(() => {
        const confidenceBadge = screen.getByText('35% confidence');
        expect(confidenceBadge).toBeInTheDocument();
        expect(confidenceBadge.className).toContain('bg-red-100');
      });
    });
  });
});
