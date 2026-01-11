
import React from 'react';
import { ArrowLeft, BookOpen, PenTool, Sparkles, Grid, Pointer, UserPlus, Plus, CheckCircle, Trophy, Star } from 'lucide-react';
import { GlobalHeader } from './Logo';

interface HowToPlayScreenProps {
  onBack: () => void;
  onLogoClick: () => void;
}

const HowToPlayScreen: React.FC<HowToPlayScreenProps> = ({ onBack, onLogoClick }) => {
  return (
    <div className="flex flex-col h-full bg-brand-cream overflow-hidden animate-fade-in relative">
      <GlobalHeader 
        onLogoClick={onLogoClick}
        leftAction={
          <button onClick={onBack} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition shadow-sm bg-white/50 border border-gray-100">
            <ArrowLeft size={24} />
          </button>
        }
      />

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-12 bg-brand-cream pb-40">
        <div className="max-w-md mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-gray-700 tracking-tighter">あそびかた</h2>
            <p className="text-xs font-bold text-gray-400">たのしく かんじ を おぼえよう！</p>
          </div>

          {/* Step 0: User */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-brand-green p-2 rounded-xl text-white shadow-sm">
                <UserPlus size={24} />
              </div>
              <h3 className="text-2xl font-black text-brand-green">0. ユーザー を つくる</h3>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-brand-green/20 shadow-sm space-y-4 text-center">
              <div className="flex justify-center py-2">
                <div className="bg-white border-4 border-dashed border-brand-green/40 p-4 rounded-2xl flex items-center gap-2 text-brand-green font-black scale-90">
                    <Plus size={24} strokeWidth={3} />
                    <span>あたらしく つくる</span>
                </div>
              </div>
              <p className="text-gray-700 font-bold leading-relaxed text-sm">
                さいしょに <span className="text-brand-green font-black">「あたらしく つくる」</span> を<br/>
                おして、おなまえ を いれてね！
              </p>
            </div>
          </div>

          {/* Step 1: Menu */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-brand-orange p-2 rounded-xl text-white shadow-sm">
                <Grid size={24} />
              </div>
              <h3 className="text-2xl font-black text-brand-orange">1. はじめかた</h3>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-brand-orange/20 shadow-sm space-y-6 overflow-hidden text-center">
              <div className="relative flex justify-center py-2">
                <div className="w-48 h-24 vivid-jewel-button flex flex-col items-center justify-center gap-1 scale-75 border-4">
                    <div className="jewel-rim-light"></div>
                    <div className="bg-white/20 p-1.5 rounded-xl border border-white/40">
                        <Grid size={20} className="text-white" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xs font-black text-white leading-none mb-0.5 tracking-tighter drop-shadow-md">
                            かんじ リスト
                        </h2>
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-[8px] text-brand-yellow font-black drop-shadow-md">あそんで みよう！</p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-1/2 left-1/2 translate-x-12 translate-y-4 text-brand-blue animate-bounce">
                    <Pointer size={32} fill="currentColor" />
                </div>
              </div>
              <p className="text-gray-700 font-bold leading-relaxed text-sm">
                キラキラ光る <span className="text-brand-orange font-black">「かんじリスト」</span> を<br/>
                タップ してね！
              </p>
            </div>
          </div>
          
          {/* Step 2: Reading */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-brand-blue p-2 rounded-xl text-white shadow-sm">
                <BookOpen size={24} />
              </div>
              <h3 className="text-2xl font-black text-brand-blue">2. よむ れんしゅう</h3>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border-2 border-brand-blue/20 shadow-sm space-y-3 text-center">
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-20 h-20 bg-white border-4 border-brand-orange rounded-[20px] flex items-center justify-center text-4xl font-black text-gray-800 shadow-sm">
                  口
                </div>
                <div className="w-full max-w-[140px] p-2 bg-white border-2 border-brand-yellow rounded-lg text-center text-[10px] text-gray-400 font-black">
                    ひらがな...
                </div>
                <div className="w-full max-w-[140px] py-1.5 bg-brand-blue text-white rounded-lg text-[10px] font-black text-center shadow-[0_2px_0_#2b6cb0]">
                    こたえあわせ！
                </div>
                <div className="w-full max-w-[160px] p-1.5 bg-white border-4 border-brand-blue rounded-lg text-center animate-pulse">
                    <p className="text-[8px] text-gray-400 font-bold mb-0.5 uppercase tracking-tighter">こたえ</p>
                    <p className="text-xs font-black text-brand-blue">くち・コウ</p>
                </div>
              </div>
              <p className="text-gray-700 font-bold leading-relaxed text-sm">
                ひらがな で こたえてね！<br/>
                まちがえると <span className="text-brand-blue font-black">ボタンのした</span> に<br/>
                こたえ が でるよ。
              </p>
            </div>
          </div>

          {/* Step 3: Writing */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-brand-pink p-2 rounded-xl text-white shadow-sm">
                <PenTool size={24} />
              </div>
              <h3 className="text-2xl font-black text-brand-pink">3. かく れんしゅう</h3>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border-2 border-brand-pink/20 shadow-sm space-y-3 text-center">
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="bg-white px-4 py-1.5 rounded-xl border-2 border-brand-pink w-full max-w-[180px] text-center shadow-sm">
                    <span className="text-[8px] font-black text-gray-400 uppercase">これをかいて：</span>
                    <span className="font-black text-brand-pink text-base ml-1">やま</span>
                </div>
                <div className="w-24 h-24 border-4 border-brand-blue rounded-2xl flex items-center justify-center relative bg-white overflow-hidden shadow-inner">
                   <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-1/2 w-full h-px bg-red-400 border-t border-dashed border-red-400"></div>
                      <div className="absolute left-1/2 h-full w-px bg-red-400 border-l border-dashed border-red-400"></div>
                   </div>
                   <svg width="40" height="40" viewBox="0 0 100 100" className="text-gray-800">
                        <path d="M50,20 L50,85 M25,40 L25,75 L50,75 M75,40 L75,75 L50,75" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                   </svg>
                </div>
                <div className="w-full max-w-[120px] py-1.5 bg-brand-orange text-white text-[10px] font-black rounded-lg shadow-[0_2px_0_#c05621]">
                    できた！
                </div>
              </div>
              <p className="text-gray-700 font-bold leading-relaxed text-sm">
                ゆび で ていねい に かこう！<br/>
                <span className="text-brand-pink font-black">AI（えーあい）</span> が そのばで<br/>
                まるつけ してくれるよ！
              </p>
            </div>
          </div>

          {/* Step 4: Collection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-brand-yellow p-2 rounded-xl text-white shadow-sm">
                <Trophy size={24} className="fill-white" />
              </div>
              <h3 className="text-2xl font-black text-brand-yellow" style={{ color: '#d4a017' }}>4. コレクション を めざそう！</h3>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-brand-yellow/30 shadow-sm space-y-4 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="grid grid-cols-3 gap-2 w-full max-w-[180px]">
                    <div className="aspect-square bg-white border-2 border-brand-green rounded-lg flex items-center justify-center text-xl font-black text-gray-800 relative shadow-sm">
                        一
                        <div className="absolute -bottom-1 -right-1 bg-brand-green text-white rounded-full p-0.5"><CheckCircle size={10} strokeWidth={4} /></div>
                    </div>
                    <div className="aspect-square bg-white border-2 border-brand-green rounded-lg flex items-center justify-center text-xl font-black text-gray-800 relative shadow-sm">
                        二
                        <div className="absolute -bottom-1 -right-1 bg-brand-green text-white rounded-full p-0.5"><CheckCircle size={10} strokeWidth={4} /></div>
                    </div>
                    <div className="aspect-square bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center text-xl font-black text-gray-300">
                        三
                    </div>
                </div>
                <div className="flex items-center gap-1 text-brand-orange animate-pulse">
                    <Sparkles size={16} fill="currentColor" />
                    <span className="text-sm font-black">どんどん うまっていくよ！</span>
                    <Sparkles size={16} fill="currentColor" />
                </div>
              </div>
              <p className="text-gray-700 font-bold leading-relaxed text-sm">
                れんしゅう して 「できた！」 になった かんじ は、<br/>
                <span className="text-brand-green font-black underline decoration-brand-green/20 underline-offset-4">リスト が ぴかぴか に うまっていくよ！</span><br/>
                ぜんぶ あつめて ぴかぴか の かんじマスター に なろう！
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer with Action Button - Simplified to only "Play" button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-brand-cream/80 backdrop-blur-md border-t border-brand-yellow/20 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40 flex flex-col items-center animate-fade-in safe-bottom">
        <button 
          onClick={onBack}
          className="w-full max-w-xs h-16 vivid-jewel-button flex flex-col items-center justify-center relative group"
        >
          <div className="jewel-rim-light"></div>
          <span className="text-white font-black text-2xl tracking-widest drop-shadow-md relative z-10 flex items-center gap-2">
            <Star className="fill-white" size={24} />
            あそぶ
            <Star className="fill-white" size={24} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default HowToPlayScreen;
