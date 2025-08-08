import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import type { EdisonSettings } from "./settings";
import type { LocalMessage, Role } from "@/types/chat";

function toOpenAIMessages(systemPrompt: string | undefined, history: LocalMessage[]) {
  const msgs: { role: Role; content: string }[] = [];
  if (systemPrompt && systemPrompt.trim()) {
    msgs.push({ role: "system", content: systemPrompt.trim() });
  }
  for (const m of history) {
    if (m.role === "system" && !systemPrompt) continue;
    msgs.push({ role: m.role, content: m.content });
  }
  return msgs;
}

function toTranscript(systemPrompt: string | undefined, history: LocalMessage[]) {
  const parts: string[] = [];
  if (systemPrompt && systemPrompt.trim()) {
    parts.push(`System: ${systemPrompt.trim()}`);
  }
  for (const m of history) {
    parts.push(`${m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : "System"}: ${m.content}`);
  }
  return parts.join("\n\n");
}

export async function generateAssistantReply(
  settings: EdisonSettings,
  history: LocalMessage[]
): Promise<string> {
  if (!settings.provider || !settings.model) {
    throw new Error("Missing LLM provider or model");
  }

  if (settings.provider === "groq") {
    if (!settings.groqApiKey) throw new Error("Missing Groq API key");
    const groq = new Groq({ apiKey: settings.groqApiKey, dangerouslyAllowBrowser: true });
    const messages = toOpenAIMessages(settings.systemPrompt, history);
    const resp = await groq.chat.completions.create({
      model: settings.model,
      messages,
    });
    return resp.choices?.[0]?.message?.content ?? "";
  }

  if (settings.provider === "gemini") {
    if (!settings.geminiApiKey) throw new Error("Missing Gemini API key");
    const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey });
    const contents = toTranscript(settings.systemPrompt, history);
    const response = await ai.models.generateContent({
      model: settings.model,
      contents,
    } as any);
    // Library returns .text sometimes via .response?.text() depending on version
    const text = (response as any).text ?? (response as any)?.response?.text?.();
    return typeof text === "function" ? text() : (text ?? "");
  }

  throw new Error("Unsupported provider");
}
