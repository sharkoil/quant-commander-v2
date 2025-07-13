// Outlier Detection Analyzer - Statistical Anomaly Detection for Financial Data
// Implements IQR and Z-Score methods for identifying data outliers

export interface OutlierDataPoint {
  date: string | Date;
  actual: number;
  budget?: number;
  forecast?: number;
  label?: string; // Optional identifier
  [key: string]: string | number | Date | undefined; // Flexible for CSV data
}

export interface FlexibleOutlierData {
  [key: string]: string | number | Date; // Raw CSV row data
}

export interface OutlierDetectionParams {
  data: OutlierDataPoint[];
  method: 'iqr' | 'zscore' | 'both';
  threshold?: number; // Z-score threshold (default: 2)
  iqrMultiplier?: number; // IQR multiplier (default: 1.5)
  columnMapping?: {
    dateColumn: string;
    actualColumn: string;
    budgetColumn?: string;
    forecastColumn?: string;
    labelColumn?: string;
  };
  analysisTarget: 'actual' | 'variance' | 'budget'; // What to analyze for outliers
}

export interface OutlierResult {
  dataPoint: OutlierDataPoint;
  type: 'upper' | 'lower';
  method: 'iqr' | 'zscore' | 'both';
  severity: 'mild' | 'moderate' | 'extreme';
  value: number;
  analysisValue: number; // The actual value that was flagged (could be variance)
  deviation: number;
  zScore?: number;
  iqrDeviation?: number;
  percentile: number;
  emoji: string;
  description: string;
}

export interface OutlierDetectionAnalysis {
  method: string;
  totalDataPoints: number;
  outlierCount: number;
  outliersFound: OutlierResult[];
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    q1: number;
    q3: number;
    iqr: number;
    lowerBound: number;
    upperBound: number;
    zScoreThreshold: number;
  };
  summary: {
    upperOutliers: number;
    lowerOutliers: number;
    mildOutliers: number;
    moderateOutliers: number;
    extremeOutliers: number;
    overallAssessment: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  htmlOutput: string;
  scatterPlotData: {
    dates: string[];
    values: number[];
    outlierDates: string[];
    outlierValues: number[];
    outlierTypes: string[];
  };
}

/**
 * Main outlier detection function
 * Analyzes financial data to identify statistical anomalies
 */
export function calculateOutlierDetection(params: OutlierDetectionParams): OutlierDetectionAnalysis {
  try {
    // Step 1: Validate and preprocess data
    const cleanData = preprocessOutlierData(params.data, params);
    
    if (cleanData.length === 0) {
      throw new Error('No valid data points for outlier analysis');
    }

    // Step 2: Extract analysis values based on target
    const analysisValues = extractAnalysisValues(cleanData, params.analysisTarget);
    
    // Step 3: Calculate statistical measures
    const statistics = calculateStatistics(analysisValues);
    
    // Step 4: Detect outliers using specified method(s)
    const outliers = detectOutliers(cleanData, analysisValues, params, statistics);
    
    // Step 5: Generate analysis summary
    const summary = generateOutlierSummary(outliers, cleanData.length);
    
    // Step 6: Prepare scatter plot data
    const scatterPlotData = prepareScatterPlotData(cleanData, outliers, params);
    
    // Step 7: Generate HTML output
    const htmlOutput = generateOutlierHTML(outliers, statistics, summary, params);
    
    return {
      method: params.method,
      totalDataPoints: cleanData.length,
      outlierCount: outliers.length,
      outliersFound: outliers,
      statistics,
      summary,
      htmlOutput,
      scatterPlotData
    };

  } catch (error) {
    return {
      method: params.method,
      totalDataPoints: 0,
      outlierCount: 0,
      outliersFound: [],
      statistics: {
        mean: 0, median: 0, standardDeviation: 0,
        q1: 0, q3: 0, iqr: 0,
        lowerBound: 0, upperBound: 0, zScoreThreshold: 0
      },
      summary: {
        upperOutliers: 0, lowerOutliers: 0,
        mildOutliers: 0, moderateOutliers: 0, extremeOutliers: 0,
        overallAssessment: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        riskLevel: 'low'
      },
      htmlOutput: `<div style="color: red;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</div>`,
      scatterPlotData: {
        dates: [], values: [], outlierDates: [], outlierValues: [], outlierTypes: []
      }
    };
  }
}

/**
 * Preprocess and clean data for outlier analysis
 */
