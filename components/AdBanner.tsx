
import React, { useEffect, useRef } from 'react';

const AdBanner: React.FC = () => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // 要素がない、または既に広告が入っている場合は何もしない
    if (!adRef.current || adRef.current.innerHTML !== "") return;

    try {
      // window.adsbygoogle が存在するか確認し、なければ初期化
      // @ts-ignore
      const ads = window.adsbygoogle = window.adsbygoogle || [];
      ads.push({});
    } catch (e) {
      // エラーが発生してもアプリを落とさない
      console.debug('AdSense load error:', e);
    }
  }, []);

  return (
    <div className="w-full flex justify-center items-center overflow-hidden shrink-0 min-h-[60px] bg-brand-cream">
      <div className="relative w-full px-2 py-1 bg-brand-cream text-center">
        {/* 
          ユーザー指定の広告ユニット: 
          slot: 2216718696
          format: autorelaxed
        */}
        <ins ref={adRef}
             className="adsbygoogle"
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
