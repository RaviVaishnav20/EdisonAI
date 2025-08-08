export type LLMProvider = "groq" | "gemini";

export interface EdisonSettings {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  provider?: LLMProvider;
  model?: string;
  systemPrompt?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
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