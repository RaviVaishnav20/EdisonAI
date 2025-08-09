import { loadSettings } from "./settings";

export interface TranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
}

export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  const settings = loadSettings();
  
  if (!settings.microphoneEnabled) {
    return { text: "", success: false, error: "Microphone not enabled" };
  }

  if (!settings.transcriptionProvider) {
    return { text: "", success: false, error: "No transcription provider selected" };
  }

  try {
    if (settings.transcriptionProvider === "groq") {
      return await transcribeWithGroq(audioBlob, settings);
    } else if (settings.transcriptionProvider === "openai") {
      return await transcribeWithOpenAI(audioBlob, settings);
    } else {
      return { text: "", success: false, error: "Unsupported transcription provider" };
    }
  } catch (error) {
    return { text: "", success: false, error: `Transcription failed: ${error}` };
  }
}

async function transcribeWithGroq(audioBlob: Blob, settings: any): Promise<TranscriptionResult> {
  if (!settings.groqApiKey) {
    return { text: "", success: false, error: "Groq API key not provided" };
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', settings.transcriptionModel || 'whisper-large-v3-turbo');
  formData.append('language', 'en');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.groqApiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    return { text: "", success: false, error: `Groq API error: ${error}` };
  }

  const result = await response.json();
  return { text: result.text, success: true };
}

async function transcribeWithOpenAI(audioBlob: Blob, settings: any): Promise<TranscriptionResult> {
  if (!settings.openaiApiKey) {
    return { text: "", success: false, error: "OpenAI API key not provided" };
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model', settings.transcriptionModel || 'whisper-1');
  formData.append('language', 'en');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.openaiApiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    return { text: "", success: false, error: `OpenAI API error: ${error}` };
  }

  const result = await response.json();
  return { text: result.text, success: true };
}
