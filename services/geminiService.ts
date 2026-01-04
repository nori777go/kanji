
import { KanjiData, DrawingResult } from '../types';
import { GRADE_KANJI_LISTS } from '../data/gradeKanji';

// Note: Dynamic import is used for @google/genai to ensure the app loads 
// even if the package is missing or fails to resolve in the browser environment.

// ---------------------------------------------------------------------------
// 設定: APIキー & クライアント (遅延 & 動的初期化)
// ---------------------------------------------------------------------------

let aiInstance: any | null = null;
let isInitialized = false;
let genAiModule: any = null;

const loadGenAiModule = async () => {
  if (genAiModule) return genAiModule;
  try {
    // @ts-ignore
    genAiModule = await import("@google/genai");
    return genAiModule;
  } catch (e) {
    console.warn("Could not load @google/genai module. Offline mode active.", e);
    return null;
  }
};

const getAiClient = async (): Promise<any | null> => {
  if (isInitialized) return aiInstance;

  const module = await loadGenAiModule();
  if (!module) {
      isInitialized = true;
      return null;
  }

  try {
    // ブラウザ環境で安全にAPIキーを確認
    let apiKey: string | undefined = undefined;
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY;
    }

    if (apiKey) {
      const { GoogleGenAI } = module;
      aiInstance = new GoogleGenAI({ apiKey: apiKey });
    }
  } catch (e) {
    console.warn("Gemini client initialization failed (offline mode):", e);
    aiInstance = null;
  }

  isInitialized = true;
  return aiInstance;
};

const modelName = 'gemini-2.5-flash';

