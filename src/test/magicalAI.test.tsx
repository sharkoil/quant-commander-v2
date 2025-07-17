/**
 * Test suite for the magical AI experience components
 * Tests both AIColumnInsights and SmartColumnSelector components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIColumnInsights } from '../components/AIColumnInsights';
import { SmartColumnSelector } from '../components/SmartColumnSelector';

// Mock data for testing
const mockCsvData = [
  {
    'Revenue': 15000,
    'Product Category': 'Electronics',
    'Date': '2024-01-15',
    'Budget': 12000,
    'Actual Sales': 15000
  },
  {
    'Revenue': 22000,
    'Product Category': 'Clothing',
    'Date': '2024-01-16',
    'Budget': 18000,
    'Actual Sales': 22000
  },
  {
    'Revenue': 8500,
    'Product Category': 'Books',
    'Date': '2024-01-17',
    'Budget': 10000,
    'Actual Sales': 8500
  }
];

const mockCsvColumns = ['Revenue', 'Product Category', 'Date', 'Budget', 'Actual Sales'];

describe('AIColumnInsights Component', () => {
  const mockOnColumnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with magical AI thinking animation', () => {
    render(
      <AIColumnInsights
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        onColumnSelect={mockOnColumnSelect}
      />
    );

    expect(screen.getByText('🧠 AI Column Detective')).toBeInTheDocument();
    expect(screen.getByText('Let me analyze your data structure...')).toBeInTheDocument();
  });

  test('shows AI thinking process when analyze button is clicked', async () => {
    render(
      <AIColumnInsights
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        onColumnSelect={mockOnColumnSelect}
      />
    );

    const analyzeButton = screen.getByText('🔍 Analyze My Data');
    fireEvent.click(analyzeButton);

    // Should show thinking animation
    await waitFor(() => {
      expect(screen.getByText('🧠 AI is thinking...')).toBeInTheDocument();
    });
  });

  test('generates column insights with confidence scores', async () => {
    render(
      <AIColumnInsights
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        onColumnSelect={mockOnColumnSelect}
      />
    );

    const analyzeButton = screen.getByText('🔍 Analyze My Data');
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(
      () => {
        expect(screen.getByText('🎯 AI Insights & Recommendations')).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    // Should show confidence scores
    const confidenceElements = screen.getAllByText(/%/);
    expect(confidenceElements.length).toBeGreaterThan(0);
  });

  test('handles column selection callbacks', async () => {
    render(
      <AIColumnInsights
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        onColumnSelect={mockOnColumnSelect}
      />
    );

    const analyzeButton = screen.getByText('🔍 Analyze My Data');
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(
      () => {
        expect(screen.getByText('🎯 AI Insights & Recommendations')).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    // Click on a "Use This" button
    const useButtons = screen.getAllByText('Use This');
    if (useButtons.length > 0) {
      fireEvent.click(useButtons[0]);
      expect(mockOnColumnSelect).toHaveBeenCalled();
    }
  });

  test('shows alternative column suggestions', async () => {
    render(
      <AIColumnInsights
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        onColumnSelect={mockOnColumnSelect}
      />
    );

    const analyzeButton = screen.getByText('🔍 Analyze My Data');
    fireEvent.click(analyzeButton);

    // Wait for analysis to complete
    await waitFor(
      () => {
        expect(screen.getByText('🎯 AI Insights & Recommendations')).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    // Should show alternative suggestions
    const alternativeElements = screen.getAllByText(/Alternative:/);
    expect(alternativeElements.length).toBeGreaterThan(0);
  });
});

describe('SmartColumnSelector Component', () => {
  const mockOnColumnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with smart column suggestions', () => {
    render(
      <SmartColumnSelector
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        selectedColumns={{}}
        onColumnChange={mockOnColumnChange}
      />
    );

    expect(screen.getByText('🧠 Smart Column Detection')).toBeInTheDocument();
    expect(screen.getByText('AI-powered column detection with intelligent recommendations')).toBeInTheDocument();
  });

  test('shows different column types with icons', () => {
    render(
      <SmartColumnSelector
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        selectedColumns={{}}
        onColumnChange={mockOnColumnChange}
      />
    );

    expect(screen.getByText('💰')).toBeInTheDocument(); // Value column icon
    expect(screen.getByText('📊')).toBeInTheDocument(); // Category column icon
    expect(screen.getByText('📅')).toBeInTheDocument(); // Date column icon
    expect(screen.getByText('🎯')).toBeInTheDocument(); // Budget column icon
    expect(screen.getByText('📈')).toBeInTheDocument(); // Actual column icon
  });

  test('expands column selector on click', () => {
    render(
      <SmartColumnSelector
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        selectedColumns={{}}
        onColumnChange={mockOnColumnChange}
      />
    );

    const valueColumnSection = screen.getByText('Value Column').closest('div');
    fireEvent.click(valueColumnSection!);

    // Should show AI recommendations
    expect(screen.getByText('✨ AI Recommendations:')).toBeInTheDocument();
  });

  test('handles column selection with confidence scores', () => {
    render(
      <SmartColumnSelector
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        selectedColumns={{}}
        onColumnChange={mockOnColumnChange}
      />
    );

    const valueColumnSection = screen.getByText('Value Column').closest('div');
    fireEvent.click(valueColumnSection!);

    // Wait for suggestions to appear
    waitFor(() => {
      const suggestionElements = screen.getAllByText(/Revenue/);
      if (suggestionElements.length > 0) {
        fireEvent.click(suggestionElements[0]);
        expect(mockOnColumnChange).toHaveBeenCalledWith('value', 'Revenue');
      }
    });
  });

  test('shows confidence badges for suggestions', () => {
    render(
      <SmartColumnSelector
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        selectedColumns={{}}
        onColumnChange={mockOnColumnChange}
      />
    );

    const valueColumnSection = screen.getByText('Value Column').closest('div');
    fireEvent.click(valueColumnSection!);

    // Should show confidence percentages
    waitFor(() => {
      const confidenceElements = screen.getAllByText(/%/);
      expect(confidenceElements.length).toBeGreaterThan(0);
    });
  });

  test('highlights top pick suggestions', () => {
    render(
      <SmartColumnSelector
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        selectedColumns={{}}
        onColumnChange={mockOnColumnChange}
      />
    );

    const valueColumnSection = screen.getByText('Value Column').closest('div');
    fireEvent.click(valueColumnSection!);

    // Should show top pick badges
    waitFor(() => {
      const topPickElements = screen.getAllByText('⭐ Top Pick');
      expect(topPickElements.length).toBeGreaterThan(0);
    });
  });

  test('displays reasoning for each suggestion', () => {
    render(
      <SmartColumnSelector
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        selectedColumns={{}}
        onColumnChange={mockOnColumnChange}
      />
    );

    const categoryColumnSection = screen.getByText('Category Column').closest('div');
    fireEvent.click(categoryColumnSection!);

    // Should show reasoning text
    waitFor(() => {
      const reasoningText = screen.getByText(/Contains keyword/);
      expect(reasoningText).toBeInTheDocument();
    });
  });

  test('shows pro tip section', () => {
    render(
      <SmartColumnSelector
        csvData={mockCsvData}
        csvColumns={mockCsvColumns}
        selectedColumns={{}}
        onColumnChange={mockOnColumnChange}
      />
    );

    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('Pro Tip:')).toBeInTheDocument();
    expect(screen.getByText(/Click on any column type to see AI recommendations/)).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  test('components work together in magical AI experience', async () => {
    const mockOnColumnSelect = jest.fn();
    const mockOnColumnChange = jest.fn();

    const { rerender } = render(
      <div>
        <AIColumnInsights
          csvData={mockCsvData}
          csvColumns={mockCsvColumns}
          onColumnSelect={mockOnColumnSelect}
        />
        <SmartColumnSelector
          csvData={mockCsvData}
          csvColumns={mockCsvColumns}
          selectedColumns={{}}
          onColumnChange={mockOnColumnChange}
        />
      </div>
    );

    // Both components should be present
    expect(screen.getByText('🧠 AI Column Detective')).toBeInTheDocument();
    expect(screen.getByText('🧠 Smart Column Detection')).toBeInTheDocument();

    // Test AI insights analysis
    const analyzeButton = screen.getByText('🔍 Analyze My Data');
    fireEvent.click(analyzeButton);

    await waitFor(
      () => {
        expect(screen.getByText('🎯 AI Insights & Recommendations')).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    // Test smart selector interaction
    const valueColumnSection = screen.getByText('Value Column').closest('div');
    fireEvent.click(valueColumnSection!);

    await waitFor(() => {
      expect(screen.getByText('✨ AI Recommendations:')).toBeInTheDocument();
    });

    // Both components should provide complementary functionality
    expect(screen.getByText('🎯 AI Insights & Recommendations')).toBeInTheDocument();
    expect(screen.getByText('✨ AI Recommendations:')).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    const mockOnColumnSelect = jest.fn();
    const mockOnColumnChange = jest.fn();

    render(
      <div>
        <AIColumnInsights
          csvData={[]}
          csvColumns={[]}
          onColumnSelect={mockOnColumnSelect}
        />
        <SmartColumnSelector
          csvData={[]}
          csvColumns={[]}
          selectedColumns={{}}
          onColumnChange={mockOnColumnChange}
        />
      </div>
    );

    // Should handle empty data without errors
    expect(screen.getByText('🧠 AI Column Detective')).toBeInTheDocument();
    expect(screen.getByText('🧠 Smart Column Detection')).toBeInTheDocument();
  });
});
