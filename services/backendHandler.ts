
import { GoogleGenAI, Type } from "@google/genai";

/**
 * 【Cloud Run / サーバー側】
 * このロジックを Express や Hono などの Node.js サーバーで実行します。
 * process.env.API_KEY を安全に使用できます。
 */

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-3-flash-preview';

const kanjiListSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      character: { type: Type.STRING },
      onyomi: { type: Type.ARRAY, items: { type: Type.STRING } },
      kunyomi: { type: Type.ARRAY, items: { type: Type.STRING } },
      meaning: { type: Type.STRING },
      example: { type: Type.STRING }
    },
    required: ["character", "onyomi", "kunyomi", "meaning", "example"]
  }
};

const handwritingSchema = {
  type: Type.OBJECT,
  properties: {
    isCorrect: { type: Type.BOOLEAN },
    feedback: { type: Type.STRING },
    confidence: { type: Type.NUMBER }
  },
  required: ["isCorrect", "feedback", "confidence"]
};

/**
 * Cloud Run のハンドラー関数イメージ
 */
export const handleRequest = async (reqBody: any) => {
  const { action } = reqBody;

  switch (action) {
    case 'details':
      return await getKanjiDetails(reqBody.characters);
    case 'generate':
      return await generateKanji(reqBody.count, reqBody.excludeChars, reqBody.grade);
    case 'evaluate':
      return await analyzeHandwriting(reqBody.image, reqBody.targetKanji);
    default:
      throw new Error("Invalid action");
  }
};

async function getKanjiDetails(characters: string[]) {
  const prompt = `Provide the reading and meaning data for these Japanese Kanji: ${characters.join(', ')}. Return JSON.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: kanjiListSchema,
    },
  });
  return JSON.parse(response.text || '[]');
}

async function generateKanji(count: number, exclude: string[], grade: number) {
  const prompt = `Generate ${count} distinct Grade ${grade} Kanji. Exclude: ${exclude.join(',')}. Return JSON.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: kanjiListSchema,
    },
  });
  return JSON.parse(response.text || '[]');
}

async function analyzeHandwriting(base64Image: string, targetKanji: string) {
  const prompt = `Is this drawing the Kanji 「${targetKanji}」? Be encouraging to a child. Return JSON.`;
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/png", data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: handwritingSchema
    }
  });
  return JSON.parse(response.text || '{}');
}
