
/**
 * 【Cloud Run / サーバー側】
 * このロジックを Express や Hono などの Node.js サーバーで実行します。
 * process.env.API_KEY を安全に使用できます。
 */

let ai: any | null = null;
const model = 'gemini-3-flash-preview';

// Dynamic import helper
const loadGenAi = async () => {
    try {
        // @ts-ignore
        const module = await import("@google/genai");
        return module;
    } catch(e) {
        return null;
    }
}

const initServerAI = async () => {
  if (ai) return ai;
  const module = await loadGenAi();
  if (module && typeof process !== 'undefined' && process.env && process.env.API_KEY) {
     const { GoogleGenAI } = module;
     ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
     return ai;
  }
  return null;
}

/**
 * Cloud Run のハンドラー関数イメージ
 */
export const handleRequest = async (reqBody: any) => {
  const { action } = reqBody;
  
  const aiClient = await initServerAI();
  if (!aiClient) {
      throw new Error("Server AI not initialized (Missing API Key or Module)");
  }
  
  const module = await loadGenAi();
  const { Type } = module;

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

  switch (action) {
    case 'details':
      return await getKanjiDetails(aiClient, model, kanjiListSchema, reqBody.characters);
    case 'generate':
      return await generateKanji(aiClient, model, kanjiListSchema, reqBody.count, reqBody.excludeChars, reqBody.grade);
    case 'evaluate':
      return await analyzeHandwriting(aiClient, model, handwritingSchema, reqBody.image, reqBody.targetKanji);
    default:
      throw new Error("Invalid action");
  }
};

async function getKanjiDetails(ai: any, model: string, schema: any, characters: string[]) {
  const prompt = `Provide the reading and meaning data for these Japanese Kanji: ${characters.join(', ')}. Return JSON.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  return JSON.parse(response.text || '[]');
}

async function generateKanji(ai: any, model: string, schema: any, count: number, exclude: string[], grade: number) {
  const prompt = `Generate ${count} distinct Grade ${grade} Kanji. Exclude: ${exclude.join(',')}. Return JSON.`;
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  return JSON.parse(response.text || '[]');
}

async function analyzeHandwriting(ai: any, model: string, schema: any, base64Image: string, targetKanji: string) {
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
      responseSchema: schema
    }
  });
  return JSON.parse(response.text || '{}');
}
