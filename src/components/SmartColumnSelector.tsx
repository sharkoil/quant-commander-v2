/**
 * Smart Column Selector Component
 * Replaces traditional dropdowns with an intelligent, AI-powered column selection experience
 * Features visual column recommendations, one-click selections, and magical AI insights
 */

import React, { useState, useEffect } from 'react';

interface SmartColumnSelectorProps {
  csvColumns: string[];
  selectedColumns: Record<string, string>;
  onColumnChange: (type: string, column: string) => void;
  csvData: unknown[];
  title?: string;
}

interface ColumnSuggestion {
  column: string;
  confidence: number;
  type: 'primary' | 'secondary' | 'alternative';
  reasoning: string;
}

export const SmartColumnSelector: React.FC<SmartColumnSelectorProps> = ({
  csvColumns,
  selectedColumns,
  onColumnChange,
  csvData,
  title = "Smart Column Selection"
}) => {
  const [suggestions, setSuggestions] = useState<Record<string, ColumnSuggestion[]>>({});
  const [showingType, setShowingType] = useState<string | null>(null);
  const [magicalReveal, setMagicalReveal] = useState(false);

  useEffect(() => {
    if (csvColumns.length > 0) {
      generateSmartSuggestions();
    }
  }, [csvColumns, csvData]);

  const generateSmartSuggestions = () => {
    const newSuggestions: Record<string, ColumnSuggestion[]> = {};
    
    const columnTypes = [
      { key: 'value', label: 'Value Column', icon: '💰', color: 'green' },
      { key: 'category', label: 'Category Column', icon: '📊', color: 'blue' },
      { key: 'date', label: 'Date Column', icon: '📅', color: 'purple' },
      { key: 'budget', label: 'Budget Column', icon: '🎯', color: 'orange' },
      { key: 'actual', label: 'Actual Column', icon: '📈', color: 'red' }
    ];

    columnTypes.forEach(type => {
      newSuggestions[type.key] = analyzeColumnsForType(type.key);
    });

    setSuggestions(newSuggestions);
    setMagicalReveal(true);
  };

  const analyzeColumnsForType = (type: string): ColumnSuggestion[] => {
    const keywordPatterns = {
      value: ['revenue', 'sales', 'amount', 'value', 'total', 'sum', 'price', 'cost'],
      category: ['category', 'type', 'group', 'class', 'product', 'region', 'department', 'segment'],
      date: ['date', 'time', 'created', 'updated', 'period', 'month', 'year', 'timestamp'],
      budget: ['budget', 'planned', 'target', 'forecast', 'plan', 'expected', 'goal'],
      actual: ['actual', 'real', 'achieved', 'result', 'performance', 'realized', 'outcome']
    };

    const patterns = keywordPatterns[type as keyof typeof keywordPatterns] || [];
    const columnScores: { column: string; score: number; reasoning: string }[] = [];

    csvColumns.forEach(column => {
      const columnLower = column.toLowerCase();
      let score = 0;
      let reasoning = '';

      // Exact match
      if (patterns.includes(columnLower)) {
        score += 40;
        reasoning = `Exact keyword match for "${column}"`;
      }

      // Partial match
      const partialMatch = patterns.find(pattern => 
        columnLower.includes(pattern) || pattern.includes(columnLower)
      );
      if (partialMatch && score === 0) {
        score += 25;
        reasoning = `Contains keyword "${partialMatch}"`;
      }

      // Position bonus (earlier columns often more important)
      const position = csvColumns.indexOf(column);
      if (position < 3) {
        score += 10;
      }

      // Data type analysis bonus
      if (csvData.length > 0) {
        const sampleData = csvData.slice(0, 5);
        const dataAnalysis = analyzeDataType(sampleData, column);
        
        if (type === 'value' && dataAnalysis.isNumeric) {
          score += 20;
          reasoning += reasoning ? ` + numeric data detected` : `Numeric data detected`;
        }
        
        if (type === 'date' && dataAnalysis.isDate) {
          score += 30;
          reasoning += reasoning ? ` + date format detected` : `Date format detected`;
        }
        
        if (type === 'category' && dataAnalysis.isText) {
          score += 15;
          reasoning += reasoning ? ` + text data suitable for grouping` : `Text data suitable for grouping`;
        }
      }

      if (score > 0) {
        columnScores.push({ column, score, reasoning });
      }
    });

    // Sort by score and categorize
    columnScores.sort((a, b) => b.score - a.score);
    
    const suggestions: ColumnSuggestion[] = [];
    
    columnScores.forEach((item, index) => {
      let suggestionType: 'primary' | 'secondary' | 'alternative';
      
      if (index === 0 && item.score >= 30) {
        suggestionType = 'primary';
      } else if (index < 3 && item.score >= 20) {
        suggestionType = 'secondary';
      } else {
        suggestionType = 'alternative';
      }
      
      suggestions.push({
        column: item.column,
        confidence: Math.min(item.score + 20, 95),
        type: suggestionType,
        reasoning: item.reasoning
      });
    });

    return suggestions.slice(0, 5); // Return top 5 suggestions
  };

  const analyzeDataType = (sampleData: unknown[], column: string): { isNumeric: boolean; isDate: boolean; isText: boolean } => {
    const values = sampleData.map(row => (row as any)[column]).filter(val => val !== null && val !== undefined);
    
    if (values.length === 0) {
      return { isNumeric: false, isDate: false, isText: false };
    }

    const numericCount = values.filter(val => !isNaN(Number(val))).length;
    const dateCount = values.filter(val => !isNaN(Date.parse(val))).length;
    
    return {
      isNumeric: numericCount / values.length > 0.7,
      isDate: dateCount / values.length > 0.7,
      isText: numericCount / values.length < 0.3
    };
  };

  const getTypeConfig = (type: string) => {
    const configs = {
      value: { label: 'Value Column', icon: '💰', color: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
      category: { label: 'Category Column', icon: '📊', color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
      date: { label: 'Date Column', icon: '📅', color: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' },
      budget: { label: 'Budget Column', icon: '🎯', color: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
      actual: { label: 'Actual Column', icon: '📈', color: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' }
    };
    return configs[type as keyof typeof configs] || configs.value;
  };

  const getSuggestionStyle = (suggestion: ColumnSuggestion) => {
    const baseStyle = "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md";
    
    switch (suggestion.type) {
      case 'primary':
        return `${baseStyle} bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 hover:border-indigo-400`;
      case 'secondary':
        return `${baseStyle} bg-blue-50 border-blue-200 hover:border-blue-300`;
      default:
        return `${baseStyle} bg-gray-50 border-gray-200 hover:border-gray-300`;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500 text-white";
    if (confidence >= 60) return "bg-blue-500 text-white";
    if (confidence >= 40) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  const handleColumnSelect = (type: string, column: string) => {
    onColumnChange(type, column);
    setShowingType(null);
  };

  const renderColumnSelector = (type: string) => {
    const config = getTypeConfig(type);
    const typeSuggestions = suggestions[type] || [];
    const selectedColumn = selectedColumns[type];
    const isExpanded = showingType === type;

    return (
      <div key={type} className={`rounded-lg border-2 ${config.border} ${config.bg} overflow-hidden`}>
        <div 
          className="p-4 cursor-pointer hover:bg-opacity-80 transition-all"
          onClick={() => setShowingType(isExpanded ? null : type)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <h3 className={`font-semibold ${config.text}`}>{config.label}</h3>
                {selectedColumn && (
                  <p className="text-sm text-gray-600">Selected: {selectedColumn}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {typeSuggestions.length > 0 && (
                <span className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded-full">
                  {typeSuggestions.length} suggestions
                </span>
              )}
              <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 bg-white bg-opacity-50 border-t border-gray-200">
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">✨ AI Recommendations:</span>
            </div>
            <div className="space-y-2">
              {typeSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={getSuggestionStyle(suggestion)}
                  onClick={() => handleColumnSelect(type, suggestion.column)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-800">{suggestion.column}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceBadge(suggestion.confidence)}`}>
                        {suggestion.confidence}%
                      </span>
                      {suggestion.type === 'primary' && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                          ⭐ Top Pick
                        </span>
                      )}
                    </div>
                    <span className="text-indigo-600 hover:text-indigo-800">→</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{suggestion.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!magicalReveal) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🧠 {title}</h2>
        <p className="text-gray-600">AI-powered column detection with intelligent recommendations</p>
      </div>

      {Object.keys(suggestions).map(type => renderColumnSelector(type))}

      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-600">🎯</span>
          <span className="font-semibold text-gray-800">Pro Tip:</span>
        </div>
        <p className="text-sm text-gray-600">
          Click on any column type to see AI recommendations. The system analyzes your data patterns, column names, and data types to suggest the best matches with confidence scores.
        </p>
      </div>
    </div>
  );
};

export default SmartColumnSelector;
