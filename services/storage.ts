
import { UserProgress, GameResult, KanjiData } from '../types';

const STORAGE_KEY = 'pikapika_kanji_users';
const LAST_USER_KEY = 'pikapika_kanji_last_user';
const MAX_HISTORY_ENTRIES = 100;

export const getAllUsers = (): Record<string, UserProgress> => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return {};
  
  let parsed: Record<string, UserProgress>;
  try {
    parsed = JSON.parse(data);
  } catch {
    return {};
  }
  
  // Data Migration Logic
  let isMigrated = false;
  Object.keys(parsed).forEach(key => {
      const user = parsed[key];
      
      // Migration 1: String check (from older version)
      // Check if masteredReading exists, if not, migrate from old masteredKanji
      if (!user.masteredReading) {
          // If we have old 'masteredKanji', assume it applies to both for now to not lose progress
          const oldMastered = user.masteredKanji || [];
          // Fix string vs object format if needed
          const formattedMastered = (oldMastered.length > 0 && typeof oldMastered[0] === 'string')
             ? (oldMastered as unknown as string[]).map(char => ({
                  character: char,
                  onyomi: [],
                  kunyomi: [],
                  meaning: 'ー',
                  example: ''
              }))
             : oldMastered;

          user.masteredReading = formattedMastered;
          user.masteredWriting = formattedMastered; // Copy to writing too
          isMigrated = true;
      }

      // Same for weak kanji
      if (!user.weakReading) {
          const oldWeak = user.weakKanji || [];
           const formattedWeak = (oldWeak.length > 0 && typeof oldWeak[0] === 'string')
             ? (oldWeak as unknown as string[]).map(char => ({
                  character: char,
                  onyomi: [],
                  kunyomi: [],
                  meaning: 'ー',
                  example: ''
              }))
             : oldWeak;
          user.weakReading = formattedWeak;
          user.weakWriting = formattedWeak;
          isMigrated = true;
      }
      
      // Ensure arrays exist
      if (!user.masteredReading) {
        user.masteredReading = [];
        isMigrated = true;
      }
      if (!user.masteredWriting) {
        user.masteredWriting = [];
        isMigrated = true;
      }
      if (!user.weakReading) {
        user.weakReading = [];
        isMigrated = true;
      }
      if (!user.weakWriting) {
        user.weakWriting = [];
        isMigrated = true;
      }
  });
  
  if (isMigrated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }

  return parsed;
};

export const getUserProgress = (username: string): UserProgress | null => {
  const users = getAllUsers();
  return users[username] || null;
};

export const saveGameResult = (username: string, result: GameResult): UserProgress => {
  const users = getAllUsers();
  // Initialize if new user
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

  // Update history
  currentProgress.history.push({
    date: new Date().toISOString(),
    score: result.score,
    total: result.total,
    mode: result.mode
  });
  if (currentProgress.history.length > MAX_HISTORY_ENTRIES) {
    currentProgress.history = currentProgress.history.slice(-MAX_HISTORY_ENTRIES);
  }

  // Determine which arrays to update based on game mode
  const targetMastered = result.mode === 'READING' ? 'masteredReading' : 'masteredWriting';
  const targetWeak = result.mode === 'READING' ? 'weakReading' : 'weakWriting';

  // 1. Update Mastered (Add Unique)
  const existingMasteredChars = new Set(currentProgress[targetMastered].map(k => k.character));
  
  result.correctKanji.forEach(k => {
      if (!existingMasteredChars.has(k.character)) {
          currentProgress[targetMastered].push(k);
          existingMasteredChars.add(k.character);
      }
  });

  // 2. Update Weak
  // Remove any now-correct kanji from the weak list
  const correctChars = new Set(result.correctKanji.map(k => k.character));
  currentProgress[targetWeak] = currentProgress[targetWeak].filter(
    k => !correctChars.has(k.character)
  );
  
  // Add new incorrect kanji (avoid duplicates)
  const existingWeakChars = new Set(currentProgress[targetWeak].map(k => k.character));
  result.incorrectKanji.forEach(k => {
    if (!existingWeakChars.has(k.character)) {
      currentProgress[targetWeak].push(k);
    }
  });

  users[username] = currentProgress;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  localStorage.setItem(LAST_USER_KEY, username);

  return currentProgress;
};

export const getLastUser = (): string | null => {
  return localStorage.getItem(LAST_USER_KEY);
};

export const getReviewItems = (username: string, mode: 'READING' | 'WRITING'): KanjiData[] => {
  const user = getUserProgress(username);
  if (!user) return [];
  return mode === 'READING' ? user.weakReading : user.weakWriting;
};
