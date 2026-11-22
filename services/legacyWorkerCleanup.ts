/** 旧AI Studio公開で残ったAPI転送用Workerを、独自ドメインでのみ解除する。 */
export async function retireLegacyServiceWorkers(): Promise<boolean> {
  if (location.hostname !== 'kanji.sumi-innovation.com' || !('serviceWorker' in navigator)) return false;
  const marker = 'pikapika_legacy_worker_reload_v1';
  try {
    const workers = navigator.serviceWorker;
    const controlled = !!workers.controller;
    const registrations = await workers.getRegistrations();
    await Promise.all(registrations.filter(registration => {
      try { return new URL(registration.scope).origin === location.origin; }
      catch { return false; }
    }).map(registration => registration.unregister()));
    // 解除済みでも現在のページは旧Workerの制御下に残るため、一度だけ読み直す。
    if (controlled && sessionStorage.getItem(marker) !== '1') {
      sessionStorage.setItem(marker, '1');
      location.reload();
      return true;
    }
    if (!controlled) sessionStorage.removeItem(marker);
  } catch {
    // ブラウザが登録情報やsessionStorageを制限していてもアプリの起動は妨げない。
  }
  return false;
}
