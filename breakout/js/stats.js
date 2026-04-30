/**
 * Cumulative player statistics - localStorage persistence
 */

const STORAGE_KEY = 'breakout_stats';

const DEFAULT_STATS = {
  totalGamesPlayed: 0,
  levelsCompleted: 0,
  totalBricksDestroyed: 0,
  currentLevelReached: 1,
  bestLevelReached: 1,
  totalPlayTime: 0,      // seconds
  highScore: 0,
  timedBestScore: 0,
  currentWinStreak: 0,
  bestWinStreak: 0,
};

export function loadStats() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_STATS, ...JSON.parse(stored) };
    }
  } catch (e) {
    // localStorage not available
  }
  return { ...DEFAULT_STATS };
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    // localStorage not available
  }
}

export function incrementStat(stats, key, amount = 1) {
  stats[key] = (stats[key] || 0) + amount;
}

export function updateHighScore(stats, score) {
  if (score > stats.highScore) {
    stats.highScore = score;
  }
}

export function updateTimedBest(stats, score) {
  if (score > stats.timedBestScore) {
    stats.timedBestScore = score;
  }
}

export function updateBestLevel(stats, level) {
  if (level > stats.bestLevelReached) {
    stats.bestLevelReached = level;
  }
}

export function formatPlayTime(seconds) {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}
