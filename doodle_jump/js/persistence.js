import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants.js';

function loadJSON(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // Storage full or unavailable
  }
}

export function loadSettings() {
  const saved = loadJSON(STORAGE_KEYS.SETTINGS, null);
  if (saved) {
    return { ...DEFAULT_SETTINGS, ...saved, controls: { ...DEFAULT_SETTINGS.controls, ...(saved.controls || {}) } };
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  saveJSON(STORAGE_KEYS.SETTINGS, settings);
}

export function loadHighScores() {
  return loadJSON(STORAGE_KEYS.HIGH_SCORES, []);
}

export function saveHighScores(scores) {
  saveJSON(STORAGE_KEYS.HIGH_SCORES, scores);
}

export function addHighScore(score) {
  let scores = loadHighScores();
  const entry = {
    score,
    date: Date.now(),
  };
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 10);
  saveHighScores(scores);
  return scores;
}

export function loadStats() {
  return loadJSON(STORAGE_KEYS.STATS, {
    totalRuns: 0,
    bestScore: 0,
    totalCoins: 0,
    totalDistance: 0,
  });
}

export function saveStats(stats) {
  saveJSON(STORAGE_KEYS.STATS, stats);
}

export function updateStats(runScore, coinsCollected) {
  const stats = loadStats();
  stats.totalRuns++;
  if (runScore > stats.bestScore) {
    stats.bestScore = runScore;
  }
  stats.totalCoins += coinsCollected;
  stats.totalDistance += runScore;
  saveStats(stats);
  return stats;
}

export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.HIGH_SCORES);
    localStorage.removeItem(STORAGE_KEYS.STATS);
  } catch (e) {
    // Storage unavailable
  }
}
