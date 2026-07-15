import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker via vite-plugin-pwa
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('PWA: New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('PWA: App is ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

