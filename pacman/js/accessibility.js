// === Accessibility Module ===

export class Accessibility {
  constructor() {
    this.scoreElement = null;
    this.statusElement = null;
    this.lastScore = 0;
    this.lastLives = 0;
    this.reducedMotion = false;
  }

  init() {
    this.scoreElement = document.getElementById('aria-score');
    this.statusElement = document.getElementById('aria-status');
    this.reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Listen for preference changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-reduced-motion: reduce)')
        .addEventListener('change', (e) => {
          this.reducedMotion = e.matches;
        });
    }
  }

  announceScore(score) {
    if (score === this.lastScore) return;
    this.lastScore = score;
    if (this.scoreElement) {
      this.scoreElement.textContent = `Score: ${score}`;
    }
  }

  announceLives(lives) {
    if (lives === this.lastLives) return;
    this.lastLives = lives;
    if (this.statusElement) {
      this.statusElement.textContent = `Lives: ${lives}`;
    }
  }

  announceStatus(message) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
  }

  announceLevel(level) {
    this.announceStatus(`Level ${level}`);
  }

  announceGameOver(score) {
    this.announceStatus(`Game over. Final score: ${score}`);
  }

  announcePowerUp() {
    this.announceStatus('Power pellet! Ghosts are vulnerable!');
  }

  announceGhostEaten(points) {
    if (this.scoreElement) {
      this.scoreElement.textContent = `Ghost eaten! ${points} points. Score: ${this.lastScore}`;
    }
  }

  announceFruit(points) {
    if (this.scoreElement) {
      this.scoreElement.textContent = `Fruit collected! ${points} points.`;
    }
  }

  focusCanvas() {
    const canvas = document.getElementById('game-canvas');
    if (canvas) canvas.focus();
  }

  isReducedMotion() {
    return this.reducedMotion;
  }
}
