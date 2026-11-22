import { GoogleGenAI, Type } from "@google/genai";
import { KanjiData, DrawingResult } from '../types';
import { GRADE_KANJI_DATA_MAP, getKanjiListForGrade } from '../data/gradeKanji';
import { getActiveApiKey } from './apiKeyStorage';
import { evaluateKanjiLocally } from './localKanjiEvaluator';

// コストが最も安く高速な軽量モデル 'gemini-3.1-flash-lite' を使用
const modelName = 'gemini-3.1-flash-lite';

// 手書き評価用のスキーマ定義
const handwritingSchema = {
  type: Type.OBJECT,
  properties: {
    isCorrect: { type: Type.BOOLEAN, description: "True if the drawing resembles the target kanji" },
    feedback: { type: Type.STRING, description: "Encouraging feedback for a child in friendly Japanese" },
    confidence: { type: Type.NUMBER, description: "Confidence score 0-100" }
  },
  required: ["isCorrect", "feedback", "confidence"]
};

// JSONレスポンスからMarkdownの装飾を削除するヘルパー
const cleanJsonText = (text: string): string => {
  return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
};

const ENCOURAGING_FEEDBACKS = [
  "とても じょうずにかけているよ！",
  "かっこよく かけたね！そのちょうし！",
  "はなまる！ていねいに かけたね！",
  "すばらしい！よくがんばったね！",
  "きれいな かたちで かけたね！",
  "ばっちり！つぎの かんじも いってみよう！"
];

const getRandomEncouragement = (): string => {
  return ENCOURAGING_FEEDBACKS[Math.floor(Math.random() * ENCOURAGING_FEEDBACKS.length)];
};

/**
 * キャンバス画像（base64）の描画量を簡易解析して、白紙やごく僅かな点を検出
 */
const analyzeDrawnStrokes = async (base64Image: string): Promise<{ darkPixels: number; hasDrawing: boolean }> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ darkPixels: 500, hasDrawing: true });
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.width || 300;
        offCanvas.height = img.height || 300;
        const ctx = offCanvas.getContext('2d');
        if (!ctx) {
          resolve({ darkPixels: 500, hasDrawing: true });
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);
        const data = imgData.data;
        let darkCount = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          // 非白かつ透明でないピクセルをカウント
          if (a > 50 && (r < 200 || g < 200 || b < 200)) {
            darkCount++;
          }
        }
        // 80ピクセル以上の描画があれば線が引かれているとみなす
        resolve({ darkPixels: darkCount, hasDrawing: darkCount > 80 });
      } catch {
        resolve({ darkPixels: 500, hasDrawing: true });
      }
    };
    img.onerror = () => {
      resolve({ darkPixels: 500, hasDrawing: true });
    };
    img.src = base64Image;
  });
};

/**
 * 指定された漢字の詳細情報を取得します。
 * ローカル辞書データを優先し、不足分のみAPIで取得するハイブリッド方式です。
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

  // 2. ローカルにない漢字のみ有効なAPIキーがある場合に取得
  const activeKey = getActiveApiKey();
  if (activeKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

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
    } catch (error) {
      console.warn("Error fetching kanji details from API:", error);
    }
  }

  const fallbacks = missingChars.map(char => ({
    character: char,
    onyomi: [],
    kunyomi: [],
    meaning: "れんしゅうようかんじ",
    example: ""
  }));
  return [...localResults, ...fallbacks];
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

  const g1 = GRADE_KANJI_DATA_MAP[1];
  const shuffled = [...g1].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * 手書き文字の認識と評価を行います。
 * - 白紙チェック
 * - Google AI Studio APIキーがあればGeminiモデルで高精度評価
 * - APIキーがない場合や通信エラー時も自然で励みになるフィードバックを提供（オフラインモード等の機械的表示は排除）
 */
export const evaluateHandwriting = async (base64Image: string, targetKanji: string): Promise<DrawingResult> => {
  // 1. Google AI Studio APIキーが存在する場合はGeminiで高精度採点
  const activeKey = getActiveApiKey();
  if (activeKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

      const prompt = `You are a warm, supportive Japanese elementary school teacher evaluating a child's handwriting.
Target Kanji: 「${targetKanji}」
Task:
1. Carefully check if the child drew the actual kanji character 「${targetKanji}」.
2. If the user drew nothing, random scribbles, or only an incomplete stroke (such as just 1 line or a dot for a multi-stroke kanji), set isCorrect: false.
3. If the user wrote the character and it recognizably resembles 「${targetKanji}」 (be lenient with slight stroke imperfections for children), set isCorrect: true.
4. If it is clearly a different character or missing major parts, set isCorrect: false.
5. Provide encouraging feedback in simple polite Japanese suitable for an elementary school child (1-2 sentences).`;

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
        const cleanedText = cleanJsonText(response.text);
        const parsed = JSON.parse(cleanedText) as DrawingResult;
        return {
          ...parsed,
          evaluatedBy: 'ai'
        };
      }
    } catch (apiError) {
      console.warn("Gemini API evaluation failed, falling back to local evaluation:", apiError);
    }
  }

  // 2. ローカル高精度判定（構造・グリッド・画数・形状照合）
  return evaluateKanjiLocally(base64Image, targetKanji);
};