function preprocessOutlierData(data: OutlierDataPoint[], params: OutlierDetectionParams): OutlierDataPoint[] {
  return data.filter(point => {
    // Remove rows with invalid actual values
    if (typeof point.actual !== 'number' || isNaN(point.actual)) return false;
    
    // Remove rows with invalid dates
    const date = point.date instanceof Date ? point.date : new Date(String(point.date));
    if (isNaN(date.getTime())) return false;
    
    // For variance analysis, ensure budget exists
    if (params.analysisTarget === 'variance' || params.analysisTarget === 'budget') {
      if (typeof point.budget !== 'number' || isNaN(point.budget)) return false;
    }
    
    return true;
  });
}

/**
 * Extract values for analysis based on target type
 */
function extractAnalysisValues(data: OutlierDataPoint[], target: 'actual' | 'variance' | 'budget'): number[] {
  return data.map(point => {
    switch (target) {
      case 'actual':
        return point.actual;
      case 'budget':
        return point.budget || 0;
      case 'variance':
        return point.actual - (point.budget || 0); // Calculate variance
      default:
        return point.actual;
    }
  });
}

/**
 * Calculate comprehensive statistical measures
 */
function calculateStatistics(values: number[]): OutlierDetectionAnalysis['statistics'] {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  // Basic statistics
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const median = n % 2 === 0 
    ? (sorted[Math.floor(n / 2) - 1] + sorted[Math.floor(n / 2)]) / 2
    : sorted[Math.floor(n / 2)];
  
  // Standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const standardDeviation = Math.sqrt(variance);
  
  // Quartiles for IQR method
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  // Outlier bounds
  const lowerBound = q1 - (1.5 * iqr);
  const upperBound = q3 + (1.5 * iqr);
  
  return {
    mean,
    median,
    standardDeviation,
    q1,
    q3,
    iqr,
    lowerBound,
    upperBound,
    zScoreThreshold: 2 // Default threshold
  };
}

/**
 * Detect outliers using IQR and/or Z-score methods
 */
function detectOutliers(
  data: OutlierDataPoint[], 
  analysisValues: number[], 
  params: OutlierDetectionParams,
  statistics: OutlierDetectionAnalysis['statistics']
): OutlierResult[] {
  const outliers: OutlierResult[] = [];
  const threshold = params.threshold || 2;
  const iqrMultiplier = params.iqrMultiplier || 1.5;
  
  data.forEach((point, index) => {
    const analysisValue = analysisValues[index];
    const actualValue = params.analysisTarget === 'actual' ? point.actual : 
                       params.analysisTarget === 'budget' ? (point.budget || 0) :
                       point.actual - (point.budget || 0); // variance
    
    let isOutlier = false;
    let method: 'iqr' | 'zscore' | 'both' = params.method;
    let zScore: number | undefined;
    let iqrDeviation: number | undefined;
    
    // Z-score method
    if (params.method === 'zscore' || params.method === 'both') {
      zScore = (analysisValue - statistics.mean) / statistics.standardDeviation;
      if (Math.abs(zScore) > threshold) {
        isOutlier = true;
      }
    }
    
    // IQR method
    if (params.method === 'iqr' || params.method === 'both') {
      const lowerBound = statistics.q1 - (iqrMultiplier * statistics.iqr);
      const upperBound = statistics.q3 + (iqrMultiplier * statistics.iqr);
      
      if (analysisValue < lowerBound || analysisValue > upperBound) {
        isOutlier = true;
        iqrDeviation = analysisValue < lowerBound ? 
          lowerBound - analysisValue : 
          analysisValue - upperBound;
      }
    }
    
    if (isOutlier) {
      const type: 'upper' | 'lower' = analysisValue > statistics.mean ? 'upper' : 'lower';
      const deviation = Math.abs(analysisValue - statistics.mean);
      const percentile = calculatePercentile(analysisValue, analysisValues);
      
      // Determine severity
      let severity: 'mild' | 'moderate' | 'extreme';
      if (zScore && Math.abs(zScore) > 3) {
        severity = 'extreme';
      } else if (zScore && Math.abs(zScore) > 2.5) {
        severity = 'moderate';
      } else {
        severity = 'mild';
      }
      
      outliers.push({
        dataPoint: point,
        type,
        method: params.method === 'both' ? 'both' : params.method,
        severity,
        value: actualValue,
        analysisValue,
        deviation,
        zScore,
        iqrDeviation,
        percentile,
        emoji: getOutlierEmoji(type, severity),
        description: generateOutlierDescription(point, type, severity, params.analysisTarget)
      });
    }
  });
  
  return outliers.sort((a, b) => b.deviation - a.deviation); // Sort by most severe first
}

