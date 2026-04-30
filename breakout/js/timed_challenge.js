/**
 * Timed challenge mode logic
 */

export class TimedChallenge {
  constructor() {
    this.timeLimit = 60; // seconds
    this.timeRemaining = 0;
    this.active = false;
    this.bricksDestroyed = 0;
    this.score = 0;
  }

  start() {
    this.timeRemaining = this.timeLimit;
    this.active = true;
    this.bricksDestroyed = 0;
    this.score = 0;
  }

  update(dt) {
    if (!this.active) return;
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.active = false;
    }
  }

  addBrickDestroyed(score) {
    this.bricksDestroyed++;
    this.score += score;
  }

  get timeDisplay() {
    return Math.ceil(this.timeRemaining);
  }

  get expired() {
    return !this.active && this.timeRemaining <= 0;
  }
}
