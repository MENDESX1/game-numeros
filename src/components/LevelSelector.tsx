import React, { useState, useRef, useEffect } from 'react';
import { GameConfig, ChallengeLevel } from '../types';
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

export const CHALLENGE_LEVELS: ChallengeLevel[] = [
  { 
    id: 1, 
    titlePT: 'Fase 1: Introdução Suave', 
    titleEN: 'Stage 1: Gentle Intro', 
    titleES: 'Nivel 1: Introducción Suave', 
    descPT: 'Bem-vindo! Combine pares de números idênticos ou que somam 10 para atingir a meta básica.', 
    descEN: 'Welcome! Match pairs of identical numbers or those that sum to 10 to reach the basic goal.', 
    descES: '¡Bienvenido! Empareja números idénticos o que sumen 10 para alcanzar el objetivo básico.', 
    cols: 5, 
    rows: 5, 
    targetScore: 300, 
    movesLimit: 25, 
    objective: { type: 'pairs', count: 5 } 
  },
  { 
    id: 2, 
    titlePT: 'Fase 2: Toque de Gelo', 
    titleEN: 'Stage 2: Ice Touch', 
    titleES: 'Nivel 2: Toque de Hielo', 
    descPT: 'Derreta 3 blocos de gelo combinando números adjacentes a eles ou as próprias células congeladas.', 
    descEN: 'Melt 3 ice blocks by matching numbers adjacent to them or the frozen cells themselves.', 
    descES: 'Derrite 3 bloques de hielo combinando números adyacentes a ellos o las propias celdas congeladas.', 
    cols: 5, 
    rows: 6, 
    targetScore: 500, 
    movesLimit: 30, 
    specialObstacles: { frozen: 3 }, 
    objective: { type: 'ice', count: 3 } 
  },
  { 
    id: 3, 
    titlePT: 'Fase 3: O Mistério Começa', 
    titleEN: 'Stage 3: Mystery Begins', 
    titleES: 'Nivel 3: Comienza el Misterio', 
    descPT: 'Algumas casas estão escondidas! Toque nelas para revelar o número e seus vizinhos imediatos.', 
    descEN: 'Some cells are hidden! Tap them to reveal their number and their immediate neighbors.', 
    descES: '¡Algunas celdas están ocultas! Tócalas para revelar su número y sus vecinos inmediatos.', 
    cols: 6, 
    rows: 6, 
    targetScore: 800, 
    movesLimit: 30, 
    mysteryCellsCount: 4, 
    objective: { type: 'score', count: 800 } 
  },
  { 
    id: 4, 
    titlePT: 'Fase 4: Chave e Cadeado', 
    titleEN: 'Stage 4: Lock and Key', 
    titleES: 'Nivel 4: Llave y Candado', 
    descPT: 'Abra 4 cadeados fazendo combinações adjacentes a eles para libertar as peças travadas.', 
    descEN: 'Unlock 4 padlocks by making adjacent matches to free the locked numbers.', 
    descES: 'Desbloquea 4 candados haciendo combinaciones adyacentes a ellos para liberar los números trabados.', 
    cols: 6, 
    rows: 6, 
    targetScore: 1000, 
    movesLimit: 30, 
    specialObstacles: { locked: 4 }, 
    objective: { type: 'locks', count: 4 } 
  },
  { 
    id: 5, 
    titlePT: 'Fase 5: Conexão Dez', 
    titleEN: 'Stage 5: Ten Connection', 
    titleES: 'Nivel 5: Conexión Diez', 
    descPT: 'Aprenda a focar na soma dez! Remova 8 pares que somam exatamente 10 neste tabuleiro esticado.', 
    descEN: 'Learn to focus on the sum of ten! Remove 8 pairs that sum to exactly 10 on this stretched board.', 
    descES: '¡Aprende a enfocarte en la suma de diez! Elimina 8 parejas que sumen exactamente 10 en este tablero.', 
    cols: 6, 
    rows: 7, 
    targetScore: 1200, 
    movesLimit: 35, 
    objective: { type: 'sum_ten', count: 8 } 
  },
  { 
    id: 6, 
    titlePT: 'Fase 6: Fusível Quente', 
    titleEN: 'Stage 6: Hot Fuse', 
    titleES: 'Nivel 6: Fusible Caliente', 
    descPT: 'Cuidado! 3 bombas relógio estão ativas. Combine-as antes que seu timer zere e cause danos!', 
    descEN: 'Watch out! 3 active time bombs are on the grid. Match them before their timer hits zero!', 
    descES: '¡Cuidado! 3 bombas de tiempo están activas. ¡Emparéjalas antes de que su temporizador llegue a cero!', 
    cols: 6, 
    rows: 7, 
    targetScore: 1500, 
    timeLimit: 90, 
    specialObstacles: { bombs: 3 }, 
    objective: { type: 'bombs', count: 3 } 
  },
  { 
    id: 7, 
    titlePT: 'Fase 7: Espaço Vazio', 
    titleEN: 'Stage 7: Empty Space', 
    titleES: 'Nivel 7: Espacio Vacío', 
    descPT: 'O tabuleiro começa com 15% de espaços vazios. Encontre caminhos por cima dessas lacunas!', 
    descEN: 'The board starts with 15% empty spaces. Find matching paths across these gaps!', 
    descES: 'El tablero comienza con un 15% de espacios vacíos. ¡Encuentra caminos sobre estas brechas!', 
    cols: 7, 
    rows: 7, 
    targetScore: 1800, 
    movesLimit: 40, 
    emptyCellsPercentage: 0.15, 
    objective: { type: 'clear_board', count: 1 } 
  },
  { 
    id: 8, 
    titlePT: 'Fase 8: Coleção de Setes', 
    titleEN: 'Stage 8: Lucky Sevens', 
    titleES: 'Nivel 8: Colección de Sietes', 
    descPT: 'Foco absoluto! Você precisa remover pelo menos 8 pares do número 7 para concluir a fase.', 
    descEN: 'Absolute focus! You need to remove at least 8 pairs of the number 7 to clear the stage.', 
    descES: '¡Enfoque absoluto! Debes eliminar al menos 8 parejas del número 7 para completar el nivel.', 
    cols: 7, 
    rows: 7, 
    targetScore: 2000, 
    movesLimit: 35, 
    mysteryCellsCount: 3, 
    objective: { type: 'same_number', count: 8, targetValue: 7 } 
  },
  { 
    id: 9, 
    titlePT: 'Fase 9: Congelamento Severo', 
    titleEN: 'Stage 9: Severe Freeze', 
    titleES: 'Nivel 9: Congelación Severa', 
    descPT: 'O inverno chegou! Derreta os 6 blocos de gelo espalhados antes que você fique sem jogadas.', 
    descEN: 'Winter is here! Melt all 6 scattered ice blocks before running out of available moves.', 
    descES: '¡El invierno está aquí! Derrite los 6 bloques de hielo antes de quedarte sin movimientos.', 
    cols: 7, 
    rows: 8, 
    targetScore: 2500, 
    movesLimit: 40, 
    specialObstacles: { frozen: 6 }, 
    objective: { type: 'ice', count: 6 } 
  },
  { 
    id: 10, 
    titlePT: 'Fase 10: Nevoeiro Intenso', 
    titleEN: 'Stage 10: Thick Fog', 
    titleES: 'Nivel 10: Niebla Densa', 
    descPT: 'Dez casas misteriosas cobrem o tabuleiro! Toque com cautela para desvendar os caminhos ocultos.', 
    descEN: 'Ten mystery cells cover the board! Tap cautiously to unveil the hidden pairing paths.', 
    descES: '¡Diez celdas misteriosas cubren el tablero! Toca con cuidado para revelar los caminos ocultos.', 
    cols: 8, 
    rows: 8, 
    targetScore: 3000, 
    movesLimit: 45, 
    mysteryCellsCount: 10, 
    objective: { type: 'score', count: 3000 } 
  },
  { 
    id: 11, 
    titlePT: 'Fase 11: Multiplicadores Ativos', 
    titleEN: 'Stage 11: Active Multipliers', 
    titleES: 'Nivel 11: Multiplicadores Activos', 
    descPT: 'Células douradas multiplicam os pontos de suas combinações. Use-as para bater os 4.000 pontos!', 
    descEN: 'Golden cells multiply your match scores. Utilize them strategicially to beat 4,000 points!', 
    descES: 'Las celdas doradas multiplican los puntos de tus parejas. ¡Úsalas para superar los 4,000 puntos!', 
    cols: 8, 
    rows: 8, 
    targetScore: 4000, 
    movesLimit: 45, 
    specialObstacles: { multipliers: 6 }, 
    objective: { type: 'score', count: 4000 } 
  },
  { 
    id: 12, 
    titlePT: 'Fase 12: Portais Unidos', 
    titleEN: 'Stage 12: Twin Portals', 
    titleES: 'Nivel 12: Portales Gemelos', 
    descPT: 'As peças de portal se conectam à distância! Remova 25 pares quaisquer para vencer.', 
    descEN: 'Portal tiles connect across distances! Remove any 25 pairs of tiles to complete.', 
    descES: '¡Las piezas de portal se conectan a distancia! Elimina 25 parejas cualesquiera para ganar.', 
    cols: 8, 
    rows: 8, 
    targetScore: 4500, 
    movesLimit: 45, 
    specialObstacles: { portals: 3 }, 
    objective: { type: 'pairs', count: 25 } 
  },
  { 
    id: 13, 
    titlePT: 'Fase 13: Labirinto Deserto', 
    titleEN: 'Stage 13: Desert Maze', 
    titleES: 'Nivel 13: Laberinto Desierto', 
    descPT: '25% de espaços vazios e 6 cadeados pesados! Planeje as chaves para destravar as rotas.', 
    descEN: '25% empty gaps and 6 heavy padlocks! Plan your keys carefully to unlock clean routes.', 
    descES: '¡25% de huecos vacíos y 6 candados pesados! Planifica tus llaves para desbloquear rutas limpias.', 
    cols: 8, 
    rows: 9, 
    targetScore: 5000, 
    movesLimit: 45, 
    emptyCellsPercentage: 0.25, 
    specialObstacles: { locked: 6 }, 
    mysteryCellsCount: 2, 
    objective: { type: 'locks', count: 6 } 
  },
  { 
    id: 14, 
    titlePT: 'Fase 14: Combo Mestre', 
    titleEN: 'Stage 14: Combo Master', 
    titleES: 'Nivel 14: Maestro del Combo', 
    descPT: 'Mantenha o ritmo acelerado! Consiga um multiplicador de combo de 5x antes do tempo acabar.', 
    descEN: 'Keep up the fast pace! Achieve a 5x combo multiplier streak before time runs out.', 
    descES: '¡Mantén el ritmo acelerado! Consigue un multiplicador de combo de 5x antes de que se acabe el tiempo.', 
    cols: 8, 
    rows: 9, 
    targetScore: 5500, 
    timeLimit: 120, 
    objective: { type: 'combos', count: 5 } 
  },
  { 
    id: 15, 
    titlePT: 'Fase 15: Varredura Completa', 
    titleEN: 'Stage 15: Clean Sweep', 
    titleES: 'Nivel 15: Barrido Completo', 
    descPT: 'Grande teste de meio de jornada! Limpe absolutamente todas as peças do tabuleiro de jogo.', 
    descEN: 'Mid-journey check! Completely wipe every single active number block off the board.', 
    descES: '¡Gran prueba de mitad de camino! Limpia absolutamente todas las piezas de este tablero.', 
    cols: 9, 
    rows: 9, 
    targetScore: 7000, 
    movesLimit: 50, 
    emptyCellsPercentage: 0.10, 
    specialObstacles: { frozen: 8, locked: 4 }, 
    mysteryCellsCount: 5, 
    objective: { type: 'clear_board', count: 1 } 
  },
  { 
    id: 16, 
    titlePT: 'Fase 16: Desafio dos Noves', 
    titleEN: 'Stage 16: Nines Challenge', 
    titleES: 'Nivel 16: Desafío de Nueves', 
    descPT: 'Elimine 10 pares formados exclusivamente pelo dígito 9. Use as casas misteriosas para ajudar!', 
    descEN: 'Eliminate 10 pairs made exclusively of the digit 9. Tap the mystery cells for help!', 
    descES: 'Elimina 10 parejas del dígito 9. ¡Usa las celdas misteriosas para ayudarte a encontrarlos!', 
    cols: 9, 
    rows: 9, 
    targetScore: 6500, 
    movesLimit: 50, 
    mysteryCellsCount: 8, 
    objective: { type: 'same_number', count: 10, targetValue: 9 } 
  },
  { 
    id: 17, 
    titlePT: 'Fase 17: Arsenal Explosivo', 
    titleEN: 'Stage 17: Explosive Arsenal', 
    titleES: 'Nivel 17: Arsenal Explosivo', 
    descPT: 'Oito bombas voláteis ativas! Desarme todas combinando-as rapidamente para pontuar.', 
    descEN: 'Eight volatile active bombs! Defuse all of them by making matches quickly to earn score.', 
    descES: '¡Ocho bombas activas! Desármalas a todas emparejándolas rápidamente para ganar puntos.', 
    cols: 9, 
    rows: 9, 
    targetScore: 7500, 
    movesLimit: 50, 
    specialObstacles: { bombs: 8 }, 
    objective: { type: 'bombs', count: 8 } 
  },
  { 
    id: 18, 
    titlePT: 'Fase 18: Inverno Cósmico', 
    titleEN: 'Stage 18: Cosmic Freeze', 
    titleES: 'Nivel 18: Invierno Cósmico', 
    descPT: 'A geada bloqueou 12 posições! Derreta todo o gelo sob a tensão implacável do cronômetro.', 
    descEN: 'Frost blocks 12 positions! Melt all the ice under the relentless pressure of the timer.', 
    descES: '¡La helada bloqueó 12 posiciones! Derrite todo el hielo bajo la presión del temporizador.', 
    cols: 9, 
    rows: 10, 
    targetScore: 8500, 
    timeLimit: 150, 
    specialObstacles: { frozen: 12 }, 
    objective: { type: 'ice', count: 12 } 
  },
  { 
    id: 19, 
    titlePT: 'Fase 19: Ponte Dimensional', 
    titleEN: 'Stage 19: Wormhole Bridge', 
    titleES: 'Nivel 19: Puente Gusano', 
    descPT: 'Portais distorcem o espaço com 20% de lacunas vazias. Faça 40 pares de combinações.', 
    descEN: 'Portals bend space on a board with 20% empty gaps. Achieve 40 pairs of matches.', 
    descES: 'Los portales doblan el espacio en un tablero con 20% de huecos. Consigue 40 parejas.', 
    cols: 9, 
    rows: 10, 
    targetScore: 9000, 
    movesLimit: 55, 
    emptyCellsPercentage: 0.20, 
    specialObstacles: { portals: 4 }, 
    mysteryCellsCount: 4, 
    objective: { type: 'pairs', count: 40 } 
  },
  { 
    id: 20, 
    titlePT: 'Fase 20: Templo Oculto', 
    titleEN: 'Stage 20: Hidden Temple', 
    titleES: 'Nivel 20: Templo Oculto', 
    descPT: 'Quinze casas misteriosas dominam o santuário! Remova 15 pares que somam 10 debaixo da névoa.', 
    descEN: 'Fifteen mystery cells dominate the shrine! Remove 15 pairs summing to 10 beneath the mist.', 
    descES: '¡Quince celdas ocultas dominan el santuario! Elimina 15 parejas que sumen 10 bajo la niebla.', 
    cols: 9, 
    rows: 10, 
    targetScore: 10000, 
    movesLimit: 60, 
    mysteryCellsCount: 15, 
    objective: { type: 'sum_ten', count: 15 } 
  },
  { 
    id: 21, 
    titlePT: 'Fase 21: Economia Extrema', 
    titleEN: 'Stage 21: Extreme Economy', 
    titleES: 'Nivel 21: Economía Extrema', 
    descPT: 'Pense muito antes de cada toque! Atinja 11.000 pontos com apenas 30 jogadas limitadas.', 
    descEN: 'Think deeply before every tap! Hit 11,000 points with only 30 strictly limited moves.', 
    descES: '¡Piensa muy bien antes de cada toque! Alcanza 11,000 puntos con solo 30 jugadas limitadas.', 
    cols: 10, 
    rows: 10, 
    targetScore: 11000, 
    movesLimit: 30, 
    specialObstacles: { multipliers: 8 }, 
    objective: { type: 'score', count: 11000 } 
  },
  { 
    id: 22, 
    titlePT: 'Fase 22: Grande Faxina', 
    titleEN: 'Stage 22: Big Clean Up', 
    titleES: 'Nivel 22: Gran Limpieza', 
    descPT: 'Um tabuleiro gigante que começa 30% vazio. Você precisará limpar todas as células ativas.', 
    descEN: 'A massive grid starting 30% empty. You must sweep all remaining active numbers to win.', 
    descES: 'Un tablero gigante que comienza 30% vacío. Debes limpiar todas las celdas activas para ganar.', 
    cols: 10, 
    rows: 10, 
    targetScore: 12000, 
    movesLimit: 60, 
    emptyCellsPercentage: 0.30, 
    objective: { type: 'clear_board', count: 1 } 
  },
  { 
    id: 23, 
    titlePT: 'Fase 23: Fusão Caótica', 
    titleEN: 'Stage 23: Chaotic Fusion', 
    titleES: 'Nivel 23: Fusión Caótica', 
    descPT: 'Uma mistura de 10 blocos de gelo e 8 cadeados reforçados. Abra os cadeados primeiro!', 
    descEN: 'A tough mix of 10 ice blocks and 8 reinforced padlocks. Break those locks open first!', 
    descES: 'Una mezcla de 10 bloques de hielo y 8 candados reforzados. ¡Abre los candados primero!', 
    cols: 10, 
    rows: 10, 
    targetScore: 13000, 
    movesLimit: 60, 
    specialObstacles: { frozen: 10, locked: 8 }, 
    mysteryCellsCount: 6, 
    objective: { type: 'locks', count: 8 } 
  },
  { 
    id: 24, 
    titlePT: 'Fase 24: Crise Nuclear', 
    titleEN: 'Stage 24: Nuclear Crisis', 
    titleES: 'Nivel 24: Crisis Nuclear', 
    descPT: 'Oito ogivas de tempo prestes a explodir! Encontre os pares antes de ficar sem tempo.', 
    descEN: 'Eight time warheads about to detonate! Find the matching pairs before time expires.', 
    descES: '¡Ocho ojivas de tiempo a punto de estallar! Encuentra las parejas antes de que se acabe el tiempo.', 
    cols: 10, 
    rows: 11, 
    targetScore: 14000, 
    timeLimit: 180, 
    specialObstacles: { bombs: 8 }, 
    objective: { type: 'bombs', count: 8 } 
  },
  { 
    id: 25, 
    titlePT: 'Fase 25: Perfeição Zen', 
    titleEN: 'Stage 25: Zen Perfection', 
    titleES: 'Nivel 25: Perfección Zen', 
    descPT: 'Entre no fluxo absoluto. Obtenha um multiplicador de combo de 8x para concluir este desafio.', 
    descEN: 'Enter the absolute flow state. Reach an epic 8x combo multiplier to clear this challenge.', 
    descES: 'Entra en el estado de flujo absoluto. Consigue un combo de 8x para superar este desafío.', 
    cols: 10, 
    rows: 11, 
    targetScore: 15000, 
    movesLimit: 65, 
    mysteryCellsCount: 5, 
    objective: { type: 'combos', count: 8 } 
  },
  { 
    id: 26, 
    titlePT: 'Fase 26: Colecionador de Cincos', 
    titleEN: 'Stage 26: Five Collector', 
    titleES: 'Nivel 26: Colector de Cincos', 
    descPT: 'Colete 15 pares do algarismo 5. Cuidado com as 12 casas de névoa cobrindo os números.', 
    descEN: 'Collect 15 pairs of the digit 5. Beware of the 12 mist cells covering the numbers.', 
    descES: 'Colecciona 15 parejas del dígito 5. Cuidado con las 12 celdas de niebla que cubren los números.', 
    cols: 10, 
    rows: 11, 
    targetScore: 16000, 
    movesLimit: 65, 
    mysteryCellsCount: 12, 
    objective: { type: 'same_number', count: 15, targetValue: 5 } 
  },
  { 
    id: 27, 
    titlePT: 'Fase 27: Caminho Estreito', 
    titleEN: 'Stage 27: Narrow Path', 
    titleES: 'Nivel 27: Camino Estrecho', 
    descPT: '40% do tabuleiro inicial está vazio! Conecte as peças pelas poucas pontes ativas.', 
    descEN: '40% of the initial grid is empty! Connect pieces through the few active bridges.', 
    descES: '¡El 40% del tablero inicial está vacío! Conecta las piezas a través de los pocos puentes.', 
    cols: 11, 
    rows: 11, 
    targetScore: 18000, 
    movesLimit: 70, 
    emptyCellsPercentage: 0.40, 
    specialObstacles: { frozen: 8, locked: 6, portals: 2 }, 
    mysteryCellsCount: 8, 
    objective: { type: 'pairs', count: 50 } 
  },
  { 
    id: 28, 
    titlePT: 'Fase 28: Prisão Glacial', 
    titleEN: 'Stage 28: Glacial Prison', 
    titleES: 'Nivel 28: Prisión Glacial', 
    descPT: 'Vinte blocos congelados prendem as combinações! Use sua visão espacial para derreter tudo.', 
    descEN: 'Twenty frozen blocks lock the combinations! Use your spatial vision to melt them all.', 
    descES: '¡Veinte bloques congelados bloquean el tablero! Usa tu visión espacial para derretirlo todo.', 
    cols: 11, 
    rows: 11, 
    targetScore: 20000, 
    movesLimit: 75, 
    specialObstacles: { frozen: 20 }, 
    objective: { type: 'ice', count: 20 } 
  },
  { 
    id: 29, 
    titlePT: 'Fase 29: Névoa Absoluta', 
    titleEN: 'Stage 29: Absolute Mist', 
    titleES: 'Nivel 29: Niebla Absoluta', 
    descPT: 'O tabuleiro está quase todo escuro com 25 casas misteriosas! Faça 30 somas dez.', 
    descEN: 'The board is almost fully dark with 25 mystery cells! Complete 30 pairs summing to 10.', 
    descES: '¡El tablero está casi oscuro con 25 celdas misteriosas! Consigue 30 parejas que sumen 10.', 
    cols: 11, 
    rows: 12, 
    targetScore: 22000, 
    movesLimit: 80, 
    mysteryCellsCount: 25, 
    objective: { type: 'sum_ten', count: 30 } 
  },
  { 
    id: 30, 
    titlePT: 'Fase 30: Portal da Divindade', 
    titleEN: 'Stage 30: Gate of Divinity', 
    titleES: 'Nivel 30: Portal de la Divinidad', 
    descPT: 'O teste supremo de NumZen! Vença todos os obstáculos e limpe completamente o tabuleiro.', 
    descEN: 'The ultimate test of NumZen! Conquer all obstacles and fully clear the entire board.', 
    descES: '¡La prueba de fuego de NumZen! Conquista todos los obstáculos y limpia por completo el tablero.', 
    cols: 12, 
    rows: 12, 
    targetScore: 30000, 
    movesLimit: 90, 
    emptyCellsPercentage: 0.15, 
    specialObstacles: { frozen: 15, locked: 10, bombs: 5, portals: 4, multipliers: 8 }, 
    mysteryCellsCount: 10, 
    objective: { type: 'clear_board', count: 1 } 
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

  const getObjectiveLabel = (obj: { type: string; count: number; targetValue?: number }) => {
    switch (obj.type) {
      case 'score':
        return config.language === 'pt' ? 'Atingir Pontuação' : config.language === 'es' ? 'Alcanzar Puntos' : 'Reach Score';
      case 'pairs':
        return config.language === 'pt' ? 'Remover Pares' : config.language === 'es' ? 'Eliminar Pares' : 'Remove Pairs';
      case 'clear_board':
        return config.language === 'pt' ? 'Limpar Tabuleiro' : config.language === 'es' ? 'Limpiar Tablero' : 'Clear Board';
      case 'same_number':
        return config.language === 'pt' ? `Remover Pares de ${obj.targetValue}` : config.language === 'es' ? `Eliminar Parejas de ${obj.targetValue}` : `Remove Pairs of ${obj.targetValue}`;
      case 'sum_ten':
        return config.language === 'pt' ? 'Pares que Somam 10' : config.language === 'es' ? 'Parejas que Suman 10' : 'Pairs Summing to 10';
      case 'ice':
        return config.language === 'pt' ? 'Derreter Gelo' : config.language === 'es' ? 'Derretir Hielo' : 'Melt Ice';
      case 'locks':
        return config.language === 'pt' ? 'Abrir Cadeados' : config.language === 'es' ? 'Abrir Candados' : 'Unlock Padlocks';
      case 'bombs':
        return config.language === 'pt' ? 'Desarmar Bombas' : config.language === 'es' ? 'Desarmar Bombas' : 'Defuse Bombs';
      case 'combos':
        return config.language === 'pt' ? 'Multiplicador de Combo' : config.language === 'es' ? 'Multiplicador de Combo' : 'Combo Multiplier';
      default:
        return obj.type;
    }
  };

  const getObjectiveCountLabel = (obj: { type: string; count: number }) => {
    if (obj.type === 'clear_board') {
      return config.language === 'pt' ? 'Completo' : config.language === 'es' ? 'Completo' : 'Complete';
    }
    if (obj.type === 'combos') {
      return `${obj.count}x`;
    }
    return `x${obj.count}`;
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
                  {config.language === 'es' ? selectedLevel.titleES : config.language === 'en' ? selectedLevel.titleEN : selectedLevel.titlePT}
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
              {config.language === 'es' ? selectedLevel.descES : config.language === 'en' ? selectedLevel.descEN : selectedLevel.descPT}
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
                    <span className={`text-[8px] uppercase tracking-wider font-bold ${themeStyles.textSecondary}`}>
                      {config.language === 'pt' ? 'Pontuação' : config.language === 'es' ? 'Puntos' : 'Score'}
                    </span>
                    <span className={`text-xs font-black font-mono ${themeStyles.textPrimary}`}>
                      {selectedLevel.targetScore.toLocaleString()} pts
                    </span>
                  </div>
                </div>

                {/* Meta 2: Objetivo Primário de Fase */}
                {selectedLevel.objective && (
                  <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${themeStyles.itemBg}`}>
                    <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 animate-pulse">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[8px] uppercase tracking-wider font-bold ${themeStyles.textSecondary}`}>
                        {getObjectiveLabel(selectedLevel.objective)}
                      </span>
                      <span className={`text-xs font-black font-mono ${themeStyles.textPrimary}`}>
                        {getObjectiveCountLabel(selectedLevel.objective)}
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
                      <span className={`text-[8px] uppercase tracking-wider font-bold ${themeStyles.textSecondary}`}>
                        {config.language === 'pt' ? 'Limite' : config.language === 'es' ? 'Límite' : 'Limit'}
                      </span>
                      <span className={`text-xs font-black font-mono ${themeStyles.textPrimary}`}>
                        {selectedLevel.movesLimit} {config.language === 'pt' ? 'Jogadas' : config.language === 'es' ? 'Jugadas' : 'Moves'}
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
                      <span className={`text-[8px] uppercase tracking-wider font-bold ${themeStyles.textSecondary}`}>
                        {config.language === 'pt' ? 'Cronômetro' : config.language === 'es' ? 'Cronómetro' : 'Timer'}
                      </span>
                      <span className={`text-xs font-black font-mono ${themeStyles.textPrimary}`}>
                        {selectedLevel.timeLimit}s
                      </span>
                    </div>
                  </div>
                )}

                {/* Meta 5: Casas Misteriosas */}
                {selectedLevel.mysteryCellsCount && selectedLevel.mysteryCellsCount > 0 ? (
                  <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${themeStyles.itemBg}`}>
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[8px] uppercase tracking-wider font-bold ${themeStyles.textSecondary}`}>
                        {config.language === 'pt' ? 'Misteriosos' : config.language === 'es' ? 'Misteriosos' : 'Mystery Cells'}
                      </span>
                      <span className={`text-xs font-black font-mono ${themeStyles.textPrimary}`}>
                        x{selectedLevel.mysteryCellsCount}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Launch Button */}
            <button
              id="start-challenge-launch-btn"
              onClick={() => {
                SynthAudio.playClick(config.soundEnabled);
                onSelectLevel(selectedLevel.id);
              }}
              className={`py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-3 cursor-pointer shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-95 ${themeStyles.primaryBtn} mt-4`}
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
