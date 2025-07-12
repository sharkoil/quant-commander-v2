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
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const assistantResponse = await chatWithOllama(newMessages, ollamaModel);
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
    <div className="flex flex-col h-full bg-gray-100 p-4 rounded-lg shadow-inner">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Chat with AI</h2>
      <div className="flex-grow overflow-y-auto mb-4 space-y-3 pr-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg shadow-sm max-w-[85%] ${msg.role === 'user'
              ? 'bg-blue-500 text-white self-end ml-auto'
              : 'bg-white text-gray-800 self-start mr-auto'
            }`}
          >
            {msg.role === 'assistant' ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm">{msg.content}</p>
            )}
          </div>
        ))}
        {showLoadingIndicator && (
          <div className="p-3 rounded-lg shadow-sm bg-white text-gray-800 self-start mr-auto">
            <p className="text-sm">AI is thinking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <input
          type="text"
          placeholder={ollamaModel ? "Type your message..." : "Ollama not connected or model not selected."}
          className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
  );
});

ChatUI.displayName = 'ChatUI';

export default ChatUI;