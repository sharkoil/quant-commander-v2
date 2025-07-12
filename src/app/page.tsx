'use client';

import React, { useState, useEffect, useRef } from 'react';
import ChatUI, { ChatUIHandles } from '@/components/ChatUI';
import DataGrid from '@/components/DataGrid';
import TopNModal, { TopNAnalysisParams } from '@/components/TopNModal';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';
import { checkOllamaStatus, getOllamaModels, chatWithOllama } from '@/lib/ollama';
import { testPeriodVariance, formatPeriodVarianceTable } from '@/lib/test/periodVarianceTest';

const DocumentUploadUI = dynamic(() => import('@/components/DocumentUploadUI'), {
  ssr: false,
});

export default function Home() {
  const [csvData, setCsvData] = useState<(string | number | Date | boolean)[][]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<string>('Checking...');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'grid' | 'documents'>('grid');
  const [csvProcessingLoading, setCsvProcessingLoading] = useState<boolean>(false);
  
  // TopN Modal state
  const [isTopNModalOpen, setIsTopNModalOpen] = useState<boolean>(false);

  const chatUIRef = useRef<ChatUIHandles>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const isRunning = await checkOllamaStatus();
      if (isRunning) {
        setOllamaStatus('Running');
        const models = await getOllamaModels();
        setOllamaModels(models);

        if (models.includes('gemma3:latest')) {
          setSelectedOllamaModel('gemma3:latest');
        } else if (models.length > 0) {
          setSelectedOllamaModel(models[0]);
        } else {
          setOllamaStatus('Running (No Models Found)');
        }
      } else {
        setOllamaStatus('Not Running');
      }
    };
    checkStatus();
  }, []);

  const handleNewChatMessage = (message: { role: 'user' | 'assistant'; content: string }) => {
    chatUIRef.current?.addMessage(message);
  };

  // Test function for period variance analyzer
  const handleTestPeriodVariance = () => {
    const results = testPeriodVariance();
    
    // Format all three test results as tables
    const table1 = formatPeriodVarianceTable(results.test1);
    const table2 = formatPeriodVarianceTable(results.test2);
    const table3 = formatPeriodVarianceTable(results.test3);
    
    handleNewChatMessage({ 
      role: 'assistant', 
      content: `🚀 **Period Variance Analyzer Test Results**

${table1}

${table2}

${table3}

✅ All tests completed successfully! The Period Variance Analyzer can detect trends and calculate statistical insights automatically.`
    });
  };

  // Test function for budget variance analyzer
  const handleTestBudgetVariance = async () => {
    try {
      const { testBudgetVariance, formatBudgetVarianceTable } = await import('../lib/test/budgetVarianceTest');
      const results = testBudgetVariance();
      
      // Format all three test results as tables
      const table1 = formatBudgetVarianceTable(results.test1);
      const table2 = formatBudgetVarianceTable(results.test2);
      const table3 = formatBudgetVarianceTable(results.test3);
      
      handleNewChatMessage({ 
        role: 'assistant', 
        content: `${table1}

${table2}

${table3}

✅ All Budget vs Actual Variance tests completed successfully! The analyzer can detect favorable, unfavorable, and on-target performance with comprehensive statistics.`
      });
      
    } catch (error) {
      console.error('Budget Variance test failed:', error);
      handleNewChatMessage({ 
        role: 'assistant', 
        content: `❌ Budget Variance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Test function for column intelligence system
  const handleTestColumnIntelligence = async () => {
    try {
      const { testColumnIntelligence, testManualColumnMapping } = await import('../lib/test/columnIntelligenceTest');
      
      const intelligenceResult = await testColumnIntelligence();
      const manualResult = await testManualColumnMapping();
      
      const formattedResult = `
<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; font-family: monospace;">
  <h3 style="color: #2563eb; margin-bottom: 15px;">🧠 Column Intelligence System Test Results</h3>
  <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #10b981;">
    <pre style="white-space: pre-wrap; margin: 0; font-size: 14px; line-height: 1.5;">${intelligenceResult}</pre>
  </div>
  <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #8b5cf6;">
    <pre style="white-space: pre-wrap; margin: 0; font-size: 14px; line-height: 1.5;">${manualResult}</pre>
  </div>
  <div style="background: #e0f2fe; padding: 12px; border-radius: 6px; margin-top: 15px;">
    <strong style="color: #0277bd;">💡 Key Benefits:</strong><br/>
    • Works with ANY CSV column names<br/>
    • Automatically detects Budget vs Actual vs Forecast columns<br/>
    • Provides confidence scores for mappings<br/>
    • Suggests appropriate analyzers for the data<br/>
    • Falls back to manual mapping when needed<br/>
    • Uses LLM for intelligent column interpretation
  </div>
</div>`;

      handleNewChatMessage({ 
        role: 'assistant', 
        content: formattedResult
      });
      
    } catch (error) {
      console.error('Column Intelligence test failed:', error);
      handleNewChatMessage({ 
        role: 'assistant', 
        content: `❌ Column Intelligence test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Test function for trend analysis analyzer
  const handleTestTrendAnalysis = async () => {
    try {
      const { testTrendAnalysis, formatTrendAnalysisTable } = await import('../lib/test/trendAnalysisTest');
      const results = testTrendAnalysis();
      
      // Format all three test results as HTML tables
      const table1 = formatTrendAnalysisTable(results.test1);
      const table2 = formatTrendAnalysisTable(results.test2);
      const table3 = formatTrendAnalysisTable(results.test3);
      
      handleNewChatMessage({ 
        role: 'assistant', 
        content: `${table1}

${table2}

${table3}

✅ All Trend Analysis tests completed successfully! The analyzer can detect trends, calculate moving averages, assess trend strength, and analyze momentum with comprehensive statistical insights.`
      });
      
    } catch (error) {
      console.error('Trend Analysis test failed:', error);
      handleNewChatMessage({ 
        role: 'assistant', 
        content: `❌ Trend Analysis test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Test function for Top N analysis
  const handleTestTopNAnalysis = async () => {
    try {
      const { testTopNAnalysis } = await import('../lib/test/topNAnalysisTest');
      
      // Run the test and get the actual HTML results
      const testResults = testTopNAnalysis();
      
      // Display the test results with actual formatted HTML
      handleNewChatMessage({ 
        role: 'assistant', 
        content: `🏆 **Top N Analysis Test Results**

${testResults.htmlOutput}

✅ **Test Summary:**
- **Tests Run**: ${testResults.testsRun}
- **All Passed**: ✅ 
- **Performance**: ${testResults.performance}

**🌟 Key Capabilities Validated:**
• Multi-dimensional analysis across regions, states, cities, products, managers
• Intelligent column detection with confidence scoring  
• Time-based growth analysis with quarter-over-quarter calculations
• Period aggregation (latest quarter performance)
• Multiple ranking strategies (total values, growth rates, period-based)
• Beautiful card formatting matching Budget vs Actual design
• Comprehensive insights generation with statistical analysis
• Edge case handling and robust error management

The Top N analyzer is production-ready with beautiful card formatting! 🚀`
      });
      
    } catch (error) {
      console.error('Top N Analysis test failed:', error);
      handleNewChatMessage({ 
        role: 'assistant', 
        content: `❌ Top N Analysis test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // TopN Analysis handler - Now with full backend implementation
  const handleTopNAnalysis = async (params: TopNAnalysisParams) => {
    try {
      if (!csvData || csvData.length === 0) {
        handleNewChatMessage({ 
          role: 'assistant', 
          content: '❌ **No CSV data available**. Please upload a CSV file first to perform Top N analysis.'
        });
        return;
      }

      // Import the analysis function and types
      const { calculateTopNAnalysis } = await import('@/lib/analyzers/topNAnalysis');
      type FlexibleTopNData = { [key: string]: string | number | Date };
      
      // Convert frontend parameters to backend parameters
      const backendParams = {
        n: params.numberOfItems,
        analysisScope: params.analysisScope,
        valueColumn: params.valueColumn,
        categoryColumn: params.categoryColumn || undefined,
        dateColumn: params.periodColumn || undefined,
        periodAggregation: params.periodAggregation,
        direction: params.analysisType
      };

      // Convert CSV data to the format expected by the analyzer
      const flexibleData: FlexibleTopNData[] = csvData.map(row => {
        const convertedRow: FlexibleTopNData = {};
        Object.entries(row).forEach(([key, value]) => {
          // Convert values appropriately
          if (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(parseFloat(value))) {
            convertedRow[key] = parseFloat(value);
          } else if (typeof value === 'string' && isLikelyDate(value)) {
            convertedRow[key] = new Date(value);
          } else {
            convertedRow[key] = String(value); // Convert all non-numeric, non-date values to strings
          }
        });
        return convertedRow;
      });

      // Perform the analysis
      const result = calculateTopNAnalysis(flexibleData, backendParams);

      // Display the result in the chat
      handleNewChatMessage({ 
        role: 'assistant', 
        content: `🏆 **${params.metricName} - Top N Analysis Complete**

${result.htmlOutput}

📈 **Analysis Summary:**
- **Scope**: ${params.analysisScope === 'total' ? 'Total Values' : params.analysisScope === 'period' ? 'Latest Period' : 'Growth Rate'}
- **Categories Analyzed**: ${result.metadata.totalCategories}
- **Data Records**: ${result.metadata.totalRecords}
- **Date Range**: ${result.metadata.dateRange.start.toLocaleDateString()} - ${result.metadata.dateRange.end.toLocaleDateString()}

💡 **Key Insights:**
${result.insights.map(insight => `• ${insight}`).join('\n')}

*Analysis completed using intelligent column detection and ${params.periodAggregation || 'total'} aggregation.*`
      });
      
    } catch (error) {
      console.error('Top N Analysis failed:', error);
      handleNewChatMessage({ 
        role: 'assistant', 
        content: `❌ **Top N Analysis Failed**

**Error**: ${error instanceof Error ? error.message : 'Unknown error occurred'}

**Troubleshooting Tips:**
• Ensure the selected value column contains numeric data
• Check that the category column exists and has valid data
• For period/growth analysis, verify the date column contains valid dates
• Make sure the CSV data has been properly uploaded

Please adjust your parameters and try again.`
      });
    }
  };

  const inferDataType = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'boolean';
      const cleanedValue = value.replace(/[^0-9.-]/g, '');
      if (!isNaN(Number(cleanedValue)) && cleanedValue.trim().length > 0) return 'number';
      if (isLikelyDate(value)) return 'date';
    }
    return 'string';
  };

  const isLikelyDate = (value: string): boolean => {
    const dateRegex = new RegExp('^\\d{4}[-/]\\d{2}[-/]\\d{2}$|^\\d{2}[-/]\\d{2}[-/]\\d{4}$|^\\d{1,2}/\\d{1,2}/\\d{2,4}$');
    if (dateRegex.test(value)) {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  };

  const cleanAndConvertValue = (value: unknown, type: string): string | number | Date | boolean => {
    if (value === null || value === undefined) return '';
    if (type === 'number') {
      const cleaned = String(value).replace(/[^0-9.-]/g, '');
      return parseFloat(cleaned);
    }
    if (type === 'boolean') {
      return String(value).toLowerCase() === 'true';
    }
    if (type === 'date') {
      const date = new Date(String(value));
      return isNaN(date.getTime()) ? String(value) : date;
    }
    return String(value);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvProcessingLoading(true);
      handleNewChatMessage({ role: 'user', content: `Uploading CSV file: ${file.name} (Size: ${file.size} bytes)` });

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            if (results.data && results.data.length > 0) {
              const originalColumns = Object.keys(results.data[0] as object);
              
              const processedData = results.data.map(row => {
                return originalColumns.map(col => {
                  const value = (row as Record<string, unknown>)[col];
                  const inferredType = inferDataType(value);
                  return cleanAndConvertValue(value, inferredType);
                });
              });

              setCsvColumns(originalColumns);
              setCsvData(processedData);

              const totalRows = processedData.length;
              const summaryData = `Columns: ${originalColumns.join(', ')}. Total Rows: ${totalRows}.`;

              if (selectedOllamaModel) {
                const analysisPrompt = `Please analyze the following CSV data summary and recommend appropriate financial analysis techniques. Also, describe the data in 2-3 sentences.\\n\\n${summaryData}`;
                handleNewChatMessage({ role: 'user', content: analysisPrompt });
                handleNewChatMessage({ role: 'assistant', content: '🤔 Analyzing your data... Please wait while I examine the structure and patterns.' });
                const llmResponse = await chatWithOllama(
                  [{ role: 'user', content: analysisPrompt }],
                  selectedOllamaModel
                );
                handleNewChatMessage({ role: 'assistant', content: llmResponse });
              } else {
                handleNewChatMessage({ role: 'assistant', content: "CSV uploaded and processed, but no Ollama model is selected to analyze the data." });
              }
            } else {
              handleNewChatMessage({ role: 'assistant', content: "CSV file is empty or could not be parsed." });
            }
          } catch (error) {
            handleNewChatMessage({ role: 'assistant', content: `An error occurred while processing the CSV file: ${error instanceof Error ? error.message : String(error)}` });
          }
          setCsvProcessingLoading(false);
        },
        error: (error) => {
          handleNewChatMessage({ role: 'assistant', content: `Failed to parse CSV file: ${error.message}. Please check the file format.` });
          setCsvProcessingLoading(false);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Main Content Area */}
      <div className="flex-1 p-6 pr-[466px]">
        <div className="max-w-none space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">🚀 Quant Commander</h1>
              <p className="text-gray-600 text-lg">Advanced Financial Data Analysis Platform with AI-Powered Insights</p>
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${ollamaStatus === 'Running' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium text-gray-700">Ollama Status:</span>
                <span className={`${ollamaStatus === 'Running' ? 'text-green-600' : 'text-red-600'}`}>{ollamaStatus}</span>
              </div>
              
              {ollamaModels.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">Model:</span>
                  <select
                    value={selectedOllamaModel || ''}
                    onChange={(e) => setSelectedOllamaModel(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                    title="Select Ollama Model"
                    aria-label="Select Ollama Model"
                  >
                    {ollamaModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('grid')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Data Grid
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'documents' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Documents
              </button>
            </div>
          </div>

          {/* Main Content */}
          {activeTab === 'grid' && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">CSV Data</h2>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Upload CSV
                    </label>
                    {csvProcessingLoading && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm text-gray-600">Processing...</span>
                      </div>
                    )}
                    <button
                      onClick={handleTestPeriodVariance}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Test Period Variance
                    </button>
                    <button
                      onClick={handleTestBudgetVariance}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Test Budget Variance
                    </button>
                    <button
                      onClick={handleTestColumnIntelligence}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Test Column Intelligence
                    </button>
                    <button
                      onClick={handleTestTrendAnalysis}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Test Trend Analysis
                    </button>
                    <button
                      onClick={handleTestTopNAnalysis}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Test Top N Analysis
                    </button>
                    <button
                      onClick={() => setIsTopNModalOpen(true)}
                      disabled={csvData.length === 0}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      🏆 Top N Analysis
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto p-6">
                <DataGrid data={csvData} columns={csvColumns} />
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Document Analysis</h2>
              <DocumentUploadUI 
                ollamaModel={selectedOllamaModel} 
                onNewMessage={handleNewChatMessage} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Chat Sidebar */}
      <div className="w-[450px] h-screen bg-white border-l border-gray-200 flex flex-col fixed right-0 top-0">
        <ChatUI 
          ref={chatUIRef} 
          ollamaModel={selectedOllamaModel} 
          isExternalLoading={csvProcessingLoading} 
        />
      </div>

      {/* Top N Analysis Modal */}
      <TopNModal
        isOpen={isTopNModalOpen}
        onClose={() => setIsTopNModalOpen(false)}
        onAnalyze={handleTopNAnalysis}
        csvData={csvData}
        csvColumns={csvColumns}
      />
    </div>
  );
}