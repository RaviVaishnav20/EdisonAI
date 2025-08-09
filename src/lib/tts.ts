import { loadSettings } from "./settings";

export interface TTSResult {
  success: boolean;
  error?: string;
  audioUrl?: string;
}

export async function textToSpeech(text: string): Promise<TTSResult> {
  const settings = loadSettings();
  
  if (!settings.ttsEnabled) {
    return { success: false, error: "TTS not enabled" };
  }

  if (!settings.ttsProvider) {
    return { success: false, error: "No TTS provider selected" };
  }

  try {
    if (settings.ttsProvider === "groq") {
      return await ttsWithGroq(text, settings);
    } else if (settings.ttsProvider === "openai") {
      return await ttsWithOpenAI(text, settings);
    } else if (settings.ttsProvider === "gemini") {
      return await ttsWithGemini(text, settings);
    } else {
      return { success: false, error: "Unsupported TTS provider" };
    }
  } catch (error) {
    return { success: false, error: `TTS failed: ${error}` };
  }
}

async function ttsWithGroq(text: string, settings: any): Promise<TTSResult> {
  if (!settings.groqApiKey) {
    return { success: false, error: "Groq API key not provided" };
  }

  const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.ttsModel || 'playai-tts',
      voice: settings.ttsVoice || 'Fritz-PlayAI',
      input: text,
      response_format: 'wav'
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error: `Groq TTS API error: ${error}` };
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  return { success: true, audioUrl };
}

async function ttsWithOpenAI(text: string, settings: any): Promise<TTSResult> {
  if (!settings.openaiApiKey) {
    return { success: false, error: "OpenAI API key not provided" };
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.ttsModel || 'tts-1',
      voice: settings.ttsVoice || 'alloy',
      input: text,
      response_format: 'mp3'
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, error: `OpenAI TTS API error: ${error}` };
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  return { success: true, audioUrl };
}

// WAV header creation function for Gemini TTS
function createWavHeader(pcmDataLength: number, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  
  // RIFF chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + pcmDataLength, true); // File size - 8
  view.setUint32(8, 0x57415645, false); // "WAVE"
  
  // fmt sub-chunk
  view.setUint32(12, 0x666D7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, channels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true); // ByteRate
  view.setUint16(32, channels * bitsPerSample / 8, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample
  
  // data sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, pcmDataLength, true); // Subchunk2Size
  
  return new Uint8Array(buffer);
}

async function ttsWithGemini(text: string, settings: any): Promise<TTSResult> {
  if (!settings.geminiApiKey) {
    return { success: false, error: "Gemini API key not provided" };
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.ttsModel || 'gemini-2.5-flash-preview-tts'}:generateContent?key=${settings.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Say: ${text}`
          }]
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: settings.ttsVoice || 'Kore' },
            },
          },
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini TTS API error:', errorData);
      return {
        success: false,
        error: `Gemini TTS API error: ${errorData.error?.message || response.statusText}`
      };
    }

    const data = await response.json();
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      return { success: false, error: "No audio data received from Gemini TTS" };
    }

    // Convert base64 to PCM data
    const binaryString = atob(audioData);
    const pcmData = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      pcmData[i] = binaryString.charCodeAt(i);
    }

    // Create proper WAV header and combine with PCM data
    const wavHeader = createWavHeader(pcmData.length, 24000, 1, 16);
    const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
    wavFile.set(wavHeader, 0);
    wavFile.set(pcmData, wavHeader.length);

    // Create blob with proper MIME type
    const audioBlob = new Blob([wavFile], {
      type: 'audio/wav'
    });

    return {
      success: true,
      audioBlob,
      audioUrl: URL.createObjectURL(audioBlob)
    };
  } catch (error) {
    console.error('Gemini TTS error:', error);
    return { success: false, error: `Gemini TTS error: ${error}` };
  }
}
