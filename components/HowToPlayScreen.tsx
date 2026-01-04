
import React from 'react';
import { ArrowLeft, BookOpen, PenTool, Sparkles, Grid, Pointer, UserPlus, Plus } from 'lucide-react';
import { GlobalHeader } from './Logo';

interface HowToPlayScreenProps {
  onBack: () => void;
  onLogoClick: () => void;
}

const HowToPlayScreen: React.FC<HowToPlayScreenProps> = ({ onBack, onLogoClick }) => {
  return (
    <div className="flex flex-col h-full bg-brand-cream overflow-hidden">
      <GlobalHeader 
        onLogoClick={onLogoClick}
        leftAction={
          <button onClick={onBack} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition shadow-sm bg-white/50 border border-gray-100">
            <ArrowLeft size={24} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-brand-cream pb-24">
        <div className="max-w-md mx-auto space-y-12">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-gray-700 tracking-tighter">あそびかた</h2>
            <p className="text-xs font-bold text-gray-400">たのしく かんじ を おぼえよう！</p>
          </div>

          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="bg-brand-green p-2 rounded-xl text-white shadow-sm">
                <UserPlus size={24} />
              </div>
              <h3 className="text-2xl font-black text-brand-green">0. ユーザー を つくろう</h3>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-brand-green/20 shadow-sm space-y-4">
              <div className="flex justify-center py-2">
                <div className="bg-white border-4 border-dashed border-brand-green/40 p-4 rounded-2xl flex items-center gap-2 text-brand-green font-black scale-90">
                    <Plus size={24} strokeWidth={3} />
                    <span>あたらしく つくる</span>
                </div>
              </div>
              <p className="text-gray-700 font-bold leading-relaxed text-center text-sm">
                さいしょに <span className="text-brand-green font-black">「あたらしく つくる」</span> を<br/>
                おして、おなまえ を いれてね！
              </p>
            </div>
          </div>

          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2">
              <div className="bg-brand-orange p-2 rounded-xl text-white shadow-sm">
                <Grid size={24} />
              </div>
              <h3 className="text-2xl font-black text-brand-orange">1. はじめかた</h3>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-brand-orange/20 shadow-sm space-y-6">
              <div className="relative flex justify-center py-2">
                <div className="bg-white border-4 border-brand-yellow p-4 rounded-2xl flex items-center gap-3 shadow-sm scale-90">
                    <div className="bg-brand-yellow/20 p-2 rounded-lg text-brand-orange">
                        <Grid size={24} />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-xs">かんじリスト</p>
                        <p className="text-[8px] text-brand-orange font-black">あそんでみよう！</p>
                    </div>
                </div>
                <div className="absolute top-1/2 left-1/2 translate-x-4 translate-y-2 text-brand-blue animate-bounce">
                    <Pointer size={32} fill="currentColor" />
                </div>
              </div>
              <p className="text-gray-700 font-bold leading-relaxed text-center text-sm">
                ユーザー を えらんだら、<br/>
                <span className="text-brand-orange font-black">「かんじリスト」</span> を<br/>
                タップ してね！
              </p>
            </div>
          </div>
          
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2">
              <div className="bg-brand-blue p-2 rounded-xl text-white shadow-sm">
                <BookOpen size={24} />
              </div>
              <h3 className="text-2xl font-black text-brand-blue">2. よむ れんしゅう</h3>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border-2 border-brand-blue/20 shadow-sm space-y-3">
              <div className="flex justify-center py-4">
                <div className="w-24 h-24 bg-white border-4 border-brand-orange rounded-3xl flex items-center justify-center text-5xl font-black text-gray-800 shadow-sm relative">
                  山
                  <div className="absolute -bottom-2 -right-2 bg-brand-blue text-white p-1 rounded-full"><Sparkles size={16}/></div>
                </div>
              </div>
              <p className="text-gray-700 font-bold leading-relaxed text-center">
                でてきた かんじ の よみかた を<br/>
                <span className="text-brand-orange font-black">ひらがな</span> で かいてね！
              </p>
            </div>
          </div>

          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2">
              <div className="bg-brand-pink p-2 rounded-xl text-white shadow-sm">
                <PenTool size={24} />
              </div>
              <h3 className="text-2xl font-black text-brand-pink">3. かく れんしゅう</h3>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border-2 border-brand-pink/20 shadow-sm space-y-3">
              <div className="flex justify-center py-4 relative">
                <div className="w-32 h-32 border-4 border-dashed border-gray-200 rounded-3xl flex items-center justify-center relative bg-gray-50">
                   <div className="text-gray-200 text-6xl font-black">川</div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="80" height="80" viewBox="0 0 100 100" className="text-brand-pink opacity-80">
                        <path d="M30,20 L30,80 M50,20 L50,80 M70,20 L70,80" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                      </svg>
                   </div>
                </div>
                <div className="absolute bottom-0 right-10 bg-brand-orange text-white px-3 py-1 rounded-full text-xs font-black shadow-md">「できた！」</div>
              </div>
              <p className="text-gray-700 font-bold leading-relaxed text-center">
                ゆび で ていねい に かこう！<br/>
                <span className="text-brand-pink font-black">AI（えーあい）</span> が はなまる を くれるよ。
              </p>
            </div>
          </div>

          <div className="text-center pt-4 pb-12">
            <button 
              onClick={onBack}
              className="bg-brand-orange text-white px-10 py-4 rounded-2xl font-black text-xl shadow-[0_6px_0_#c05621] active:shadow-none active:translate-y-[6px] transition-all"
            >
              わかった！
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HowToPlayScreen;
