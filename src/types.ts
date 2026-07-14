export type GameMode =
  | 'classic'
  | 'relax'
  | 'timed'
  | 'challenge'
  | 'survival'
  | 'frozen'
  | 'bombs'
  | 'locks'
  | 'multipliers'
  | 'infinite';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'insane';

export type CellSpecial = 'none' | 'frozen' | 'locked' | 'bomb' | 'multiplier' | 'portal' | 'chained';

export interface Cell {
  id: string;
  value: number; // 1 to 9
  special: CellSpecial;
  frozenCount: number; // For 'frozen': breaks at 0 (starts at 1 or 2)
  locked: boolean; // For 'locked': needs key or adjacent clear
  multiplier: number; // For 'multiplier': default 2, 3
  portalGroup?: number; // For 'portal': links together portals of the same group
  chainIndex?: number; // For 'chained': order to clear
  bombTimer?: number; // Countdown for active bombs in bombs mode
  removed: boolean; // Flag if cell was cleared
}

export interface BoardState {
  cells: Cell[];
  cols: number;
}

export interface GameMission {
  id: string;
  type: 'daily' | 'weekly' | 'permanent';
  descriptionKey: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  rewardCoins: number;
  rewardXP: number;
}

export interface Achievement {
  id: string;
  titleKey: string;
  descriptionKey: string;
  category: 'score' | 'clears' | 'combo' | 'games' | 'coins' | 'special';
  targetValue: number;
  currentValue: number;
  completed: boolean;
  unlockedAt?: string;
  rewardCoins: number;
}

export interface UserStats {
  totalTimePlayed: number; // in seconds
  totalMatches: number;
  wins: number;
  losses: number;
  highScore: Record<GameMode, number>;
  maxCombo: number;
  totalClearedPieces: number;
  consecutiveDays: number;
  lastPlayedDate: string; // YYYY-MM-DD
  totalCoinsEarned: number;
}

export interface UserProfile {
  xp: number;
  level: number;
  coins: number;
  theme: string;
  avatar: string;
  frame: string;
  unlockedThemes: string[];
  unlockedAvatars: string[];
  unlockedFrames: string[];
}

export interface ShopItem {
  id: string;
  category: 'theme' | 'avatar' | 'frame';
  nameKey: string;
  cost: number;
  previewColor?: string; // For themes
  previewImage?: string; // For avatar/frame
}

export interface GameConfig {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  language: 'pt' | 'en' | 'es';
  animationsEnabled: boolean;
  showFps: boolean;
  volume: number; // 0 to 100
  numberSize: 'small' | 'medium' | 'large' | 'giant';
  highContrast: boolean;
  largeFont: boolean;
  darkMode: boolean;
}
