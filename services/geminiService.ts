
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Level, MedicalWord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const expandVocabulary = async (level: Level, existingWords: string[]): Promise<MedicalWord[]> => {
  // 增加生成數量至 50
  const prompt = `你是一位專業的醫學英語教授。請為醫學系學生生成 50 個全新的 '${level}' 等級醫學單字。
  請勿包含以下已存在的單字（僅列出部分）：${existingWords.slice(-30).join(', ')}。
  
  要求：
  1. kk: 必須提供標準的美國 KK 音標（包含斜線，例如 /əˈnæt.ə.mi/）。
  2. chinese: 提供準確的繁體中文醫學定義（台灣醫療術語習慣）。
  3. englishDef: 簡潔的英文醫學定義。
  4. example: 一句具備臨床情境的英文例句。
  
  等級標準：
  - 基礎：解剖學、常見症狀、基本器材。
  - 常用：臨床專科、診斷測試、常見藥物、流行疾病。
  - 進階：罕見綜合症、複雜生化過程、特定手術程序、高級藥理學、分子醫學。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            kk: { type: Type.STRING },
            chinese: { type: Type.STRING },
            englishDef: { type: Type.STRING },
            example: { type: Type.STRING }
          },
          required: ["word", "kk", "chinese", "englishDef", "example"]
        }
      }
    }
  });

  try {
    const rawWords = JSON.parse(response.text);
    return rawWords.map((w: any) => ({
      ...w,
      id: Math.random().toString(36).substring(7),
      level,
      mastered: false
    }));
  } catch (e) {
    console.error("解析 AI 回應失敗", e);
    return [];
  }
};

export const getTTS = async (text: string): Promise<ArrayBuffer> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Clearly pronounce the medical term: ${text}` }] }],
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
  if (!base64Audio) throw new Error("無音訊數據");

  return decodeBase64ToArrayBuffer(base64Audio);
};

function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function playPCM(data: ArrayBuffer) {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const dataInt16 = new Int16Array(data);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}