/**
 * Calculate percentile rank for a value
 */
function calculatePercentile(value: number, allValues: number[]): number {
  const sorted = [...allValues].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  return index === -1 ? 100 : (index / sorted.length) * 100;
}

/**
 * Get appropriate emoji for outlier type and severity
 */
function getOutlierEmoji(type: 'upper' | 'lower', severity: 'mild' | 'moderate' | 'extreme'): string {
  if (type === 'upper') {
    switch (severity) {
      case 'extreme': return '🚨';
      case 'moderate': return '⚠️';
      case 'mild': return '📈';
    }
  } else {
    switch (severity) {
      case 'extreme': return '💥';
      case 'moderate': return '⚠️';
      case 'mild': return '📉';
    }
  }
  return '❓';
}

/**
 * Generate description for outlier
 */
function generateOutlierDescription(
  point: OutlierDataPoint, 
  type: 'upper' | 'lower', 
  severity: 'mild' | 'moderate' | 'extreme',
  target: 'actual' | 'variance' | 'budget'
): string {
  const date = point.date instanceof Date ? point.date.toISOString().split('T')[0] : String(point.date);
  const typeDesc = type === 'upper' ? 'above normal' : 'below normal';
  const severityDesc = severity === 'extreme' ? 'extremely' : severity === 'moderate' ? 'significantly' : 'notably';
  const targetDesc = target === 'variance' ? 'variance' : target === 'budget' ? 'budget' : 'actual values';
  
  return `${date}: ${severityDesc} ${typeDesc} ${targetDesc}`;
}

/**
 * Generate summary statistics for outlier analysis
 */
function generateOutlierSummary(outliers: OutlierResult[], totalPoints: number): OutlierDetectionAnalysis['summary'] {
  const upperOutliers = outliers.filter(o => o.type === 'upper').length;
  const lowerOutliers = outliers.filter(o => o.type === 'lower').length;
  const mildOutliers = outliers.filter(o => o.severity === 'mild').length;
  const moderateOutliers = outliers.filter(o => o.severity === 'moderate').length;
  const extremeOutliers = outliers.filter(o => o.severity === 'extreme').length;
  
  const outlierPercentage = (outliers.length / totalPoints) * 100;
  
  let overallAssessment: string;
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  if (outlierPercentage < 2) {
    overallAssessment = 'Data quality is excellent with minimal outliers';
    riskLevel = 'low';
  } else if (outlierPercentage < 5) {
    overallAssessment = 'Good data quality with some outliers requiring attention';
    riskLevel = 'medium';
  } else if (outlierPercentage < 10) {
    overallAssessment = 'Moderate outlier presence suggests data quality issues';
    riskLevel = 'high';
  } else {
    overallAssessment = 'High outlier frequency indicates significant data quality concerns';
    riskLevel = 'critical';
  }
  
  return {
    upperOutliers,
    lowerOutliers,
    mildOutliers,
    moderateOutliers,
    extremeOutliers,
    overallAssessment,
    riskLevel
  };
}

/**
 * Prepare data for scatter plot visualization
 */
function prepareScatterPlotData(
  data: OutlierDataPoint[], 
  outliers: OutlierResult[], 
  params: OutlierDetectionParams
): OutlierDetectionAnalysis['scatterPlotData'] {
  const dates = data.map(point => {
    const date = point.date instanceof Date ? point.date : new Date(String(point.date));
    return date.toISOString().split('T')[0];
  });
  
  const values = data.map(point => {
    switch (params.analysisTarget) {
      case 'actual': return point.actual;
      case 'budget': return point.budget || 0;
      case 'variance': return point.actual - (point.budget || 0);
      default: return point.actual;
    }
  });
  
  const outlierDates = outliers.map(outlier => {
    const date = outlier.dataPoint.date instanceof Date ? 
      outlier.dataPoint.date : new Date(String(outlier.dataPoint.date));
    return date.toISOString().split('T')[0];
  });
  
  const outlierValues = outliers.map(outlier => outlier.analysisValue);
  const outlierTypes = outliers.map(outlier => `${outlier.type}-${outlier.severity}`);
  
  return {
    dates,
    values,
    outlierDates,
    outlierValues,
    outlierTypes
  };
}

