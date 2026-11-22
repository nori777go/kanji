export const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiConnectionError extends Error {
  constructor(public status: number, public diagnostic: string = '') {
    const description = status === 405 ? 'Google APIへの通信が拒否されました。'
      : status === 400 || status === 401 ? 'APIキーまたはリクエストを確認してください。'
      : status === 403 ? 'APIの利用権限・キーの利用制限を確認してください。'
      : status === 404 ? '採点モデルを利用できません。'
      : status === 429 ? 'APIの利用上限に達しています。'
      : status >= 500 ? '通信先でエラーが発生しています。'
      : 'AIへの通信を完了できませんでした。';
    super(`${description}（HTTP ${status}）${diagnostic ? ` 診断: ${diagnostic}` : ''}`);
  }
}

export async function generateGeminiContent(apiKey: string, contents: string | {parts: unknown[]}, config?: Record<string, unknown>): Promise<{text: string}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_ROOT}/models/${GEMINI_MODEL}:generateContent`, {
      method:'POST', mode:'cors', credentials:'omit', redirect:'error',
      headers:{'Content-Type':'application/json', 'x-goog-api-key':apiKey},
      body:JSON.stringify({contents:[typeof contents === 'string' ? {parts:[{text:contents}]} : contents],generationConfig:config}),
      signal:controller.signal,
    });
    if (!response.ok) {
      let destination = '不明';
      try {
        const address = new URL(response.url);
        destination = address.origin === 'https://generativelanguage.googleapis.com' ? 'Google API'
          : typeof location !== 'undefined' && address.origin === location.origin ? '公開アプリ自身' : '別の通信先';
      } catch { /* URLやクエリを表示しない */ }
      const mime = response.headers?.get('content-type') || '';
      const format = mime.includes('json') ? 'JSON' : mime.includes('html') ? 'HTML' : 'その他';
      const allowedCodes = new Set(['INVALID_ARGUMENT', 'UNAUTHENTICATED', 'PERMISSION_DENIED', 'NOT_FOUND', 'RESOURCE_EXHAUSTED', 'INTERNAL', 'UNAVAILABLE', 'DEADLINE_EXCEEDED', 'FAILED_PRECONDITION', 'API_KEY_INVALID', 'ACCESS_TOKEN_TYPE_UNSUPPORTED', 'API_KEY_SERVICE_BLOCKED', 'API_KEY_HTTP_REFERRER_BLOCKED', 'API_KEY_IP_ADDRESS_BLOCKED', 'API_KEY_API_TARGET_BLOCKED', 'API_KEY_EXPIRED', 'SERVICE_DISABLED', 'CONSUMER_INVALID', 'BILLING_DISABLED', 'RATE_LIMIT_EXCEEDED']);
      let codes: string[] = [];
      if (mime.includes('json')) {
        try {
          const body = await response.json();
          const candidates = [body?.error?.status, ...(Array.isArray(body?.error?.details) ? body.error.details.map((detail: {reason?:unknown}) => detail?.reason) : [])];
          codes = [...new Set(candidates.filter((code): code is string => typeof code === 'string' && allowedCodes.has(code)))];
        } catch { /* エラー本文や任意のメッセージ・認証情報は表示しない */ }
      }
      throw new GeminiConnectionError(response.status, `${destination} / ${format} / 接続版4 / ${typeof navigator !== 'undefined' && navigator.serviceWorker?.controller ? '旧通信制御あり' : '旧通信制御なし'}${codes.length ? ' / ' + codes.join(', ') : ''}`);
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.filter((p:{text?:string;thought?:boolean}) => !p.thought && typeof p.text === 'string').map((p:{text:string}) => p.text).join('') || '';
    if (!text) throw new Error('Empty response');
    return {text};
  } catch (error) {
    if (error instanceof GeminiConnectionError) throw error;
    throw new Error('AIから採点結果を受信できませんでした。通信状態を確認して、もういちどお試しください。');
  } finally {clearTimeout(timer);}
}

/** 405時のみ、秘密値を一切使わない対照リクエストで通信経路を調べる。 */
export async function diagnoseGeminiRoute(): Promise<string> {
  try {
    await generateGeminiContent('AQ.diagnostic-invalid-key', 'OK');
    return '対照通信200';
  } catch (error) {
    return error instanceof GeminiConnectionError ? `対照通信${error.status}` : '対照通信不可';
  }
}
