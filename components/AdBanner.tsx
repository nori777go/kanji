
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
      className="w-full flex justify-center items-center overflow-hidden shrink-0 min-h-[60px] bg-brand-cream"
    >
      <div className="relative w-full px-2 py-1 bg-brand-cream">
        {/* 
          ユーザー指定の広告ユニット: 
          slot: 2216718696
          format: autorelaxed
        */}
        <ins className="adsbygoogle"
             style={{ display: 'block', minWidth: '250px' }}
             data-ad-client="ca-pub-3688954659030805"
             data-ad-slot="2216718696"
             data-ad-format="autorelaxed"
             data-full-width-responsive="true">
        </ins>
        
        <span className="absolute text-[8px] text-gray-300 pointer-events-none -top-1 left-4 uppercase font-bold tracking-widest bg-brand-cream px-1">AD</span>
      </div>
    </div>
  );
};

export default AdBanner;
