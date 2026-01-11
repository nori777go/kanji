
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
    setUsers(getAllUsers());
    setLastUser(getLastUser());
  }, []);

  const userList = Object.keys(users);

  const handleCreate = () => {
    if (newName.trim()) {
      onSelectUser(newName.trim());
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-cream overflow-hidden">
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
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto px-6 bg-brand-cream">
        <div className="w-full max-w-sm flex flex-col gap-4 py-8 animate-fade-in">
          
          {/* User Selection Header */}
          <div className="text-center">
            <h2 className="text-2xl font-black text-gray-700 tracking-tight">だれが あそぶ？</h2>
            <p className="text-gray-400 font-bold text-xs">おなまえ を えらんでね</p>
          </div>

          {userList.length === 0 && !isCreating ? (
              <div className="border-4 border-dashed border-gray-300 rounded-[2.5rem] py-8 px-6 text-center bg-white/20 transition-all flex flex-col items-center justify-center gap-3 animate-fade-in">
                  <User size={32} className="text-gray-300" />
                  <p className="font-black text-gray-400 text-sm">
                    まだ ユーザー が いません
                  </p>
              </div>
          ) : (
            <div className="space-y-3">
              {userList.map(name => {
                  const user = users[name];
                  const totalMastered = (user.masteredReading?.length || 0) + (user.masteredWriting?.length || 0);
                  const isLast = name === lastUser;
                  
                  return (
                    <button
                      key={name}
                      onClick={() => onSelectUser(name)}
                      className={`w-full p-5 rounded-[2rem] border-2 shadow-sm flex items-center justify-between transition-all active:scale-95 group relative ${
                          isLast 
                          ? 'bg-white border-brand-orange ring-4 ring-brand-orange/10 z-10' 
                          : 'bg-white border-brand-blue hover:border-brand-blue/70 shadow-[0_4px_0_#4299e1] active:shadow-none'
                      }`}
                    >
                      {isLast && (
                          <div className="absolute -top-3 left-6 bg-brand-orange text-white text-[10px] px-3 py-1 rounded-full font-black shadow-sm border-2 border-white">
                              さいごに あそんだよ
                          </div>
                      )}
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className={`shrink-0 p-3 rounded-2xl ${
                            isLast ? 'bg-brand-orange text-white' : 'bg-brand-blue/10 text-brand-blue'
                        }`}>
                          <User size={20} />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-xl font-black text-gray-700 truncate">{name}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold">
                            <Star size={12} className="fill-brand-yellow text-brand-yellow shrink-0"/>
                            <span>{totalMastered}もん できたよ</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-300 shrink-0" />
                    </button>
                  );
              })}
            </div>
          )}
          
          <div className="pt-2">
              {!isCreating ? (
                  <button
                      onClick={() => setIsCreating(true)}
                      className="w-full relative bg-white p-5 rounded-[2.5rem] flex items-center justify-center gap-3 text-brand-green font-black hover:bg-brand-green/5 transition active:scale-95 shadow-md text-xl animate-highlight-pulse h-20"
                  >
                      <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-[2.5rem]">
                        <rect 
                          x="2" y="2" 
                          width="calc(100% - 4px)" 
                          height="calc(100% - 4px)" 
                          rx="40" 
                          fill="none" 
                          stroke="#6BCB77" 
                          strokeWidth="4" 
                          strokeDasharray="16 16"
                          className="animate-dash-move"
                        />
                      </svg>
                      <Plus size={28} strokeWidth={3} className="relative z-10" />
                      <span className="relative z-10">あたらしく つくる</span>
                  </button>
              ) : (
                  <div className="bg-white p-6 rounded-[2.5rem] border-4 border-brand-green shadow-xl animate-fade-in">
                      <p className="text-base text-brand-green font-black mb-4 text-center">おなまえ を いれてね</p>
                      <div className="flex gap-3">
                          <input 
                              autoFocus
                              type="text" 
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="れい：たろう"
                              className="flex-1 min-w-0 bg-gray-100 rounded-2xl px-5 py-4 font-black text-2xl outline-none focus:ring-4 focus:ring-brand-green/20 text-gray-700 text-center"
                              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                          />
                          <button 
                              onClick={handleCreate}
                              disabled={!newName.trim()}
                              className="shrink-0 bg-brand-green text-white px-6 rounded-2xl font-black text-xl shadow-[0_6px_0_#38a169] active:shadow-none active:translate-y-[6px] transition"
                          >
                              OK
                          </button>
                      </div>
                      <button 
                          onClick={() => setIsCreating(false)} 
                          className="w-full text-center text-xs text-gray-400 mt-4 font-bold py-2 underline decoration-gray-300 underline-offset-4"
                      >
                          やめる
                      </button>
                  </div>
              )}
          </div>

          {/* Footer Explanation Section */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border-2 border-brand-yellow/30 text-left w-full mt-4">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="text-brand-yellow fill-brand-yellow" size={20} />
              <h3 className="font-black text-brand-orange text-base leading-tight">
                ピカピカ がくしゅう で できること
              </h3>
            </div>
            
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-brand-green shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
                  <span className="text-brand-green font-black underline decoration-brand-green/20 underline-offset-4">「あってるかな？」が すぐ わかる！</span><br/>
                  AI（えーあい）が そのばで まるつけ。
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-brand-green shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
                  <span className="text-brand-green font-black underline decoration-brand-green/20 underline-offset-4">ニガテ を おぼえてくれる AI（えーあい）</span><br/>
                  まちがえた かんじ を あとで ふくしゅう できます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSelectScreen;