/**
 * Generate HTML output for outlier detection analysis
 */
function generateOutlierHTML(
  outliers: OutlierResult[],
  statistics: OutlierDetectionAnalysis['statistics'],
  summary: OutlierDetectionAnalysis['summary'],
  params: OutlierDetectionParams
): string {
  const methodName = params.method === 'both' ? 'IQR & Z-Score' : 
                    params.method === 'iqr' ? 'IQR Method' : 'Z-Score Method';
  
  const targetName = params.analysisTarget === 'variance' ? 'Variance Analysis' :
                    params.analysisTarget === 'budget' ? 'Budget Analysis' : 'Actual Values';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; color: white;">
        <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">🔍 Outlier Detection Analysis</h2>
        <p style="margin: 0; font-size: 16px; opacity: 0.9;">${methodName} • ${targetName}</p>
      </div>

      <!-- Summary Statistics Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px;">
        
        <div style="background: ${summary.riskLevel === 'low' ? '#f0fdf4' : summary.riskLevel === 'medium' ? '#fffbeb' : summary.riskLevel === 'high' ? '#fef2f2' : '#7f1d1d'}; 
                    border: 2px solid ${summary.riskLevel === 'low' ? '#22c55e' : summary.riskLevel === 'medium' ? '#f59e0b' : summary.riskLevel === 'high' ? '#ef4444' : '#dc2626'}; 
                    border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 14px; color: #6b7280; font-weight: 500; margin-bottom: 8px;">Risk Level</div>
          <div style="font-size: 24px; font-weight: 700; color: ${summary.riskLevel === 'low' ? '#16a34a' : summary.riskLevel === 'medium' ? '#d97706' : summary.riskLevel === 'high' ? '#dc2626' : '#ffffff'};">
            ${summary.riskLevel.toUpperCase()}
          </div>
        </div>

        <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 14px; color: #6b7280; font-weight: 500; margin-bottom: 8px;">Total Outliers</div>
          <div style="font-size: 24px; font-weight: 700; color: #1f2937;">
            ${outliers.length}
          </div>
        </div>

        <div style="background: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 14px; color: #6b7280; font-weight: 500; margin-bottom: 8px;">Upper Outliers</div>
          <div style="font-size: 24px; font-weight: 700; color: #dc2626;">
            📈 ${summary.upperOutliers}
          </div>
        </div>

        <div style="background: #eff6ff; border: 2px solid #93c5fd; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 14px; color: #6b7280; font-weight: 500; margin-bottom: 8px;">Lower Outliers</div>
          <div style="font-size: 24px; font-weight: 700; color: #2563eb;">
            📉 ${summary.lowerOutliers}
          </div>
        </div>

      </div>

      <!-- Statistical Summary -->
      <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937;">📊 Statistical Summary</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px;">
          <div>
            <div style="font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 4px;">Mean</div>
            <div style="font-size: 16px; font-weight: 600; color: #1f2937;">${formatNumber(statistics.mean)}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 4px;">Median</div>
            <div style="font-size: 16px; font-weight: 600; color: #1f2937;">${formatNumber(statistics.median)}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 4px;">Std Dev</div>
            <div style="font-size: 16px; font-weight: 600; color: #1f2937;">${formatNumber(statistics.standardDeviation)}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 4px;">Q1</div>
            <div style="font-size: 16px; font-weight: 600; color: #1f2937;">${formatNumber(statistics.q1)}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 4px;">Q3</div>
            <div style="font-size: 16px; font-weight: 600; color: #1f2937;">${formatNumber(statistics.q3)}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280; font-weight: 500; margin-bottom: 4px;">IQR</div>
            <div style="font-size: 16px; font-weight: 600; color: #1f2937;">${formatNumber(statistics.iqr)}</div>
          </div>
        </div>
      </div>

      <!-- Outlier Details -->
      ${outliers.length > 0 ? `
        <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1f2937;">🚨 Detected Outliers</h3>
          <div style="display: grid; gap: 12px;">
            ${outliers.slice(0, 10).map((outlier, index) => `
              <div style="background: ${outlier.type === 'upper' ? '#fef2f2' : '#eff6ff'}; 
                          border: 1px solid ${outlier.type === 'upper' ? '#fca5a5' : '#93c5fd'}; 
                          border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                  <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                    ${outlier.emoji} ${outlier.description}
                  </div>
                  <div style="font-size: 14px; color: #6b7280;">
                    Value: ${formatNumber(outlier.value)} • 
                    Deviation: ${formatNumber(outlier.deviation)} • 
                    Severity: ${outlier.severity} • 
                    Percentile: ${outlier.percentile.toFixed(1)}%
                    ${outlier.zScore ? ` • Z-Score: ${outlier.zScore.toFixed(2)}` : ''}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 20px; font-weight: 700; color: ${outlier.type === 'upper' ? '#dc2626' : '#2563eb'};">
                    ${formatNumber(outlier.analysisValue)}
                  </div>
                </div>
              </div>
            `).join('')}
            ${outliers.length > 10 ? `
              <div style="text-align: center; padding: 16px; color: #6b7280; font-style: italic;">
                ... and ${outliers.length - 10} more outliers
              </div>
            ` : ''}
          </div>
        </div>
      ` : `
        <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #16a34a;">No Outliers Detected</h3>
          <p style="margin: 0; color: #16a34a;">Your data shows excellent consistency with no statistical anomalies.</p>
        </div>
      `}

      <!-- Assessment Summary -->
      <div style="background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937;">🎯 Assessment Summary</h3>
        <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #4b5563;">
          <strong>${summary.overallAssessment}</strong>
        </p>
        <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
          <div style="text-align: center;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Mild Outliers</div>
            <div style="font-size: 18px; font-weight: 600; color: #f59e0b;">📈 ${summary.mildOutliers}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Moderate Outliers</div>
            <div style="font-size: 18px; font-weight: 600; color: #dc2626;">⚠️ ${summary.moderateOutliers}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Extreme Outliers</div>
            <div style="font-size: 18px; font-weight: 600; color: #7f1d1d;">🚨 ${summary.extremeOutliers}</div>
          </div>
        </div>
      </div>

    </div>
  `;
}

/**
 * Helper function to format numbers for display
 */
function formatNumber(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  } else {
    return value.toFixed(2);
  }
}

/**
 * Create default outlier detection suggestions for CSV data
 */
export function generateDefaultOutlierSuggestions(data: FlexibleOutlierData[]): OutlierDetectionParams[] {
  if (data.length === 0) return [];

  const suggestions: OutlierDetectionParams[] = [];
  const columns = Object.keys(data[0] || {});
  
  // Find potential numeric columns
  const numericColumns = columns.filter(col => {
    const sampleValues = data.slice(0, 10).map(row => row[col]);
    const numericCount = sampleValues.filter(val => !isNaN(Number(val)) && val !== null && val !== '').length;
    return numericCount >= 5;
  });

  // Find potential date columns
  const dateColumns = columns.filter(col => {
    const sampleValues = data.slice(0, 5).map(row => String(row[col]));
    const dateCount = sampleValues.filter(val => !isNaN(new Date(val).getTime())).length;
    return dateCount >= 3;
  });

  // Find budget-like and actual-like columns
  const budgetColumns = numericColumns.filter(col => 
    col.toLowerCase().includes('budget') || 
    col.toLowerCase().includes('planned') || 
    col.toLowerCase().includes('target')
  );
  
  const actualColumns = numericColumns.filter(col => 
    col.toLowerCase().includes('actual') || 
    col.toLowerCase().includes('real') || 
    col.toLowerCase().includes('result')
  );

  if (dateColumns.length > 0 && actualColumns.length > 0) {
    // Convert flexible data to outlier data format
    const outlierData: OutlierDataPoint[] = data.map(row => ({
      date: String(row[dateColumns[0]]),
      actual: Number(row[actualColumns[0]]) || 0,
      budget: budgetColumns.length > 0 ? Number(row[budgetColumns[0]]) || undefined : undefined,
      label: String(row[Object.keys(row)[0]] || '')
    }));

    // Suggestion 1: Actual values outlier detection
    suggestions.push({
      data: outlierData,
      method: 'both',
      analysisTarget: 'actual',
      columnMapping: {
        dateColumn: dateColumns[0],
        actualColumn: actualColumns[0],
        budgetColumn: budgetColumns[0]
      }
    });

    // Suggestion 2: Variance analysis (if budget exists)
    if (budgetColumns.length > 0) {
      suggestions.push({
        data: outlierData,
        method: 'both',
        analysisTarget: 'variance',
        columnMapping: {
          dateColumn: dateColumns[0],
          actualColumn: actualColumns[0],
          budgetColumn: budgetColumns[0]
        }
      });
    }
  }

  return suggestions;
}
