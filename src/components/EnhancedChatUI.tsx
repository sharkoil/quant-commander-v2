// Enhanced ChatUI with Data-Aware Multi-Turn Chat System
// Integrates both advanced and reliable chat approaches for financial data analysis

"use client";

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { chatWithOllama, Message } from '@/lib/ollama';
import { DataAnalysisChat, buildDataContext } from '@/lib/chat/dataAnalysisChat';
import { ReliableChatSystem } from '@/lib/chat/reliableChatSystem';
import ReactMarkdown from 'react-markdown';

export interface EnhancedChatUIHandles {
  addMessage: (message: Message) => void;
  setDataContext: (csvData: any[], datasetName: string) => void;
  getSystemStatus: () => any;
}

interface EnhancedChatUIProps {
  ollamaModel: string | null;
  isExternalLoading?: boolean;
  csvData?: any[];
  datasetName?: string;
  chatMode?: 'standard' | 'data-advanced' | 'data-reliable';
  maxRows?: number; // For performance optimization
}

const EnhancedChatUI = forwardRef<EnhancedChatUIHandles, EnhancedChatUIProps>(({ 
  ollamaModel, 
  isExternalLoading = false,
  csvData = [],
  datasetName = 'dataset',
  chatMode = 'standard',
  maxRows = 1000000
}, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I can analyze your financial data and answer questions about outliers, trends, budget variance, and more. How can I help you today?' },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataContext, setDataContext] = useState<any>(null);
  const [chatSystem, setChatSystem] = useState<DataAnalysisChat | ReliableChatSystem | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [analysisMode, setAnalysisMode] = useState<'standard' | 'data-advanced' | 'data-reliable'>(chatMode);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize data context when CSV data is provided
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      try {
        // Choose chat system based on data size and mode preference
        const shouldUseReliable = csvData.length > 50000 || analysisMode === 'data-reliable';
        
        if (shouldUseReliable) {
          const reliableSystem = new ReliableChatSystem(csvData, datasetName);
          setChatSystem(reliableSystem);
          setSystemStatus(reliableSystem.getSystemStatus());
          setAnalysisMode('data-reliable');
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `📊 **Data Analysis Ready** (Reliable Mode)\n\n` +
              `I've analyzed your dataset "${datasetName}" with ${csvData.length.toLocaleString()} rows.\n\n` +
              `🔧 **Optimized for Performance:**\n` +
              `- Statistical sampling for large datasets\n` +
              `- Query caching for faster responses\n` +
              `- Reliable function calling\n\n` +
              `**Available Analyses:**\n` +
              `- 🔍 Outlier detection\n` +
              `- 💰 Budget variance analysis\n` +
              `- 📊 Data exploration\n\n` +
              `Try asking: "Find outliers in my data" or "Analyze budget variance"`
          }]);
        } else {
          const context = buildDataContext(csvData, datasetName);
          const advancedSystem = new DataAnalysisChat(context);
          setDataContext(context);
          setChatSystem(advancedSystem);
          setAnalysisMode('data-advanced');
          
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `📊 **Advanced Data Analysis Ready**\n\n` +
              `I've analyzed your dataset "${datasetName}" with ${csvData.length.toLocaleString()} rows and ${context.columns.length} columns.\n\n` +
              `**Detected Columns:**\n` +
              `- 📅 Date columns: ${context.dateColumns.join(', ') || 'None'}\n` +
              `- 🔢 Numeric columns: ${context.numericColumns.slice(0, 3).join(', ')}${context.numericColumns.length > 3 ? '...' : ''}\n` +
              `- 🏷️ Categories: ${context.categoricalColumns.slice(0, 3).join(', ')}${context.categoricalColumns.length > 3 ? '...' : ''}\n\n` +
              `**Available Analyses:**\n` +
              `- Outlier detection with IQR/Z-Score methods\n` +
              `- Trend analysis and seasonality\n` +
              `- Budget vs actual variance\n` +
              `- Contribution breakdown\n` +
              `- Multi-dimensional comparisons\n\n` +
              `Ask me anything about your data! I can handle complex temporal queries and multi-dimensional analysis.`
          }]);
        }
      } catch (error) {
        console.error('Failed to initialize data context:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ **Error initializing data analysis:**\n${error instanceof Error ? error.message : 'Unknown error'}\n\nFalling back to standard chat mode.`
        }]);
        setAnalysisMode('standard');
      }
    } else {
      setAnalysisMode('standard');
    }
  }, [csvData, datasetName]);

  useImperativeHandle(ref, () => ({
    addMessage: (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    },
    setDataContext: (newCsvData: any[], newDatasetName: string) => {
      // This will trigger the useEffect above
      setDataContext(null);
      setChatSystem(null);
      // Note: In a real implementation, you'd update the props or use a state management solution
    },
    getSystemStatus: () => {
      if (chatSystem && 'getSystemStatus' in chatSystem) {
        return chatSystem.getSystemStatus();
      }
      return systemStatus;
    }
  }));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isLoading || !ollamaModel) return;

    const userMessage: Message = { role: 'user', content: inputMessage.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let assistantResponse: string;

      // Route to appropriate chat system based on mode
      if (analysisMode !== 'standard' && chatSystem) {
        // Use data-aware chat system
        let dataResponse;
        
        if (chatSystem instanceof ReliableChatSystem) {
          dataResponse = await chatSystem.processQuery(userMessage.content, messages);
        } else if (chatSystem instanceof DataAnalysisChat) {
          dataResponse = await chatSystem.processQuery(userMessage.content, messages, ollamaModel);
        }

        if (dataResponse) {
          // Format response with analysis results
          if ('message' in dataResponse) {
            // ReliableChatSystem response
            assistantResponse = dataResponse.message;
            
            // Add HTML content if available
            if ('htmlContent' in dataResponse && dataResponse.htmlContent) {
              assistantResponse += '\n\n---\n\n' + dataResponse.htmlContent;
            }
            
            // Add performance info
            if ('performanceInfo' in dataResponse && dataResponse.performanceInfo) {
              const perf = dataResponse.performanceInfo;
              assistantResponse += `\n\n*⚡ Processed in ${perf.processingTime}ms` + 
                ` • ${perf.rowsAnalyzed.toLocaleString()} rows analyzed` + 
                `${perf.cacheHit ? ' • Cache hit' : ''}*`;
            }
            
            // Add suggested actions
            if ('suggestedActions' in dataResponse && dataResponse.suggestedActions && dataResponse.suggestedActions.length > 0) {
              assistantResponse += '\n\n**💡 Suggested next steps:**\n';
              dataResponse.suggestedActions.forEach((action: string) => {
                assistantResponse += `- ${action}\n`;
              });
            }
          } else {
            // DataAnalysisChat response
            assistantResponse = dataResponse.response;
            
            // Add analysis results if available
            if (dataResponse.analysisResults) {
              assistantResponse += '\n\n---\n\n' + JSON.stringify(dataResponse.analysisResults, null, 2);
            }
          }
        } else {
          assistantResponse = "I couldn't process your data analysis request. Please try rephrasing your question.";
        }
      } else {
        // Fall back to standard Ollama chat
        const systemPrompt: Message = {
          role: 'system',
          content: `
            You are a financial analyst with 30 years of experience.
            You are 100% focused on facts and your recommendations are based on the tools the product has.
            You do not try to recommend stuff the product does not do.
            Your narratives are concise and focused.
            You prefer responses in HTML, not markdown.
            
            ${csvData && csvData.length > 0 ? 
              `The user has uploaded a dataset with ${csvData.length} rows. You can reference this data in your responses.` :
              'The user has not uploaded any data yet.'
            }
          `,
        };

        const messagesWithPrompt = [systemPrompt, ...messages, userMessage];
        assistantResponse = await chatWithOllama(messagesWithPrompt, ollamaModel);
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: assistantResponse },
      ]);

    } catch (error) {
      console.error("Failed to get response:", error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "Error: Could not process your request. Please try again or check your connection." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getModeInfo = () => {
    switch (analysisMode) {
      case 'data-advanced':
        return {
          icon: '🧠',
          title: 'Advanced Data Analysis',
          description: 'Multi-dimensional analysis, function calling, temporal queries'
        };
      case 'data-reliable':
        return {
          icon: '⚡',
          title: 'Reliable Data Analysis',
          description: 'Performance optimized, cached queries, statistical sampling'
        };
      default:
        return {
          icon: '💬',
          title: 'Standard Chat',
          description: 'General conversation'
        };
    }
  };

  const showLoadingIndicator = isLoading || isExternalLoading;
  const modeInfo = getModeInfo();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Enhanced Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              {modeInfo.icon} Chat with AI
            </h2>
            <p className="text-sm text-gray-600">{modeInfo.title} • {modeInfo.description}</p>
          </div>
          
          {systemStatus && (
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {systemStatus.datasetInfo.totalRows.toLocaleString()} rows
              {systemStatus.datasetInfo.usingStatisticalSample && ' (sampled)'}
            </div>
          )}
        </div>

        {/* Data Context Info */}
        {dataContext && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
            📊 Dataset: {dataContext.datasetName} • 
            {dataContext.rowCount.toLocaleString()} rows • 
            {dataContext.columns.length} columns • 
            {dataContext.dateColumns.length} dates • 
            {dataContext.numericColumns.length} metrics
          </div>
        )}
      </div>
      
      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg shadow-sm max-w-[85%] ${msg.role === 'user'
              ? 'bg-blue-500 text-white ml-auto'
              : 'bg-white text-gray-800 mr-auto border border-gray-200'
            }`}
          >
            {msg.role === 'assistant' ? (
              <div className="prose prose-sm max-w-none">
                {msg.content.includes('<div') || msg.content.includes('<table') ? (
                  // Render HTML content for analysis results
                  <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                ) : (
                  // Render Markdown content for regular text
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            ) : (
              <p className="text-sm">{msg.content}</p>
            )}
          </div>
        ))}
        
        {showLoadingIndicator && (
          <div className="p-3 rounded-lg shadow-sm bg-white text-gray-800 mr-auto border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <p className="text-sm">
                {analysisMode !== 'standard' ? 'Analyzing your data...' : 'AI is thinking...'}
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Enhanced Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {/* Quick action buttons for data analysis mode */}
        {analysisMode !== 'standard' && csvData && csvData.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              onClick={() => setInputMessage('Find outliers in my data')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              🔍 Find Outliers
            </button>
            <button
              onClick={() => setInputMessage('Analyze budget variance')}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              💰 Budget Variance
            </button>
            <button
              onClick={() => setInputMessage('Show me data trends over time')}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              📈 Trends
            </button>
            <button
              onClick={() => setInputMessage('Give me a data overview')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              📊 Overview
            </button>
          </div>
        )}

        <div className="flex">
          <input
            type="text"
            placeholder={
              ollamaModel ? 
                analysisMode !== 'standard' ? 
                  "Ask about your data (outliers, trends, variance, etc.)" : 
                  "Type your message..." 
                : "Ollama not connected or model not selected."
            }
            className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !ollamaModel}
          />
          <button
            onClick={handleSendMessage}
            className="px-6 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !ollamaModel}
          >
            {isLoading ? '⏳' : 'Send'}
          </button>
        </div>

        {/* Mode indicator */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          {analysisMode === 'data-reliable' && '⚡ Optimized for large datasets'} 
          {analysisMode === 'data-advanced' && '🧠 Advanced multi-dimensional analysis'}
          {analysisMode === 'standard' && '💬 Standard chat mode'}
        </div>
      </div>
    </div>
  );
});

EnhancedChatUI.displayName = 'EnhancedChatUI';

export default EnhancedChatUI;
