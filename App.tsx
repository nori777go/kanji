
import React, { useState, useEffect } from 'react';
import { GameMode, KanjiData } from './types';
import ReadingMode from './components/ReadingMode';
import WritingMode from './components/WritingMode';
import HistoryScreen from './components/HistoryScreen';
import CollectionScreen from './components/CollectionScreen';
import UserSelectScreen from './components/UserSelectScreen';
import HowToPlayScreen from './components/HowToPlayScreen';
import AdBanner from './components/AdBanner';
import { RotateCw, User, Book, Grid, Trophy, HelpCircle, PlayCircle, BrainCircuit } from 'lucide-react';
import { getUserProgress } from './services/storage';
import { GlobalHeader } from './components/Logo';

function App() {
  const [mode, setMode] = useState<GameMode>(GameMode.USER_SELECT); 
  const [prevMode, setPrevMode] = useState<GameMode | 'COLLECTION' | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [gameKanjiList, setGameKanjiList] = useState<KanjiData[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  
  // State to force ad refresh
  const [adRefreshKey, setAdRefreshKey] = useState(0);

  // Refresh ad whenever mode changes
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
    setPrevMode(null);
  };

  const showHowToPlay = () => {
    setPrevMode(mode as any);
    setMode(GameMode.HOW_TO_PLAY);
  };

  const handleHelpBack = () => {
    if (prevMode) {
      setMode(prevMode as GameMode);
      setPrevMode(null);
    } else {
      setMode(GameMode.MENU);
    }
  };

  const renderContent = () => {
    switch (mode) {
      case GameMode.USER_SELECT:
        return <UserSelectScreen onSelectUser={handleUserSelect} onShowHowToPlay={showHowToPlay} onLogoClick={goToHome} />;

      case GameMode.HOW_TO_PLAY:
        return <HowToPlayScreen onBack={handleHelpBack} onLogoClick={goToHome} />;

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
          <div className="flex flex-col h-full overflow-hidden bg-brand-cream">
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
            <div className="flex-1 flex flex-col items-center justify-start px-6 gap-2.5 max-w-sm mx-auto animate-fade-in pt-1 overflow-y-auto pb-6">
              
              {/* 1. Kanji List Button */}
              <button
                  onClick={() => setMode('COLLECTION' as any)}
                  className="w-full bg-white p-4 rounded-[2.5rem] border-4 border-brand-yellow shadow-[0_8px_0_#d69e2e] active:shadow-none active:translate-y-[8px] transition-all flex items-center gap-3 group shrink-0 relative overflow-hidden mt-0.5"
                >
                  <div className="bg-brand-yellow/20 p-2.5 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                      <Grid size={32} className="text-brand-orange" />
                  </div>
                  <div className="text-left min-w-0">
                      <h2 className="text-lg font-black text-gray-800 leading-none mb-0.5">かんじ リスト</h2>
                      <p className="text-[10px] text-brand-orange font-black animate-pulse">あそんで みよう！</p>
                  </div>
                  <div className="absolute right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <PlayCircle size={48} className="text-brand-orange" />
                  </div>
              </button>

              {/* 2. User Info Section */}
              {currentUser && (
                <div className="w-full flex flex-col gap-1.5 shrink-0">
                  <div className="w-full flex justify-between items-center bg-white px-4 py-2 rounded-2xl shadow-sm border-2 border-brand-yellow">
                      <div className="flex flex-col items-start min-w-0">
                          <div className="flex items-center gap-2 text-brand-blue font-black truncate w-full text-sm">
                              <User size={16} className="shrink-0" />
                              <span className="truncate">{currentUser}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold">
                              <Trophy size={11} className="text-brand-orange"/>
                              ランク {userLevel} (★ {totalMastered})
                          </div>
                      </div>
                      <button onClick={() => setMode(GameMode.HISTORY)} className="bg-brand-green/10 p-2 rounded-xl text-brand-green active:scale-90 transition">
                          <Book size={20} />
                      </button>
                  </div>
                  <button 
                    onClick={() => { setCurrentUser(null); setMode(GameMode.USER_SELECT); }} 
                    className="text-gray-400 font-black text-[10px] underline decoration-gray-300 underline-offset-4 self-center py-0.5"
                  >
                      ユーザー を かえる
                  </button>
                </div>
              )}

              {/* 3. Review Section */}
              {(weakReadingCount > 0 || weakWritingCount > 0) && (
                <div className="w-full space-y-2 shrink-0">
                  <div className="bg-brand-pink/10 p-3 rounded-[2rem] border-2 border-brand-pink animate-fade-in shadow-sm">
                      <div className="flex items-center gap-1.5 mb-2 justify-center text-brand-pink font-black text-[11px]">
                          <RotateCw size={14} />
                          <span>ニガテ の ふくしゅう</span>
                      </div>
                      <div className="flex gap-2">
                          {weakReadingCount > 0 && (
                              <button onClick={() => startReview(GameMode.READING)} className="flex-1 bg-white text-brand-pink font-black py-2 rounded-xl shadow-sm active:scale-95 text-[10px]">よむ</button>
                          )}
                          {weakWritingCount > 0 && (
                              <button onClick={() => startReview(GameMode.WRITING)} className="flex-1 bg-white text-brand-pink font-black py-2 rounded-xl shadow-sm active:scale-95 text-[10px]">かく</button>
                          )}
                      </div>
                  </div>
                </div>
              )}

              {/* 4. Description Section (Packed tight with mt-2) */}
              <div className="bg-white border-2 border-brand-orange/20 rounded-3xl p-3.5 shadow-sm w-full animate-fade-in mt-2 mb-2">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <BrainCircuit className="text-brand-orange/50" size={16} />
                    <p className="text-[9px] font-black text-brand-orange/80">
                      AI（えーあい）と いっしょに かんじ を おぼえよう！
                    </p>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold leading-relaxed">
                    きみの かいたじ を AI（えーあい）が やさしく みまもって、100てん なら はなまる！<br/>
                    せかいに ひとつだけの ピカピカな じ を かけるように なろう！
                  </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-brand-cream font-sans text-gray-800 flex flex-col overflow-hidden relative">
      <main className="flex-1 w-full relative overflow-hidden min-h-0 bg-brand-cream">
        {renderContent()}
      </main>
      
      <footer className="bg-brand-cream z-50 overflow-hidden shrink-0 border-t border-brand-yellow/20 !bg-[#FFF5E4]">
        <AdBanner key={adRefreshKey} />
        <div className="w-full pt-0.5 pb-3 safe-bottom text-center text-[7px] text-gray-400 font-bold leading-relaxed !bg-[#FFF5E4]">
           <div className="bg-brand-cream space-y-1">
             <div className="flex justify-center items-center gap-3 mb-0.5">
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
