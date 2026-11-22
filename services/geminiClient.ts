export const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiConnectionError extends Error {
  constructor(public status: number, public diagnostic: string = '') {
    super(status === 405 ? 'Google APIへの通信が拒否されました（405）。' + (diagnostic ? ` 診断: ${diagnostic}` : '')
      : status === 400 || status === 401 ? 'APIキーまたはリクエストを確認してください。'
      : status === 403 ? 'APIの利用権限・キーの利用制限を確認してください（403）。'
      : status === 404 ? '採点モデルを利用できません（404）。'
      : status === 429 ? 'APIの利用上限に達しています。時間をおいて再度お試しください。'
      : 'AIに接続できませんでした。通信状態を確認してください。');
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
      throw new GeminiConnectionError(response.status, `${destination} / ${format} / 接続版2`);
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
