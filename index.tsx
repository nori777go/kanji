
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  
  // マウント実行
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // 安全装置: 3秒たっても「読み込み中...」の要素が残っていたらエラーを出す
  // これにより「背景色のまま止まる」状態を回避し、ユーザーに再読み込みを促す
  setTimeout(() => {
    const loader = document.getElementById('initial-loader');
    if (loader) {
       console.error("App mount timeout");
       rootElement.innerHTML = `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; padding: 20px; text-align: center; color: #FF8400; font-family: sans-serif; background-color: #FFF5E4;">
          <h1 style="font-size: 24px; margin-bottom: 10px; font-weight: bold;">読み込みに 時間がかかっています</h1>
          <p>もういちど はじめから やりなおしてね</p>
          <button onclick="window.location.reload()" style="margin-top: 20px; padding: 15px 30px; background: #FFD93D; border: none; border-radius: 15px; font-weight: bold; color: #333; font-size: 18px; box-shadow: 0 4px 0 #e6c200; cursor: pointer;">
            再読み込み
          </button>
        </div>
       `;
    }
  }, 3000);

} catch (error) {
  console.error("Application crashed:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; color: #FF8400; font-family: sans-serif;">
      <h1>おっと！</h1>
      <p>アプリ を よみこめませんでした。</p>
      <p style="font-size: 10px; color: #999;">${String(error)}</p>
    </div>
  `;
}
