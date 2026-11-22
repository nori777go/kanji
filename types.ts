
export interface KanjiData {
  character: string;
  onyomi: string[];
  kunyomi: string[];
  meaning: string;
  example: string;
}

export enum GameMode {
  USER_SELECT = 'USER_SELECT',
  MENU = 'MENU',
  READING = 'READING',
  WRITING = 'WRITING',
  HISTORY = 'HISTORY',
  HOW_TO_PLAY = 'HOW_TO_PLAY',
}

export interface DrawingResult {
  judged?: boolean;
  isCorrect: boolean;
  feedback: string;
  confidence: number;
  evaluatedBy?: 'ai' | 'local';
}

export interface GameResult {
  score: number;
  total: number;
  correctKanji: KanjiData[];
  incorrectKanji: KanjiData[]; 
  mode: 'READING' | 'WRITING';
}

export interface HistoryEntry {
  date: string;
  score: number;
  total: number;
  mode: 'READING' | 'WRITING';
  grade?: number;
}

export interface UserProgress {
  username: string;
  // Split mastery tracking
  masteredReading: KanjiData[];
  masteredWriting: KanjiData[];
  // Split weak tracking for targeted review
  weakReading: KanjiData[];
  weakWriting: KanjiData[];
  
  // Keep legacy for type compatibility during migration, though optional
  masteredKanji?: KanjiData[]; 
  weakKanji?: KanjiData[];
  
  history: HistoryEntry[];
}
