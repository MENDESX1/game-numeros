import React, { useState, useEffect } from 'react';
import { Target, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
  language: 'pt' | 'en' | 'es';
  themeStyles: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, language, themeStyles }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let startTime = Date.now();
    const duration = 750;

    const updateLoader = () => {
      const elapsed = Date.now() - startTime;
      const ratio = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - ratio, 3);
      const current = Math.floor(easeOut * 100);

      setProgress(current);

      if (ratio < 1) {
        requestAnimationFrame(updateLoader);
      } else {
        setProgress(100);
        setTimeout(() => setIsReady(true), 100);
      }
    };

    const animFrame = requestAnimationFrame(updateLoader);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const titles = {
    pt: {
      subtitle: 'Jogo de Lógica e Números',
      start: 'Entrar no Jogo',
      loading: 'Carregando...',
    },
    en: {
      subtitle: 'Logic & Number Puzzle',
      start: 'Start Game',
      loading: 'Loading...',
    },
    es: {
      subtitle: 'Juego de Lógica y Números',
      start: 'Iniciar Juego',
      loading: 'Cargando...',
    }
  };

  const t = titles[language] || titles.en;

  return (
    <div
      id="splash-screen"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between py-12 px-6 select-none overflow-hidden ${themeStyles.bg}`}
    >
      {/* Subtle Background Radial Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] opacity-15"
          style={{ backgroundColor: themeStyles.accentColor }}
        />
      </div>

      <div className="w-full max-w-sm flex justify-between items-center z-10 opacity-40 text-[10px] font-mono tracking-widest uppercase">
        <span>LogicMatch</span>
        <span>v2.4</span>
      </div>

      {/* Main Minimalist Brand Block */}
      <div className="flex flex-col items-center text-center gap-5 z-10 my-auto">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`w-20 h-20 rounded-2xl flex items-center justify-center border shadow-xl backdrop-blur-md ${themeStyles.cardBg}`}
          style={{ borderColor: `${themeStyles.accentColor}30` }}
        >
          <Target className="w-10 h-10" style={{ color: themeStyles.accentColor }} />
        </motion.div>

        <div className="flex flex-col items-center gap-1">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-4xl font-black tracking-tight uppercase"
          >
            Logic<span style={{ color: themeStyles.accentColor }}>Match</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="text-xs font-medium tracking-wide"
          >
            {t.subtitle}
          </motion.p>
        </div>
      </div>

      {/* Progress & Start Button Block */}
      <div className="w-full max-w-xs z-10 flex flex-col items-center gap-3">
        <AnimatePresence mode="wait">
          {!isReady ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col gap-2"
            >
              <div className="flex justify-between items-center text-[10px] font-mono opacity-50">
                <span>{t.loading}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-current/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.1 }}
                  style={{ backgroundColor: themeStyles.accentColor }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="start"
              id="splash-start-btn"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={onComplete}
              className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all active:scale-[0.98] ${themeStyles.primaryBtn}`}
            >
              <span>{t.start}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
