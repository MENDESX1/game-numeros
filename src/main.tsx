import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { IndexedDBBridge } from './storage/db.ts';

async function init() {
  try {
    // Attempt to load from IndexedDB with a 150ms timeout.
    // If it takes longer or fails (e.g. in sandboxed iframes or private tabs),
    // we proceed immediately so the user never gets stuck on a white screen.
    await Promise.race([
      IndexedDBBridge.loadAllToLocalStorage(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('IndexedDB timeout')), 150))
    ]);
  } catch (e) {
    console.warn('Non-blocking IndexedDB load completed with fallback:', e);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

init();


