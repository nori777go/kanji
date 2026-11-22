import { generateGeminiContent } from "./geminiClient";
import { KanjiData, DrawingResult } from '../types';
import { GRADE_KANJI_DATA_MAP, getKanjiListForGrade } from '../data/gradeKanji';
import { getActiveApiKey } from './apiKeyStorage';
import { evaluateKanjiLocally } from './localKanjiEvaluator';


// 手書き評価用のスキーマ定義
const handwritingSchema = {
  type: 'OBJECT',
  properties: {
    isCorrect: { type: 'BOOLEAN', description: "True if the drawing resembles the target kanji" },
    feedback: { type: 'STRING', description: "Encouraging feedback for a child in friendly Japanese" },
    confidence: { type: 'NUMBER', description: "Confidence score 0-100" }
  },
  required: ["isCorrect", "feedback", "confidence"]
};

// JSONレスポンスからMarkdownの装飾を削除するヘルパー
const cleanJsonText = (text: string): string => {
  return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
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


      const kanjiListSchema = {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            character: { type: 'STRING' },
            onyomi: { type: 'ARRAY', items: { type: 'STRING' } },
            kunyomi: { type: 'ARRAY', items: { type: 'STRING' } },
            meaning: { type: 'STRING' },
            example: { type: 'STRING' }
          },
          required: ["character", "onyomi", "kunyomi", "meaning", "example"]
        }
      };

      const prompt = `
      Provide the reading and meaning data for the following Japanese Kanji characters: ${missingChars.join(', ')}.
      Return a JSON array.
      Meaning should be simple for elementary school students.
      `;

      const response = await generateGeminiContent(activeKey, prompt, {
          responseMimeType: "application/json",
          responseSchema: kanjiListSchema,
          temperature: 0.3,
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
 * - AIの読み取り文字とお題を照合する
 * - キー未設定、通信失敗、不確実な結果には得点を付けない
 */
export const evaluateHandwriting = async (base64Image: string, targetKanji: string): Promise<DrawingResult> => {
  const activeKey = getActiveApiKey();
  if (!activeKey) return evaluateKanjiLocally(base64Image, targetKanji);
  try {
    const response = await generateGeminiContent(activeKey, {parts:[
      {inlineData:{mimeType:'image/png',data:base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')}},
      {text:`Read the actual handwritten kanji first. Do not infer missing strokes from the target. Report recognizedCharacter as the single character you actually read, or empty if blank, scribbled, incomplete or uncertain. Then compare with target 「${targetKanji}」. Set isCorrect true only for the complete target character. A different character or missing major strokes is incorrect. Be kind about minor handwriting imperfections but never praise an incorrect character as correct. Return short Japanese feedback, confidence (0-100), recognizedCharacter and isCorrect.`}
    ]}, {responseMimeType:'application/json', responseSchema:{...handwritingSchema,properties:{...handwritingSchema.properties,recognizedCharacter:{type:'STRING'}},required:[...handwritingSchema.required,'recognizedCharacter']}});
    const parsed = JSON.parse(cleanJsonText(response.text));
    if (typeof parsed.isCorrect !== 'boolean' || typeof parsed.recognizedCharacter !== 'string' || typeof parsed.confidence !== 'number' || !Number.isFinite(parsed.confidence) || parsed.confidence < 70) {
      return {isCorrect:false,judged:false,feedback:'はっきり よみとれなかったよ。もういちど採点するか、書きなおしてみてね。',confidence:0,evaluatedBy:'ai'};
    }
    const correct = parsed.isCorrect === true && parsed.recognizedCharacter.trim().normalize('NFC') === targetKanji.normalize('NFC');
    return {isCorrect:correct,judged:true,feedback:correct ? 'はなまる！正しい かんじが かけたね！' : 'おしい！お手本と かたちを くらべて、もういちど かいてみよう！',confidence:Math.min(100,Math.max(0,parsed.confidence)),evaluatedBy:'ai'};
  } catch (error) {
    return {isCorrect:false,judged:false,feedback:error instanceof Error ? error.message : 'AIに接続できませんでした。もういちど採点してみてね。',confidence:0,evaluatedBy:'ai'};
  }
};
