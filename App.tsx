
import React, { useState, useEffect } from 'react';
import { GameMode, KanjiData } from './types';
import ReadingMode from './components/ReadingMode';
import WritingMode from './components/WritingMode';
import HistoryScreen from './components/HistoryScreen';
import CollectionScreen from './components/CollectionScreen';
import UserSelectScreen from './components/UserSelectScreen';
import HowToPlayScreen from './components/HowToPlayScreen';
import AdBanner from './components/AdBanner';
import { RotateCw, User, Book, Grid, Trophy, HelpCircle, BrainCircuit, Sparkles } from 'lucide-react';
import { getUserProgress } from './services/storage';
import { GlobalHeader } from './components/Logo';

const VividJewelSparkles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 rounded-[3rem]">
    {[...Array(10)].map((_, i) => (
      <div 
        key={i}
        className="vivid-sparkle-particle animate-sparkle-vivid"
        style={{
          width: `${Math.random() * 14 + 6}px`,
          height: `${Math.random() * 14 + 6}px`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 2}s`
        } as any}
      />
    ))}
  </div>
);

function App() {
  const [mode, setMode] = useState<GameMode>(GameMode.USER_SELECT); 
  const [prevMode, setPrevMode] = useState<GameMode>(GameMode.USER_SELECT);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [gameKanjiList, setGameKanjiList] = useState<KanjiData[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  
  const [adRefreshKey, setAdRefreshKey] = useState(0);

  useEffect(() => {
    setAdRefreshKey(prev => prev + 1);
  }, [mode]);

  const triggerAdRefresh = () => {
    setAdRefreshKey(prev => prev + 1);
  };

  const handleUserSelect = (name: string) => {
      setCurrentUser(name);
      setMode(GameMode.MENU);
  };

  const handleSaveUser = (name: string) => {
    setCurrentUser(name);
  };

  const getUserData = () => {
    return currentUser ? getUserProgress(currentUser) : null;
  };

  const userData = getUserData();
  const totalMastered = (userData?.masteredReading.length || 0) + (userData?.masteredWriting.length || 0);
  const weakReadingCount = userData?.weakReading.length || 0;
  const weakWritingCount = userData?.weakWriting.length || 0;
  const userLevel = Math.floor(totalMastered / 10) + 1; 

  const startReview = (gameMode: GameMode) => {
    if (!userData) return;
    const list = gameMode === GameMode.READING ? userData.weakReading : userData.weakWriting;
    if (list.length > 0) {
        setGameKanjiList(list);
        setIsReviewing(true);
        setMode(gameMode);
    }
  };

  const startFromCollection = (gameMode: GameMode, kanjiList: KanjiData[]) => {
      setGameKanjiList(kanjiList);
      setIsReviewing(false); 
      setMode(gameMode);
  };

  const handleBackToMenu = () => {
      setMode(GameMode.MENU);
      setIsReviewing(false);
      setGameKanjiList([]);
  };

  const goToHome = () => {
    if (currentUser) {
      setMode(GameMode.MENU);
    } else {
      setMode(GameMode.USER_SELECT);
    }
    setIsReviewing(false);
    setGameKanjiList([]);
  };

  const showHowToPlay = () => {
    setPrevMode(mode);
    setMode(GameMode.HOW_TO_PLAY);
  };

  const handleBackFromHowToPlay = () => {
    setMode(prevMode);
  };

  const renderContent = () => {
    switch (mode) {
      case GameMode.HOW_TO_PLAY:
        return <HowToPlayScreen onBack={handleBackFromHowToPlay} onLogoClick={goToHome} />;

      case GameMode.USER_SELECT:
        return <UserSelectScreen onSelectUser={handleUserSelect} onShowHowToPlay={showHowToPlay} onLogoClick={goToHome} />;

      case GameMode.READING:
        return (
            <ReadingMode 
                onBack={handleBackToMenu} 
                onShowHowToPlay={showHowToPlay}
                onLogoClick={goToHome}
                currentUser={currentUser}
                onSaveUser={handleSaveUser}
                initialKanji={gameKanjiList.length > 0 ? gameKanjiList : undefined}
                excludeKanji={userData?.masteredReading.map(k => k.character)}
                grade={selectedGrade}
                onStepChange={triggerAdRefresh}
            />
        );
      case GameMode.WRITING:
        return (
            <WritingMode 
                onBack={handleBackToMenu}
                onShowHowToPlay={showHowToPlay}
                onLogoClick={goToHome}
                currentUser={currentUser}
                onSaveUser={handleSaveUser}
                initialKanji={gameKanjiList.length > 0 ? gameKanjiList : undefined}
                excludeKanji={userData?.masteredWriting.map(k => k.character)}
                grade={selectedGrade}
                onStepChange={triggerAdRefresh}
            />
        );
      case GameMode.HISTORY:
        if (userData) return <HistoryScreen userProgress={userData} onBack={handleBackToMenu} onShowHowToPlay={showHowToPlay} onLogoClick={goToHome} />;
        return <div onClick={handleBackToMenu}>Error</div>;

      case 'COLLECTION' as any: 
         return (
            <CollectionScreen 
                grade={selectedGrade}
                userProgress={userData}
                onBack={handleBackToMenu}
                onStartGame={startFromCollection}
                setGrade={setSelectedGrade}
                onShowHowToPlay={showHowToPlay}
                onLogoClick={goToHome}
            />
         );

      case GameMode.MENU:
      default:
        return (
          <div className="flex flex-col h-full bg-brand-cream overflow-hidden">
            <GlobalHeader 
              onLogoClick={goToHome}
              rightAction={
                <button 
                    onClick={showHowToPlay}
                    className="p-2 rounded-full text-brand-blue hover:bg-brand-blue/5"
                >
                    <HelpCircle size={24} />
                </button>
              }
            />
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto overflow-x-hidden px-6 bg-brand-cream py-4 scrolling-touch">
              <div className="w-full max-w-sm flex flex-col items-center gap-3 animate-fade-in">
                <div className="w-full flex items-center justify-center relative py-1">
                  <button
                      onClick={() => setMode('COLLECTION' as any)}
                      className="w-full max-w-[320px] h-40 vivid-jewel-button flex flex-col items-center justify-center gap-1 group relative animate-piko-jump-small"
                    >
                      <div className="jewel-rim-light"></div>
                      <VividJewelSparkles />
                      <div className="shine-overlay animate-shine-sweep absolute inset-0 overflow-hidden rounded-[3rem]"></div>
                      <div className="bg-white/20 p-2.5 rounded-[1.6rem] group-hover:scale-110 transition-transform shrink-0 relative z-20 border border-white/40 shadow-xl backdrop-blur-[4px]">
                          <Grid size={40} className="text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]" />
                      </div>
                      <div className="text-center relative z-20">
                          <h2 className="text-xl font-black text-white leading-none mb-1 tracking-tighter drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]">
                              かんじ リスト
                          </h2>
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles size={16} className="text-brand-yellow fill-brand-yellow animate-pulse drop-shadow-lg" />
                            <p className="text-base text-brand-yellow font-black drop-shadow-lg tracking-tight">あそんで みよう！</p>
                            <Sparkles size={16} className="text-brand-yellow fill-brand-yellow animate-pulse drop-shadow-lg" />
                          </div>
                      </div>
                  </button>
                </div>

                {currentUser && (
                  <div className="w-full flex flex-col gap-1 shrink-0">
                    <div className="w-full flex justify-between items-center bg-white px-5 py-2.5 rounded-[2rem] shadow-sm border-2 border-brand-yellow">
                        <div className="flex flex-col items-start min-w-0">
                            <div className="flex items-center gap-2 text-brand-blue font-black truncate w-full text-base">
                                <User size={18} className="shrink-0" />
                                <span className="truncate">{currentUser}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold">
                                <Trophy size={12} className="text-brand-orange"/>
                                ランク {userLevel} (★ {totalMastered})
                            </div>
                        </div>
                        <button onClick={() => setMode(GameMode.HISTORY)} className="bg-brand-green/10 p-2.5 rounded-xl text-brand-green active:scale-90 transition border border-brand-green/20">
                            <Book size={20} />
                        </button>
                    </div>
                    <button 
                      onClick={() => { setCurrentUser(null); setMode(GameMode.USER_SELECT); }} 
                      className="text-gray-400 font-black text-[9px] underline decoration-gray-300 underline-offset-4 self-center py-1 mb-0.5"
                    >
                        ユーザー を かえる
                    </button>
                  </div>
                )}

                {(weakReadingCount > 0 || weakWritingCount > 0) && (
                  <div className="w-full space-y-1.5 shrink-0">
                    <div className="bg-brand-pink/10 p-3.5 rounded-[2rem] border-2 border-brand-pink animate-fade-in shadow-sm">
                        <div className="flex items-center gap-2 mb-2 justify-center text-brand-pink font-black text-[11px]">
                            <RotateCw size={14} />
                            <span>ニガテ の ふくしゅう</span>
                        </div>
                        <div className="flex gap-2">
                            {weakReadingCount > 0 && (
                                <button onClick={() => startReview(GameMode.READING)} className="flex-1 bg-white text-brand-pink font-black py-2 rounded-xl shadow-sm active:scale-95 text-[10px] border border-brand-pink/20">よむ</button>
                            )}
                            {weakWritingCount > 0 && (
                                <button onClick={() => startReview(GameMode.WRITING)} className="flex-1 bg-white text-brand-pink font-black py-2 rounded-xl shadow-sm active:scale-95 text-[10px] border border-brand-pink/20">かく</button>
                            )}
                        </div>
                    </div>
                  </div>
                )}

                <div className="bg-white border-2 border-brand-orange/20 rounded-[2rem] p-4 shadow-sm w-full animate-fade-in">
                    <div className="flex items-center gap-2 mb-1.5">
                      <BrainCircuit className="text-brand-orange/50" size={18} />
                      <p className="text-[10px] font-black text-brand-orange/80">
                        AI（えーあい）と いっしょに おぼえよう！
                      </p>
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold leading-relaxed">
                      きみの かいたじ を AI（えーあい）が まるつけ するよ！<br/>
                      100てん なら はなまる！ じょうず に かけるかな？
                    </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-brand-cream font-sans text-gray-800 flex flex-col overflow-hidden relative">
      {/* 
        Safari対策: 
        main を flex-1 かつ h-full に設定し、overflow-hidden で外側の漏れを防ぎます。
        これにより、renderContent() で返される各画面が正確な高さを計算できるようになります。
      */}
      <main className="flex-1 w-full h-full min-h-0 bg-brand-cream overflow-hidden flex flex-col">
        {renderContent()}
      </main>
      
      <footer className="bg-brand-cream z-50 overflow-hidden shrink-0 border-t border-brand-yellow/20 !bg-[#FFF5E4]">
        <AdBanner key={adRefreshKey} />
        <div className="w-full pt-1 pb-4 safe-bottom text-center text-[8px] text-gray-400 font-bold leading-relaxed !bg-[#FFF5E4]">
           <div className="bg-brand-cream space-y-1">
             <div className="flex justify-center items-center gap-4 mb-0.5">
               <a href="https://sumi-innovation.com/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange underline decoration-brand-yellow/50 underline-offset-1">せいさくもと</a>
               <span className="text-gray-300">|</span>
               <a href="https://sumi-innovation.com/#privacy" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange underline decoration-brand-yellow/50 underline-offset-1">プライバシー</a>
             </div>
             <div>© 2025 SUMI Innovation</div>
           </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
