
import { GoogleGenAI, Type } from "@google/genai";
import { KanjiData, DrawingResult } from '../types';
import { GRADE_KANJI_DATA_MAP, getKanjiListForGrade } from '../data/gradeKanji';

// SDKの初期化
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// ガイドラインに基づき、基本的なテキスト・画像認識タスクに適したモデル 'gemini-3-flash-preview' を使用
const modelName = 'gemini-3-flash-preview';

// 手書き評価用のスキーマ定義
const handwritingSchema = {
  type: Type.OBJECT,
  properties: {
    isCorrect: { type: Type.BOOLEAN, description: "True if the drawing resembles the target kanji" },
    feedback: { type: Type.STRING, description: "Encouraging feedback for a child (Japanese)" },
    confidence: { type: Type.NUMBER, description: "Confidence score 0-100" }
  },
  required: ["isCorrect", "feedback", "confidence"]
};

// JSONレスポンスからMarkdownの装飾を削除するヘルパー
const cleanJsonText = (text: string): string => {
  return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
};

/**
 * 指定された漢字の詳細情報を取得します。
 * ローカルデータを優先し、不足分のみAPIで取得するハイブリッド方式です。
 */
export const fetchKanjiDetails = async (characters: string[]): Promise<KanjiData[]> => {
    const localResults: KanjiData[] = [];
    const missingChars: string[] = [];

    // 1. 全学年のローカルデータから検索
    characters.forEach(char => {
        let found: KanjiData | undefined;
        for (const gradeData of Object.values(GRADE_KANJI_DATA_MAP)) {
            found = gradeData.find(k => k.character === char);
            if (found) break;
        }

        if (found) {
            localResults.push(found);
        } else {
            missingChars.push(char);
        }
    });

    if (missingChars.length === 0) {
        return localResults;
    }

    // 2. ローカルにない漢字のみAPIで取得
    try {
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

        const prompt = `
        Provide the reading and meaning data for the following Japanese Kanji characters: ${missingChars.join(', ')}.
        Return a JSON array.
        Meaning should be simple for elementary school students.
        `;
    
        // SDK ガイドライン: response.text プロパティを直接使用
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: kanjiListSchema,
            temperature: 0.3, 
          },
        });
    
        if (response.text) {
            const cleanedText = cleanJsonText(response.text);
            const apiResults = JSON.parse(cleanedText) as KanjiData[];
            return [...localResults, ...apiResults];
        }
        
        throw new Error("No data returned");

    } catch (error) {
        console.error("Error fetching kanji details:", error);
        const fallbacks = missingChars.map(char => ({
            character: char,
            onyomi: [],
            kunyomi: [],
            meaning: "よみこめませんでした",
            example: ""
        }));
        return [...localResults, ...fallbacks];
    }
};

/**
 * 漢字の問題リストを生成します。
 */
export const fetchKanji = async (count: number = 5, excludeChars: string[] = [], grade: number = 1): Promise<KanjiData[]> => {
  const fullCharList = getKanjiListForGrade(grade);
  
  if (fullCharList.length > 0) {
      const available = fullCharList.filter(c => !excludeChars.includes(c));
      const shuffled = [...available].sort(() => 0.5 - Math.random());
      const selectedChars = shuffled.slice(0, count);

      if (selectedChars.length < count) {
           const remainder = count - selectedChars.length;
           const fillers = fullCharList
              .filter(c => !selectedChars.includes(c))
              .sort(() => 0.5 - Math.random())
              .slice(0, remainder);
           selectedChars.push(...fillers);
      }

      return fetchKanjiDetails(selectedChars);
  }

  try {
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

    let excludePrompt = "";
    if (excludeChars.length > 0) {
        const limitedExclude = excludeChars.slice(-20); 
        excludePrompt = `Do NOT include these characters: ${limitedExclude.join(', ')}.`;
    }

    const prompt = `Generate ${count} distinct Japanese Kanji characters taught in Grade ${grade} of elementary school (小学校${grade}年生). 
    Provide readings and simple meaning appropriate for children.
    ${excludePrompt}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: kanjiListSchema,
        temperature: 0.7, 
      },
    });

    if (response.text) {
        const cleanedText = cleanJsonText(response.text);
        return JSON.parse(cleanedText) as KanjiData[];
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Error fetching kanji:", error);
    const g1 = GRADE_KANJI_DATA_MAP[1];
    const shuffled = [...g1].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
};

/**
 * 手書き文字の認識と評価を行います。
 */
export const evaluateHandwriting = async (base64Image: string, targetKanji: string): Promise<DrawingResult> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const prompt = `This is a drawing by a child practicing Kanji. The target character is 「${targetKanji}」.
    Analyze the image. Is the drawing recognizable as ${targetKanji}? 
    Be lenient with stroke order but strict with shape. 
    If it looks mostly correct, say yes.
    Give feedback in simple, polite Japanese for a child.`;

    // SDK ガイドライン: マルチパート（画像+テキスト）の形式で送信
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/png", data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: handwritingSchema
      }
    });

    if (response.text) {
       try {
        const cleanedText = cleanJsonText(response.text);
        return JSON.parse(cleanedText) as DrawingResult;
      } catch (parseError) {
         console.error("JSON Parse Error:", parseError, "Raw text:", response.text);
         throw new Error("Failed to parse handwriting result");
      }
    }
    throw new Error("No analysis returned");

  } catch (error) {
    console.error("Error evaluating handwriting:", error);
    return {
      isCorrect: true,
      feedback: "じょうずにかけているね！（オフラインモード）",
      confidence: 100
    };
  }
};
