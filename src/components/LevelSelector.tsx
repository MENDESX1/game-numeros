import React, { useState } from 'react';
import { GameConfig } from '../types';
import { TRANSLATIONS } from '../config/gameConfig';
import { 
  Lock, 
  Star, 
  ChevronLeft, 
  Play, 
  Trophy, 
  Target, 
  Clock, 
  Sparkles, 
  Activity, 
  Compass, 
  Award 
} from 'lucide-react';
import { SynthAudio } from '../audio/synth';
import { motion } from 'motion/react';

interface ChallengeLevel {
  id: number;
  titleKey: string;
  descKey: string;
  targetScore: number;
  movesLimit?: number;
  timeLimit?: number;
  specialCondition?: {
    type: 'ice' | 'locks' | 'bombs' | 'score' | 'no_hints' | 'no_duplicates' | 'combo_streak' | 'cleared_numbers' | 'supreme_zen';
    count: number;
  };
}

export const CHALLENGE_LEVELS: ChallengeLevel[] = [
  { id: 1, titleKey: 'Fase 1: Descongelar', descKey: 'Derreta 4 blocos de gelo para passar.', targetScore: 500, specialCondition: { type: 'ice', count: 4 } },
  { id: 2, titleKey: 'Fase 2: Alvo Rápido', descKey: 'Alcance 1.200 pontos dentro do tempo limite.', targetScore: 1200, timeLimit: 60, specialCondition: { type: 'score', count: 1200 } },
  { id: 3, titleKey: 'Fase 3: Artilharia', descKey: 'Detone 5 bombas no tabuleiro.', targetScore: 1000, specialCondition: { type: 'bombs', count: 5 } },
  { id: 4, titleKey: 'Fase 4: Chaveiro', descKey: 'Destranque 6 cadeados usando lógica.', targetScore: 1500, specialCondition: { type: 'locks', count: 6 } },
  { id: 5, titleKey: 'Fase 5: Mestre do Movimento', descKey: 'Alcance 2.500 pontos em até 40 jogadas.', targetScore: 2500, movesLimit: 40 },
  { id: 6, titleKey: 'Fase 6: Clássico Gélido', descKey: 'Derreta 10 blocos de gelo e pontue 3.000.', targetScore: 3000, specialCondition: { type: 'ice', count: 10 } },
  { id: 7, titleKey: 'Fase 7: SobPressão', descKey: 'Faça 4.000 pontos em 90 segundos.', targetScore: 4000, timeLimit: 90 },
  { id: 8, titleKey: 'Fase 8: Campo Minado', descKey: 'Detone 8 bombas e faça 5.000 pontos.', targetScore: 5000, specialCondition: { type: 'bombs', count: 8 } },
  { id: 9, titleKey: 'Fase 9: Cadeado Crítico', descKey: 'Destranque 12 cadeados com movimentos contínuos.', targetScore: 6000, specialCondition: { type: 'locks', count: 12 } },
  { id: 10, titleKey: 'Fase 10: Lenda dos Números', descKey: 'Sobreviva no Insano: Alcance 10.000 pontos!', targetScore: 10000, movesLimit: 60 },
  { id: 11, titleKey: 'Fase 11: Mente Brilhante', descKey: 'Alcance 3.500 pontos sem usar nenhuma dica.', targetScore: 3500, specialCondition: { type: 'no_hints', count: 1 } },
  { id: 12, titleKey: 'Fase 12: Pureza Lógica', descKey: 'Alcance 4.500 pontos sem adicionar novas linhas.', targetScore: 4500, specialCondition: { type: 'no_duplicates', count: 1 } },
  { id: 13, titleKey: 'Fase 13: Mestre do Combo', descKey: 'Alcance um combo de 6x e faça 5.000 pontos.', targetScore: 5000, specialCondition: { type: 'combo_streak', count: 6 } },
  { id: 14, titleKey: 'Fase 14: Grande Faxina', descKey: 'Remova 50 números e faça 6.000 pontos.', targetScore: 6000, specialCondition: { type: 'cleared_numbers', count: 50 } },
  { id: 15, titleKey: 'Fase 15: Desafio Supremo', descKey: 'Faça 7.500 pontos em 120s sem dicas e com combo de 8x.', targetScore: 7500, timeLimit: 120, specialCondition: { type: 'supreme_zen', count: 8 } }
];

