import { ACTIONS, ACTION_LABELS, DEFAULT_BINDINGS, KEY_LABELS } from './constants.js';

function cloneBindings(bindings) {
  return Object.fromEntries(
    Object.entries(bindings).map(([action, codes]) => [action, Array.isArray(codes) ? [...codes] : []])
  );
}

export function createDefaultSettings({ prefersReducedMotion = false } = {}) {
  return {
    difficulty: 'medium',
    masterVolume: 0.8,
    musicVolume: 0.55,
    sfxVolume: 0.8,
    muted: false,
    reduceMotion: prefersReducedMotion,
    reduceEffects: false,
    crtOverlay: true,
    particles: true,
    practiceMode: false,
    controlScheme: 'hybrid',
    bindings: cloneBindings(DEFAULT_BINDINGS)
  };
}

export function createDefaultStats() {
  return {
    highScore: 0,
    highScores: [],
    gamesPlayed: 0,
    levelsCompleted: 0,
    ghostsEaten: 0,
    fruitsCollected: 0,
    totalScore: 0,
    longestGhostCombo: 0,
    winStreak: 0,
    lastScore: 0,
    lastDifficulty: 'medium',
    lastPlayedAt: null
  };
}

export function normalizeBindings(bindings = {}) {
  const normalized = cloneBindings(DEFAULT_BINDINGS);
  for (const action of ACTIONS) {
    const value = bindings[action];
    if (Array.isArray(value) && value.length) {
      normalized[action] = [...new Set(value.filter(Boolean))];
    }
  }
  return normalized;
}

export function normalizeSettings(raw = {}, options = {}) {
  const defaults = createDefaultSettings(options);
  return {
    ...defaults,
    ...raw,
    bindings: normalizeBindings(raw.bindings)
  };
}

export function normalizeStats(raw = {}) {
  const defaults = createDefaultStats();
  return {
    ...defaults,
    ...raw,
    highScores: Array.isArray(raw.highScores)
      ? raw.highScores.map((entry) => ({
          name: entry?.name || 'PLAYER',
          score: Number(entry?.score || 0),
          difficulty: entry?.difficulty || 'medium',
          mode: entry?.mode || 'arcade',
          achievedAt: entry?.achievedAt || new Date().toISOString()
        }))
      : []
  };
}

export function getBindingLabel(codes = []) {
  if (!codes.length) {
    return 'Unbound';
  }
  return codes.map((code) => KEY_LABELS[code] || code.replace(/^Key/, '')).join(' / ');
}

export function getActionLabel(action) {
  return ACTION_LABELS[action] || action;
}

export function bindingMapToLookup(bindings) {
  const lookup = new Map();
  for (const [action, codes] of Object.entries(bindings)) {
    for (const code of codes) {
      lookup.set(code, action);
    }
  }
  return lookup;
}

export function setBinding(bindings, action, code) {
  const next = cloneBindings(bindings);
  next[action] = [code];
  return next;
}

export function resetBindings() {
  return cloneBindings(DEFAULT_BINDINGS);
}

export function isToggleAction(action) {
  return action === 'pause' || action === 'mute' || action === 'confirm';
}
