// Countdown timer system

export class GameTimer {
  constructor(maxTime = 30) {
    this.maxTime = maxTime;
    this.timeLeft = maxTime;
    this.running = false;
  }

  /**
   * Start or restart the timer.
   */
  start(maxTime) {
    this.maxTime = maxTime || this.maxTime;
    this.timeLeft = this.maxTime;
    this.running = true;
  }

  /**
   * Stop the timer.
   */
  stop() {
    this.running = false;
  }

  /**
   * Update the timer. Returns true if time expired.
   */
  update(delta) {
    if (!this.running) return false;

    this.timeLeft -= delta;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.running = false;
      return true;
    }
    return false;
  }

  /**
   * Get the ratio of time remaining (0 to 1).
   */
  getRatio() {
    return this.timeLeft / this.maxTime;
  }

  /**
   * Check if timer is in danger zone (last 5 seconds).
   */
  isDanger() {
    return this.timeLeft <= 5 && this.running;
  }

  /**
   * Reset with the same max time.
   */
  reset() {
    this.timeLeft = this.maxTime;
    this.running = true;
  }
}
