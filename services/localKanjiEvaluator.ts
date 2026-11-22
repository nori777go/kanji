import { DrawingResult } from '../types';

const SUCCESS_FEEDBACKS = [
  "とても じょうずにかけているよ！💮",
  "かっこよく かけたね！そのちょうし！✨",
  "はなまる！ていねいに かけたね！💮",
  "すばらしい！よくがんばったね！🎉",
  "きれいな かたちで かけたね！💮",
  "ばっちり！つぎの かんじも いってみよう！🌟"
];

const getRandomSuccess = (): string => {
  return SUCCESS_FEEDBACKS[Math.floor(Math.random() * SUCCESS_FEEDBACKS.length)];
};

/**
 * クライアントサイドでの手書き漢字の構造・画数・形状解析
 */
export const evaluateKanjiLocally = async (
  base64Image: string,
  targetKanji: string
): Promise<DrawingResult> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve({
        isCorrect: true,
        feedback: getRandomSuccess(),
        confidence: 80,
        evaluatedBy: 'local'
      });
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const GRID_SIZE = 16;
        const CELL_W = 300 / GRID_SIZE;
        const CELL_H = 300 / GRID_SIZE;

        // 1. ユーザーの手書きキャンバスを描画
        const userCanvas = document.createElement('canvas');
        userCanvas.width = 300;
        userCanvas.height = 300;
        const uCtx = userCanvas.getContext('2d');
        if (!uCtx) {
          resolve({ isCorrect: true, feedback: getRandomSuccess(), confidence: 80, evaluatedBy: 'local' });
          return;
        }
        uCtx.drawImage(img, 0, 0, 300, 300);
        const userData = uCtx.getImageData(0, 0, 300, 300).data;

        // 2. お手本の正解漢字をオフスクリーンキャンバスに描画
        const targetCanvas = document.createElement('canvas');
        targetCanvas.width = 300;
        targetCanvas.height = 300;
        const tCtx = targetCanvas.getContext('2d');
        if (!tCtx) {
          resolve({ isCorrect: true, feedback: getRandomSuccess(), confidence: 80, evaluatedBy: 'local' });
          return;
        }
        tCtx.fillStyle = '#FFFFFF';
        tCtx.fillRect(0, 0, 300, 300);
        tCtx.fillStyle = '#000000';
        tCtx.textAlign = 'center';
        tCtx.textBaseline = 'middle';
        // 太字の明瞭なフォントでお手本を描画
        tCtx.font = 'bold 210px "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif';
        tCtx.fillText(targetKanji, 150, 150);
        const targetData = tCtx.getImageData(0, 0, 300, 300).data;

        // 3. 16x16 グリッドにダウンサンプリングしてストローク分布を計算
        const userGrid: number[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));
        const targetGrid: number[][] = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));

        let userTotalDarkPixels = 0;
        let targetTotalDarkPixels = 0;

        for (let y = 0; y < 300; y++) {
          const gridY = Math.min(GRID_SIZE - 1, Math.floor(y / CELL_H));
          for (let x = 0; x < 300; x++) {
            const gridX = Math.min(GRID_SIZE - 1, Math.floor(x / CELL_W));
            const idx = (y * 300 + x) * 4;

            // ユーザー描画 (白背景に黒い線)
            const uR = userData[idx];
            const uG = userData[idx + 1];
            const uB = userData[idx + 2];
            const uA = userData[idx + 3];
            if (uA > 50 && (uR < 200 || uG < 200 || uB < 200)) {
              userGrid[gridY][gridX]++;
              userTotalDarkPixels++;
            }

            // お手本漢字
            const tR = targetData[idx];
            const tG = targetData[idx + 1];
            const tB = targetData[idx + 2];
            const tA = targetData[idx + 3];
            if (tA > 50 && (tR < 200 || tG < 200 || tB < 200)) {
              targetGrid[gridY][gridX]++;
              targetTotalDarkPixels++;
            }
          }
        }

        // 4. 白紙チェック
        if (userTotalDarkPixels < 80) {
          resolve({
            isCorrect: false,
            feedback: "まだ なにも かいてないよ！かんじを かいてみてね！",
            confidence: 0,
            evaluatedBy: 'local'
          });
          return;
        }

        // 各セルで有意な線があるかの2値化 (グリッドセル内に一定数以上の黒ピクセル)
        const userActive: boolean[][] = Array(GRID_SIZE).fill(false).map(() => Array(GRID_SIZE).fill(false));
        const targetActive: boolean[][] = Array(GRID_SIZE).fill(false).map(() => Array(GRID_SIZE).fill(false));

        let userActiveCells = 0;
        let targetActiveCells = 0;

        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (userGrid[r][c] >= 10) {
              userActive[r][c] = true;
              userActiveCells++;
            }
            if (targetGrid[r][c] >= 10) {
              targetActive[r][c] = true;
              targetActiveCells++;
            }
          }
        }

        // 5. 線が少なすぎるチェック（例: 草などの漢字に対して線1本だけ）
        // お手本の総セル数に対して、描画されたセル数が極端に少ない場合
        const minExpectedRatio = targetActiveCells > 60 ? 0.35 : 0.28;
        if (userActiveCells < Math.max(6, targetActiveCells * minExpectedRatio)) {
          resolve({
            isCorrect: false,
            feedback: `まだ かきたりないよ！「${targetKanji}」を さいごまで かいてみよう！`,
            confidence: 25,
            evaluatedBy: 'local'
          });
          return;
        }

        // 6. 塗りつぶし・落書きチェック（画面全体が黒く塗りつぶされている場合）
        if (userActiveCells > targetActiveCells * 2.8 && userActiveCells > 160) {
          resolve({
            isCorrect: false,
            feedback: "くろく ぬりすぎちゃったかな？ もういちど ていねいに かいてみよう！",
            confidence: 20,
            evaluatedBy: 'local'
          });
          return;
        }

        // 7. 4分割ゾーン（四分象限）チェック
        // 左上、右上、左下、右下のうち、お手本にしっかり線がある領域がごっそり抜けていないか
        const half = GRID_SIZE / 2;
        const quadrants = [
          { name: '左上', rStart: 0, rEnd: half, cStart: 0, cEnd: half },
          { name: '右上', rStart: 0, rEnd: half, cStart: half, cEnd: GRID_SIZE },
          { name: '左下', rStart: half, rEnd: GRID_SIZE, cStart: 0, cEnd: half },
          { name: '右下', rStart: half, rEnd: GRID_SIZE, cStart: half, cEnd: GRID_SIZE },
        ];

        let missingMajorQuadrant = false;
        for (const q of quadrants) {
          let tCount = 0;
          let uCount = 0;
          for (let r = q.rStart; r < q.rEnd; r++) {
            for (let c = q.cStart; c < q.cEnd; c++) {
              if (targetActive[r][c]) tCount++;
              if (userActive[r][c]) uCount++;
            }
          }
          // お手本が全体の15%以上を占めている重要な象限なのに、ユーザーが全く書いていない（1セル以下）
          if (tCount >= targetActiveCells * 0.16 && uCount <= 1) {
            missingMajorQuadrant = true;
            break;
          }
        }

        if (missingMajorQuadrant) {
          resolve({
            isCorrect: false,
            feedback: `おしい！「${targetKanji}」の かたちを よくみて、たりないところを かいてみよう！`,
            confidence: 35,
            evaluatedBy: 'local'
          });
          return;
        }

        // 8. 空間的一致度（近傍膨張による位置マッチング計算）
        // 子供の手書きは少しズレたり歪んだりするため、近傍1マス（周囲8方向）のズレを許容
        const isNearTarget = (r: number, c: number): boolean => {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                if (targetActive[nr][nc]) return true;
              }
            }
          }
          return false;
        };

        const isNearUser = (r: number, c: number): boolean => {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                if (userActive[nr][nc]) return true;
              }
            }
          }
          return false;
        };

        // ユーザーが描いた線がお手本の近くにある割合（適合率）
        let userHits = 0;
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (userActive[r][c] && isNearTarget(r, c)) {
              userHits++;
            }
          }
        }
        const precision = userActiveCells > 0 ? userHits / userActiveCells : 0;

        // お手本のストロークをどれだけ網羅できているか（再現率）
        let targetCovered = 0;
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (targetActive[r][c] && isNearUser(r, c)) {
              targetCovered++;
            }
          }
        }
        const coverage = targetActiveCells > 0 ? targetCovered / targetActiveCells : 0;

        // 総合スコア（網羅度をやや重視）
        const score = (coverage * 0.6) + (precision * 0.4);

        // 判定基準（小学生の手書きを優しく判定しつつ、全く違う文字や欠損はしっかり不合格に）
        const isPass = score >= 0.42 && coverage >= 0.38;

        if (isPass) {
          resolve({
            isCorrect: true,
            feedback: getRandomSuccess(),
            confidence: Math.round(score * 100),
            evaluatedBy: 'local'
          });
        } else {
          resolve({
            isCorrect: false,
            feedback: `おしい！「${targetKanji}」の かたちを よくみて もういちど かいてみよう！`,
            confidence: Math.round(score * 100),
            evaluatedBy: 'local'
          });
        }

      } catch (err) {
        console.error("Local kanji evaluation error:", err);
        resolve({
          isCorrect: true,
          feedback: getRandomSuccess(),
          confidence: 70,
          evaluatedBy: 'local'
        });
      }
    };

    img.onerror = () => {
      resolve({
        isCorrect: false,
        feedback: "がぞうが よみこめませんでした。もういちど かいてみてね！",
        confidence: 0,
        evaluatedBy: 'local'
      });
    };

    img.src = base64Image;
  });
};
