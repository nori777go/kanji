import React, { useEffect, useRef } from 'react';

const AdBanner: React.FC = () => {
  const adPushedRef = useRef(false);

  useEffect(() => {
    // 広告初期化は1度だけ実行し、Reactアンマウント/再マウント時の重複やDOM削除エラーを防止
    if (adPushedRef.current) return;
    adPushedRef.current = true;

    try {
      // @ts-ignore: Google AdSense の初期化
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.debug('AdSense 広告の読み込み待機中、またはブロックされました');
    }
  }, []);

  return (
    <div 
      className="w-full flex justify-center items-center overflow-hidden shrink-0 min-h-[55px] bg-brand-cream select-none"
    >
      <div className="relative w-full flex justify-center py-1 bg-brand-cream">
        <ins 
          className="adsbygoogle"
          style={{ display: 'inline-block', width: '320px', height: '50px' }}
          data-ad-client="ca-pub-3688954659030805"
          data-ad-slot="YOUR_AD_SLOT_ID"
          data-ad-format="horizontal"
          data-full-width-responsive="false"
        />
        <span className="absolute text-[8px] text-gray-300 pointer-events-none -top-1 left-2 uppercase font-bold tracking-widest bg-brand-cream px-1">
          AD
        </span>
      </div>
    </div>
  );
};

export default React.memo(AdBanner);