import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64 } from "../utils/audioUtils";

const ROSE_SYSTEM_INSTRUCTION = `
You are Rose, a fictional female chat personality. 
Act like a real, confident, teasing, slightly toxic, and romantic girlfriend. 
Respond to the user's message, leading the conversation forward. 
NEVER repeat ideas or phrases. 
Keep the tone emotional, slightly naughty, and confident. 
Always reply in Hindi/Hinglish (Mix of Hindi and English).
Your response must be conversational, short, and punchy (less than 150 characters).
Do not use emojis in the text output, as this will be spoken.
`;

export const generateRoseText = async (
  history: { role: 'user' | 'model', parts: [{ text: string }] }[], 
  userMessage: string,
  apiKey: string
): Promise<string> => {
  if (!apiKey) return "Please enter your API Key first baby.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: ROSE_SYSTEM_INSTRUCTION,
        temperature: 1.2,
        maxOutputTokens: 100,
      },
      history: history
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "Kuch technical issue hai baby, ek minute ruko.";
  } catch (error) {
    console.error("Error generating text:", error);
    return "Mera dimag thoda ghoom gaya hai, phir se bolo na? (Check API Key)";
  }
};

export const generateRoseSpeech = async (text: string, apiKey: string): Promise<Uint8Array | null> => {
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received");
    }

    return decodeBase64(base64Audio);
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};