/**
 * Game state machine and core gameplay logic
 */

import { Paddle } from './paddle.js';
import { Ball } from './ball.js';
import { BrickGrid, BRICK_TYPES } from './bricks.js';
import { PowerUp, ActivePowerUp, POWERUP_TYPES, POWERUP_CONFIG, POWERUP_DROP_RATE } from './powerups.js';
import { ParticleSystem } from './particles.js';
import { getLevelMatrix, getBaseBallSpeed, getPaddleSize } from './levels.js';
import { TimedChallenge } from './timed_challenge.js';

export const SCREEN = {
  MAIN_MENU: 'main-menu',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_COMPLETE: 'level-complete',
  GAME_OVER: 'game-over',
  SETTINGS: 'settings',
  TIMED_RESULTS: 'timed-results',
  STATS: 'stats',
  ATTRACT: 'attract',
};

export class Game {
  constructor(canvas, input, settings, a11y) {
    this.canvas = canvas;
    this.input = input;
    this.settings = settings;
    this.a11y = a11y;

    this.screen = SCREEN.MAIN_MENU;
    this.prevScreen = SCREEN.MAIN_MENU;

    // Game state
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.highScore = 0;

    // Entities
    this.paddle = null;
    this.balls = [];
    this.brickGrid = null;
    this.powerUps = [];
    this.activePowerUps = [];
    this.lasers = [];
    this.particles = new ParticleSystem();

    // Timed challenge
    this.timedChallenge = new TimedChallenge();
    this.isTimedMode = false;

    // Countdown
    this.countdownValue = 3;
    this.countdownTimer = 0;

    // Stats tracking for session
    this.bricksDestroyed = 0;
    this.sessionStartTime = 0;

    // Laser firing
    this.laserFireCooldown = 0;
    this.laserFired = false;

    // Pause on focus loss
    this._hadFocus = true;

    // Attract mode
    this.attractTimer = 0;
    this.attractActive = false;
  }

  /**
   * Initialize a new game (single-player or timed)
   */
  startGame(timed = false) {
    this.isTimedMode = timed;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.bricksDestroyed = 0;
    this.sessionStartTime = Date.now();

    if (timed) {
      this.timedChallenge.start();
    }

    this.loadLevel(this.level);
  }

  /**
   * Load a specific level
   */
  loadLevel(levelNum) {
    this.level = levelNum;
    const matrix = getLevelMatrix(levelNum);
    const cols = matrix[0].length;
    const rows = matrix.length;

    // Calculate brick dimensions to fit canvas
    const playfieldW = this.canvas.width;
    const padding = 3;
    const offsetX = (playfieldW - cols * ((playfieldW - 20) / cols)) / 2;
    const brickWidth = (playfieldW - 20) / cols - padding;
    const brickHeight = 22;
    const offsetY = 50;

    this.brickGrid = new BrickGrid(cols, rows, brickWidth, brickHeight, padding, offsetX, offsetY);
    this.brickGrid.createFromMatrix(matrix);

    // Reset paddle
    const paddleWidth = getPaddleSize(levelNum, this.settings.paddleSize);
    const paddleY = this.canvas.height - 40;
    this.paddle = new Paddle(
      (playfieldW - paddleWidth) / 2,
      paddleY,
      paddleWidth,
      12
    );

    // Reset balls
    const baseSpeed = getBaseBallSpeed(levelNum, this.settings.ballSpeed);
    this.balls = [new Ball(this.paddle.centerX, paddleY - 8, baseSpeed)];

    // Clear power-ups and lasers
    this.powerUps = [];
    this.activePowerUps = [];
    this.lasers = [];
    this.particles.clear();

    // Reset timed challenge per level
    if (this.isTimedMode) {
      this.timedChallenge.start();
    }

    // Start countdown
    this.countdownValue = 3;
    this.countdownTimer = 0;
    this.screen = SCREEN.COUNTDOWN;
  }

  /**
   * Start countdown before gameplay
   */
  startCountdown() {
    this.countdownValue = 3;
    this.countdownTimer = 0;
    this.screen = SCREEN.COUNTDOWN;
  }

  /**
   * Main update - called every frame
   */
  update(dt) {
    switch (this.screen) {
      case SCREEN.COUNTDOWN:
        this.updateCountdown(dt);
        break;
      case SCREEN.PLAYING:
        this.updateGameplay(dt);
        break;
      case SCREEN.ATTRACT:
        this.updateAttract(dt);
        break;
    }
  }

  updateCountdown(dt) {
    this.countdownTimer += dt;
    while (this.countdownTimer >= 1000 && this.countdownValue > 0) {
      this.countdownTimer -= 1000;
      this.countdownValue--;
    }
    if (this.countdownValue <= 0) {
      this.screen = SCREEN.PLAYING;
      this.a11y.announceLevelStart(this.level);
    }
  }

