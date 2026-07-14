import React from 'react';
import { Play, RotateCcw, Home, Clock, AlertTriangle, X } from 'lucide-react';
import { SynthAudio } from '../audio/synth';

interface PauseModalProps {
  language: 'pt' | 'en' | 'es';
  soundEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  score: number;
  mode: string;
  themeStyles: any;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  language,
  soundEnabled,
  onResume,
  onRestart,
  onExit,
  score,
  mode,
  themeStyles
}) => {
  const translations = {
    pt: {
      paused: 'Jogo Pausado',
      resume: 'Retomar Jogo',
      restart: 'Reiniciar Partida',
      quit: 'Sair para o Menu',
      info: 'Seu progresso ativo na partida será perdido se você sair agora.',
      score: 'Pontos Atuais',
      mode: 'Modo'
    },
    en: {
      paused: 'Game Paused',
      resume: 'Resume Game',
      restart: 'Restart Level',
      quit: 'Exit to Menu',
      info: 'Your current match progress will be lost if you exit now.',
      score: 'Current Score',
      mode: 'Mode'
    },
    es: {
      paused: 'Juego Pausado',
      resume: 'Reanudar Juego',
      restart: 'Reiniciar Partida',
      quit: 'Salir al Menú',
      info: 'Tu progreso activo en la partida se perderá si sales ahora.',
      score: 'Puntos Actuales',
      mode: 'Modo'
    }
  };

  const t = translations[language] || translations.en;

  return (
    <div id="pause-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-6 relative animate-fadeIn ${themeStyles.cardBg}`}>
        {/* Close Button */}
        <button
          id="close-pause-btn"
          onClick={() => {
            SynthAudio.playClick(soundEnabled);
            onResume();
          }}
          className={`absolute top-4 right-4 p-2 rounded-full border transition-all ${themeStyles.secondaryBtn}`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className={`w-12 h-12 rounded-full bg-current/5 border border-current/15 flex items-center justify-center animate-pulse-subtle ${themeStyles.textPrimary}`}>
            <Clock className="w-6 h-6" />
          </div>
          <h3 id="pause-title" className={`text-xl font-serif italic text-center tracking-wider font-semibold ${themeStyles.textPrimary}`}>
            {t.paused}
          </h3>
        </div>

        {/* Current game stats summary */}
        <div className={`flex justify-around items-center p-3 rounded-xl border ${themeStyles.itemBg}`}>
          <div className="flex flex-col items-center">
            <span className={`text-[9px] uppercase tracking-widest font-semibold ${themeStyles.textSecondary}`}>{t.mode}</span>
            <span className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textPrimary}`}>{mode}</span>
          </div>
          <div className="w-px h-6 bg-current/15" />
          <div className="flex flex-col items-center">
            <span className={`text-[9px] uppercase tracking-widest font-semibold ${themeStyles.textSecondary}`}>{t.score}</span>
            <span className={`text-sm font-bold font-mono ${themeStyles.textPrimary}`}>{score.toLocaleString()}</span>
          </div>
        </div>

        {/* Warn Footer banner */}
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex gap-2.5 items-start text-left text-[11px] text-yellow-600 dark:text-yellow-400 leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t.info}</span>
        </div>

        {/* Main interactive actions buttons */}
        <div className="flex flex-col gap-2 w-full">
          <button
            id="pause-resume-btn"
            onClick={onResume}
            className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow transition-all ${themeStyles.primaryBtn}`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t.resume}</span>
          </button>

          <button
            id="pause-restart-btn"
            onClick={onRestart}
            className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${themeStyles.secondaryBtn}`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.restart}</span>
          </button>

          <button
            id="pause-quit-btn"
            onClick={onExit}
            className="py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-red-500/35 hover:bg-red-500/10 text-red-600 dark:text-red-400 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>{t.quit}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
