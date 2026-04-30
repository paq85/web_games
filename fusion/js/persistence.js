const STORAGE_KEY = 'fusion_game_data';

class Persistence {
  constructor() {
    this._data = null;
    this._storageAvailable = this._testStorage();
    this.load();
  }

  _testStorage() {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  _getDefaults() {
    return {
      settings: this.getDefaultSettings(),
      scores: {
        best: 0,
        bestClassic: 0,
        bestEndless: 0,
        dailyScores: {}
      },
      statistics: {
        gamesPlayed: 0,
        wins: 0,
        totalMerges: 0,
        bestStreak: 0,
        powerUpsUsed: { undo: 0, split: 0, nuke: 0, freeze: 0, swap: 0, stabilize: 0 },
        bombsDestroyed: 0,
        mutationsSurvived: 0,
        challengesCompleted: 0,
        dailyPuzzlesCompleted: 0,
        highestTile: 2
      },
      achievements: {},
      progression: {
        cumulativeScore: 0,
        level: 1
      },
      dailyPuzzle: {
        date: null,
        attempts: 3,
        seed: null,
        completed: false,
        streak: 0,
        leaderboard: []
      },
      challenges: {}
    };
  }

  load() {
    if (!this._storageAvailable) {
      this._data = this._getDefaults();
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const defaults = this._getDefaults();
        this._data = this._deepMerge(defaults, parsed);
      } else {
        this._data = this._getDefaults();
      }
    } catch {
      this._data = this._getDefaults();
    }
  }

  save() {
    if (!this._storageAvailable) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    } catch {
      console.warn('FUSION: localStorage quota exceeded');
    }
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
          target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        result[key] = this._deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  getSetting(key) {
    return this._data.settings[key];
  }

  setSetting(key, value) {
    this._data.settings[key] = value;
    this.save();
  }

  getDefaultSettings() {
    return {
      masterVolume: 80,
      musicVolume: 60,
      sfxVolume: 80,
      muted: false,
      screenShake: true,
      particleQuality: 'full',
      glowIntensity: 'high',
      tileColors: 'neon',
      reducedFlash: false,
      showNumbers: true,
      tileProbability: 'balanced',
      mutationDifficulty: 'normal',
      pauseOnFocusLoss: true,
      swipeSensitivity: 'medium'
    };
  }

  getStats() {
    const s = this._data.statistics;
    const sc = this._data.scores;
    return {
      gamesPlayed: s.gamesPlayed || 0,
      wins: s.wins || 0,
      bestScore: sc.best || 0,
      bestClassic: sc.bestClassic || 0,
      bestEndless: sc.bestEndless || 0,
      highestTile: s.highestTile || 0,
      totalMerges: s.totalMerges || 0,
      bestStreak: s.bestStreak || 0,
      bombsDestroyed: s.bombsDestroyed || 0,
      mutationsSurvived: s.mutationsSurvived || 0,
      challengesCompleted: s.challengesCompleted || 0,
      dailyCompleted: s.dailyPuzzlesCompleted || 0,
      cumulativeScore: this._data.progression.cumulativeScore || 0
    };
  }

  updateStats(updates) {
    if (!updates) return;
    for (const [key, value] of Object.entries(updates)) {
      switch (key) {
        case 'bestScore':
          this._data.scores.best = Math.max(this._data.scores.best, value);
          break;
        case 'bestClassic':
          this._data.scores.bestClassic = Math.max(this._data.scores.bestClassic, value);
          break;
        case 'bestEndless':
          this._data.scores.bestEndless = Math.max(this._data.scores.bestEndless, value);
          break;
        case 'cumulativeScore':
          this._data.progression.cumulativeScore = value;
          break;
        default:
          if (this._data.statistics.hasOwnProperty(key)) {
            this._data.statistics[key] = value;
          }
      }
    }
    this.save();
  }

  getAchievements() {
    return this._data.achievements;
  }

  unlockAchievement(id, progress, target) {
    if (!this._data.achievements[id]) {
      this._data.achievements[id] = { unlocked: false, progress: 0, target: target || 0 };
    }
    const ach = this._data.achievements[id];
    if (!ach.unlocked) {
      ach.progress = Math.max(ach.progress, progress || 0);
      if ((target && ach.progress >= target) || (!target && progress >= 1)) {
        ach.unlocked = true;
        this.save();
        return true;
      }
    }
    ach.progress = Math.max(ach.progress, progress || 0);
    this.save();
    return false;
  }

