// Scatter Plot Visualization Component for Outlier Detection
// Displays actual values over time with highlighted outliers

import React, { useEffect, useRef } from 'react';

interface ScatterPlotData {
  dates: string[];
  values: number[];
  outlierDates: string[];
  outlierValues: number[];
  outlierTypes: string[];
}

interface ScatterPlotProps {
  data: ScatterPlotData;
  title?: string;
  width?: number;
  height?: number;
  analysisTarget?: 'actual' | 'variance' | 'budget';
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  title = 'Outlier Detection Analysis',
  width = 800,
  height = 400,
  analysisTarget = 'actual'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawScatterPlot();
  }, [data, width, height]);

  const drawScatterPlot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (data.dates.length === 0) return;

    // Set up dimensions with margins
    const margin = { top: 40, right: 60, bottom: 60, left: 80 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Calculate scales
    const allValues = [...data.values, ...data.outlierValues];
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const valueRange = maxValue - minValue;
    const padding = valueRange * 0.1; // 10% padding

    const yMin = minValue - padding;
    const yMax = maxValue + padding;

    // Convert dates to timestamps for x-axis scaling
    const timestamps = data.dates.map(date => new Date(date).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    // Helper functions for coordinate conversion
    const xScale = (timestamp: number) => 
      margin.left + ((timestamp - minTime) / (maxTime - minTime)) * plotWidth;
    
    const yScale = (value: number) => 
      margin.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;

    // Draw background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Draw plot area background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(margin.left, margin.top, plotWidth, plotHeight);

    // Draw grid lines
    drawGrid(ctx, margin, plotWidth, plotHeight, yMin, yMax);

    // Draw axes
    drawAxes(ctx, margin, plotWidth, plotHeight);

    // Draw data points
    drawDataPoints(ctx, data.dates, data.values, xScale, yScale, false);

    // Draw outlier points
    drawOutlierPoints(ctx, data.outlierDates, data.outlierValues, data.outlierTypes, xScale, yScale);

    // Draw trend line
    drawTrendLine(ctx, data.dates, data.values, xScale, yScale);

    // Draw labels and title
    drawLabels(ctx, title, margin, plotWidth, plotHeight, analysisTarget);

    // Draw legend
    drawLegend(ctx, width, margin);
  };

  const drawGrid = (
    ctx: CanvasRenderingContext2D, 
    margin: any, 
    plotWidth: number, 
    plotHeight: number, 
    yMin: number, 
    yMax: number
  ) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = margin.top + (i / ySteps) * plotHeight;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines (approximate - based on time intervals)
    const xSteps = 6;
    for (let i = 0; i <= xSteps; i++) {
      const x = margin.left + (i / xSteps) * plotWidth;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + plotHeight);
      ctx.stroke();
    }
  };

  const drawAxes = (ctx: CanvasRenderingContext2D, margin: any, plotWidth: number, plotHeight: number) => {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();
  };

  const drawDataPoints = (
    ctx: CanvasRenderingContext2D,
    dates: string[],
    values: number[],
    xScale: (timestamp: number) => number,
    yScale: (value: number) => number,
    isOutlier: boolean
  ) => {
    ctx.fillStyle = isOutlier ? '#dc2626' : '#3b82f6';
    
    dates.forEach((date, index) => {
      const timestamp = new Date(date).getTime();
      const x = xScale(timestamp);
      const y = yScale(values[index]);
      
      ctx.beginPath();
      ctx.arc(x, y, isOutlier ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const drawOutlierPoints = (
    ctx: CanvasRenderingContext2D,
    outlierDates: string[],
    outlierValues: number[],
    outlierTypes: string[],
    xScale: (timestamp: number) => number,
    yScale: (value: number) => number
  ) => {
    outlierDates.forEach((date, index) => {
      const timestamp = new Date(date).getTime();
      const x = xScale(timestamp);
      const y = yScale(outlierValues[index]);
      const type = outlierTypes[index];
      
      // Determine color based on outlier type and severity
      let color = '#dc2626'; // Default red
      let size = 8;
      
      if (type.includes('extreme')) {
        color = '#7f1d1d'; // Dark red for extreme
        size = 10;
      } else if (type.includes('moderate')) {
        color = '#dc2626'; // Red for moderate
        size = 8;
      } else if (type.includes('mild')) {
        color = '#f59e0b'; // Orange for mild
        size = 6;
      }
      
      // Draw outlier point with border
      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Add outlier indicator (triangle or exclamation)
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('!', x, y + 4);
    });
  };

  const drawTrendLine = (
    ctx: CanvasRenderingContext2D,
    dates: string[],
    values: number[],
    xScale: (timestamp: number) => number,
    yScale: (value: number) => number
  ) => {
    if (dates.length < 2) return;

    // Calculate simple linear trend
    const timestamps = dates.map(date => new Date(date).getTime());
    const n = dates.length;
    
    const sumX = timestamps.reduce((sum, t) => sum + t, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = timestamps.reduce((sum, t, i) => sum + t * values[i], 0);
    const sumXX = timestamps.reduce((sum, t) => sum + t * t, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Draw trend line
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const startTime = Math.min(...timestamps);
    const endTime = Math.max(...timestamps);
    const startValue = slope * startTime + intercept;
    const endValue = slope * endTime + intercept;
    
    ctx.beginPath();
    ctx.moveTo(xScale(startTime), yScale(startValue));
    ctx.lineTo(xScale(endTime), yScale(endValue));
    ctx.stroke();
    
    ctx.setLineDash([]); // Reset line dash
  };

  const drawLabels = (
    ctx: CanvasRenderingContext2D,
    title: string,
    margin: any,
    plotWidth: number,
    plotHeight: number,
    analysisTarget: string
  ) => {
    ctx.fillStyle = '#1f2937';
    
    // Title
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, margin.left + plotWidth / 2, 25);
    
    // Y-axis label
    ctx.save();
    ctx.translate(20, margin.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    const yLabel = analysisTarget === 'variance' ? 'Variance (Actual - Budget)' :
                   analysisTarget === 'budget' ? 'Budget Values' : 'Actual Values';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
    
    // X-axis label
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Date', margin.left + plotWidth / 2, height - 10);
  };

  const drawLegend = (ctx: CanvasRenderingContext2D, width: number, margin: any) => {
    const legendX = width - 150;
    const legendY = margin.top + 20;
    
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    // Normal points
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(legendX, legendY, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#374151';
    ctx.fillText('Normal Data', legendX + 15, legendY + 4);
    
    // Outlier points
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(legendX, legendY + 25, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('!', legendX, legendY + 25 + 3);
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'left';
    ctx.fillText('Outliers', legendX + 15, legendY + 25 + 4);
    
    // Trend line
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(legendX - 5, legendY + 50);
    ctx.lineTo(legendX + 10, legendY + 50);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#374151';
    ctx.fillText('Trend', legendX + 15, legendY + 50 + 4);
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded max-w-full h-auto"
      />
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>📊 Chart Interpretation:</strong></p>
        <ul className="mt-2 space-y-1">
          <li>• <span className="text-blue-600">Blue dots</span>: Normal data points following expected patterns</li>
          <li>• <span className="text-red-600">Red dots with "!"</span>: Statistical outliers requiring investigation</li>
          <li>• <span className="text-gray-600">Dashed line</span>: Overall trend direction</li>
          <li>• Larger outlier dots indicate more severe deviations from normal patterns</li>
        </ul>
      </div>
    </div>
  );
};

export default ScatterPlot;