// ---------------------------------------------------------------------------
// オフライン用データベース (小学1年生 完全対応 + その他)
// ---------------------------------------------------------------------------
const MOCK_KANJI_DB: Record<string, KanjiData> = {
  // --- 1年生 (全80字) ---
  "一": { character: "一", onyomi: ["イチ"], kunyomi: ["ひと"], meaning: "かずの 1", example: "一つ" },
  "右": { character: "右", onyomi: ["ウ"], kunyomi: ["みぎ"], meaning: "みぎがわ", example: "右手" },
  "雨": { character: "雨", onyomi: ["ウ"], kunyomi: ["あめ"], meaning: "そらから ふる 水", example: "大雨" },
  "円": { character: "円", onyomi: ["エン"], kunyomi: ["まる"], meaning: "おかね、まる", example: "百円" },
  "王": { character: "王", onyomi: ["オウ"], kunyomi: [], meaning: "きんぐ", example: "王さま" },
  "音": { character: "音", onyomi: ["オン"], kunyomi: ["おと"], meaning: "おと", example: "音楽" },
  "下": { character: "下", onyomi: ["カ"], kunyomi: ["した"], meaning: "したのほう", example: "下じき" },
  "火": { character: "火", onyomi: ["カ"], kunyomi: ["ひ"], meaning: "あつい ほのお", example: "花火" },
  "花": { character: "花", onyomi: ["カ"], kunyomi: ["はな"], meaning: "きれいな はな", example: "花たば" },
  "貝": { character: "貝", onyomi: [], kunyomi: ["かい"], meaning: "うみの いきもの", example: "貝がら" },
  "学": { character: "学", onyomi: ["ガク"], kunyomi: ["まな"], meaning: "べんきょう", example: "学校" },
  "気": { character: "気", onyomi: ["キ"], kunyomi: [], meaning: "きもち", example: "元気" },
  "九": { character: "九", onyomi: ["キュウ"], kunyomi: ["ここの"], meaning: "かずの 9", example: "九つ" },
  "休": { character: "休", onyomi: ["キュウ"], kunyomi: ["やす"], meaning: "やすむ", example: "休み" },
  "玉": { character: "玉", onyomi: ["ギョク"], kunyomi: ["たま"], meaning: "ボール", example: "玉入れ" },
  "金": { character: "金", onyomi: ["キン"], kunyomi: ["かね"], meaning: "きんいろ、おかね", example: "金メダル" },
  "空": { character: "空", onyomi: ["クウ"], kunyomi: ["そら"], meaning: "うえに ある そら", example: "青空" },
  "月": { character: "月", onyomi: ["ゲツ"], kunyomi: ["つき"], meaning: "おつきさま", example: "月よう日" },
  "犬": { character: "犬", onyomi: ["ケン"], kunyomi: ["いぬ"], meaning: "ワンワン", example: "子犬" },
  "見": { character: "見", onyomi: ["ケン"], kunyomi: ["み"], meaning: "みる", example: "花見" },
  "五": { character: "五", onyomi: ["ゴ"], kunyomi: ["いつ"], meaning: "かずの 5", example: "五つ" },
  "口": { character: "口", onyomi: ["コウ"], kunyomi: ["くち"], meaning: "たべる くち", example: "出口" },
  "校": { character: "校", onyomi: ["コウ"], kunyomi: [], meaning: "がっこう", example: "校長" },
  "左": { character: "左", onyomi: ["サ"], kunyomi: ["ひだり"], meaning: "ひだりがわ", example: "左手" },
  "三": { character: "三", onyomi: ["サン"], kunyomi: ["み"], meaning: "かずの 3", example: "三つ" },
  "山": { character: "山", onyomi: ["サン"], kunyomi: ["やま"], meaning: "たかい やま", example: "山のぼり" },
  "子": { character: "子", onyomi: ["シ"], kunyomi: ["こ"], meaning: "こども", example: "女の子" },
  "四": { character: "四", onyomi: ["シ"], kunyomi: ["よ"], meaning: "かずの 4", example: "四つ" },
  "糸": { character: "糸", onyomi: ["シ"], kunyomi: ["いと"], meaning: "いと", example: "毛糸" },
  "字": { character: "字", onyomi: ["ジ"], kunyomi: [], meaning: "もじ", example: "漢字" },
  "耳": { character: "耳", onyomi: ["ジ"], kunyomi: ["みみ"], meaning: "きこえる みみ", example: "耳かき" },
  "七": { character: "七", onyomi: ["シチ"], kunyomi: ["なな"], meaning: "かずの 7", example: "七つ" },
  "車": { character: "車", onyomi: ["シャ"], kunyomi: ["くるま"], meaning: "のりもの", example: "電車" },
  "手": { character: "手", onyomi: ["シュ"], kunyomi: ["て"], meaning: "からだの て", example: "手ぶくろ" },
  "十": { character: "十", onyomi: ["ジュウ"], kunyomi: ["とお"], meaning: "かずの 10", example: "十回" },
  "出": { character: "出", onyomi: ["シュツ"], kunyomi: ["で"], meaning: "でる", example: "出口" },
  "女": { character: "女", onyomi: ["ジョ"], kunyomi: ["おんな"], meaning: "おんなのひと", example: "女の子" },
  "小": { character: "小", onyomi: ["ショウ"], kunyomi: ["ちい"], meaning: "ちいさい", example: "小学校" },
  "上": { character: "上", onyomi: ["ジョウ"], kunyomi: ["うえ"], meaning: "うえのほう", example: "上着" },
  "森": { character: "森", onyomi: ["シン"], kunyomi: ["もり"], meaning: "きが たくさん", example: "森の中" },
  "人": { character: "人", onyomi: ["ジン"], kunyomi: ["ひと"], meaning: "にんげん", example: "日本人" },
  "水": { character: "水", onyomi: ["スイ"], kunyomi: ["みず"], meaning: "おみず", example: "水えい" },
  "正": { character: "正", onyomi: ["セイ"], kunyomi: ["ただ"], meaning: "ただしい", example: "正かい" },
  "生": { character: "生", onyomi: ["セイ"], kunyomi: ["い"], meaning: "いきる", example: "先生" },
  "青": { character: "青", onyomi: ["セイ"], kunyomi: ["あお"], meaning: "あおいろ", example: "青空" },
  "夕": { character: "夕", onyomi: ["セキ"], kunyomi: ["ゆう"], meaning: "ゆうがた", example: "夕やけ" },
  "石": { character: "石", onyomi: ["セキ"], kunyomi: ["いし"], meaning: "かたい いし", example: "石ころ" },
  "赤": { character: "赤", onyomi: ["セキ"], kunyomi: ["あか"], meaning: "あかいろ", example: "赤ぐつ" },
  "千": { character: "千", onyomi: ["セン"], kunyomi: ["ち"], meaning: "1000", example: "千円" },
  "川": { character: "川", onyomi: ["セン"], kunyomi: ["かわ"], meaning: "ながれる かわ", example: "川あそび" },
  "先": { character: "先", onyomi: ["セン"], kunyomi: ["さき"], meaning: "まえ、さき", example: "先生" },
  "早": { character: "早", onyomi: ["ソウ"], kunyomi: ["はや"], meaning: "はやい", example: "早おき" },
  "草": { character: "草", onyomi: ["ソウ"], kunyomi: ["くさ"], meaning: "みどりの くさ", example: "草花" },
  "足": { character: "足", onyomi: ["ソク"], kunyomi: ["あし"], meaning: "からだの あし", example: "遠足" },
  "村": { character: "村", onyomi: ["ソン"], kunyomi: ["むら"], meaning: "むら", example: "村長" },
  "大": { character: "大", onyomi: ["ダイ"], kunyomi: ["おお"], meaning: "おおきい", example: "大会" },
  "男": { character: "男", onyomi: ["ダン"], kunyomi: ["おとこ"], meaning: "おとこのひと", example: "男の子" },
  "竹": { character: "竹", onyomi: ["チク"], kunyomi: ["たけ"], meaning: "バンブー", example: "竹うま" },
  "中": { character: "中", onyomi: ["チュウ"], kunyomi: ["なか"], meaning: "まんなか", example: "中学" },
  "虫": { character: "虫", onyomi: ["チュウ"], kunyomi: ["むし"], meaning: "ちいさな いきもの", example: "昆虫" },
  "町": { character: "町", onyomi: ["チョウ"], kunyomi: ["まち"], meaning: "まち", example: "町内" },
  "天": { character: "天", onyomi: ["テン"], kunyomi: ["あま"], meaning: "てんごく、そら", example: "天気" },
  "田": { character: "田", onyomi: ["デン"], kunyomi: ["た"], meaning: "たんぼ", example: "水田" },
  "土": { character: "土", onyomi: ["ド"], kunyomi: ["つち"], meaning: "つち", example: "土" },
  "二": { character: "二", onyomi: ["ニ"], kunyomi: ["ふた"], meaning: "かずの 2", example: "二つ" },
  "日": { character: "日", onyomi: ["ニチ"], kunyomi: ["ひ"], meaning: "たいよう", example: "日よう日" },
  "入": { character: "入", onyomi: ["ニュウ"], kunyomi: ["はい"], meaning: "はいる", example: "入学" },
  "年": { character: "年", onyomi: ["ネン"], kunyomi: ["とし"], meaning: "1ねんかん", example: "一年生" },
  "白": { character: "白", onyomi: ["ハク"], kunyomi: ["しろ"], meaning: "しろいろ", example: "白鳥" },
  "八": { character: "八", onyomi: ["ハチ"], kunyomi: ["や"], meaning: "かずの 8", example: "八つ" },
  "百": { character: "百", onyomi: ["ヒャク"], kunyomi: [], meaning: "100", example: "百てん" },
  "文": { character: "文", onyomi: ["ブン"], kunyomi: ["ふみ"], meaning: "さくぶん、もじ", example: "作文" },
  "木": { character: "木", onyomi: ["モク"], kunyomi: ["き"], meaning: "き", example: "木よう日" },
  "本": { character: "本", onyomi: ["ホン"], kunyomi: ["もと"], meaning: "よむ ほん", example: "絵本" },
  "名": { character: "名", onyomi: ["メイ"], kunyomi: ["な"], meaning: "なまえ", example: "名ふだ" },
  "目": { character: "目", onyomi: ["モク"], kunyomi: ["め"], meaning: "みる め", example: "目だま" },
  "立": { character: "立", onyomi: ["リツ"], kunyomi: ["た"], meaning: "たつ", example: "起立" },
  "力": { character: "力", onyomi: ["リョク"], kunyomi: ["ちから"], meaning: "パワー", example: "力もち" },
  "林": { character: "林", onyomi: ["リン"], kunyomi: ["はやし"], meaning: "きが ならんでいる", example: "林" },
  "六": { character: "六", onyomi: ["ロク"], kunyomi: ["む"], meaning: "かずの 6", example: "六つ" }
};

