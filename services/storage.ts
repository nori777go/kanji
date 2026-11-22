import { UserProgress, GameResult, KanjiData } from '../types';

const STORAGE_KEY = 'pikapika_kanji_users';
const LAST_USER_KEY = 'pikapika_kanji_last_user';

// 安全に漢字1文字を取得するヘルパー（文字列・オブジェクトの混在に対応）
export const getChar = (item: any): string => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.character || '';
};

// 安全にKanjiDataオブジェクトに正規化するヘルパー
export const normalizeKanjiData = (item: any): KanjiData => {
  if (!item) {
    return { character: '', onyomi: [], kunyomi: [], meaning: '', example: '' };
  }
  if (typeof item === 'string') {
    return { character: item, onyomi: [], kunyomi: [], meaning: '', example: '' };
  }
  return {
    character: item.character || '',
    onyomi: Array.isArray(item.onyomi) ? item.onyomi : [],
    kunyomi: Array.isArray(item.kunyomi) ? item.kunyomi : [],
    meaning: item.meaning || '',
    example: item.example || '',
  };
};

export const getAllUsers = (): Record<string, UserProgress> => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    
    const parsed = JSON.parse(data);
    if (typeof parsed !== 'object' || parsed === null) return {};
    
    // データ整合性の確保
    Object.keys(parsed).forEach(key => {
      const user = parsed[key];
      if (!user) return;

      const normalizeList = (list: any[]): KanjiData[] => {
        if (!Array.isArray(list)) return [];
        return list.map(normalizeKanjiData).filter(k => !!k.character);
      };

      user.masteredReading = normalizeList(user.masteredReading || user.masteredKanji || []);
      user.masteredWriting = normalizeList(user.masteredWriting || user.masteredKanji || []);
      user.weakReading = normalizeList(user.weakReading || user.weakKanji || []);
      user.weakWriting = normalizeList(user.weakWriting || user.weakKanji || []);
      user.history = Array.isArray(user.history) ? user.history : [];
    });
    
    return parsed;
  } catch (e) {
    console.warn("Storage getAllUsers failed:", e);
    return {};
  }
};

export const getUserProgress = (username: string): UserProgress | null => {
  if (!username) return null;
  const users = getAllUsers();
  return users[username] || null;
};

export const saveGameResult = (username: string, result: GameResult): UserProgress => {
  const users = getAllUsers();
  
  if (!users[username]) {
    users[username] = {
      username,
      masteredReading: [],
      masteredWriting: [],
      weakReading: [],
      weakWriting: [],
      history: []
    };
  }
  
  const currentProgress = users[username];

  // 履歴更新
  currentProgress.history.push({
    date: new Date().toISOString(),
    score: result.score,
    total: result.total,
    mode: result.mode
  });

  const targetMastered = result.mode === 'READING' ? 'masteredReading' : 'masteredWriting';
  const targetWeak = result.mode === 'READING' ? 'weakReading' : 'weakWriting';

  // 1. 正解の漢字を追加（重複防止）
  const existingMasteredChars = new Set(currentProgress[targetMastered].map(getChar).filter(Boolean));
  
  (result.correctKanji || []).forEach(k => {
    const char = getChar(k);
    if (char && !existingMasteredChars.has(char)) {
      currentProgress[targetMastered].push(normalizeKanjiData(k));
      existingMasteredChars.add(char);
    }
  });

  // 2. 苦手リストの更新（今回正解したものは苦手から削除）
  const correctChars = new Set((result.correctKanji || []).map(getChar).filter(Boolean));
  currentProgress[targetWeak] = currentProgress[targetWeak].filter(
    k => !correctChars.has(getChar(k))
  );
  
  // 今回間違えたものを苦手リストに追加（重複防止）
  const existingWeakChars = new Set(currentProgress[targetWeak].map(getChar).filter(Boolean));
  (result.incorrectKanji || []).forEach(k => {
    const char = getChar(k);
    if (char && !existingWeakChars.has(char)) {
      currentProgress[targetWeak].push(normalizeKanjiData(k));
      existingWeakChars.add(char);
    }
  });

  users[username] = currentProgress;
  
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      localStorage.setItem(LAST_USER_KEY, username);
    }
  } catch (e) {
    console.warn("Storage saveGameResult write failed (quota or disabled):", e);
  }

  return currentProgress;
};

export const getLastUser = (): string | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
};

export const getReviewItems = (username: string, mode: 'READING' | 'WRITING'): KanjiData[] => {
  const user = getUserProgress(username);
  if (!user) return [];
  return mode === 'READING' ? user.weakReading : user.weakWriting;
};
