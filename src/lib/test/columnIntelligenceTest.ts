/**
 * Test the Column Intelligence System
 * Demonstrates automatic column detection and mapping
 */

import { processCSVWithIntelligence } from '../analyzers/csvProcessor';

export async function testColumnIntelligence(): Promise<string> {
  console.log('🧠 Testing Column Intelligence System...');
  
  // Test Case 1: Clear Budget vs Actual data
  const budgetCSV = `Period,Actual Sales,Budget Sales,Region
2024-Q1,55000,50000,North
2024-Q2,62000,60000,North
2024-Q3,58000,65000,North
2024-Q4,70000,68000,North`;

  // Test Case 2: Ambiguous column names
  const ambiguousCSV = `Date,Performance,Target,Department
Jan 2024,1200,1000,Marketing
Feb 2024,1350,1100,Marketing
Mar 2024,1400,1300,Marketing
Apr 2024,1500,1600,Marketing`;

  // Test Case 3: Time series data
  const timeSeriesCSV = `Month,Revenue
2024-01,50000
2024-02,52000
2024-03,48000
2024-04,55000`;

  const results = [];
  
  // Test Budget Variance Detection
  try {
    const budgetResult = await processCSVWithIntelligence(budgetCSV, { 
      analyzerType: 'budgetVariance' 
    });
    
    results.push(`📊 Budget Variance Test:`);
    results.push(`- Confidence: ${Math.round(budgetResult.columnMapping.confidence * 100)}%`);
    results.push(`- Date Column: ${budgetResult.columnMapping.dateColumn}`);
    results.push(`- Actual Column: ${budgetResult.columnMapping.valueColumns.actual}`);
    results.push(`- Budget Column: ${budgetResult.columnMapping.valueColumns.budget}`);
    results.push(`- Metric Type: ${budgetResult.columnMapping.metricType}`);
    results.push(`- Suggested Analyzers: ${budgetResult.suggestedAnalyzers.join(', ')}`);
    results.push(`- Warnings: ${budgetResult.warnings.length > 0 ? budgetResult.warnings.join('; ') : 'None'}`);
    results.push('');
    
  } catch (error) {
    results.push(`❌ Budget Variance Test Failed: ${error}`);
  }

  // Test Ambiguous Data
  try {
    const ambiguousResult = await processCSVWithIntelligence(ambiguousCSV, { 
      analyzerType: 'budgetVariance' 
    });
    
    results.push(`🤔 Ambiguous Data Test:`);
    results.push(`- Confidence: ${Math.round(ambiguousResult.columnMapping.confidence * 100)}%`);
    results.push(`- Date Column: ${ambiguousResult.columnMapping.dateColumn}`);
    results.push(`- Actual Column: ${ambiguousResult.columnMapping.valueColumns.actual}`);
    results.push(`- Budget Column: ${ambiguousResult.columnMapping.valueColumns.budget}`);
    results.push(`- Warnings: ${ambiguousResult.warnings.length > 0 ? ambiguousResult.warnings.join('; ') : 'None'}`);
    results.push('');
    
  } catch (error) {
    results.push(`❌ Ambiguous Data Test Failed: ${error}`);
  }

  // Test Time Series Detection
  try {
    const timeSeriesResult = await processCSVWithIntelligence(timeSeriesCSV, { 
      analyzerType: 'periodVariance' 
    });
    
    results.push(`📈 Time Series Test:`);
    results.push(`- Confidence: ${Math.round(timeSeriesResult.columnMapping.confidence * 100)}%`);
    results.push(`- Date Column: ${timeSeriesResult.columnMapping.dateColumn}`);
    results.push(`- Value Column: ${timeSeriesResult.columnMapping.valueColumns.actual}`);
    results.push(`- Metric Type: ${timeSeriesResult.columnMapping.metricType}`);
    results.push(`- Suggested Analyzers: ${timeSeriesResult.suggestedAnalyzers.join(', ')}`);
    results.push(`- Sample Transformed Data: ${JSON.stringify(timeSeriesResult.transformedData.slice(0, 2))}`);
    results.push('');
    
  } catch (error) {
    results.push(`❌ Time Series Test Failed: ${error}`);
  }

  // Summary
  results.push(`✅ Column Intelligence System Test Complete`);
  results.push(`📋 This system automatically detects:`);
  results.push(`  • Date/Period columns (date, month, quarter, year, etc.)`);
  results.push(`  • Actual values (actual, real, current, performance, etc.)`);
  results.push(`  • Budget values (budget, planned, target, goal, etc.)`);
  results.push(`  • Forecast values (forecast, predicted, projected, etc.)`);
  results.push(`  • Category columns (region, department, product, etc.)`);
  results.push(`  • Metric types (revenue, sales, expenses, profit, units)`);
  
  return results.join('\n');
}

export async function testManualColumnMapping(): Promise<string> {
  const results = [];
  
  results.push(`🎯 Manual Column Mapping Example:`);
  results.push(`When automatic detection fails, users can manually specify:`);
  results.push(`{`);
  results.push(`  "dateColumn": "Quarter",`);
  results.push(`  "actualColumn": "Performance_Metrics",`);
  results.push(`  "budgetColumn": "Target_Goals",`);
  results.push(`  "categoryColumn": "Business_Unit",`);
  results.push(`  "metricType": "revenue"`);
  results.push(`}`);
  results.push(``);
  results.push(`💡 This ensures analyzers work with ANY CSV structure!`);
  
  return results.join('\n');
}
