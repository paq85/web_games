// Save system tests - inline implementation
const SaveSystem = {
  STORAGE_KEY: 'ugh_save_data',
  SETTINGS_KEY: 'ugh_settings',

  saveProgress(level, score, bestScore) {
    const data = {
      currentLevel: level,
      score: score,
      bestScore: bestScore || score,
      timestamp: Date.now(),
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    return data;
  },

  loadProgress() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  clearProgress() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  saveSettings(settings) {
    const existing = this.loadSettings() || {};
    const merged = { ...existing, ...settings };
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  },

  loadSettings() {
    const raw = localStorage.getItem(this.SETTINGS_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },

  getBestScore() {
    const progress = this.loadProgress();
    return progress ? progress.bestScore : 0;
  },

  getUnlockedLevel() {
    const progress = this.loadProgress();
    return progress ? progress.currentLevel : 1;
  },
};

describe('SaveSystem', () => {
  beforeEach(() => {
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();
  });

  describe('saveProgress', () => {
    it('saves progress to localStorage', () => {
      localStorage.getItem.mockReturnValue(null);
      SaveSystem.saveProgress(5, 1000, 1000);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'ugh_save_data',
        expect.stringContaining('"currentLevel":5')
      );
    });

    it('returns saved data', () => {
      const result = SaveSystem.saveProgress(3, 500, 500);
      expect(result).toBeDefined();
      expect(result.currentLevel).toBe(3);
      expect(result.score).toBe(500);
    });

    it('handles missing bestScore', () => {
      const result = SaveSystem.saveProgress(2, 300);
      expect(result.bestScore).toBe(300);
    });
  });

  describe('loadProgress', () => {
    it('returns null when no save exists', () => {
      localStorage.getItem.mockReturnValue(null);
      expect(SaveSystem.loadProgress()).toBeNull();
    });

    it('returns parsed data when save exists', () => {
      const saveData = JSON.stringify({ currentLevel: 7, score: 5000, bestScore: 6000 });
      localStorage.getItem.mockReturnValue(saveData);
      const result = SaveSystem.loadProgress();
      expect(result.currentLevel).toBe(7);
      expect(result.score).toBe(5000);
    });

    it('handles invalid JSON gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid json');
      expect(SaveSystem.loadProgress()).toBeNull();
    });
  });

  describe('clearProgress', () => {
    it('removes save data from localStorage', () => {
      SaveSystem.clearProgress();
      expect(localStorage.removeItem).toHaveBeenCalledWith('ugh_save_data');
    });
  });

  describe('saveSettings', () => {
    it('saves settings to localStorage', () => {
      localStorage.getItem.mockReturnValue(null);
      SaveSystem.saveSettings({ sound: true, music: false });
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'ugh_settings',
        expect.stringContaining('"sound":true')
      );
    });

    it('merges with existing settings', () => {
      const existing = JSON.stringify({ sound: true, music: true });
      localStorage.getItem.mockReturnValue(existing);
      SaveSystem.saveSettings({ music: false });
      const callArgs = localStorage.setItem.mock.calls[0];
      const saved = JSON.parse(callArgs[1]);
      expect(saved.sound).toBe(true);
      expect(saved.music).toBe(false);
    });
  });

  describe('loadSettings', () => {
    it('returns null when no settings exist', () => {
      localStorage.getItem.mockReturnValue(null);
      expect(SaveSystem.loadSettings()).toBeNull();
    });

    it('returns parsed settings', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify({ sound: false, music: true }));
      const result = SaveSystem.loadSettings();
      expect(result.sound).toBe(false);
      expect(result.music).toBe(true);
    });
  });

  describe('getBestScore', () => {
    it('returns 0 when no progress exists', () => {
      localStorage.getItem.mockReturnValue(null);
      expect(SaveSystem.getBestScore()).toBe(0);
    });

    it('returns best score from progress', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify({ bestScore: 9999 }));
      expect(SaveSystem.getBestScore()).toBe(9999);
    });
  });

  describe('getUnlockedLevel', () => {
    it('returns 1 when no progress exists', () => {
      localStorage.getItem.mockReturnValue(null);
      expect(SaveSystem.getUnlockedLevel()).toBe(1);
    });

    it('returns current level from progress', () => {
      localStorage.getItem.mockReturnValue(JSON.stringify({ currentLevel: 8 }));
      expect(SaveSystem.getUnlockedLevel()).toBe(8);
    });
  });
});
