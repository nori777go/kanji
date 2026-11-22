import React, { useState, useEffect, useRef } from 'react';
import { KanjiData, GameResult } from '../types';
import { fetchKanji, evaluateHandwriting } from '../services/geminiService';
import DrawingCanvas from './DrawingCanvas';
import { ArrowRight, Star, PenTool, CheckCircle, Eraser, HelpCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import ResultScreen from './ResultScreen';
import { GlobalHeader } from './Logo';
import FireworksEffect from './FireworksEffect';
import ErrorBoundary from './ErrorBoundary';

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
  onAiSettingsClick?: () => void;
}

const WritingModeContent: React.FC<WritingModeProps> = ({ 
  currentUser, 
  initialKanji, 
  excludeKanji = [], 
  grade = 1, 
  onSaveUser, 
  onBack, 
  onShowHowToPlay, 
  onLogoClick, 
  onStepChange, 
  onAiSettingsClick 
}) => {
  const [kanjiList, setKanjiList] = useState<KanjiData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{correct: boolean, msg: string, evaluatedBy?: 'ai' | 'local'} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [score, setScore] = useState(0);
  const [incorrectItems, setIncorrectItems] = useState<KanjiData[]>([]);
  const [correctItems, setCorrectItems] = useState<KanjiData[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadKanji();
    return () => {
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    };
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

    try {
      if (initialKanji && initialKanji.length > 0) {
        setKanjiList(initialKanji);
      } else {
        const data = await fetchKanji(5, excludeKanji, grade);
        setKanjiList(data && data.length > 0 ? data : []);
      }
    } catch (e) {
      console.error("Failed to load kanji:", e);
    } finally {
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
    
    const currentKanji = kanjiList[currentIndex];
    if (!currentKanji) return;

    setChecking(true);
    try {
      const base64 = canvasRef.current.toDataURL('image/png');
      const feedback = await evaluateHandwriting(base64, currentKanji.character);
      
      setResult({
        correct: feedback.isCorrect,
        msg: feedback.feedback,
        evaluatedBy: feedback.evaluatedBy
      });

      if (feedback.isCorrect) {
        setScore(s => s + 1);
        setCorrectItems(prev => [...prev, currentKanji]);
        setShowConfetti(true);

        // 花火エフェクトを3.5秒後に自動終了させてメモリと表示を保護
        if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
        confettiTimerRef.current = setTimeout(() => {
          setShowConfetti(false);
        }, 3500);
      } else {
        setIncorrectItems(prev => [...prev, currentKanji]);
      }
    } catch (err) {
      console.error("Handwriting evaluation error:", err);
      setResult({
        correct: false,
        msg: "はんてい で エラー が でました。もういちど かいてみてね！",
        evaluatedBy: 'local'
      });
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    setShowConfetti(false);

    if (currentIndex < kanjiList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setResult(null);
      handleClear();
      if (onStepChange) onStepChange();
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

  // 漢字データが存在しない場合の安全なフォールバックUI（空白画面を完全防止）
  const currentKanji = kanjiList[currentIndex];
  if (!currentKanji) {
    return (
      <div className="flex flex-col h-full bg-brand-cream overflow-hidden">
        <GlobalHeader onLogoClick={onLogoClick} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-lg font-black text-brand-blue">かんじ を よみこんでいます...</p>
          <button 
            onClick={loadKanji} 
            className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-2xl font-black shadow-md active:scale-95 transition"
          >
            <RefreshCw size={18} />
            <span>もういちど 読みこむ</span>
          </button>
        </div>
      </div>
    );
  }

  const readingDisplay = currentKanji.kunyomi?.[0] || currentKanji.onyomi?.[0] || currentKanji.character || '';

  return (
    <div className="flex flex-col h-full w-full bg-brand-cream overflow-hidden relative">
      {showConfetti && <FireworksEffect key={`fw-${currentIndex}`} originY={46} />}

      <GlobalHeader 
        onLogoClick={onLogoClick}
        onAiSettingsClick={onAiSettingsClick}
        leftAction={
          <button onClick={onBack} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition" aria-label="もどる">
            <ArrowLeft size={24} />
          </button>
        }
        rightAction={
          <button onClick={onShowHowToPlay} className="p-2 text-brand-blue hover:bg-brand-blue/5 rounded-full transition" aria-label="あそびかた">
            <HelpCircle size={24} />
          </button>
        }
      />

      <div className="shrink-0 w-full flex justify-center items-center gap-2 p-1.5 text-brand-blue text-sm font-bold">
        <span className="bg-brand-blue text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase">{grade}ねんせい</span>
        <Star className="fill-brand-blue" size={12}/>
        <span className="text-[10px] font-black tracking-widest">{currentIndex + 1} / {kanjiList.length}</span>
      </div>

      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-start px-4 gap-1.5 overflow-y-auto pb-4 scrolling-touch relative">
        <div className="bg-white px-4 py-1.5 rounded-xl shadow-sm border-2 border-brand-pink w-full max-w-[340px] text-center shrink-0">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[9px] font-black text-gray-400 tracking-tighter shrink-0 uppercase">
              {result ? 'せいかい：' : 'これをかいて：'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`font-black text-brand-pink ${result ? 'text-lg' : 'text-2xl'}`}>
                {readingDisplay}
              </span>
              {result && (
                <span className="text-3xl font-black text-brand-pink animate-fade-in">
                  ({currentKanji.character})
                </span>
              )}
            </div>
          </div>
          <div className="text-[9px] text-gray-400 font-bold leading-tight">
            いみ: {currentKanji.meaning || 'ー'}
          </div>
        </div>

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
          {result?.correct && (
            <div className="absolute inset-0 flex items-center justify-center z-[110] pointer-events-none">
              <div className="celebration-pop text-6xl font-black text-brand-pink drop-shadow-2xl whitespace-nowrap bg-white/60 px-8 py-4 rounded-full border-4 border-brand-yellow">
                💮 すごい！
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-[300px] shrink-0">
          {!result ? (
            <button
              onClick={handleCheck}
              disabled={checking}
              className="w-full py-3 bg-brand-orange text-white text-xl font-black rounded-xl shadow-[0_4px_0_#c05621] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50"
            >
              できた！
            </button>
          ) : result.correct ? (
            <button
              onClick={handleNext}
              className="w-full py-3 bg-brand-blue text-white text-xl font-black rounded-xl shadow-[0_4px_0_#2b6cb0] active:shadow-none active:translate-y-[4px] transition-all flex justify-center items-center gap-2"
            >
              つぎへ <ArrowRight size={20} strokeWidth={3} />
            </button>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  setResult(null);
                  handleClear();
                }}
                className="flex-1 py-3 bg-brand-orange text-white text-base font-black rounded-xl shadow-[0_4px_0_#c05621] active:shadow-none active:translate-y-[4px] transition-all flex justify-center items-center gap-1.5"
              >
                <Eraser size={18} />
                もういちど かく
              </button>
              <button
                onClick={handleNext}
                className="py-3 px-4 bg-gray-200 text-gray-700 text-sm font-black rounded-xl hover:bg-gray-300 active:scale-95 transition-all flex justify-center items-center gap-1"
              >
                つぎへ <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="w-full max-w-[340px] shrink-0">
          {result ? (
            <div className={`w-full p-2.5 rounded-xl border-l-4 shadow-sm animate-fade-in flex items-start gap-2.5 ${result.correct ? 'bg-brand-green/10 border-brand-green' : 'bg-brand-pink/10 border-brand-pink'}`}>
              <span className="text-xl shrink-0">{result.correct ? '💮' : '🤔'}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className="text-[11px] font-black text-gray-800 leading-tight">
                    {result.correct ? 'すごい！' : 'おしい！'}
                  </p>
                  {result.evaluatedBy === 'ai' ? (
                    <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md shrink-0">
                      ✨ AIはんてい
                    </span>
                  ) : (
                    <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md shrink-0">
                      ✏️ れんしゅう
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-700 font-bold leading-normal break-words">
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

const WritingMode: React.FC<WritingModeProps> = (props) => (
  <ErrorBoundary fallbackTitle="かきモード で エラー が でました">
    <WritingModeContent {...props} />
  </ErrorBoundary>
);

export default WritingMode;
