
import { GoogleGenAI, Type } from "@google/genai";
import { KanjiData, DrawingResult } from '../types';
import { GRADE_KANJI_LISTS } from '../data/gradeKanji';

// ---------------------------------------------------------------------------
// 設定: APIキー
// ※ 書き取りの判定(AI)にのみ使用します。出題データはローカルを使用します。
// ---------------------------------------------------------------------------
// ブラウザ環境で process が存在しない場合のエラーを防ぐ
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

const API_KEY = getApiKey();

// APIキーがある場合のみクライアントを初期化
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const modelName = 'gemini-2.5-flash'; // 高速かつ安価なモデルを使用

// ---------------------------------------------------------------------------
// スキーマ定義 (書き取り判定用のみ使用)
// ---------------------------------------------------------------------------
const handwritingSchema = {
  type: Type.OBJECT,
  properties: {
    isCorrect: { type: Type.BOOLEAN },
    feedback: { type: Type.STRING },
    confidence: { type: Type.NUMBER }
  },
  required: ["isCorrect", "feedback", "confidence"]
};

// ---------------------------------------------------------------------------
// オフライン用データベース (Grade 1-6) - メインデータソース
// ---------------------------------------------------------------------------
const MOCK_KANJI_DB: Record<string, KanjiData> = {
  // --- 1年生 ---
  "一": { character: "一", onyomi: ["イチ"], kunyomi: ["ひと"], meaning: "かずの 1", example: "一つ" },
  "二": { character: "二", onyomi: ["ニ"], kunyomi: ["ふた"], meaning: "かずの 2", example: "二つ" },
  "三": { character: "三", onyomi: ["サン"], kunyomi: ["み"], meaning: "かずの 3", example: "三つ" },
  "四": { character: "四", onyomi: ["シ"], kunyomi: ["よ"], meaning: "かずの 4", example: "四つ" },
  "五": { character: "五", onyomi: ["ゴ"], kunyomi: ["いつ"], meaning: "かずの 5", example: "五つ" },
  "六": { character: "六", onyomi: ["ロク"], kunyomi: ["む"], meaning: "かずの 6", example: "六つ" },
  "七": { character: "七", onyomi: ["シチ"], kunyomi: ["なな"], meaning: "かずの 7", example: "七つ" },
  "八": { character: "八", onyomi: ["ハチ"], kunyomi: ["や"], meaning: "かずの 8", example: "八つ" },
  "九": { character: "九", onyomi: ["キュウ"], kunyomi: ["ここの"], meaning: "かずの 9", example: "九つ" },
  "十": { character: "十", onyomi: ["ジュウ"], kunyomi: ["とお"], meaning: "かずの 10", example: "十回" },
  "百": { character: "百", onyomi: ["ヒャク"], kunyomi: [], meaning: "100", example: "百てん" },
  "千": { character: "千", onyomi: ["セン"], kunyomi: ["ち"], meaning: "1000", example: "千円" },
  "日": { character: "日", onyomi: ["ニチ"], kunyomi: ["ひ", "か"], meaning: "たいよう", example: "日よう日" },
  "月": { character: "月", onyomi: ["ゲツ"], kunyomi: ["つき"], meaning: "おつきさま", example: "月よう日" },
  "火": { character: "火", onyomi: ["カ"], kunyomi: ["ひ"], meaning: "ほのお", example: "火よう日" },
  "水": { character: "水", onyomi: ["スイ"], kunyomi: ["みず"], meaning: "おみず", example: "水よう日" },
  "木": { character: "木", onyomi: ["モク"], kunyomi: ["き"], meaning: "じゅもく", example: "木よう日" },
  "金": { character: "金", onyomi: ["キン"], kunyomi: ["かね"], meaning: "おかね", example: "金よう日" },
  "土": { character: "土", onyomi: ["ド"], kunyomi: ["つち"], meaning: "つち", example: "土よう日" },
  "山": { character: "山", onyomi: ["サン"], kunyomi: ["やま"], meaning: "たかいやま", example: "ふじ山" },
  "川": { character: "川", onyomi: ["セン"], kunyomi: ["かわ"], meaning: "ながれる水", example: "川あそび" },
  "田": { character: "田", onyomi: ["デン"], kunyomi: ["た"], meaning: "たんぼ", example: "水田" },
  "犬": { character: "犬", onyomi: ["ケン"], kunyomi: ["いぬ"], meaning: "どうぶつ", example: "子犬" },
  "花": { character: "花", onyomi: ["カ"], kunyomi: ["はな"], meaning: "きれいなはな", example: "花火" },
  "虫": { character: "虫", onyomi: ["チュウ"], kunyomi: ["むし"], meaning: "ちいさないきもの", example: "昆虫" },
  "草": { character: "草", onyomi: ["ソウ"], kunyomi: ["くさ"], meaning: "みどりのくさ", example: "草花" },
  "雨": { character: "雨", onyomi: ["ウ"], kunyomi: ["あめ"], meaning: "そらからふる水", example: "雨あがり" },
  "空": { character: "空", onyomi: ["クウ"], kunyomi: ["そら"], meaning: "うえにあるそら", example: "青空" },
  "夕": { character: "夕", onyomi: ["セキ"], kunyomi: ["ゆう"], meaning: "ゆうがた", example: "夕やけ" },
  "石": { character: "石", onyomi: ["セキ"], kunyomi: ["いし"], meaning: "かたいいし", example: "石ころ" },
  "貝": { character: "貝", onyomi: [], kunyomi: ["かい"], meaning: "うみのいきもの", example: "貝がら" },
  "学": { character: "学", onyomi: ["ガク"], kunyomi: ["まなぶ"], meaning: "べんきょう", example: "学校" },
  "校": { character: "校", onyomi: ["コウ"], kunyomi: [], meaning: "がっこう", example: "校長" },
  "本": { character: "本", onyomi: ["ホン"], kunyomi: ["もと"], meaning: "よむほん", example: "絵本" },
  "文": { character: "文", onyomi: ["ブン"], kunyomi: ["ふみ"], meaning: "もじ", example: "作文" },
  "字": { character: "字", onyomi: ["ジ"], kunyomi: [], meaning: "もじ", example: "漢字" },
  "名": { character: "名", onyomi: ["メイ"], kunyomi: ["な"], meaning: "なまえ", example: "名ふだ" },
  "早": { character: "早", onyomi: ["ソウ"], kunyomi: ["はやい"], meaning: "じかんがはやい", example: "早おき" },
  "立": { character: "立", onyomi: ["リツ"], kunyomi: ["たつ"], meaning: "たつこと", example: "起立" },
  "休": { character: "休", onyomi: ["キュウ"], kunyomi: ["やすむ"], meaning: "やすむこと", example: "休み" },
  "手": { character: "手", onyomi: ["シュ"], kunyomi: ["て"], meaning: "からだのて", example: "手ぶくろ" },
  "足": { character: "足", onyomi: ["ソク"], kunyomi: ["あし"], meaning: "からだのあし", example: "足あと" },
  "目": { character: "目", onyomi: ["モク"], kunyomi: ["め"], meaning: "みるためのめ", example: "目だま" },
  "耳": { character: "耳", onyomi: ["ジ"], kunyomi: ["みみ"], meaning: "きくためのみみ", example: "耳かき" },
  "口": { character: "口", onyomi: ["コウ"], kunyomi: ["くち"], meaning: "たべるくち", example: "出口" },
  "力": { character: "力", onyomi: ["リョク"], kunyomi: ["ちから"], meaning: "パワー", example: "力もち" },
  "人": { character: "人", onyomi: ["ジン"], kunyomi: ["ひと"], meaning: "にんげん", example: "人びと" },
  "子": { character: "子", onyomi: ["シ"], kunyomi: ["こ"], meaning: "こども", example: "子ども" },
  "天": { character: "天", onyomi: ["テン"], kunyomi: ["あま"], meaning: "そら", example: "天気" },
  "気": { character: "気", onyomi: ["キ"], kunyomi: [], meaning: "きもち", example: "元気" },
  "白": { character: "白", onyomi: ["ハク"], kunyomi: ["しろ"], meaning: "しろいろ", example: "白鳥" },
  "赤": { character: "赤", onyomi: ["セキ"], kunyomi: ["あか"], meaning: "あかいろ", example: "赤ちゃん" },
  "青": { character: "青", onyomi: ["セイ"], kunyomi: ["あお"], meaning: "あおいろ", example: "青信号" },
  "大": { character: "大", onyomi: ["ダイ"], kunyomi: ["おおきい"], meaning: "でっかい", example: "大好き" },
  "小": { character: "小", onyomi: ["ショウ"], kunyomi: ["ちいさい"], meaning: "ちっちゃい", example: "小学校" },
  "中": { character: "中", onyomi: ["チュウ"], kunyomi: ["なか"], meaning: "まんなか", example: "背中" },
  "上": { character: "上", onyomi: ["ジョウ"], kunyomi: ["うえ"], meaning: "うえのほう", example: "上手" },
  "下": { character: "下", onyomi: ["カ"], kunyomi: ["した"], meaning: "したのほう", example: "下手" },
  "左": { character: "左", onyomi: ["サ"], kunyomi: ["ひだり"], meaning: "ひだりがわ", example: "左て" },
  "右": { character: "右", onyomi: ["ウ"], kunyomi: ["みぎ"], meaning: "みぎがわ", example: "右て" },
  "円": { character: "円", onyomi: ["エン"], kunyomi: ["まるい"], meaning: "おかね", example: "百円" },
  "出": { character: "出", onyomi: ["シュツ"], kunyomi: ["でる"], meaning: "そとにでる", example: "出口" },
  "入": { character: "入", onyomi: ["ニュウ"], kunyomi: ["はいる"], meaning: "なかにはいる", example: "入口" },
  "見": { character: "見", onyomi: ["ケン"], kunyomi: ["みる"], meaning: "みること", example: "見学" },
  "音": { character: "音", onyomi: ["オン"], kunyomi: ["おと"], meaning: "きこえるおと", example: "音楽" },
  "車": { character: "車", onyomi: ["シャ"], kunyomi: ["くるま"], meaning: "じどうしゃ", example: "電車" },
  "糸": { character: "糸", onyomi: ["シ"], kunyomi: ["いと"], meaning: "ぬういと", example: "毛糸" },
  "村": { character: "村", onyomi: ["ソン"], kunyomi: ["むら"], meaning: "むら", example: "村長" },
  "町": { character: "町", onyomi: ["チョウ"], kunyomi: ["まち"], meaning: "まち", example: "町内" },
  "王": { character: "王", onyomi: ["オウ"], kunyomi: [], meaning: "きんぐ", example: "王さま" },
  "玉": { character: "玉", onyomi: ["ギョク"], kunyomi: ["たま"], meaning: "ボール", example: "玉入れ" },
};

