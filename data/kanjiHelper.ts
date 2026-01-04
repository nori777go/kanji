
import { KanjiData } from '../types';

// データ量を減らすためのヘルパー関数
// c: character, o: onyomi, k: kunyomi, m: meaning, e: example
export const k = (c: string, o: string[], k: string[], m: string, e: string): KanjiData => ({
  character: c, onyomi: o, kunyomi: k, meaning: m, example: e
});
