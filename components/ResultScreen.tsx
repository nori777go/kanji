import React, { useState } from 'react';
import { RefreshCw, ArrowLeft, Save, HelpCircle } from 'lucide-react';
import { GameResult } from '../types';
import { saveGameResult, getChar } from '../services/storage';
import { GlobalHeader } from './Logo';
import ErrorBoundary from './ErrorBoundary';

interface ResultScreenProps {
  result: GameResult;
  currentUser: string | null;
  onSaveUser: (name: string) => void;
  onRetry: () => void;
  onBack: () => void;
  onShowHowToPlay: () => void;
  onLogoClick: () => void;
}

const ResultScreenContent: React.FC<ResultScreenProps> = ({ 
  result, 
  currentUser, 
  onSaveUser, 
  onRetry, 
  onBack, 
  onShowHowToPlay, 
  onLogoClick 
}) => {
  const [nameInput, setNameInput] = useState(currentUser || '');
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      try {
        saveGameResult(currentUser, result);
        setIsSaved(true);
      } catch (e) {
        console.warn("Result save error:", e);
      }
    }
  }, [currentUser]);

  const handleSave = () => {
    if (!nameInput.trim()) return;
    try {
      saveGameResult(nameInput.trim(), result);
      onSaveUser(nameInput.trim());
      setIsSaved(true);
    } catch (e) {
      console.warn("Result manual save error:", e);
    }
  };

  const total = Math.max(1, result?.total || 1);
  const score = Math.max(0, result?.score || 0);
  const scorePercentage = Math.round((score / total) * 100);

  const incorrectList = (result?.incorrectKanji || [])
    .map(getChar)
    .filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-brand-cream overflow-hidden select-none">
      <GlobalHeader 
        onLogoClick={onLogoClick}
        rightAction={
          <button onClick={onShowHowToPlay} className="p-2 text-brand-blue hover:bg-brand-blue/5 rounded-full transition" aria-label="あそびかた">
            <HelpCircle size={24} />
          </button>
        }
      />
      
      <div className="flex-1 flex flex-col items-center justify-start gap-5 w-full max-w-md mx-auto px-6 pt-6 pb-8 overflow-y-auto">
        <h2 className="text-3xl font-black text-brand-blue text-center animate-fade-in shrink-0">
          {scorePercentage === 100 ? 'パーフェクト！' : scorePercentage >= 80 ? 'すごい！' : 'がんばったね！'}
        </h2>
        
        <div className="text-8xl mb-1 relative shrink-0">
          {scorePercentage === 100 ? '👑' : scorePercentage >= 60 ? '🎉' : '🌱'}
          {scorePercentage === 100 && (
             <div className="absolute top-0 right-0 animate-ping opacity-75">✨</div>
          )}
        </div>

        <div className="bg-white p-5 rounded-[2.2rem] shadow-sm border-2 border-brand-yellow w-full text-center shrink-0">
           <p className="text-xl font-bold text-gray-700 mb-1.5">
              {result?.total || 0} もん ちゅう {score} もん せいかい！
           </p>
           {incorrectList.length > 0 && (
              <div className="text-brand-pink font-bold text-[11px] leading-tight">
                 <p className="mb-1 opacity-80 uppercase tracking-tighter">ニガテ リスト に いれたよ：</p>
                 <p className="text-sm tracking-widest">
                    {incorrectList.join(', ')}
                 </p>
              </div>
           )}
        </div>

        {!currentUser && !isSaved ? (
          <div className="w-full bg-white border-2 border-brand-orange rounded-[2.2rem] p-5 animate-fade-in shadow-sm shrink-0">
            <label className="block text-center font-bold text-gray-600 mb-2 text-sm">
              おなまえ を おしえてね
            </label>
            <div className="flex gap-2">
               <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="おなまえ"
                  className="flex-1 p-3 text-lg font-bold rounded-xl border-2 border-gray-300 focus:border-brand-orange outline-none text-center min-w-0"
               />
               <button 
                  onClick={handleSave}
                  disabled={!nameInput.trim()}
                  className="bg-brand-orange text-white p-3 rounded-xl font-bold shadow-md active:scale-95 transition disabled:opacity-50"
                  aria-label="ほぞん"
               >
                  <Save size={24} />
               </button>
            </div>
            <p className="text-[9px] text-center text-gray-400 mt-2 font-bold uppercase tracking-wider">
               ほぞん すると、コレクション に ついか されるよ！
            </p>
          </div>
        ) : (
          <div className="w-full bg-brand-green/10 border-2 border-brand-green text-brand-green rounded-[2.2rem] p-4 text-center font-black animate-pulse shrink-0 text-sm">
               {result?.mode === 'READING' ? 'よみ' : 'かき'} の きろく を ほぞん しました！
          </div>
        )}

        <div className="flex gap-3 w-full shrink-0 pb-4">
          <button 
              onClick={onBack}
              className="flex-1 py-4 bg-gray-400 text-white rounded-2xl font-black shadow-lg active:scale-95 transition flex justify-center items-center gap-2 text-sm"
          >
              <ArrowLeft size={18} /> メニュー
          </button>
          <button 
              onClick={onRetry}
              className="flex-1 py-4 bg-brand-green text-white rounded-2xl font-black shadow-lg active:scale-95 transition flex justify-center items-center gap-2 text-sm"
          >
              <RefreshCw size={18} /> つぎへ
          </button>
        </div>
      </div>
    </div>
  );
};

const ResultScreen: React.FC<ResultScreenProps> = (props) => (
  <ErrorBoundary fallbackTitle="けっか がめん で エラー が でました">
    <ResultScreenContent {...props} />
  </ErrorBoundary>
);

export default ResultScreen;
