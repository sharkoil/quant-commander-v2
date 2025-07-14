// Reliable Multi-Turn Chat System for Financial Data
// Focused on consistency, performance, and reliable function calling for 1M+ rows

import { Message } from '@/lib/ollama';
import { calculateOutlierDetection, OutlierDetectionParams } from '@/lib/analyzers/outlierDetection';
import { calculateBudgetVariance, BudgetVarianceArgs } from '@/lib/analyzers/budgetVariance';

// ========================================
// CORE INTERFACES - SIMPLIFIED FOR RELIABILITY
// ========================================

export interface ReliableDataContext {
  data: any[];
  columns: string[];
  totalRows: number;
  sampleSize: number; // For large datasets, work with samples
  datasetName: string;
  columnAnalysis: ColumnAnalysis;
  performanceMetrics: {
    lastQueryTime: number;
    averageQueryTime: number;
    totalQueries: number;
  };
}

export interface ColumnAnalysis {
  dateColumns: ColumnInfo[];
  numericColumns: ColumnInfo[];
  categoricalColumns: ColumnInfo[];
  potentialBudgetColumns: ColumnInfo[];
  potentialActualColumns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: 'date' | 'numeric' | 'categorical';
  confidence: number;
  sampleValues: any[];
  nullCount: number;
  uniqueCount: number;
}

export interface QueryIntent {
  action: 'analyze' | 'clarify' | 'summarize' | 'explore';
  analysisType: 'outlier' | 'variance' | 'trend' | 'contribution' | 'general';
  confidence: number;
  requiredColumns: string[];
  timeframe?: {
    type: 'specific' | 'range' | 'period';
    value: string;
  };
  filters: Record<string, any>;
  needsClarification: boolean;
  clarificationReason: string;
}

export interface ChatResponse {
  message: string;
  htmlContent?: string;
  confidence: number;
  executedAnalysis: boolean;
  analysisResults?: any;
  suggestedActions: string[];
  clarificationQuestions: string[];
  performanceInfo: {
    processingTime: number;
    rowsAnalyzed: number;
    cacheHit: boolean;
  };
}

// ========================================
// MAIN RELIABLE CHAT CLASS
// ========================================

export class ReliableChatSystem {
  private context: ReliableDataContext;
  private queryCache: Map<string, any> = new Map();
  private maxCacheSize = 50;
  private sampleSizeThreshold = 100000; // Use sampling for datasets > 100k rows

  constructor(csvData: any[], datasetName: string = 'dataset') {
    this.context = this.buildReliableContext(csvData, datasetName);
  }

  /**
   * Main query processing method - designed for reliability and performance
   */
  async processQuery(
    userQuery: string,
    conversationHistory: Message[] = []
  ): Promise<ChatResponse> {
    const startTime = Date.now();
    let cacheHit = false;

    try {
      // Step 1: Check cache for identical queries
      const cacheKey = this.generateCacheKey(userQuery);
      if (this.queryCache.has(cacheKey)) {
        cacheHit = true;
        const cachedResult = this.queryCache.get(cacheKey);
        
        return {
          ...cachedResult,
          performanceInfo: {
            processingTime: Date.now() - startTime,
            rowsAnalyzed: cachedResult.performanceInfo.rowsAnalyzed,
            cacheHit: true
          }
        };
      }

      // Step 2: Parse query intent with high confidence requirements
      const intent = this.parseQueryIntent(userQuery);

      // Step 3: If confidence is too low, request clarification
      if (intent.confidence < 0.75 || intent.needsClarification) {
        return this.createClarificationResponse(intent, userQuery, startTime);
      }

      // Step 4: Execute reliable analysis
      const analysisResult = await this.executeReliableAnalysis(intent);

      // Step 5: Generate response
      const response = this.generateReliableResponse(intent, analysisResult, userQuery);

      const finalResponse: ChatResponse = {
        message: response.message,
        htmlContent: response.htmlContent,
        confidence: intent.confidence,
        executedAnalysis: true,
        analysisResults: analysisResult,
        suggestedActions: this.generateSuggestedActions(intent, analysisResult),
        clarificationQuestions: [],
        performanceInfo: {
          processingTime: Date.now() - startTime,
          rowsAnalyzed: this.getRowsAnalyzed(intent),
          cacheHit: false
        }
      };

      // Cache successful results
      this.cacheResult(cacheKey, finalResponse);
      this.updatePerformanceMetrics(Date.now() - startTime);

      return finalResponse;

    } catch (error) {
      console.error('ReliableChatSystem error:', error);
      
      return {
        message: `I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try a simpler query or check your data format.`,
        confidence: 0,
        executedAnalysis: false,
        suggestedActions: [
          'Try asking about outliers in a specific column',
          'Ask for a data summary',
          'Request budget variance analysis'
        ],
        clarificationQuestions: ['What specific analysis would you like me to perform?'],
        performanceInfo: {
          processingTime: Date.now() - startTime,
          rowsAnalyzed: 0,
          cacheHit: false
        }
      };
    }
  }

