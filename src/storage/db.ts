import { GameConfig, UserStats, UserProfile, Achievement, GameMission, GameMode } from '../types';
import { DEFAULT_ACHIEVEMENTS, getMissions } from '../config/gameConfig';

const STORAGE_KEYS = {
  CONFIG: 'numzen_config',
  STATS: 'numzen_stats',
  PROFILE: 'numzen_profile',
  ACHIEVEMENTS: 'numzen_achievements',
  MISSIONS: 'numzen_missions',
  MISSIONS_DATE: 'numzen_missions_date'
};

const DEFAULT_CONFIG: GameConfig = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  language: 'pt',
  animationsEnabled: true,
  showFps: false,
  volume: 80,
  numberSize: 'medium',
  highContrast: false,
  largeFont: false,
  darkMode: true
};

const DEFAULT_STATS: UserStats = {
  totalTimePlayed: 0,
  totalMatches: 0,
  wins: 0,
  losses: 0,
  highScore: {
    classic: 0,
    relax: 0,
    timed: 0,
    challenge: 0,
    survival: 0,
    frozen: 0,
    bombs: 0,
    locks: 0,
    multipliers: 0,
    infinite: 0
  },
  maxCombo: 0,
  totalClearedPieces: 0,
  consecutiveDays: 1,
  lastPlayedDate: '',
  totalCoinsEarned: 0
};

const DEFAULT_PROFILE: UserProfile = {
  xp: 0,
  level: 1,
  coins: 200, // Starts with some coins to check out the shop!
  theme: 'aurelius',
  avatar: 'av_1',
  frame: 'fr_1',
  unlockedThemes: ['aurelius'],
  unlockedAvatars: ['av_1'],
  unlockedFrames: ['fr_1']
};

