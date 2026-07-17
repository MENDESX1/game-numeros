import { GameConfig, UserStats, UserProfile, Achievement, GameMission } from '../types';
import { DEFAULT_ACHIEVEMENTS, getMissions } from '../config/gameConfig';

const STORAGE_KEYS = {
  CONFIG: 'numzen_config',
  STATS: 'numzen_stats',
  PROFILE: 'numzen_profile',
  ACHIEVEMENTS: 'numzen_achievements',
  MISSIONS: 'numzen_missions',
  MISSIONS_DATE: 'numzen_missions_date',
  ACTIVE_GAME: 'numzen_active_game'
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

const DB_NAME = 'LogicMatchDB';
const DB_VERSION = 1;
const STORE_NAME = 'game_store';

function getIDBConnection(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const IndexedDBBridge = {
  async get(key: string): Promise<any> {
    try {
      const db = await getIDBConnection();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('IndexedDB get error for key:', key, e);
      return null;
    }
  },

  async set(key: string, val: any): Promise<void> {
    try {
      const db = await getIDBConnection();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(val, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('IndexedDB set error for key:', key, e);
    }
  },

  async loadAllToLocalStorage(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      for (const key of keys) {
        const val = await this.get(key);
        if (val !== undefined && val !== null) {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        }
      }
    } catch (e) {
      console.error('Error loading IndexedDB to LocalStorage:', e);
    }
  },

  async saveAllFromLocalStorage(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      for (const key of keys) {
        const val = localStorage.getItem(key);
        if (val !== null) {
          try {
            await this.set(key, JSON.parse(val));
          } catch {
            await this.set(key, val);
          }
        }
      }
    } catch (e) {
      console.error('Error saving LocalStorage to IndexedDB:', e);
    }
  }
};

export const GameStorage = {
  getConfig(): GameConfig {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : DEFAULT_CONFIG;
  },

  saveConfig(config: GameConfig) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    IndexedDBBridge.set(STORAGE_KEYS.CONFIG, config);
  },

  getStats(): UserStats {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    return data ? { ...DEFAULT_STATS, ...JSON.parse(data) } : DEFAULT_STATS;
  },

  saveStats(stats: UserStats) {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    IndexedDBBridge.set(STORAGE_KEYS.STATS, stats);
  },

  getProfile(): UserProfile {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : DEFAULT_PROFILE;
  },

  saveProfile(profile: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    IndexedDBBridge.set(STORAGE_KEYS.PROFILE, profile);
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
    IndexedDBBridge.set(STORAGE_KEYS.ACHIEVEMENTS, achievements);
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
      IndexedDBBridge.set(STORAGE_KEYS.MISSIONS_DATE, todayStr);
      IndexedDBBridge.set(STORAGE_KEYS.MISSIONS, freshMissions);
      return freshMissions;
    }

    return JSON.parse(data);
  },

  saveMissions(missions: GameMission[]) {
    localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
    IndexedDBBridge.set(STORAGE_KEYS.MISSIONS, missions);
  },

  updateMissionProgress(missionId: string, increment: number): { completedJustNow: boolean, mission: GameMission } | null {
    const missions = this.getMissions();
    const index = missions.findIndex(m => m.id === missionId);
    if (index === -1) return null;

    const m = missions[index];
    if (m.completed) return null;

    if (missionId === 'daily_score' || missionId === 'weekly_combos') {
      m.currentValue = Math.min(m.targetValue, Math.max(m.currentValue, increment));
    } else {
      m.currentValue = Math.min(m.targetValue, m.currentValue + increment);
    }
    let completedJustNow = false;
    if (m.currentValue >= m.targetValue && !m.completed) {
      m.completed = true;
      completedJustNow = true;
      // Add rewards directly to profile
      const profile = this.getProfile();
      profile.coins += m.rewardCoins;
      this.addXP(m.rewardXP, profile);

      // Track lifetime coins in stats
      const stats = this.getStats();
      stats.totalCoinsEarned = (stats.totalCoinsEarned || 0) + m.rewardCoins;
      this.saveStats(stats);
      
      // Force checking coin achievements since totalCoinsEarned increased
      this.updateAchievementProgress('coins', profile.coins);
    }

    this.saveMissions(missions);
    return { completedJustNow, mission: m };
  },

  updateAchievementProgress(category: Achievement['category'] | 'all', value: number, actionType?: string): { completedTitle: string; coinsReward: number }[] {
    const achievements = this.getAchievements();
    const profile = this.getProfile();
    const stats = this.getStats();
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
        if (actionType === 'ice' || actionType === 'lock' || actionType === 'bomb') {
          ach.currentValue = (ach.currentValue || 0) + value;
        } else if (ach.category === 'coins') {
          // Track cumulative lifetime coins earned instead of current wallet coins
          ach.currentValue = stats.totalCoinsEarned || 0;
        } else {
          ach.currentValue = value;
        }
        if (ach.currentValue >= ach.targetValue) {
          ach.completed = true;
          ach.unlockedAt = new Date().toISOString();
          profile.coins += ach.rewardCoins;
          stats.totalCoinsEarned = (stats.totalCoinsEarned || 0) + ach.rewardCoins;
          completedList.push({ completedTitle: ach.titleKey, coinsReward: ach.rewardCoins });
        }
      }
      return ach;
    });

    this.saveStats(stats);
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
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME);
    
    Object.values(STORAGE_KEYS).forEach(key => {
      IndexedDBBridge.set(key, null);
    });

    // Clear caches if available in browser
    if ('caches' in window) {
      caches.keys().then(names => {
        for (const name of names) {
          caches.delete(name);
        }
      }).catch(err => console.error('Cache deletion failed:', err));
    }

    // Unregister service workers if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
        }
      }).catch(err => console.error('Service worker unregistration failed:', err));
    }
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
        
        this.saveConfig(parsed.config);
        this.saveStats(parsed.stats);
        this.saveProfile(parsed.profile);
        this.saveAchievements(parsed.achievements);
        if (parsed.missions) this.saveMissions(parsed.missions);
        if (parsed.missionsDate) IndexedDBBridge.set(STORAGE_KEYS.MISSIONS_DATE, parsed.missionsDate);

        return true;
      }
    } catch (e) {
      console.error('Import error:', e);
    }
    return false;
  },

  getActiveGame(): any | null {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME);
    return data ? JSON.parse(data) : null;
  },
  
  saveActiveGame(state: any) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, JSON.stringify(state));
    IndexedDBBridge.set(STORAGE_KEYS.ACTIVE_GAME, state);
  },
  
  clearActiveGame() {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME);
    IndexedDBBridge.set(STORAGE_KEYS.ACTIVE_GAME, null);
  }
};
