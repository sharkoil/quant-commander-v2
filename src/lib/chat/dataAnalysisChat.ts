// Advanced Multi-Turn Chat System for Financial Data Analysis
// Supports function calling, confidence assessment, and temporal/multi-dimensional queries

import { Message } from '@/lib/ollama';
import { calculateOutlierDetection, OutlierDetectionParams } from '@/lib/analyzers/outlierDetection';
import { calculateBudgetVariance, BudgetVarianceArgs } from '@/lib/analyzers/budgetVariance';
import { ContributionAnalysisParams } from '@/lib/analyzers/contributionTypes';
import { TrendAnalysisArgs } from '@/lib/analyzers/trendAnalysis';

// ========================================
// CORE INTERFACES
// ========================================

export interface DataContext {
  csvData: any[];
  columns: string[];
  rowCount: number;
  datasetName: string;
  dateColumns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  detectedPatterns: DataPattern[];
}

export interface DataPattern {
  type: 'temporal' | 'categorical' | 'numeric' | 'hierarchical';
  column: string;
  confidence: number;
  description: string;
  suggestedAnalysis: string[];
}

export interface AnalysisIntent {
  primaryIntent: 'outlier' | 'trend' | 'comparison' | 'contribution' | 'variance' | 'summary' | 'exploration';
  confidence: number;
  timeScope?: TemporalScope;
  dimensions: string[];
  metrics: string[];
  filters?: Record<string, any>;
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  clarificationNeeded: boolean;
  clarificationQuestions: string[];
}

export interface TemporalScope {
  type: 'specific_date' | 'date_range' | 'period' | 'comparative';
  startDate?: string;
  endDate?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  comparison?: 'previous_period' | 'year_over_year' | 'quarter_over_quarter';
}

export interface FunctionCall {
  functionName: string;
  parameters: Record<string, any>;
  confidence: number;
  expectedOutputType: 'analysis' | 'visualization' | 'summary' | 'data';
}

export interface ChatAnalysisResponse {
  response: string;
  functionCalls: FunctionCall[];
  confidence: number;
  requiresClarification: boolean;
  clarificationQuestions: string[];
  suggestedQueries: string[];
  dataInsights: string[];
  analysisResults?: any;
}

// ========================================
// MAIN CHAT ANALYSIS CLASS
// ========================================

export class DataAnalysisChat {
  private dataContext: DataContext;
  private conversationHistory: Message[] = [];
  private lastAnalysisResults: Map<string, any> = new Map();

  constructor(dataContext: DataContext) {
    this.dataContext = dataContext;
  }

  /**
   * Main method to process user queries with data context
   */
  async processQuery(
    userQuery: string, 
    conversationHistory: Message[],
    ollamaModel: string
  ): Promise<ChatAnalysisResponse> {
    this.conversationHistory = conversationHistory;

    try {
      // Step 1: Parse and understand the user intent
      const intent = await this.parseUserIntent(userQuery);
      
      // Step 2: If confidence is low, request clarification
      if (intent.confidence < 0.7 || intent.clarificationNeeded) {
        return {
          response: this.generateClarificationResponse(intent),
          functionCalls: [],
          confidence: intent.confidence,
          requiresClarification: true,
          clarificationQuestions: intent.clarificationQuestions,
          suggestedQueries: this.generateSuggestedQueries(intent),
          dataInsights: this.getDataOverview()
        };
      }

      // Step 3: Generate function calls based on intent
      const functionCalls = this.generateFunctionCalls(intent);

      // Step 4: Execute analysis functions
      const analysisResults = await this.executeFunctionCalls(functionCalls);

      // Step 5: Generate intelligent response
      const response = await this.generateAnalysisResponse(
        intent, 
        analysisResults, 
        userQuery,
        ollamaModel
      );

      return {
        response,
        functionCalls,
        confidence: intent.confidence,
        requiresClarification: false,
        clarificationQuestions: [],
        suggestedQueries: this.generateFollowUpQueries(intent, analysisResults),
        dataInsights: this.extractDataInsights(analysisResults),
        analysisResults
      };

    } catch (error) {
      console.error('Data analysis chat error:', error);
      return {
        response: `I encountered an error analyzing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try rephrasing your question or check that your data is properly formatted.`,
        functionCalls: [],
        confidence: 0,
        requiresClarification: true,
        clarificationQuestions: ['Could you rephrase your question?', 'What specific analysis are you looking for?'],
        suggestedQueries: this.getDefaultSuggestedQueries(),
        dataInsights: []
      };
    }
  }

