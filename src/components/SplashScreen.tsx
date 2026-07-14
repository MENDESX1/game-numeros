import React, { useState, useEffect } from 'react';
import { Target, Sparkles, HelpCircle } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  language: 'pt' | 'en' | 'es';
  themeStyles: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, language, themeStyles }) => {
  const [progress, setProgress] = useState(0);
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    // Animate loading progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLoadingComplete(true), 300);
          return 100;
        }
        // Random incremental steps for organic feel
        const inc = Math.floor(Math.random() * 15) + 8;
        return Math.min(100, prev + inc);
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  const titles = {
    pt: { subtitle: 'Logic Master & Combinações', start: 'Tocar para Iniciar', loading: 'Sintonizando Tabuleiro...' },
    en: { subtitle: 'Logic Master & Number Match', start: 'Tap to Enter', loading: 'Tuning Board...' },
    es: { subtitle: 'Logic Master y Combinaciones', start: 'Tocar para Iniciar', loading: 'Ajustando Tablero...' }
  };

  const t = titles[language] || titles.en;

  return (
    <div
      id="splash-screen"
      onClick={loadingComplete ? onComplete : undefined}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-8 select-none transition-all duration-700 ${
        loadingComplete ? 'cursor-pointer hover:opacity-95' : ''
      } ${themeStyles.bg}`}
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[120px] pointer-events-none animate-pulse-subtle" style={{ backgroundColor: themeStyles.accentColor }} />

      {/* Main Branding Block */}
      <div className="flex flex-col items-center text-center gap-4 animate-fadeIn my-auto">
        <div className={`relative p-6 rounded-3xl border shadow-[0_0_30px_rgba(255,255,255,0.02)] mb-2 group ${themeStyles.cardBg}`}>
          <Target className="w-14 h-14 animate-spin-slow" style={{ color: themeStyles.accentColor }} />
          <Sparkles className="w-5 h-5 absolute -top-1 -right-1 animate-pulse" style={{ color: themeStyles.accentColor }} />
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-5xl font-serif tracking-[0.1em] uppercase font-black select-none">
            LogicMatch
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] opacity-60 font-medium">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Bottom Loading / Entrance Block */}
      <div className="w-full max-w-xs flex flex-col items-center gap-4 mb-4">
        {!loadingComplete ? (
          <div className="w-full flex flex-col gap-2 animate-pulse">
            <div className="flex justify-between items-center text-[10px] font-mono tracking-widest opacity-60 uppercase">
              <span>{t.loading}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1 bg-current/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{ width: `${progress}%`, backgroundColor: themeStyles.accentColor }}
              />
            </div>
          </div>
        ) : (
          <button
            id="splash-start-btn"
            onClick={onComplete}
            className={`w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs transition-all cursor-pointer shadow-lg ${themeStyles.primaryBtn}`}
          >
            {t.start}
          </button>
        )}

        <div className="flex items-center gap-1.5 text-[9px] font-mono opacity-55 uppercase tracking-widest mt-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Foco & Harmonia Mental</span>
        </div>
      </div>
    </div>
  );
};
