import React, { StrictMode, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { IndexedDBBridge } from './storage/db.ts';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled React Error:", error, errorInfo);
  }

  handleReload = () => {
    try {
      safeLocalStorageClear();
    } catch (e) {
      console.warn("Could not clear storage:", e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-4 text-3xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Ops! Ocorreu um erro</h1>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            O jogo encontrou um problema ao carregar. Clique no botão abaixo para reiniciar.
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            Recarregar Jogo
          </button>
        </div>
      );
    }

    return (this.props as ErrorBoundaryProps).children;
  }
}

function safeLocalStorageClear() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  } catch (e) {
    console.warn("localStorage clear error:", e);
  }
}

async function init() {
  try {
    await Promise.race([
      IndexedDBBridge.loadAllToLocalStorage(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('IndexedDB timeout')), 150))
    ]);
  } catch (e) {
    console.warn('Non-blocking IndexedDB load fallback:', e);
  }

  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  }
}

init();
