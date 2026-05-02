import { HIGH_SCORE_LIMIT, STORAGE_KEYS } from '../constants.js';
import { createDefaultSettings, cloneSettings } from '../data/default-settings.js';

export function createDefaultStats() {
  return {
    highScore: 0,
    totalRuns: 0,
    totalLevelsCompleted: 0,
    bestLevel: 1,
    totalGhostsEaten: 0,
    totalFruitsCollected: 0,
    totalPelletsEaten: 0,
    totalPowerPelletsEaten: 0,
    bestGhostChain: 0,
    bestStreak: 0,
    achievementsUnlocked: [],
    themeUnlocks: ['classic', 'neon', 'amber'],
    lastResult: null
  };
}

function safeRead(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures so gameplay can continue.
  }
}

function mergeSettings(base, incoming) {
  return {
    ...base,
    ...incoming,
    effects: {
      ...base.effects,
      ...(incoming?.effects ?? {})
    },
    keyBindings: {
      ...base.keyBindings,
      ...(incoming?.keyBindings ?? {})
    }
  };
}

export function loadSettings({ prefersReducedMotion = false } = {}) {
  const base = createDefaultSettings({ prefersReducedMotion });
  return mergeSettings(base, safeRead(STORAGE_KEYS.SETTINGS, {}));
}

export function saveSettings(settings) {
  safeWrite(STORAGE_KEYS.SETTINGS, cloneSettings(settings));
}

export function loadHighScores() {
  const scores = safeRead(STORAGE_KEYS.SCORES, []);
  return Array.isArray(scores) ? scores : [];
}

export function saveHighScores(scores) {
  safeWrite(STORAGE_KEYS.SCORES, scores.slice(0, HIGH_SCORE_LIMIT));
}

export function loadStats() {
  const base = createDefaultStats();
  return {
    ...base,
    ...safeRead(STORAGE_KEYS.STATS, base),
    achievementsUnlocked: Array.isArray(safeRead(STORAGE_KEYS.STATS, base).achievementsUnlocked)
      ? safeRead(STORAGE_KEYS.STATS, base).achievementsUnlocked
      : []
  };
}

export function saveStats(stats) {
  safeWrite(STORAGE_KEYS.STATS, stats);
}

export function addHighScoreEntry(existingScores, entry) {
  return [...existingScores, entry]
    .sort((left, right) => right.score - left.score || right.level - left.level)
    .slice(0, HIGH_SCORE_LIMIT);
}
