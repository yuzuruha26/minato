
// Fix: Follow @google/genai guidelines for named imports.
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Cat } from "../types";

export interface CatSimilarityResult {
  catId: string;
  score: number; // 0〜1
  reason: string;
}

/**
 * AIを使用して、アップロードされた画像と登録済みの猫リストの類似性を判定します。
 * 
 * @param imageBase64 画像のBase64文字列（データURLを含む場合がある）
 * @param cats 比較対象となる登録済みの猫リスト
 * @returns 類似度の高い上位3件の結果
 */
export const judgeCatSimilarity = async (
  imageBase64: string,
  cats: Cat[]
): Promise<CatSimilarityResult[]> => {
  try {
    // Fix: Initialize GoogleGenAI right before use to ensure API key freshness.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // ガイドラインに従い 'gemini-3-flash-preview' を使用
    const model = 'gemini-3-flash-preview';

    // データURLのプレフィックスを除去
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          catId: { type: Type.STRING, description: "猫のID" },
          score: { type: Type.NUMBER, description: "類似度スコア (0.0 - 1.0)" },
          reason: { type: Type.STRING, description: "判定理由（日本語）" }
        },
        required: ["catId", "score", "reason"]
      }
    };

    const prompt = `
あなたは地域猫保護団体のエキスパートAIです。
アップロードされた写真の猫と、以下の「登録済み猫リスト」を比較して、外見（模様、色、尻尾、耳カットなど）が似ている猫を特定してください。
類似度の高い順に上位3件をJSON形式で返してください。

登録済み猫リスト：
${cats.map(c => `- id: ${c.id}, 名前: ${c.name}, 特徴: ${c.features}`).join("\n")}
`;

    // Fix: Use GenerateContentResponse type and access ai.models.generateContent directly
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      },
    });

    // Fix: Access .text property and handle markdown code blocks for robust JSON parsing
    const text = response.text || "";
    if (!text) return [];

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error("Similarity Judgment Error:", error);
    return [];
  }
};
