'use client';

import React, { useState, useEffect, useRef } from 'react';
import ChatUI, { ChatUIHandles } from '@/components/ChatUI';
import DataGrid from '@/components/DataGrid';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';
import { checkOllamaStatus, getOllamaModels, chatWithOllama } from '@/lib/ollama';

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

  const inferDataType = (value: any): string => {
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

  const cleanAndConvertValue = (value: any, type: string): string | number | Date | boolean => {
    if (value === null || value === undefined) return '';
    if (type === 'number') {
      const cleaned = String(value).replace(/[^0-9.-]/g, '');
      return parseFloat(cleaned);
    }
    if (type === 'boolean') {
      return String(value).toLowerCase() === 'true';
    }
    if (type === 'date') {
      const date = new Date(value);
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
                  const value = (row as any)[col];
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Beautiful Data Analysis</h1>
          
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === 'grid' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
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
                  </div>
                </div>
                <DataGrid data={csvData} columns={csvColumns} />
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

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <ChatUI 
                ref={chatUIRef} 
                ollamaModel={selectedOllamaModel} 
                isExternalLoading={csvProcessingLoading} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}