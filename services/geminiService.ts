
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

// Initialize Gemini Client using the mandatory environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeCatPhoto = async (base64Image: string): Promise<AIAnalysisResult> => {
  try {
    // Guidelines: Use 'gemini-2.5-flash-image' for image analysis
    const model = 'gemini-2.5-flash-image';
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        isCat: { type: Type.BOOLEAN, description: "Is there a cat in the image?" },
        quality: { type: Type.STRING, enum: ["high", "low"], description: "Is the image clear enough to identify markings?" },
        features: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Visual features like color, pattern, tail shape, etc." 
        },
        message: { type: Type.STRING, description: "A short feedback message in Japanese." }
      },
      required: ["isCat", "quality", "features", "message"]
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: "この画像を解析して、地域猫保護アプリ用のデータを抽出してください。日本語で回答してください。"
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    // Access text property directly (not a method)
    const text = response.text;
    if (!text) throw new Error("AIからの応答が空でした。");

    const result = JSON.parse(text);

    return {
      isCat: result.isCat,
      quality: result.quality as 'high' | 'low',
      features: result.features || [],
      suggestedCatIds: [], 
      message: result.message
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      isCat: false,
      quality: 'low',
      features: [],
      suggestedCatIds: [],
      message: "AI解析中にエラーが発生しました。時間を置いて再度お試しください。"
    };
  }
};
