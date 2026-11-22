import { DrawingResult } from '../types';

// 端末内の簡易比較では漢字の正誤を保証できないため、得点を付けない。
export const evaluateKanjiLocally = async (_image: string, _target: string): Promise<DrawingResult> => ({
  isCorrect: false,
  judged: false,
  feedback: 'まだ採点していないよ。AIれんけい設定でAPIキーを設定すると、かんじの正誤を採点できるよ。',
  confidence: 0,
  evaluatedBy: 'local',
});
