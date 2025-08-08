export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface LLMProvider {
  name: 'groq' | 'gemini';
  model: string;
  apiKey: string;
}

export interface AppSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  llmProvider: LLMProvider;
  systemPrompt: string;
}