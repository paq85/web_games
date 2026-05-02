import assert from 'node:assert/strict';
import test from 'node:test';

import { createDefaultSettings, createDefaultStats, normalizeSettings } from '../../js/settings.js';
import { recordScore, resetStats, saveSettings, loadSettings, loadStats, saveStats } from '../../js/storage.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

test('settings normalize and persist', () => {
  const storage = createMemoryStorage();
  const defaults = createDefaultSettings({ prefersReducedMotion: true });
  defaults.difficulty = 'hard';
  defaults.bindings.up = ['KeyI'];
  saveSettings(defaults, storage);
  const loaded = loadSettings(storage, { prefersReducedMotion: false });
  assert.equal(loaded.difficulty, 'hard');
  assert.deepEqual(loaded.bindings.up, ['KeyI']);
  assert.equal(loaded.reduceMotion, true);
});

test('stats track high scores', () => {
  const storage = createMemoryStorage();
  const stats = createDefaultStats();
  stats.highScores = [{ name: 'AAA', score: 200, difficulty: 'medium', mode: 'arcade', achievedAt: '2026-05-01T00:00:00.000Z' }];
  const updated = recordScore(stats, { score: 1200, difficulty: 'hard', mode: 'practice', name: 'YOU' });
  assert.equal(updated.highScore, 1200);
  assert.equal(updated.highScores[0].score, 1200);
  saveStats(updated, storage);
  const loaded = loadStats(storage);
  assert.equal(loaded.highScore, 1200);
  assert.equal(loaded.highScores.length, 2);
});

test('resetStats returns a clean slate', () => {
  const storage = createMemoryStorage();
  const reset = resetStats(storage);
  assert.equal(reset.highScore, 0);
  assert.equal(reset.highScores.length, 0);
});
