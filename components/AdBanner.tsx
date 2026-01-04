import React, { useEffect } from 'react';

const AdBanner: React.FC = () => {
  useEffect(() => {
    try {
      // @ts-ignore: Google AdSense の初期化
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.debug('AdSense 広告の読み込み待ち、またはブロックされました');
    }
  }, []);

  return (
    <div 
      className="w-full flex justify-center items-center overflow-hidden shrink-0 min-h-[55px] bg-brand-cream"
    >
      <div className="relative w-full flex justify-center py-1 bg-brand-cream">
        {/* 
          特定の広告ユニットを表示するためのタグ。
          data-ad-client: ca-pub-3688954659030805
          data-ad-slot: AdSense管理画面で作成した「バナー広告」のIDを YOUR_AD_SLOT_ID に入力してください。
        */}
        <ins className="adsbygoogle"
             style={{ display: 'inline-block', width: '320px', height: '50px' }}
             data-ad-client="ca-pub-3688954659030805"
             data-ad-slot="YOUR_AD_SLOT_ID"
             data-ad-format="horizontal"
             data-full-width-responsive="false">
        </ins>
        
        <span className="absolute text-[8px] text-gray-300 pointer-events-none -top-1 left-2 uppercase font-bold tracking-widest bg-brand-cream px-1">AD</span>
      </div>
    </div>
  );
};

export default AdBanner;