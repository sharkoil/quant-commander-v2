// src/components/DocumentUploadUI.tsx
"use client";

import React, { useState } from 'react';
import { summarizeContent } from '@/lib/ollama';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'; // Point to local file

interface DocumentUploadUIProps {
  ollamaModel: string | null;
  onNewMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
}

const DocumentUploadUI: React.FC<DocumentUploadUIProps> = ({ ollamaModel, onNewMessage }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !ollamaModel) return;

    setIsProcessing(true);
    for (const file of selectedFiles) {
      onNewMessage({ role: 'user', content: `Uploading and processing document: ${file.name}` });
      try {
        let fileContent: string | null = null;
        if (file.type === 'application/pdf') {
          fileContent = await readPdfContent(file);
        } else {
          fileContent = await readTextFileContent(file);
        }

        if (fileContent) {
          const summary = await summarizeContent(fileContent, ollamaModel);
          onNewMessage({ role: 'assistant', content: `Summary of ${file.name}: ${summary}` });
        } else {
          onNewMessage({ role: 'assistant', content: `Could not read content from ${file.name}. Unsupported file type or error.` });
        }
      } catch (error) {
        console.error("Error processing document:", error);
        onNewMessage({ role: 'assistant', content: `Error processing ${file.name}. Please try again.` });
      }
    }
    setSelectedFiles([]);
    setIsProcessing(false);
  };

  const readTextFileContent = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsText(file);
    });
  };

  const readPdfContent = async (file: File): Promise<string | null> => {
    return new Promise(async (resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        try {
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 0; i < pdf.numPages; i++) {
            const page = await pdf.getPage(i + 1);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
          }
          resolve(fullText);
        } catch (error) {
          console.error("Error reading PDF:", error);
          resolve(null);
        }
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-xl font-semibold mb-4">Upload Documents for Analysis</h2>
      <div className="mb-4">
        <label htmlFor="document-upload" className="block text-sm font-medium text-gray-700 mb-2">Select Documents</label>
        <input
          id="document-upload"
          type="file"
          multiple
          onChange={handleFileChange}
          accept=".txt,.csv,.json,.xml,.md,.pdf"
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Selected Files:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {selectedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || isProcessing || !ollamaModel}
        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Upload and Summarize'}
      </button>
      {!ollamaModel && (
        <p className="text-red-500 text-sm mt-2">Please ensure Ollama is running and a model is selected to upload documents.</p>
      )}
    </div>
  );
};

export default DocumentUploadUI;
