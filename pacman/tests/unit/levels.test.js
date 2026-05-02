// === Levels Unit Tests ===
import { describe, it, expect, beforeEach } from 'vitest';
import { Levels } from '../../js/levels.js';
import { FRUITS } from '../../js/constants.js';

describe('Levels', () => {
  let levels;

  beforeEach(() => {
    levels = new Levels();
  });

  it('starts at level 1', () => {
    expect(levels.currentLevel).toBe(1);
  });

  it('advances levels', () => {
    levels.advance();
    expect(levels.currentLevel).toBe(2);
    levels.advance();
    expect(levels.currentLevel).toBe(3);
  });

  it('resets to level 1', () => {
    levels.advance();
    levels.advance();
    levels.reset();
    expect(levels.currentLevel).toBe(1);
  });

  it('returns speed config for current level', () => {
    const config = levels.getSpeedConfig();
    expect(config.pacman).toBeGreaterThan(0);
    expect(config.ghost).toBeGreaterThan(0);
    expect(config.ghostFright).toBeGreaterThan(0);
    expect(config.frightenTime).toBeGreaterThan(0);
  });

  it('speed increases with level', () => {
    const config1 = levels.getSpeedConfig();
    levels.advance();
    levels.advance();
    levels.advance();
    levels.advance();
    const config5 = levels.getSpeedConfig();
    expect(config5.pacman).toBeGreaterThanOrEqual(config1.pacman);
    expect(config5.ghost).toBeGreaterThanOrEqual(config1.ghost);
  });

  it('frighten time decreases with level', () => {
    const config1 = levels.getSpeedConfig();
    levels.advance();
    levels.advance();
    levels.advance();
    const config4 = levels.getSpeedConfig();
    expect(config4.frightenTime).toBeLessThanOrEqual(config1.frightenTime);
  });

  it('returns correct fruit for level', () => {
    expect(levels.getFruit().name).toBe(FRUITS[0].name);
    levels.advance();
    expect(levels.getFruit().name).toBe(FRUITS[1].name);
  });

  it('applies difficulty modifiers', () => {
    levels.setDifficulty('EASY');
    const easyConfig = levels.getSpeedConfig();
    levels.setDifficulty('HARD');
    const hardConfig = levels.getSpeedConfig();
    expect(easyConfig.ghost).toBeLessThan(hardConfig.ghost);
    expect(easyConfig.frightenTime).toBeGreaterThan(hardConfig.frightenTime);
  });

  it('ghost release dots decrease with level', () => {
    const dots1 = levels.getGhostReleaseDots();
    for (let i = 0; i < 5; i++) levels.advance();
    const dots6 = levels.getGhostReleaseDots();
    expect(dots6.inky).toBeLessThanOrEqual(dots1.inky);
    expect(dots6.clyde).toBeLessThanOrEqual(dots1.clyde);
  });

  it('mode timings change at higher levels', () => {
    const timings1 = levels.getModeTimings();
    for (let i = 0; i < 5; i++) levels.advance();
    const timings6 = levels.getModeTimings();
    // Higher levels have shorter scatter periods
    expect(timings6[0]).toBeLessThanOrEqual(timings1[0]);
  });
});
