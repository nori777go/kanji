import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
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