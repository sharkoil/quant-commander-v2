// src/lib/ollama.ts

export const OLLAMA_BASE_URL = 'http://localhost:11434';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithOllama(messages: Message[], model: string): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: false, // For simplicity, we'll get the full response at once
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Ollama API error: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error("Error chatting with Ollama:", error);
    return `Error: Unable to connect to Ollama or get a response. Please ensure Ollama is running and the model '${model}' is available.`;
  }
}

export async function summarizeContent(content: string, model: string): Promise<string> {
  const prompt = `Please provide a concise, two-sentence summary of the following text:

${content}`;
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Ollama API error: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error summarizing content with Ollama:", error);
    return `Error: Unable to summarize content. Please ensure Ollama is running and the model '${model}' is available.`;
  }
}

export async function getOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    const data = await response.json() as { models: Array<{ name: string }> };
    return data.models.map((m) => m.name);
  } catch (error) {
    console.error("Error fetching Ollama models:", error);
    return [];
  }
}

export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/`);
    return response.ok;
  } catch {
    return false;
  }
}