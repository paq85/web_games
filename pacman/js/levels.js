// === Level Progression & Difficulty ===
import { SPEED_TABLE, FRUITS, DIFFICULTY, MODE_TIMINGS, GHOST_RELEASE_DOTS } from './constants.js';

export class Levels {
  constructor() {
    this.currentLevel = 1;
    this.difficulty = 'MEDIUM';
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  reset() {
    this.currentLevel = 1;
  }

  advance() {
    this.currentLevel++;
  }

  getSpeedConfig() {
    const idx = Math.min(this.currentLevel - 1, SPEED_TABLE.length - 1);
    const config = { ...SPEED_TABLE[idx] };
    const diffMod = DIFFICULTY[this.difficulty];

    // Apply difficulty modifiers
    config.ghost *= diffMod.speedMult;
    config.ghostFright *= diffMod.speedMult;
    config.frightenTime *= diffMod.frightenMult;

    return config;
  }

  getFruit() {
    const idx = Math.min(this.currentLevel - 1, FRUITS.length - 1);
    return FRUITS[idx];
  }

  getGhostReleaseDots() {
    // Reduce release threshold as levels increase
    const factor = Math.max(0.5, 1 - (this.currentLevel - 1) * 0.1);
    return {
      blinky: 0,
      pinky: Math.floor(GHOST_RELEASE_DOTS.pinky * factor),
      inky: Math.floor(GHOST_RELEASE_DOTS.inky * factor),
      clyde: Math.floor(GHOST_RELEASE_DOTS.clyde * factor),
    };
  }

  getModeTimings() {
    // At higher levels, reduce scatter time
    if (this.currentLevel >= 5) {
      return [5, 20, 5, 20, 5, 1037, 1/60, Infinity];
    }
    return [...MODE_TIMINGS];
  }
}
