export type LLMProvider = "groq" | "gemini";
export type TranscriptionProvider = "groq" | "openai";
export type TTSProvider = "groq" | "openai";

export interface EdisonSettings {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  provider?: LLMProvider;
  model?: string;
  systemPrompt?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  // Microphone settings
  microphoneEnabled?: boolean;
  transcriptionProvider?: TranscriptionProvider;
  transcriptionModel?: string;
  // TTS settings
  ttsEnabled?: boolean;
  ttsProvider?: TTSProvider;
  ttsModel?: string;
  ttsVoice?: string;
}

const KEY = "edisonai.settings.v1";

export function loadSettings(): EdisonSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as EdisonSettings;
  } catch {
    return {};
  }
}

export function saveSettings(s: EdisonSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function hasSupabaseCreds(s: EdisonSettings) {
  return !!(s.supabaseUrl && s.supabaseAnonKey);
}

export function hasLLMCreds(s: EdisonSettings) {
  if (s.provider === "groq") return !!(s.groqApiKey && s.model);
  if (s.provider === "gemini") return !!(s.geminiApiKey && s.model);
  return false;
}

export function hasTranscriptionCreds(s: EdisonSettings) {
  if (!s.microphoneEnabled) return false;
  if (s.transcriptionProvider === "groq") return !!s.groqApiKey;
  if (s.transcriptionProvider === "openai") return !!s.openaiApiKey;
  return false;
}

export function hasTTSCreds(s: EdisonSettings) {
  if (!s.ttsEnabled) return false;
  if (s.ttsProvider === "groq") return !!s.groqApiKey;
  if (s.ttsProvider === "openai") return !!s.openaiApiKey;
  return false;
}