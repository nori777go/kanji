
import React, { useState, useEffect, useRef } from 'react';
import { KanjiData, GameResult } from '../types';
import { fetchKanji, evaluateHandwriting } from '../services/geminiService';
import DrawingCanvas from './DrawingCanvas';
import { ArrowRight, Star, PenTool, CheckCircle, Eraser, HelpCircle, ArrowLeft } from 'lucide-react';
import ResultScreen from './ResultScreen';
import { GlobalHeader } from './Logo';

interface WritingModeProps {
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

const Confetti: React.FC = () => {
  const colors = ['#FFD93D', '#FF8400', '#4F95FF', '#6BCB77', '#FF6B6B'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

const WritingMode: React.FC<WritingModeProps> = ({ currentUser, initialKanji, excludeKanji = [], grade = 1, onSaveUser, onBack, onShowHowToPlay, onLogoClick, onStepChange }) => {
  const [kanjiList, setKanjiList] = useState<KanjiData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{correct: boolean, msg: string} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [score, setScore] = useState(0);
  const [incorrectItems, setIncorrectItems] = useState<KanjiData[]>([]);
  const [correctItems, setCorrectItems] = useState<KanjiData[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadKanji();
  }, [initialKanji]);

  const loadKanji = async () => {
    setLoading(true);
    setIncorrectItems([]);
    setCorrectItems([]);
    setScore(0);
    setCurrentIndex(0);
    setResult(null);
    setIsFinished(false);
    setShowConfetti(false);

    if (initialKanji && initialKanji.length > 0) {
        setKanjiList(initialKanji);
        setLoading(false);
    } else {
        const data = await fetchKanji(5, excludeKanji, grade);
        setKanjiList(data);
        setLoading(false);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleCheck = async () => {
    if (!canvasRef.current) return;
    
    setChecking(true);
    const base64 = canvasRef.current.toDataURL('image/png');
    const currentKanji = kanjiList[currentIndex];

    const feedback = await evaluateHandwriting(base64, currentKanji.character);
    
    setResult({
        correct: feedback.isCorrect,
        msg: feedback.feedback
    });
    setChecking(false);

    if (feedback.isCorrect) {
        setScore(s => s + 1);
        setCorrectItems(prev => [...prev, currentKanji]);
        setShowConfetti(true);
    } else {
        setIncorrectItems(prev => [...prev, currentKanji]);
    }
  };

  const handleNext = () => {
    if (onStepChange) onStepChange();
    if (currentIndex < kanjiList.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setResult(null);
        setShowConfetti(false);
        handleClear();
    } else {
        setIsFinished(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-brand-cream overflow-hidden">
        <GlobalHeader onLogoClick={onLogoClick} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-brand-blue animate-pulse font-black">
          <PenTool size={48} />
          <p className="text-xl">{grade}ねんせい の じゅんび中...</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const gameResult: GameResult = {
        score,
        total: kanjiList.length,
        correctKanji: correctItems,
        incorrectKanji: incorrectItems,
        mode: 'WRITING'
     };

     return (
        <ResultScreen 
            result={gameResult}
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
    <div className="flex flex-col h-full w-full bg-brand-cream overflow-hidden">
      {showConfetti && <Confetti />}

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

      <div className="shrink-0 w-full flex justify-center items-center gap-2 p-1.5 text-brand-blue text-sm font-bold">
          <span className="bg-brand-blue text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase">{grade}ねんせい</span>
          <Star className="fill-brand-blue" size={12}/>
          <span className="text-[10px] font-black tracking-widest">{currentIndex + 1} / {kanjiList.length}</span>
      </div>

      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-start px-4 gap-1.5 overflow-y-auto pb-4 scrolling-touch">
        {/* カードの上下パディングを py-2 から py-1.5 へ、丸みを 2xl から xl へ */}
        <div className="bg-white px-4 py-1.5 rounded-xl shadow-sm border-2 border-brand-pink w-full max-w-[340px] text-center shrink-0">
            <div className="flex items-center justify-center gap-2">
                <span className="text-[9px] font-black text-gray-400 tracking-tighter shrink-0 uppercase">
                    {result ? 'せいかい：' : 'これをかいて：'}
                </span>
                <div className="flex items-baseline gap-1">
                    <span className={`font-black text-brand-pink ${result ? 'text-lg' : 'text-2xl'}`}>
                        {currentKanji.kunyomi[0] || currentKanji.onyomi[0]}
                    </span>
                    {result && (
                        <span className="text-3xl font-black text-brand-pink animate-fade-in">
                            ({currentKanji.character})
                        </span>
                    )}
                </div>
            </div>
            <div className="text-[9px] text-gray-400 font-bold leading-tight">
                いみ: {currentKanji.meaning}
            </div>
        </div>

        {/* ボタンの py-4 を py-2.5 に縮小。テキストサイズも 2xl から xl へ */}
        <div className="w-full max-w-[300px] shrink-0">
          <button
            onClick={handleClear}
            disabled={checking || !!result}
            className="w-full py-2.5 bg-brand-green text-white text-xl font-black rounded-xl shadow-[0_4px_0_#38a169] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-30 flex justify-center items-center gap-2"
          >
            <Eraser size={20} strokeWidth={3} />
            ぜんぶけす
          </button>
        </div>

        {/* キャンバス周辺の余白を最小化 */}
        <div className="relative shrink-0 my-0.5">
            <DrawingCanvas forwardRef={canvasRef} width={300} height={300} />
            {checking && (
                <div className="absolute inset-[4px] bg-white/80 flex flex-col items-center justify-center rounded-[24px] z-10 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center animate-bounce text-brand-blue">
                        <CheckCircle size={40} />
                        <span className="font-black mt-1 text-[12px]">チェック中...</span>
                    </div>
                </div>
            )}
        </div>

        {/* 決定ボタンの py-4 を py-3 に縮小 */}
        <div className="w-full max-w-[300px] shrink-0">
            {!result ? (
                <button
                    onClick={handleCheck}
                    disabled={checking}
                    className="w-full py-3 bg-brand-orange text-white text-xl font-black rounded-xl shadow-[0_4px_0_#c05621] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50"
                >
                    できた！
                </button>
            ) : (
                <button
                    onClick={handleNext}
                    className="w-full py-3 bg-brand-blue text-white text-xl font-black rounded-xl shadow-[0_4px_0_#2b6cb0] active:shadow-none active:translate-y-[4px] transition-all flex justify-center items-center gap-2"
                >
                    つぎへ <ArrowRight size={20} strokeWidth={3} />
                </button>
            )}
        </div>

        {/* フィードバック部分のパディングを削減 */}
        <div className="w-full max-w-[340px] shrink-0">
            {result ? (
                <div className={`w-full p-2.5 rounded-xl border-l-4 shadow-sm animate-fade-in flex items-start gap-2.5 ${result.correct ? 'bg-brand-green/10 border-brand-green' : 'bg-brand-pink/10 border-brand-pink'}`}>
                    <span className="text-xl shrink-0">{result.correct ? '💮' : '🤔'}</span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-black text-gray-800 leading-tight mb-0.5">{result.correct ? 'すごい！' : 'おしい！'}</p>
                        <p className="text-[9px] text-gray-600 font-bold leading-normal break-words">
                            {result.msg}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center text-[9px] text-gray-400 font-bold animate-pulse py-1">
                    ていねいに かいてね！
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default WritingMode;
