
import React, { useState, useEffect, useRef } from 'react';
import { KanjiData, GameResult } from '../types';
import { fetchKanji } from '../services/geminiService';
import { ArrowRight, HelpCircle, ArrowLeft } from 'lucide-react';
import ResultScreen from './ResultScreen';
import { isLooseMatch } from '../utils/kana';
import { GlobalHeader } from './Logo';

interface ReadingModeProps {
  currentUser: string | null;
  initialKanji?: KanjiData[]; 
  excludeKanji?: string[]; 
  grade?: number;
  onSaveUser: (name: string) => void;
  onBack: () => void;
  onShowHowToPlay: () => void;
  onLogoClick: () => void;
  onStepChange?: () => void;
}

const ReadingMode: React.FC<ReadingModeProps> = ({ currentUser, initialKanji, excludeKanji = [], grade = 1, onSaveUser, onBack, onShowHowToPlay, onLogoClick, onStepChange }) => {
  const [kanjiList, setKanjiList] = useState<KanjiData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  
  const [incorrectItems, setIncorrectItems] = useState<KanjiData[]>([]);
  const [correctItems, setCorrectItems] = useState<KanjiData[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadKanji();
  }, [initialKanji]);

  useEffect(() => {
    if (!loading && feedback === 'idle') {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [loading]);

  const loadKanji = async () => {
    setLoading(true);
    setIncorrectItems([]);
    setCorrectItems([]);
    setScore(0);
    setCurrentIndex(0);
    setFeedback('idle');
    setUserInput('');

    if (initialKanji && initialKanji.length > 0) {
        setKanjiList(initialKanji);
        setLoading(false);
    } else {
        const data = await fetchKanji(5, excludeKanji, grade);
        setKanjiList(data);
        setLoading(false);
    }
  };

  const handleCheck = () => {
    if (!userInput.trim()) return;
    const currentKanji = kanjiList[currentIndex];
    const allValidReadings = [...currentKanji.kunyomi, ...currentKanji.onyomi];
    const isCorrect = isLooseMatch(userInput, allValidReadings);

    if (isCorrect) {
      setFeedback('correct');
      setScore(s => s + 1);
      setCorrectItems(prev => [...prev, currentKanji]);
    } else {
      setFeedback('incorrect');
      setIncorrectItems(prev => [...prev, currentKanji]);
    }
  };

  const handleNext = () => {
    if (currentIndex < kanjiList.length) {
      setFeedback('idle');
      setUserInput('');
      setCurrentIndex(prev => prev + 1);
      if (onStepChange) onStepChange();
      
      if (inputRef.current) {
          inputRef.current.readOnly = false;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(0, 0);
      }
    }
  };

  const isFinished = currentIndex >= kanjiList.length;

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-brand-cream overflow-hidden">
        <GlobalHeader onLogoClick={onLogoClick} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-brand-orange animate-pulse">
          <div className="text-8xl font-black">{grade}</div>
          <p className="text-xl font-bold">{grade}ねんせい の もんだい中...</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
     const result: GameResult = {
        score,
        total: kanjiList.length,
        correctKanji: correctItems,
        incorrectKanji: incorrectItems,
        mode: 'READING'
     };

     return (
        <ResultScreen 
            result={result}
            currentUser={currentUser}
            onSaveUser={onSaveUser}
            onBack={onBack}
            onRetry={() => loadKanji()}
            onShowHowToPlay={onShowHowToPlay}
            onLogoClick={onLogoClick}
        />
     );
  }

  const currentKanji = kanjiList[currentIndex];

  return (
    <div className="w-full h-full flex flex-col items-center bg-brand-cream overflow-hidden">
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
      
      <div className="w-full flex justify-center items-center gap-2 p-2 text-brand-orange font-bold">
          <span className="bg-brand-orange text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">{grade}ねんせい</span>
          <span className="text-sm font-black tracking-widest">{currentIndex + 1} / {kanjiList.length}</span>
      </div>

      <div className="flex-1 w-full overflow-y-auto px-6 py-2 flex flex-col items-center justify-start gap-4">
        <div className="flex flex-col items-center gap-4 w-full max-w-[300px] py-2">
            
            <div className="relative shrink-0">
                <div className="w-40 h-40 sm:w-56 sm:h-56 bg-white rounded-[32px] shadow-[0_8px_0_rgba(0,0,0,0.1)] flex items-center justify-center text-7xl sm:text-8xl font-black text-gray-800 border-4 border-brand-orange transition-all">
                {currentKanji.character}
                </div>
                {feedback === 'correct' && (
                    <div className="absolute inset-0 flex items-center justify-center text-8xl animate-ping opacity-50 z-20 pointer-events-none text-green-500 font-black">⭕</div>
                )}
                {feedback === 'incorrect' && (
                    <div className="absolute inset-0 flex items-center justify-center text-8xl animate-pulse opacity-50 z-20 pointer-events-none text-red-500 font-black">❌</div>
                )}
            </div>

            {feedback === 'incorrect' && (
                <div className="bg-white p-3 rounded-2xl border-4 border-brand-blue w-full animate-fade-in shadow-lg text-center shrink-0">
                    <p className="text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-widest">こたえ</p>
                    <p className="text-2xl font-black text-brand-blue leading-tight">{currentKanji.kunyomi.join('・')}</p>
                    <p className="text-lg font-black text-brand-blue opacity-80">{currentKanji.onyomi.join('・')}</p>
                </div>
            )}

            <div className="w-full space-y-2 shrink-0">
                <label className="block text-center text-base font-black text-gray-600">
                    よみかた を かいてね
                </label>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    readOnly={feedback !== 'idle'}
                    onKeyDown={(e) => e.key === 'Enter' && (feedback === 'idle' ? handleCheck() : handleNext())}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    className={`w-full p-4 text-center text-3xl font-black rounded-2xl border-4 shadow-xl transition-all ${
                        feedback === 'idle' ? 'border-brand-yellow bg-white' : 'border-gray-200 bg-gray-50 text-gray-400'
                    } focus:border-brand-orange focus:outline-none`}
                    placeholder="ひらがな"
                />
            </div>

            <div className="w-full mt-1 shrink-0">
                {feedback === 'idle' ? (
                    <button
                        onClick={handleCheck}
                        className="w-full py-4 bg-brand-blue text-white text-xl font-black rounded-2xl shadow-[0_6px_0_#2b6cb0] active:shadow-none active:translate-y-[6px] transition-all"
                    >
                        こたえあわせ！
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="w-full py-4 bg-brand-green text-white text-xl font-black rounded-2xl shadow-[0_6px_0_#38a169] active:shadow-none active:translate-y-[6px] transition-all flex justify-center items-center gap-2"
                    >
                        つぎへ すすむ <ArrowRight size={24} strokeWidth={3} />
                    </button>
                )}
            </div>
            <div className="h-12 shrink-0"></div>
        </div>
      </div>
    </div>
  );
};

export default ReadingMode;