  updateGameplay(dt) {
    // Update paddle
    this.paddle.update(this.input, this.canvas.width);

    // Update balls
    for (const ball of this.balls) {
      if (!ball.alive) continue;

      if (!ball.launched) {
        // Ball sticks to paddle
        ball.x = this.paddle.centerX;
        ball.y = this.paddle.y - ball.radius;

        // Launch on action
        if (this.input.isAction() || this.input.consumeClick() || this.input.consumeTap()) {
          ball.launchUp();
          return; // Don't fire laser on launch frame
        }
        continue;
      }

      // Sub-stepped physics: 4 smaller steps with collision checks each step
      const STEPS = 4;
      for (let s = 0; s < STEPS; s++) {
        ball.x += ball.vx / STEPS;
        ball.y += ball.vy / STEPS;

        // Wall bounces
        ball.bounceOffWall(this.canvas.width, this.canvas.height);

        // Paddle collision (AABB with ball radius on all sides)
        if (ball.vy > 0 &&
            ball.y + ball.radius >= this.paddle.y &&
            ball.y + ball.radius <= this.paddle.y + this.paddle.height + ball.radius &&
            ball.x + ball.radius >= this.paddle.x &&
            ball.x - ball.radius <= this.paddle.x + this.paddle.width) {
          ball.bounceOffPaddle(this.paddle);
          if (!this.isTimedMode) {
            ball.increaseSpeed(0.3);
          }
        }

        // Brick collision
        const hit = this.brickGrid.checkCollision(ball);
        if (hit) {
          if (hit.destroyed) {
            this.bricksDestroyed++;
            const brickScore = hit.brick.getScore();
            const multiplier = 1 + (this.level - 1) * 0.1;
            const points = Math.round(brickScore * multiplier);
            this.score += points;

            this.particles.emit(
              hit.brick.x + hit.brick.width / 2,
              hit.brick.y + hit.brick.height / 2,
              hit.brick.color,
              8
            );

            if (this.isTimedMode) {
              this.timedChallenge.addBrickDestroyed(points);
            }

            // Maybe drop power-up
            if (Math.random() < POWERUP_DROP_RATE) {
              this.spawnPowerUp(hit.brick);
            }
          }
          break; // stop sub-stepping after brick hit
        }
      }

      // Check if ball is out of bounds
      if (ball.isOutOfBounds(this.canvas.height)) {
        ball.alive = false;
      }
    }

    // Check if all balls are lost
    const aliveBalls = this.balls.filter(b => b.alive);
    if (aliveBalls.length === 0) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameOver();
        return;
      }
      // Respawn ball
      const baseSpeed = getBaseBallSpeed(this.level, this.settings.ballSpeed);
      this.balls = [new Ball(this.paddle.centerX, this.paddle.y - 8, baseSpeed)];
      this.activePowerUps = []; // Clear active power-ups on life loss
      this.paddle.resetSize();
      return;
    }

    // Update power-ups
    for (const pu of this.powerUps) {
      if (!pu.alive) continue;
      pu.update();

      // Check paddle collection
      if (pu.collidesWithPaddle(this.paddle)) {
        pu.alive = false;
        this.collectPowerUp(pu);
      }

      // Remove if out of bounds
      if (pu.isOutOfBounds(this.canvas.height)) {
        pu.alive = false;
      }
    }
    this.powerUps = this.powerUps.filter(pu => pu.alive);

    // Update active power-up timers
    for (const ap of this.activePowerUps) {
      ap.update(dt);
    }
    const expired = this.activePowerUps.filter(ap => ap.expired);
    this.activePowerUps = this.activePowerUps.filter(ap => !ap.expired);

    // Check paddle extend expiry
    const hasExtend = this.activePowerUps.some(ap => ap.type === POWERUP_TYPES.PADDLE_EXTEND && ap.active);
    if (!hasExtend && this.paddle.width !== this.paddle.baseWidth) {
      this.paddle.resetSize();
    }

    // Update lasers
    this.updateLasers(dt);

    // Update particles
    this.particles.update();

    // Update timed challenge
    if (this.isTimedMode) {
      this.timedChallenge.update(dt / 1000);
      if (this.timedChallenge.expired) {
        this.timedResults();
        return;
      }
    }

    // Check level completion
    if (this.brickGrid.getDestructibleCount() === 0 && !this.isTimedMode) {
      this.levelComplete();
    }

    // Handle pause
    if (this.input.consumePause()) {
      this.pause();
    }
  }

  spawnPowerUp(brick) {
    const types = Object.values(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const pu = new PowerUp(
      brick.x + brick.width / 2 - 14,
      brick.y + brick.height,
      type
    );
    this.powerUps.push(pu);
  }

  collectPowerUp(pu) {
    this.score += 50;

    switch (pu.type) {
      case POWERUP_TYPES.PADDLE_EXTEND:
        this.paddle.extend(1.5);
        this.activePowerUps.push(new ActivePowerUp(pu.type, POWERUP_CONFIG[pu.type].duration));
        this.activePowerUps[this.activePowerUps.length - 1].start();
        break;

      case POWERUP_TYPES.MULTIBALL:
        this.splitBalls();
        break;

      case POWERUP_TYPES.LASER:
        this.activePowerUps.push(new ActivePowerUp(pu.type, POWERUP_CONFIG[pu.type].duration));
        this.activePowerUps[this.activePowerUps.length - 1].start();
        break;

      case POWERUP_TYPES.SLOW_BALL:
        for (const ball of this.balls) {
          if (ball.alive) ball.slowDown(0.6);
        }
        this.activePowerUps.push(new ActivePowerUp(pu.type, POWERUP_CONFIG[pu.type].duration));
        this.activePowerUps[this.activePowerUps.length - 1].start();
        break;
    }

    this.a11y.announcePowerUp(pu.type);
  }

  splitBalls() {
    const MAX_BALLS = 8;
    if (this.balls.filter(b => b.alive).length >= MAX_BALLS) return;
    const newBalls = [];
    for (const ball of this.balls) {
      if (!ball.alive || !ball.launched) continue;
      if (this.balls.filter(b => b.alive).length + newBalls.length >= MAX_BALLS) break;
      for (let i = 0; i < 2; i++) {
        if (this.balls.filter(b => b.alive).length + newBalls.length >= MAX_BALLS) break;
        const nb = new Ball(ball.x, ball.y, ball.speed);
        const angle = ball.launched
          ? Math.atan2(-ball.vy, ball.vx) + (i === 0 ? -0.3 : 0.3)
          : (Math.random() - 0.5) * Math.PI * 0.5;
        nb.vx = Math.sin(angle) * ball.speed;
        nb.vy = -Math.cos(angle) * ball.speed;
        nb.launched = true;
        nb.alive = true;
        newBalls.push(nb);
      }
    }
    this.balls.push(...newBalls);
  }

  updateLasers(dt) {
    const hasLaser = this.activePowerUps.some(ap => ap.type === POWERUP_TYPES.LASER && ap.active);
    if (!hasLaser) {
      this.lasers = [];
      return;
    }

    // Fire laser on space (when ball is launched)
    const anyLaunched = this.balls.some(b => b.launched && b.alive);
    if (anyLaunched && this.input.isAction()) {
      if (this.laserFireCooldown <= 0) {
        this.fireLaser();
        this.laserFireCooldown = 300;
      }
    }

    // Auto-fire
    if (anyLaunched && this.laserFireCooldown <= 0) {
      this.fireLaser();
      this.laserFireCooldown = 500;
    }

    this.laserFireCooldown = Math.max(0, this.laserFireCooldown - dt);

    // Update laser positions
    for (const laser of this.lasers) {
      laser.y -= 6;
      laser.alive = laser.y > -laser.height;

      // Check brick collision
      const hit = this.brickGrid.checkLaserCollision(
        laser.x, laser.y, laser.width, laser.height
      );
      if (hit) {
        laser.alive = false;
        if (hit.destroyed) {
          this.bricksDestroyed++;
          const brickScore = hit.brick.getScore();
          const multiplier = 1 + (this.level - 1) * 0.1;
          this.score += Math.round(brickScore * multiplier);
          this.particles.emit(
            hit.brick.x + hit.brick.width / 2,
            hit.brick.y + hit.brick.height / 2,
            hit.brick.color,
            6
          );
          if (this.isTimedMode) {
            this.timedChallenge.addBrickDestroyed(brickScore);
          }
        }
      }
    }
    this.lasers = this.lasers.filter(l => l.alive);
  }

  fireLaser() {
    const laser = {
      x: this.paddle.x + 4,
      y: this.paddle.y - 12,
      width: 4,
      height: 12,
      alive: true,
    };
    // Also fire from right side
    const laser2 = {
      x: this.paddle.x + this.paddle.width - 8,
      y: this.paddle.y - 12,
      width: 4,
      height: 12,
      alive: true,
    };
    this.lasers.push(laser, laser2);
  }

  levelComplete() {
    // Calculate completion bonus
    const livesBonus = this.lives * 100;
    const multiplier = 1 + (this.level - 1) * 0.1;
    this.score += Math.round(livesBonus * multiplier);

    this.screen = SCREEN.LEVEL_COMPLETE;
    this.a11y.announceLevelComplete(this.level, this.score);
  }

  gameOver() {
    this.screen = SCREEN.GAME_OVER;
    this.a11y.announceGameOver(this.score, this.highScore);
  }

  timedResults() {
    this.screen = SCREEN.TIMED_RESULTS;
    this.a11y.announceTimedResults(
      this.timedChallenge.score,
      this.timedChallenge.bricksDestroyed,
      this.timedChallenge.score
    );
  }

  pause() {
    this.prevScreen = this.screen;
    this.screen = SCREEN.PAUSED;
    this.a11y.announcePause();
  }

  resume() {
    this.screen = this.prevScreen === SCREEN.PAUSED ? SCREEN.PLAYING : this.prevScreen;
    this.a11y.announceResume();
  }

  nextLevel() {
    this.level++;
    this.loadLevel(this.level);
  }

  get levelScore() {
    return this.score;
  }

  get bricksRemaining() {
    return this.brickGrid ? this.brickGrid.getDestructibleCount() : 0;
  }

  get livesDisplay() {
    return this.lives;
  }

  get scoreDisplay() {
    return this.score;
  }

  get levelDisplay() {
    return this.level;
  }

  get countdownDisplay() {
    return Math.max(0, this.countdownValue);
  }
}
