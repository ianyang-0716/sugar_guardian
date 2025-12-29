
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GIRating, FoodAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a single food image for GI and dietary advice
 */
export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysis> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: "作为一名资深的老年糖尿病营养专家，请分析照片中的食物。请识别食物名称、估算GI值（血糖生成指数）、每100克含糖量和碳水化合物量，并针对老年糖尿病人给出简短、通俗易懂的食用建议。请以JSON格式返回，包含：name, giValue, giRating(低GI/中GI/高GI), sugarPer100g, carbsPer100g, advice, portionSize。" }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          giValue: { type: Type.NUMBER },
          giRating: { type: Type.STRING },
          sugarPer100g: { type: Type.NUMBER },
          carbsPer100g: { type: Type.NUMBER },
          advice: { type: Type.STRING },
          portionSize: { type: Type.STRING }
        },
        required: ["name", "giValue", "giRating", "sugarPer100g", "carbsPer100g", "advice", "portionSize"]
      }
    }
  });

  return JSON.parse(response.text);
};

/**
 * Analyzes a full meal image for daily sugar tracking
 */
export const analyzeMealImage = async (base64Image: string): Promise<{ foods: FoodAnalysis[], totalSugar: number, totalCarbs: number }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: "这是一顿正餐的照片。请识别餐盘中所有的食物，并估算整餐的总含糖量（克）和总碳水化合物量（克）。请以JSON格式返回，包含食物列表(foods)以及总和数据。" }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foods: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                sugarPer100g: { type: Type.NUMBER },
                giRating: { type: Type.STRING }
              }
            }
          },
          totalSugar: { type: Type.NUMBER },
          totalCarbs: { type: Type.NUMBER }
        },
        required: ["foods", "totalSugar", "totalCarbs"]
      }
    }
  });

  return JSON.parse(response.text);
};

/**
 * Speaks out the analysis results for elderly users
 */
export const speakAdvice = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `请用和蔼可亲、语速较慢的语气读出以下建议：${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Warm, friendly voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const frameCount = dataInt16.length;
      const buffer = audioContext.createBuffer(1, frameCount, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    }
  } catch (error) {
    console.error("TTS failed", error);
    // Fallback to browser TTS if API fails
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }
};
