import { useState, useEffect, useRef } from 'react';
import { GameMode, Difficulty, Cell, UserProfile, UserStats, GameConfig, GameMission, Achievement } from './types';
import { THEMES, TRANSLATIONS, DEFAULT_ACHIEVEMENTS } from './config/gameConfig';
import { GameEngine } from './core/gameEngine';
import { GameStorage } from './storage/db';
import { SynthAudio } from './audio/synth';

// Icons
import {
  Play, Settings, Trophy, ShoppingBag, Target, BarChart3, ChevronLeft,
  Plus, Lightbulb, Clock, Flame, Coins, Crown, Sparkles, AlertCircle,
  HelpCircle, Volume2, RotateCcw, X, Info, Star, Shuffle, Heart, Infinity
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

export default function App() {
  // Navigation & View states
  const [view, setView] = useState<'menu' | 'levels' | 'game'>('menu');
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
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
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);
  
  // Match objectives (for Challenge Mode)
  const [clearedIce, setClearedIce] = useState<number>(0);
  const [clearedLocks, setClearedLocks] = useState<number>(0);
  const [clearedBombs, setClearedBombs] = useState<number>(0);
  const [linesAddedCount, setLinesAddedCount] = useState<number>(0);
  const [maxComboInLevel, setMaxComboInLevel] = useState<number>(1);
  const [clearedNumbersCount, setClearedNumbersCount] = useState<number>(0);

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
    return saved ? parseInt(saved, 10) : 1;
  });
  const [levelStars, setLevelStars] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('numzen_challenge_stars');
    return saved ? JSON.parse(saved) : {};
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
  const gameIntervalRef = useRef<any>(null);
  const comboTimeoutRef = useRef<any>(null);
  const fpsFrameRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(0);

  const t = TRANSLATIONS[config.language];
  const activeTheme = THEMES.find(th => th.id === profile.theme) || THEMES[0];

  // Initialize login streak and sound engines on mount
  useEffect(() => {
    GameStorage.updateLoginStreak();
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

    // PWA: Listen for installation prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // PWA: Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      SynthAudio.stopMusic();
    };
  }, []);

  // PWA shortcut launcher, network listeners and iOS Safari detection
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

    // iOS Safari Detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsIOS(isIOSDevice);
    setIsStandalone(isStandaloneMode);

    // Deep-link check for PWA shortcuts (?mode=...)
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

  // PWA: Install click handler
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    SynthAudio.playClick(config.soundEnabled);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation choice: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

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
      const nextStats = { ...stats };
      nextStats.totalTimePlayed += 1;
      setStats(nextStats);
      GameStorage.saveStats(nextStats);

      // 2. Timed Mode logic
      if (mode === 'timed' || (levelId && CHALLENGE_LEVELS.find(l => l.id === levelId)?.timeLimit)) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(gameIntervalRef.current);
            handleGameOver();
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
              
              // If rows exceed visual maximum
              const rowsCount = Math.ceil(withLine.length / cols);
              if (rowsCount > 50) {
                handleGameOver();
              }
              return withLine;
            });
            
            setTimeout(() => {
              const container = document.getElementById('app-container');
              if (container) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
              }
            }, 100);

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

  useEffect(() => {
    if (view === 'game' && !gameOver && !victory && cells.length > 0 && !isResumingRef.current) {
      const stateToSave = {
        mode, difficulty, levelId, cells, cols, score, combo, timeLeft, survivalTick,
        hintsLeft, highlightedIndices, clearedIce, clearedLocks, clearedBombs,
        linesAddedCount, maxComboInLevel, clearedNumbersCount, lives, maxLives, shufflesLeft, movesLeft,
        hintsUsed, powersUsed, lastMatchTime
      };
      GameStorage.saveActiveGame(stateToSave);
      // Don't call setActiveSavedGame here to avoid unnecessary re-renders in the menu
    }
  }, [view, mode, difficulty, levelId, cells, cols, score, combo, timeLeft, survivalTick, hintsLeft, highlightedIndices, clearedIce, clearedLocks, clearedBombs, linesAddedCount, maxComboInLevel, clearedNumbersCount, lives, maxLives, shufflesLeft, movesLeft, hintsUsed, powersUsed, lastMatchTime, gameOver, victory]);

  // Handle Level XP and Profile state updates
  const handleXPAdd = (amount: number) => {
    const res = GameStorage.addXP(amount, profile);
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
    setIsPaused(false);
    setShowRestartConfirm(false);
    setShowExitConfirm(false);
    
    // Set hints
    setHintsLeft(selectedMode === 'relax' ? 999 : 3);

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
    }

    setLives(initialLives);
    setMaxLives(initialLives);
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
    const { cells: initialCells, cols: initialCols } = GameEngine.generateInitialBoard(boardMode, selectedDiff, profile.level);
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
        setMovesLeft(levelRef.movesLimit);
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
    if (lvlId === 1 || lvlId === 6) return 'frozen';
    if (lvlId === 4 || lvlId === 9) return 'locks';
    if (lvlId === 3 || lvlId === 8) return 'bombs';
    return 'classic';
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

  const checkVictoryConditions = (scoreVal: number, cellsLeft: Cell[], finalStep = false) => {
    const activeLeft = cellsLeft.filter(c => !c.removed).length;

    // Challenge Level criteria
    if (levelId) {
      const lvl = CHALLENGE_LEVELS.find(l => l.id === levelId);
      if (!lvl) return;

      let scoreTargetMet = scoreVal >= lvl.targetScore;
      let specialTargetMet = true;

      if (lvl.specialCondition) {
        const condType = lvl.specialCondition.type;
        const targetVal = lvl.specialCondition.count;

        if (condType === 'ice') specialTargetMet = clearedIce >= targetVal;
        if (condType === 'locks') specialTargetMet = clearedLocks >= targetVal;
        if (condType === 'bombs') specialTargetMet = clearedBombs >= targetVal;
        if (condType === 'no_hints') specialTargetMet = hintsUsed === 0;
        if (condType === 'no_duplicates') specialTargetMet = linesAddedCount === 0;
        if (condType === 'combo_streak') specialTargetMet = maxComboInLevel >= targetVal;
        if (condType === 'cleared_numbers') specialTargetMet = clearedNumbersCount >= targetVal;
        if (condType === 'supreme_zen') specialTargetMet = hintsUsed === 0 && maxComboInLevel >= targetVal;
      }

      if (scoreTargetMet && specialTargetMet) {
        handleVictory(scoreVal);
      } else if (finalStep && activeLeft === 0) {
        // Clear board but targets missed
        handleGameOver();
      }
      return;
    }

    // Classic/Normal modes: victory when full board is empty
    if (activeLeft === 0) {
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

      if (levelId === currentLevelUnlocked && levelId < 15) {
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

    const nextProfile = { ...profile };
    nextProfile.coins += coinReward;
    setProfile(nextProfile);
    GameStorage.saveProfile(nextProfile);

    handleXPAdd(xpReward);

    // Achievements trigger with computed final score
    GameStorage.updateAchievementProgress('score', computedFinalScore);
    GameStorage.updateAchievementProgress('games', nextStats.totalMatches);
    GameStorage.updateAchievementProgress('coins', nextProfile.coins);
    
    if (difficulty === 'insane') {
      GameStorage.updateAchievementProgress('special', 1, 'win_insane');
    }

    // Daily missions checking
    const m1 = GameStorage.updateMissionProgress('daily_score', computedFinalScore);
    const m2 = GameStorage.updateMissionProgress('daily_games', 1);
    setMissions(GameStorage.getMissions());
  };

  // Check if any moves are available with proactive, Zen-flow auto-reorganization
  const checkBoardLock = (currentCells: Cell[], currentCols: number) => {
    const activeCount = currentCells.filter(c => !c.removed).length;
    if (activeCount === 0) {
      setIsBoardLocked(false);
      return; // Victory handled separately
    }

    const matches = GameEngine.getAvailableMatches(currentCells, currentCols);
    if (matches.length === 0) {
      // Reorganize automatically keeping Zen momentum!
      showToast(
        config.language === 'pt' 
          ? '🧘 Sem movimentos! Reorganizando tabuleiro automaticamente...' 
          : config.language === 'es' 
          ? '🧘 ¡Sin movimientos! Reorganizando el tablero automáticamente...' 
          : '🧘 No moves left! Reorganizing board automatically...',
        'info'
      );
      
      setTimeout(() => {
        setIsShuffling(true);
        SynthAudio.playShuffle(config.soundEnabled);
        const shuffled = GameEngine.shuffleBoard(currentCells, currentCols);
        setCells(shuffled);
        
        // Confirm if we now have moves
        const newMatches = GameEngine.getAvailableMatches(shuffled, currentCols);
        if (newMatches.length === 0) {
          const added = GameEngine.addNumbers(shuffled, currentCols);
          setCells(added);
          setLinesAddedCount(prev => prev + 1);
          showToast(
            config.language === 'pt' ? '➕ Números duplicados para prosseguir!' : '➕ Numbers duplicated!',
            'success'
          );
        }

        setTimeout(() => {
          setIsShuffling(false);
        }, 850);
      }, 950);
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
      const isAdjacent = GameEngine.checkAdjacent(selectedIndex, idx, cells, cols);

      if (isMatchable && isAdjacent) {
        // Valid Match!
        const firstIdx = selectedIndex; // Store local reference
        setSelectedIndex(null); // Clear selectedIndex immediately to prevent double-matching/selection!

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
          safeBombBonusScore = 150;
          // Earn 2 coins for safe detonation
          const updatedProfile = { ...profile, coins: profile.coins + 2 };
          setProfile(updatedProfile);
          GameStorage.saveProfile(updatedProfile);
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
          GameStorage.updateAchievementProgress('special', stats.totalClearedPieces + 1, 'bomb');
          showToast('💣 BOMBA DETONADA COM SUCESSO! +150 PTS +2 MOEDAS', 'success');
        } else if (result.isIceBroken) {
          SynthAudio.playIceBreak(config.soundEnabled);
          setClearedIce(prev => prev + 1);
          GameStorage.updateAchievementProgress('special', stats.totalClearedPieces + 1, 'ice');
        } else if (result.isLockOpened) {
          SynthAudio.playUnlock(config.soundEnabled);
          setClearedLocks(prev => prev + 1);
          GameStorage.updateAchievementProgress('special', stats.totalClearedPieces + 1, 'lock');
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
          return nextCombo;
        });

        // Reset Combo Timer (Multipliers Mode holds combo for 6 seconds, others 4 seconds)
        const comboHoldTime = mode === 'multipliers' ? 6000 : 4000;
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
                  if (nextLives <= 0) {
                    setTimeout(() => handleGameOver(), 150);
                  }
                  return nextLives;
                });
                showToast(`💥 ${bombsDetonatedCount} BOMBA(S) DETONARAM! -${bombsDetonatedCount * 2} VIDAS!`, 'error');
              } else {
                showToast(`💥 ${bombsDetonatedCount} BOMBA(S) DETONARAM!`, 'error');
              }

              SynthAudio.playExplosion(config.soundEnabled);

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
          checkVictoryConditions(nextScore, cleanedCells);

          // Check for locked state (no more moves)
          checkBoardLock(cleanedCells, cols);
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
        setSelectedIndex(null); // Clear selectedIndex immediately so user can select another cell right away

        // Set invalid match state to show shaking red cells and error explanation
        setInvalidMatch({ idxA: prevSelectedIndex, idxB: idx, message: explanation });

        // Deduct life (only in survival) or deduct 10s (in timed)
        if (mode === 'timed') {
          setTimeLeft(prev => Math.max(0, prev - 10)); // 10s penalty
        } else if (mode === 'survival') {
          setLives(prev => {
            const nextLives = prev - 1;
            if (nextLives <= 0) {
              handleGameOver();
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
    SynthAudio.playClick(config.soundEnabled);
    const nextCells = GameEngine.addNumbers(cells, cols);
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

    // Check if added cells exceed visual boundaries
    const rows = Math.ceil(nextCells.length / cols);
    if (rows > 50) {
      handleGameOver();
    }
  };

  // Shuffle powerup
  const handleShuffle = () => {
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

          {/* Offline Indicator */}
          {!isOnline && (
            <div
              id="offline-badge"
              className="flex items-center gap-1.5 py-1 px-3 rounded-full border border-red-500/30 bg-red-500/10 text-[10px] font-bold text-red-500 dark:text-red-400 animate-pulse"
              title="Modo Offline Ativo"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>OFFLINE</span>
            </div>
          )}

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
        
        {/* VIEW: MENU */}
        {view === 'menu' && (
          <div id="menu-screen" className="w-full max-w-md flex flex-col gap-6 animate-fadeIn">
            {/* Quick Stats Summary */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${activeTheme.cardBg}`}>
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-3xl shrink-0 ${profile.frame}`}>
                {profile.avatar === 'av_1' ? '🧘' : profile.avatar === 'av_2' ? '🧮' : profile.avatar === 'av_3' ? '💡' : profile.avatar === 'av_4' ? '⚔️' : profile.avatar === 'av_5' ? '🚀' : profile.avatar === 'av_6' ? '🐲' : profile.avatar === 'av_7' ? '🃏' : '🧙‍♂️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className={`text-sm font-bold uppercase tracking-wider ${activeTheme.textPrimary}`}>Logic Master</span>
                  <span className={`text-[10px] font-mono ${activeTheme.textSecondary}`}>XP {profile.xp} / {profile.level * 250}</span>
                </div>
                <div className="w-full h-1.5 bg-current/10 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (profile.xp / (profile.level * 250)) * 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Title display */}
            <div className="text-center flex flex-col items-center gap-2 py-6 relative">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-[10px] font-mono tracking-widest uppercase font-black text-yellow-500 rounded-full mb-2">
                ⚡ VERSION 2.0 ADVANCED
              </div>
              <h2 className={`text-6xl font-black tracking-tighter leading-none ${activeTheme.textPrimary} flex items-center justify-center gap-1`}>
                Logic<span style={{ color: activeTheme.accentColor }}>Match</span>
              </h2>
              <p className="text-[11px] uppercase tracking-[0.25em] text-yellow-500 font-mono font-semibold">
                LOGIC MASTER
              </p>
              <p className={`text-xs font-light mt-3 max-w-sm mx-auto leading-relaxed ${activeTheme.textSecondary}`}>
                {config.language === 'pt' 
                  ? 'Combine números adjacentes iguais ou que somem 10. Desbloqueie temas especiais e teste seus reflexos em modos exclusivos.' 
                  : config.language === 'es'
                  ? 'Combina números adyacentes iguales o que sumen 10. Desbloquea temas especiales y prueba tus reflejos en modos exclusivos.'
                  : 'Combine adjacent equal numbers or those that sum to 10. Unlock special themes and test your reflexes in exclusive modes.'}
              </p>
            </div>

            {/* Play Options Grid */}
            <div className="flex flex-col gap-3">
              {activeSavedGame && (
                <button
                  id="resume-game-btn"
                  onClick={resumeGame}
                  className={`py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-2.5 cursor-pointer shadow-lg transition-all border border-orange-500/50 bg-orange-500 text-white hover:bg-orange-600 active:scale-95`}
                >
                  <Play className="w-4 h-4 fill-current text-current" />
                  <span>{config.language === 'pt' ? 'Continuar Partida' : config.language === 'es' ? 'Continuar Partida' : 'Resume Game'}</span>
                </button>
              )}
              
              <button
                id="play-classic-btn"
                onClick={() => startNewGame('classic', 'medium')}
                className={`py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-2.5 cursor-pointer shadow-lg transition-all ${activeSavedGame ? activeTheme.secondaryBtn : activeTheme.primaryBtn}`}
              >
                <Play className="w-4 h-4 fill-current text-current" />
                <span>{activeSavedGame ? (config.language === 'pt' ? 'Novo Jogo' : config.language === 'es' ? 'Nuevo Juego' : 'New Game') : t.classic}</span>
              </button>

              <button
                id="play-relax-btn"
                onClick={() => startNewGame('relax', 'easy')}
                className={`py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-2.5 cursor-pointer shadow-lg transition-all ${activeTheme.secondaryBtn}`}
              >
                <Sparkles className="w-4 h-4 text-current" />
                <span>{t.relax}</span>
              </button>

              <button
                id="play-timed-btn"
                onClick={() => startNewGame('timed', 'hard')}
                className={`py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-2.5 cursor-pointer shadow-lg transition-all ${activeTheme.secondaryBtn}`}
              >
                <Clock className="w-4 h-4 text-current" />
                <span>{t.timed}</span>
              </button>

              <button
                id="play-survival-btn"
                onClick={() => startNewGame('survival', 'hard')}
                className={`py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-2.5 cursor-pointer shadow-lg transition-all ${activeTheme.secondaryBtn}`}
              >
                <Flame className="w-4 h-4 text-current" />
                <span>{t.survival}</span>
              </button>

              <button
                id="play-infinite-btn"
                onClick={() => startNewGame('infinite', 'hard')}
                className={`py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-2.5 cursor-pointer shadow-lg transition-all ${activeTheme.secondaryBtn}`}
              >
                <Infinity className="w-4 h-4 text-current" />
                <span>{t.infinite}</span>
              </button>

              <button
                id="play-tutorial-btn"
                onClick={() => {
                  SynthAudio.playClick(config.soundEnabled);
                  setTutorialStep(0);
                }}
                className={`py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-2.5 cursor-pointer shadow-md transition-all border border-cyan-500/20 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10`}
              >
                <HelpCircle className="w-4 h-4 text-current" />
                <span>Como Jogar (Tutorial)</span>
              </button>

              {isInstallable && (
                <button
                  id="install-pwa-btn"
                  onClick={handleInstallClick}
                  className="py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-2.5 cursor-pointer shadow-md transition-all border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 animate-pulse-subtle"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>{config.language === 'pt' ? 'Instalar Aplicativo (PWA)' : config.language === 'es' ? 'Instalar Aplicación (PWA)' : 'Install Application (PWA)'}</span>
                </button>
              )}
            </div>

            {/* Navigation Drawer Shortcuts */}
            <div className={`flex justify-around items-center pt-3 border-t ${activeTheme.borderPrimary}`}>
              <button
                id="drawer-missions"
                onClick={() => { SynthAudio.playClick(config.soundEnabled); setActiveModal('missions'); }}
                className={`flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-widest transition-all opacity-85 hover:opacity-100 ${activeTheme.textSecondary} hover:${activeTheme.textPrimary}`}
              >
                <Target className="w-4.5 h-4.5" />
                <span>{t.missions}</span>
              </button>
              <button
                id="drawer-achievements"
                onClick={() => { SynthAudio.playClick(config.soundEnabled); setActiveModal('achievements'); }}
                className={`flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-widest transition-all opacity-85 hover:opacity-100 ${activeTheme.textSecondary} hover:${activeTheme.textPrimary}`}
              >
                <Trophy className="w-4.5 h-4.5" />
                <span>{t.achievements}</span>
              </button>
              <button
                id="drawer-shop"
                onClick={() => { SynthAudio.playClick(config.soundEnabled); setActiveModal('shop'); }}
                className={`flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-widest transition-all opacity-85 hover:opacity-100 ${activeTheme.textSecondary} hover:${activeTheme.textPrimary}`}
              >
                <ShoppingBag className="w-4.5 h-4.5" />
                <span>{t.shop}</span>
              </button>
              <button
                id="drawer-stats"
                onClick={() => { SynthAudio.playClick(config.soundEnabled); setActiveModal('stats'); }}
                className={`flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-widest transition-all opacity-85 hover:opacity-100 ${activeTheme.textSecondary} hover:${activeTheme.textPrimary}`}
              >
                <BarChart3 className="w-4.5 h-4.5" />
                <span>{t.stats}</span>
              </button>
            </div>

            {/* iOS Safari Install Guide (Only shown on iOS when not installed) */}
            {isIOS && !isStandalone && (
              <div
                id="ios-install-banner"
                className={`p-4 rounded-2xl border flex flex-col gap-2 mt-2 text-xs text-left animate-fadeIn ${activeTheme.cardBg} ${activeTheme.borderPrimary}`}
              >
                <div className="flex items-center gap-2 font-bold text-sky-500">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>Instalar no iPhone / iPad</span>
                </div>
                <p className="opacity-80 leading-relaxed text-[11px]">
                  Jogue em tela cheia e offline adicionando o jogo à sua tela de início:
                </p>
                <ol className="list-decimal list-inside space-y-1 opacity-90 pl-1 text-[11px]">
                  <li>
                    Toque no ícone de <span className="font-bold underline text-sky-400">Compartilhar</span> na barra do Safari (ícone <span className="inline-block bg-white/10 px-1 py-0.5 rounded text-[10px]">📤</span>).
                  </li>
                  <li>
                    Role para baixo e selecione <span className="font-bold underline text-sky-400">"Adicionar à Tela de Início"</span> (ícone <span className="inline-block bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono">+</span>).
                  </li>
                  <li>
                    Abra o app direto de sua tela de início para jogar sem barras e 100% offline!
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* VIEW: LEVEL SELECTOR */}
        {view === 'levels' && (
          <LevelSelector
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
          <div id="gameplay-screen" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-fadeIn">
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
          </div>
        )}
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
