import React, { useState } from 'react';
import { Achievement, GameConfig } from '../types';
import { TRANSLATIONS } from '../config/gameConfig';
import { Award, Coins, Flame, Star, ShieldCheck, Check, X } from 'lucide-react';
import { SynthAudio } from '../audio/synth';

interface AchievementsModalProps {
  achievements: Achievement[];
  config: GameConfig;
  onClose: () => void;
  themeStyles: any;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievements,
  config,
  onClose,
  themeStyles
}) => {
  const t = TRANSLATIONS[config.language];
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter] = useState<string>('all');

  const filteredAchievements = achievements.filter(ach => {
    const statusMatch =
      filter === 'all' ||
      (filter === 'unlocked' && ach.completed) ||
      (filter === 'locked' && !ach.completed);
    
    const categoryMatch =
      categoryFilter === 'all' ||
      ach.category === categoryFilter;

    return statusMatch && categoryMatch;
  });

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'score':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'combo':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'clears':
        return <ShieldCheck className="w-5 h-5 text-blue-500" />;
      case 'coins':
        return <Coins className="w-5 h-5 text-yellow-600" />;
      default:
        return <Award className="w-5 h-5 text-purple-500" />;
    }
  };

  const unlockedCount = achievements.filter(a => a.completed).length;
  const totalCount = achievements.length;
  const pctUnlocked = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div id="achievements-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className={`w-full max-w-lg rounded-2xl border p-6 flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto ${themeStyles.cardBg}`}>
        <button
          id="close-achievements-btn"
          onClick={() => {
            SynthAudio.playClick(config.soundEnabled);
            onClose();
          }}
          className={`absolute top-4 right-4 p-2 rounded-full border transition-all ${themeStyles.secondaryBtn}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-1 items-center justify-center">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6" style={{ color: themeStyles.accentColor }} />
            <h3 id="achievements-title" className={`text-xl font-serif italic tracking-wider font-semibold ${themeStyles.textPrimary}`}>
              {t.achievements}
            </h3>
          </div>
          {/* Global progress */}
          <div className={`text-xs font-medium mt-1 ${themeStyles.textSecondary}`}>
            {unlockedCount} / {totalCount} ({pctUnlocked}%) Desbloqueados
          </div>
          <div className="w-1/2 h-1.5 bg-current/10 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${pctUnlocked}%` }} />
          </div>
        </div>

        {/* Filters */}
        <div className={`flex flex-wrap gap-2 justify-center border-b pb-3 ${themeStyles.borderPrimary}`}>
          <button
            id="filter-ach-all"
            onClick={() => {
              SynthAudio.playClick(config.soundEnabled);
              setFilter('all');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
              filter === 'all'
                ? 'border-current bg-current/10 shadow'
                : 'border-transparent opacity-60 hover:opacity-100'
            } ${themeStyles.textPrimary}`}
            style={{
              color: filter === 'all' ? themeStyles.accentColor : undefined
            }}
          >
            Todos
          </button>
          <button
            id="filter-ach-unlocked"
            onClick={() => {
              SynthAudio.playClick(config.soundEnabled);
              setFilter('unlocked');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
              filter === 'unlocked'
                ? 'border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/5'
                : 'border-transparent opacity-60 hover:opacity-100'
            } ${themeStyles.textPrimary}`}
          >
            Concluídos
          </button>
          <button
            id="filter-ach-locked"
            onClick={() => {
              SynthAudio.playClick(config.soundEnabled);
              setFilter('locked');
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
              filter === 'locked'
                ? 'border-yellow-500/50 text-yellow-600 dark:text-yellow-400 bg-yellow-500/5'
                : 'border-transparent opacity-60 hover:opacity-100'
            } ${themeStyles.textPrimary}`}
          >
            Em Progresso
          </button>
        </div>

        {/* List of achievements */}
        <div className="flex flex-col gap-2.5 max-h-[42vh] overflow-y-auto pr-1">
          {filteredAchievements.length > 0 ? (
            filteredAchievements.map((ach) => {
              const pct = Math.min(100, Math.floor((ach.currentValue / ach.targetValue) * 100));
              return (
                <div
                  id={`achievement-card-${ach.id}`}
                  key={ach.id}
                  className={`p-3 rounded-xl border flex gap-3.5 items-start relative transition-all duration-300 ${
                    ach.completed
                      ? 'bg-green-500/5 border-green-500/20'
                      : `border-current/10 bg-current/[0.02] hover:border-current/25`
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border flex items-center justify-center shrink-0 ${
                    ach.completed ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-current/5 border-current/10 opacity-70'
                  }`}>
                    {getCategoryIcon(ach.category)}
                  </div>

                  <div className="flex-1 flex flex-col gap-1 pr-6">
                    <div className="flex flex-col">
                      <h4 className={`text-sm font-semibold tracking-wide ${ach.completed ? themeStyles.textPrimary : `opacity-70 ${themeStyles.textPrimary}`}`}>
                        {t[ach.titleKey as keyof typeof t] || ach.titleKey}
                      </h4>
                      <p className={`text-xs mt-0.5 leading-relaxed ${themeStyles.textSecondary}`}>
                        {t[ach.descriptionKey as keyof typeof t] || ach.descriptionKey}
                      </p>
                    </div>

                    {/* Progress slider */}
                    {!ach.completed && (
                      <div className="flex flex-col gap-1 mt-1.5">
                        <div className={`flex justify-between text-[10px] font-mono ${themeStyles.textSecondary}`}>
                          <span>{ach.currentValue.toLocaleString()} / {ach.targetValue.toLocaleString()}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1 bg-current/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: themeStyles.accentColor }}
                          />
                        </div>
                      </div>
                    )}

                    {ach.completed && ach.unlockedAt && (
                      <span className="text-[10px] text-green-600 dark:text-green-400 font-mono mt-1">
                        Desbloqueado em {new Date(ach.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Coin reward badge */}
                  <div className="flex flex-col gap-0.5 items-end shrink-0">
                    <div className={`flex items-center gap-1 py-0.5 px-2 rounded-full border text-xs font-bold ${
                      ach.completed ? 'border-green-500/25 text-green-600 dark:text-green-400 bg-green-500/5' : 'border-yellow-500/25 text-yellow-600 dark:text-yellow-400 bg-yellow-500/5'
                    }`}>
                      {ach.completed ? <Check className="w-3.5 h-3.5" /> : <Coins className="w-3.5 h-3.5" />}
                      <span>{ach.rewardCoins}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div id="no-achievements" className={`text-center py-8 text-sm italic ${themeStyles.textSecondary}`}>
              Nenhuma conquista correspondente encontrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
