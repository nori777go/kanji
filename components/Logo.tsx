import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { hasActiveApiKey } from '../services/apiKeyStorage';

export const PikaLogoIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <circle cx="50" cy="50" r="50" fill="#FFD93D" />
    <path 
      d="M50 15 C54 42 58 46 85 50 C58 54 54 58 50 85 C46 58 42 54 15 50 C42 46 46 42 50 15 Z" 
      fill="white" 
    />
  </svg>
);

export const GlobalHeader: React.FC<{ 
  rightAction?: React.ReactNode; 
  leftAction?: React.ReactNode;
  onLogoClick?: () => void;
  onAiSettingsClick?: () => void;
}> = ({ rightAction, leftAction, onLogoClick, onAiSettingsClick }) => {
  const [hasAiKey, setHasAiKey] = useState(false);

  useEffect(() => {
    const checkKey = () => setHasAiKey(hasActiveApiKey());
    checkKey();
    window.addEventListener('pikapika_api_key_changed', checkKey);
    return () => window.removeEventListener('pikapika_api_key_changed', checkKey);
  }, []);

  return (
    <div className="w-full bg-white px-4 py-3 shadow-sm z-30 flex items-center justify-between safe-top">
      <div className="flex-1 flex justify-start items-center gap-2">
        {leftAction}
      </div>
      <button 
        onClick={onLogoClick}
        disabled={!onLogoClick}
        className={`flex items-center gap-2 transition-transform active:scale-95 focus:outline-none ${onLogoClick ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <PikaLogoIcon size={30} />
        <h1 className="text-xl font-black text-brand-orange tracking-tighter">
          ぴかぴかかんじ
        </h1>
      </button>
      <div className="flex-1 flex justify-end items-center gap-1.5">
        {onAiSettingsClick && (
          <button
            onClick={onAiSettingsClick}
            title={hasAiKey ? "Google AI Studio 連携中" : "Google AI Studio 連携設定"}
            className={`px-2 py-1 rounded-full text-xs font-black flex items-center gap-1 transition active:scale-95 ${
              hasAiKey 
                ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Sparkles size={13} className={hasAiKey ? 'text-amber-600 fill-amber-500' : 'text-gray-400'} />
            <span>AI</span>
          </button>
        )}
        {rightAction}
      </div>
    </div>
  );
};