interface LevelSelectorProps {
  currentLevelUnlocked: number;
  levelStars: Record<number, number>; // maps levelId -> stars (1-3)
  config: GameConfig;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
  themeStyles: any;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  currentLevelUnlocked,
  levelStars,
  config,
  onSelectLevel,
  onBack,
  themeStyles
}) => {
  const t = TRANSLATIONS[config.language];
  
  // Default to the highest unlocked level within limits, or 1
  const initialActive = Math.min(CHALLENGE_LEVELS.length, currentLevelUnlocked);
  const [selectedLevelId, setSelectedLevelId] = useState<number>(initialActive);

  const selectedLevel = CHALLENGE_LEVELS.find(l => l.id === selectedLevelId) || CHALLENGE_LEVELS[0];
  const selectedStars = levelStars[selectedLevel.id] || 0;

  const handleLevelNodeClick = (lvlId: number, isUnlocked: boolean) => {
    if (isUnlocked) {
      SynthAudio.playClick(config.soundEnabled);
      setSelectedLevelId(lvlId);
    } else {
      SynthAudio.playFail(config.soundEnabled);
    }
  };

  const getSpecialLabel = (type: string) => {
    const labels: Record<string, string> = {
      ice: config.language === 'pt' ? 'Derreter Gelo' : config.language === 'es' ? 'Derrite Hielo' : 'Melt Ice',
      locks: config.language === 'pt' ? 'Abrir Cadeados' : config.language === 'es' ? 'Abrir Candados' : 'Unlock Padlocks',
      bombs: config.language === 'pt' ? 'Desarmar Bombas' : config.language === 'es' ? 'Desarmar Bombas' : 'Defuse Bombs',
      no_hints: config.language === 'pt' ? 'Sem Pistas' : config.language === 'es' ? 'Sin Pistas' : 'No Hints used',
      no_duplicates: config.language === 'pt' ? 'Sem Mais Linhas' : config.language === 'es' ? 'Sin Más Líneas' : 'No added rows',
      combo_streak: config.language === 'pt' ? 'Super Combo' : config.language === 'es' ? 'Súper Combo' : 'Combo Streak',
      cleared_numbers: config.language === 'pt' ? 'Remover Números' : config.language === 'es' ? 'Eliminar Números' : 'Clear Numbers',
      supreme_zen: config.language === 'pt' ? 'Desafio Supremo' : config.language === 'es' ? 'Desafío Supremo' : 'Supreme Challenge'
    };
    return labels[type] || type;
  };

  return (
    <motion.div 
      id="level-selector-screen" 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto flex flex-col gap-5 p-4"
    >
      {/* Header and navigation */}
      <div className="flex items-center justify-between border-b pb-4 border-current/10">
        <div className="flex items-center gap-3">
          <button
            id="back-from-levels-btn"
            onClick={() => {
              SynthAudio.playClick(config.soundEnabled);
              onBack();
            }}
            className={`p-2.5 rounded-full border transition-all active:scale-90 hover:shadow-md ${themeStyles.secondaryBtn}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 id="levels-heading" className={`text-xl font-black tracking-tight leading-none ${themeStyles.textPrimary}`}>
              {config.language === 'pt' ? 'Fases de Desafio' : config.language === 'es' ? 'Niveles de Desafío' : 'Challenge Stages'}
            </h2>
            <p className={`text-xs mt-1 ${themeStyles.textSecondary}`}>
              {config.language === 'pt' ? 'Complete objetivos para subir de nível e ganhar moedas.' : config.language === 'es' ? 'Completa objetivos para subir de nivel y ganar monedas.' : 'Complete objectives to level up and earn coins.'}
            </p>
          </div>
        </div>

        {/* Global Progress Indicator Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold">
          <Trophy className="w-3.5 h-3.5" />
          <span>{Math.min(15, currentLevelUnlocked - 1)} / 15</span>
        </div>
      </div>

      {/* Main Responsive Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left column / Top Area: Level grid */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <span className={`text-[10px] uppercase font-bold tracking-widest leading-none ${themeStyles.textSecondary}`}>
            {config.language === 'pt' ? 'Selecione uma Fase' : config.language === 'es' ? 'Selecciona un Nivel' : 'Select a Stage'}
          </span>
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5">
            {CHALLENGE_LEVELS.map((level) => {
              const isUnlocked = level.id <= currentLevelUnlocked;
              const isSelected = level.id === selectedLevelId;
              const stars = levelStars[level.id] || 0;

              return (
                <button
                  id={`level-grid-node-${level.id}`}
                  key={level.id}
                  onClick={() => handleLevelNodeClick(level.id, isUnlocked)}
                  className={`aspect-square rounded-2xl border flex flex-col items-center justify-between p-2.5 transition-all active:scale-95 duration-200 relative ${
                    isUnlocked
                      ? isSelected
                        ? 'shadow-lg border-opacity-100'
                        : `${themeStyles.itemBg} hover:scale-105`
                      : 'border-current/5 bg-current/[0.01] opacity-35 cursor-not-allowed'
                  }`}
                  style={{
                    borderColor: isSelected ? themeStyles.accentColor : undefined,
                    boxShadow: isSelected ? `0 0 14px ${themeStyles.accentColor}33, inset 0 0 8px ${themeStyles.accentColor}22` : undefined,
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.04)' : undefined
                  }}
                >
                  {/* Lock badge in corner if locked */}
                  {!isUnlocked && (
                    <div className="absolute top-1 right-1">
                      <Lock className="w-2.5 h-2.5 text-current opacity-40" />
                    </div>
                  )}

                  {/* Level Number */}
                  <span 
                    className={`text-lg font-black font-serif leading-none mt-1.5 ${
                      isUnlocked 
                        ? isSelected 
                          ? 'text-yellow-500' 
                          : themeStyles.textPrimary 
                        : 'text-current opacity-30'
                    }`}
                  >
                    {level.id}
                  </span>

                  {/* Stars indicators (compact row) */}
                  <div className="flex gap-0.5 mb-1 justify-center w-full">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-2.5 h-2.5 transition-all duration-300 ${
                          isUnlocked && s <= stars 
                            ? 'fill-yellow-500 text-yellow-500 drop-shadow-[0_0_1px_rgba(234,179,8,0.4)]' 
                            : 'text-current opacity-10'
                        }`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column / Bottom Area: Selected level briefing details */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <span className={`text-[10px] uppercase font-bold tracking-widest leading-none ${themeStyles.textSecondary}`}>
            {config.language === 'pt' ? 'Detalhes do Desafio' : config.language === 'es' ? 'Detalles del Desafío' : 'Challenge Briefing'}
          </span>

          <div className={`p-5 rounded-3xl border flex flex-col gap-4.5 shadow-xl transition-all duration-300 relative overflow-hidden ${themeStyles.cardBg}`}>
            {/* Top design background effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Title Block */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-yellow-500 uppercase font-black">
                  {config.language === 'pt' ? `FASE ${selectedLevel.id}` : config.language === 'es' ? `NIVEL ${selectedLevel.id}` : `STAGE ${selectedLevel.id}`}
                </span>
                <h3 className={`text-lg font-black tracking-tight ${themeStyles.textPrimary}`}>
                  {selectedLevel.titleKey}
                </h3>
              </div>

              {/* Selected Stars display */}
              <div className="flex gap-1 bg-yellow-500/5 px-2.5 py-1 rounded-full border border-yellow-500/10">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 transition-all duration-500 ${
                      s <= selectedStars 
                        ? 'fill-yellow-500 text-yellow-500 drop-shadow-[0_0_3px_rgba(234,179,8,0.5)]' 
                        : 'text-current opacity-15'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Description Text */}
            <p className={`text-sm leading-relaxed ${themeStyles.textSecondary}`}>
              {selectedLevel.descKey}
            </p>

            {/* Objective items with icon layout */}
            <div className="flex flex-col gap-2.5 border-t border-b py-4 border-current/10">
              <span className="text-[9px] uppercase font-black tracking-widest text-yellow-500 flex items-center gap-1 leading-none">
                <Target className="w-3.5 h-3.5" />
                {config.language === 'pt' ? 'METAS REQUERIDAS' : config.language === 'es' ? 'REQUISITOS DEL NIVEL' : 'LEVEL OBJECTIVES'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {/* Meta 1: Pontuação */}
                <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${themeStyles.itemBg}`}>
                  <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[8px] uppercase tracking-wider font-bold ${themeStyles.textSecondary}`}>Pontuação</span>
                    <span className={`text-xs font-black font-mono ${themeStyles.textPrimary}`}>
                      {selectedLevel.targetScore.toLocaleString()} pts
                    </span>
                  </div>
                </div>

                {/* Meta 2: Condição Especial */}
                {selectedLevel.specialCondition && (
                  <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${themeStyles.itemBg}`}>
                    <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 animate-pulse">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[8px] uppercase tracking-wider font-bold ${themeStyles.textSecondary}`}>
                        {getSpecialLabel(selectedLevel.specialCondition.type)}
                      </span>
                      <span className={`text-xs font-black font-mono ${themeStyles.textPrimary}`}>
                        {selectedLevel.specialCondition.type === 'no_hints' || selectedLevel.specialCondition.type === 'no_duplicates'
                          ? 'Ativo'
                          : `x${selectedLevel.specialCondition.count}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Meta 3: Limite de movimentos */}
                {selectedLevel.movesLimit && (
                  <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${themeStyles.itemBg}`}>
                    <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[8px] uppercase tracking-wider font-bold ${themeStyles.textSecondary}`}>Limite</span>
                      <span className={`text-xs font-black font-mono ${themeStyles.textPrimary}`}>
                        {selectedLevel.movesLimit} Jogadas
                      </span>
                    </div>
                  </div>
                )}

                {/* Meta 4: Tempo */}
                {selectedLevel.timeLimit && (
                  <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${themeStyles.itemBg}`}>
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[8px] uppercase tracking-wider font-bold ${themeStyles.textSecondary}`}>Cronômetro</span>
                      <span className={`text-xs font-black font-mono ${themeStyles.textPrimary}`}>
                        {selectedLevel.timeLimit}s
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Launch Button */}
            <button
              id="start-challenge-launch-btn"
              onClick={() => {
                SynthAudio.playClick(config.soundEnabled);
                onSelectLevel(selectedLevel.id);
              }}
              className={`py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-3 cursor-pointer shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-95 ${themeStyles.primaryBtn}`}
            >
              <Play className="w-4 h-4 fill-current text-current animate-pulse-subtle" />
              <span>{config.language === 'pt' ? 'INICIAR DESAFIO' : config.language === 'es' ? 'INICIAR DESAFÍO' : 'LAUNCH CHALLENGE'}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
