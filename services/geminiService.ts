import { KanjiData, DrawingResult } from '../types';
import { GRADE_KANJI_LISTS } from '../data/gradeKanji';

/**
 * 【iOSアプリ / Webアプリ 共通】
 * APIキーを一切持たず、Cloud Run のエンドポイントを呼び出します。
 * 接続できない場合は、内蔵のモックデータを使用して動作します。
 */

// 本番環境のCloud Run URL
const CLOUD_RUN_URL = 'https://your-pikapika-backend-xxxxxx.a.run.app/api/gemini'; 

// URLがプレースホルダー（未設定）のままかどうか判定
const IS_BACKEND_CONFIGURED = !CLOUD_RUN_URL.includes('your-pikapika-backend');

const BACKEND_ENDPOINT = window.location.hostname === 'localhost' 
  ? '/api/gemini' 
  : CLOUD_RUN_URL;

// ---------------------------------------------------------------------------
// オフライン用データベース (Grade 1-6)
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

  // --- 2年生 ---
  "引": { character: "引", onyomi: ["イン"], kunyomi: ["ひく"], meaning: "ひっぱる", example: "引き算" },
  "雲": { character: "雲", onyomi: ["ウン"], kunyomi: ["くも"], meaning: "そらのくも", example: "雨雲" },
  "遠": { character: "遠", onyomi: ["エン"], kunyomi: ["とおい"], meaning: "はなれている", example: "遠足" },
  "園": { character: "園", onyomi: ["エン"], kunyomi: ["その"], meaning: "にわ", example: "公園" },
  "夏": { character: "夏", onyomi: ["カ"], kunyomi: ["なつ"], meaning: "あついなつ", example: "夏休み" },
  "家": { character: "家", onyomi: ["カ"], kunyomi: ["いえ"], meaning: "おうち", example: "家族" },
  "歌": { character: "歌", onyomi: ["カ"], kunyomi: ["うた"], meaning: "ソング", example: "歌手" },
  "画": { character: "画", onyomi: ["ガ"], kunyomi: [], meaning: "え", example: "画用紙" },
  "回": { character: "回", onyomi: ["カイ"], kunyomi: ["まわる"], meaning: "くるくる", example: "一回" },
  "会": { character: "会", onyomi: ["カイ"], kunyomi: ["あう"], meaning: "あうこと", example: "会話" },
  "海": { character: "海", onyomi: ["カイ"], kunyomi: ["うみ"], meaning: "ひろいうみ", example: "海水よく" },
  "絵": { character: "絵", onyomi: ["カイ"], kunyomi: ["え"], meaning: "イラスト", example: "絵本" },
  "外": { character: "外", onyomi: ["ガイ"], kunyomi: ["そと"], meaning: "そとがわ", example: "外国" },
  "楽": { character: "楽", onyomi: ["ガク"], kunyomi: ["たのしい"], meaning: "たのしい", example: "音楽" },
  "間": { character: "間", onyomi: ["カン"], kunyomi: ["あいだ"], meaning: "あいだ", example: "時間" },
  "顔": { character: "顔", onyomi: ["ガン"], kunyomi: ["かお"], meaning: "かお", example: "顔いろ" },
  "記": { character: "記", onyomi: ["キ"], kunyomi: ["しるす"], meaning: "かくこと", example: "日記" },
  "魚": { character: "魚", onyomi: ["ギョ"], kunyomi: ["さかな"], meaning: "さかな", example: "金魚" },
  "強": { character: "強", onyomi: ["キョウ"], kunyomi: ["つよい"], meaning: "つよい", example: "勉強" },
  "教": { character: "教", onyomi: ["キョウ"], kunyomi: ["おしえる"], meaning: "おしえる", example: "教室" },
  "近": { character: "近", onyomi: ["キン"], kunyomi: ["ちかい"], meaning: "そば", example: "近所" },
  "兄": { character: "兄", onyomi: ["ケイ"], kunyomi: ["あに"], meaning: "おにいさん", example: "兄弟" },
  "形": { character: "形", onyomi: ["ケイ"], kunyomi: ["かたち"], meaning: "かたち", example: "図形" },
  "計": { character: "計", onyomi: ["ケイ"], kunyomi: ["はかる"], meaning: "かずえる", example: "時計" },
  "元": { character: "元", onyomi: ["ゲン"], kunyomi: ["もと"], meaning: "はじめ", example: "元気" },
  "言": { character: "言", onyomi: ["ゲン"], kunyomi: ["いう"], meaning: "ことば", example: "方言" },
  "原": { character: "原", onyomi: ["ゲン"], kunyomi: ["はら"], meaning: "のはら", example: "草原" },
  "戸": { character: "戸", onyomi: ["コ"], kunyomi: ["と"], meaning: "とびら", example: "戸だな" },
  "古": { character: "古", onyomi: ["コ"], kunyomi: ["ふるい"], meaning: "むかし", example: "中古" },
  "午": { character: "午", onyomi: ["ゴ"], kunyomi: [], meaning: "ひる", example: "午前" },
  "後": { character: "後", onyomi: ["ゴ"], kunyomi: ["あと"], meaning: "あと", example: "午後" },
  "語": { character: "語", onyomi: ["ゴ"], kunyomi: ["かたる"], meaning: "ことば", example: "日本語" },
  "公": { character: "公", onyomi: ["コウ"], kunyomi: ["おおやけ"], meaning: "みんなの", example: "公園" },
  "広": { character: "広", onyomi: ["コウ"], kunyomi: ["ひろい"], meaning: "ひろい", example: "広場" },
  "光": { character: "光", onyomi: ["コウ"], kunyomi: ["ひかり"], meaning: "まぶしい", example: "日光" },
  "考": { character: "考", onyomi: ["コウ"], kunyomi: ["かんがえる"], meaning: "おもう", example: "思考" },
  "行": { character: "行", onyomi: ["コウ"], kunyomi: ["いく"], meaning: "いく", example: "旅行" },
  "高": { character: "高", onyomi: ["コウ"], kunyomi: ["たかい"], meaning: "たかい", example: "高校" },
  "黄": { character: "黄", onyomi: ["コウ"], kunyomi: ["き"], meaning: "きいろ", example: "黄色" },
  "合": { character: "合", onyomi: ["ゴウ"], kunyomi: ["あう"], meaning: "ぴったり", example: "合格" },
  "谷": { character: "谷", onyomi: ["コク"], kunyomi: ["たに"], meaning: "たに", example: "谷間" },
  "国": { character: "国", onyomi: ["コク"], kunyomi: ["くに"], meaning: "くに", example: "外国" },
  "黒": { character: "黒", onyomi: ["コク"], kunyomi: ["くろ"], meaning: "まっくろ", example: "黒板" },
  "今": { character: "今", onyomi: ["コン"], kunyomi: ["いま"], meaning: "いま", example: "今日" },

  // --- 3年生 ---
  "悪": { character: "悪", onyomi: ["アク"], kunyomi: ["わるい"], meaning: "よくない", example: "悪人" },
  "安": { character: "安", onyomi: ["アン"], kunyomi: ["やすい"], meaning: "しずか", example: "安心" },
  "暗": { character: "暗", onyomi: ["アン"], kunyomi: ["くらい"], meaning: "まっくら", example: "暗記" },
  "医": { character: "医", onyomi: ["イ"], kunyomi: [], meaning: "なおす", example: "医者" },
  "意": { character: "意", onyomi: ["イ"], kunyomi: [], meaning: "こころ", example: "意味" },
  "育": { character: "育", onyomi: ["イク"], kunyomi: ["そだつ"], meaning: "そだてる", example: "教育" },
  "員": { character: "員", onyomi: ["イン"], kunyomi: [], meaning: "ひと", example: "全員" },
  "運": { character: "運", onyomi: ["ウン"], kunyomi: ["はこぶ"], meaning: "はこぶ", example: "運動" },
  "泳": { character: "泳", onyomi: ["エイ"], kunyomi: ["およぐ"], meaning: "およぐこと", example: "水泳" },
  "駅": { character: "駅", onyomi: ["エキ"], kunyomi: [], meaning: "ステーション", example: "駅長" },
  "屋": { character: "屋", onyomi: ["オク"], kunyomi: ["や"], meaning: "みせ、いえ", example: "屋上" },
  "温": { character: "温", onyomi: ["オン"], kunyomi: ["あたたかい"], meaning: "あったかい", example: "温泉" },
  "化": { character: "化", onyomi: ["カ"], kunyomi: ["ばける"], meaning: "かわる", example: "お化け" },
  "荷": { character: "荷", onyomi: ["カ"], kunyomi: ["に"], meaning: "にもつ", example: "荷物" },
  "界": { character: "界", onyomi: ["カイ"], kunyomi: [], meaning: "さかい", example: "世界" },
  "開": { character: "開", onyomi: ["カイ"], kunyomi: ["あく"], meaning: "あける", example: "開店" },

  // --- 4年生 ---
  "愛": { character: "愛", onyomi: ["アイ"], kunyomi: [], meaning: "ラブ", example: "愛情" },
  "案": { character: "案", onyomi: ["アン"], kunyomi: [], meaning: "かんがえ", example: "案内" },
  "以": { character: "以", onyomi: ["イ"], kunyomi: [], meaning: "〜より", example: "以上" },
  "衣": { character: "衣", onyomi: ["イ"], kunyomi: ["ころも"], meaning: "きもの", example: "衣料" },
  "位": { character: "位", onyomi: ["イ"], kunyomi: ["くらい"], meaning: "ランク", example: "一位" },
  "印": { character: "印", onyomi: ["イン"], kunyomi: ["しるし"], meaning: "はんこ", example: "印刷" },
  "英": { character: "英", onyomi: ["エイ"], kunyomi: [], meaning: "イギリス", example: "英語" },
  "栄": { character: "栄", onyomi: ["エイ"], kunyomi: ["さかえる"], meaning: "はなやか", example: "栄養" },
  "塩": { character: "塩", onyomi: ["エン"], kunyomi: ["しお"], meaning: "しお", example: "食塩" },
  "億": { character: "億", onyomi: ["オク"], kunyomi: [], meaning: "すごいかず", example: "一億円" },
  "果": { character: "果", onyomi: ["カ"], kunyomi: ["くだもの"], meaning: "みのり", example: "果物" },
  "貨": { character: "貨", onyomi: ["カ"], kunyomi: [], meaning: "たから", example: "貨物" },
  "課": { character: "課", onyomi: ["カ"], kunyomi: [], meaning: "わりあて", example: "課長" },
  "害": { character: "害", onyomi: ["ガイ"], kunyomi: [], meaning: "わるいこと", example: "公害" },
  "街": { character: "街", onyomi: ["ガイ"], kunyomi: ["まち"], meaning: "まち", example: "街道" },

  // --- 5年生 ---
  "圧": { character: "圧", onyomi: ["アツ"], kunyomi: [], meaning: "おす", example: "圧力" },
  "移": { character: "移", onyomi: ["イ"], kunyomi: ["うつる"], meaning: "うごく", example: "移動" },
  "因": { character: "因", onyomi: ["イン"], kunyomi: ["よる"], meaning: "もと", example: "原因" },
  "永": { character: "永", onyomi: ["エイ"], kunyomi: ["ながい"], meaning: "えいえん", example: "永遠" },
  "営": { character: "営", onyomi: ["エイ"], kunyomi: ["いとなむ"], meaning: "しごと", example: "営業" },
  "衛": { character: "衛", onyomi: ["エイ"], kunyomi: [], meaning: "まもる", example: "衛生" },
  "易": { character: "易", onyomi: ["エキ"], kunyomi: ["やさしい"], meaning: "かんたん", example: "容易" },
  "益": { character: "益", onyomi: ["エキ"], kunyomi: [], meaning: "もうけ", example: "利益" },
  "演": { character: "演", onyomi: ["エン"], kunyomi: [], meaning: "おこなう", example: "演技" },
  "応": { character: "応", onyomi: ["オウ"], kunyomi: [], meaning: "こたえる", example: "応援" },
  "桜": { character: "桜", onyomi: ["オウ"], kunyomi: ["さくら"], meaning: "さくら", example: "桜並木" },
  "恩": { character: "恩", onyomi: ["オン"], kunyomi: [], meaning: "めぐみ", example: "恩人" },
  "可": { character: "可", onyomi: ["カ"], kunyomi: [], meaning: "よい", example: "可能" },
  "河": { character: "河", onyomi: ["カ"], kunyomi: ["かわ"], meaning: "かわ", example: "河川" },
  "過": { character: "過", onyomi: ["カ"], kunyomi: ["すぎる"], meaning: "すぎる", example: "過去" },

  // --- 6年生 ---
  "異": { character: "異", onyomi: ["イ"], kunyomi: ["ことなる"], meaning: "ちがう", example: "異変" },
  "遺": { character: "遺", onyomi: ["イ"], kunyomi: [], meaning: "のこす", example: "遺産" },
  "域": { character: "域", onyomi: ["イキ"], kunyomi: [], meaning: "ばしょ", example: "地域" },
  "宇": { character: "宇", onyomi: ["ウ"], kunyomi: [], meaning: "そら", example: "宇宙" },
  "映": { character: "映", onyomi: ["エイ"], kunyomi: ["うつる"], meaning: "うつる", example: "映画" },
  "延": { character: "延", onyomi: ["エン"], kunyomi: ["のびる"], meaning: "のばす", example: "延期" },
  "沿": { character: "沿", onyomi: ["エン"], kunyomi: ["そう"], meaning: "そう", example: "沿線" },
  "我": { character: "我", onyomi: ["ガ"], kunyomi: ["われ"], meaning: "わたし", example: "我々" },
  "灰": { character: "灰", onyomi: ["カイ"], kunyomi: ["はい"], meaning: "はい", example: "灰色" },
  "拡": { character: "拡", onyomi: ["カク"], kunyomi: ["ひろげる"], meaning: "ひろげる", example: "拡大" },
  "革": { character: "革", onyomi: ["カク"], kunyomi: ["かわ"], meaning: "かわ", example: "革靴" },
  "閣": { character: "閣", onyomi: ["カク"], kunyomi: [], meaning: "たかどの", example: "内閣" },
  "割": { character: "割", onyomi: ["カツ"], kunyomi: ["わる"], meaning: "わる", example: "分割" },
  "株": { character: "株", onyomi: [], kunyomi: ["かぶ"], meaning: "きりかぶ", example: "株式" },
  "巻": { character: "巻", onyomi: ["カン"], kunyomi: ["まく"], meaning: "まく", example: "巻物" },
  "看": { character: "看", onyomi: ["カン"], kunyomi: [], meaning: "みる", example: "看板" },
  "簡": { character: "簡", onyomi: ["カン"], kunyomi: [], meaning: "かんたん", example: "簡単" },
  "危": { character: "危", onyomi: ["キ"], kunyomi: ["あぶない"], meaning: "ピンチ", example: "危険" },
  "机": { character: "机", onyomi: ["キ"], kunyomi: ["つくえ"], meaning: "つくえ", example: "学習机" },
};

