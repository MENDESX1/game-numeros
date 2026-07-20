import React from 'react';
import { GameConfig, ChallengeLevel } from '../types';
import { TRANSLATIONS } from '../config/gameConfig';
import { 
  Trophy, 
  Target, 
  Clock, 
  Heart, 
  Compass, 
  Zap, 
  Flame, 
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Award
} from 'lucide-react';

interface InfoPanelProps {
  mode: 'classic' | 'relax' | 'timed' | 'challenge' | 'survival' | 'frozen' | 'bombs' | 'locks' | 'infinite';
  levelId: number | null;
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  combo: number;
  maxComboInLevel: number;
  clearedIce: number;
  clearedLocks: number;
  clearedBombs: number;
  clearedNumbersCount: number;
  movesLeft?: number;
  timeLeft?: number;
  survivalTick?: number;
  themeStyles: any;
  config: GameConfig;
  hintsUsed: number;
  linesAddedCount: number;
  challengeLevels: ChallengeLevel[];
  currentLevelUnlocked?: number;
  onSelectLevel?: (levelId: number) => void;
  levelPairsMatched?: number;
  levelSumTenMatched?: number;
  cells?: any[];
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  mode,
  levelId,
  score,
  highScore,
  lives,
  maxLives,
  combo,
  maxComboInLevel,
  clearedIce,
  clearedLocks,
  clearedBombs,
  clearedNumbersCount,
  movesLeft,
  timeLeft,
  survivalTick,
  themeStyles,
  config,
  hintsUsed,
  linesAddedCount,
  challengeLevels,
  currentLevelUnlocked,
  onSelectLevel,
  levelPairsMatched = 0,
  levelSumTenMatched = 0,
  cells = []
}) => {
  const t = TRANSLATIONS[config.language];
  
  // Local translations helper
  const getLabel = (key: string) => {
    const labels: Record<string, Record<string, string>> = {
      objective: { pt: 'Objetivo', es: 'Objetivo', en: 'Objective' },
      progress: { pt: 'Progresso', es: 'Progreso', en: 'Progress' },
      target_met: { pt: 'Alcançado!', es: '¡Alcanzado!', en: 'Reached!' },
      record_beaten: { pt: 'Recorde batido!', es: '¡Record superado!', en: 'Record broken!' },
      moves_left: { pt: 'Jogadas Restantes', es: 'Movimientos Restantes', en: 'Moves Left' },
      next_line: { pt: 'Próxima Linha', es: 'Siguiente Línea', en: 'Next Line' },
      best: { pt: 'Melhor', es: 'Mejor', en: 'Best' },
      level: { pt: 'Fase', es: 'Nivel', en: 'Level' },
      ice: { pt: 'Blocos de Gelo', es: 'Bloques de Hielo', en: 'Ice Blocks' },
      locks: { pt: 'Cadeados', es: 'Candados', en: 'Padlocks' },
      bombs: { pt: 'Bombas', es: 'Bombas', en: 'Bombs' },
      no_hints: { pt: 'Sem Dicas', es: 'Sin Pistas', en: 'No Hints' },
      no_duplicates: { pt: 'Sem Adicionar Linhas', es: 'Sin Añadir Líneas', en: 'No Added Lines' },
      combo_streak: { pt: 'Combo Máximo', es: 'Combo Máximo', en: 'Max Combo' },
      cleared_numbers: { pt: 'Números Removidos', es: 'Números Eliminados', en: 'Cleared Numbers' },
      supreme_zen: { pt: 'Desafio Supremo', es: 'Desafío Supremo', en: 'Supreme Challenge' }
    };
    return labels[key]?.[config.language] || labels[key]?.en || key;
  };

  // Get current challenge info
  const currentChallenge = levelId ? challengeLevels.find(l => l.id === levelId) : null;
  
  // Dynamic Name / Mode title
  const getModeTitle = () => {
    if (levelId && currentChallenge) {
      if (config.language === 'pt') return currentChallenge.titlePT;
      if (config.language === 'es') return currentChallenge.titleES;
      return currentChallenge.titleEN;
    }
    const modeName = TRANSLATIONS[config.language][mode] || mode;
    return modeName.charAt(0).toUpperCase() + modeName.slice(1);
  };

  // Dynamic Description / Goal
  const getGoalDescription = () => {
    if (levelId && currentChallenge) {
      if (config.language === 'pt') return currentChallenge.descPT;
      if (config.language === 'es') return currentChallenge.descES;
      return currentChallenge.descEN;
    }
    switch (mode) {
      case 'classic':
        return config.language === 'pt' ? 'Combine números adjacentes até limpar o tabuleiro ou travar.' : config.language === 'es' ? 'Combina números adyacentes hasta limpiar el tablero o bloquearlo.' : 'Combine adjacent numbers until clearing the board or locking.';
      case 'relax':
        return config.language === 'pt' ? 'Modo sem pressa. Relaxe, combine livremente e explore.' : config.language === 'es' ? 'Modo sin prisas. Relájate, combina libremente y explora.' : 'Unrushed mode. Relax, combine freely and explore.';
      case 'timed':
        return config.language === 'pt' ? 'Faça o máximo de pontos possível antes do tempo acabar!' : config.language === 'es' ? '¡Consigue tantos puntos como puedas antes de que se acabe el tiempo!' : 'Get as many points as possible before time runs out!';
      case 'survival':
        return config.language === 'pt' ? 'Impeça o tabuleiro de encher! Novas linhas surgem automaticamente.' : config.language === 'es' ? '¡Evita que el tablero se llene! Aparecen nuevas líneas automáticamente.' : 'Prevent the board from filling! New lines spawn automatically.';
      case 'frozen':
        return config.language === 'pt' ? 'Derreta todas as peças congeladas realizando combinações nela.' : config.language === 'es' ? 'Derrite todas las piezas congeladas haciendo combinaciones en ellas.' : 'Melt all frozen cells by making matches on them.';
      case 'bombs':
        return config.language === 'pt' ? 'Cuidado! Detone ou remova as bombas antes do cronômetro zerar.' : config.language === 'es' ? '¡Cuidado! Detona o elimina las bombas antes de que el temporizador llegue a cero.' : 'Watch out! Detonate or clear bombs before their timer hits zero.';
      case 'locks':
        return config.language === 'pt' ? 'Destranque todos os cadeados limpando as células vizinhas.' : config.language === 'es' ? 'Desbloquea todos los candados limpiando las celdas vecinas.' : 'Unlock all padlocks by clearing adjacent cells.';
      case 'infinite':
        return config.language === 'pt' ? 'Desafio eterno! Novas linhas de números surgem a cada 20 segundos.' : config.language === 'es' ? '¡Desafío eterno! Nuevas líneas aparecen cada 20 segundos.' : 'Eternal challenge! New lines spawn automatically every 20 seconds.';
      default:
        return '';
    }
  };

  // Calculate Progress percentage
  const getProgressData = () => {
    if (levelId && currentChallenge) {
      const targets: { label: string; current: number; target: number; percent: number }[] = [];
      
      // Target Score
      if (currentChallenge.targetScore) {
        const scorePercent = Math.min(100, Math.round((score / currentChallenge.targetScore) * 100));
        targets.push({
          label: config.language === 'pt' ? 'Pontos' : config.language === 'es' ? 'Puntos' : 'Score',
          current: score,
          target: currentChallenge.targetScore,
          percent: scorePercent
        });
      }

      // Objective conditions
      if (currentChallenge.objective && currentChallenge.objective.type !== 'score') {
        const obj = currentChallenge.objective;
        let curVal = 0;
        let objLabel = '';

        if (obj.type === 'pairs') {
          curVal = levelPairsMatched;
          objLabel = config.language === 'pt' ? 'Pares Combinados' : config.language === 'es' ? 'Parejas Combinadas' : 'Matched Pairs';
        } else if (obj.type === 'sum_ten') {
          curVal = levelSumTenMatched;
          objLabel = config.language === 'pt' ? 'Soma 10 Encontrados' : config.language === 'es' ? 'Suma 10 Encontrados' : 'Sum 10 Matches';
        } else if (obj.type === 'ice') {
          curVal = clearedIce;
          objLabel = config.language === 'pt' ? 'Gelo Derretido' : config.language === 'es' ? 'Hielo Derretido' : 'Ice Melted';
        } else if (obj.type === 'locks') {
          curVal = clearedLocks;
          objLabel = config.language === 'pt' ? 'Cadeados Abertos' : config.language === 'es' ? 'Candados Abiertos' : 'Padlocks Opened';
        } else if (obj.type === 'bombs') {
          curVal = clearedBombs;
          objLabel = config.language === 'pt' ? 'Bombas Desarmadas' : config.language === 'es' ? 'Bombas Desactivadas' : 'Bombs Defused';
        } else if (obj.type === 'combos') {
          curVal = maxComboInLevel;
          objLabel = config.language === 'pt' ? 'Combo Máximo' : config.language === 'es' ? 'Combo Máximo' : 'Max Combo';
        } else if (obj.type === 'same_number') {
          const targetVal = obj.targetValue || 7;
          const startingCount = cells ? cells.filter(c => c.value === targetVal).length : 0;
          const leftCount = cells ? cells.filter(c => !c.removed && c.value === targetVal).length : 0;
          curVal = Math.max(0, Math.floor((startingCount - leftCount) / 2));
          objLabel = config.language === 'pt' ? `Pares de ${targetVal}` : config.language === 'es' ? `Parejas de ${targetVal}` : `Pairs of ${targetVal}`;
        } else if (obj.type === 'clear_board') {
          const startingActive = cells ? cells.length : 1;
          const activeLeft = cells ? cells.filter(c => !c.removed && c.value !== 0).length : 0;
          curVal = startingActive - activeLeft;
          objLabel = config.language === 'pt' ? 'Peças Removidas' : config.language === 'es' ? 'Fichas Eliminadas' : 'Cleared Pieces';
          const condPercent = Math.min(100, Math.round((curVal / startingActive) * 100));
          targets.push({
            label: objLabel,
            current: curVal,
            target: startingActive,
            percent: condPercent
          });
          return targets;
        }

        const condPercent = Math.min(100, Math.round((curVal / obj.count) * 100));
        targets.push({
          label: objLabel,
          current: curVal,
          target: obj.count,
          percent: condPercent
        });
      }

      return targets;
    } else {
      // For other modes, show progress towards beating High Score
      if (highScore > 0) {
        const percent = Math.min(100, Math.round((score / highScore) * 100));
        return [{
          label: getLabel('best'),
          current: score,
          target: highScore,
          percent
        }];
      }
      return [];
    }
  };

  const progressBars = getProgressData();

  return (
    <div 
      id="game-info-panel"
      className={`w-full flex flex-col gap-3 sm:gap-4 p-3 sm:p-5 rounded-2xl border transition-all duration-300 ${themeStyles.cardBg}`}
    >
      {/* Title & Mode Identifier */}
      <div className="flex items-center justify-between border-b pb-2.5 sm:pb-3.5 border-current/10">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div 
            className="p-2.5 rounded-xl shrink-0 flex items-center justify-center text-white"
            style={{ backgroundColor: themeStyles.accentColor || '#3b82f6' }}
          >
            {levelId ? <Trophy className="w-5 h-5 animate-pulse" /> : <Compass className="w-5 h-5 animate-spin-slow" />}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-[10px] font-mono uppercase tracking-widest block leading-none ${themeStyles.textSecondary}`}>
              {levelId ? getLabel('level') : 'Modo'}
            </span>
            <span className={`text-sm font-black tracking-tight leading-tight block truncate mt-1 ${themeStyles.textPrimary}`}>
              {getModeTitle()}
            </span>
          </div>
        </div>

        {/* Level Selector Dropdown in InfoPanel */}
        {levelId && onSelectLevel && currentLevelUnlocked && (
          <div className="shrink-0 pl-1">
            <select
              id="quick-level-switcher"
              value={levelId}
              onChange={(e) => {
                const nextId = parseInt(e.target.value, 10);
                onSelectLevel(nextId);
              }}
              className={`text-xs font-bold py-1.5 px-3 rounded-xl border focus:outline-none cursor-pointer transition-all ${themeStyles.secondaryBtn}`}
              style={{ borderColor: `${themeStyles.accentColor}33` }}
            >
              {challengeLevels.map(cl => {
                const isUnlocked = cl.id <= currentLevelUnlocked;
                if (!isUnlocked) return null;
                return (
                  <option key={cl.id} value={cl.id} className="bg-zinc-900 text-white font-sans font-medium">
                    {config.language === 'pt' ? `Fase ${cl.id}` : config.language === 'es' ? `Nivel ${cl.id}` : `Stage ${cl.id}`}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Goal Description */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-yellow-500 flex items-center gap-1">
          <Target className="w-3.5 h-3.5" />
          {getLabel('objective')}
        </span>
        <p className={`text-xs leading-relaxed font-medium ${themeStyles.textSecondary}`}>
          {getGoalDescription()}
        </p>
      </div>

      {/* Real-time Score Display */}
      <div className={`p-2.5 sm:p-3 rounded-xl flex items-center justify-between border ${themeStyles.itemBg}`}>
        <div className="flex flex-col">
          <span className={`text-[9px] uppercase tracking-widest font-bold ${themeStyles.textSecondary}`}>
            {TRANSLATIONS[config.language].score}
          </span>
          <span className={`text-2xl font-black font-mono leading-none mt-1 ${themeStyles.textPrimary}`}>
            {score.toLocaleString()}
          </span>
        </div>

        {/* Combo Fire Indicator */}
        {combo > 1 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-lg animate-pulse">
            <Flame className="w-4 h-4 fill-current animate-bounce" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[8px] uppercase tracking-wider font-bold">Combo</span>
              <span className="text-sm font-black font-mono">x{combo}</span>
            </div>
          </div>
        ) : (
          highScore > 0 && (
            <div className="flex flex-col items-end leading-none">
              <span className={`text-[8px] uppercase tracking-widest ${themeStyles.textSecondary}`}>
                {getLabel('best')}
              </span>
              <span className={`text-xs font-bold font-mono mt-1 ${themeStyles.textPrimary}`}>
                {highScore.toLocaleString()}
              </span>
            </div>
          )
        )}
      </div>

      {/* Dynamic Progress Bars */}
      {progressBars.length > 0 && (
        <div className="flex flex-col gap-3 border-t pt-3.5 border-current/10">
          <span className={`text-[10px] uppercase tracking-widest font-bold ${themeStyles.textSecondary}`}>
            {getLabel('progress')}
          </span>
          <div className="flex flex-col gap-2.5">
            {progressBars.map((bar, idx) => (
              <div id={`bar-item-${idx}`} key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className={`font-semibold uppercase ${themeStyles.textSecondary}`}>{bar.label}</span>
                  <span className={`font-bold ${themeStyles.textPrimary}`}>
                    {bar.current.toLocaleString()} / {bar.target.toLocaleString()} ({bar.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-current/5 rounded-full overflow-hidden border border-current/5">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out relative"
                    style={{ 
                      width: `${bar.percent}%`,
                      backgroundColor: themeStyles.accentColor || '#3b82f6',
                      boxShadow: `0 0 6px ${themeStyles.accentColor || '#3b82f6'}aa`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Stats Grid: Time, Moves, Lives */}
      <div className="grid grid-cols-2 gap-2 mt-1 pt-3.5 border-t border-current/10">
        {/* Lives / Mistakes Tracker */}
        {mode === 'survival' && (
          <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center ${themeStyles.itemBg}`}>
            <span className={`text-[9px] uppercase tracking-wider font-semibold mb-1 ${themeStyles.textSecondary}`}>
              Vidas
            </span>
            <div className="flex gap-0.5 justify-center flex-wrap max-w-full">
              {Array.from({ length: maxLives }).map((_, i) => (
                <Heart
                  id={`panel-heart-${i}`}
                  key={i}
                  className={`w-3.5 h-3.5 transition-all duration-300 ${
                    i < lives 
                      ? 'text-red-500 fill-red-500 drop-shadow-[0_0_2px_rgba(239,68,68,0.5)] scale-100' 
                      : 'opacity-15 text-current scale-90'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Moves Counter */}
        {levelId && currentChallenge?.movesLimit !== undefined && (
          <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center ${themeStyles.itemBg}`}>
            <span className={`text-[9px] uppercase tracking-wider font-semibold mb-0.5 ${themeStyles.textSecondary}`}>
              {getLabel('moves_left')}
            </span>
            <span className={`text-base font-black font-mono leading-none ${movesLeft && movesLeft <= 5 ? 'text-red-500 animate-pulse' : themeStyles.textPrimary}`}>
              {movesLeft}
            </span>
          </div>
        )}

        {/* Timers Clocks */}
        {(mode === 'timed' || (levelId && currentChallenge?.timeLimit)) && (
          <div className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center ${themeStyles.itemBg}`}>
            <span className={`text-[9px] uppercase tracking-wider font-semibold mb-0.5 ${themeStyles.textSecondary}`}>
              {TRANSLATIONS[config.language].time}
            </span>
            <span className={`text-base font-black font-mono leading-none flex items-center gap-1 ${timeLeft && timeLeft <= 15 ? 'text-red-500 animate-pulse' : themeStyles.textPrimary}`}>
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {timeLeft}s
            </span>
          </div>
        )}

        {/* Survival Tick countdown */}
        {(mode === 'survival' || mode === 'infinite') && (
          <div className={`p-2.5 rounded-xl border ${mode === 'survival' ? 'col-span-1 flex-col justify-center' : 'col-span-2 flex-row justify-between px-3'} flex items-center text-center ${themeStyles.itemBg}`}>
            <span className={`text-[9px] uppercase tracking-wider font-bold flex items-center gap-1 ${mode === 'survival' ? 'mb-1' : ''} ${themeStyles.textSecondary}`}>
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              {getLabel('next_line')}
            </span>
            <span className="text-sm font-black font-mono text-blue-500 animate-pulse">
              {survivalTick}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
