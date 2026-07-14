import React from 'react';
import { UserStats, GameConfig } from '../types';
import { TRANSLATIONS } from '../config/gameConfig';
import { BarChart3, Clock, Flame, Award, Trophy, Hash, RotateCcw, X } from 'lucide-react';
import { SynthAudio } from '../audio/synth';

interface StatsModalProps {
  stats: UserStats;
  config: GameConfig;
  onClose: () => void;
  themeStyles: any;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  stats,
  config,
  onClose,
  themeStyles
}) => {
  const t = TRANSLATIONS[config.language];

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s}s`;
  };

  const statItems = [
    {
      id: 'stat-matches',
      label: t.total_matches,
      value: stats.totalMatches,
      icon: <Hash className="w-5 h-5 text-blue-500 shrink-0" />
    },
    {
      id: 'stat-time',
      label: t.total_time,
      value: formatTime(stats.totalTimePlayed),
      icon: <Clock className="w-5 h-5 text-green-500 shrink-0" />
    },
    {
      id: 'stat-streak',
      label: t.consecutive_days,
      value: `${stats.consecutiveDays} 🔥`,
      icon: <Flame className="w-5 h-5 text-orange-500 shrink-0" />
    },
    {
      id: 'stat-combo',
      label: t.max_combo_reached,
      value: `${stats.maxCombo}x`,
      icon: <Award className="w-5 h-5 text-purple-500 shrink-0" />
    },
    {
      id: 'stat-wins',
      label: 'W / L',
      value: `${stats.wins} / ${stats.losses}`,
      icon: <RotateCcw className="w-5 h-5 text-teal-500 shrink-0" />
    },
    {
      id: 'stat-cleared',
      label: t.total_clears,
      value: stats.totalClearedPieces.toLocaleString(),
      icon: <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
    }
  ];

  const modeKeys = Object.keys(stats.highScore) as (keyof typeof stats.highScore)[];

  return (
    <div id="stats-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className={`w-full max-w-md rounded-2xl border p-6 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto ${themeStyles.cardBg}`}>
        <button
          id="close-stats-btn"
          onClick={() => {
            SynthAudio.playClick(config.soundEnabled);
            onClose();
          }}
          className={`absolute top-4 right-4 p-2 rounded-full border transition-all ${themeStyles.secondaryBtn}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 justify-center">
          <BarChart3 className="w-6 h-6" style={{ color: themeStyles.accentColor }} />
          <h3 id="stats-title" className={`text-xl font-serif italic tracking-wider font-semibold ${themeStyles.textPrimary}`}>
            {t.stats}
          </h3>
        </div>

        {/* Global stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item, idx) => (
            <div id={item.id} key={idx} className={`p-3 rounded-lg border flex flex-col gap-1 ${themeStyles.itemBg}`}>
              <div className={`flex items-center gap-2 text-xs font-medium ${themeStyles.textSecondary}`}>
                {item.icon}
                <span>{item.label}</span>
              </div>
              <span className={`text-lg font-bold tracking-tight mt-1 ${themeStyles.textPrimary}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* High scores per mode */}
        <div className="flex flex-col gap-2 mt-2">
          <h4 id="highscores-title" className={`text-xs font-semibold uppercase tracking-widest border-b pb-1 ${themeStyles.textSecondary} ${themeStyles.borderPrimary}`}>
            {t.highScore}s por Modo
          </h4>
          <div className="flex flex-col gap-1.5 max-h-[30vh] overflow-y-auto pr-1">
            {modeKeys.map((mode, idx) => (
              <div id={`highscore-${String(mode)}`} key={idx} className={`flex justify-between items-center py-2 px-3 rounded border text-sm ${themeStyles.itemBg}`}>
                <span className={`font-medium capitalize ${themeStyles.textPrimary}`}>
                  {(t as any)[mode] || String(mode)}
                </span>
                <span className="font-bold font-mono" style={{ color: themeStyles.accentColor }}>
                  {stats.highScore[mode].toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
