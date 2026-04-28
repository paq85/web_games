// Save/load system using localStorage
const SaveSystem = {
  // Save game progress
  saveProgress(level, score, bestScore) {
    try {
      const data = {
        currentLevel: level,
        score: score,
        bestScore: bestScore || score,
        timestamp: Date.now(),
      };
      localStorage.setItem(CONSTANTS.STORAGE_KEY, JSON.stringify(data));
      return data;
    } catch (e) {
      console.warn('Cannot save progress:', e);
      return null;
    }
  },

  // Load saved progress
  loadProgress() {
    try {
      const raw = localStorage.getItem(CONSTANTS.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Cannot load progress:', e);
      return null;
    }
  },

  // Clear saved progress
  clearProgress() {
    try {
      localStorage.removeItem(CONSTANTS.STORAGE_KEY);
    } catch (e) {
      console.warn('Cannot clear progress:', e);
    }
  },

  // Save settings
  saveSettings(settings) {
    try {
      const existing = this.loadSettings() || {};
      const merged = { ...existing, ...settings };
      localStorage.setItem(CONSTANTS.SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.warn('Cannot save settings:', e);
      return null;
    }
  },

  // Load settings
  loadSettings() {
    try {
      const raw = localStorage.getItem(CONSTANTS.SETTINGS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Cannot load settings:', e);
      return null;
    }
  },

  // Get best score
  getBestScore() {
    const progress = this.loadProgress();
    return progress ? progress.bestScore : 0;
  },

  // Get unlocked level
  getUnlockedLevel() {
    const progress = this.loadProgress();
    return progress ? progress.currentLevel : 1;
  },
};
