declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const GA_MEASUREMENT_ID = 'G-JJ945XZR71';

/**
 * SPAの画面遷移時に page_view イベントを送信する
 */
export const trackPageView = (path: string, title?: string) => {
  if (typeof window === 'undefined') return;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const pageLocation = window.location.origin + normalizedPath;
  const pageTitle = title || document.title;

  // window.dataLayer と window.gtag を確実に確保
  // GTMスクリプトの読込完了前であっても、dataLayer にキューとして蓄積され、読込完了後に確実に送信されます
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () {
      window.dataLayer!.push(arguments);
    };
  }

  // アドレスバーのURLとタイトルをSPA画面と同期
  try {
    if (window.location.pathname !== normalizedPath) {
      window.history.replaceState(null, '', normalizedPath);
    }
    if (pageTitle) {
      document.title = pageTitle;
    }
  } catch {
    // iframe sandbox や history 制限環境へのフォールバック
  }

  // 1. GA4の設定パラメータ（ページパス・タイトル・ロケーション）を更新
  window.gtag('set', {
    page_path: normalizedPath,
    page_title: pageTitle,
    page_location: pageLocation,
  });

  // 2. page_view イベントを送信（send_to で測定IDを明示）
  window.gtag('event', 'page_view', {
    page_title: pageTitle,
    page_location: pageLocation,
    page_path: normalizedPath,
    send_to: GA_MEASUREMENT_ID,
  });

  console.log(`[GA4] page_view 送信完了: ${normalizedPath} (${pageTitle})`);
};
