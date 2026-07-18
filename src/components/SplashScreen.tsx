import React, { useState, useEffect } from 'react';
import { Target, Sparkles, HelpCircle, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
  language: 'pt' | 'en' | 'es';
  themeStyles: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, language, themeStyles }) => {
  const [progress, setProgress] = useState(0);
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    // Elegant, accelerated logarithmic organic loader simulation (takes ~800ms to complete beautifully)
    let startTime = Date.now();
    const duration = 850; // milliseconds total

    const updateLoader = () => {
      const elapsed = Date.now() - startTime;
      const ratio = Math.min(1, elapsed / duration);
      
      // Organic ease-out cubic curve for progress bar
      const easeOutCubic = 1 - Math.pow(1 - ratio, 3);
      const currentProgress = Math.floor(easeOutCubic * 100);

      setProgress(currentProgress);

      if (ratio < 1) {
        requestAnimationFrame(updateLoader);
      } else {
        setProgress(100);
        setTimeout(() => setLoadingComplete(true), 150);
      }
    };

    const animFrame = requestAnimationFrame(updateLoader);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const titles = {
    pt: { 
      subtitle: 'Logic Master & Combinações', 
      start: 'Iniciar Jornada', 
      loading: 'Ajustando Conexões...',
      skip: 'Pular Carregamento',
      tip: 'Foco & Harmonia Mental',
      ready: 'Pronto para Jogar'
    },
    en: { 
      subtitle: 'Logic Master & Number Match', 
      start: 'Begin Journey', 
      loading: 'Aligning Connections...',
      skip: 'Skip Loading',
      tip: 'Focus & Mental Harmony',
      ready: 'Ready to Play'
    },
    es: { 
      subtitle: 'Logic Master y Combinaciones', 
      start: 'Iniciar Viaje', 
      loading: 'Ajustando Conexiones...',
      skip: 'Saltar Carga',
      tip: 'Enfoque y Armonía Mental',
      ready: 'Listo para Jugar'
    }
  };

  const t = titles[language] || titles.en;

  // Render a list of 5 elegant ambient particle points
  const particles = Array.from({ length: 8 });

  return (
    <div
      id="splash-screen"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 sm:p-12 select-none overflow-hidden ${themeStyles.bg}`}
    >
      {/* Background ambient light effects & particle stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.06, 0.1, 0.06],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" 
          style={{ backgroundColor: themeStyles.accentColor }} 
        />
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.04, 0.08, 0.04],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px]" 
          style={{ backgroundColor: themeStyles.accentColor }} 
        />

        {/* Dynamic slow floating particles */}
        {particles.map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 50,
              opacity: Math.random() * 0.4 + 0.1,
              scale: Math.random() * 0.6 + 0.4
            }}
            animate={{
              y: -100,
              x: `calc(100vw * ${Math.random()} + ${Math.sin(i) * 30}px)`
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              ease: "linear",
              delay: i * 1.5
            }}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{ backgroundColor: themeStyles.accentColor }}
          />
        ))}
      </div>

      {/* Top minimalistic header row */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="w-full flex justify-between items-center z-10"
      >
        <div className="flex items-center gap-1.5 text-[9px] font-mono opacity-50 uppercase tracking-widest">
          <Zap className="w-3.5 h-3.5" style={{ color: themeStyles.accentColor }} />
          <span>V2.4 Premium</span>
        </div>
        
        {/* Skip loading option for high-end feel */}
        {!loadingComplete && (
          <button
            onClick={onComplete}
            className="flex items-center gap-1 text-[10px] font-mono opacity-60 hover:opacity-100 transition-all uppercase tracking-widest cursor-pointer px-3 py-1.5 rounded-full border border-current/10 bg-current/[0.02]"
          >
            <span>{t.skip}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </motion.div>

      {/* Main Branding Block */}
      <div className="flex flex-col items-center text-center gap-6 my-auto z-10 max-w-sm">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.2
          }}
          className={`relative p-8 rounded-[2.5rem] border shadow-2xl group ${themeStyles.cardBg}`}
        >
          {/* Subtle spinning glowing outer border ring */}
          <div className="absolute inset-0 rounded-[2.5rem] border border-dashed border-current/10 animate-spin-slow pointer-events-none scale-105" />
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
            <Target className="w-16 h-16" style={{ color: themeStyles.accentColor }} />
          </motion.div>

          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1.5 -right-1.5 p-1 rounded-full border border-current/10 shadow-md"
            style={{ backgroundColor: themeStyles.accentColor, color: '#fff' }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
        </motion.div>

        <div className="flex flex-col gap-2">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-5xl font-black tracking-[0.12em] uppercase leading-none"
          >
            Logic<span style={{ color: themeStyles.accentColor }}>Match</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-[11px] uppercase tracking-[0.25em] font-bold"
          >
            {t.subtitle}
          </motion.p>
        </div>
      </div>

      {/* Bottom Loading / Entrance Block */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full max-w-xs flex flex-col items-center gap-5 z-10"
      >
        <AnimatePresence mode="wait">
          {!loadingComplete ? (
            <motion.div 
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col gap-2.5"
            >
              <div className="flex justify-between items-center text-[10px] font-mono tracking-widest opacity-60 uppercase">
                <span className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  {t.loading}
                </span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-current/5 rounded-full overflow-hidden p-[2px] border border-current/5">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.1 }}
                  style={{ backgroundColor: themeStyles.accentColor }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="button-state"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-full"
            >
              <button
                id="splash-start-btn"
                onClick={onComplete}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs transition-all cursor-pointer shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] ${themeStyles.primaryBtn}`}
              >
                {t.start}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-1.5 text-[10px] font-mono opacity-50 uppercase tracking-widest mt-1">
          <HelpCircle className="w-4 h-4" />
          <span>{t.tip}</span>
        </div>
      </motion.div>
    </div>
  );
};