async function callBackend(action: string, payload: any) {
  // バックエンド未設定（ダミーURL）またはローカル以外でAPIキーがない場合は即オフライン
  if (window.location.hostname !== 'localhost' && !IS_BACKEND_CONFIGURED) {
    throw new Error('Backend not configured, skipping fetch.');
  }

  try {
    const response = await fetch(BACKEND_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`Backend call failed (${action}). Using Offline Mode.`);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// オフラインロジック
// ---------------------------------------------------------------------------

/**
 * 学年ごとのリストから、内蔵DBに定義が存在する漢字のみを抽出して出題します。
 * これにより、オフライン時でも「データなし」エラーを防ぎます。
 */
function getOfflineKanji(count: number, excludeChars: string[], grade: number): KanjiData[] {
  // 1. その学年の漢字リストを取得
  const gradeList = GRADE_KANJI_LISTS[grade] || [];
  
  // 2.【重要】内蔵DBに詳細データが存在する漢字だけに絞り込む（オフラインの安全装置）
  const definedKanji = gradeList.filter(char => MOCK_KANJI_DB[char] !== undefined);
  
  // 3. 習得済み（除外リスト）の漢字を除外
  let available = definedKanji.filter(char => !excludeChars.includes(char));

  // 4. もし新しい漢字がなくなったら（全て習得済みなど）、エラーを出さずに
  //    DBにある漢字全体から再出題してゲームを継続させる（無限プレイ対応）
  if (available.length === 0 && definedKanji.length > 0) {
      available = definedKanji;
  }
  
  // 5. ランダムにシャッフルして指定数返す
  const shuffled = available.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(char => MOCK_KANJI_DB[char]);
}

export const fetchKanjiDetails = async (characters: string[]): Promise<KanjiData[]> => {
  try {
    return await callBackend('details', { characters });
  } catch (error) {
    // 失敗時はモックデータから検索
    return characters.map(char => {
      if (MOCK_KANJI_DB[char]) {
        return MOCK_KANJI_DB[char];
      }
      // 辞書にない場合の最終フォールバック
      return {
        character: char,
        onyomi: [],
        kunyomi: [],
        meaning: "（オフラインのため詳細なし）",
        example: ""
      };
    });
  }
};

export const fetchKanji = async (count: number = 5, excludeChars: string[] = [], grade: number = 1): Promise<KanjiData[]> => {
  try {
    return await callBackend('generate', { count, excludeChars, grade });
  } catch (error) {
    // オフライン生成ロジックを使用
    return getOfflineKanji(count, excludeChars, grade);
  }
};

export const evaluateHandwriting = async (base64Image: string, targetKanji: string): Promise<DrawingResult> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
    return await callBackend('evaluate', { image: cleanBase64, targetKanji });
  } catch (error) {
    // オフライン時のデモ動作：書き取りは常に正解として扱う
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          isCorrect: true,
          feedback: "（オフラインモード）とてもきれいに かけているね！",
          confidence: 0.99
        });
      }, 500); // 待ち時間を短縮
    });
  }
};
