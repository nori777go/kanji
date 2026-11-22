import { generateGeminiContent, GeminiConnectionError, diagnoseGeminiRoute } from "./geminiClient";

const STORAGE_KEY = 'pikapika_gemini_api_key';

// Google AI Studioの旧形式・新形式のキーに対応する。
const getEnvApiKey = (): string | null => {
  const envKey = typeof process === 'undefined' ? '' : (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
  // 接頭辞だけでは有効性は判定しない。接続テストで確認する。
  if (envKey && /^(AIza|AQ\.)/.test(envKey)) {
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
    const response = await generateGeminiContent(keyToTest, 'Say OK in one word');

    if (response.text) {
      return { success: true, message: 'Google AI Studioとの接続に成功しました！🎉' };
    }
    return { success: false, message: '応答を受信できませんでした。' };
  } catch (err: any) {
    if (err instanceof GeminiConnectionError && err.status === 405) {
      const control = await diagnoseGeminiRoute();
      return {success:false,message:`${err.message} / ${control}`};
    }
    return { success: false, message: err instanceof Error ? err.message : 'AIへの通信を完了できませんでした。' };
  }
};
