
import { KanjiData } from '../types';
import { GRADE1_DATA } from './grade1';
import { GRADE2_DATA } from './grade2';
import { GRADE3_DATA } from './grade3';
import { GRADE4_DATA } from './grade4';
import { GRADE5_DATA } from './grade5';
import { GRADE6_DATA } from './grade6';

// 全学年のデータを管理するマップ
export const GRADE_KANJI_DATA_MAP: Record<number, KanjiData[]> = {
    1: GRADE1_DATA,
    2: GRADE2_DATA,
    3: GRADE3_DATA,
    4: GRADE4_DATA,
    5: GRADE5_DATA,
    6: GRADE6_DATA
};

// ヘルパー: 指定された学年の全漢字リスト（文字のみ）を取得
export const getKanjiListForGrade = (grade: number): string[] => {
    // リッチデータから文字を取得
    const richData = GRADE_KANJI_DATA_MAP[grade] || [];
    return richData.map(k => k.character);
};
