import React, { useState, useRef, useEffect } from 'react';
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
  { 
    id: 1, 
    titleKey: 'Fase 1: Descongelar', 
    descKey: 'Bem-vindo ao mapa! Derreta 4 blocos de gelo combinando os números adjacentes ou idênticos.', 
    targetScore: 500, 
    specialCondition: { type: 'ice', count: 4 } 
  },
  { 
    id: 2, 
    titleKey: 'Fase 2: Corrida Numérica', 
    descKey: 'O relógio está correndo! Alcance 1.200 pontos antes que o tempo de 60 segundos se esgote.', 
    targetScore: 1200, 
    timeLimit: 60, 
    specialCondition: { type: 'score', count: 1200 } 
  },
  { 
    id: 3, 
    titleKey: 'Fase 3: Desarmar Bombas', 
    descKey: 'Cuidado! 5 bombas estão ativas no tabuleiro. Elimine-as antes que explodam e causem estragos!', 
    targetScore: 1000, 
    specialCondition: { type: 'bombs', count: 5 } 
  },
  { 
    id: 4, 
    titleKey: 'Fase 4: Chave do Enigma', 
    descKey: 'Abra 6 cadeados combinando números vizinhos para liberar as peças travadas.', 
    targetScore: 1500, 
    specialCondition: { type: 'locks', count: 6 } 
  },
  { 
    id: 5, 
    titleKey: 'Fase 5: Economia Tática', 
    descKey: 'Pense antes de agir! Alcance 2.500 pontos usando no máximo 35 movimentos planejados.', 
    targetScore: 2500, 
    movesLimit: 35 
  },
  { 
    id: 6, 
    titleKey: 'Fase 6: Geada Severa', 
    descKey: 'A temperatura caiu drasticamente! Derreta 10 blocos de gelo e pontue pelo menos 3.000.', 
    targetScore: 3000, 
    specialCondition: { type: 'ice', count: 10 } 
  },
  { 
    id: 7, 
    titleKey: 'Fase 7: Sob Pressão', 
    descKey: 'Raciocínio ultrarrápido exigido: faça 4.000 pontos em apenas 80 segundos.', 
    targetScore: 4000, 
    timeLimit: 80 
  },
  { 
    id: 8, 
    titleKey: 'Fase 8: Campo Crítico', 
    descKey: 'Oito bombas voláteis espalhadas no tabuleiro! Neutralize todas e chegue a 5.000 pontos.', 
    targetScore: 5000, 
    specialCondition: { type: 'bombs', count: 8 } 
  },
  { 
    id: 9, 
    titleKey: 'Fase 9: Cadeado Imperial', 
    descKey: 'Destranque 12 cadeados para libertar todo o fluxo de combinações da grade.', 
    targetScore: 6000, 
    specialCondition: { type: 'locks', count: 12 } 
  },
  { 
    id: 10, 
    titleKey: 'Fase 10: Avalanche de Dígitos', 
    descKey: 'Um tabuleiro gigante com dezenas de números! Alcance 8.000 pontos em até 50 jogadas.', 
    targetScore: 8000, 
    movesLimit: 50 
  },
  { 
    id: 11, 
    titleKey: 'Fase 11: Inverno Rigoroso', 
    descKey: 'Derreta 16 blocos de gelo espessos em apenas 45 jogadas. O espaço ficará apertado!', 
    targetScore: 4000, 
    movesLimit: 45,
    specialCondition: { type: 'ice', count: 16 } 
  },
  { 
    id: 12, 
    titleKey: 'Fase 12: Pureza Silenciosa', 
    descKey: 'Alcance 4.500 pontos sem usar NENHUMA dica automática. Confie unicamente no seu olhar.', 
    targetScore: 4500, 
    specialCondition: { type: 'no_hints', count: 1 } 
  },
  { 
    id: 13, 
    titleKey: 'Fase 13: Mestre do Combo', 
    descKey: 'Mantenha a sequência ativa! Consiga um multiplicador de combo de 6x e faça 5.000 pontos.', 
    targetScore: 5000, 
    specialCondition: { type: 'combo_streak', count: 6 } 
  },
  { 
    id: 14, 
    titleKey: 'Fase 14: Varredura Geral', 
    descKey: 'Remova pelo menos 50 números do tabuleiro em 100 segundos para vencer o desafio.', 
    targetScore: 6000, 
    timeLimit: 100,
    specialCondition: { type: 'cleared_numbers', count: 50 } 
  },
  { 
    id: 15, 
    titleKey: 'Fase 15: O Ápice do Zen', 
    descKey: 'Grande teste de meio de jornada: Marque 7.500 pontos em 120s mantendo combo de pelo menos 8x.', 
    targetScore: 7500, 
    timeLimit: 120, 
    specialCondition: { type: 'supreme_zen', count: 8 } 
  },
  { 
    id: 16, 
    titleKey: 'Fase 16: Fusíveis Rápidos', 
    descKey: 'A velocidade aumentou! Detone 10 bombas ativas em no máximo 40 movimentos calculados.', 
    targetScore: 6000, 
    movesLimit: 40,
    specialCondition: { type: 'bombs', count: 10 } 
  },
  { 
    id: 17, 
    titleKey: 'Fase 17: Criptografia Total', 
    descKey: 'Destranque 15 cadeados complexos para descriptografar a grade e pontuar 7.000.', 
    targetScore: 7000, 
    specialCondition: { type: 'locks', count: 15 } 
  },
  { 
    id: 18, 
    titleKey: 'Fase 18: Choque Térmico', 
    descKey: 'Uma perigosa mistura física: derreta 10 blocos de gelo e desarme 6 bombas relógio!', 
    targetScore: 8000, 
    specialCondition: { type: 'ice', count: 10 } 
  },
  { 
    id: 19, 
    titleKey: 'Fase 19: Ampulheta de Aço', 
    descKey: 'Abra 8 cadeados reforçados sob a tensão implacável de um cronômetro de 90 segundos.', 
    targetScore: 9000, 
    timeLimit: 90,
    specialCondition: { type: 'locks', count: 8 } 
  },
  { 
    id: 20, 
    titleKey: 'Fase 20: Fluxo Dimensional', 
    descKey: 'Cruze o portal de fusão! Faça 12.000 pontos em no máximo 45 jogadas meticulosas.', 
    targetScore: 12000, 
    movesLimit: 45,
    specialCondition: { type: 'combo_streak', count: 7 } 
  },
  { 
    id: 21, 
    titleKey: 'Fase 21: Portal Multiplicador', 
    descKey: 'Dobre seus ganhos usando células especiais! Alcance a épica marca de 15.000 pontos.', 
    targetScore: 15000,
    specialCondition: { type: 'supreme_zen', count: 9 }
  },
  { 
    id: 22, 
    titleKey: 'Fase 22: Limpeza Extrema', 
    descKey: 'Limpeza em massa! Remova 80 números do tabuleiro em um limite tenso de 110 segundos.', 
    targetScore: 11000, 
    timeLimit: 110,
    specialCondition: { type: 'cleared_numbers', count: 80 } 
  },
  { 
    id: 23, 
    titleKey: 'Fase 23: Cadeia de Isolamento', 
    descKey: 'Infiltre-se no sistema! Destranque 18 cadeados em 50 jogadas de altíssima precisão.', 
    targetScore: 13000, 
    movesLimit: 50,
    specialCondition: { type: 'locks', count: 18 } 
  },
  { 
    id: 24, 
    titleKey: 'Fase 24: Era Glacial', 
    descKey: 'O tabuleiro inteiro está prestes a congelar! Derreta 20 blocos de gelo em 120 segundos.', 
    targetScore: 14000, 
    timeLimit: 120,
    specialCondition: { type: 'ice', count: 20 } 
  },
  { 
    id: 25, 
    titleKey: 'Fase 25: Arsenal Explosivo', 
    descKey: 'Desarme 12 bombas que ameaçam explodir sua barra de progresso em até 45 jogadas.', 
    targetScore: 16000, 
    movesLimit: 45,
    specialCondition: { type: 'bombs', count: 12 } 
  },
  { 
    id: 26, 
    titleKey: 'Fase 26: Sequência Divina', 
    descKey: 'Domine o algoritmo! Atinja um combo monumental de 10x e marque 18.000 pontos.', 
    targetScore: 18000, 
    timeLimit: 130,
    specialCondition: { type: 'combo_streak', count: 10 } 
  },
  { 
    id: 27, 
    titleKey: 'Fase 27: Labirinto de Vidro', 
    descKey: 'O teste definitivo de resiliência: destrua 15 gelos e rompa 20 cadeados bloqueados!', 
    targetScore: 20000, 
    specialCondition: { type: 'locks', count: 20 } 
  },
  { 
    id: 28, 
    titleKey: 'Fase 28: Inferno de Relógio', 
    descKey: 'Detone 15 bombas de tempo extremamente rápidas em no máximo 150 segundos.', 
    targetScore: 22000, 
    timeLimit: 150,
    specialCondition: { type: 'bombs', count: 15 } 
  },
  { 
    id: 29, 
    titleKey: 'Fase 29: Abismo de Silêncio', 
    descKey: 'Chegue a 25.000 pontos em 60 jogadas sem pedir dicas. Cada erro consome uma vida!', 
    targetScore: 25000, 
    movesLimit: 60,
    specialCondition: { type: 'no_hints', count: 1 } 
  },
  { 
    id: 30, 
    titleKey: 'Fase 30: Divindade Matemática', 
    descKey: 'O cume do NumZen. Consiga impressionantes 35.000 pontos com combo de 12x em até 180 segundos!', 
    targetScore: 35000, 
    timeLimit: 180, 
    specialCondition: { type: 'supreme_zen', count: 12 } 
  }
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

  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current active stage when component mounts
  useEffect(() => {
    setTimeout(() => {
      const activeElement = document.getElementById(`level-node-${selectedLevelId}`);
      if (activeElement && listRef.current) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }, [selectedLevelId]);

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

  // Reordering the winding nodes so that Level 1 is at the bottom of the scroll view
  // and Level 30 is at the top of the scroll view.
  const reversedLevels = [...CHALLENGE_LEVELS].reverse();

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
              {config.language === 'pt' ? 'Mapa de Fases' : config.language === 'es' ? 'Mapa de Niveles' : 'Stage Map'}
            </h2>
            <p className={`text-xs mt-1 ${themeStyles.textSecondary}`}>
              {config.language === 'pt' ? 'Escale a montanha lógica vencendo desafios para ganhar estrelas e moedas.' : config.language === 'es' ? 'Sube la montaña lógica superando desafíos para ganar estrellas y monedas.' : 'Climb the logical mountain by beating challenges to earn stars and coins.'}
            </p>
          </div>
        </div>

        {/* Global Progress Indicator Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold">
          <Trophy className="w-3.5 h-3.5" />
          <span>{Math.min(CHALLENGE_LEVELS.length, currentLevelUnlocked - 1)} / {CHALLENGE_LEVELS.length}</span>
        </div>
      </div>

      {/* Main Responsive Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left column / Top Area: Level visual map track */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className={`text-[10px] uppercase font-bold tracking-widest leading-none ${themeStyles.textSecondary}`}>
              {config.language === 'pt' ? 'Caminho das Fases' : config.language === 'es' ? 'Camino de Niveles' : 'Stage Journey'}
            </span>
            <span className="text-[10px] font-mono font-bold text-yellow-500 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              {config.language === 'pt' ? 'Role para ver tudo' : config.language === 'es' ? 'Desplázate para ver todo' : 'Scroll to view all'}
            </span>
          </div>

          {/* Interactive vertical winding map container */}
          <div 
            ref={listRef}
            className={`w-full h-[500px] overflow-y-auto pr-2 rounded-3xl border p-6 flex flex-col gap-6 relative select-none scrollbar-thin ${themeStyles.cardBg} border-current/10 overflow-x-hidden`}
            style={{
              scrollbarWidth: 'thin',
            }}
          >
            {/* The vertical dashed connection trail down the middle */}
            <div className="absolute top-10 bottom-10 left-1/2 -translate-x-1/2 w-0.5 border-r-2 border-dashed border-current/15 pointer-events-none z-0" />

            {reversedLevels.map((level) => {
              const isUnlocked = level.id <= currentLevelUnlocked;
              const isSelected = level.id === selectedLevelId;
              const stars = levelStars[level.id] || 0;

              // Use mathematical sine wave offset to sway nodes organically left/right!
              // This designs a gorgeous custom winding mountain path.
              const offsetPercent = Math.sin(level.id * 1.1) * 35;

              return (
                <div 
                  key={level.id}
                  id={`level-node-${level.id}`}
                  className="w-full flex justify-center py-2 relative overflow-visible z-10"
                >
                  <button
                    onClick={() => handleLevelNodeClick(level.id, isUnlocked)}
                    className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 relative ${
                      isUnlocked
                        ? isSelected
                          ? 'shadow-2xl scale-110 border-opacity-100 bg-opacity-30'
                          : `${themeStyles.itemBg} hover:scale-105 hover:shadow-lg`
                        : 'border-current/10 bg-zinc-950/40 opacity-40 cursor-not-allowed'
                    }`}
                    style={{
                      transform: `translateX(${offsetPercent}%)`,
                      borderColor: isSelected ? themeStyles.accentColor : undefined,
                      boxShadow: isSelected ? `0 0 20px ${themeStyles.accentColor}55, inset 0 0 10px ${themeStyles.accentColor}33` : undefined,
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : undefined
                    }}
                  >
                    {/* Node Number inside the circle */}
                    <span className={`text-base font-serif font-black ${isUnlocked ? (isSelected ? 'text-yellow-400' : themeStyles.textPrimary) : 'text-current opacity-30'}`}>
                      {level.id}
                    </span>

                    {/* Stars underneath the node inside the circle */}
                    {isUnlocked && stars > 0 && (
                      <div className="absolute -bottom-1.5 flex gap-0.5 justify-center bg-black/85 px-1.5 py-0.5 rounded-full scale-75 border border-yellow-500/20 shadow-sm">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-2 h-2 ${
                              s <= stars 
                                ? 'fill-yellow-500 text-yellow-500' 
                                : 'text-current opacity-10'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Lock icon overlay if locked */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/40 rounded-full backdrop-blur-[1px]">
                        <Lock className="w-4 h-4 text-zinc-500 opacity-60" />
                      </div>
                    )}

                    {/* Active pulsing dashboard ring around the selected node */}
                    {isSelected && (
                      <span className="absolute -inset-2.5 rounded-full border border-dashed border-yellow-500/40 animate-[spin_10s_linear_infinite] pointer-events-none" />
                    )}
                  </button>

                  {/* Desktop Stage Label adjacent to node */}
                  {isSelected && (
                    <div 
                      className="absolute hidden md:flex flex-col bg-zinc-900/95 text-zinc-100 text-[9px] font-black tracking-widest py-1 px-2.5 rounded-xl border border-yellow-500/30 shadow-lg pointer-events-none"
                      style={{
                        transform: `translateX(calc(${offsetPercent}% + 75px))`,
                      }}
                    >
                      <span className="text-yellow-400 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-yellow-400 animate-pulse" />
                        {config.language === 'pt' ? 'VOCÊ ESTÁ AQUI' : config.language === 'es' ? 'ESTÁS AQUÍ' : 'YOU ARE HERE'}
                      </span>
                    </div>
                  )}
                </div>
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
