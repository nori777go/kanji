import React, { useEffect, useRef, useMemo } from 'react';

interface FireworksEffectProps {
  /** 中心位置のY座標（画面縦の割合 %。デフォルトは42%） */
  originY?: number;
}

// 澄んだ花火カラーパレット
const HANABI_COLORS = [
  '#FFE600', // 黄金
  '#FFD93D', // 燦然イエロー
  '#FF8400', // 橙
  '#FF3366', // 紅赤
  '#FF69B4', // 撫子桃
  '#00E5FF', // 浅葱シアン
  '#4F95FF', // 碧青
  '#55EFC4', // 若草エメラルド
  '#FFFFFF', // 純白閃光
  '#E056FD', // 藤紫
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  swaySpeed: number;
  swayAmount: number;
  swayOffset: number;
  size: number;
  color: string;
  shape: 'star' | 'diamond' | 'circle';
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  flickerSpeed: number;
  flickerOffset: number;
  delayFrames: number;
}

export const FireworksEffect: React.FC<FireworksEffectProps> = ({ originY = 42 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 波紋リング（ユーザー様から「波紋はきれいでいいね」と高評価をいただいたため、CSS波紋演出を維持）
  const bursts = useMemo(() => [
    { x: 50, y: originY, delayBase: 0 },
    { x: 33, y: originY - 4, delayBase: 0.08 },
    { x: 67, y: originY - 2, delayBase: 0.14 },
  ], [originY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let isRunning = true;

    // Retinaディスプレイ対応
    const dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2);
    const width = Math.max(280, typeof window !== 'undefined' ? (window.innerWidth || 360) : 360);
    const height = Math.max(400, typeof window !== 'undefined' ? (window.innerHeight || 640) : 640);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 花火パーティクルの物理生成
    const particles: Particle[] = [];

    // 3箇所の開花点（メイン中央 + 左右の副花火）
    const burstConfigs = [
      { x: width * 0.50, y: height * (originY / 100), count: 52, delay: 0, power: 1.0 },
      { x: width * 0.33, y: height * ((originY - 4) / 100), count: 20, delay: 5, power: 0.8 },
      { x: width * 0.67, y: height * ((originY - 2) / 100), count: 20, delay: 9, power: 0.8 },
    ];

    burstConfigs.forEach(b => {
      for (let i = 0; i < b.count; i++) {
        // 全方位へ滑らかに分散する初期角度
        const angle = (Math.PI * 2 * (i / b.count)) + ((Math.random() - 0.5) * 0.3);
        // 初速（中心付近はゆっくり、外周へ向かって勢いよく広がる）
        const speed = (2.5 + Math.random() * 8.5) * b.power;

        const shapes: ('star' | 'diamond' | 'circle')[] = ['star', 'diamond', 'circle'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = HANABI_COLORS[Math.floor(Math.random() * HANABI_COLORS.length)];

        // サイズ設定
        const baseSize = shape === 'circle' 
          ? (Math.random() * 2.5 + 3) 
          : shape === 'diamond' 
            ? (Math.random() * 3 + 4.5) 
            : (Math.random() * 3.5 + 5.5);

        // 寿命：約1.3秒〜1.7秒 (75〜100フレーム)
        const maxLife = 75 + Math.floor(Math.random() * 28);

        particles.push({
          x: b.x,
          y: b.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.9, // 上方向へ少し伸びる自然な初速
          gravity: 0.11 + Math.random() * 0.05, // 滑らかな重力加速度
          drag: 0.962 + Math.random() * 0.008, // 流体空気抵抗（初速をふわりと減速）
          swaySpeed: 0.04 + Math.random() * 0.03, // 横揺れの周期
          swayAmount: 0.3 + Math.random() * 0.4, // 横揺れの振幅
          swayOffset: Math.random() * Math.PI * 2,
          size: baseSize,
          color,
          shape,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.06, // なめらかな連続回転
          life: maxLife,
          maxLife,
          flickerSpeed: 0.18 + Math.random() * 0.12,
          flickerOffset: Math.random() * 10,
          delayFrames: b.delay,
        });
      }
    });

    let frameCount = 0;

    const render = () => {
      if (!isRunning) return;

      try {
        frameCount++;
        ctx.clearRect(0, 0, width, height);

        let activeParticles = 0;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

        // 破裂遅延待ち
        if (p.delayFrames > 0) {
          p.delayFrames--;
          activeParticles++;
          continue;
        }

        if (p.life <= 0) continue;

        activeParticles++;

        // 1. 物理演算の更新（完全なニュートン力学と流体抵抗でカクつきのない滑らかな放物線）
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;

        // 終端落下速度の制御（石のように落ちず、紙吹雪・火花のようにふわりと漂う）
        if (p.vy > 2.8) {
          p.vy = 2.8;
        }

        // 自然な空気の横揺れ（サイン波）
        const sway = Math.sin(frameCount * p.swaySpeed + p.swayOffset) * p.swayAmount;

        p.x += p.vx + sway;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.life--;

        // 2. ライフに応じた滑らかなフェードとパラパラ瞬き（flicker）
        const progress = 1 - (p.life / p.maxLife); // 0 (開始) -> 1 (終了)
        
        // 基本アルファ：最初は1.0、後半から滑らかに0へと減衰
        let alpha = 1;
        if (progress > 0.45) {
          alpha = Math.max(0, 1 - (progress - 0.45) / 0.55);
        }

        // 花火がパラパラと瞬く微細な輝きの揺らぎ
        const twinkle = 0.82 + 0.18 * Math.sin(frameCount * p.flickerSpeed + p.flickerOffset);
        const finalAlpha = Math.max(0, Math.min(1, alpha * twinkle));

        // 終盤に向かって粒子が少し小さくなり、光の粉になって消える
        const scale = progress > 0.65 ? Math.max(0.1, 1 - (progress - 0.65) * 1.5) : 1;
        const currentSize = p.size * scale;

        if (finalAlpha <= 0.01 || currentSize <= 0.2) continue;

        // 3. 描画
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = p.color;

        // ほのかな発光シャドウ
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -currentSize);
          ctx.lineTo(currentSize * 0.7, 0);
          ctx.lineTo(0, currentSize);
          ctx.lineTo(-currentSize * 0.7, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // 四芒星 (star sparkle)
          const s = currentSize;
          const inner = s * 0.35;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(inner, -inner);
          ctx.lineTo(s, 0);
          ctx.lineTo(inner, inner);
          ctx.lineTo(0, s);
          ctx.lineTo(-inner, inner);
          ctx.lineTo(-s, 0);
          ctx.lineTo(-inner, -inner);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      // まだ活動中のパーティクルがあれば次フレームを描画
      if (activeParticles > 0) {
        animId = requestAnimationFrame(render);
      }
    } catch (e) {
      console.warn("FireworksEffect animation error ignored:", e);
    }
  };

    animId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [originY]);

  return (
    <div
      aria-hidden="true"
      data-testid="fireworks-overlay"
      className="fixed inset-0 pointer-events-none z-[120] overflow-hidden select-none"
      style={{ background: 'transparent' }}
    >
      {/* 好評をいただいた開花リング波紋（CSSアニメーション） */}
      {bursts.map((b, idx) => (
        <div
          key={`ring-${idx}`}
          className="hanabi-ring absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'transparent',
            left: `${b.x}%`,
            top: `${b.y}%`,
            animationDelay: `${b.delayBase}s`,
          }}
        />
      ))}

      {/* 60fps / 120fps の滑らかな流体物理演算で舞い散る花火キャンバス */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ background: 'transparent' }}
      />
    </div>
  );
};

export default FireworksEffect;
