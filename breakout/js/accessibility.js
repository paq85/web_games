/**
 * Accessibility helpers - ARIA announcements, focus, reduced motion
 */

export class AccessibilityManager {
  constructor() {
    this.politeRegion = document.getElementById('aria-live-polite');
    this.assertiveRegion = document.getElementById('aria-live-assertive');
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
    });
  }

  announcePolite(message) {
    if (this.politeRegion) {
      this.politeRegion.textContent = '';
      // Force re-read
      requestAnimationFrame(() => {
        this.politeRegion.textContent = message;
      });
    }
  }

  announceAssertive(message) {
    if (this.assertiveRegion) {
      this.assertiveRegion.textContent = '';
      requestAnimationFrame(() => {
        this.assertiveRegion.textContent = message;
      });
    }
  }

  announceScore(score, level) {
    this.announcePolite(`Score: ${score}, Level: ${level}`);
  }

  announceLevelStart(level) {
    this.announceAssertive(`Level ${level} starting`);
  }

  announceLevelComplete(level, score) {
    this.announceAssertive(`Level ${level} complete! Score: ${score}`);
  }

  announceGameOver(score, highScore) {
    this.announceAssertive(`Game over. Final score: ${score}. High score: ${highScore}`);
  }

  announceTimedResults(score, bricks, best) {
    this.announceAssertive(`Time's up! Score: ${score}. Bricks destroyed: ${bricks}. Best score: ${best}`);
  }

  announcePowerUp(type) {
    const names = {
      paddle_extend: 'Paddle extend',
      multiball: 'Multi-ball',
      laser: 'Laser shots',
      slow_ball: 'Slow ball',
    };
    this.announcePolite(`Power-up: ${names[type] || type}`);
  }

  announcePause() {
    this.announceAssertive('Game paused');
  }

  announceResume() {
    this.announceAssertive('Game resumed');
  }

  announceLifeLost(livesRemaining) {
    this.announceAssertive(`Life lost. Lives remaining: ${livesRemaining}`);
  }

  getReducedEffects() {
    return this.reducedMotion;
  }
}