// ---------------------------------------------------------------------------
// ローカルロジック
// ---------------------------------------------------------------------------

function getOfflineKanji(count: number, excludeChars: string[], grade: number): KanjiData[] {
  const gradeList = GRADE_KANJI_LISTS[grade] || [];
  // DBに定義されている漢字のみを対象とする
  const definedKanji = gradeList.filter(char => MOCK_KANJI_DB[char] !== undefined);
  
  // 除外リストにある漢字を省く
  let available = definedKanji.filter(char => !excludeChars.includes(char));

  // もし出題できる漢字がなくなってしまったら、除外を無視して全候補から選ぶ
  if (available.length === 0 && definedKanji.length > 0) {
      available = definedKanji;
  }
  
  // ランダムにシャッフルして指定数取得
  const shuffled = available.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(char => MOCK_KANJI_DB[char]);
}

// ---------------------------------------------------------------------------
// サービス関数 (出題はローカル、判定はAI)
// ---------------------------------------------------------------------------

/**
 * 漢字の詳細データを取得する（常にローカルDBを使用）
 */
export const fetchKanjiDetails = async (characters: string[]): Promise<KanjiData[]> => {
  // APIは呼び出さず、常に内部辞書からデータを返します。
  return characters.map(char => MOCK_KANJI_DB[char] || {
    character: char,
    onyomi: [],
    kunyomi: [],
    meaning: "（じしょ に ないよ）",
    example: ""
  });
};

/**
 * 漢字の問題を生成する（常にローカルDBを使用）
 */
export const fetchKanji = async (count: number = 5, excludeChars: string[] = [], grade: number = 1): Promise<KanjiData[]> => {
  // APIは呼び出さず、常に内部ロジックで問題を生成します。
  return getOfflineKanji(count, excludeChars, grade);
};

/**
 * 書き取りの判定を行う（AIがあればAIを使用、なければ正解扱い）
 * ※ ここだけはAPIキーがあればAIを使います。
 */
export const evaluateHandwriting = async (base64Image: string, targetKanji: string): Promise<DrawingResult> => {
  if (!ai) {
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
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    const prompt = `Is this drawing the Kanji 「${targetKanji}」? Assess correctness for a child learner. Be encouraging. Return JSON.`;
    
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

    // Guidelines: Use .text property, not .text()
    const text = response.text;
    return JSON.parse(text || '{}');
  } catch (error) {
    console.warn("Gemini API Error (evaluateHandwriting):", error);
    // AIエラー時も学習を止めないように正解扱いにする
    return {
      isCorrect: true,
      feedback: "（通信エラー）判定できなかったけど、よくかけたね！",
      confidence: 0
    };
  }
};
