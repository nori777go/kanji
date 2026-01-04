
import React, { useState, useEffect } from 'react';
import { User, Plus, ChevronRight, Star, HelpCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { getAllUsers, getLastUser } from '../services/storage';
import { GlobalHeader } from './Logo';

interface UserSelectScreenProps {
  onSelectUser: (name: string) => void;
  onShowHowToPlay: () => void;
  onLogoClick: () => void;
}

const UserSelectScreen: React.FC<UserSelectScreenProps> = ({ onSelectUser, onShowHowToPlay, onLogoClick }) => {
  const [users, setUsers] = useState<Record<string, any>>({});
  const [lastUser, setLastUser] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    try {
      setUsers(getAllUsers());
      setLastUser(getLastUser());
    } catch (e) {
      console.error("Storage error:", e);
    }
  }, []);

  const userList = Object.keys(users);

  const handleCreate = () => {
    if (newName.trim()) {
      onSelectUser(newName.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-brand-cream overflow-hidden">
      <GlobalHeader 
        onLogoClick={onLogoClick}
        rightAction={
          <button 
              onClick={onShowHowToPlay}
              className="p-2 rounded-full text-brand-blue hover:bg-brand-blue/5"
          >
              <HelpCircle size={24} />
          </button>
        }
      />
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6 min-h-0 bg-brand-cream overflow-y-auto pb-6">
        
        <div className="space-y-2 pt-4 shrink-0">
          <div className="text-center mb-2">
            <h2 className="text-xl font-black text-gray-700 tracking-tight">だれが あそぶ？</h2>
            <p className="text-gray-400 font-bold text-[10px]">おなまえ を えらんでね</p>
          </div>

          {userList.length === 0 && !isCreating ? (
              <div className="border-2 border-dashed border-gray-300 rounded-[2rem] py-8 px-4 text-center bg-white/20 transition-all flex items-center justify-center gap-3 animate-fade-in mb-1">
                  <User size={20} className="text-gray-300" />
                  <p className="font-black text-gray-400 text-xs">
                    まだ ユーザー が いません
                  </p>
              </div>
          ) : (
            <div className="space-y-2 mb-2">
              {userList.map(name => {
                  const user = users[name];
                  const totalMastered = (user.masteredReading?.length || 0) + (user.masteredWriting?.length || 0);
                  const isLast = name === lastUser;
                  
                  return (
                    <button
                      key={name}
                      onClick={() => onSelectUser(name)}
                      className={`w-full p-4 rounded-[1.5rem] border-2 shadow-sm flex items-center justify-between transition-all active:scale-95 group relative ${
                          isLast 
                          ? 'bg-white border-brand-orange ring-2 ring-brand-orange/20 z-10' 
                          : 'bg-white border-brand-blue hover:border-brand-blue/70'
                      }`}
                    >
                      {isLast && (
                          <div className="absolute -top-3 left-6 bg-brand-orange text-white text-[9px] px-2.5 py-0.5 rounded-full font-black shadow-sm border border-white">
                              さいごに あそんだよ
                          </div>
                      )}
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`shrink-0 p-2.5 rounded-full ${
                            isLast ? 'bg-brand-orange text-white' : 'bg-brand-blue/10 text-brand-blue'
                        }`}>
                          <User size={18} />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-lg font-black text-gray-700 truncate">{name}</p>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                            <Star size={11} className="fill-brand-yellow text-brand-yellow shrink-0"/>
                            <span>{totalMastered}もん できたよ</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 shrink-0" />
                    </button>
                  );
              })}
            </div>
          )}
          
          <div className="pt-2">
              {!isCreating ? (
                  <button
                      onClick={() => setIsCreating(true)}
                      className="w-full relative bg-white p-4 rounded-[2rem] flex items-center justify-center gap-3 text-brand-green font-black hover:bg-brand-green/5 transition active:scale-95 shadow-sm text-lg animate-highlight-pulse"
                  >
                      <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-[2rem]">
                        <rect 
                          x="2" y="2" 
                          width="calc(100% - 4px)" 
                          height="calc(100% - 4px)" 
                          rx="30" 
                          fill="none" 
                          stroke="#6BCB77" 
                          strokeWidth="4" 
                          strokeDasharray="12 12"
                          className="animate-dash-move"
                        />
                      </svg>
                      <Plus size={24} strokeWidth={3} className="relative z-10" />
                      <span className="relative z-10">あたらしく つくる</span>
                  </button>
              ) : (
                  <div className="bg-white p-5 rounded-[2rem] border-4 border-brand-green shadow-xl animate-fade-in">
                      <p className="text-sm text-brand-green font-black mb-3 text-center">おなまえ を いれてね</p>
                      <div className="flex gap-2">
                          <input 
                              autoFocus
                              type="text" 
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="れい：たろう"
                              className="flex-1 min-w-0 bg-gray-100 rounded-2xl px-4 py-3 font-black text-xl outline-none focus:ring-4 focus:ring-brand-green/20 text-gray-700 text-center"
                              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                          />
                          <button 
                              onClick={handleCreate}
                              disabled={!newName.trim()}
                              className="shrink-0 bg-brand-green text-white px-5 rounded-2xl font-black text-lg shadow-[0_4px_0_#38a169] active:shadow-none active:translate-y-[4px] transition"
                          >
                              OK
                          </button>
                      </div>
                      <button 
                          onClick={() => setIsCreating(false)} 
                          className="w-full text-center text-[10px] text-gray-400 mt-3 font-bold py-1"
                      >
                          やめる
                      </button>
                  </div>
              )}
          </div>
        </div>

        <div className="text-center pt-6 pb-6 flex flex-col items-center gap-2 mt-2">
            <div className="bg-white rounded-[2rem] p-4 shadow-sm border-2 border-brand-yellow/30 text-left w-full animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="text-brand-yellow fill-brand-yellow" size={18} />
                <h3 className="font-black text-brand-orange text-sm leading-tight">
                  ピカピカ がくしゅう で できること
                </h3>
              </div>
              
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-brand-green shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-gray-600 leading-relaxed">
                    <span className="text-brand-green font-black underline decoration-brand-green/20 underline-offset-4">「あってるかな？」が すぐ わかる！</span><br/>
                    AI（えーあい）が そのばで まるつけ。
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-brand-green shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-gray-600 leading-relaxed">
                    <span className="text-brand-green font-black underline decoration-brand-green/20 underline-offset-4">ニガテ を おぼえてくれる AI（えーあい）</span><br/>
                    まちがえた かんじ を あとで ふくしゅう できます。
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-brand-green shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-gray-600 leading-relaxed">
                    <span className="text-brand-green font-black underline decoration-brand-green/20 underline-offset-4">1ねんせい から 6ねんせい まで！</span><br/>
                    ずっと ながく いっしょに あそべます。
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-brand-blue/5 rounded-2xl p-2.5 border border-brand-blue/10 w-full">
              <p className="text-[9px] font-black text-brand-blue leading-relaxed text-center opacity-80">
                かんじ を かいたり よんだり みんなで れんしゅう だ！<br/>
                AI（えーあい）と いっしょに たのしもう！！
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserSelectScreen;
