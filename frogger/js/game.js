// Main game loop and state machine

import { Frog, DIRECTIONS } from './frog.js';
import { LANES, LANE_TYPES } from './lane.js';
import { ObstacleSpawner } from './spawner.js';
import { RiverSystem } from './river.js';
import { HomeSlots } from './homeslots.js';
import { GameTimer } from './timer.js';
import { Scoring } from './scoring.js';
import { BonusSystem } from './bonus.js';
import { AudioManager } from './audio.js';
import { InputHandler } from './input.js';
import { Renderer } from './renderer.js';
import { findCollision } from './collision.js';

const STATES = {
  IDLE: 'idle',
  PLAYING: 'playing',
  PAUSED: 'paused',
  DEATH: 'death',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over',
};

const GRID_WIDTH = 15;
const GRID_HEIGHT = 13;
const INITIAL_TIMER = 30;
const TIMER_DECREASE = 2;
const MIN_TIMER = 15;
const SPEED_MULTIPLIER = 1.1;
const DEATH_DURATION = 500; // ms
const FIXED_DT = 1 / 60; // fixed timestep of ~60fps for game logic

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = STATES.IDLE;
    this.lastTime = 0;
    this.accumulator = 0;
    this.deathTimer = 0;
    this.levelCompleteTimer = 0;
    this.timerWarningPlayed = false;
    this.spawnCooldown = 0; // seconds — blocks movement after reset

    // Initialize systems
    this.frog = new Frog({ startX: 7, startY: 12 }); // grid position (0-indexed: col 7, row 12 = row 13)
    this.spawner = new ObstacleSpawner();
    this.river = new RiverSystem();
    this.homeSlots = new HomeSlots();
    this.timer = new GameTimer(INITIAL_TIMER);
    this.scoring = new Scoring();
    this.bonus = new BonusSystem();
    this.audio = new AudioManager();
    this.renderer = new Renderer(canvas);
    this.input = new InputHandler(canvas);

    this.bonus.setHomeSlots(this.homeSlots);

    // Input callbacks
    this.input.setCallbacks({
      move: (dir) => this.handleMove(dir),
      start: () => this.handleStart(),
      pause: () => this.handlePause(),
      mute: () => this.handleMute(),
    });

    // Reduced motion preference
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer.reducedMotion = this.reducedMotion;

    // ARIA live regions
    this.politeRegion = document.getElementById('aria-live-polite');
    this.assertiveRegion = document.getElementById('aria-live-assertive');

    // Bind and start
    this.gameLoop = this.gameLoop.bind(this);
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Kick off the game loop so the idle screen renders immediately
    requestAnimationFrame(this.gameLoop);
  }

  /**
   * Start the game.
   */
  start() {
    this.audio.init();
    this.scoring.reset();
    this.homeSlots.reset();
    this.bonus.reset();
    this.spawner.init(this.renderer.canvasWidth, this.renderer.cellSize);
    this.timer.start(INITIAL_TIMER);
    this.frog.reset();
    this.state = STATES.PLAYING;
    this.audio.startGameplayMusic();
    this.announceAssertive('Game started');
    requestAnimationFrame(this.gameLoop);
  }

  /**
   * Enable input listeners (called at construction).
   */
  enableInput() {
    this.input.enable();
  }

  /**
   * Resize canvas.
   */
  resize() {
    const maxW = Math.min(600, window.innerWidth - 20);
    const maxH = Math.min(600, window.innerHeight - 200);
    this.renderer.resize(maxW, maxH);
    if (this.state === STATES.PLAYING || this.state === STATES.PAUSED) {
      this.spawner.init(this.renderer.canvasWidth, this.renderer.cellSize);
    }
  }

  /**
   * Main game loop.
   */
  gameLoop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const delta = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    switch (this.state) {
      case STATES.IDLE:
        this.accumulator = 0;
        this.renderIdle();
        if (this.audio.initialized && !this.audio.musicPlaying) {
          this.audio.startIdleMusic();
        }
        requestAnimationFrame(this.gameLoop);
        break;

      case STATES.PLAYING:
        this.accumulator += delta;
        if (this.accumulator > 0.25) this.accumulator = 0.25; // clamp to prevent spiral
        while (this.accumulator >= FIXED_DT) {
          this.update(FIXED_DT);
          this.accumulator -= FIXED_DT;
        }
        this.render();
        requestAnimationFrame(this.gameLoop);
        break;

      case STATES.PAUSED:
        this.render();
        this.renderer.drawPausedOverlay();
        requestAnimationFrame(this.gameLoop);
        break;

      case STATES.DEATH:
        this.deathTimer += delta * 1000;
        this.render();
        this.renderer.drawDeathEffect();
        if (this.deathTimer >= DEATH_DURATION || this.reducedMotion) {
          this.handlePostDeath();
          if (this.state === STATES.PLAYING) {
            requestAnimationFrame(this.gameLoop);
          }
        } else {
          requestAnimationFrame(this.gameLoop);
        }
        break;

      case STATES.LEVEL_COMPLETE:
        this.levelCompleteTimer += delta * 1000;
        this.render();
        this.renderer.drawLevelCompleteOverlay(this.scoring.level);
        if (this.levelCompleteTimer >= 1500 || this.reducedMotion) {
          this.handleNextLevel();
          if (this.state === STATES.PLAYING) {
            requestAnimationFrame(this.gameLoop);
          }
        } else {
          requestAnimationFrame(this.gameLoop);
        }
        break;

      case STATES.GAME_OVER:
        this.render();
        this.renderer.drawGameOverOverlay(this.scoring.score, this.scoring.highScore);
        requestAnimationFrame(this.gameLoop);
        break;
    }
  }

  /**
   * Update game state.
   */
  update(delta) {
    // Move obstacles
    const cs = this.renderer.cellSize;
    const cw = this.renderer.canvasWidth;
    const obstacles = this.spawner.getAll();

    for (const obs of obstacles) {
      obs.update(delta, cs, cw);

      // Turtle diving
      if (obs.isDiver) {
        obs.diveCycle += delta;
        if (obs.diveCycle >= obs.diveInterval) {
          obs.diveCycle = 0;
          obs.isDiving = !obs.isDiving;
          if (obs.isDiving) {
            this.audio.playTurtleDive();
          }
        }
      }
    }

    // Apply conveyor movement
    const frogBounds = this.frog.getBounds(cs, 4);
    this.river.applyConveyor(this.frog, frogBounds, obstacles, delta, cs);

    // Check screen edge death from conveyor
    if (this.river.isOffScreen(this.frog, cw, cs)) {
      this.handleDeath('river');
      return;
    }

    // Check vehicle collisions
    const roadObstacles = obstacles.filter(o =>
      LANES.find(l => l.row === o.row)?.type === LANE_TYPES.ROAD
    );
    const hitVehicle = findCollision(this.frog.getBounds(cs, 6), roadObstacles);
    if (hitVehicle) {
      this.handleDeath('road');
      return;
    }

    // Check turtle diving death
    if (this.frog.isOnPlatform && this.frog.platformId) {
      const platform = obstacles.find(o => o.id === this.frog.platformId);
      if (platform && platform.isDiving) {
        this.handleDeath('river');
        return;
      }
    }

    // Check river safety
    if (this.river.isDrowning(this.frog.y + 1, this.frog.getBounds(cs, 4), obstacles)) {
      this.handleDeath('river');
      return;
    }

    // Check home slot arrival
    if (this.frog.y === 0) {
      this.handleHomeArrival();
      return;
    }

    // Check ladybug collection
    if (this.bonus.checkLadybug(this.frog.getBounds(cs, 4), obstacles)) {
      this.scoring.addPoints(this.scoring.scoreLadybug());
      this.audio.playLadybug();
      this.announcePolite('Ladybug collected, 200 points');
    }

    // Score for moving up
    const moveScore = this.scoring.scoreMoveUp(this.frog.y);
    if (moveScore > 0) {
      this.scoring.addPoints(moveScore);
    }

    // Update spawn cooldown
    if (this.spawnCooldown > 0) {
      this.spawnCooldown = Math.max(0, this.spawnCooldown - delta);
    }

    // Update timer
    const timerExpired = this.timer.update(delta);
    if (timerExpired) {
      this.audio.playDeathRoad();
      this.handleDeath('road');
      return;
    }

    // Timer warning
    if (this.timer.isDanger() && !this.timerWarningPlayed) {
      this.audio.playTimerWarning();
      this.timerWarningPlayed = true;
    } else if (!this.timer.isDanger()) {
      this.timerWarningPlayed = false;
    }

    // Update bonus system
    this.bonus.update(delta, obstacles);
    this.homeSlots.updateTimers(delta);

    // Update HUD
    this.updateHUD();
  }

  /**
   * Render the game frame.
   */
  render() {
    const ctx = this.renderer.ctx;
    ctx.clearRect(0, 0, this.renderer.canvasWidth, this.renderer.canvasHeight);

    this.renderer.drawBackground();
    this.renderer.drawHomeSlots(this.homeSlots);
    this.renderer.drawObstacles(this.spawner.getAll());
    this.renderer.drawFrog(this.frog);
  }

  /**
   * Render idle screen.
   */
  renderIdle() {
    const ctx = this.renderer.ctx;
    ctx.clearRect(0, 0, this.renderer.canvasWidth, this.renderer.canvasHeight);

    this.renderer.drawBackground();
    this.renderer.drawHomeSlots(this.homeSlots);
    this.renderer.drawIdleScreen();

    // High score
    if (this.scoring.highScore > 0) {
      const cs = this.renderer.cellSize;
      const w = this.renderer.canvasWidth;
      const h = this.renderer.canvasHeight;
      ctx.fillStyle = '#ffcc00';
      ctx.font = `${cs * 0.45}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`High Score: ${this.scoring.highScore}`, w / 2, h * 0.9);
    }
  }

  /**
   * Handle frog movement.
   */
  handleMove(direction) {
    if (this.state !== STATES.PLAYING) return;
    if (this.frog.isDead) return;
    if (this.spawnCooldown > 0) return; // block input during spawn cooldown

    // Convert grid position: frog.y is 0-indexed, lanes are 1-indexed
    const gridY = this.frog.y + 1;
    const gridX = this.frog.x + 1;

    if (!this.frog.move(direction, GRID_WIDTH, GRID_HEIGHT)) return;

    // After any hop, reset the conveyor offset. The grid change provides the
    // visual one-cell movement. The offset starts accumulating from 0, so the
    // frog stays centered in its grid cell and doesn't drift off the platform.
    this.frog.resetConveyorOffset();

    this.audio.playHop();

    // Check home row after move
    if (this.frog.y === 0) {
      this.handleHomeArrival();
    }
  }

  /**
   * Handle frog arriving at home row.
   */
  handleHomeArrival() {
    const result = this.homeSlots.handleArrival(this.frog.x + 1);

    switch (result) {
      case 'filled':
        this.scoring.addPoints(this.scoring.scoreHome(false));
        this.scoring.scoreTimeBonus(this.timer);
        this.audio.playHome();
        this.announceAssertive(`Home reached! ${this.scoring.score} points`);
        this.frog.reset();
        this.timer.reset();
        this.timerWarningPlayed = false;
        this.spawnCooldown = 1.5;
        this.scoring.lowestRow = 12; // reset progress tracking for next attempt
        break;

      case 'bonus':
        this.scoring.addPoints(this.scoring.scoreHome(true));
        this.scoring.scoreTimeBonus(this.timer);
        this.audio.playHome();
        this.announceAssertive('Bonus home! 200 points');
        this.frog.reset();
        this.timer.reset();
        this.timerWarningPlayed = false;
        this.spawnCooldown = 1.5;
        this.scoring.lowestRow = 12; // reset progress tracking for next attempt
        break;

      case 'occupied':
      case 'outside':
        this.handleDeath('road');
        break;
    }

    // Check level complete
    if (this.homeSlots.allFilled()) {
      this.scoring.addPoints(this.scoring.scoreLevelComplete());
      this.audio.playLevelComplete();
      this.state = STATES.LEVEL_COMPLETE;
      this.levelCompleteTimer = 0;
      this.renderer.levelCompleteStartTime = 0;
      this.announceAssertive(`Level ${this.scoring.level} complete! 1000 bonus points`);
    }
  }

  /**
   * Handle frog death.
   */
  handleDeath(type) {
    this.frog.isDead = true;
    this.state = STATES.DEATH;
    this.deathTimer = 0;
    this.timer.stop();

    // Set death effect position
    const cs = this.renderer.cellSize;
    const pos = this.frog.getPixelPosition(cs);
    this.renderer.deathType = type;
    this.renderer.deathX = pos.x + cs / 2;
    this.renderer.deathY = pos.y + cs / 2;
    this.renderer.deathStartTime = Date.now();

    if (type === 'river') {
      this.audio.playDeathRiver();
      this.announceAssertive('Frog drowned!');
    } else {
      this.audio.playDeathRoad();
      this.announceAssertive('Frog hit by vehicle!');
    }
  }

  /**
   * Handle post-death logic.
   */
  handlePostDeath() {
    this.scoring.scoreTimeBonus(this.timer);
    const alive = this.scoring.loseLife();

    if (!alive) {
      this.scoring.updateHighScore();
      this.state = STATES.GAME_OVER;
      this.audio.stopMusic();
      this.audio.playGameOver();
      this.announceAssertive(`Game over! Score: ${this.scoring.score}. High score: ${this.scoring.highScore}`);
    } else {
      this.frog.reset();
      this.timer.reset();
      this.timerWarningPlayed = false;
      this.spawnCooldown = 1.5;
      this.state = STATES.PLAYING;
      this.announcePolite(`${this.scoring.lives} lives remaining`);
    }
  }

  /**
   * Handle next level transition.
   */
  handleNextLevel() {
    this.scoring.nextLevel();
    this.homeSlots.reset();
    this.bonus.reset();

    // Increase difficulty
    this.spawner.increaseSpeeds(SPEED_MULTIPLIER);

    // Decrease timer
    const newTimer = Math.max(MIN_TIMER, INITIAL_TIMER - (this.scoring.level - 1) * TIMER_DECREASE);
    this.timer = new GameTimer(newTimer);
    this.timer.start(newTimer);

    this.frog.reset();
    this.state = STATES.PLAYING;
    this.announceAssertive(`Level ${this.scoring.level} started`);
  }

  /**
   * Handle start input.
   */
  handleStart() {
    switch (this.state) {
      case STATES.IDLE:
        this.start();
        break;
      case STATES.GAME_OVER:
        this.lastTime = 0;
        this.spawner.init(this.renderer.canvasWidth, this.renderer.cellSize);
        this.start();
        break;
    }
  }

  /**
   * Handle pause input.
   */
  handlePause() {
    if (this.state === STATES.PLAYING) {
      this.state = STATES.PAUSED;
      this.timer.stop();
      this.audio.stopMusic();
      this.audio.playPause();
      this.announceAssertive('Game paused');
    } else if (this.state === STATES.PAUSED) {
      this.state = STATES.PLAYING;
      this.timer.start();
      this.audio.startGameplayMusic();
      this.audio.playResume();
      this.announceAssertive('Game resumed');
    }
  }

  /**
   * Handle mute toggle.
   */
  handleMute() {
    this.audio.init();
    const muted = this.audio.toggleMute();
    this.updateMuteButton(muted);
    this.announcePolite(muted ? 'Audio muted' : 'Audio unmuted');
  }

  /**
   * Update HUD elements.
   */
  updateHUD() {
    const scoreEl = document.getElementById('hud-score');
    const livesEl = document.getElementById('hud-lives');
    const levelEl = document.getElementById('hud-level');

    if (scoreEl) scoreEl.textContent = `Score: ${this.scoring.score}`;
    if (levelEl) levelEl.textContent = `Level ${this.scoring.level}`;
    if (livesEl) {
      livesEl.textContent = '';
      for (let i = 0; i < this.scoring.lives; i++) {
        livesEl.textContent += '🐸';
      }
    }
  }

  /**
   * Update mute button icon.
   */
  updateMuteButton(muted) {
    const btn = document.getElementById('mute-btn');
    if (btn) {
      btn.textContent = muted ? '🔇' : '🔊';
      btn.setAttribute('aria-label', muted ? 'Unmute audio' : 'Mute audio');
    }
  }

  /**
   * Announce to polite ARIA live region.
   */
  announcePolite(message) {
    if (this.politeRegion) {
      this.politeRegion.textContent = message;
    }
  }

  /**
   * Announce to assertive ARIA live region.
   */
  announceAssertive(message) {
    if (this.assertiveRegion) {
      this.assertiveRegion.textContent = message;
    }
  }
}
