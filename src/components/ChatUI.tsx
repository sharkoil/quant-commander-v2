// src/components/ChatUI.tsx
"use client";

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { chatWithOllama, Message } from '@/lib/ollama';
import ReactMarkdown from 'react-markdown';

export interface ChatUIHandles {
  addMessage: (message: Message) => void;
}

interface ChatUIProps {
  ollamaModel: string | null;
  isExternalLoading?: boolean; // New prop
}

const ChatUI = forwardRef<ChatUIHandles, ChatUIProps>(({ ollamaModel, isExternalLoading = false }, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! How can I help you today?' },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    addMessage: (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    },
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

    // Define the system prompt
    const systemPrompt: Message = {
      role: 'system',
      content: `
        You are a financial analyst with 30 years of experience.
        You are 100% focused on facts and your recommendations are based on the tools the product has.
        You do not try to recommend stuff the product does not do.
        Your narratives are concise and focused.
        You prefer responses in HTML, not markdown.
      `,
    };

    // Prepend the system prompt to the message history
    const messagesWithPrompt = [systemPrompt, ...messages, userMessage];
    
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const assistantResponse = await chatWithOllama(messagesWithPrompt, ollamaModel);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: assistantResponse },
      ]);
    } catch (error) {
      console.error("Failed to get response from Ollama:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: "Error: Could not connect to Ollama or get a response." },
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

  const showLoadingIndicator = isLoading || isExternalLoading; // Combine internal and external loading

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-800">Chat with AI</h2>
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
                {msg.content.includes('<div') ? (
                  // Render HTML content for tables/cards
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
              <p className="text-sm">AI is thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Fixed Input Area at Bottom */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex">
          <input
            type="text"
            placeholder={ollamaModel ? "Type your message..." : "Ollama not connected or model not selected."}
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
            Send
          </button>
        </div>
      </div>
    </div>
  );
});

ChatUI.displayName = 'ChatUI';

export default ChatUI;