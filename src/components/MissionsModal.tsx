import React, { useState } from 'react';
import { GameMission, GameConfig } from '../types';
import { TRANSLATIONS } from '../config/gameConfig';
import { Target, Coins, ShieldAlert, Sparkles, CheckCircle2, X } from 'lucide-react';
import { SynthAudio } from '../audio/synth';

interface MissionsModalProps {
  missions: GameMission[];
  config: GameConfig;
  onClose: () => void;
  themeStyles: any;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  config,
  onClose,
  themeStyles
}) => {
  const t = TRANSLATIONS[config.language];
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  const filteredMissions = missions.filter(m => m.type === activeTab);

  // Helper to substitute {n} in description templates dynamically
  const renderDescription = (descKey: string, targetVal: number) => {
    let text = descKey;
    if (config.language === 'pt') {
      if (descKey.includes('Reach {n} score')) text = `Alcance ${targetVal} pontos em qualquer partida`;
      else if (descKey.includes('Clear {n} pieces')) text = `Elimine ${targetVal} peças no total`;
      else if (descKey.includes('Complete {n} matches')) text = `Complete ${targetVal} partidas`;
      else if (descKey.includes('Achieve a combo of {n}x')) text = `Consiga um combo de ${targetVal}x`;
      else if (descKey.includes('Trigger {n} bombs')) text = `Estoure ${targetVal} bombas`;
      else if (descKey.includes('Earn {n} coins')) text = `Ganhe ${targetVal} moedas jogando`;
      else if (descKey.includes('Win {n} classic games')) text = `Vença ${targetVal} partidas no modo clássico`;
      else if (descKey.includes('Win {n} relax games')) text = `Vença ${targetVal} partidas no modo relax`;
      else if (descKey.includes('Melt {n} ice blocks')) text = `Derreta ${targetVal} blocos de gelo`;
      else if (descKey.includes('Unlock {n} locks')) text = `Abra ${targetVal} cadeados`;
    } else if (config.language === 'es') {
      if (descKey.includes('Reach {n} score')) text = `Alcanza ${targetVal} puntos en cualquier partida`;
      else if (descKey.includes('Clear {n} pieces')) text = `Elimina ${targetVal} fichas en total`;
      else if (descKey.includes('Complete {n} matches')) text = `Completa ${targetVal} partidas`;
      else if (descKey.includes('Achieve a combo of {n}x')) text = `Consigue un combo de ${targetVal}x`;
      else if (descKey.includes('Trigger {n} bombs')) text = `Explota ${targetVal} bombas`;
      else if (descKey.includes('Earn {n} coins')) text = `Gana ${targetVal} monedas jugando`;
      else if (descKey.includes('Win {n} classic games')) text = `Gana ${targetVal} partidas en modo clásico`;
      else if (descKey.includes('Win {n} relax games')) text = `Gana ${targetVal} partidas en modo relax`;
      else if (descKey.includes('Melt {n} ice blocks')) text = `Derrite ${targetVal} bloques de hielo`;
      else if (descKey.includes('Unlock {n} locks')) text = `Abre ${targetVal} candados`;
    } else {
      // English
      text = descKey.replace('{n}', targetVal.toString());
    }
    return text;
  };

  return (
    <div id="missions-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className={`w-full max-w-md rounded-2xl border p-6 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto ${themeStyles.cardBg}`}>
        <button
          id="close-missions-btn"
          onClick={() => {
            SynthAudio.playClick(config.soundEnabled);
            onClose();
          }}
          className={`absolute top-4 right-4 p-2 rounded-full border transition-all ${themeStyles.secondaryBtn}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 justify-center">
          <Target className="w-6 h-6" style={{ color: themeStyles.accentColor }} />
          <h3 id="missions-title" className={`text-xl font-serif italic tracking-wider font-semibold ${themeStyles.textPrimary}`}>
            {t.missions}
          </h3>
        </div>

        {/* Tab switcher */}
        <div className={`grid grid-cols-2 gap-2 border-b pb-3 ${themeStyles.borderPrimary}`}>
          <button
            id="tab-daily-btn"
            onClick={() => {
              SynthAudio.playClick(config.soundEnabled);
              setActiveTab('daily');
            }}
            className={`py-2 text-sm font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'daily'
                ? ''
                : 'opacity-60 hover:opacity-100'
            } ${themeStyles.textPrimary}`}
            style={{
              borderBottomColor: activeTab === 'daily' ? themeStyles.accentColor : 'transparent',
              color: activeTab === 'daily' ? themeStyles.accentColor : undefined
            }}
          >
            {t.daily_missions}
          </button>
          <button
            id="tab-weekly-btn"
            onClick={() => {
              SynthAudio.playClick(config.soundEnabled);
              setActiveTab('weekly');
            }}
            className={`py-2 text-sm font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'weekly'
                ? ''
                : 'opacity-60 hover:opacity-100'
            } ${themeStyles.textPrimary}`}
            style={{
              borderBottomColor: activeTab === 'weekly' ? themeStyles.accentColor : 'transparent',
              color: activeTab === 'weekly' ? themeStyles.accentColor : undefined
            }}
          >
            {t.weekly_missions}
          </button>
        </div>

        {/* Missions list */}
        <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1">
          {filteredMissions.map((mission) => {
            const pct = Math.min(100, Math.floor((mission.currentValue / mission.targetValue) * 100));
            return (
              <div
                id={`mission-card-${mission.id}`}
                key={mission.id}
                className={`p-4 rounded-xl border flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${
                  mission.completed
                    ? 'bg-green-500/5 border-green-500/20'
                    : `border-current/10 bg-current/[0.02] hover:border-current/25`
                }`}
              >
                {mission.completed && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-bl">
                    {t.unlocked}
                  </div>
                )}

                <div className="flex justify-between items-start pr-12">
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 ${
                      mission.completed ? 'text-green-600 dark:text-green-400' : `${themeStyles.textSecondary}`
                    }`}>
                      {mission.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5 opacity-70" />}
                      {mission.type === 'daily' ? 'Diária' : 'Semanal'}
                    </span>
                    <p className={`text-sm font-medium ${mission.completed ? `line-through opacity-60 ${themeStyles.textPrimary}` : `${themeStyles.textPrimary}`}`}>
                      {renderDescription(mission.descriptionKey, mission.targetValue)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1 mt-1">
                  <div className={`flex justify-between text-[11px] font-mono ${themeStyles.textSecondary}`}>
                    <span>Progresso</span>
                    <span className="font-bold">
                      {mission.currentValue} / {mission.targetValue} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-current/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: mission.completed ? '#22c55e' : themeStyles.accentColor
                      }}
                    />
                  </div>
                </div>

                {/* Rewards */}
                <div className={`flex gap-4 items-center mt-1 pt-2 border-t ${themeStyles.borderPrimary}`}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span>+{mission.rewardCoins}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    <Sparkles className="w-4 h-4" />
                    <span>+{mission.rewardXP} XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
