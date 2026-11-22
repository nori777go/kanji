import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'pikapika_gemini_api_key';

// 環境変数のキー（AIzaSy... のような有効なGoogle AI Studioキーのみ受け入れる）
const getEnvApiKey = (): string | null => {
  const envKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
  // AQ. などの内部OAuthトークンや短すぎる文字列は除外
  if (envKey && envKey.startsWith('AIza')) {
    return envKey;
  }
  return null;
};

export const getStoredApiKey = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY)?.trim() || '';
};

export const getActiveApiKey = (): string => {
  const stored = getStoredApiKey();
  if (stored) return stored;
  return getEnvApiKey() || '';
};

export const setStoredApiKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  // カスタムイベントを発行して他コンポーネントに通知
  window.dispatchEvent(new Event('pikapika_api_key_changed'));
};

export const clearStoredApiKey = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('pikapika_api_key_changed'));
};

export const hasActiveApiKey = (): boolean => {
  return !!getActiveApiKey();
};

export const isKeyCustom = (): boolean => {
  return !!getStoredApiKey();
};

/**
 * Google AI Studio の APIキーを検証する
 */
export const testApiKey = async (testKey: string): Promise<{ success: boolean; message: string }> => {
  const keyToTest = testKey.trim();
  if (!keyToTest) {
    return { success: false, message: 'APIキーを入力してください。' };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: keyToTest,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: 'Say OK in one word'
    });

    if (response.text) {
      return { success: true, message: 'Google AI Studioとの接続に成功しました！🎉' };
    }
    return { success: false, message: '応答を受信できませんでした。' };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    if (errorMsg.includes('401') || errorMsg.includes('API key not valid')) {
      return { success: false, message: 'APIキーが無効です。Google AI Studioで作成した正しいキーをご確認ください。' };
    }
    if (errorMsg.includes('429')) {
      return { success: false, message: '利用制限（クォータ）に達しています。少し待ってから再度お試しください。' };
    }
    return { success: false, message: `接続エラー: ${errorMsg}` };
  }
};
