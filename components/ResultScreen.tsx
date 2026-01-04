
import React, { useState } from 'react';
import { RefreshCw, ArrowLeft, Save, HelpCircle } from 'lucide-react';
import { GameResult } from '../types';
import { saveGameResult } from '../services/storage';
import { GlobalHeader } from './Logo';

interface ResultScreenProps {
  result: GameResult;
  currentUser: string | null;
  onSaveUser: (name: string) => void;
  onRetry: () => void;
  onBack: () => void;
  onShowHowToPlay: () => void;
  onLogoClick: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ result, currentUser, onSaveUser, onRetry, onBack, onShowHowToPlay, onLogoClick }) => {
  const [nameInput, setNameInput] = useState(currentUser || '');
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
        saveGameResult(currentUser, result);
        setIsSaved(true);
    }
  }, [currentUser]);

  const handleSave = () => {
    if (!nameInput.trim()) return;
    saveGameResult(nameInput.trim(), result);
    onSaveUser(nameInput.trim());
    setIsSaved(true);
  };

  const scorePercentage = Math.round((result.score / result.total) * 100);

  return (
    <div className="flex flex-col h-full bg-brand-cream overflow-hidden">
      <GlobalHeader 
        onLogoClick={onLogoClick}
        rightAction={
          <button onClick={onShowHowToPlay} className="p-2 text-brand-blue hover:bg-brand-blue/5 rounded-full transition">
            <HelpCircle size={24} />
          </button>
        }
      />
      
      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-md mx-auto p-4 overflow-y-auto">
        <h2 className="text-4xl font-black text-brand-blue text-center">
          {scorePercentage === 100 ? 'パーフェクト！' : scorePercentage >= 80 ? 'すごい！' : 'がんばったね！'}
        </h2>
        
        <div className="text-9xl mb-2 relative">
          {scorePercentage === 100 ? '👑' : scorePercentage >= 60 ? '🎉' : '🌱'}
          {scorePercentage === 100 && (
             <div className="absolute top-0 right-0 animate-ping opacity-75">✨</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-brand-yellow w-full text-center">
           <p className="text-2xl font-bold text-gray-700 mb-2">
              {result.total} もん ちゅう {result.score} もん せいかい！
           </p>
           {result.incorrectKanji.length > 0 && (
              <p className="text-brand-pink font-bold text-sm">
                 ニガテ リスト に いれたよ： <br/>
                 {result.incorrectKanji.map(k => k.character).join(', ')}
              </p>
           )}
        </div>

        {!currentUser && !isSaved ? (
          <div className="w-full bg-white border-2 border-brand-orange rounded-3xl p-6 animate-fade-in shadow-sm">
            <label className="block text-center font-bold text-gray-600 mb-2">
              おなまえ を おしえてね
            </label>
            <div className="flex gap-2">
               <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="おなまえ"
                  className="flex-1 p-3 text-xl font-bold rounded-xl border-2 border-gray-300 focus:border-brand-orange outline-none text-center"
               />
               <button 
                  onClick={handleSave}
                  disabled={!nameInput.trim()}
                  className="bg-brand-orange text-white p-3 rounded-xl font-bold shadow-md active:scale-95 transition disabled:opacity-50"
               >
                  <Save size={24} />
               </button>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">
               ほぞん すると、コレクション に ついか されるよ！
            </p>
          </div>
        ) : (
          <div className="w-full bg-green-100 border-2 border-green-400 text-green-700 rounded-3xl p-4 text-center font-bold animate-pulse">
               {result.mode === 'READING' ? 'よみ' : 'かき'} の きろく を ほぞん しました！
          </div>
        )}

        <div className="flex gap-4 mt-4 w-full pb-8">
          <button 
              onClick={onBack}
              className="flex-1 py-4 bg-gray-400 text-white rounded-2xl font-black shadow-lg active:scale-95 transition flex justify-center items-center gap-2"
          >
              <ArrowLeft size={20} /> メニュー
          </button>
          <button 
              onClick={onRetry}
              className="flex-1 py-4 bg-brand-green text-white rounded-2xl font-black shadow-lg active:scale-95 transition flex justify-center items-center gap-2"
          >
              <RefreshCw size={20} /> つぎへ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