  updateAchievementProgress(id, progress, target) {
    if (!this._data.achievements[id]) {
      this._data.achievements[id] = { unlocked: false, progress: 0, target: target || 0 };
    }
    const ach = this._data.achievements[id];
    ach.progress = Math.max(ach.progress, progress || 0);
    ach.target = target || ach.target;
    if (!ach.unlocked && ach.progress >= ach.target) {
      ach.unlocked = true;
      return true;
    }
    this.save();
    return false;
  }

  getLevel() {
    return this._data.progression.level;
  }

  getCumulativeScore() {
    return this._data.progression.cumulativeScore;
  }

  addScore(score) {
    if (!score || score <= 0) return;
    this._data.progression.cumulativeScore += score;

    if (score > this._data.scores.best) {
      this._data.scores.best = score;
    }

    this._recalculateLevel();
    this.save();
  }

  setModeBest(mode, score) {
    if (mode === 'classic') {
      this._data.scores.bestClassic = Math.max(this._data.scores.bestClassic, score);
    } else if (mode === 'endless') {
      this._data.scores.bestEndless = Math.max(this._data.scores.bestEndless, score);
    }
    this.save();
  }

  _recalculateLevel() {
    const cumulative = this._data.progression.cumulativeScore;
    let level = 1;
    let threshold = 0;

    const baseThresholds = [0, 1000, 3000, 6000, 10000];

    for (let i = 1; i <= baseThresholds.length - 1; i++) {
      if (cumulative >= baseThresholds[i]) {
        level = i + 1;
        threshold = baseThresholds[i];
      } else {
        break;
      }
    }

    if (cumulative >= baseThresholds[baseThresholds.length - 1]) {
      let currentThreshold = baseThresholds[baseThresholds.length - 1];
      let candidateLevel = baseThresholds.length;
      while (cumulative >= currentThreshold) {
        currentThreshold += candidateLevel * 2000;
        candidateLevel++;
      }
      level = candidateLevel;
      threshold = currentThreshold - (level * 2000);
    }

    this._data.progression.level = level;
  }

  getDailyPuzzle() {
    return { ...this._data.dailyPuzzle };
  }

  setDailyPuzzle(data) {
    this._data.dailyPuzzle = { ...this._data.dailyPuzzle, ...data };
    this.save();
  }

  recordDailyScore(score) {
    const today = new Date().toISOString().slice(0, 10);
    if (!this._data.scores.dailyScores[today]) {
      this._data.scores.dailyScores[today] = [];
    }
    this._data.scores.dailyScores[today].push(score);
    this._data.scores.dailyScores[today].sort((a, b) => b - a);
    this._data.scores.dailyScores[today] = this._data.scores.dailyScores[today].slice(0, 10);

    const lb = this._data.dailyPuzzle.leaderboard || [];
    lb.push({ score, date: today });
    lb.sort((a, b) => b.score - a.score);
    this._data.dailyPuzzle.leaderboard = lb.slice(0, 10);
    this.save();
  }

  useDailyAttempt() {
    this._data.dailyPuzzle.attempts = Math.max(0, (this._data.dailyPuzzle.attempts || 3) - 1);
    this.save();
    return this._data.dailyPuzzle.attempts;
  }

  resetDailyPuzzle() {
    this._data.dailyPuzzle = {
      date: null,
      attempts: 3,
      seed: null,
      completed: false,
      streak: 0,
      leaderboard: this._data.dailyPuzzle.leaderboard || []
    };
    this.save();
  }

  saveChallenge(challengeId, data) {
    if (!this._data.challenges[challengeId]) {
      this._data.challenges[challengeId] = { completed: false, stars: 0, unlocked: true };
    }
    Object.assign(this._data.challenges[challengeId], data);
    this.save();
  }

  getChallenge(challengeId) {
    return this._data.challenges[challengeId] || { completed: false, stars: 0, unlocked: true };
  }

  getChallenges() {
    return { ...this._data.challenges };
  }

  reset() {
    this._data = this._getDefaults();
    if (this._storageAvailable) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
      } catch {
        console.warn('FUSION: localStorage quota exceeded during reset');
      }
    }
  }

  getAllData() {
    return JSON.parse(JSON.stringify(this._data));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Persistence };
}
