import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { retireLegacyServiceWorkers } from './services/legacyWorkerCleanup';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

async function startApp() {
  if (await retireLegacyServiceWorkers()) return;
  const root = ReactDOM.createRoot(rootElement!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
}
void startApp();