  /**
   * Parse user intent using natural language understanding
   */
  private async parseUserIntent(userQuery: string): Promise<AnalysisIntent> {
    const query = userQuery.toLowerCase();
    
    // Intent classification patterns
    const intentPatterns = {
      outlier: /outlier|anomal|unusua|extreme|spike|drop|abnormal/,
      trend: /trend|pattern|over time|temporal|seasonal|growth|decline/,
      comparison: /compar|vs|versus|against|between|difference/,
      contribution: /contribut|breakdown|composition|percentage|share|distribution/,
      variance: /variance|budget|actual|forecast|deviation|performance/,
      summary: /summar|overview|total|aggregate|overall/,
      exploration: /show|display|what|how|which|explore|analyze/
    };

    // Temporal scope detection
    const temporalPatterns = {
      specific_date: /on \d{4}-\d{2}-\d{2}|january|february|march|april|may|june|july|august|september|october|november|december/,
      date_range: /from .+ to|between .+ and|during|period|range/,
      period: /monthly|quarterly|yearly|daily|weekly|annual/,
      comparative: /last month|previous|year over year|yoy|qoq|compared to/
    };

    let primaryIntent: AnalysisIntent['primaryIntent'] = 'exploration';
    let confidence = 0.5;
    let timeScope: TemporalScope | undefined;
    let dimensions: string[] = [];
    let metrics: string[] = [];
    let clarificationNeeded = false;
    let clarificationQuestions: string[] = [];

    // Determine primary intent
    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(query)) {
        primaryIntent = intent as AnalysisIntent['primaryIntent'];
        confidence += 0.3;
        break;
      }
    }

    // Detect temporal scope
    for (const [scope, pattern] of Object.entries(temporalPatterns)) {
      if (pattern.test(query)) {
        timeScope = { type: scope as TemporalScope['type'] };
        confidence += 0.2;
        break;
      }
    }

    // Extract dimensions and metrics from data context
    dimensions = this.dataContext.categoricalColumns.filter(col => 
      query.includes(col.toLowerCase())
    );
    
    metrics = this.dataContext.numericColumns.filter(col => 
      query.includes(col.toLowerCase())
    );

    // Check if query is too vague
    if (confidence < 0.6) {
      clarificationNeeded = true;
      clarificationQuestions = this.generateIntentClarificationQuestions(query, primaryIntent);
    }

    // Check for multi-dimensional complexity
    if (dimensions.length > 2 || metrics.length > 2) {
      if (!query.includes('by') && !query.includes('breakdown')) {
        clarificationNeeded = true;
        clarificationQuestions.push(
          `You mentioned multiple dimensions (${dimensions.join(', ')}) and metrics (${metrics.join(', ')}). How would you like me to break down the analysis?`
        );
      }
    }

    return {
      primaryIntent,
      confidence,
      timeScope,
      dimensions,
      metrics,
      clarificationNeeded,
      clarificationQuestions
    };
  }

  /**
   * Generate clarification questions based on intent
   */
  private generateIntentClarificationQuestions(query: string, intent: string): string[] {
    const questions: string[] = [];

    if (intent === 'exploration') {
      questions.push('What specific aspect of your data would you like me to analyze?');
      questions.push(`I can help with: outlier detection, trend analysis, budget variance, contribution analysis, or comparative analysis. Which interests you?`);
    }

    // Add column-specific questions
    if (this.dataContext.dateColumns.length > 1) {
      questions.push(`Which date column should I use for temporal analysis: ${this.dataContext.dateColumns.join(', ')}?`);
    }

    if (this.dataContext.numericColumns.length > 3) {
      questions.push(`Which metric would you like to focus on: ${this.dataContext.numericColumns.slice(0, 5).join(', ')}${this.dataContext.numericColumns.length > 5 ? ', or others' : ''}?`);
    }

    return questions;
  }

  /**
   * Generate function calls based on analyzed intent
   */
  private generateFunctionCalls(intent: AnalysisIntent): FunctionCall[] {
    const calls: FunctionCall[] = [];

    switch (intent.primaryIntent) {
      case 'outlier':
        calls.push(this.createOutlierDetectionCall(intent));
        break;
        
      case 'trend':
        calls.push(this.createTrendAnalysisCall(intent));
        break;
        
      case 'variance':
        calls.push(this.createBudgetVarianceCall(intent));
        break;
        
      case 'contribution':
        calls.push(this.createContributionAnalysisCall(intent));
        break;
        
      case 'comparison':
        // Multi-function call for comparative analysis
        calls.push(this.createContributionAnalysisCall(intent));
        if (this.hasTemporalData(intent)) {
          calls.push(this.createTrendAnalysisCall(intent));
        }
        break;
        
      case 'summary':
        // Execute multiple analyses for comprehensive overview
        calls.push(this.createContributionAnalysisCall(intent));
        calls.push(this.createOutlierDetectionCall(intent));
        if (this.hasBudgetData()) {
          calls.push(this.createBudgetVarianceCall(intent));
        }
        break;
    }

    return calls.filter(call => call.confidence > 0.6);
  }

  /**
   * Create outlier detection function call
   */
  private createOutlierDetectionCall(intent: AnalysisIntent): FunctionCall {
    const dateColumn = this.dataContext.dateColumns[0];
    const actualColumn = intent.metrics[0] || this.getDefaultNumericColumn();
    const budgetColumn = this.findBudgetColumn();

    const params: OutlierDetectionParams = {
      data: this.prepareOutlierData(dateColumn, actualColumn, budgetColumn),
      method: 'both',
      analysisTarget: budgetColumn ? 'variance' : 'actual',
      threshold: 2,
      iqrMultiplier: 1.5,
      columnMapping: {
        dateColumn,
        actualColumn,
        budgetColumn
      }
    };

    return {
      functionName: 'calculateOutlierDetection',
      parameters: params,
      confidence: 0.9,
      expectedOutputType: 'analysis'
    };
  }

  /**
   * Create budget variance function call
   */
  private createBudgetVarianceCall(intent: AnalysisIntent): FunctionCall {
    const actualColumn = intent.metrics.find(m => m.toLowerCase().includes('actual')) || 
                        this.getDefaultNumericColumn();
    const budgetColumn = this.findBudgetColumn();

    if (!budgetColumn) {
      return {
        functionName: 'error',
        parameters: { message: 'No budget column found for variance analysis' },
        confidence: 0,
        expectedOutputType: 'analysis'
      };
    }

    const params: BudgetVarianceArgs = {
      data: this.prepareBudgetVarianceData(actualColumn, budgetColumn),
      metricName: actualColumn,
      analysisType: 'both'
    };

    return {
      functionName: 'calculateBudgetVariance',
      parameters: params,
      confidence: 0.9,
      expectedOutputType: 'analysis'
    };
  }

  /**
   * Create contribution analysis function call
   */
  private createContributionAnalysisCall(intent: AnalysisIntent): FunctionCall {
    const valueColumn = intent.metrics[0] || this.getDefaultNumericColumn();
    const categoryColumn = intent.dimensions[0] || this.dataContext.categoricalColumns[0];

    if (!categoryColumn) {
      return {
        functionName: 'error',
        parameters: { message: 'No categorical column found for contribution analysis' },
        confidence: 0,
        expectedOutputType: 'analysis'
      };
    }

    const params: ContributionAnalysisParams = {
      valueColumn,
      categoryColumn,
      analysisScope: 'total',
      sortBy: 'contribution',
      sortOrder: 'desc',
      timePeriodAnalysis: this.getTimePeriodAnalysis(intent)
    };

    return {
      functionName: 'calculateContributionAnalysis',
      parameters: params,
      confidence: 0.8,
      expectedOutputType: 'analysis'
    };
  }

  /**
   * Create trend analysis function call
   */
  private createTrendAnalysisCall(intent: AnalysisIntent): FunctionCall {
    const dateColumn = this.dataContext.dateColumns[0];
    const valueColumn = intent.metrics[0] || this.getDefaultNumericColumn();

    if (!dateColumn) {
      return {
        functionName: 'error',
        parameters: { message: 'No date column found for trend analysis' },
        confidence: 0,
        expectedOutputType: 'analysis'
      };
    }

    const params: TrendAnalysisArgs = {
      data: this.prepareTrendData(dateColumn, valueColumn),
      metricName: valueColumn,
      windowSize: 3,
      trendType: 'simple'
    };

    return {
      functionName: 'calculateTrendAnalysis',
      parameters: params,
      confidence: 0.8,
      expectedOutputType: 'analysis'
    };
  }

  /**
   * Execute function calls and return results
   */
  private async executeFunctionCalls(functionCalls: FunctionCall[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    for (const call of functionCalls) {
      try {
        let result: any;

        switch (call.functionName) {
          case 'calculateOutlierDetection':
            result = calculateOutlierDetection(call.parameters as OutlierDetectionParams);
            break;
            
          case 'calculateBudgetVariance':
            result = calculateBudgetVariance(call.parameters as BudgetVarianceArgs);
            break;
            
          default:
            result = { error: `Function ${call.functionName} not implemented yet` };
        }

        results.set(call.functionName, result);
        this.lastAnalysisResults.set(call.functionName, result);
        
      } catch (error) {
        console.error(`Error executing ${call.functionName}:`, error);
        results.set(call.functionName, { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return results;
  }

  /**
   * Generate intelligent response based on analysis results
   */
  private async generateAnalysisResponse(
    intent: AnalysisIntent,
    analysisResults: Map<string, any>,
    originalQuery: string,
    ollamaModel: string
  ): Promise<string> {
    // Extract key insights from analysis results
    const insights: string[] = [];
    let htmlContent = '';

    for (const [functionName, result] of analysisResults) {
      if (result.error) {
        insights.push(`⚠️ ${functionName}: ${result.error}`);
        continue;
      }

      switch (functionName) {
        case 'calculateOutlierDetection':
          insights.push(`🔍 Found ${result.outlierCount} outliers (${(result.outlierCount / result.totalDataPoints * 100).toFixed(1)}% of data)`);
          insights.push(`📊 Risk Level: ${result.summary.riskLevel.toUpperCase()}`);
          if (result.htmlOutput) htmlContent += result.htmlOutput;
          break;
          
        case 'calculateBudgetVariance':
          insights.push(`💰 Overall variance: ${result.summary.overallPercentageVariance.toFixed(1)}%`);
          insights.push(`📈 Performance score: ${result.summary.performanceScore.toFixed(0)}/100`);
          break;
          
        case 'calculateContributionAnalysis':
          if (result.success && result.analysis) {
            const top = result.analysis[0];
            insights.push(`🏆 Top contributor: ${top.category} (${top.contributionPercent.toFixed(1)}%)`);
            insights.push(`📊 Analyzing ${result.metadata.totalCategories} categories`);
          }
          break;
      }
    }

    // Create response structure
    const responseData = {
      originalQuery,
      intent: intent.primaryIntent,
      insights,
      datasetInfo: {
        name: this.dataContext.datasetName,
        rows: this.dataContext.rowCount,
        columns: this.dataContext.columns.length
      },
      keyFindings: this.extractKeyFindings(analysisResults),
      htmlContent
    };

    // Generate narrative response
    return this.formatAnalysisResponse(responseData, intent);
  }

  /**
   * Format analysis response with HTML content
   */
  private formatAnalysisResponse(responseData: any, intent: AnalysisIntent): string {
    const { originalQuery, insights, keyFindings, htmlContent } = responseData;

    let response = `## Analysis Results for: "${originalQuery}"\n\n`;

    // Add key insights
    if (insights.length > 0) {
      response += `### 📊 Key Insights:\n`;
      insights.forEach((insight: string) => {
        response += `- ${insight}\n`;
      });
      response += '\n';
    }

    // Add key findings
    if (keyFindings.length > 0) {
      response += `### 🔍 Key Findings:\n`;
      keyFindings.forEach((finding: string) => {
        response += `- ${finding}\n`;
      });
      response += '\n';
    }

    // Add HTML content if available
    if (htmlContent) {
      response += `### 📈 Detailed Analysis:\n\n`;
      response += htmlContent;
    }

    // Add contextual recommendations
    response += this.generateContextualRecommendations(intent, responseData);

    return response;
  }

  /**
   * Extract key findings from analysis results
   */
  private extractKeyFindings(analysisResults: Map<string, any>): string[] {
    const findings: string[] = [];

    for (const [functionName, result] of analysisResults) {
      if (result.error) continue;

      switch (functionName) {
        case 'calculateOutlierDetection':
          if (result.summary.extremeOutliers > 0) {
            findings.push(`${result.summary.extremeOutliers} extreme outliers require immediate investigation`);
          }
          if (result.summary.riskLevel === 'high' || result.summary.riskLevel === 'critical') {
            findings.push('Data quality issues detected - review data collection processes');
          }
          break;
          
        case 'calculateBudgetVariance':
          if (Math.abs(result.summary.overallPercentageVariance) > 10) {
            findings.push(`Significant budget variance of ${result.summary.overallPercentageVariance.toFixed(1)}% suggests planning adjustments needed`);
          }
          if (result.summary.performanceScore < 70) {
            findings.push('Below-target performance indicates potential process improvements needed');
          }
          break;
          
        case 'calculateContributionAnalysis':
          if (result.success && result.metadata.concentrationRatio > 0.8) {
            findings.push('High concentration risk - top contributors dominate the distribution');
          }
          break;
      }
    }

    return findings;
  }

  /**
   * Generate contextual recommendations
   */
  private generateContextualRecommendations(intent: AnalysisIntent, responseData: any): string {
    let recommendations = '\n### 💡 Recommendations:\n';

    switch (intent.primaryIntent) {
      case 'outlier':
        recommendations += '- Investigate extreme outliers to understand root causes\n';
        recommendations += '- Consider data validation rules to prevent future anomalies\n';
        recommendations += '- Review periods with high outlier concentration\n';
        break;
        
      case 'variance':
        recommendations += '- Analyze variance patterns to improve forecasting accuracy\n';
        recommendations += '- Review budget planning assumptions for high-variance periods\n';
        recommendations += '- Implement variance monitoring alerts\n';
        break;
        
      case 'trend':
        recommendations += '- Monitor trend inflection points for strategic decisions\n';
        recommendations += '- Consider seasonal adjustments in planning\n';
        recommendations += '- Set up trend monitoring dashboards\n';
        break;
    }

    return recommendations;
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private generateClarificationResponse(intent: AnalysisIntent): string {
    let response = "I need some clarification to provide the most accurate analysis:\n\n";
    
    intent.clarificationQuestions.forEach((question, index) => {
      response += `${index + 1}. ${question}\n`;
    });

    response += `\n**Dataset Context:**\n`;
    response += `- ${this.dataContext.rowCount} rows across ${this.dataContext.columns.length} columns\n`;
    response += `- Date columns: ${this.dataContext.dateColumns.join(', ') || 'None detected'}\n`;
    response += `- Numeric columns: ${this.dataContext.numericColumns.slice(0, 5).join(', ')}${this.dataContext.numericColumns.length > 5 ? '...' : ''}\n`;
    response += `- Categorical columns: ${this.dataContext.categoricalColumns.slice(0, 5).join(', ')}${this.dataContext.categoricalColumns.length > 5 ? '...' : ''}\n`;

    return response;
  }

  private generateSuggestedQueries(intent: AnalysisIntent): string[] {
    const suggestions: string[] = [];
    
    if (this.dataContext.dateColumns.length > 0 && this.dataContext.numericColumns.length > 0) {
      suggestions.push(`Analyze trends in ${this.dataContext.numericColumns[0]} over time`);
      suggestions.push(`Find outliers in ${this.dataContext.numericColumns[0]} data`);
    }
    
    if (this.dataContext.categoricalColumns.length > 0 && this.dataContext.numericColumns.length > 0) {
      suggestions.push(`Show contribution breakdown by ${this.dataContext.categoricalColumns[0]}`);
      suggestions.push(`Compare ${this.dataContext.numericColumns[0]} across different ${this.dataContext.categoricalColumns[0]}`);
    }
    
    if (this.hasBudgetData()) {
      suggestions.push('Analyze budget vs actual variance');
      suggestions.push('Show periods with highest budget variance');
    }

    return suggestions;
  }

  private generateFollowUpQueries(intent: AnalysisIntent, analysisResults: Map<string, any>): string[] {
    const followUps: string[] = [];

    // Generate follow-ups based on analysis results
    for (const [functionName, result] of analysisResults) {
      if (result.error) continue;

      switch (functionName) {
        case 'calculateOutlierDetection':
          if (result.outlierCount > 0) {
            followUps.push('Show me the specific dates with outliers');
            followUps.push('What caused the outliers in the data?');
          }
          break;
          
        case 'calculateBudgetVariance':
          followUps.push('Which periods had the highest variance?');
          followUps.push('Compare variance by category or region');
          break;
          
        case 'calculateContributionAnalysis':
          if (result.success) {
            followUps.push('Show me the bottom contributors');
            followUps.push('How has contribution changed over time?');
          }
          break;
      }
    }

    return followUps;
  }

  private getDataOverview(): string[] {
    return [
      `Dataset contains ${this.dataContext.rowCount} records`,
      `${this.dataContext.numericColumns.length} numeric columns available for analysis`,
      `${this.dataContext.categoricalColumns.length} categorical dimensions for grouping`,
      `${this.dataContext.dateColumns.length} date columns for temporal analysis`
    ];
  }

  private getDefaultSuggestedQueries(): string[] {
    return [
      'Show me an overview of my data',
      'Find any unusual patterns or outliers',
      'Analyze trends over time',
      'Break down contributions by category'
    ];
  }

  private extractDataInsights(analysisResults: Map<string, any>): string[] {
    const insights: string[] = [];
    
    for (const [functionName, result] of analysisResults) {
      if (result.error) continue;
      
      if (result.insights?.keyFindings) {
        insights.push(...result.insights.keyFindings);
      }
    }
    
    return insights;
  }

  // Data preparation helper methods
  private prepareOutlierData(dateColumn: string, actualColumn: string, budgetColumn?: string): any[] {
    return this.dataContext.csvData.map(row => ({
      date: row[dateColumn],
      actual: Number(row[actualColumn]) || 0,
      budget: budgetColumn ? Number(row[budgetColumn]) || undefined : undefined,
      label: row[this.dataContext.categoricalColumns[0]] || ''
    }));
  }

  private prepareBudgetVarianceData(actualColumn: string, budgetColumn: string): any[] {
    return this.dataContext.csvData.map((row, index) => ({
      period: `Period ${index + 1}`,
      actual: Number(row[actualColumn]) || 0,
      budget: Number(row[budgetColumn]) || 0
    }));
  }

  private prepareTrendData(dateColumn: string, valueColumn: string): any[] {
    return this.dataContext.csvData.map(row => ({
      date: row[dateColumn],
      value: Number(row[valueColumn]) || 0
    }));
  }

  private getTimePeriodAnalysis(intent: AnalysisIntent): any {
    if (!intent.timeScope || this.dataContext.dateColumns.length === 0) {
      return undefined;
    }

    return {
      enabled: true,
      dateColumn: this.dataContext.dateColumns[0],
      periodType: intent.timeScope.period === 'monthly' ? 'month' : 'quarter'
    };
  }

  private findBudgetColumn(): string | undefined {
    return this.dataContext.numericColumns.find(col => 
      col.toLowerCase().includes('budget') || 
      col.toLowerCase().includes('planned') || 
      col.toLowerCase().includes('target')
    );
  }

  private getDefaultNumericColumn(): string {
    return this.dataContext.numericColumns.find(col => 
      col.toLowerCase().includes('actual') || 
      col.toLowerCase().includes('sales') || 
      col.toLowerCase().includes('revenue') ||
      col.toLowerCase().includes('value')
    ) || this.dataContext.numericColumns[0];
  }

  private hasTemporalData(intent: AnalysisIntent): boolean {
    return this.dataContext.dateColumns.length > 0 && intent.timeScope !== undefined;
  }

  private hasBudgetData(): boolean {
    return this.findBudgetColumn() !== undefined;
  }
}

// ========================================
// DATA CONTEXT BUILDER
// ========================================

/**
 * Build data context from CSV data for chat analysis
 */
export function buildDataContext(csvData: any[], datasetName: string = 'dataset'): DataContext {
  if (!csvData || csvData.length === 0) {
    throw new Error('CSV data is required to build data context');
  }

  const columns = Object.keys(csvData[0]);
  const rowCount = csvData.length;

  // Analyze column types
  const { dateColumns, numericColumns, categoricalColumns } = analyzeColumnTypes(csvData, columns);
  
  // Detect data patterns
  const detectedPatterns = detectDataPatterns(csvData, columns, dateColumns, numericColumns, categoricalColumns);

  return {
    csvData,
    columns,
    rowCount,
    datasetName,
    dateColumns,
    numericColumns,
    categoricalColumns,
    detectedPatterns
  };
}

function analyzeColumnTypes(csvData: any[], columns: string[]): {
  dateColumns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
} {
  const dateColumns: string[] = [];
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];

  columns.forEach(column => {
    const sampleValues = csvData.slice(0, 10).map(row => row[column]);
    
    // Check for date columns
    const dateCount = sampleValues.filter(val => {
      const dateTest = new Date(val);
      return !isNaN(dateTest.getTime()) && val !== null && val !== '';
    }).length;
    
    if (dateCount >= 7) {
      dateColumns.push(column);
      return;
    }

    // Check for numeric columns
    const numericCount = sampleValues.filter(val => {
      return !isNaN(Number(val)) && val !== null && val !== '';
    }).length;
    
    if (numericCount >= 8) {
      numericColumns.push(column);
      return;
    }

    // Default to categorical
    categoricalColumns.push(column);
  });

  return { dateColumns, numericColumns, categoricalColumns };
}

function detectDataPatterns(
  csvData: any[], 
  columns: string[], 
  dateColumns: string[], 
  numericColumns: string[], 
  categoricalColumns: string[]
): DataPattern[] {
  const patterns: DataPattern[] = [];

  // Temporal patterns
  if (dateColumns.length > 0) {
    patterns.push({
      type: 'temporal',
      column: dateColumns[0],
      confidence: 0.9,
      description: 'Time-series data detected for trend analysis',
      suggestedAnalysis: ['trend analysis', 'seasonal analysis', 'outlier detection over time']
    });
  }

  // Hierarchical patterns (multiple categorical columns)
  if (categoricalColumns.length > 1) {
    patterns.push({
      type: 'hierarchical',
      column: categoricalColumns.join(', '),
      confidence: 0.8,
      description: 'Multiple categorical dimensions for drill-down analysis',
      suggestedAnalysis: ['contribution analysis', 'comparative analysis', 'segmentation']
    });
  }

  // Numeric analysis patterns
  if (numericColumns.length >= 2) {
    patterns.push({
      type: 'numeric',
      column: numericColumns.join(', '),
      confidence: 0.8,
      description: 'Multiple numeric metrics for variance and correlation analysis',
      suggestedAnalysis: ['budget variance', 'outlier detection', 'correlation analysis']
    });
  }

  return patterns;
}
