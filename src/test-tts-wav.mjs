// Debug test script for Gemini TTS - creates proper WAV files
// Run with: node src/test-tts-wav.mjs

// Configuration - UPDATE THESE VALUES
const GEMINI_API_KEY = "";
const MODEL = "gemini-2.5-flash-preview-tts";

// WAV header creation function
function createWavHeader(pcmDataLength, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
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

async function testGeminiTTS() {
  console.log(" Testing Gemini TTS Connection...");
  console.log("API Key:", GEMINI_API_KEY ? "✅ Set" : "❌ Missing");
  console.log("Model:", MODEL);
  console.log("");

  try {
    // Test 1: Simple API call with correct REST API structure
    console.log(" Test 1: Making API call with correct REST API structure...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: 'Say cheerfully: Hello, this is a test of Gemini TTS!' 
            }] 
          }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          }
        })
      }
    );

    console.log("Response Status:", response.status);
    console.log("Response Headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Error Response:", errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log("❌ Parsed Error:", JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log("❌ Could not parse error as JSON");
      }
      return;
    }

    const data = await response.json();
    console.log("✅ Success Response Structure:");
    console.log(JSON.stringify(data, null, 2));

    // Check if we got audio data
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      console.log("🎵 Audio data received!");
      console.log("Audio data length:", audioData.length);
      console.log("Audio data preview:", audioData.substring(0, 100) + "...");
      
      // Save base64 data to text file
      const fs = await import('fs');
      fs.writeFileSync('base64-response.txt', audioData);
      console.log("💾 Base64 data saved as 'base64-response.txt'");
      
      // Save full response to JSON file
      fs.writeFileSync('full-response.json', JSON.stringify(data, null, 2));
      console.log("💾 Full response saved as 'full-response.json'");
      
      // Try different WAV creation methods
      console.log("\n🔧 Testing different WAV creation methods...");
      
      // Method 1: 24kHz, 16-bit, mono (most common for TTS)
      try {
        const binaryString = atob(audioData);
        const pcmData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          pcmData[i] = binaryString.charCodeAt(i);
        }
        
        const wavHeader = createWavHeader(pcmData.length, 24000, 1, 16);
        const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
        wavFile.set(wavHeader, 0);
        wavFile.set(pcmData, wavHeader.length);
        
        fs.writeFileSync('audio-24k-16bit-mono.wav', wavFile);
        console.log("✅ Method 1: 24kHz 16-bit mono WAV saved as 'audio-24k-16bit-mono.wav'");
      } catch (e) {
        console.log("❌ Method 1 failed:", e.message);
      }
      
      // Method 2: 16kHz, 16-bit, mono (alternative common rate)
      try {
        const binaryString = atob(audioData);
        const pcmData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          pcmData[i] = binaryString.charCodeAt(i);
        }
        
        const wavHeader = createWavHeader(pcmData.length, 16000, 1, 16);
        const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
        wavFile.set(wavHeader, 0);
        wavFile.set(pcmData, wavHeader.length);
        
        fs.writeFileSync('audio-16k-16bit-mono.wav', wavFile);
        console.log("✅ Method 2: 16kHz 16-bit mono WAV saved as 'audio-16k-16bit-mono.wav'");
      } catch (e) {
        console.log("❌ Method 2 failed:", e.message);
      }
      
      // Method 3: 48kHz, 16-bit, mono (high quality)
      try {
        const binaryString = atob(audioData);
        const pcmData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          pcmData[i] = binaryString.charCodeAt(i);
        }
        
        const wavHeader = createWavHeader(pcmData.length, 48000, 1, 16);
        const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
        wavFile.set(wavHeader, 0);
        wavFile.set(pcmData, wavHeader.length);
        
        fs.writeFileSync('audio-48k-16bit-mono.wav', wavFile);
        console.log("✅ Method 3: 48kHz 16-bit mono WAV saved as 'audio-48k-16bit-mono.wav'");
      } catch (e) {
        console.log("❌ Method 3 failed:", e.message);
      }
      
      // Check file sizes
      console.log("\n📊 File sizes:");
      try {
        const stats1 = fs.statSync('audio-24k-16bit-mono.wav');
        console.log(`Method 1 (24kHz): ${stats1.size} bytes`);
      } catch (e) {
        console.log("Method 1: File not found");
      }
      
      try {
        const stats2 = fs.statSync('audio-16k-16bit-mono.wav');
        console.log(`Method 2 (16kHz): ${stats2.size} bytes`);
      } catch (e) {
        console.log("Method 2: File not found");
      }
      
      try {
        const stats3 = fs.statSync('audio-48k-16bit-mono.wav');
        console.log(`Method 3 (48kHz): ${stats3.size} bytes`);
      } catch (e) {
        console.log("Method 3: File not found");
      }
      
    } else {
      console.log("❌ No audio data found in response");
    }

  } catch (error) {
    console.log("❌ Network/Other Error:", error);
  }
}

// Run tests
async function runTests() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    console.log("❌ Please set your GEMINI_API_KEY in the script first!");
    return;
  }
  
  await testGeminiTTS();
}

runTests().catch(console.error);
