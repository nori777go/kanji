
import React, { useState } from 'react';
import { getKanjiListForGrade } from '../data/gradeKanji';
import { UserProgress, KanjiData, GameMode } from '../types';
import { fetchKanjiDetails } from '../services/geminiService';
import { ArrowLeft, BookOpen, PenTool, Check, HelpCircle } from 'lucide-react';
import { GlobalHeader } from './Logo';

interface CollectionScreenProps {
  grade: number;
  userProgress: UserProgress | null;
  onBack: () => void;
  onStartGame: (mode: GameMode, kanjiList: KanjiData[]) => void;
  setGrade: (grade: number) => void;
  onShowHowToPlay: () => void;
  onLogoClick: () => void;
}

const CollectionScreen: React.FC<CollectionScreenProps> = ({ grade, userProgress, onBack, onStartGame, setGrade, onShowHowToPlay, onLogoClick }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'READING' | 'WRITING'>('READING');
  
  const fullList = getKanjiListForGrade(grade);
  
  const masteredMap = new Map<string, KanjiData>();
  if (userProgress) {
    const list = activeTab === 'READING' ? userProgress.masteredReading : userProgress.masteredWriting;
    list.forEach(k => masteredMap.set(k.character, k));
  }

  const masteredCount = fullList.filter(char => masteredMap.has(char)).length;
  const progressPercent = fullList.length > 0 ? Math.round((masteredCount / fullList.length) * 100) : 0;

  const size = 64;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2 - 2; 
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * progressPercent / 100);

  const handleStartGame = async () => {
    setLoading(true);
    const unmastered = fullList.filter(char => !masteredMap.has(char));
    const targets = unmastered.sort(() => 0.5 - Math.random()).slice(0, 5);
    
    if (targets.length < 5) {
        const remaining = 5 - targets.length;
        const mastered = Array.from(masteredMap.keys()).sort(() => 0.5 - Math.random()).slice(0, remaining);
        targets.push(...mastered);
    }
    
    if (targets.length === 0) {
        setLoading(false);
        return;
    }

    const kanjiData = await fetchKanjiDetails(targets);
    setLoading(false);
    const mode = activeTab === 'READING' ? GameMode.READING : GameMode.WRITING;
    onStartGame(mode, kanjiData);
  };

  return (
    /* 
       Safari対策: 
       ルートコンテナから overflow-hidden を削除し、内部のスクロール要素が確実にタッチイベントを受け取れるようにします。
    */
    <div className="flex flex-col flex-1 min-h-0 bg-brand-cream">
       {/* ヘッダー部分は高さを固定 (shrink-0) */}
       <div className="shrink-0 z-50 bg-white">
         <GlobalHeader 
          onLogoClick={onLogoClick}
          leftAction={
            <button onClick={onBack} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft size={24} />
            </button>
          }
          rightAction={
            <button onClick={onShowHowToPlay} className="p-2 text-brand-blue hover:bg-brand-blue/5 rounded-full transition">
              <HelpCircle size={24} />
            </button>
          }
         />
       </div>

      {/* 
          スクロール領域: 
          1. flex-1 と min-h-0 で親からの高さを使い切る。
          2. overflow-y-auto で内容に応じたスクロールを可能にする。
          3. touch-action: pan-y を明示し、モバイルでの垂直スクロール操作を確実に許可。
          4. WebkitOverflowScrolling: touch でiOSの慣性スクロールを有効化。
      */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto bg-brand-cream" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        <div className="max-w-md mx-auto w-full flex flex-col px-4 pt-4 pb-48">
          
          {/* モード切り替えタブ */}
          <div className="flex gap-2 shrink-0">
            <button
                onClick={() => setActiveTab('READING')}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                    activeTab === 'READING' 
                    ? 'bg-brand-blue text-white ring-4 ring-brand-blue/20' 
                    : 'bg-white text-gray-400 border border-gray-100'
                }`}
            >
                <BookOpen size={20} /> よむ
            </button>
            <button
                onClick={() => setActiveTab('WRITING')}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                    activeTab === 'WRITING' 
                    ? 'bg-brand-pink text-white ring-4 ring-brand-pink/20' 
                    : 'bg-white text-gray-400 border border-gray-100'
                }`}
            >
                <PenTool size={20} /> かく
            </button>
          </div>

          {/* 学年選択（横スクロール） */}
          <div className="py-2 mt-1 shrink-0 overflow-hidden">
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                {[1, 2, 3, 4, 5, 6].map(g => (
                    <button
                        key={g}
                        onClick={() => setGrade(g)}
                        className={`px-4 py-2 rounded-full text-xs font-black transition-all shrink-0 ${
                            grade === g 
                            ? (activeTab === 'READING' ? 'bg-brand-blue text-white' : 'bg-brand-pink text-white')
                            : 'bg-white text-gray-400 shadow-sm border border-gray-100'
                        }`}
                    >
                        {g}ねん
                    </button>
                ))}
            </div>
          </div>

          {/* 統計パネル */}
          <div className="pb-3 shrink-0">
            <div className={`bg-white p-3 rounded-2xl border-2 shadow-sm flex items-center justify-between transition-colors ${activeTab === 'READING' ? 'border-brand-blue/30' : 'border-brand-pink/30'}`}>
                <div className="min-w-0">
                    <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-0.5">
                        {activeTab === 'READING' ? 'できた かんじ（よむ）' : 'できた かんじ（かく）'}
                    </p>
                    <p className={`text-2xl font-black leading-none ${activeTab === 'READING' ? 'text-brand-blue' : 'text-brand-pink'}`}>
                        {masteredCount} <span className="text-[10px] text-gray-400 font-bold tracking-normal">/ {fullList.length} もん</span>
                    </p>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg 
                        viewBox={`0 0 ${size} ${size}`} 
                        className="absolute inset-0 w-full h-full -rotate-90"
                    >
                        <circle cx={center} cy={center} r={radius} stroke="#f3f4f6" strokeWidth={strokeWidth} fill="none" />
                        <circle 
                            cx={center} cy={center} r={radius} 
                            stroke={activeTab === 'READING' ? '#4F95FF' : '#FF6B6B'} 
                            strokeWidth={strokeWidth} fill="none" 
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                        />
                    </svg>
                    <span className="text-[9px] font-black text-gray-600 z-10">{progressPercent}%</span>
                </div>
            </div>
          </div>

          {/* 練習開始ボタン */}
          <div className="mb-8 shrink-0">
            <button 
                onClick={handleStartGame}
                disabled={loading}
                className={`w-full text-white py-4 rounded-2xl font-black shadow-md active:scale-95 active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'READING' ? 'bg-brand-blue shadow-[0_5px_0_#2b6cb0]' : 'bg-brand-pink shadow-[0_5px_0_#c53030]'
                } disabled:opacity-50`}
            >
                {loading ? <span className="animate-spin text-xl">⌛</span> : (activeTab === 'READING' ? <BookOpen size={24} strokeWidth={3}/> : <PenTool size={24} strokeWidth={3}/>)}
                <span className="text-xl">
                    {activeTab === 'READING' ? 'よむ れんしゅう' : 'かく れんしゅう'}
                </span>
            </button>
          </div>

          {/* 漢字一覧グリッド */}
          <div className="grid grid-cols-5 gap-3">
              {fullList.map((char) => {
                  const isMastered = masteredMap.has(char);
                  return (
                      <div 
                          key={char} 
                          className={`aspect-square rounded-2xl flex items-center justify-center text-2xl font-black border-2 transition-all relative ${
                              isMastered 
                              ? 'bg-white text-gray-800 shadow-sm border-brand-green animate-fade-in' 
                              : 'bg-gray-50 border-gray-100 text-gray-200'
                          }`}
                      >
                          {char}
                          {isMastered && (
                              <div className="absolute -bottom-1 -right-1 bg-brand-green text-white rounded-full p-0.5 shadow-sm">
                                  <Check size={12} strokeWidth={4} />
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionScreen;
