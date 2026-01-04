
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
  
  // 新しいヘルパー関数を使用してリストを取得
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
    
    // 足りない場合は習得済みから補充
    if (targets.length < 5) {
        const remaining = 5 - targets.length;
        const mastered = Array.from(masteredMap.keys()).sort(() => 0.5 - Math.random()).slice(0, remaining);
        targets.push(...mastered);
    }
    
    if (targets.length === 0) {
        setLoading(false);
        return;
    }

    // 詳細データを取得（ローカルにあればAPI節約、なければAPI使用）
    const kanjiData = await fetchKanjiDetails(targets);
    setLoading(false);
    const mode = activeTab === 'READING' ? GameMode.READING : GameMode.WRITING;
    onStartGame(mode, kanjiData);
  };

  return (
    <div className="flex flex-col h-full bg-brand-cream overflow-hidden">
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

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Mode Tabs */}
        <div className="flex max-w-md mx-auto w-full p-4 gap-2">
          <button
              onClick={() => setActiveTab('READING')}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                  activeTab === 'READING' 
                  ? 'bg-brand-blue text-white ring-4 ring-brand-blue/20' 
                  : 'bg-white text-gray-400'
              }`}
          >
              <BookOpen size={20} /> よむ
          </button>
          <button
              onClick={() => setActiveTab('WRITING')}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                  activeTab === 'WRITING' 
                  ? 'bg-brand-pink text-white ring-4 ring-brand-pink/20' 
                  : 'bg-white text-gray-400'
              }`}
          >
              <PenTool size={20} /> かく
          </button>
        </div>

        {/* Grade Selector */}
        <div className="p-2">
          <div className="flex justify-center gap-1 max-w-md mx-auto overflow-x-auto pb-2">
              {[1, 2, 3, 4, 5, 6].map(g => (
                  <button
                      key={g}
                      onClick={() => setGrade(g)}
                      className={`px-4 py-2 rounded-full text-sm font-black transition-all ${
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

        {/* Stats */}
        <div className="p-4 max-w-md mx-auto w-full">
          <div className={`bg-white p-4 rounded-3xl border-2 shadow-sm flex items-center justify-between transition-colors ${activeTab === 'READING' ? 'border-brand-blue' : 'border-brand-pink'}`}>
              <div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                      {activeTab === 'READING' ? 'できた かんじ（よむ）' : 'できた かんじ（かく）'}
                  </p>
                  <p className={`text-3xl font-black ${activeTab === 'READING' ? 'text-brand-blue' : 'text-brand-pink'}`}>
                      {masteredCount} <span className="text-xs text-gray-400 font-bold tracking-normal">/ {fullList.length} もん</span>
                  </p>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
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
                  <span className="text-[10px] font-black text-gray-600 z-10">{progressPercent}%</span>
              </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-4 pb-4 max-w-md mx-auto w-full">
          <button 
              onClick={handleStartGame}
              disabled={loading}
              className={`w-full text-white py-5 rounded-2xl font-black shadow-md active:scale-95 transition flex items-center justify-center gap-2 ${
                  activeTab === 'READING' ? 'bg-brand-blue shadow-[0_6px_0_#2b6cb0]' : 'bg-brand-pink shadow-[0_6px_0_#c53030]'
              } disabled:opacity-50`}
          >
              {loading ? <span className="animate-spin text-2xl">⌛</span> : (activeTab === 'READING' ? <BookOpen size={28} strokeWidth={3}/> : <PenTool size={28} strokeWidth={3}/>)}
              <span className="text-2xl">
                  {activeTab === 'READING' ? 'よむ れんしゅう' : 'かく れんしゅう'}
              </span>
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 px-4 pb-20">
          <div className="max-w-md mx-auto grid grid-cols-5 gap-3">
              {fullList.map((char) => {
                  const isMastered = masteredMap.has(char);
                  return (
                      <div 
                          key={char} 
                          className={`aspect-square rounded-2xl flex items-center justify-center text-2xl font-black border-2 transition-all relative ${
                              isMastered 
                              ? 'bg-white text-gray-800 shadow-sm border-brand-green' 
                              : 'bg-gray-100 border-gray-200 text-gray-300'
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
