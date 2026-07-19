import React from 'react';
import { Cell, GameConfig } from '../types';
import { Snowflake, Lock, Bomb } from 'lucide-react';

interface GameGridProps {
  cells: Cell[];
  cols: number;
  selectedIndex: number | null;
  onCellClick: (index: number) => void;
  config: GameConfig;
  themeStyles: any;
  highlightedIndices?: number[];
  errorIndices?: number[];
  animatingMatch?: {
    idxA: number;
    idxB: number;
    r1: number;
    c1: number;
    r2: number;
    c2: number;
  } | null;
  activeExplosions?: { id: string; idx: number; color: string }[];
  floatingScores?: { id: string; idx: number; text: string }[];
  mode?: string;
  isShuffling?: boolean;
}

export const GameGrid: React.FC<GameGridProps> = React.memo(({
  cells,
  cols,
  selectedIndex,
  onCellClick,
  config,
  themeStyles,
  highlightedIndices = [],
  errorIndices = [],
  animatingMatch = null,
  activeExplosions = [],
  floatingScores = [],
  mode = 'classic',
  isShuffling = false
}) => {
  const getSpecialIcon = (cell: Cell) => {
    switch (cell.special) {
      case 'frozen':
        return (
          <div className="absolute top-1 left-1 flex items-center justify-center text-blue-300 animate-pulse">
            <Snowflake className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
            {cell.frozenCount > 1 && (
              <span className="text-[8px] font-mono font-black ml-0.5">{cell.frozenCount}</span>
            )}
          </div>
        );
      case 'locked':
        return (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px] rounded-lg flex items-center justify-center text-yellow-500 border border-yellow-500/25">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce-slow" />
          </div>
        );
      case 'bomb':
        return (
          <div className="absolute top-0.5 right-0.5 flex flex-col items-center">
            <div className="text-red-500 animate-pulse flex items-center justify-center">
              <Bomb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            {cell.bombTimer !== undefined && (
              <span className="text-[8px] font-mono font-black text-red-400 bg-black/75 px-1 py-0.2 rounded-full leading-none mt-0.5">
                {cell.bombTimer}
              </span>
            )}
          </div>
        );
      case 'multiplier':
        return (
          <div className="absolute top-1 right-1 text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 text-[8px] font-bold px-1 rounded">
            {cell.multiplier}x
          </div>
        );
      case 'portal':
        return (
          <div className="absolute inset-0 border-2 border-dashed border-purple-500 rounded-lg animate-spin-slow pointer-events-none flex items-center justify-center">
            <span className="absolute bottom-0 right-1 text-[8px] text-purple-400 font-mono font-black">
              P{cell.portalGroup}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  const getFontSizeClass = () => {
    let size = config.numberSize || 'medium';
    if (config.largeFont) {
      if (size === 'small') size = 'medium';
      else if (size === 'medium') size = 'large';
      else size = 'giant';
    }

    switch (size) {
      case 'small':
        return 'text-xs sm:text-sm md:text-base p-0.5';
      case 'large':
        return 'text-xl sm:text-2xl md:text-3xl p-1.5';
      case 'giant':
        return 'text-3xl sm:text-4xl md:text-5xl p-2';
      case 'medium':
      default:
        return 'text-base sm:text-lg md:text-xl p-1';
    }
  };

  return (
    <div
      id="game-board-container"
      className="w-full flex justify-center py-2 pr-1.5"
    >
      <div
        id="game-grid"
        className={`grid gap-1 sm:gap-1.5 p-1.5 sm:p-3 rounded-2xl w-full max-w-lg shadow-2xl border ${themeStyles.gridBg}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
        }}
      >
        {cells.map((cell, idx) => {
          const isSelected = selectedIndex === idx;

          // Fog of War (challenge / Dark Mode / Escuro) visibility logic
          const isRevealed = (() => {
            if (mode !== 'challenge') return true;
            // Top 2 rows are always visible as a guiding reference anchor
            if (idx < cols * 2) return true;
            // Currently selected cell reveals a 2x2 grid radius around itself
            if (selectedIndex !== null) {
              const rSel = Math.floor(selectedIndex / cols);
              const cSel = selectedIndex % cols;
              const rCell = Math.floor(idx / cols);
              const cCell = idx % cols;
              if (Math.abs(rSel - rCell) <= 2 && Math.abs(cSel - cCell) <= 2) {
                return true;
              }
            }
            // Highlighted indices (e.g. from Hint) are always visible
            if (highlightedIndices.includes(idx)) return true;
            return false;
          })();

          if (cell.removed) {
            return (
              <div
                id={`cell-empty-${idx}`}
                key={cell.id}
                className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                  config.highContrast ? 'bg-black/40 border border-white/5' : themeStyles.cellEmpty
                }`}
              />
            );
          }

          // Generate custom cell styles depending on special items and visibility
          const isLightTheme = ['aurelius', 'minimalist', 'wood'].includes(themeStyles.id);
          let cellStyle = themeStyles.cellBg;
          if (!isRevealed) {
            cellStyle = isLightTheme
              ? 'bg-zinc-300 border-zinc-400/40 text-zinc-500 hover:border-zinc-500 opacity-80 cursor-pointer'
              : 'bg-slate-950 border-slate-900/40 text-slate-700 hover:border-slate-800 opacity-80 cursor-pointer';
          } else if (cell.special === 'frozen') {
            if (isLightTheme) {
              cellStyle = cell.frozenCount > 1 
                ? 'bg-blue-100 border-blue-400 text-blue-900 font-bold hover:border-blue-600' 
                : 'bg-blue-50 border-blue-300 text-blue-800 font-bold hover:border-blue-500';
            } else {
              cellStyle = cell.frozenCount > 1 
                ? 'bg-blue-950/20 border-blue-500/50 text-[#f5f2ed] hover:border-blue-400' 
                : 'bg-blue-950/10 border-blue-400/30 text-[#f5f2ed] hover:border-blue-300';
            }
          } else if (cell.special === 'locked') {
            cellStyle = isLightTheme
              ? 'bg-zinc-200 border-amber-600/30 text-zinc-400 cursor-not-allowed'
              : 'bg-gray-900 border-yellow-700/30 text-gray-500 cursor-not-allowed';
          } else if (cell.special === 'bomb') {
            cellStyle = isLightTheme
              ? 'bg-red-100 border-red-300 text-red-900 font-bold hover:border-red-500'
              : 'bg-red-950/20 border-red-500/30 text-red-100 hover:border-red-400';
          } else if (cell.special === 'multiplier') {
            cellStyle = isLightTheme
              ? 'bg-amber-100 border-amber-300 text-amber-950 font-bold hover:border-amber-500'
              : 'bg-yellow-950/10 border-yellow-500/30 text-yellow-100 hover:border-yellow-400';
          } else if (cell.special === 'portal') {
            cellStyle = isLightTheme
              ? 'bg-purple-100 border-purple-300 text-purple-900 font-bold hover:border-purple-500'
              : 'bg-purple-950/20 border-purple-500/30 text-purple-100 hover:border-purple-400';
          }

          let dynamicStyle: React.CSSProperties = {};

          if (isSelected) {
            cellStyle = `${themeStyles.cellSelected} scale-110 z-10`;
            dynamicStyle = {
              boxShadow: `0 0 18px ${themeStyles.accentColor || '#3b82f6'}`,
              borderColor: themeStyles.accentColor || '#3b82f6'
            };
          }

          // Accessibility Override: High Contrast Mode (Stark black, white, and yellow elements)
          if (config.highContrast) {
            if (isSelected) {
              cellStyle = 'bg-yellow-400 text-black border-4 border-yellow-500 font-black';
              dynamicStyle = {};
            } else if (!isRevealed) {
              cellStyle = 'bg-gray-950 text-gray-700 border-2 border-gray-900 border-dashed font-bold';
            } else if (cell.special === 'locked') {
              cellStyle = 'bg-black text-gray-400 border-2 border-red-500 font-bold';
            } else if (cell.special === 'frozen') {
              cellStyle = 'bg-black text-blue-400 border-2 border-blue-400 font-bold';
            } else if (cell.special === 'bomb') {
              cellStyle = 'bg-black text-red-400 border-2 border-red-400 font-bold';
            } else {
              cellStyle = 'bg-black text-white border-2 border-white font-bold hover:bg-gray-950';
            }
          }

          const isHighlighted = highlightedIndices.includes(idx);
          if (isHighlighted) {
            cellStyle = `${cellStyle} animate-pulse-glow border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.9)] text-yellow-300 font-black ring-2 ring-yellow-400/60 z-10`;
          }

          const isError = errorIndices.includes(idx);
          if (isError) {
            cellStyle = 'bg-red-600 text-white border-red-700 animate-shake shadow-[0_0_15px_rgba(239,68,68,0.8)] z-10';
          }

          // Handle gliding match-approximation animation
          if (animatingMatch) {
            if (idx === animatingMatch.idxA) {
              const dx = (animatingMatch.c2 - animatingMatch.c1) * 50;
              const dy = (animatingMatch.r2 - animatingMatch.r1) * 50;
              dynamicStyle = {
                ...dynamicStyle,
                transform: `translate(${dx}%, ${dy}%) scale(0.82)`,
                opacity: 0.1,
                zIndex: 50,
                transition: 'transform 280ms cubic-bezier(0.25, 1, 0.5, 1), opacity 280ms ease-out'
              };
            } else if (idx === animatingMatch.idxB) {
              const dx = (animatingMatch.c1 - animatingMatch.c2) * 50;
              const dy = (animatingMatch.r1 - animatingMatch.r2) * 50;
              dynamicStyle = {
                ...dynamicStyle,
                transform: `translate(${dx}%, ${dy}%) scale(0.82)`,
                opacity: 0.1,
                zIndex: 50,
                transition: 'transform 280ms cubic-bezier(0.25, 1, 0.5, 1), opacity 280ms ease-out'
              };
            }
          }

          if (isShuffling && config.animationsEnabled) {
            const delay = (idx % cols + Math.floor(idx / cols)) * 12;
            dynamicStyle = {
              ...dynamicStyle,
              animationDelay: `${delay}ms`
            };
          }

          const fontClass = getFontSizeClass();

          return (
            <button
              id={`cell-${idx}`}
              key={cell.id}
              disabled={cell.locked}
              style={dynamicStyle}
              onClick={() => {
                if (!cell.locked) {
                  onCellClick(idx);
                }
              }}
              className={`aspect-square rounded-lg flex items-center justify-center font-semibold font-sans tracking-normal select-none border shadow-sm transition-all focus:outline-none relative ${cellStyle} ${fontClass} ${
                isShuffling && config.animationsEnabled ? 'animate-shuffle-tile' : ''
              } ${
                config.animationsEnabled && !animatingMatch && !isShuffling ? 'hover:scale-[1.03] active:scale-95 duration-150' : ''
              }`}
            >
              {isRevealed ? cell.value : '?'}
              {isRevealed && getSpecialIcon(cell)}

              {/* Sparks Particle Explosion */}
              {activeExplosions.filter(e => e.idx === idx).map(explosion => (
                <div key={explosion.id} className="absolute inset-0 pointer-events-none z-30">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const angle = (i * Math.PI) / 5;
                    const distance = 30 + Math.random() * 25;
                    const tx = Math.cos(angle) * distance;
                    const ty = Math.sin(angle) * distance;
                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full animate-particle-explosion"
                        style={{
                          backgroundColor: explosion.color,
                          boxShadow: `0 0 8px ${explosion.color}`,
                          '--tx': `${tx}px`,
                          '--ty': `${ty}px`,
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Floating points score popups */}
              {floatingScores.filter(s => s.idx === idx).map(score => (
                <div
                  key={score.id}
                  className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-black text-green-400 z-40 pointer-events-none animate-score-float"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
                >
                  {score.text}
                </div>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.cells === next.cells &&
    prev.selectedIndex === next.selectedIndex &&
    prev.highlightedIndices === next.highlightedIndices &&
    prev.errorIndices.length === next.errorIndices.length &&
    prev.animatingMatch === next.animatingMatch &&
    prev.activeExplosions === next.activeExplosions &&
    prev.floatingScores === next.floatingScores &&
    prev.isShuffling === next.isShuffling &&
    prev.config.highContrast === next.config.highContrast &&
    prev.themeStyles === next.themeStyles
  );
});
