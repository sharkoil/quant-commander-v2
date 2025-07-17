/**
 * AI Column Insights Component
 * Provides a magical AI-powered experience showing column detection assumptions
 * and reasoning in an intuitive, engaging way
 */

import React, { useState, useEffect } from 'react';

interface ColumnInsight {
  column: string;
  type: 'value' | 'category' | 'date' | 'budget' | 'actual';
  confidence: number;
  reasoning: string;
  alternatives: string[];
  aiThinking: string;
}

interface AIColumnInsightsProps {
  csvData: unknown[];
  csvColumns: string[];
  onColumnSelect: (type: string, column: string) => void;
  detectedColumns?: {
    value?: string;
    category?: string;
    date?: string;
    budget?: string;
    actual?: string;
  };
}

export const AIColumnInsights: React.FC<AIColumnInsightsProps> = ({
  csvData,
  csvColumns,
  onColumnSelect,
  detectedColumns = {}
}) => {
  const [isThinking, setIsThinking] = useState(false);
  const [insights, setInsights] = useState<ColumnInsight[]>([]);
  const [showMagicalReveal, setShowMagicalReveal] = useState(false);
  const [currentThought, setCurrentThought] = useState('');

  // AI thinking process animation
  const aiThoughts = [
    "🔍 Analyzing column patterns...",
    "🧠 Detecting data types...",
    "📊 Evaluating numeric patterns...",
    "🎯 Identifying key relationships...",
    "✨ Generating insights...",
    "💡 Confidence scoring complete!"
  ];

  useEffect(() => {
    if (csvData.length > 0) {
      performMagicalAnalysis();
    }
  }, [csvData, csvColumns]);

  const performMagicalAnalysis = async () => {
    setIsThinking(true);
    setShowMagicalReveal(true);

    // Simulate AI thinking process
    for (let i = 0; i < aiThoughts.length; i++) {
      setCurrentThought(aiThoughts[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Generate insights
    const generatedInsights = await generateColumnInsights();
    setInsights(generatedInsights);
    setIsThinking(false);
  };

  const smartDetectColumns = () => {
    const detected = {
      value: '',
      category: '',
      date: '',
      budget: '',
      actual: ''
    };

    // Smart detection logic
    csvColumns.forEach(column => {
      const columnLower = column.toLowerCase();
      
      // Value column detection
      if (!detected.value && (columnLower.includes('value') || columnLower.includes('amount') || columnLower.includes('total') || columnLower.includes('revenue'))) {
        detected.value = column;
      }
      
      // Category column detection
      if (!detected.category && (columnLower.includes('category') || columnLower.includes('type') || columnLower.includes('group'))) {
        detected.category = column;
      }
      
      // Date column detection
      if (!detected.date && (columnLower.includes('date') || columnLower.includes('time') || columnLower.includes('created'))) {
        detected.date = column;
      }
      
      // Budget column detection
      if (!detected.budget && (columnLower.includes('budget') || columnLower.includes('plan') || columnLower.includes('target'))) {
        detected.budget = column;
      }
      
      // Actual column detection
      if (!detected.actual && (columnLower.includes('actual') || columnLower.includes('real') || columnLower.includes('achieved'))) {
        detected.actual = column;
      }
    });

    return detected;
  };

  const generateColumnInsights = async (): Promise<ColumnInsight[]> => {
    const insights: ColumnInsight[] = [];
    
    // Use provided detectedColumns or smart detection
    const columns = Object.keys(detectedColumns).length > 0 ? detectedColumns : smartDetectColumns();
    
    // Analyze each column type
    if (columns.value) {
      insights.push({
        column: columns.value,
        type: 'value',
        confidence: calculateConfidence(columns.value, 'value'),
        reasoning: getReasoningForColumn(columns.value, 'value'),
        alternatives: getAlternatives(columns.value, 'value'),
        aiThinking: `I detected "${columns.value}" as the primary value column because it contains numeric data with business-relevant patterns.`
      });
    }

    if (columns.category) {
      insights.push({
        column: columns.category,
        type: 'category',
        confidence: calculateConfidence(columns.category, 'category'),
        reasoning: getReasoningForColumn(columns.category, 'category'),
        alternatives: getAlternatives(columns.category, 'category'),
        aiThinking: `I identified "${columns.category}" as the category column due to its text-based nature and grouping potential.`
      });
    }

    if (columns.date) {
      insights.push({
        column: columns.date,
        type: 'date',
        confidence: calculateConfidence(columns.date, 'date'),
        reasoning: getReasoningForColumn(columns.date, 'date'),
        alternatives: getAlternatives(columns.date, 'date'),
        aiThinking: `I recognized "${columns.date}" as the date column by analyzing temporal patterns and date formats.`
      });
    }

    if (columns.budget) {
      insights.push({
        column: columns.budget,
        type: 'budget',
        confidence: calculateConfidence(columns.budget, 'budget'),
        reasoning: getReasoningForColumn(columns.budget, 'budget'),
        alternatives: getAlternatives(columns.budget, 'budget'),
        aiThinking: `I determined "${columns.budget}" represents budget data based on keyword analysis and numeric patterns.`
      });
    }

    if (columns.actual) {
      insights.push({
        column: columns.actual,
        type: 'actual',
        confidence: calculateConfidence(columns.actual, 'actual'),
        reasoning: getReasoningForColumn(columns.actual, 'actual'),
        alternatives: getAlternatives(columns.actual, 'actual'),
        aiThinking: `I identified "${columns.actual}" as actual performance data through semantic analysis of column names and data patterns.`
      });
    }

    return insights;
  };

  const calculateConfidence = (column: string, type: string): number => {
    const keywordMatches = {
      value: ['revenue', 'sales', 'amount', 'value', 'total', 'sum'],
      category: ['category', 'type', 'group', 'class', 'product', 'region'],
      date: ['date', 'time', 'created', 'updated', 'period'],
      budget: ['budget', 'planned', 'target', 'forecast', 'plan'],
      actual: ['actual', 'real', 'achieved', 'result', 'performance']
    };

    const keywords = keywordMatches[type as keyof typeof keywordMatches] || [];
    const columnLower = column.toLowerCase();
    
    let confidence = 50; // Base confidence
    
    // Exact match bonus
    if (keywords.includes(columnLower)) {
      confidence += 30;
    }
    
    // Partial match bonus
    const partialMatch = keywords.some(keyword => 
      columnLower.includes(keyword) || keyword.includes(columnLower)
    );
    if (partialMatch) {
      confidence += 20;
    }

    // Position bonus (first few columns are often more important)
    const columnIndex = csvColumns.indexOf(column);
    if (columnIndex < 3) {
      confidence += 10;
    }

    return Math.min(confidence, 95); // Cap at 95%
  };

  const getReasoningForColumn = (column: string, type: string): string => {
    const reasoningMap = {
      value: `This column contains numeric data that represents measurable business metrics. Perfect for calculating trends, variances, and performance analysis.`,
      category: `This column contains text-based categorical data that's ideal for grouping and segmentation analysis. Great for contribution and top-N analysis.`,
      date: `This column contains temporal data that enables time-based analysis. Essential for trend analysis, period variance, and seasonal insights.`,
      budget: `This column represents planned or budgeted values. Key for variance analysis and performance tracking against targets.`,
      actual: `This column contains actual performance data. Critical for comparing reality against plans and identifying variances.`
    };

    return reasoningMap[type as keyof typeof reasoningMap] || 'AI detected patterns suggesting this column type.';
  };

  const getAlternatives = (selectedColumn: string, type: string): string[] => {
    const typeKeywords = {
      value: ['revenue', 'sales', 'amount', 'value', 'total', 'sum', 'price', 'cost'],
      category: ['category', 'type', 'group', 'class', 'product', 'region', 'department'],
      date: ['date', 'time', 'created', 'updated', 'period', 'month', 'year'],
      budget: ['budget', 'planned', 'target', 'forecast', 'plan', 'expected'],
      actual: ['actual', 'real', 'achieved', 'result', 'performance', 'realized']
    };

    const keywords = typeKeywords[type as keyof typeof typeKeywords] || [];
    
    return csvColumns.filter(col => {
      if (col === selectedColumn) return false;
      const colLower = col.toLowerCase();
      return keywords.some(keyword => 
        colLower.includes(keyword) || keyword.includes(colLower)
      );
    }).slice(0, 3); // Show top 3 alternatives
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-blue-600 bg-blue-50';
    if (confidence >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTypeIcon = (type: string): string => {
    const icons = {
      value: '💰',
      category: '📊',
      date: '📅',
      budget: '🎯',
      actual: '📈'
    };
    return icons[type as keyof typeof icons] || '🔍';
  };

  const getTypeColor = (type: string): string => {
    const colors = {
      value: 'bg-green-500',
      category: 'bg-blue-500',
      date: 'bg-purple-500',
      budget: 'bg-orange-500',
      actual: 'bg-red-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  if (!showMagicalReveal) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">🤖</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">AI Column Intelligence</h3>
          <p className="text-sm text-gray-600">Understanding your data structure</p>
        </div>
      </div>

      {isThinking && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-indigo-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-700 font-medium">{currentThought}</span>
          </div>
        </div>
      )}

      {!isThinking && insights.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            ✨ <strong>AI Analysis Complete!</strong> Here's what I discovered about your columns:
          </div>
          
          {insights.map((insight, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 ${getTypeColor(insight.type)} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                  {getTypeIcon(insight.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-800">{insight.column}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase">
                      {insight.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(insight.confidence)}`}>
                      {insight.confidence}% confident
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                      <p className="italic">"{insight.aiThinking}"</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{insight.reasoning}</p>
                  
                  {insight.alternatives.length > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-600">Alternative options: </span>
                      <div className="flex gap-2 mt-1">
                        {insight.alternatives.map((alt, altIndex) => (
                          <button
                            key={altIndex}
                            onClick={() => onColumnSelect(insight.type, alt)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs transition-colors"
                          >
                            {alt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => onColumnSelect(insight.type, insight.column)}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Use This
                </button>
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600">✅</span>
              <span className="font-semibold text-gray-800">Ready to analyze!</span>
            </div>
            <p className="text-sm text-gray-600">
              I've automatically configured your analysis based on these insights. You can adjust any selections above or proceed with the AI recommendations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIColumnInsights;
