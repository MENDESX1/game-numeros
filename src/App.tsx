import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameMode, Difficulty, Cell, UserProfile, UserStats, GameConfig, GameMission, Achievement } from './types';
import { THEMES, TRANSLATIONS, DEFAULT_ACHIEVEMENTS, SHOP_ITEMS } from './config/gameConfig';
import { GameEngine } from './core/gameEngine';
import { GameStorage } from './storage/db';
import { HistorySystem } from "./core/historySystem";
import { SynthAudio } from './audio/synth';

// Icons
import {
  Play, Settings, Trophy, ShoppingBag, Target, BarChart3, ChevronLeft,
  Plus, Lightbulb, Clock, Flame, Coins, Crown, Sparkles, AlertCircle,
  HelpCircle, Volume2, RotateCcw, X, Info, Star, Shuffle, Undo2, Heart, Infinity, Gift
} from 'lucide-react';

// Components
import { GameGrid } from './components/GameGrid';
import { ConfigModal } from './components/ConfigModal';
import { StatsModal } from './components/StatsModal';
import { MissionsModal } from './components/MissionsModal';
import { AchievementsModal } from './components/AchievementsModal';
import { ShopModal } from './components/ShopModal';
import { LevelSelector, CHALLENGE_LEVELS } from './components/LevelSelector';
import { InfoPanel } from './components/InfoPanel';
import { SplashScreen } from './components/SplashScreen';
import { TutorialOverlay } from './components/TutorialOverlay';
import { PauseModal } from './components/PauseModal';

const modeDetails = {
  pt: {
    campaign: { title: 'Modo Campanha', desc: 'Supere níveis estratégicos e colete estrelas' },
    classic: { title: 'Modo Clássico', desc: 'Estilo tradicional, limpe o tabuleiro com calma' },
    relax: { title: 'Modo Zen', desc: 'Foco puro e música relaxante, sem pressões' },
    timed: { title: 'Contra o Tempo', desc: 'Desafio dinâmico contra o cronômetro' },
    survival: { title: 'Sobrevivência', desc: 'O tabuleiro sobe! Elimine peças rápido' },
    infinite: { title: 'Modo Infinito', desc: 'Jogue livremente sem limite de peças' },
    resume: { title: 'Continuar Partida', desc: 'Voltar ao seu jogo em andamento' }
  },
  en: {
    campaign: { title: 'Campaign Mode', desc: 'Conquer tactical levels and collect stars' },
    classic: { title: 'Classic Mode', desc: 'Traditional style, clear the board at your pace' },
    relax: { title: 'Zen Mode', desc: 'Pure focus and relaxing music, no pressure' },
    timed: { title: 'Time Attack', desc: 'Fast-paced race against the clock' },
    survival: { title: 'Survival', desc: 'The board rises! Eliminate quickly' },
    infinite: { title: 'Infinite Mode', desc: 'Play freely without any limits' },
    resume: { title: 'Resume Game', desc: 'Return to your active session' }
  },
  es: {
    campaign: { title: 'Modo Campaña', desc: 'Conquista niveles tácticos y gana estrellas' },
    classic: { title: 'Modo Clásico', desc: 'Estilo tradicional, limpia el tablero con calma' },
    relax: { title: 'Modo Zen', desc: 'Enfoque puro y música de relax, sin prisa' },
    timed: { title: 'Contra Reloj', desc: 'Desafío dinámico contra el cronómetro' },
    survival: { title: 'Supervivencia', desc: '¡El tablero sube! Elimina rápido' },
    infinite: { title: 'Modo Infinito', desc: 'Juega libremente sin ningún límite' },
    resume: { title: 'Continuar Partida', desc: 'Volver a tu juego activo' }
  }
};

