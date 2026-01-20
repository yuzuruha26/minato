
// Fix: Ensure proper named imports from @google/genai as per current guidelines.
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AIAnalysisResult } from "../types";

export const analyzeCatPhoto = async (base64Image: string): Promise<AIAnalysisResult> => {
  try {
    // Fix: Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

    // Guidelines: Use 'gemini-3-flash-preview' for basic multimodal reasoning and analysis tasks
    const model = 'gemini-3-flash-preview';
    
    // Fix: Strip the Data URL prefix (e.g., "data:image/jpeg;base64,") before sending to Gemini API
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const schema = {
      type: Type.OBJECT,
      properties: {
        isCat: { type: Type.BOOLEAN, description: "Is there a cat in the image?" },
        quality: { type: Type.STRING, description: "Is the image clear enough to identify markings? (high or low)" },
        features: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Visual features like color, pattern, tail shape, etc." 
        },
        message: { type: Type.STRING, description: "A short feedback message in Japanese." }
      },
      required: ["isCat", "quality", "features", "message"]
    };

    // Fix: Use GenerateContentResponse type and call generateContent directly on ai.models
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
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

    // Fix: Access .text property directly and handle potential markdown wrapping for robust JSON parsing
    const text = response.text || "";
    if (!text) throw new Error("AIからの応答が空でした。");

    // Fix: Extract JSON string even if wrapped in markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const result = JSON.parse(jsonStr.trim());

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
