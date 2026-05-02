// === Bonus Fruit System ===
import { FRUIT_DOT_THRESHOLDS, FRUIT_DURATION } from './constants.js';

export class Fruits {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.x = 13.5;
    this.y = 17;
    this.type = null;
    this.points = 0;
    this.color = '#FF0000';
    this.timer = 0;
    this.fruitsSpawned = 0;
    this.lastDotThreshold = 0;
  }

  update(dt, dotsEaten, fruitConfig) {
    if (this.active) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.active = false;
      }
      return;
    }

    // Check if we should spawn a fruit
    for (const threshold of FRUIT_DOT_THRESHOLDS) {
      if (dotsEaten >= threshold && this.lastDotThreshold < threshold) {
        this.spawn(fruitConfig);
        this.lastDotThreshold = threshold;
        break;
      }
    }
  }

  spawn(fruitConfig) {
    this.active = true;
    this.type = fruitConfig.name;
    this.points = fruitConfig.points;
    this.color = fruitConfig.color;
    this.timer = FRUIT_DURATION;
    this.fruitsSpawned++;
  }

  collect() {
    if (!this.active) return 0;
    const points = this.points;
    this.active = false;
    return points;
  }

  isActive() {
    return this.active;
  }

  getDisplayData() {
    if (!this.active) return null;
    return {
      x: this.x,
      y: this.y,
      color: this.color,
      active: true,
    };
  }
}
