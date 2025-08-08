import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import type { Message, LLMProvider } from '../types';

export class LLMService {
  private groqClient: Groq | null = null;
  private geminiClient: GoogleGenAI | null = null;

  initializeProviders(groqApiKey?: string, geminiApiKey?: string) {
    if (groqApiKey && groqApiKey.trim() !== '') {
      this.groqClient = new Groq({ 
        apiKey: groqApiKey,
        dangerouslyAllowBrowser: true
      });
    }
    if (geminiApiKey && geminiApiKey.trim() !== '') {
      this.geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    }
  }

  async generateResponse(
    provider: LLMProvider,
    messages: Message[],
    systemPrompt?: string
  ): Promise<string> {
    const conversationMessages = this.prepareMessages(messages, systemPrompt);

    if (provider.name === 'groq') {
      return this.generateGroqResponse(provider.model, conversationMessages);
    } else if (provider.name === 'gemini') {
      return this.generateGeminiResponse(provider.model, conversationMessages, systemPrompt);
    }

    throw new Error(`Unsupported provider: ${provider.name}`);
  }

  private prepareMessages(messages: Message[], systemPrompt?: string) {
    const conversationMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));

    if (systemPrompt) {
      conversationMessages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }

    return conversationMessages;
  }

  private async generateGroqResponse(
    model: string,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ): Promise<string> {
    if (!this.groqClient) {
      throw new Error('Groq client not initialized');
    }

    const completion = await this.groqClient.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
      max_tokens: 4000
    });

    return completion.choices[0]?.message?.content || '';
  }

  private async generateGeminiResponse(
    model: string,
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    systemPrompt?: string
  ): Promise<string> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    // Convert messages to Gemini format
    const contents = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

    const generativeModel = this.geminiClient.getGenerativeModel({ 
      model,
      systemInstruction: systemPrompt
    });

    const response = await generativeModel.generateContent({
      contents
    });

    return response.response.text();
  }
}

export const llmService = new LLMService();