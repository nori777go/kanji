
import React, { useState, useEffect, useRef } from 'react';
import { KanjiData, GameResult } from '../types';
import { fetchKanji } from '../services/geminiService';
import { ArrowRight, HelpCircle, ArrowLeft, Star } from 'lucide-react';
import ResultScreen from './ResultScreen';
import { isLooseMatch } from '../utils/kana';
import { GlobalHeader } from './Logo';
import FireworksEffect from './FireworksEffect';
import ErrorBoundary from './ErrorBoundary';

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

const ReadingModeContent: React.FC<ReadingModeProps> = ({ currentUser, initialKanji, excludeKanji = [], grade = 1, onSaveUser, onBack, onShowHowToPlay, onLogoClick, onStepChange }) => {
  const [kanjiList, setKanjiList] = useState<KanjiData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [incorrectItems, setIncorrectItems] = useState<KanjiData[]>([]);
  const [correctItems, setCorrectItems] = useState<KanjiData[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadKanji();
    return () => {
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    };
  }, [initialKanji]);

  useEffect(() => {
    if (!loading && feedback === 'idle') {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [loading, feedback]);

  const loadKanji = async () => {
    setLoading(true);
    setIncorrectItems([]);
    setCorrectItems([]);
    setScore(0);
    setCurrentIndex(0);
    setFeedback('idle');
    setUserInput('');
    setShowConfetti(false);

    if (initialKanji && initialKanji.length > 0) {
        setKanjiList(initialKanji);
        setLoading(false);
    } else {
        const data = await fetchKanji(5, excludeKanji, grade);
        setKanjiList(data || []);
        setLoading(false);
    }
  };

  const handleCheck = () => {
    if (!userInput.trim()) return;
    const currentKanji = kanjiList[currentIndex];
    if (!currentKanji) return;
    const allValidReadings = [...(currentKanji.kunyomi || []), ...(currentKanji.onyomi || [])];
    const isCorrect = isLooseMatch(userInput, allValidReadings);

    if (isCorrect) {
      setFeedback('correct');
      setScore(s => s + 1);
      setCorrectItems(prev => [...prev, currentKanji]);
      setShowConfetti(true);

      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
      confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 3500);
    } else {
      setFeedback('incorrect');
      setIncorrectItems(prev => [...prev, currentKanji]);
    }
  };

  const handleNext = () => {
    if (currentIndex < kanjiList.length) {
      setFeedback('idle');
      setUserInput('');
      setShowConfetti(false);
      setCurrentIndex(prev => prev + 1);
      if (onStepChange) onStepChange();
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
      {showConfetti && <FireworksEffect key={`fw-${currentIndex}`} originY={38} />}
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
      
      <div className="shrink-0 w-full flex justify-center items-center gap-2 p-1.5 text-brand-orange font-bold">
          <span className="bg-brand-orange text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase">{grade}ねんせい</span>
          <Star className="fill-brand-orange" size={12}/>
          <span className="text-[10px] font-black tracking-widest">{currentIndex + 1} / {kanjiList.length}</span>
      </div>

      <div className="flex-1 min-h-0 w-full overflow-y-auto px-6 flex flex-col items-center justify-start gap-1 pb-6 scrolling-touch">
        <div className="flex flex-col items-center gap-2 w-full max-w-[300px]">
            
            <div className="relative shrink-0 mt-1">
                <div className="w-36 h-36 bg-white rounded-[28px] shadow-[0_6px_0_rgba(0,0,0,0.1)] flex items-center justify-center text-7xl font-black text-gray-800 border-4 border-brand-orange transition-all">
                {currentKanji.character}
                </div>
                {feedback === 'correct' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="text-8xl animate-ping opacity-60 text-green-500 font-black">⭕</div>
                        <div className="absolute top-[-30px] celebration-pop text-5xl font-black text-brand-green drop-shadow-2xl whitespace-nowrap z-[110]">
                          💮 やったね！
                        </div>
                    </div>
                )}
                {feedback === 'incorrect' && (
                    <div className="absolute inset-0 flex items-center justify-center text-8xl animate-pulse opacity-50 z-20 pointer-events-none text-red-500 font-black">❌</div>
                )}
            </div>

            <div className="w-full space-y-1 shrink-0 mt-1">
                <label className="block text-center text-[12px] font-black text-gray-600">
                    よみかた を かいてね
                </label>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    readOnly={feedback === 'correct' || feedback === 'incorrect'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (feedback === 'idle') handleCheck();
                        else handleNext();
                      }
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    className={`w-full p-3 text-center text-2xl font-black rounded-xl border-4 shadow-lg transition-all ${
                        feedback === 'idle' ? 'border-brand-yellow bg-white' : 'border-gray-200 bg-gray-50 text-gray-400'
                    } focus:border-brand-orange focus:outline-none`}
                    placeholder="ひらがな"
                />
            </div>

            <div className="w-full mt-1 shrink-0">
                {feedback === 'idle' ? (
                    <button
                        onClick={handleCheck}
                        className="w-full py-3 bg-brand-blue text-white text-xl font-black rounded-xl shadow-[0_4px_0_#2b6cb0] active:shadow-none active:translate-y-[4px] transition-all"
                    >
                        こたえあわせ！
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="w-full py-3 bg-brand-green text-white text-xl font-black rounded-xl shadow-[0_4px_0_#38a169] active:shadow-none active:translate-y-[4px] transition-all flex justify-center items-center gap-2"
                    >
                        つぎへ すすむ <ArrowRight size={20} strokeWidth={3} />
                    </button>
                )}
            </div>

            {feedback === 'incorrect' && (
                <div className="bg-white p-3 rounded-2xl border-4 border-brand-blue w-full animate-fade-in shadow-md text-center shrink-0 mt-3">
                    <p className="text-gray-400 text-[9px] font-bold mb-0.5 uppercase tracking-widest">こたえ</p>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-xl font-black text-brand-blue leading-tight">{currentKanji.kunyomi.join('・')}</p>
                        {currentKanji.onyomi.length > 0 && (
                          <p className="text-sm font-black text-brand-blue opacity-70">{currentKanji.onyomi.join('・')}</p>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold mt-1.5 leading-tight opacity-80 italic">
                        いみ: {currentKanji.meaning}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const ReadingMode: React.FC<ReadingModeProps> = (props) => (
  <ErrorBoundary fallbackTitle="よみモード で エラー が でました">
    <ReadingModeContent {...props} />
  </ErrorBoundary>
);

export default ReadingMode;
