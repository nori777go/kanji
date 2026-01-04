
import React, { useState } from 'react';
import { UserProgress, KanjiData } from '../types';
import { ArrowLeft, CheckCircle, AlertCircle, BookOpen, PenTool, HelpCircle } from 'lucide-react';
import { GlobalHeader } from './Logo';

interface HistoryScreenProps {
  userProgress: UserProgress;
  onBack: () => void;
  onShowHowToPlay: () => void;
  onLogoClick: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ userProgress, onBack, onShowHowToPlay, onLogoClick }) => {
  const [activeMode, setActiveMode] = useState<'READING' | 'WRITING'>('READING');
  const [activeType, setActiveType] = useState<'mastered' | 'weak'>('mastered');

  const getList = () => {
      if (activeMode === 'READING') {
          return activeType === 'mastered' ? userProgress.masteredReading : userProgress.weakReading;
      } else {
          return activeType === 'mastered' ? userProgress.masteredWriting : userProgress.weakWriting;
      }
  };

  const currentList = getList();

  const renderKanjiCard = (kanji: KanjiData) => (
    <div key={kanji.character} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center animate-fade-in">
      <div className={`text-4xl font-black mb-2 ${activeType === 'mastered' ? 'text-brand-green' : 'text-brand-pink'}`}>
        {kanji.character}
      </div>
      <div className="text-[10px] text-center text-gray-500 w-full">
        <p className="truncate font-bold text-gray-700">{kanji.kunyomi[0] || kanji.onyomi[0]}</p>
        <p className="truncate opacity-70">{kanji.meaning}</p>
      </div>
    </div>
  );

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

      <div className="p-4 max-w-md mx-auto w-full space-y-4">
         <h2 className="text-lg font-black text-gray-600 flex items-center gap-2 justify-center">
            かんじ じてん
         </h2>

         <div className="flex bg-gray-200 rounded-2xl p-1 shadow-inner">
            <button 
                onClick={() => setActiveMode('READING')}
                className={`flex-1 py-3 rounded-xl font-black text-sm flex justify-center items-center gap-2 transition-all ${activeMode === 'READING' ? 'bg-white shadow-sm text-brand-blue' : 'text-gray-500'}`}
            >
                <BookOpen size={18} /> よむ
            </button>
             <button 
                onClick={() => setActiveMode('WRITING')}
                className={`flex-1 py-3 rounded-xl font-black text-sm flex justify-center items-center gap-2 transition-all ${activeMode === 'WRITING' ? 'bg-white shadow-sm text-brand-pink' : 'text-gray-500'}`}
            >
                <PenTool size={18} /> かく
            </button>
         </div>
      </div>

      <div className="flex max-w-md mx-auto w-full px-4 gap-4">
        <button 
            onClick={() => setActiveType('mastered')}
            className={`flex-1 py-4 rounded-3xl font-black flex flex-col items-center gap-1 transition-all ${
                activeType === 'mastered' 
                ? 'bg-brand-green text-white shadow-md scale-105' 
                : 'bg-white text-gray-400 shadow-sm border border-gray-100'
            }`}
        >
            <div className="flex items-center gap-1">
                <CheckCircle size={20} />
                <span>おぼえた</span>
            </div>
            <span className="text-xs opacity-90">{currentList.length} もん</span>
        </button>

        <button 
            onClick={() => setActiveType('weak')}
            className={`flex-1 py-4 rounded-3xl font-black flex flex-col items-center gap-1 transition-all ${
                activeType === 'weak' 
                ? 'bg-brand-pink text-white shadow-md scale-105' 
                : 'bg-white text-gray-400 shadow-sm border border-gray-100'
            }`}
        >
             <div className="flex items-center gap-1">
                <AlertCircle size={20} />
                <span>ニガテ</span>
            </div>
            <span className="text-xs opacity-90">{currentList.length} もん</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-12 mt-4">
        <div className="max-w-md mx-auto">
            {currentList.length === 0 ? (
                <div className="text-center text-gray-400 mt-10 font-bold">
                    {activeType === 'mastered' ? 'まだ ありません' : 'すごい！ ニガテ なし！'}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {activeType === 'mastered' 
                        ? currentList.slice().reverse().map(renderKanjiCard)
                        : currentList.map(renderKanjiCard)
                    }
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
