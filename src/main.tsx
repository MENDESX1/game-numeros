import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { IndexedDBBridge } from './storage/db.ts';

async function init() {
  await IndexedDBBridge.loadAllToLocalStorage();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

init();


