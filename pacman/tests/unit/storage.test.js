import { beforeEach, describe, expect, it } from 'vitest';

import { STORAGE_KEYS } from '../../js/constants.js';
import { addHighScoreEntry, loadSettings } from '../../js/storage/storage.js';

describe('storage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('merges stored settings with defaults', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({
        theme: 'neon',
        effects: { crt: false },
        keyBindings: { up: ['KeyI'] }
      })
    );

    const settings = loadSettings();

    expect(settings.theme).toBe('neon');
    expect(settings.effects.crt).toBe(false);
    expect(settings.keyBindings.up).toEqual(['KeyI']);
    expect(settings.keyBindings.down).toEqual(['ArrowDown', 'KeyS']);
  });

  it('sorts and truncates high scores', () => {
    const scores = Array.from({ length: 12 }, (_, index) => ({ score: index * 100, level: index, mode: 'normal' }));
    const updated = addHighScoreEntry(scores, { score: 2500, level: 9, mode: 'normal' });

    expect(updated).toHaveLength(10);
    expect(updated[0].score).toBe(2500);
  });
});