export default function App() {
  // Navigation & View states
  const [view, setView] = useState<'menu' | 'levels' | 'game'>('menu');
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Navigation & system states
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Tutorial states
  const [seenTutorial, setSeenTutorial] = useState<boolean>(() => {
    return localStorage.getItem('numzen_seen_tutorial') === 'true';
  });
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  
  // Game config & Customizations states
  const [config, setConfig] = useState<GameConfig>(GameStorage.getConfig());
  const [profile, setProfile] = useState<UserProfile>(GameStorage.getProfile());
  const [stats, setStats] = useState<UserStats>(GameStorage.getStats());
  const [missions, setMissions] = useState<GameMission[]>(GameStorage.getMissions());
  const [achievements, setAchievements] = useState<Achievement[]>(GameStorage.getAchievements());

  // Active game states
  const [mode, setMode] = useState<GameMode>('classic');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [levelId, setLevelId] = useState<number | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [cols, setCols] = useState<number>(9);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  // Timers & Counters
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [movesLeft, setMovesLeft] = useState<number>(0);
  const [survivalTick, setSurvivalTick] = useState<number>(12);
  const [survivalRewardMilestone, setSurvivalRewardMilestone] = useState<number>(1);
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);
  
  // Match objectives (for Challenge Mode)
  const [clearedIce, setClearedIce] = useState<number>(0);
  const [clearedLocks, setClearedLocks] = useState<number>(0);
  const [clearedBombs, setClearedBombs] = useState<number>(0);
  const [linesAddedCount, setLinesAddedCount] = useState<number>(0);
  const [maxComboInLevel, setMaxComboInLevel] = useState<number>(1);
  const [clearedNumbersCount, setClearedNumbersCount] = useState<number>(0);
  const [levelPairsMatched, setLevelPairsMatched] = useState<number>(0);
  const [levelSumTenMatched, setLevelSumTenMatched] = useState<number>(0);

  // Mistakes/Lives, Shuffles, Locks, and Errors
  const [lives, setLives] = useState<number>(5);
  const [maxLives, setMaxLives] = useState<number>(5);
  const [shufflesLeft, setShufflesLeft] = useState<number>(3);
  const [invalidMatch, setInvalidMatch] = useState<{ idxA: number; idxB: number; message: string } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [isBoardLocked, setIsBoardLocked] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);

  // Kinetic game-feel animations and visual fx states
  const [animatingMatch, setAnimatingMatch] = useState<{
    idxA: number;
    idxB: number;
    r1: number;
    c1: number;
    r2: number;
    c2: number;
  } | null>(null);
  const [activeExplosions, setActiveExplosions] = useState<{ id: string; idx: number; color: string }[]>([]);
  const [floatingScores, setFloatingScores] = useState<{ id: string; idx: number; text: string }[]>([]);

  const showToast = (text: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 2500);
  };
  const [powersUsed, setPowersUsed] = useState<number>(0);
  const [victoryBreakdown, setVictoryBreakdown] = useState<{
    baseScore: number;
    difficultyBonus: number;
    timeBonus: number;
    cleanBonus: number;
    finalScore: number;
  } | null>(null);

  // Status Modals / Popups
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [victory, setVictory] = useState<boolean>(false);
  const [showLevelUp, setShowLevelUp] = useState<boolean>(false);
  const [newUnlockedLevel, setNewUnlockedLevel] = useState<number>(1);
  const [currentLevelUnlocked, setCurrentLevelUnlocked] = useState<number>(() => {
    // Read from localStorage challenge milestones
    const saved = localStorage.getItem('numzen_challenge_milestone');
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) ? 1 : parsed;
  });
  const [levelStars, setLevelStars] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('numzen_challenge_stars');
      return (saved && saved !== 'null') ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal displays
  const [activeModal, setActiveModal] = useState<'config' | 'stats' | 'missions' | 'achievements' | 'shop' | null>(null);

  // FPS Counter state
  const [fps, setFps] = useState<number>(60);
  const [lastMatchTime, setLastMatchTime] = useState<number>(0);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [activeSavedGame, setActiveSavedGame] = useState<any>(GameStorage.getActiveGame());
  const isResumingRef = useRef(false);

  // Ref tracking for active gameplay timing
  const historyRef = useRef(new HistorySystem());
  const [canUndoState, setCanUndoState] = useState(false);
  const [dailyReward, setDailyReward] = useState<{ rewarded: boolean; streak: number; rewardCoins: number } | null>(null);
  const gameIntervalRef = useRef<any>(null);
  const comboTimeoutRef = useRef<any>(null);
  const fpsFrameRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(0);

  const t = TRANSLATIONS[config.language];
  const activeTheme = THEMES.find(th => th.id === profile.theme) || THEMES[0];

  // Initialize login streak and sound engines on mount
  useEffect(() => {
    const rewardInfo = GameStorage.updateLoginStreak();
    if (rewardInfo) {
      setDailyReward(rewardInfo);
      setProfile(GameStorage.getProfile());
    }
    setStats(GameStorage.getStats());

    // Listen for first interaction to bootstrap synthetic background Zen music safely
    const handleFirstTouch = () => {
      if (config.musicEnabled) {
        SynthAudio.startMusic(true);
      }
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
    window.addEventListener('click', handleFirstTouch);
    window.addEventListener('touchstart', handleFirstTouch);

    return () => {
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
      SynthAudio.stopMusic();
    };
  }, []);

  // Network listeners and deep-link check
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast(config.language === 'pt' ? 'Conectado à internet!' : config.language === 'es' ? '¡Conectado a internet!' : 'Connected to internet!', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast(config.language === 'pt' ? 'Você está jogando offline. O progresso será salvo localmente.' : config.language === 'es' ? 'Estás jugando offline. El progreso se guardará localmente.' : 'You are playing offline. Progress will be saved locally.', 'info');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Deep-link check for shortcuts (?mode=...)
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    if (modeParam === 'classic' || modeParam === 'survival' || modeParam === 'relax' || modeParam === 'timed' || modeParam === 'infinite') {
      setTimeout(() => {
        startNewGame(modeParam as GameMode, modeParam === 'relax' ? 'easy' : 'medium');
        // Clean URL query parameters so page reload doesn't trigger startNewGame again
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 800);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync music state when config changes
  useEffect(() => {
    if (config.darkMode ?? true) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.darkMode]);

  useEffect(() => {
    if (config.musicEnabled) {
      SynthAudio.startMusic(true);
    } else {
      SynthAudio.stopMusic();
    }
  }, [config.musicEnabled]);

  // FPS Counter monitoring
  useEffect(() => {
    if (!config.showFps) return;

    const countFps = (time: number) => {
      if (!fpsTimeRef.current) fpsTimeRef.current = time;
      fpsFrameRef.current++;

      if (time > fpsTimeRef.current + 1000) {
        setFps(Math.round((fpsFrameRef.current * 1000) / (time - fpsTimeRef.current)));
        fpsFrameRef.current = 0;
        fpsTimeRef.current = time;
      }
      requestAnimationFrame(countFps);
    };

    const animId = requestAnimationFrame(countFps);
    return () => cancelAnimationFrame(animId);
  }, [config.showFps]);

  // Timers loop for timed modes and survival row appending
  useEffect(() => {
    if (view !== 'game' || gameOver || victory) {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      return;
    }

    gameIntervalRef.current = setInterval(() => {
      if (isPaused) return;
      
      // 1. Time tracking in stats
      setStats(prevStats => {
        const nextStats = { ...prevStats, totalTimePlayed: prevStats.totalTimePlayed + 1 };
        if (nextStats.totalTimePlayed % 10 === 0) {
          GameStorage.saveStats(nextStats);
        }
        return nextStats;
      });

      // 2. Timed Mode logic
      if (mode === 'timed' || (levelId && CHALLENGE_LEVELS.find(l => l.id === levelId)?.timeLimit)) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // No game over anymore. Just stay at 0.
            return 0;
          }
          return prev - 1;
        });
      }

      // 3. Survival or Infinite Mode logic
      if (mode === 'survival' || mode === 'infinite') {
        setSurvivalTick(prev => {
          if (prev <= 1) {
            // Append line
            setCells(currentCells => {
              const withLine = GameEngine.appendRandomLine(currentCells, cols, difficulty);
              // Limit removed, no game over
              return withLine;
            });

            return mode === 'infinite' ? 20 : 12; // Reset countdown (20 seconds for infinite)
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    };
  }, [view, gameOver, victory, mode, levelId, isPaused]);

  // Survival mode milestone rewards
  useEffect(() => {
    if (mode === 'survival' && score > 0) {
      const currentMilestone = Math.floor(score / 2000);
      if (currentMilestone >= survivalRewardMilestone) {
        // Player reached a new 2000 point milestone!
        setSurvivalRewardMilestone(currentMilestone + 1);
        
        if (lives < maxLives) {
          setLives(prev => Math.min(maxLives, prev + 1));
          showToast(`+1 Vida! (2000 pontos)`, 'success');
          SynthAudio.playLevelUp(config.soundEnabled);
        } else {
          // Grant 50 coins instead if already at max lives
          setProfile(prev => {
            const next = { ...prev, coins: prev.coins + 50 };
            GameStorage.saveProfile(next);
            return next;
          });
          showToast(`+50 Moedas! (2000 pontos, Vidas Cheias)`, 'success');
          SynthAudio.playCoin(config.soundEnabled);
        }
      }
    }
  }, [score, mode, survivalRewardMilestone, lives, maxLives, config.soundEnabled]);

  useEffect(() => {
    if (view === 'game' && !gameOver && !victory && cells.length > 0 && !isResumingRef.current) {
      const stateToSave = {
        mode, difficulty, levelId, cells, cols, score, combo, timeLeft, survivalTick, survivalRewardMilestone,
        hintsLeft, highlightedIndices, clearedIce, clearedLocks, clearedBombs,
        linesAddedCount, maxComboInLevel, clearedNumbersCount, lives, maxLives, shufflesLeft, movesLeft,
        hintsUsed, powersUsed, lastMatchTime
      };
      GameStorage.saveActiveGame(stateToSave);
      // Don't call setActiveSavedGame here to avoid unnecessary re-renders in the menu
    }
  }, [view, mode, difficulty, levelId, cells, cols, score, combo, timeLeft, survivalTick, survivalRewardMilestone, hintsLeft, highlightedIndices, clearedIce, clearedLocks, clearedBombs, linesAddedCount, maxComboInLevel, clearedNumbersCount, lives, maxLives, shufflesLeft, movesLeft, hintsUsed, powersUsed, lastMatchTime, gameOver, victory]);

  // Handle Level XP and Profile state updates
  const handleXPAdd = (amount: number) => {
    const res = GameStorage.addXP(amount);
    const updated = GameStorage.getProfile();
    setProfile(updated);
    
    if (res.levelUp) {
      setShowLevelUp(true);
      SynthAudio.playLevelUp(config.soundEnabled);
    }
  };

  const resumeGame = () => {
    if (activeSavedGame) {
      isResumingRef.current = true;
      SynthAudio.playClick(config.soundEnabled);
      setMode(activeSavedGame.mode);
      setDifficulty(activeSavedGame.difficulty);
      setLevelId(activeSavedGame.levelId);
      setCells(activeSavedGame.cells);
      setCols(activeSavedGame.cols);
      setScore(activeSavedGame.score);
      setCombo(activeSavedGame.combo);
      setTimeLeft(activeSavedGame.timeLeft);
      setSurvivalTick(activeSavedGame.survivalTick);
      setSurvivalRewardMilestone(activeSavedGame.survivalRewardMilestone || 1);
      setHintsLeft(activeSavedGame.hintsLeft);
      setHighlightedIndices(activeSavedGame.highlightedIndices);
      setClearedIce(activeSavedGame.clearedIce);
      setClearedLocks(activeSavedGame.clearedLocks);
      setClearedBombs(activeSavedGame.clearedBombs);
      setLinesAddedCount(activeSavedGame.linesAddedCount);
      setMaxComboInLevel(activeSavedGame.maxComboInLevel);
      setClearedNumbersCount(activeSavedGame.clearedNumbersCount);
      setLives(activeSavedGame.lives);
      setMaxLives(activeSavedGame.maxLives);
      setShufflesLeft(activeSavedGame.shufflesLeft);
      setMovesLeft(activeSavedGame.movesLeft);
      setHintsUsed(activeSavedGame.hintsUsed);
      setPowersUsed(activeSavedGame.powersUsed);
      setLastMatchTime(activeSavedGame.lastMatchTime);
      setGameOver(false);
      setVictory(false);
      setIsPaused(false);
      setView('game');
      setTimeout(() => {
        isResumingRef.current = false;
      }, 100);
    }
  };

  // Start a new match
  const startNewGame = (selectedMode: GameMode, selectedDiff: Difficulty, challengeId: number | null = null) => {
    historyRef.current.clear();
    setCanUndoState(false);
    GameStorage.clearActiveGame();
    setActiveSavedGame(null);
    SynthAudio.playClick(config.soundEnabled);
    setMode(selectedMode);
    setDifficulty(selectedDiff);
    setLevelId(challengeId);
    setScore(0);
    setCombo(1);
    setSelectedIndex(null);
    setGameOver(false);
    setVictory(false);
    setHighlightedIndices([]);
    setClearedIce(0);
    setClearedLocks(0);
    setClearedBombs(0);
    setLinesAddedCount(0);
    setMaxComboInLevel(1);
    setClearedNumbersCount(0);
    setLevelPairsMatched(0);
    setLevelSumTenMatched(0);
    setIsPaused(false);
    setShowRestartConfirm(false);
    setShowExitConfirm(false);
    
    // Set hints with Bright Idea perk (+1 starting hint)
    const baseHints = selectedMode === 'relax' ? 999 : 3;
    const extraHints = (selectedMode !== 'relax' && profile.avatar === 'av_3') ? 1 : 0;
    setHintsLeft(baseHints + extraHints);
    if (extraHints > 0) {
      setTimeout(() => showToast(`💡 Ideia Brilhante: +1 Dica Extra!`, 'success'), 400);
    }

    // Set lives/mistakes and shuffles based on difficulty & mode
    let initialLives = 4;
    let initialShuffles = 3;

    if (selectedMode === 'relax') {
      initialLives = 999;
      initialShuffles = 999;
    } else {
      if (selectedDiff === 'easy') {
        initialLives = 5;
        initialShuffles = 5;
      } else if (selectedDiff === 'medium') {
        initialLives = 4;
        initialShuffles = 3;
      } else if (selectedDiff === 'hard') {
        initialLives = 3;
        initialShuffles = 2;
      } else if (selectedDiff === 'insane') {
        initialLives = 3;
        initialShuffles = 1;
      }

      // Vital Thruster perk (+1 extra life & +1 extra shuffle)
      if (profile.avatar === 'av_5') {
        initialLives += 1;
        initialShuffles += 1;
        setTimeout(() => showToast(`🚀 Propulsão Vital: +1 Vida e +1 Embaralhar!`, 'success'), 700);
      }
    }

    setLives(initialLives);
    setMaxLives(initialLives);
    setSurvivalRewardMilestone(1);
    setShufflesLeft(initialShuffles);
    setInvalidMatch(null);
    setIsBoardLocked(false);
    setHintsUsed(0);
    setPowersUsed(0);
    setVictoryBreakdown(null);
    setLastMatchTime(Date.now());

    // If first time starting Classic game, show tutorial
    if (!seenTutorial && selectedMode === 'classic') {
      setTutorialStep(0);
    }

    // Dynamic Board initialization
    const boardMode = challengeId ? getChallengeBaseMode(challengeId) : selectedMode;
    const levelSizeParam = challengeId 
      ? Math.floor(4 + challengeId * 0.3) // Level 1 is 4, Level 10 is 7, Level 20 is 10, Level 30 is 13 (massive grid!)
      : profile.level;
    const customLevelConfig = challengeId ? CHALLENGE_LEVELS.find(l => l.id === challengeId) : undefined;
    const { cells: initialCells, cols: initialCols } = GameEngine.generateInitialBoard(boardMode, selectedDiff, levelSizeParam, customLevelConfig);
    setCells(initialCells);
    setCols(initialCols);

    // Mode-specific variables
    if (selectedMode === 'timed') {
      setTimeLeft(60); // 60 seconds base
    } else if (challengeId) {
      const levelRef = CHALLENGE_LEVELS.find(l => l.id === challengeId);
      if (levelRef?.timeLimit) {
        setTimeLeft(levelRef.timeLimit);
      }
      if (levelRef?.movesLimit) {
        const bonusMoves = profile.avatar === 'av_2' ? 2 : 0;
        setMovesLeft(levelRef.movesLimit + bonusMoves);
        if (bonusMoves > 0) {
          setTimeout(() => showToast(`🧮 Mente Calculadora: +2 Jogadas!`, 'success'), 900);
        }
      }
    }

    if (selectedMode === 'survival') {
      setSurvivalTick(12);
    } else if (selectedMode === 'infinite') {
      setSurvivalTick(20);
    }

    setView('game');
  };

  // Maps custom level constraints to physical base generator layouts
  const getChallengeBaseMode = (lvlId: number): GameMode => {
    const lvl = CHALLENGE_LEVELS.find(l => l.id === lvlId);
    if (lvl?.specialObstacles) {
      if (lvl.specialObstacles.frozen && lvl.specialObstacles.frozen > 0) return 'frozen';
      if (lvl.specialObstacles.locked && lvl.specialObstacles.locked > 0) return 'locks';
      if (lvl.specialObstacles.bombs && lvl.specialObstacles.bombs > 0) return 'bombs';
      if (lvl.specialObstacles.multipliers && lvl.specialObstacles.multipliers > 0) return 'multipliers';
    }
    return 'classic';
  };

  
  const saveHistory = () => {
    historyRef.current.saveState({
      cells: JSON.parse(JSON.stringify(cells)),
      score,
      combo,
      linesAddedCount,
      shufflesLeft,
      hintsLeft
    });
    setCanUndoState(historyRef.current.canUndo());
  };


  const handleUndo = () => {
    if (!historyRef.current.canUndo()) return;
    const previousState = historyRef.current.undo();
    if (previousState) {
      setCells(previousState.cells);
      setScore(previousState.score);
      setCombo(previousState.combo);
      setLinesAddedCount(previousState.linesAddedCount);
      setShufflesLeft(previousState.shufflesLeft);
      setHintsLeft(previousState.hintsLeft);
      setCanUndoState(historyRef.current.canUndo());
      SynthAudio.playClick(config.soundEnabled);
    }
  };


  const handleGameOver = () => {
    setGameOver(true);
    GameStorage.clearActiveGame();
    setActiveSavedGame(null);
    SynthAudio.playFail(config.soundEnabled);

    // Save defeat stat
    const nextStats = { ...stats };
    nextStats.losses += 1;
    setStats(nextStats);
    GameStorage.saveStats(nextStats);
  };

  const checkVictoryConditions = (
    scoreVal: number, 
    cellsLeft: Cell[], 
    finalStep = false, 
    context?: { 
      pairsMatched?: number; 
      sumTenMatched?: number;
      clearedIce?: number; 
      clearedLocks?: number; 
      clearedBombs?: number; 
      maxCombo?: number;
    }
  ) => {
    const activeLeft = GameEngine.getActiveIndices(cellsLeft).length;

    // 1. Unconditional instant victory: If the board is completely cleared of active numbers, the player wins!
    if (activeLeft === 0) {
      handleVictory(scoreVal);
      return;
    }

    // Challenge Level criteria
    if (levelId) {
      const lvl = CHALLENGE_LEVELS.find(l => l.id === levelId);
      if (!lvl) return;

      const scoreTargetMet = scoreVal >= lvl.targetScore;
      let objectiveTargetMet = false;

      const obj = lvl.objective;
      if (obj) {
        const currentPairs = context?.pairsMatched !== undefined ? context.pairsMatched : levelPairsMatched;
        const currentSumTen = context?.sumTenMatched !== undefined ? context.sumTenMatched : levelSumTenMatched;
        const currentIce = context?.clearedIce !== undefined ? context.clearedIce : clearedIce;
        const currentLocks = context?.clearedLocks !== undefined ? context.clearedLocks : clearedLocks;
        const currentBombs = context?.clearedBombs !== undefined ? context.clearedBombs : clearedBombs;
        const currentMaxCombo = context?.maxCombo !== undefined ? context.maxCombo : maxComboInLevel;

        if (obj.type === 'score') {
          objectiveTargetMet = scoreVal >= obj.count;
        } else if (obj.type === 'pairs') {
          objectiveTargetMet = currentPairs >= obj.count;
        } else if (obj.type === 'clear_board') {
          objectiveTargetMet = activeLeft === 0;
        } else if (obj.type === 'same_number') {
          const targetValue = obj.targetValue || 7;
          const leftOfType = cellsLeft.filter(c => !c.removed && c.value === targetValue).length;
          const startingOfType = cells.filter(c => c.value === targetValue).length;
          const clearedPairs = Math.floor((startingOfType - leftOfType) / 2);
          objectiveTargetMet = clearedPairs >= obj.count;
        } else if (obj.type === 'sum_ten') {
          objectiveTargetMet = currentSumTen >= obj.count;
        } else if (obj.type === 'ice') {
          objectiveTargetMet = currentIce >= obj.count;
        } else if (obj.type === 'locks') {
          objectiveTargetMet = currentLocks >= obj.count;
        } else if (obj.type === 'bombs') {
          objectiveTargetMet = currentBombs >= obj.count;
        } else if (obj.type === 'combos') {
          objectiveTargetMet = currentMaxCombo >= obj.count;
        }
      } else {
        objectiveTargetMet = true;
      }

      // If the player meets the primary objective of the campaign level, they win!
      // We ensure they always pass by raising their final score to at least the level's target score if needed.
      if (objectiveTargetMet) {
        handleVictory(Math.max(scoreVal, lvl.targetScore));
      } else if (finalStep && GameEngine.checkVictory(cellsLeft)) {
        // Clear board but targets missed (fallback, though activeLeft === 0 already handled above)
        handleVictory(Math.max(scoreVal, lvl.targetScore));
      }
      return;
    }

    // Classic/Normal modes: victory when full board is empty
    if (GameEngine.checkVictory(cellsLeft)) {
      handleVictory(scoreVal);
    }
  };

  const handleVictory = (finalScore: number) => {
    GameStorage.clearActiveGame();
    setActiveSavedGame(null);
    // 1. Calculate Score Breakdown
    let diffPercent = 0.0;
    if (difficulty === 'medium') diffPercent = 0.2;
    else if (difficulty === 'hard') diffPercent = 0.5;
    else if (difficulty === 'insane') diffPercent = 1.0;

    const baseScore = finalScore;
    const difficultyBonus = Math.floor(baseScore * diffPercent);

    // Time Bonus: If timed or challenge mode with a time limit, reward remaining time
    let timeBonus = 0;
    if (mode === 'timed') {
      timeBonus = timeLeft * 20;
    } else if (levelId) {
      const lvlRef = CHALLENGE_LEVELS.find(l => l.id === levelId);
      if (lvlRef?.timeLimit && timeLeft > 0) {
        timeBonus = timeLeft * 10;
      }
    }

    // Clean Play Bonus: No hints used AND no shuffles/powers used
    const cleanBonus = (hintsUsed === 0 && powersUsed === 0) ? Math.floor(baseScore * 0.3) : 0;

    const computedFinalScore = baseScore + difficultyBonus + timeBonus + cleanBonus;

    // Set the state breakdown for rendering
    setVictoryBreakdown({
      baseScore,
      difficultyBonus,
      timeBonus,
      cleanBonus,
      finalScore: computedFinalScore
    });

    // Update the game state score to the computed final score
    setScore(computedFinalScore);

    setVictory(true);
    SynthAudio.playLevelUp(config.soundEnabled);

    // Update global user stats with computed final score
    const nextStats = { ...stats };
    nextStats.wins += 1;
    nextStats.totalMatches += 1;
    if (computedFinalScore > (nextStats.highScore[mode] || 0)) {
      nextStats.highScore[mode] = computedFinalScore;
    }
    setStats(nextStats);
    GameStorage.saveStats(nextStats);

    // Level progression unlocking (using computed final score)
    if (levelId) {
      const scoreGoal = CHALLENGE_LEVELS.find(l => l.id === levelId)?.targetScore || 1000;
      let stars = 1;
      if (computedFinalScore >= scoreGoal * 1.5) stars = 3;
      else if (computedFinalScore >= scoreGoal * 1.2) stars = 2;

      const nextStars = { ...levelStars, [levelId]: Math.max(levelStars[levelId] || 0, stars) };
      setLevelStars(nextStars);
      localStorage.setItem('numzen_challenge_stars', JSON.stringify(nextStars));

      if (levelId === currentLevelUnlocked && levelId < CHALLENGE_LEVELS.length) {
        const nextLvl = levelId + 1;
        setCurrentLevelUnlocked(nextLvl);
        localStorage.setItem('numzen_challenge_milestone', nextLvl.toString());
      }
    }

    // Reward calculations based on computed final score
    let coinReward = 30 + Math.floor(computedFinalScore / 250);
    let xpReward = 50 + Math.floor(computedFinalScore / 100);

    if (difficulty === 'medium') { coinReward = Math.floor(coinReward * 1.2); xpReward = Math.floor(xpReward * 1.2); }
    if (difficulty === 'hard') { coinReward = Math.floor(coinReward * 1.5); xpReward = Math.floor(xpReward * 1.5); }
    if (difficulty === 'insane') { coinReward = Math.floor(coinReward * 2); xpReward = Math.floor(xpReward * 2); }

    // Number Mage (av_8) coin alchemy bônus (+25% moedas bônus!)
    if (profile.avatar === 'av_8') {
      coinReward = Math.floor(coinReward * 1.25);
      setTimeout(() => showToast(`🧙‍♂️ Alquimia Dourada: +25% de Moedas Extras!`, 'success'), 1200);
    }

    const nextProfile = { ...profile };
    nextProfile.coins += coinReward;
    setProfile(nextProfile);
    GameStorage.saveProfile(nextProfile);

    // Save totalCoinsEarned statistic
    const updatedStats = { ...nextStats, totalCoinsEarned: (nextStats.totalCoinsEarned || 0) + coinReward };
    setStats(updatedStats);
    GameStorage.saveStats(updatedStats);

    GameStorage.updateMissionProgress('weekly_coins', coinReward);
    GameStorage.updateMissionProgress('daily_earn_coins', coinReward);

    handleXPAdd(xpReward);

    // Achievements trigger with computed final score
    GameStorage.updateAchievementProgress('score', computedFinalScore);
    GameStorage.updateAchievementProgress('games', updatedStats.totalMatches);
    GameStorage.updateAchievementProgress('coins', nextProfile.coins);
    
    if (difficulty === 'insane') {
      GameStorage.updateAchievementProgress('special', 1, 'win_insane');
    }

    // Daily missions checking
    const m1 = GameStorage.updateMissionProgress('daily_score', computedFinalScore);
    const m2 = GameStorage.updateMissionProgress('daily_games', 1);
    if (mode === 'classic') {
      GameStorage.updateMissionProgress('daily_win_classic', 1);
    } else if (mode === 'relax') {
      GameStorage.updateMissionProgress('daily_win_relax', 1);
    }
    setMissions(GameStorage.getMissions());

    // Final profile reload to fetch rewards earned from mission and achievement completions
    setProfile(GameStorage.getProfile());
  };

  // Check if any moves are available
  const checkBoardLock = (currentCells: Cell[], currentCols: number) => {
    const activeCount = GameEngine.getActiveIndices(currentCells).length;
    if (activeCount === 0) {
      setIsBoardLocked(false);
      return; // Victory handled separately
    }

    const matches = GameEngine.getAvailableMatches(currentCells, currentCols);
    if (matches.length === 0) {
      // User rule: When no moves, add new lines. 
      // Defeat if board gets impossibly huge, but 300 is too small for survival. Let's increase it to 1000 or just remove it.
      if (activeCount >= 1500) {
        // Board is insanely full, no moves, cannot add lines (failsafe)
        handleGameOver();
      } else {
        showToast(
          config.language === 'pt'
            ? '➕ Sem movimentos! Adicionando novas linhas...'
            : '➕ No moves left! Adding new lines...',
          'info'
        );
        
        setTimeout(() => {
          setIsShuffling(true); // just use the animation flag for visual effect
          SynthAudio.playShuffle(config.soundEnabled);
          
          const added = GameEngine.addNumbers(currentCells, currentCols, config.difficulty);
          setCells(added);
          setLinesAddedCount(prev => prev + 1);
          
          setTimeout(() => {
            setIsShuffling(false);
            // Scroll to bottom
            const container = document.getElementById('app-container');
            if (container) {
              container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            }
          }, 850);
        }, 800);
      }
    } else {
      setIsBoardLocked(false);
    }
  };

  // Main cell tap match handler with full kinetic glide feedback, particles, and floating score pops
  const handleCellClick = (idx: number) => {
    if (gameOver || victory || animatingMatch) return;

    // Clear any previous invalid shake if a new cell is clicked, avoiding getting stuck
    if (invalidMatch) {
      setInvalidMatch(null);
    }

    const clickedCell = cells[idx];
    if (clickedCell.removed || clickedCell.value === 0 || clickedCell.locked) return;

    // Handle mystery cell click reveal
    if (clickedCell.mystery && !clickedCell.revealed) {
      const updatedCells = [...cells];
      // Reveal the clicked mystery cell
      updatedCells[idx] = { ...updatedCells[idx], revealed: true };
      
      // Also reveal its immediate horizontal and vertical neighbors
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const neighbors = [
        { r: r - 1, c },
        { r: r + 1, c },
        { r: r, c: c - 1 },
        { r: r, c: c + 1 }
      ];
      
      const totalRows = Math.ceil(cells.length / cols);
      neighbors.forEach(n => {
        if (n.r >= 0 && n.r < totalRows && n.c >= 0 && n.c < cols) {
          const nIdx = n.r * cols + n.c;
          if (nIdx >= 0 && nIdx < cells.length && cells[nIdx] && !cells[nIdx].removed) {
            updatedCells[nIdx] = { ...updatedCells[nIdx], revealed: true };
          }
        }
      });
      
      setCells(updatedCells);
      SynthAudio.playUnlock(config.soundEnabled);
      return;
    }

    if (selectedIndex === null) {
      // First selection
      setSelectedIndex(idx);
      SynthAudio.playClick(config.soundEnabled);
    } else if (selectedIndex === idx) {
      // Tapping same cell deselects
      setSelectedIndex(null);
      SynthAudio.playClick(config.soundEnabled);
    } else {
      // Second selection: check logical match
      const cellA = cells[selectedIndex];
      const cellB = cells[idx];

      const isMatchable = GameEngine.isMatchable(cellA.value, cellB.value);
      const isAdjacent = GameEngine.checkAdjacent(selectedIndex, idx, cells, cols, false);

      if (isMatchable && isAdjacent) {
        // Valid Match!
        const firstIdx = selectedIndex; // Store local reference
        setSelectedIndex(null); // Clear selectedIndex immediately to prevent double-matching/selection!

        saveHistory();
        // Start glide visual approximation animation
        const r1 = Math.floor(firstIdx / cols);
        const c1 = firstIdx % cols;
        const r2 = Math.floor(idx / cols);
        const c2 = idx % cols;

        setAnimatingMatch({ idxA: firstIdx, idxB: idx, r1, c1, r2, c2 });

        // Score formula: balanced by difficulty and combo multipliers
        let diffMult = 1.0;
        if (difficulty === 'medium') diffMult = 1.3;
        else if (difficulty === 'hard') diffMult = 1.7;
        else if (difficulty === 'insane') diffMult = 2.2;

        // Speed bonus logic (Timed Mode only)
        let speedBonusScore = 0;
        let speedBonusApplied = false;
        if (mode === 'timed') {
          const now = Date.now();
          if (lastMatchTime > 0) {
            const timeDiff = (now - lastMatchTime) / 1000;
            if (timeDiff < 2.2) { // Match made under 2.2 seconds!
              speedBonusScore = 30;
              speedBonusApplied = true;
              setTimeLeft(prev => Math.min(120, prev + 5)); // Extra 5 seconds
            }
          }
          setLastMatchTime(now);
        }

        const result = GameEngine.executeMatch(firstIdx, idx, cells, cols);

        // Safely cleared bomb bonus
        let safeBombBonusScore = 0;
        if (result.isBombTriggered) {
          // Dragon (av_6) gives double bomb explosion points!
          safeBombBonusScore = profile.avatar === 'av_6' ? 300 : 150;
          
          // Dragon (av_6) gives double coins for safe detonations (4 instead of 2)!
          const bombCoinsReward = profile.avatar === 'av_6' ? 4 : 2;
          const updatedProfile = { ...profile, coins: profile.coins + bombCoinsReward };
          setProfile(updatedProfile);
          GameStorage.saveProfile(updatedProfile);

          const nextStats = { ...stats };
          nextStats.totalCoinsEarned = (nextStats.totalCoinsEarned || 0) + bombCoinsReward;
          setStats(nextStats);
          GameStorage.saveStats(nextStats);

          GameStorage.updateMissionProgress('weekly_coins', bombCoinsReward);
          GameStorage.updateMissionProgress('daily_earn_coins', bombCoinsReward);
          GameStorage.updateAchievementProgress('coins', updatedProfile.coins);
          
          if (profile.avatar === 'av_6') {
            showToast(`🐲 Fogo Destruidor: +${bombCoinsReward} Moedas!`, 'success');
          }
        }

        // Joker (av_7) 10% chance for +10 coins on matching any pair!
        if (profile.avatar === 'av_7' && Math.random() < 0.10) {
          const jokerCoins = 10;
          const nextProfileCoins = profile.coins + jokerCoins;
          const updatedProfile = { ...profile, coins: nextProfileCoins };
          setProfile(updatedProfile);
          GameStorage.saveProfile(updatedProfile);

          const nextStats = { ...stats };
          nextStats.totalCoinsEarned = (nextStats.totalCoinsEarned || 0) + jokerCoins;
          setStats(nextStats);
          GameStorage.saveStats(nextStats);

          GameStorage.updateMissionProgress('weekly_coins', jokerCoins);
          GameStorage.updateMissionProgress('daily_earn_coins', jokerCoins);
          GameStorage.updateAchievementProgress('coins', nextProfileCoins);
          
          showToast(`🃏 Coringa da Sorte: +10 Moedas!`, 'success');
        }

        const matchBase = cellA.value;
        const baseMatchPoints = Math.floor(matchBase * 10 * combo * (cellA.special === 'multiplier' ? cellA.multiplier : 1) * (cellB.special === 'multiplier' ? cellB.multiplier : 1) * diffMult);
        const matchPoints = baseMatchPoints + speedBonusScore + safeBombBonusScore;
        const nextScore = score + matchPoints;
        setScore(nextScore);

        // Spawn Floating Score Popups above the matched cells
        const scorePopId = Math.random().toString();
        const popupText = speedBonusApplied ? `+${matchPoints} ⚡` : `+${matchPoints}`;
        setFloatingScores(prev => [...prev, { id: scorePopId, idx, text: popupText }]);

        // Spawn Floating Particle FX rings on matching locations
        const explosionIdA = Math.random().toString();
        const explosionIdB = Math.random().toString();
        const particleColor = activeTheme.accentColor || '#10b981';
        setActiveExplosions(prev => [
          ...prev,
          { id: explosionIdA, idx: firstIdx, color: particleColor },
          { id: explosionIdB, idx, color: particleColor }
        ]);

        // Trigger matches audio synthesizer
        if (result.isBombTriggered) {
          SynthAudio.playExplosion(config.soundEnabled);
          setClearedBombs(prev => prev + 1);
          GameStorage.updateAchievementProgress('special', 1, 'bomb');
          GameStorage.updateMissionProgress('weekly_bombs', 1);
          GameStorage.updateMissionProgress('daily_trigger_bombs', 1);
          showToast('💣 BOMBA DETONADA COM SUCESSO! +150 PTS +2 MOEDAS', 'success');
        } else if (result.isIceBroken) {
          SynthAudio.playIceBreak(config.soundEnabled);
          setClearedIce(prev => prev + 1);
          GameStorage.updateAchievementProgress('special', 1, 'ice');
          GameStorage.updateMissionProgress('daily_melt_ice', 1);
        } else if (result.isLockOpened) {
          SynthAudio.playUnlock(config.soundEnabled);
          setClearedLocks(prev => prev + 1);
          GameStorage.updateAchievementProgress('special', 1, 'lock');
          GameStorage.updateMissionProgress('daily_unlock_locks', 1);
        } else {
          SynthAudio.playMatch(config.soundEnabled, combo);
        }

        // Increase combo streak
        setCombo(prev => {
          const nextCombo = prev + 1;
          setMaxComboInLevel(m => Math.max(m, nextCombo));
          if (nextCombo > stats.maxCombo) {
            const nextStats = { ...stats, maxCombo: nextCombo };
            setStats(nextStats);
            GameStorage.saveStats(nextStats);
          }
          GameStorage.updateMissionProgress('weekly_combos', nextCombo);
          GameStorage.updateMissionProgress('daily_combo_streak', nextCombo);
          return nextCombo;
        });

        // Calculate next local values for immediate context evaluation (avoiding async React state delays!)
        const nextPairsMatched = levelPairsMatched + 1;
        setLevelPairsMatched(nextPairsMatched);

        let nextSumTenMatched = levelSumTenMatched;
        if (cellA.value + cellB.value === 10) {
          nextSumTenMatched += 1;
          setLevelSumTenMatched(nextSumTenMatched);
        }

        const nextIce = result.isIceBroken ? clearedIce + 1 : clearedIce;
        const nextLocks = result.isLockOpened ? clearedLocks + 1 : clearedLocks;
        const nextBombs = result.isBombTriggered ? clearedBombs + 1 : clearedBombs;
        const nextMaxCombo = Math.max(maxComboInLevel, combo + 1);

        // Reset Combo Timer (Multipliers Mode holds combo for 6 seconds, others 4 seconds)
        // Samurai (av_4) extends combo hold time by +2.0 seconds!
        const bonusComboTime = profile.avatar === 'av_4' ? 2000 : 0;
        const comboHoldTime = (mode === 'multipliers' ? 6000 : 4000) + bonusComboTime;
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
        comboTimeoutRef.current = setTimeout(() => {
          setCombo(1);
        }, comboHoldTime);

        // Deduct move limit
        if (levelId && movesLeft > 0) {
          setMovesLeft(prev => {
            const nextMoves = prev - 1;
            if (nextMoves <= 0 && nextScore < (CHALLENGE_LEVELS.find(l => l.id === levelId)?.targetScore || 1000)) {
              handleGameOver();
            }
            return nextMoves;
          });
        }

        // Add standard bonus time in Timed Mode (non-speed bonus)
        if (mode === 'timed' && !speedBonusApplied) {
          setTimeLeft(prev => Math.min(120, prev + 3)); // caps at 120s
        }

        // Delay updating cells state until the glide visual approximation transition (280ms) finishes!
        setTimeout(() => {
          const contextVal = {
            pairsMatched: nextPairsMatched,
            sumTenMatched: nextSumTenMatched,
            clearedIce: nextIce,
            clearedLocks: nextLocks,
            clearedBombs: nextBombs,
            maxCombo: nextMaxCombo
          };
          let finalUpdatedCells = [...result.updatedCells];
          let bombsDetonatedCount = 0;
          const explodedByBombs: number[] = [];

          // Active Bomb Tick & Detonation logic (for Bombs Mode)
          if (mode === 'bombs') {
            finalUpdatedCells = finalUpdatedCells.map((cell, cIdx) => {
              if (!cell.removed && cell.special === 'bomb' && cell.bombTimer !== undefined) {
                const nextTimer = cell.bombTimer - 1;
                if (nextTimer <= 0) {
                  bombsDetonatedCount++;
                  cell.removed = true;
                  
                  // Blow up 3x3 cells surrounding this detonated bomb
                  const row = Math.floor(cIdx / cols);
                  const col = cIdx % cols;
                  for (let r = row - 1; r <= row + 1; r++) {
                     for (let c = col - 1; c <= col + 1; c++) {
                       if (r >= 0 && r < Math.ceil(finalUpdatedCells.length / cols) && c >= 0 && c < cols) {
                         const targetIdx = r * cols + c;
                         if (targetIdx < finalUpdatedCells.length && !finalUpdatedCells[targetIdx].removed) {
                           finalUpdatedCells[targetIdx].removed = true;
                           explodedByBombs.push(targetIdx);
                         }
                       }
                     }
                  }
                  return cell;
                }
                return { ...cell, bombTimer: nextTimer };
              }
              return cell;
            });

            if (bombsDetonatedCount > 0) {
              if (mode === 'survival') {
                setLives(prev => {
                  const damage = bombsDetonatedCount * 2;
                  const nextLives = Math.max(0, prev - damage);
                  // Game over removed
                  return nextLives;
                });
                showToast(`💥 ${bombsDetonatedCount} BOMBA(S) DETONARAM! -${bombsDetonatedCount * 2} VIDAS!`, 'error');
              } else {
                showToast(`💥 ${bombsDetonatedCount} BOMBA(S) DETONARAM!`, 'error');
              }

              SynthAudio.playExplosion(config.soundEnabled);
              GameStorage.updateMissionProgress('weekly_bombs', bombsDetonatedCount);
              GameStorage.updateMissionProgress('daily_trigger_bombs', bombsDetonatedCount);

              explodedByBombs.forEach(eIdx => {
                const bombExplosionId = Math.random().toString();
                setActiveExplosions(prev => [...prev, { id: bombExplosionId, idx: eIdx, color: '#ef4444' }]);
                setTimeout(() => {
                  setActiveExplosions(prev => prev.filter(e => e.id !== bombExplosionId));
                }, 600);
              });
            }
          }

          // Clean empty trailing rows & Update board state
          const cleanedCells = GameEngine.cleanTrailingEmptyLines(finalUpdatedCells, cols);
          setCells(cleanedCells);
          setSelectedIndex(null);
          setAnimatingMatch(null);
          setHighlightedIndices([]);

          // Record cleared piece stats
          const nextStats = { ...stats };
          const totalClearedInTurn = 2 + result.explodedIndices.length + explodedByBombs.length;
          nextStats.totalClearedPieces += totalClearedInTurn;
          setClearedNumbersCount(prev => prev + totalClearedInTurn);
          setStats(nextStats);
          GameStorage.saveStats(nextStats);

          // Missions triggers
          GameStorage.updateMissionProgress('daily_clears', totalClearedInTurn);
          setMissions(GameStorage.getMissions());

          // Achievements triggers
          GameStorage.updateAchievementProgress('clears', nextStats.totalClearedPieces);
          GameStorage.updateAchievementProgress('combo', combo);

          // Check victory
          checkVictoryConditions(nextScore, cleanedCells, false, contextVal);

          // Check for locked state (no more moves)
          checkBoardLock(cleanedCells, cols);

          // Sync profile to load any completed mission / achievement rewards
          setProfile(GameStorage.getProfile());
        }, 280);

        // Clean up visual overlays
        setTimeout(() => {
          setActiveExplosions(prev => prev.filter(e => e.id !== explosionIdA && e.id !== explosionIdB));
        }, 600);
        setTimeout(() => {
          setFloatingScores(prev => prev.filter(s => s.id !== scorePopId));
        }, 850);

      } else {
        // Failed Match: explain visually
        SynthAudio.playFail(config.soundEnabled);

        let explanation = '';
        if (config.language === 'pt') {
          if (!isMatchable) {
            explanation = `Os números ${cellA.value} e ${cellB.value} não são iguais nem somam 10!`;
          } else if (!isAdjacent) {
            explanation = 'O caminho entre os números está bloqueado por outras peças!';
          }
        } else if (config.language === 'es') {
          if (!isMatchable) {
            explanation = `¡Los números ${cellA.value} y ${cellB.value} no son iguales ni suman 10!`;
          } else if (!isAdjacent) {
            explanation = '¡El camino entre los números está bloqueado por otras fichas!';
          }
        } else {
          if (!isMatchable) {
            explanation = `Numbers ${cellA.value} and ${cellB.value} are not equal and do not sum to 10!`;
          } else if (!isAdjacent) {
            explanation = 'The path between the numbers is blocked by other pieces!';
          }
        }

        const prevSelectedIndex = selectedIndex;
        setSelectedIndex(idx); // Trocar a seleção para o novo número, conforme regra.

        // Set invalid match state to show shaking red cells and error explanation
        setInvalidMatch({ idxA: prevSelectedIndex, idxB: idx, message: explanation });

        // Deduct life (only in survival) or deduct 10s (in timed)
        if (mode === 'timed') {
          setTimeLeft(prev => Math.max(0, prev - 10)); // 10s penalty
        } else if (mode === 'survival') {
          setLives(prev => {
            const nextLives = prev - 1;
            if (nextLives <= 0) {
              setTimeout(() => {
                handleGameOver();
              }, 10);
            }
            return nextLives;
          });
        }

        // Reset error state after 1.2s to clear the shake and red highlighting
        setTimeout(() => {
          setInvalidMatch(null);
        }, 1200);

        setCombo(1); // Lose combo
      }
    }
  };

  // Append duplicates helper (when player gets stuck)
  const handleAddNumbers = () => {
    if (cells.length >= 300) {
      showToast(config.language === 'pt' ? 'Limite do tabuleiro atingido!' : 'Board limit reached!', 'error');
      return;
    }
    saveHistory();
    SynthAudio.playClick(config.soundEnabled);
    const nextCells = GameEngine.addNumbers(cells, cols, config.difficulty);
    setCells(nextCells);
    setSelectedIndex(null);
    setLinesAddedCount(prev => prev + 1);
    checkBoardLock(nextCells, cols);

    // Scroll to the bottom to see new numbers
    setTimeout(() => {
      const container = document.getElementById('app-container');
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  // Shuffle powerup
  const handleShuffle = () => {
    saveHistory();
    if (shufflesLeft <= 0 && mode !== 'relax') {
      showToast(config.language === 'pt' ? 'Sem embaralhamentos restantes!' : config.language === 'es' ? '¡Sin barajas restantes!' : 'No shuffles remaining!', 'error');
      return;
    }

    SynthAudio.playShuffle(config.soundEnabled);
    setIsShuffling(true);

    const nextCells = GameEngine.shuffleBoard(cells, cols);
    setCells(nextCells);
    setSelectedIndex(null);
    setHighlightedIndices([]);
    checkBoardLock(nextCells, cols);

    if (mode !== 'relax') {
      setShufflesLeft(prev => prev - 1);
    }
    setPowersUsed(prev => prev + 1);

    setTimeout(() => {
      setIsShuffling(false);
    }, 850);
  };

  // Highlight available move hint
  const handleRequestHint = () => {
    if (hintsLeft <= 0) {
      showToast(t.no_more_hints, 'error');
      return;
    }

    const availableMatches = GameEngine.getAvailableMatches(cells, cols);
    if (availableMatches.length > 0) {
      // Pick first match and flash
      const [idxA, idxB] = availableMatches[0];
      setHighlightedIndices([idxA, idxB]);
      SynthAudio.playCoin(config.soundEnabled);

      if (mode !== 'relax') {
        setHintsLeft(prev => prev - 1);
      }
      setHintsUsed(prev => prev + 1);

      // Hide hint highlight after 3 seconds
      setTimeout(() => {
        setHighlightedIndices([]);
      }, 3000);
    } else {
      showToast(t.hint_no_moves, 'info');
    }
  };

  // Equip Shop purchases
  const handleEquipItem = (category: 'theme' | 'avatar' | 'frame', itemId: string) => {
    const nextProfile = { ...profile };
    if (category === 'theme') nextProfile.theme = itemId;
    if (category === 'avatar') nextProfile.avatar = itemId;
    if (category === 'frame') nextProfile.frame = itemId;

    setProfile(nextProfile);
    GameStorage.saveProfile(nextProfile);
  };

  // Unlock Shop purchase
  const handlePurchaseItem = (item: any) => {
    const nextProfile = { ...profile };
    nextProfile.coins -= item.cost;
    
    if (item.category === 'theme') nextProfile.unlockedThemes.push(item.id);
    if (item.category === 'avatar') nextProfile.unlockedAvatars.push(item.id);
    if (item.category === 'frame') nextProfile.unlockedFrames.push(item.id);

    setProfile(nextProfile);
    GameStorage.saveProfile(nextProfile);
  };

  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => {
          SynthAudio.playClick(config.soundEnabled);
          setShowSplash(false);
          if (config.musicEnabled) {
            SynthAudio.startMusic(true);
          }
        }}
        language={config.language}
        themeStyles={activeTheme}
      />
    );
  }

  return (
    <div
      id="app-container"
      className={`min-h-screen w-full flex flex-col font-sans transition-all duration-300 overflow-y-auto overflow-x-hidden select-none relative ${activeTheme.bg}`}
    >
      {/* Background radial gradient glow (Sophisticated Dark signature) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.05] blur-[130px] pointer-events-none" style={{ backgroundColor: activeTheme.accentColor }} />

      {/* FPS Counter Overlay */}
      {config.showFps && (
        <div id="fps-counter" className="absolute top-2 left-2 z-50 bg-black/60 border border-white/10 rounded px-2 py-0.5 font-mono text-[9px] text-green-400">
          FPS: {fps}
        </div>
      )}

      {/* TOP HEADER */}
      <header className={`px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10 border-b bg-current/[0.02] ${activeTheme.borderPrimary}`}>
        <div
          id="brand"
          onClick={() => {
            SynthAudio.playClick(config.soundEnabled);
            setView('menu');
          }}
          className="flex flex-col cursor-pointer active:scale-95 transition-all"
        >
          <h1 className={`text-xl font-serif tracking-widest uppercase font-medium ${activeTheme.textPrimary}`}>
            {t.title}
          </h1>
          <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 font-semibold" style={{ color: activeTheme.accentColor }}>
            {t.subtitle}
          </span>
        </div>

        {/* Profile Stats on Header */}
        <div className="flex items-center gap-4">
          {/* User Level XP */}
          <div id="level-badge" className="hidden sm:flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${activeTheme.textSecondary}`}>
                {t.level} {profile.level}
              </span>
              <div className="w-16 h-1 bg-current/10 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${Math.min(100, (profile.xp / (profile.level * 250)) * 100)}%` }}
                />
              </div>
            </div>
            <Crown className="w-4 h-4 text-yellow-400 animate-bounce-slow" />
          </div>

          {/* User coins */}
          <div
            id="coin-display"
            onClick={() => {
              SynthAudio.playClick(config.soundEnabled);
              setActiveModal('shop');
            }}
            className="flex items-center gap-1.5 py-1 px-3.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-xs font-bold text-yellow-500 cursor-pointer active:scale-95 transition-all hover:bg-yellow-500/10"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{profile.coins.toLocaleString()}</span>
          </div>



          {/* Settings button */}
          <button
            id="settings-trigger"
            onClick={() => {
              SynthAudio.playClick(config.soundEnabled);
              setActiveModal('config');
            }}
            className={`p-2 rounded-full border active:scale-90 transition-all ${activeTheme.secondaryBtn}`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className={`flex-1 flex flex-col items-center justify-start lg:justify-center p-2 sm:p-4 relative z-10 w-full mx-auto transition-all duration-300 ${view === 'game' || view === 'levels' ? 'max-w-5xl' : 'max-w-4xl'}`}>
        <AnimatePresence mode="wait">
          {/* VIEW: MENU */}
          {view === 'menu' && (
            <motion.div
              key="menu"
              id="menu-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl flex flex-col gap-6"
            >
              {/* Quick Stats Summary Card */}
              {(() => {
                const totalStars = Object.values(levelStars).reduce((acc: number, val: any) => acc + (typeof val === 'number' ? val : 0), 0);
                const md = modeDetails[config.language as 'pt' | 'en' | 'es'] || modeDetails.en;
                
                return (
                  <div className={`grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-3xl border shadow-xl ${activeTheme.cardBg} backdrop-blur-md relative overflow-hidden`}>
                    {/* Subtle decoration lines */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-current/[0.02] to-transparent pointer-events-none" />
                    
                    {/* Left: Avatar & XP Info */}
                    <div className="sm:col-span-8 flex items-center gap-4">
                      {(() => {
                        const activeFrameItem = SHOP_ITEMS.find(item => item.id === profile.frame && item.category === 'frame');
                        const frameClasses = activeFrameItem?.previewImage || 'border-transparent';
                        return (
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner relative group transition-transform duration-300 hover:scale-110 ${frameClasses}`}>
                            {profile.avatar === 'av_1' ? '🧘' : profile.avatar === 'av_2' ? '🧮' : profile.avatar === 'av_3' ? '💡' : profile.avatar === 'av_4' ? '⚔️' : profile.avatar === 'av_5' ? '🚀' : profile.avatar === 'av_6' ? '🐲' : profile.avatar === 'av_7' ? '🃏' : '🧙‍♂️'}
                            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-yellow-500 text-white text-[8px] font-mono font-bold uppercase tracking-wider shadow-md z-10">
                              LV {profile.level}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className={`text-base font-black uppercase tracking-wider ${activeTheme.textPrimary} flex items-center gap-1.5`}>
                            Logic Master
                            <Crown className="w-4 h-4 text-yellow-500 animate-pulse" />
                          </span>
                          <span className={`text-[10px] font-mono font-bold ${activeTheme.textSecondary}`}>XP {profile.xp} / {profile.level * 250}</span>
                        </div>
                        
                        {/* Active Avatar Perk Info */}
                        {(() => {
                          const activeAvatar = SHOP_ITEMS.find(item => item.id === profile.avatar && item.category === 'avatar');
                          const perkText = config.language === 'es' ? activeAvatar?.perkES : config.language === 'en' ? activeAvatar?.perkEN : activeAvatar?.perkPT;
                          return activeAvatar ? (
                            <div className="flex flex-col mb-1">
                              <span className="text-[10px] font-extrabold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                <span>{activeAvatar.previewImage}</span>
                                <span className="uppercase tracking-widest">{activeAvatar.nameKey}</span>
                              </span>
                              {perkText && (
                                <p className={`text-[9px] opacity-75 leading-tight ${activeTheme.textSecondary}`}>
                                  ⚡ {perkText}
                                </p>
                              )}
                            </div>
                          ) : null;
                        })()}

                        <div className="w-full h-1.5 bg-current/10 rounded-full overflow-hidden p-[1px]">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (profile.xp / (profile.level * 250)) * 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Stars and Stats info */}
                    <div className="sm:col-span-4 flex items-center justify-around sm:justify-end gap-6 sm:border-l sm:border-current/10 sm:pl-6">
                      <div className="flex flex-col items-center">
                        <span className={`text-[9px] font-mono uppercase tracking-widest opacity-65 mb-1 ${activeTheme.textSecondary}`}>
                          {config.language === 'pt' ? 'Estrelas' : config.language === 'es' ? 'Estrellas' : 'Stars'}
                        </span>
                        <div className="flex items-center gap-1.5 text-lg font-black text-yellow-500">
                          <Star className="w-4.5 h-4.5 fill-current" />
                          <span>{totalStars}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className={`text-[9px] font-mono uppercase tracking-widest opacity-65 mb-1 ${activeTheme.textSecondary}`}>
                          {config.language === 'pt' ? 'Nível Máx' : config.language === 'es' ? 'Nivel Máx' : 'Max Level'}
                        </span>
                        <div className="flex items-center gap-1.5 text-lg font-black" style={{ color: activeTheme.accentColor }}>
                          <Target className="w-4.5 h-4.5" />
                          <span>{currentLevelUnlocked - 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Title display */}
              <div className="text-center flex flex-col items-center gap-2 py-4 relative">
                {/* Glowing ambient background effect for title */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-12 rounded-full opacity-[0.08] blur-xl pointer-events-none" style={{ backgroundColor: activeTheme.accentColor }} />
                
                <h2 className={`text-6xl font-black tracking-tighter leading-none ${activeTheme.textPrimary} flex items-center justify-center gap-1`}>
                  Logic<span style={{ color: activeTheme.accentColor }}>Match</span>
                </h2>
                <p className="text-[11px] uppercase tracking-[0.25em] text-yellow-500 font-mono font-black">
                  LOGIC MASTER
                </p>
                <p className={`text-xs font-normal mt-3 max-w-md mx-auto leading-relaxed opacity-75 ${activeTheme.textSecondary}`}>
                  {config.language === 'pt' 
                    ? 'Combine números adjacentes iguais ou que somem 10. Desbloqueie temas especiais e teste seus reflexos em modos exclusivos.' 
                    : config.language === 'es'
                    ? 'Combina números adyacentes iguales o que sumen 10. Desbloquea temas especiales y prueba tus reflejos en modos exclusivos.'
                    : 'Combine adjacent equal numbers or those that sum to 10. Unlock special themes and test your reflexes in exclusive modes.'}
                </p>
              </div>

              {/* Bento Row: Primary Play Options (Resume Game / Campaign Mode) */}
              <div className="flex flex-col gap-3">
                {(() => {
                  const md = modeDetails[config.language as 'pt' | 'en' | 'es'] || modeDetails.en;
                  
                  return (
                    <div className={`grid grid-cols-1 ${activeSavedGame ? 'sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                      {/* Active Saved Game - Gold accent */}
                      {activeSavedGame && (
                        <motion.button
                          id="resume-game-btn"
                          onClick={resumeGame}
                          whileHover={{ y: -2 }}
                          whileTap={{ y: 2 }}
                          className="p-5 rounded-2xl font-bold text-left cursor-pointer transition-all border-2 border-b-6 border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10 border-b-orange-600 relative overflow-hidden group shadow-md"
                        >
                          <div className="absolute right-3 top-3 opacity-15 group-hover:opacity-25 transition-opacity">
                            <Play className="w-12 h-12 fill-orange-500 text-orange-500" />
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-orange-500 uppercase tracking-widest mb-1 font-bold">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                            <span>{config.language === 'pt' ? 'Partida Salva' : config.language === 'es' ? 'Partida Guardada' : 'Saved Game'}</span>
                          </div>
                          <h3 className="text-lg font-black text-orange-500 uppercase tracking-tight">
                            {md.resume.title}
                          </h3>
                          <p className={`text-xs font-medium opacity-80 mt-1 line-clamp-1 ${activeTheme.textSecondary}`}>
                            {md.resume.desc}
                          </p>
                        </motion.button>
                      )}

                      {/* Campaign / Levels Card */}
                      <motion.button
                        id="play-campaign-btn"
                        onClick={() => {
                          SynthAudio.playClick(config.soundEnabled);
                          setView('levels');
                        }}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 2 }}
                        className={`p-5 rounded-2xl font-bold text-left cursor-pointer transition-all border-2 border-b-6 relative overflow-hidden group shadow-md ${
                          activeSavedGame 
                            ? 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 border-b-yellow-600' 
                            : 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/15 border-b-yellow-500'
                        }`}
                      >
                        <div className="absolute right-3 top-3 opacity-15 group-hover:opacity-25 transition-opacity">
                          <Star className="w-12 h-12 fill-yellow-500 text-yellow-500" />
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-yellow-500 uppercase tracking-widest mb-1 font-bold">
                          <Crown className="w-3.5 h-3.5" />
                          <span>{config.language === 'pt' ? 'Mapa de Fases' : config.language === 'es' ? 'Mapa de Niveles' : 'Campaign Mode'}</span>
                        </div>
                        <h3 className="text-lg font-black text-yellow-500 uppercase tracking-tight">
                          {md.campaign.title}
                        </h3>
                        <p className={`text-xs font-medium opacity-85 mt-1 ${activeTheme.textSecondary}`}>
                          {config.language === 'pt' 
                            ? `Fases Completas: ${currentLevelUnlocked - 1} / ${CHALLENGE_LEVELS.length}` 
                            : config.language === 'es'
                            ? `Niveles Completados: ${currentLevelUnlocked - 1} / ${CHALLENGE_LEVELS.length}`
                            : `Levels Cleared: ${currentLevelUnlocked - 1} / ${CHALLENGE_LEVELS.length}`}
                        </p>
                      </motion.button>
                    </div>
                  );
                })()}
              </div>

              {/* Core Game Modes Grid */}
              <div className="flex flex-col gap-3">
                <h4 className={`text-[10px] font-mono uppercase tracking-[0.25em] font-black opacity-60 mb-1 border-b pb-2 border-current/10 ${activeTheme.textSecondary}`}>
                  {config.language === 'pt' ? 'Modos de Jogo Tradicionais' : config.language === 'es' ? 'Modos de Juego Tradicionales' : 'Traditional Game Modes'}
                </h4>
                
                {(() => {
                  const md = modeDetails[config.language as 'pt' | 'en' | 'es'] || modeDetails.en;
                  
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Classic Mode - Purple / Amethyst */}
                      <motion.button
                        id="play-classic-btn"
                        onClick={() => startNewGame('classic', 'medium')}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 2 }}
                        className={`p-4 rounded-2xl text-left cursor-pointer transition-all border-2 border-b-6 border-purple-500/20 bg-purple-500/[0.02] hover:bg-purple-500/[0.05] border-b-purple-600/50 relative group overflow-hidden`}
                      >
                        <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Play className="w-10 h-10 text-purple-500" />
                        </div>
                        <h5 className="text-sm font-black text-purple-500 uppercase tracking-wider mb-0.5">
                          {t.classic}
                        </h5>
                        <p className={`text-[11px] opacity-75 leading-snug font-medium ${activeTheme.textSecondary}`}>
                          {md.classic.desc}
                        </p>
                      </motion.button>

                      {/* Zen/Relax Mode - Emerald Green */}
                      <motion.button
                        id="play-relax-btn"
                        onClick={() => startNewGame('relax', 'easy')}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 2 }}
                        className={`p-4 rounded-2xl text-left cursor-pointer transition-all border-2 border-b-6 border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05] border-b-emerald-600/50 relative group overflow-hidden`}
                      >
                        <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Sparkles className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h5 className="text-sm font-black text-emerald-500 uppercase tracking-wider mb-0.5">
                          {t.relax}
                        </h5>
                        <p className={`text-[11px] opacity-75 leading-snug font-medium ${activeTheme.textSecondary}`}>
                          {md.relax.desc}
                        </p>
                      </motion.button>

                      {/* Timed Mode - Sky Blue */}
                      <motion.button
                        id="play-timed-btn"
                        onClick={() => startNewGame('timed', 'hard')}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 2 }}
                        className={`p-4 rounded-2xl text-left cursor-pointer transition-all border-2 border-b-6 border-sky-500/20 bg-sky-500/[0.02] hover:bg-sky-500/[0.05] border-b-sky-600/50 relative group overflow-hidden`}
                      >
                        <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Clock className="w-10 h-10 text-sky-500" />
                        </div>
                        <h5 className="text-sm font-black text-sky-500 uppercase tracking-wider mb-0.5">
                          {t.timed}
                        </h5>
                        <p className={`text-[11px] opacity-75 leading-snug font-medium ${activeTheme.textSecondary}`}>
                          {md.timed.desc}
                        </p>
                      </motion.button>

                      {/* Survival Mode - Rose Red */}
                      <motion.button
                        id="play-survival-btn"
                        onClick={() => startNewGame('survival', 'hard')}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 2 }}
                        className={`p-4 rounded-2xl text-left cursor-pointer transition-all border-2 border-b-6 border-rose-500/20 bg-rose-500/[0.02] hover:bg-rose-500/[0.05] border-b-rose-600/50 relative group overflow-hidden`}
                      >
                        <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Flame className="w-10 h-10 text-rose-500" />
                        </div>
                        <h5 className="text-sm font-black text-rose-500 uppercase tracking-wider mb-0.5">
                          {t.survival}
                        </h5>
                        <p className={`text-[11px] opacity-75 leading-snug font-medium ${activeTheme.textSecondary}`}>
                          {md.survival.desc}
                        </p>
                      </motion.button>

                      {/* Infinite Mode - Indigo / Violet */}
                      <motion.button
                        id="play-infinite-btn"
                        onClick={() => startNewGame('infinite', 'hard')}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 2 }}
                        className={`p-4 rounded-2xl text-left cursor-pointer transition-all border-2 border-b-6 border-indigo-500/20 bg-indigo-500/[0.02] hover:bg-indigo-500/[0.05] border-b-indigo-600/50 relative col-span-1 sm:col-span-2 group overflow-hidden`}
                      >
                        <div className="absolute right-4 top-3.5 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Infinity className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h5 className="text-sm font-black text-indigo-500 uppercase tracking-wider mb-0.5">
                          {t.infinite}
                        </h5>
                        <p className={`text-[11px] opacity-75 leading-snug font-medium ${activeTheme.textSecondary}`}>
                          {md.infinite.desc}
                        </p>
                      </motion.button>
                    </div>
                  );
                })()}
              </div>
              
              {/* Navigation Drawer Shortcuts - Bento Grid style bar */}
              <div className={`grid grid-cols-4 gap-2 pt-4 border-t ${activeTheme.borderPrimary}`}>
                <button
                  id="drawer-missions"
                  onClick={() => { SynthAudio.playClick(config.soundEnabled); setActiveModal('missions'); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-transparent hover:border-current/10 hover:bg-current/[0.02] text-[10px] uppercase tracking-widest transition-all opacity-85 hover:opacity-100 ${activeTheme.textSecondary} hover:${activeTheme.textPrimary}`}
                >
                  <Target className="w-5 h-5 mb-0.5" />
                  <span className="font-bold scale-90 sm:scale-100">{t.missions}</span>
                </button>
                <button
                  id="drawer-achievements"
                  onClick={() => { SynthAudio.playClick(config.soundEnabled); setActiveModal('achievements'); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-transparent hover:border-current/10 hover:bg-current/[0.02] text-[10px] uppercase tracking-widest transition-all opacity-85 hover:opacity-100 ${activeTheme.textSecondary} hover:${activeTheme.textPrimary}`}
                >
                  <Trophy className="w-5 h-5 mb-0.5" />
                  <span className="font-bold scale-90 sm:scale-100">{t.achievements}</span>
                </button>
                <button
                  id="drawer-shop"
                  onClick={() => { SynthAudio.playClick(config.soundEnabled); setActiveModal('shop'); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-transparent hover:border-current/10 hover:bg-current/[0.02] text-[10px] uppercase tracking-widest transition-all opacity-85 hover:opacity-100 ${activeTheme.textSecondary} hover:${activeTheme.textPrimary}`}
                >
                  <ShoppingBag className="w-5 h-5 mb-0.5" />
                  <span className="font-bold scale-90 sm:scale-100">{t.shop}</span>
                </button>
                <button
                  id="drawer-stats"
                  onClick={() => { SynthAudio.playClick(config.soundEnabled); setActiveModal('stats'); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-transparent hover:border-current/10 hover:bg-current/[0.02] text-[10px] uppercase tracking-widest transition-all opacity-85 hover:opacity-100 ${activeTheme.textSecondary} hover:${activeTheme.textPrimary}`}
                >
                  <BarChart3 className="w-5 h-5 mb-0.5" />
                  <span className="font-bold scale-90 sm:scale-100">{t.stats}</span>
                </button>
              </div>
            </motion.div>
          )}

        {/* VIEW: LEVEL SELECTOR */}
        {view === 'levels' && (
          <LevelSelector
            key="levels"
            currentLevelUnlocked={currentLevelUnlocked}
            levelStars={levelStars}
            config={config}
            onSelectLevel={(lvl) => startNewGame('challenge', 'medium', lvl)}
            onBack={() => setView('menu')}
            themeStyles={activeTheme}
          />
        )}

        {/* VIEW: ACTIVE GAMEPLAY */}
        {view === 'game' && (
          <motion.div
            key="game"
            id="gameplay-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
          >
            {/* COLUMN 1: Dynamic Info Panel (Full dashboard) */}
            <div className="lg:col-span-4 w-full">
              <InfoPanel
                mode={mode}
                levelId={levelId}
                score={score}
                highScore={stats.highScore[mode] || 0}
                lives={lives}
                maxLives={maxLives}
                combo={combo}
                maxComboInLevel={maxComboInLevel}
                clearedIce={clearedIce}
                clearedLocks={clearedLocks}
                clearedBombs={clearedBombs}
                clearedNumbersCount={clearedNumbersCount}
                movesLeft={movesLeft}
                timeLeft={timeLeft}
                survivalTick={survivalTick}
                themeStyles={activeTheme}
                config={config}
                hintsUsed={hintsUsed}
                linesAddedCount={linesAddedCount}
                challengeLevels={CHALLENGE_LEVELS}
                currentLevelUnlocked={currentLevelUnlocked}
                onSelectLevel={(lvlId) => {
                  SynthAudio.playClick(config.soundEnabled);
                  startNewGame('challenge', 'medium', lvlId);
                }}
              />
            </div>

            {/* COLUMN 2: Game Board & Play Controls */}
            <div className="lg:col-span-8 w-full flex flex-col gap-4">
              {/* Controller / Powerup panel */}
              <div className="flex flex-wrap justify-between items-center gap-3 px-1">
                {/* Pause Button */}
                <button
                  id="quit-game-btn"
                  onClick={() => {
                    SynthAudio.playClick(config.soundEnabled);
                    setIsPaused(true);
                  }}
                  className={`flex items-center gap-1.5 text-xs py-2 px-4 rounded-xl border transition-all cursor-pointer active:scale-95 ${activeTheme.secondaryBtn}`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </button>

                {/* Powerups row */}
                <div className="flex flex-wrap gap-2">
                  <button
                    id="powerup-shuffle-btn"
                    onClick={handleShuffle}
                    className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${activeTheme.secondaryBtn}`}
                  >
                    <Shuffle className="w-3.5 h-3.5 text-orange-500" />
                    <span className="hidden sm:inline">
                      {config.language === 'pt' ? 'Embaralhar' : config.language === 'es' ? 'Barajar' : 'Shuffle'}
                    </span>
                    <span>{mode === 'relax' ? '' : `(${shufflesLeft})`}</span>
                  </button>

                  <button
                    id="powerup-add-btn"
                    onClick={handleAddNumbers}
                    className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${activeTheme.primaryBtn}`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.add_numbers}</span>
                  </button>

                  
                  <button
                    id="powerup-undo-btn"
                    onClick={handleUndo}
                    disabled={!canUndoState}
                    className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${canUndoState ? activeTheme.secondaryBtn : 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500'}`}
                  >
                    <Undo2 className="w-4 h-4 text-blue-400" />
                    <span className="hidden sm:inline">{config.language === 'pt' ? 'Desfazer' : config.language === 'es' ? 'Deshacer' : 'Undo'}</span>
                  </button>

                  <button
                    id="powerup-hint-btn"
                    onClick={handleRequestHint}
                    className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${activeTheme.secondaryBtn}`}
                  >
                    <Lightbulb className="w-4 h-4 text-yellow-500 animate-pulse" />
                    <span className="hidden sm:inline">{t.hint}</span>
                    <span>{mode === 'relax' ? '' : `(${hintsLeft})`}</span>
                  </button>
                </div>
              </div>

              {/* Visual Error Explanation Banner */}
              {invalidMatch && (
                <div id="invalid-match-explanation" className="text-center text-xs font-bold text-red-400 bg-red-950/45 border border-red-500/25 py-2.5 px-4 rounded-xl animate-shake shadow-lg">
                  ⚠️ {invalidMatch.message}
                </div>
              )}

              {toastMsg && (
                <div id="game-toast-notification" className={`text-center text-xs font-bold py-2.5 px-4 rounded-xl animate-shake shadow-lg ${
                  toastMsg.type === 'error' 
                    ? 'text-red-500 bg-red-500/10 border border-red-500/20' 
                    : toastMsg.type === 'success'
                    ? 'text-green-500 bg-green-500/10 border border-green-500/20'
                    : 'text-yellow-600 bg-yellow-500/10 border border-yellow-500/20 dark:text-yellow-400'
                }`}>
                  {toastMsg.text}
                </div>
              )}

              {/* Game board component */}
              <div className="flex-1 flex justify-center items-center w-full">
                <GameGrid
                  cells={cells}
                  cols={cols}
                  selectedIndex={selectedIndex}
                  onCellClick={handleCellClick}
                  config={config}
                  themeStyles={activeTheme}
                  highlightedIndices={highlightedIndices}
                  errorIndices={invalidMatch ? [invalidMatch.idxA, invalidMatch.idxB] : []}
                  animatingMatch={animatingMatch}
                  activeExplosions={activeExplosions}
                  floatingScores={floatingScores}
                  mode={mode}
                  isShuffling={isShuffling}
                />
              </div>

              {/* Highlighted hint notification indicator */}
              {highlightedIndices.length > 0 && (
                <div id="hint-found-msg" className="text-center text-xs font-semibold text-yellow-400 animate-pulse py-1">
                  Pares identificados piscando no tabuleiro!
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>

      {/* FOOTER curated credits */}
      <footer className="py-4 px-6 text-center text-[10px] uppercase tracking-widest text-gray-500 border-t border-white/5 bg-black/5 relative z-10">
        MendesUp. Todos os direitos reservados
      </footer>

      {/* DIALOG OVERLAY: BOARD LOCKED (NO MOVES REMAINING) */}
      {isBoardLocked && !gameOver && !victory && (
        <div id="dialog-board-locked" className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`p-8 rounded-2xl border max-w-sm w-full text-center flex flex-col gap-5 items-center ${activeTheme.cardBg} ${activeTheme.bg}`}>
            <Shuffle className="w-16 h-16 text-orange-400 animate-pulse" />
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-serif italic text-white">
                {config.language === 'pt' ? 'Sem Movimentos!' : config.language === 'es' ? '¡Sin Movimientos!' : 'No Moves Available!'}
              </h3>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                {config.language === 'pt' 
                  ? 'Não existem mais combinações válidas no tabuleiro! Use uma das opções abaixo para continuar.' 
                  : config.language === 'es' 
                  ? '¡No hay más combinaciones válidas en el tablero! Usa una de las siguientes opciones.' 
                  : 'There are no more valid combinations on the board! Select an option below to continue.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                id="lock-shuffle-btn"
                onClick={handleShuffle}
                disabled={shufflesLeft <= 0 && mode !== 'relax'}
                className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${shufflesLeft > 0 || mode === 'relax' ? activeTheme.primaryBtn : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/30'}`}
              >
                🔀 {config.language === 'pt' ? 'Embaralhar' : config.language === 'es' ? 'Barajar' : 'Shuffle'} {mode === 'relax' ? '' : `(${shufflesLeft})`}
              </button>
              <button
                id="lock-add-btn"
                onClick={handleAddNumbers}
                className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all text-white`}
              >
                ➕ {config.language === 'pt' ? 'Duplicar Números' : config.language === 'es' ? 'Duplicar Números' : 'Add Numbers'}
              </button>
              <button
                id="lock-restart-btn"
                onClick={() => startNewGame(mode, difficulty, levelId)}
                className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all`}
              >
                🔄 {config.language === 'pt' ? 'Reiniciar Partida' : config.language === 'es' ? 'Reiniciar Partida' : 'Restart Match'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG OVERLAY: GAME OVER */}
      {gameOver && (
        <div id="dialog-gameover" className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`p-8 rounded-2xl border max-w-sm w-full text-center flex flex-col gap-5 items-center ${activeTheme.cardBg} ${activeTheme.bg}`}>
            <AlertCircle className="w-16 h-16 text-red-500 animate-bounce" />
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-serif italic text-white">{t.game_over}</h3>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Não há mais jogadas válidas ou o tempo esgotou. Refine sua tática e tente novamente!
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                id="gameover-retry-btn"
                onClick={() => startNewGame(mode, difficulty, levelId)}
                className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTheme.primaryBtn}`}
              >
                {t.try_again}
              </button>
              <button
                id="gameover-quit-btn"
                onClick={() => {
                  SynthAudio.playClick(config.soundEnabled);
                  setView(levelId ? 'levels' : 'menu');
                  setGameOver(false);
                }}
                className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all text-white`}
              >
                {t.back}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG OVERLAY: VICTORY */}
      {victory && (
        <div id="dialog-victory" className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`p-8 rounded-2xl border max-w-sm w-full text-center flex flex-col gap-4 items-center ${activeTheme.cardBg} ${activeTheme.bg}`}>
            <Crown className="w-14 h-14 text-yellow-400 animate-pulse animate-bounce-slow" />
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-serif italic text-white">{t.victory}</h3>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Você limpou o tabuleiro com absoluta maestria. Recompensas adicionadas ao perfil!
              </p>
            </div>

            {/* Detailed Scoring Breakdown */}
            {victoryBreakdown && (
              <div id="victory-score-breakdown" className="w-full text-left bg-black/30 border border-white/5 rounded-xl p-3.5 flex flex-col gap-1.5 font-mono text-[10px] text-gray-400">
                <div className="flex justify-between">
                  <span>Pontos Base:</span>
                  <span className="text-white font-bold">{victoryBreakdown.baseScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dificuldade ({difficulty.toUpperCase()}):</span>
                  <span className="text-green-400 font-bold">+{victoryBreakdown.difficultyBonus.toLocaleString()}</span>
                </div>
                {victoryBreakdown.timeBonus > 0 && (
                  <div className="flex justify-between">
                    <span>Bônus de Tempo:</span>
                    <span className="text-blue-400 font-bold">+{victoryBreakdown.timeBonus.toLocaleString()}</span>
                  </div>
                )}
                {victoryBreakdown.cleanBonus > 0 ? (
                  <div className="flex justify-between">
                    <span>Jogo Limpo (Sem Auxílios):</span>
                    <span className="text-yellow-400 font-bold">+{victoryBreakdown.cleanBonus.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex justify-between opacity-30">
                    <span>Jogo Limpo:</span>
                    <span>Sem bônus (auxílios usados)</span>
                  </div>
                )}
                <div className="h-px bg-white/5 my-1" />
                <div className="flex justify-between text-[11px] text-white font-bold">
                  <span>Pontuação Final:</span>
                  <span className="text-yellow-400 font-black">{victoryBreakdown.finalScore.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Stars display (For Challenge Level wins) */}
            {levelId && levelStars[levelId] && (
              <div className="flex gap-1 py-1">
                {[1, 2, 3].map((starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-6 h-6 ${starIdx <= (levelStars[levelId] || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                  />
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                id="victory-continue-btn"
                onClick={() => {
                  SynthAudio.playClick(config.soundEnabled);
                  setView(levelId ? 'levels' : 'menu');
                  setVictory(false);
                }}
                className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTheme.primaryBtn}`}
              >
                {t.continue}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG OVERLAY: LEVEL UP */}
      {showLevelUp && (
        <div id="dialog-levelup" className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`p-8 rounded-2xl border max-w-sm w-full text-center flex flex-col gap-5 items-center ${activeTheme.cardBg} ${activeTheme.bg}`}>
            <Sparkles className="w-16 h-16 text-green-400 animate-spin-slow" />
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-serif italic text-white">{t.level_up}</h3>
              <p className="text-xs text-gray-400">Você alcançou o Nível {profile.level}!</p>
              <p className="text-[11px] text-yellow-500 font-bold tracking-widest uppercase mt-2">+100 Moedas de Bônus!</p>
            </div>
            <button
              id="levelup-close-btn"
              onClick={() => {
                const nextProfile = { ...profile };
                nextProfile.coins += 100; // Gift!
                setProfile(nextProfile);
                GameStorage.saveProfile(nextProfile);

                const nextStats = { ...stats };
                nextStats.totalCoinsEarned = (nextStats.totalCoinsEarned || 0) + 100;
                setStats(nextStats);
                GameStorage.saveStats(nextStats);

                GameStorage.updateAchievementProgress('coins', nextProfile.coins);
                setProfile(GameStorage.getProfile());

                setShowLevelUp(false);
                SynthAudio.playCoin(config.soundEnabled);
              }}
              className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest w-full mt-2 transition-all ${activeTheme.primaryBtn}`}
            >
              Maravilha!
            </button>
          </div>
        </div>
      )}

      {/* CORE MODALS ROUTING */}
      {activeModal === 'config' && (
        <ConfigModal
          config={config}
          onUpdateConfig={(cfg) => {
            setConfig(cfg);
            GameStorage.saveConfig(cfg);
          }}
          onResetData={() => {
            GameStorage.clearAllData();
            window.location.reload();
          }}
          onExportData={() => {
            return GameStorage.exportData();
          }}
          onImportData={(base64) => {
            const ok = GameStorage.importData(base64);
            if (ok) {
              setConfig(GameStorage.getConfig());
              setProfile(GameStorage.getProfile());
              setStats(GameStorage.getStats());
              setMissions(GameStorage.getMissions());
              setAchievements(GameStorage.getAchievements());
            }
            return ok;
          }}
          onClose={() => setActiveModal(null)}
          themeStyles={activeTheme}
        />
      )}

      {activeModal === 'stats' && (
        <StatsModal
          stats={stats}
          config={config}
          onClose={() => setActiveModal(null)}
          themeStyles={activeTheme}
        />
      )}

      {activeModal === 'missions' && (
        <MissionsModal
          missions={missions}
          config={config}
          onClose={() => setActiveModal(null)}
          themeStyles={activeTheme}
        />
      )}

      {activeModal === 'achievements' && (
        <AchievementsModal
          achievements={achievements}
          config={config}
          onClose={() => setActiveModal(null)}
          themeStyles={activeTheme}
        />
      )}

      {activeModal === 'shop' && (
        <ShopModal
          profile={profile}
          config={config}
          onPurchase={handlePurchaseItem}
          onEquip={handleEquipItem}
          onClose={() => setActiveModal(null)}
          themeStyles={activeTheme}
        />
      )}

      {/* PAUSE MODAL */}
      {isPaused && (
        <PauseModal
          language={config.language}
          soundEnabled={config.soundEnabled}
          score={score}
          mode={t[mode] || mode}
          themeStyles={activeTheme}
          onResume={() => setIsPaused(false)}
          onRestart={() => setShowRestartConfirm(true)}
          onExit={() => setShowExitConfirm(true)}
        />
      )}

      {/* CONFIRM RESTART MODAL */}
      {showRestartConfirm && (
        <div id="dialog-confirm-restart" className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className={`p-8 rounded-2xl border max-w-sm w-full text-center flex flex-col gap-5 items-center ${activeTheme.cardBg} ${activeTheme.bg}`}>
            <AlertCircle className="w-16 h-16 text-yellow-500 animate-pulse" />
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-serif italic text-white">Reiniciar Partida?</h3>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Deseja mesmo recomeçar o tabuleiro do zero? Seu progresso e pontuação atuais nesta partida serão redefinidos.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
              <button
                id="restart-confirm-yes-btn"
                onClick={() => {
                  startNewGame(mode, difficulty, levelId);
                }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all cursor-pointer`}
              >
                Sim, Reiniciar
              </button>
              <button
                id="restart-confirm-no-btn"
                onClick={() => {
                  SynthAudio.playClick(config.soundEnabled);
                  setShowRestartConfirm(false);
                }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5 text-white transition-all cursor-pointer`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM EXIT MODAL */}
      {showExitConfirm && (
        <div id="dialog-confirm-exit" className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className={`p-8 rounded-2xl border max-w-sm w-full text-center flex flex-col gap-5 items-center ${activeTheme.cardBg} ${activeTheme.bg}`}>
            <AlertCircle className="w-16 h-16 text-red-500 animate-bounce" />
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-serif italic text-white">Sair do Jogo?</h3>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Tem certeza que deseja sair para o menu principal? Todo o progresso desta partida ativa será perdido.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
              <button
                id="exit-confirm-yes-btn"
                onClick={() => {
                  SynthAudio.playClick(config.soundEnabled);
                  GameStorage.clearActiveGame();
                  setActiveSavedGame(null);
                  setView(levelId ? 'levels' : 'menu');
                  setIsPaused(false);
                  setShowExitConfirm(false);
                }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all cursor-pointer`}
              >
                Sim, Sair
              </button>
              <button
                id="exit-confirm-no-btn"
                onClick={() => {
                  SynthAudio.playClick(config.soundEnabled);
                  setShowExitConfirm(false);
                }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5 text-white transition-all cursor-pointer`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAILY REWARD DIALOG */}
      {dailyReward && (
        <div id="dialog-daily-reward" className="fixed inset-0 bg-black/95 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className={`max-w-md w-full p-8 rounded-3xl border border-yellow-500/30 bg-black shadow-2xl shadow-yellow-500/20 text-center relative overflow-hidden`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
            
            <div className="mx-auto w-20 h-20 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center mb-6">
              <Gift className="w-10 h-10 text-yellow-400" />
            </div>
            
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Recompensa Diária</h2>
            <p className="text-gray-400 text-sm mb-6">Você voltou! Aqui está seu bônus de login diário.</p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">Sequência</span>
                <span className="text-yellow-400 font-bold font-mono">{dailyReward.streak} dias🔥</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">Recompensa</span>
                <span className="text-yellow-400 font-bold font-mono text-xl">+{dailyReward.rewardCoins} 🪙</span>
              </div>
            </div>

            <button
              id="claim-daily-btn"
              onClick={() => {
                SynthAudio.playClick(config.soundEnabled);
                setDailyReward(null);
              }}
              className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest bg-yellow-500 text-black hover:bg-yellow-400 transition-all`}
            >
              Coletar Recompensa
            </button>
          </motion.div>
        </div>
      )}

      {/* TUTORIAL OVERLAY */}
      {tutorialStep !== null && (
        <TutorialOverlay
          language={config.language}
          soundEnabled={config.soundEnabled}
          themeStyles={activeTheme}
          onClose={() => {
            setTutorialStep(null);
            setSeenTutorial(true);
            localStorage.setItem('numzen_seen_tutorial', 'true');
          }}
        />
      )}
    </div>
  );
}
