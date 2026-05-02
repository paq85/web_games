import { describe, expect, it } from 'vitest';

import { getLevelConfig } from '../../js/data/difficulty.js';

describe('getLevelConfig', () => {
  it('increases ghost pressure across higher levels', () => {
    const levelOne = getLevelConfig({ difficulty: 'medium', level: 1 });
    const levelFive = getLevelConfig({ difficulty: 'medium', level: 5 });

    expect(levelFive.ghostSpeed).toBeGreaterThan(levelOne.ghostSpeed);
    expect(levelFive.frightenedDuration).toBeLessThan(levelOne.frightenedDuration);
  });

  it('slows the game for practice mode', () => {
    const arcade = getLevelConfig({ difficulty: 'medium', level: 1, runMode: 'normal', practiceSpeed: 0.7 });
    const practice = getLevelConfig({ difficulty: 'medium', level: 1, runMode: 'practice', practiceSpeed: 0.7 });

    expect(practice.pacmanSpeed).toBeLessThan(arcade.pacmanSpeed);
    expect(practice.ghostSpeed).toBeLessThan(arcade.ghostSpeed);
  });
});