  /**
   * Parse user intent with strict confidence requirements
   */
  private parseQueryIntent(userQuery: string): QueryIntent {
    const query = userQuery.toLowerCase().trim();
    let confidence = 0;
    let analysisType: QueryIntent['analysisType'] = 'general';
    let requiredColumns: string[] = [];
    let needsClarification = false;
    let clarificationReason = '';

    // High-confidence pattern matching
    const patterns = {
      outlier: {
        regex: /\b(outlier|anomal|unusual|spike|extreme|abnormal)\b/,
        confidence: 0.9,
        requiredColumns: ['date', 'numeric']
      },
      variance: {
        regex: /\b(budget|variance|actual|vs|against|performance)\b/,
        confidence: 0.9,
        requiredColumns: ['budget', 'actual']
      },
      trend: {
        regex: /\b(trend|over time|pattern|temporal|growth|decline)\b/,
        confidence: 0.8,
        requiredColumns: ['date', 'numeric']
      },
      contribution: {
        regex: /\b(contribution|breakdown|percentage|share|distribution)\b/,
        confidence: 0.8,
        requiredColumns: ['categorical', 'numeric']
      }
    };

    // Determine analysis type and confidence
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.regex.test(query)) {
        analysisType = type as QueryIntent['analysisType'];
        confidence = pattern.confidence;
        requiredColumns = pattern.requiredColumns;
        break;
      }
    }

    // Validate column availability
    const missingColumns = this.validateRequiredColumns(requiredColumns);
    if (missingColumns.length > 0) {
      needsClarification = true;
      clarificationReason = `Missing required columns: ${missingColumns.join(', ')}`;
      confidence = Math.max(0, confidence - 0.3);
    }

    // Check for vague queries
    if (query.length < 10 || /\b(show|what|how|analyze|data)\b/.test(query)) {
      if (confidence < 0.8) {
        needsClarification = true;
        clarificationReason = 'Query too vague - please be more specific';
        confidence = Math.max(0, confidence - 0.2);
      }
    }

    return {
      action: 'analyze',
      analysisType,
      confidence,
      requiredColumns,
      filters: {},
      needsClarification,
      clarificationReason
    };
  }

  /**
   * Execute analysis with reliability safeguards
   */
  private async executeReliableAnalysis(intent: QueryIntent): Promise<any> {
    const workingData = this.getWorkingDataset(intent);

    switch (intent.analysisType) {
      case 'outlier':
        return this.executeOutlierAnalysis(workingData, intent);
        
      case 'variance':
        return this.executeBudgetVarianceAnalysis(workingData, intent);
        
      default:
        throw new Error(`Analysis type '${intent.analysisType}' not implemented for reliability`);
    }
  }

  /**
   * Execute outlier detection with performance safeguards
   */
  private executeOutlierAnalysis(data: any[], intent: QueryIntent): any {
    const dateColumn = this.getBestColumn('date');
    const numericColumn = this.getBestColumn('numeric');
    const budgetColumn = this.getBestColumn('budget');

    if (!dateColumn || !numericColumn) {
      throw new Error('Missing required columns for outlier analysis');
    }

    // Prepare data efficiently
    const outlierData = data.map(row => ({
      date: row[dateColumn.name],
      actual: Number(row[numericColumn.name]) || 0,
      budget: budgetColumn ? (Number(row[budgetColumn.name]) || undefined) : undefined,
      label: `${row[numericColumn.name]}`
    })).filter(item => 
      !isNaN(new Date(item.date).getTime()) && 
      !isNaN(item.actual)
    );

    if (outlierData.length === 0) {
      throw new Error('No valid data points found for outlier analysis');
    }

    const params: OutlierDetectionParams = {
      data: outlierData,
      method: 'both',
      analysisTarget: budgetColumn ? 'variance' : 'actual',
      threshold: 2,
      iqrMultiplier: 1.5,
      columnMapping: {
        dateColumn: dateColumn.name,
        actualColumn: numericColumn.name,
        budgetColumn: budgetColumn?.name
      }
    };

    return calculateOutlierDetection(params);
  }

  /**
   * Execute budget variance analysis with validation
   */
  private executeBudgetVarianceAnalysis(data: any[], intent: QueryIntent): any {
    const budgetColumn = this.getBestColumn('budget');
    const actualColumn = this.getBestColumn('actual');

    if (!budgetColumn || !actualColumn) {
      throw new Error('Both budget and actual columns required for variance analysis');
    }

    // Prepare variance data efficiently
    const varianceData = data.map((row, index) => ({
      period: `Period ${index + 1}`,
      actual: Number(row[actualColumn.name]) || 0,
      budget: Number(row[budgetColumn.name]) || 0
    })).filter(item => 
      item.actual !== 0 && item.budget !== 0
    );

    if (varianceData.length === 0) {
      throw new Error('No valid budget/actual pairs found');
    }

    const params: BudgetVarianceArgs = {
      data: varianceData,
      metricName: actualColumn.name,
      analysisType: 'both'
    };

    return calculateBudgetVariance(params);
  }

  /**
   * Generate reliable response with consistent formatting
   */
  private generateReliableResponse(
    intent: QueryIntent,
    analysisResult: any,
    originalQuery: string
  ): { message: string; htmlContent?: string } {
    let message = `## Analysis Results\n\n`;
    message += `**Query:** ${originalQuery}\n`;
    message += `**Analysis Type:** ${intent.analysisType}\n`;
    message += `**Confidence:** ${(intent.confidence * 100).toFixed(0)}%\n\n`;

    // Add analysis-specific insights
    switch (intent.analysisType) {
      case 'outlier':
        message += this.formatOutlierResults(analysisResult);
        break;
        
      case 'variance':
        message += this.formatVarianceResults(analysisResult);
        break;
    }

    return {
      message,
      htmlContent: analysisResult.htmlOutput || undefined
    };
  }

  /**
   * Format outlier analysis results
   */
  private formatOutlierResults(result: any): string {
    if (result.error) {
      return `❌ **Error:** ${result.error}\n`;
    }

    let output = `### 🔍 Outlier Detection Results\n\n`;
    output += `- **Total Data Points:** ${result.totalDataPoints}\n`;
    output += `- **Outliers Found:** ${result.outlierCount} (${(result.outlierCount / result.totalDataPoints * 100).toFixed(1)}%)\n`;
    output += `- **Risk Level:** ${result.summary.riskLevel.toUpperCase()}\n`;
    output += `- **Assessment:** ${result.summary.overallAssessment}\n\n`;

    if (result.outlierCount > 0) {
      output += `**Outlier Breakdown:**\n`;
      output += `- Upper outliers: ${result.summary.upperOutliers}\n`;
      output += `- Lower outliers: ${result.summary.lowerOutliers}\n`;
      output += `- Extreme outliers: ${result.summary.extremeOutliers}\n\n`;
    }

    return output;
  }

  /**
   * Format budget variance results
   */
  private formatVarianceResults(result: any): string {
    if (result.error) {
      return `❌ **Error:** ${result.error}\n`;
    }

    let output = `### 💰 Budget Variance Analysis\n\n`;
    output += `- **Overall Variance:** ${result.summary.overallPercentageVariance.toFixed(1)}%\n`;
    output += `- **Performance Score:** ${result.summary.performanceScore.toFixed(0)}/100\n`;
    output += `- **Favorable Periods:** ${result.summary.favorablePeriods}\n`;
    output += `- **Unfavorable Periods:** ${result.summary.unfavorablePeriods}\n\n`;

    return output;
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private buildReliableContext(csvData: any[], datasetName: string): ReliableDataContext {
    if (!csvData || csvData.length === 0) {
      throw new Error('CSV data cannot be empty');
    }

    const totalRows = csvData.length;
    const sampleSize = Math.min(totalRows, this.sampleSizeThreshold);
    const workingData = totalRows > this.sampleSizeThreshold 
      ? this.createStatisticalSample(csvData, sampleSize)
      : csvData;

    const columns = Object.keys(csvData[0]);
    const columnAnalysis = this.analyzeColumns(workingData, columns);

    return {
      data: workingData,
      columns,
      totalRows,
      sampleSize,
      datasetName,
      columnAnalysis,
      performanceMetrics: {
        lastQueryTime: 0,
        averageQueryTime: 0,
        totalQueries: 0
      }
    };
  }

  private analyzeColumns(data: any[], columns: string[]): ColumnAnalysis {
    const dateColumns: ColumnInfo[] = [];
    const numericColumns: ColumnInfo[] = [];
    const categoricalColumns: ColumnInfo[] = [];
    const potentialBudgetColumns: ColumnInfo[] = [];
    const potentialActualColumns: ColumnInfo[] = [];

    columns.forEach(column => {
      const columnInfo = this.analyzeColumn(data, column);
      
      switch (columnInfo.type) {
        case 'date':
          dateColumns.push(columnInfo);
          break;
        case 'numeric':
          numericColumns.push(columnInfo);
          
          // Check for budget/actual patterns
          const lowerName = column.toLowerCase();
          if (lowerName.includes('budget') || lowerName.includes('planned') || lowerName.includes('target')) {
            potentialBudgetColumns.push(columnInfo);
          }
          if (lowerName.includes('actual') || lowerName.includes('real') || lowerName.includes('result')) {
            potentialActualColumns.push(columnInfo);
          }
          break;
        case 'categorical':
          categoricalColumns.push(columnInfo);
          break;
      }
    });

    return {
      dateColumns: dateColumns.sort((a, b) => b.confidence - a.confidence),
      numericColumns: numericColumns.sort((a, b) => b.confidence - a.confidence),
      categoricalColumns: categoricalColumns.sort((a, b) => b.confidence - a.confidence),
      potentialBudgetColumns: potentialBudgetColumns.sort((a, b) => b.confidence - a.confidence),
      potentialActualColumns: potentialActualColumns.sort((a, b) => b.confidence - a.confidence)
    };
  }

  private analyzeColumn(data: any[], columnName: string): ColumnInfo {
    const sampleValues = data.slice(0, 50).map(row => row[columnName]);
    const nonNullValues = sampleValues.filter(val => val !== null && val !== undefined && val !== '');
    const nullCount = sampleValues.length - nonNullValues.length;
    const uniqueCount = new Set(nonNullValues).size;

    // Date detection
    const dateCount = nonNullValues.filter(val => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }).length;

    if (dateCount >= nonNullValues.length * 0.8) {
      return {
        name: columnName,
        type: 'date',
        confidence: dateCount / nonNullValues.length,
        sampleValues: nonNullValues.slice(0, 5),
        nullCount,
        uniqueCount
      };
    }

    // Numeric detection
    const numericCount = nonNullValues.filter(val => {
      return !isNaN(Number(val));
    }).length;

    if (numericCount >= nonNullValues.length * 0.9) {
      return {
        name: columnName,
        type: 'numeric',
        confidence: numericCount / nonNullValues.length,
        sampleValues: nonNullValues.slice(0, 5),
        nullCount,
        uniqueCount
      };
    }

    // Default to categorical
    return {
      name: columnName,
      type: 'categorical',
      confidence: 0.8,
      sampleValues: nonNullValues.slice(0, 5),
      nullCount,
      uniqueCount
    };
  }

  private createStatisticalSample(data: any[], sampleSize: number): any[] {
    // Use systematic sampling for large datasets
    const step = Math.floor(data.length / sampleSize);
    const sample: any[] = [];
    
    for (let i = 0; i < data.length; i += step) {
      if (sample.length >= sampleSize) break;
      sample.push(data[i]);
    }
    
    return sample;
  }

  private getBestColumn(type: 'date' | 'numeric' | 'categorical' | 'budget' | 'actual'): ColumnInfo | undefined {
    const analysis = this.context.columnAnalysis;
    
    switch (type) {
      case 'date':
        return analysis.dateColumns[0];
      case 'numeric':
        return analysis.numericColumns[0];
      case 'categorical':
        return analysis.categoricalColumns[0];
      case 'budget':
        return analysis.potentialBudgetColumns[0];
      case 'actual':
        return analysis.potentialActualColumns[0];
    }
  }

  private validateRequiredColumns(requiredTypes: string[]): string[] {
    const missing: string[] = [];
    
    requiredTypes.forEach(type => {
      if (!this.getBestColumn(type as any)) {
        missing.push(type);
      }
    });
    
    return missing;
  }

  private getWorkingDataset(intent: QueryIntent): any[] {
    // For reliability, always use the pre-processed context data
    return this.context.data;
  }

  private getRowsAnalyzed(intent: QueryIntent): number {
    return this.context.sampleSize;
  }

  private createClarificationResponse(
    intent: QueryIntent, 
    originalQuery: string, 
    startTime: number
  ): ChatResponse {
    const questions = this.generateClarificationQuestions(intent);
    
    let message = `I need clarification to provide accurate analysis:\n\n`;
    message += `**Your Query:** ${originalQuery}\n`;
    message += `**Issue:** ${intent.clarificationReason}\n\n`;
    message += `**Questions:**\n`;
    questions.forEach((q, i) => {
      message += `${i + 1}. ${q}\n`;
    });

    message += `\n**Available Data:**\n`;
    message += `- ${this.context.totalRows} total rows\n`;
    message += `- Date columns: ${this.context.columnAnalysis.dateColumns.map(c => c.name).join(', ') || 'None'}\n`;
    message += `- Numeric columns: ${this.context.columnAnalysis.numericColumns.map(c => c.name).slice(0, 3).join(', ')}\n`;
    message += `- Budget columns: ${this.context.columnAnalysis.potentialBudgetColumns.map(c => c.name).join(', ') || 'None detected'}\n`;

    return {
      message,
      confidence: intent.confidence,
      executedAnalysis: false,
      suggestedActions: [
        'Ask about outliers in a specific column',
        'Request budget vs actual variance analysis',
        'Ask for a data overview'
      ],
      clarificationQuestions: questions,
      performanceInfo: {
        processingTime: Date.now() - startTime,
        rowsAnalyzed: 0,
        cacheHit: false
      }
    };
  }

  private generateClarificationQuestions(intent: QueryIntent): string[] {
    const questions: string[] = [];
    
    if (intent.analysisType === 'general') {
      questions.push('What type of analysis would you like: outlier detection, budget variance, or data exploration?');
    }
    
    if (intent.requiredColumns.includes('date') && this.context.columnAnalysis.dateColumns.length === 0) {
      questions.push('No date columns were detected. Which column contains your date/time information?');
    }
    
    if (intent.requiredColumns.includes('budget') && this.context.columnAnalysis.potentialBudgetColumns.length === 0) {
      questions.push('Which column contains your budget or planned values?');
    }
    
    if (intent.requiredColumns.includes('actual') && this.context.columnAnalysis.potentialActualColumns.length === 0) {
      questions.push('Which column contains your actual values?');
    }

    return questions;
  }

  private generateSuggestedActions(intent: QueryIntent, analysisResult: any): string[] {
    const actions: string[] = [];
    
    switch (intent.analysisType) {
      case 'outlier':
        if (analysisResult.outlierCount > 0) {
          actions.push('Investigate the specific dates with outliers');
          actions.push('Analyze outlier patterns by category');
        }
        actions.push('Set up outlier monitoring alerts');
        break;
        
      case 'variance':
        actions.push('Identify periods with highest variance');
        actions.push('Analyze variance trends over time');
        actions.push('Review budget planning assumptions');
        break;
    }
    
    return actions;
  }

  private generateCacheKey(query: string): string {
    return `query_${query.toLowerCase().trim().replace(/\s+/g, '_').substring(0, 100)}`;
  }

  private cacheResult(key: string, result: ChatResponse): void {
    if (this.queryCache.size >= this.maxCacheSize) {
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey) {
        this.queryCache.delete(firstKey);
      }
    }
    
    this.queryCache.set(key, {
      ...result,
      performanceInfo: {
        ...result.performanceInfo,
        cacheHit: false
      }
    });
  }

  private updatePerformanceMetrics(processingTime: number): void {
    const metrics = this.context.performanceMetrics;
    metrics.totalQueries++;
    metrics.lastQueryTime = processingTime;
    metrics.averageQueryTime = 
      (metrics.averageQueryTime * (metrics.totalQueries - 1) + processingTime) / metrics.totalQueries;
  }

  /**
   * Get system status and performance information
   */
  getSystemStatus(): {
    datasetInfo: any;
    performanceMetrics: any;
    cacheInfo: any;
  } {
    return {
      datasetInfo: {
        name: this.context.datasetName,
        totalRows: this.context.totalRows,
        workingRows: this.context.sampleSize,
        columns: this.context.columns.length,
        usingStatisticalSample: this.context.totalRows > this.sampleSizeThreshold
      },
      performanceMetrics: this.context.performanceMetrics,
      cacheInfo: {
        size: this.queryCache.size,
        maxSize: this.maxCacheSize
      }
    };
  }
}
