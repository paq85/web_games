import { STORAGE_KEYS } from './constants.js';
import { createDefaultSettings, createDefaultStats, normalizeSettings, normalizeStats } from './settings.js';

function getStorage(storage) {
  if (storage) {
    return storage;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

function readJSON(storage, key) {
  const actualStorage = getStorage(storage);
  if (!actualStorage) {
    return null;
  }
  try {
    const value = actualStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeJSON(storage, key, value) {
  const actualStorage = getStorage(storage);
  if (!actualStorage) {
    return false;
  }
  try {
    actualStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(storage, options = {}) {
  const saved = readJSON(storage, STORAGE_KEYS.settings) || {};
  return normalizeSettings(saved, options);
}

export function saveSettings(settings, storage) {
  return writeJSON(storage, STORAGE_KEYS.settings, settings);
}

export function loadStats(storage) {
  const saved = readJSON(storage, STORAGE_KEYS.stats) || {};
  return normalizeStats(saved);
}

export function saveStats(stats, storage) {
  return writeJSON(storage, STORAGE_KEYS.stats, stats);
}

export function resetSettings(storage, options = {}) {
  const defaults = createDefaultSettings(options);
  saveSettings(defaults, storage);
  return defaults;
}

export function resetStats(storage) {
  const defaults = createDefaultStats();
  saveStats(defaults, storage);
  return defaults;
}

export function recordScore(stats, entry) {
  const next = normalizeStats(stats);
  const scored = {
    name: entry.name || 'PLAYER',
    score: Number(entry.score || 0),
    difficulty: entry.difficulty || next.lastDifficulty || 'medium',
    mode: entry.mode || 'arcade',
    achievedAt: entry.achievedAt || new Date().toISOString()
  };
  next.highScores = [...next.highScores, scored]
    .sort((a, b) => b.score - a.score || a.achievedAt.localeCompare(b.achievedAt))
    .slice(0, 10);
  next.highScore = Math.max(next.highScore, scored.score);
  next.lastScore = scored.score;
  next.lastDifficulty = scored.difficulty;
  next.totalScore += scored.score;
  next.gamesPlayed += 1;
  next.lastPlayedAt = scored.achievedAt;
  return next;
}

export function updateStatsForRun(stats, summary) {
  const next = normalizeStats(stats);
  next.totalScore += Number(summary.score || 0);
  next.lastScore = Number(summary.score || 0);
  next.lastDifficulty = summary.difficulty || next.lastDifficulty;
  next.highScore = Math.max(next.highScore, next.lastScore);
  next.gamesPlayed += summary.completed ? 1 : 0;
  next.levelsCompleted += Number(summary.levelsCompleted || 0);
  next.ghostsEaten += Number(summary.ghostsEaten || 0);
  next.fruitsCollected += Number(summary.fruitsCollected || 0);
  next.longestGhostCombo = Math.max(next.longestGhostCombo, Number(summary.longestGhostCombo || 0));
  next.winStreak = summary.completed ? next.winStreak + 1 : 0;
  next.lastPlayedAt = new Date().toISOString();
  return next;
}
