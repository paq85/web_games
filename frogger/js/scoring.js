// Scoring and high score management

const STORAGE_KEY = 'frogger_high_score';

export class Scoring {
  constructor() {
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.lives = 3;
    this.level = 1;
    this.frogsHome = 0;
    this.lowestRow = 12; // track highest point reached (0-indexed, matches frog.startY)
  }

  /**
   * Award points and return the amount.
   */
  addPoints(amount) {
    this.score += amount;
    return this.score;
  }

  /**
   * Score for moving up one row.
   */
  scoreMoveUp(currentRow) {
    if (currentRow < this.lowestRow) {
      this.lowestRow = currentRow;
      return 10;
    }
    return 0;
  }

  /**
   * Score for reaching a home slot.
   */
  scoreHome(bonus = false) {
    this.frogsHome++;
    return bonus ? 200 : 50;
  }

  /**
   * Score for collecting a ladybug.
   */
  scoreLadybug() {
    return 200;
  }

  /**
   * Score for completing a level.
   */
  scoreLevelComplete() {
    return 1000;
  }

  /**
   * Score time bonus when reaching home or on death.
   * 1 point per 10 ticks (1 second = 10 ticks).
   */
  scoreTimeBonus(timer) {
    const bonus = Math.floor(timer.timeLeft * 10);
    if (bonus > 0) {
      this.score += bonus;
    }
    return bonus;
  }

  /**
   * Handle a death. Returns false if game over.
   */
  loseLife() {
    this.lives--;
    this.frogsHome = 0;
    this.lowestRow = 12; // 0-indexed, matches frog.startY
    return this.lives > 0;
  }

  /**
   * Advance to the next level.
   */
  nextLevel() {
    this.level++;
    this.frogsHome = 0;
    this.lowestRow = 12; // 0-indexed, matches frog.startY
  }

  /**
   * Check if the game is over.
   */
  isGameOver() {
    return this.lives <= 0;
  }

  /**
   * Update high score if current score exceeds it.
   */
  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }

  /**
   * Reset for a new game.
   */
  reset() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.frogsHome = 0;
    this.lowestRow = 12; // 0-indexed, matches frog.startY
  }

  /**
   * Load high score from localStorage.
   */
  loadHighScore() {
    try {
      const val = localStorage.getItem(STORAGE_KEY);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Save high score to localStorage.
   */
  saveHighScore() {
    try {
      localStorage.setItem(STORAGE_KEY, this.highScore.toString());
    } catch {
      // localStorage not available
    }
  }
}