export const GameStorage = {
  getConfig(): GameConfig {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : DEFAULT_CONFIG;
  },

  saveConfig(config: GameConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  },

  getStats(): UserStats {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    return data ? { ...DEFAULT_STATS, ...JSON.parse(data) } : DEFAULT_STATS;
  },

  saveStats(stats: UserStats) {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  },

  getProfile(): UserProfile {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : DEFAULT_PROFILE;
  },

  saveProfile(profile: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getAchievements(): Achievement[] {
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (!data) return DEFAULT_ACHIEVEMENTS;
    
    // Merge default structure in case we update achievements list in code
    const loaded: Achievement[] = JSON.parse(data);
    return DEFAULT_ACHIEVEMENTS.map(def => {
      const found = loaded.find(l => l.id === def.id);
      return found ? { ...def, currentValue: found.currentValue, completed: found.completed, unlockedAt: found.unlockedAt } : def;
    });
  },

  saveAchievements(achievements: Achievement[]) {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  },

  getMissions(): GameMission[] {
    const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD local format
    const savedDate = localStorage.getItem(STORAGE_KEYS.MISSIONS_DATE);
    const data = localStorage.getItem(STORAGE_KEYS.MISSIONS);

    if (savedDate !== todayStr || !data) {
      // New day: generate fresh missions
      const freshMissions = getMissions(todayStr);
      localStorage.setItem(STORAGE_KEYS.MISSIONS_DATE, todayStr);
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(freshMissions));
      return freshMissions;
    }

    return JSON.parse(data);
  },

  saveMissions(missions: GameMission[]) {
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
  },

  updateMissionProgress(missionId: string, increment: number): { completedJustNow: boolean, mission: GameMission } | null {
    const missions = this.getMissions();
    const index = missions.findIndex(m => m.id === missionId);
    if (index === -1) return null;

    const m = missions[index];
    if (m.completed) return null;

    m.currentValue = Math.min(m.targetValue, m.currentValue + increment);
    let completedJustNow = false;
    if (m.currentValue >= m.targetValue && !m.completed) {
      m.completed = true;
      completedJustNow = true;
      // Add rewards directly to profile
      const profile = this.getProfile();
      profile.coins += m.rewardCoins;
      this.addXP(m.rewardXP, profile);
    }

    this.saveMissions(missions);
    return { completedJustNow, mission: m };
  },

  updateAchievementProgress(category: Achievement['category'] | 'all', value: number, actionType?: string): { completedTitle: string; coinsReward: number }[] {
    const achievements = this.getAchievements();
    const profile = this.getProfile();
    const completedList: { completedTitle: string; coinsReward: number }[] = [];

    const updated = achievements.map(ach => {
      if (ach.completed) return ach;

      let shouldUpdate = false;
      if (category === 'all') {
        shouldUpdate = true;
      } else if (ach.category === category) {
        shouldUpdate = true;
      } else if (category === 'special') {
        // Mode-specific action mappings
        if (actionType === 'ice' && ach.id === 'spec_ice_100') shouldUpdate = true;
        if (actionType === 'lock' && ach.id === 'spec_lock_100') shouldUpdate = true;
        if (actionType === 'bomb' && ach.id === 'spec_bomb_100') shouldUpdate = true;
        if (actionType === 'level' && ach.id.startsWith('level_')) shouldUpdate = true;
        if (actionType === 'win_insane' && ach.id === 'win_insane') shouldUpdate = true;
      }

      if (shouldUpdate) {
        ach.currentValue = value;
        if (ach.currentValue >= ach.targetValue) {
          ach.completed = true;
          ach.unlockedAt = new Date().toISOString();
          profile.coins += ach.rewardCoins;
          completedList.push({ completedTitle: ach.titleKey, coinsReward: ach.rewardCoins });
        }
      }
      return ach;
    });

    this.saveAchievements(updated);
    this.saveProfile(profile);
    return completedList;
  },

  addXP(amount: number, customProfile?: UserProfile): { levelUp: boolean; newLevel: number } {
    const profile = customProfile || this.getProfile();
    const previousLevel = profile.level;
    profile.xp += amount;

    // Standard RPG curve: XP required for level N = N * 250
    while (profile.xp >= profile.level * 250) {
      profile.xp -= profile.level * 250;
      profile.level += 1;
    }

    const levelUp = profile.level > previousLevel;
    this.saveProfile(profile);

    if (levelUp) {
      // Trigger achievement check
      this.updateAchievementProgress('special', profile.level, 'level');
    }

    return { levelUp, newLevel: profile.level };
  },

  updateLoginStreak() {
    const stats = this.getStats();
    const todayStr = new Date().toLocaleDateString('sv-SE');
    
    if (stats.lastPlayedDate === todayStr) return;

    if (stats.lastPlayedDate) {
      const last = new Date(stats.lastPlayedDate);
      const current = new Date(todayStr);
      const diffTime = Math.abs(current.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        stats.consecutiveDays += 1;
      } else if (diffDays > 1) {
        stats.consecutiveDays = 1;
      }
    } else {
      stats.consecutiveDays = 1;
    }

    stats.lastPlayedDate = todayStr;
    this.saveStats(stats);
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.STATS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.MISSIONS);
    localStorage.removeItem(STORAGE_KEYS.MISSIONS_DATE);
  },

  exportData(): string {
    const data = {
      config: this.getConfig(),
      stats: this.getStats(),
      profile: this.getProfile(),
      achievements: this.getAchievements(),
      missions: this.getMissions(),
      missionsDate: localStorage.getItem(STORAGE_KEYS.MISSIONS_DATE)
    };
    return btoa(JSON.stringify(data)); // return base64 encoded string
  },

  importData(base64Str: string): boolean {
    try {
      const decoded = atob(base64Str);
      const parsed = JSON.parse(decoded);
      if (parsed.config && parsed.stats && parsed.profile && parsed.achievements) {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(parsed.config));
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(parsed.stats));
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(parsed.profile));
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(parsed.achievements));
        if (parsed.missions) {
          localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(parsed.missions));
        }
        if (parsed.missionsDate) {
          localStorage.setItem(STORAGE_KEYS.MISSIONS_DATE, parsed.missionsDate);
        }
        return true;
      }
    } catch (e) {
      console.error('Import error:', e);
    }
    return false;
  }
};