// ---------------------------------------------------------------------------
// 共通ロジック
// ---------------------------------------------------------------------------

function getOfflineKanji(count: number, excludeChars: string[], grade: number): KanjiData[] {
  const gradeList = GRADE_KANJI_LISTS[grade] || [];
  // MOCK_DBに存在するかチェック
  const definedKanji = gradeList.filter(char => MOCK_KANJI_DB[char] !== undefined);
  
  // 除外リストに含まれていないものを抽出
  let available = definedKanji.filter(char => !excludeChars.includes(char));
  
  // もし全て除外されてしまったら、リセットして全漢字から選ぶ
  if (available.length === 0 && definedKanji.length > 0) {
      available = definedKanji;
  }
  
  const shuffled = available.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(char => MOCK_KANJI_DB[char]);
}

// ---------------------------------------------------------------------------
// サービス関数
// ---------------------------------------------------------------------------

export const fetchKanjiDetails = async (characters: string[]): Promise<KanjiData[]> => {
  return characters.map(char => MOCK_KANJI_DB[char] || {
    character: char,
    onyomi: [],
    kunyomi: [],
    meaning: "（データなし）",
    example: ""
  });
};

export const fetchKanji = async (count: number = 5, excludeChars: string[] = [], grade: number = 1): Promise<KanjiData[]> => {
  return getOfflineKanji(count, excludeChars, grade);
};

export const evaluateHandwriting = async (base64Image: string, targetKanji: string): Promise<DrawingResult> => {
  const ai = await getAiClient();
  const module = await loadGenAiModule();
  
  // AIが初期化されていない場合はオフラインモードで応答
  if (!ai || !module) {
     return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          isCorrect: true,
          feedback: "（オフラインモード）とてもきれいに かけているね！",
          confidence: 0.99
        });
      }, 500);
    });
  }

  try {
    const { Type } = module;
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const prompt = `Is this drawing the Kanji 「${targetKanji}」? Assess correctness for a child learner. Be encouraging. Return JSON.`;
    
    // スキーマも動的に定義（Type依存のため）
    const handwritingSchema = {
      type: Type.OBJECT,
      properties: {
        isCorrect: { type: Type.BOOLEAN },
        feedback: { type: Type.STRING },
        confidence: { type: Type.NUMBER }
      },
      required: ["isCorrect", "feedback", "confidence"]
    };

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

    const text = response.text;
    return JSON.parse(text || '{}');
  } catch (error) {
    console.warn("Gemini API Error (evaluateHandwriting):", error);
    return {
      isCorrect: true,
      feedback: "（通信エラー）判定できなかったけど、よくかけたね！",
      confidence: 0
    };
  }
};
