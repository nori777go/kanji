
import React from 'react';

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
}> = ({ rightAction, leftAction, onLogoClick }) => (
  <div className="w-full bg-white px-4 pb-3 shadow-sm z-30 flex items-center justify-between ios-padding-top">
    <div className="flex-1 flex justify-start">
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
    <div className="flex-1 flex justify-end">
      {rightAction}
    </div>
  </div>
);
