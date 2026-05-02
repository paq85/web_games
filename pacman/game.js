/**
 * Pacman Game Controller
 *
 * Main game loop and state machine that integrates all modules:
 * maze, pacman, ghost, fruit, audio, input, ui, persistence.
 *
 * Vanilla JS — ES module export. No dependencies.
 */

import { MAZE_WIDTH, MAZE_HEIGHT, CELL_TYPES, getMazeData, getDotCount, renderMaze, isWalkable, getCell } from './maze.js';
import { Pacman, UP, DOWN, LEFT, RIGHT } from './pacman.js';
import { Ghost, GHOST_COLORS, GHOST_NAMES, GHOST_TARGET_CORNERS } from './ghost.js';
import { FruitSpawner } from './fruit.js';
import { AudioEngine } from './audio.js';
import { InputHandler, DIRECTIONS as INPUT_DIRS } from './input.js';
import { UI, SCREENS, DIFFICULTIES, renderPixelText } from './ui.js';
import { Persistence, DEFAULT_SETTINGS, ACHIEVEMENTS } from './persistence.js';

// ---------------------------------------------------------------------------
// Direction mapping
// ---------------------------------------------------------------------------

/** Map InputHandler string direction → Pacman {dx, dy} direction */
const STRING_TO_PACMAN = {
  [INPUT_DIRS.UP]:    UP,
  [INPUT_DIRS.DOWN]:  DOWN,
  [INPUT_DIRS.LEFT]:  LEFT,
  [INPUT_DIRS.RIGHT]: RIGHT,
};

/** Map InputHandler string direction → Ghost string direction ('UP', 'DOWN', …) */
const STRING_TO_GHOST = {
  [INPUT_DIRS.UP]:    'UP',
  [INPUT_DIRS.DOWN]:  'DOWN',
  [INPUT_DIRS.LEFT]:  'LEFT',
  [INPUT_DIRS.RIGHT]: 'RIGHT',
};

// ---------------------------------------------------------------------------
// Difficulty settings
// ---------------------------------------------------------------------------

const DIFFICULTY_CONFIG = {
  easy: {
    ghostSpeedMultiplier: 0.8,
    frightenedDuration: 12,       // seconds
    pacmanSpeedMultiplier: 1.0,
    scatterDuration: 7,           // seconds
    chaseDuration: 20,
  },
  medium: {
    ghostSpeedMultiplier: 1.0,
    frightenedDuration: 8,
    pacmanSpeedMultiplier: 1.0,
    scatterDuration: 7,
    chaseDuration: 20,
  },
  hard: {
    ghostSpeedMultiplier: 1.25,
    frightenedDuration: 5,
    pacmanSpeedMultiplier: 1.0,
    scatterDuration: 4,
    chaseDuration: 25,
  },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Pacman base movement speed (cells per second) */
const PACMAN_BASE_SPEED = 4;

/** Ghost base movement speed (cells per second) */
const GHOST_BASE_SPEED = 3;

/** Eaten ghost speed multiplier (eyes returning home) */
const EATEN_GHOST_SPEED_MULT = 2.0;

/** Frightened ghost speed multiplier */
const FRIGHTENED_GHOST_SPEED_MULT = 0.5;

/** Dot points */
const DOT_POINTS = 10;

/** Power pellet points */
const POWER_PELLET_POINTS = 50;

/** Ghost points base (doubles each consecutive eat: 200, 400, 800, 1600) */
const GHOST_EAT_BASE_POINTS = 200;

/** Maximum level */
const MAX_LEVEL = 16;

/** Ghost start positions */
const GHOST_STARTS = {
  blinky: { x: 14, y: 11, inHouse: false },   // Outside, above house
  pinky:  { x: 14, y: 14, inHouse: true },    // Inside house
  inky:   { x: 12, y: 14, inHouse: true },    // Inside house
  clyde:  { x: 16, y: 14, inHouse: true },    // Inside house
};

/** Pacman start position */
const PACMAN_START = { x: 14, y: 23 };

/** Deep-clone a maze grid (for saving/restoring between levels). */
function cloneMazeGrid(grid) {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

// ---------------------------------------------------------------------------
// Game class
// ---------------------------------------------------------------------------

export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // ── Subsystems ────────────────────────────────────────────────────────
    this.audio = new AudioEngine();
    this.input = new InputHandler(canvas);
    this.persistence = new Persistence();
    this.ui = new UI(canvas, this.ctx);

    // ── Game state ────────────────────────────────────────────────────────
    this.gameState = 'ATTRACT';  // ATTRACT | COUNTDOWN | PLAYING | PAUSED | GAME_OVER | LEVEL_TRANSITION
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.dotsEaten = 0;           // dots eaten in current level
    this.totalDotsEaten = 0;      // all-time dots eaten this session
    this.totalGhostsEaten = 0;    // all-time ghosts eaten this session
    this.totalFruitsCollected = 0; // all-time fruits collected this session
    this.difficulty = 'medium';
    this.practiceMode = false;

    // ── Maze data (mutable — dots are consumed) ───────────────────────────
    this.mazeData = null;

    // ── Entities ──────────────────────────────────────────────────────────
    this.pacman = null;
    this.ghosts = [];
    this.fruitSpawner = new FruitSpawner();
    this.currentFruit = null;

    // ── Ghost state tracking ──────────────────────────────────────────────
    this.frightenedTimer = 0;
    this.ghostEatCombo = 0;       // consecutive ghosts eaten (for 200→400→800→1600)
    this.scatterTimer = 0;
    this.chaseTimer = 0;
    this.modeState = 'SCATTER';   // 'SCATTER' | 'CHASE'

    // ── Countdown ─────────────────────────────────────────────────────────
    this.countdownValue = 3;
    this.countdownTimer = 0;

    // ── Level transition ──────────────────────────────────────────────────
    this.levelTransitionTimer = 0;

    // ── Timing ────────────────────────────────────────────────────────────
    this._lastTime = 0;
    this._frameId = null;
    this._elapsedTime = 0;

    // ── Layout ────────────────────────────────────────────────────────────
    this.cellSize = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    // ── Waka timer (throttle waka sound) ──────────────────────────────────
    this._wakaTimer = 0;
    this._wakaInterval = 0.15;    // seconds between waka sounds

    // ── Audio init flag ───────────────────────────────────────────────────
    this._audioInitialized = false;

    // ── Visual effects ─────────────────────────────────────────────────────
    this._shakeIntensity = 0;

    // ── Accessibility ─────────────────────────────────────────────────────
    this._politeRegion = document.getElementById('aria-live-polite');
    this._assertiveRegion = document.getElementById('aria-live-assertive');
    this._lastPoliteAnnouncement = '';
    this._lastAssertiveAnnouncement = '';
    this._reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Listen for changes to prefers-reduced-motion
    this._reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._onReducedMotionChange = (e) => {
      this._reducedMotion = e.matches;
    };
    this._reducedMotionMediaQuery.addEventListener('change', this._onReducedMotionChange);

    // ── Setup ─────────────────────────────────────────────────────────────
    this._loadSettings();
    this._setupInputCallbacks();
    this._resize();
    this._bindResize();
  }

  // ════════════════════════════════════════════════════════════════════════
  // Accessibility helpers
  // ════════════════════════════════════════════════════════════════════════

  /** Announce via polite aria-live region (avoids duplicate announcements). */
  _announcePolite(message) {
    if (this._politeRegion && message !== this._lastPoliteAnnouncement) {
      this._politeRegion.textContent = message;
      this._lastPoliteAnnouncement = message;
    }
  }

  /** Announce via assertive aria-live region (avoids duplicate announcements). */
  _announceAssertive(message) {
    if (this._assertiveRegion && message !== this._lastAssertiveAnnouncement) {
      this._assertiveRegion.textContent = message;
      this._lastAssertiveAnnouncement = message;
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Achievement helpers
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Check and unlock an achievement if not already unlocked.
   * @param {string} id - Achievement ID to check.
   */
  _checkAchievement(id) {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return;

    const unlocked = this.persistence.unlockAchievement(id);
    if (unlocked) {
      this.ui.addAchievementNotification(achievement);
      this._announcePolite(`Achievement unlocked: ${achievement.name}`);
      this.audio.playAchievement();
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ════════════════════════════════════════════════════════════════════════

  /** Start the game loop and show attract mode. */
  start() {
    this.gameState = 'ATTRACT';
    this.ui.setScreen(SCREENS.ATTRACT);
    this._lastTime = performance.now();
    this._frameId = requestAnimationFrame((t) => this._gameLoop(t));
  }

  /** Pause the game (only during PLAYING). */
  pause() {
    if (this.gameState !== 'PLAYING') return;
    this.gameState = 'PAUSED';
    this.ui.setScreen(SCREENS.PAUSE);
    this.audio.playPause();
    this._announceAssertive('Game paused. Press Escape to resume.');
  }

  /** Resume the game (only from PAUSED). */
  resume() {
    if (this.gameState !== 'PAUSED') return;
    this.gameState = 'PLAYING';
    this.ui.setScreen(null);  // clear overlay
    this.ui.screen = null;
    this.audio.playResume();
    this._announceAssertive('Game resumed.');
  }

  /** Restart the game from scratch. */
  restart() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.dotsEaten = 0;
    this.totalDotsEaten = 0;
    this.ghostEatCombo = 0;
    this.difficulty = this.ui.getDifficulty() || 'medium';
    this._initLevel();
    this._startCountdown();
  }

  /** Return to main menu. */
  quitToMenu() {
    this.gameState = 'ATTRACT';
    this.audio.stopMusic();
    this.audio.startMenuMusic();
    this.ui.setScreen(SCREENS.MAIN_MENU);
  }

  // ════════════════════════════════════════════════════════════════════════
  // Game loop
  // ════════════════════════════════════════════════════════════════════════

  /** Main game loop — called every frame via requestAnimationFrame. */
  _gameLoop(timestamp) {
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05); // cap at 50ms
    this._lastTime = timestamp;
    this._elapsedTime = timestamp;

    // Update
    this._update(dt);

    // Render
    this._render();

    // Continue loop
    this._frameId = requestAnimationFrame((t) => this._gameLoop(t));
  }

  /** Update game state based on dt (seconds). */
  _update(dt) {
    // Always update UI animations
    this.ui.update(dt);

    switch (this.gameState) {
      case 'ATTRACT':
        this._updateAttract(dt);
        break;
      case 'COUNTDOWN':
        this._updateCountdown(dt);
        break;
      case 'PLAYING':
        this._updatePlaying(dt);
        break;
      case 'PAUSED':
        // Nothing to update — game is frozen
        break;
      case 'GAME_OVER':
        // Nothing to update
        break;
      case 'LEVEL_TRANSITION':
        this._updateLevelTransition(dt);
        break;
    }
  }

  /** Render the current frame. */
  _render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    ctx.save();

    // Screen shake
    if (this._shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this._shakeIntensity * 6;
      const shakeY = (Math.random() - 0.5) * this._shakeIntensity * 6;
      ctx.translate(shakeX, shakeY);
    }

    // Render maze and entities for gameplay states
    if (this.gameState === 'PLAYING' || this.gameState === 'PAUSED' || this.gameState === 'COUNTDOWN' || this.gameState === 'LEVEL_TRANSITION') {
      this._renderGameplay();
    }

    ctx.restore();

    // Render UI overlay
    if (this.ui.screen) {
      this.ui.render(ctx, w, h, this._elapsedTime);
    }

    // Render HUD during gameplay
    if (this.gameState === 'PLAYING' || this.gameState === 'PAUSED') {
      this.ui.renderHUD(ctx, w, h, this.frightenedTimer, this.difficulty);
    }

    // Render touch controls if enabled
    if (this.input.isTouchDevice() && (this.gameState === 'PLAYING')) {
      this.input.renderTouchControls(ctx, w, h);
    }

    // CRT overlay
    if (this._getCrtOverlay()) {
      this._renderCrtOverlay(ctx, w, h);
    }
  }

  /** Check if CRT overlay is enabled in settings. */
  _getCrtOverlay() {
    try {
      const settings = this.persistence.loadSettings();
      return !!settings.crtOverlay;
    } catch {
      return false;
    }
  }

  /** Check if reduced flash is enabled in settings. */
  _getReducedFlash() {
    try {
      const settings = this.persistence.loadSettings();
      return !!settings.reducedFlash;
    } catch {
      return false;
    }
  }

  /** Check if screen shake is enabled in settings. */
  _getScreenShake() {
    try {
      const settings = this.persistence.loadSettings();
      return !!settings.screenShake;
    } catch {
      return false;
    }
  }

  /** Render CRT scanline overlay. */
  _renderCrtOverlay(ctx, w, h) {
    // Scanlines — semi-transparent horizontal lines every 3px
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }
    // Vignette — darkened corners
    const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.75);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  /** Render maze, pacman, ghosts, fruit during gameplay. */
  _renderGameplay() {
    if (!this.mazeData) return;

    renderMaze(this.ctx, this.cellSize, this.offsetX, this.offsetY, this._elapsedTime);

    if (this.pacman) {
      this.pacman.render(this.ctx, this.offsetX, this.offsetY, this.cellSize, this._elapsedTime);
    }

    for (const ghost of this.ghosts) {
      ghost.render(this.ctx, this.offsetX, this.offsetY, this.cellSize, this._elapsedTime);
    }

    if (this.currentFruit && this.currentFruit.active) {
      this.currentFruit.render(this.ctx, this.offsetX, this.offsetY, this.cellSize, this._elapsedTime);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // State updates
  // ════════════════════════════════════════════════════════════════════════

  /** Handle attract mode — wait for player to press confirm. */
  _updateAttract(dt) {
    // Nothing to do — input callbacks handle transitions
  }

  /** Handle countdown before gameplay starts. */
  _updateCountdown(dt) {
    this.countdownTimer += dt;

    if (this.countdownTimer >= 1) {
      this.countdownTimer = 0;
      this.countdownValue--;

      if (this.countdownValue > 0) {
        this.ui.setCountdown(this.countdownValue);
      } else if (this.countdownValue === 0) {
        this.ui.setCountdown(0); // "GO!"
      } else {
        // Countdown done — start playing
        this.gameState = 'PLAYING';
        this.ui.screen = null;
        this.audio.startGameMusic();
        this._resetGhostTimers();
      }
    }
  }

  /** Main gameplay update. */
  _updatePlaying(dt) {
    if (!this.pacman || !this.mazeData) return;

    // ── Update chase/scatter timer ──────────────────────────────────────
    this._updateGhostMode(dt);

    // ── Update frightened timer ─────────────────────────────────────────
    if (this.frightenedTimer > 0) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.frightenedTimer = 0;
        // Un-frighten ghosts
        for (const ghost of this.ghosts) {
          if (ghost.state === 'FRIGHTENED') {
            ghost.state = this.modeState;
          }
        }
      }
    }

    // ── Get input direction ─────────────────────────────────────────────
    this._handleDirectionInput();

    // ── Move Pacman ─────────────────────────────────────────────────────
    const diffConfig = DIFFICULTY_CONFIG[this.difficulty];
    const pacmanSpeed = PACMAN_BASE_SPEED * diffConfig.pacmanSpeedMultiplier;
    const result = this.pacman.move(
      { MAZE_WIDTH, isWalkable, getCell, CELL_TYPES },
      pacmanSpeed * dt
    );

    // ── Handle dot/pellet collection ────────────────────────────────────
    if (result.dots > 0) {
      this._eatDot();
    }
    if (result.powerPellets > 0) {
      this._eatPowerPellet();
    }

    // ── Waka sound ──────────────────────────────────────────────────────
    if (this.pacman.isMoving) {
      this._wakaTimer += dt;
      if (this._wakaTimer >= this._wakaInterval) {
        this._wakaTimer = 0;
        this.audio.playWaka();
      }
    }

    // ── Update Pacman animation ─────────────────────────────────────────
    if (!this._reducedMotion) {
      this.pacman.updateAnimation(dt);
    } else {
      // Reduced motion: keep mouth static
      this.pacman.mouthAngle = this.pacman.mouthMaxAngle * 0.5;
    }

    // ── Move ghosts ─────────────────────────────────────────────────────
    this._moveGhosts(dt, diffConfig);

    // ── Check ghost collisions ──────────────────────────────────────────
    this._checkGhostCollisions();

    // ── Decay screen shake ──────────────────────────────────────────────
    if (this._shakeIntensity > 0) {
      this._shakeIntensity = Math.max(0, this._shakeIntensity - dt * 10);
    }

    // ── Update fruit ────────────────────────────────────────────────────
    this._updateFruit(dt);

    // ── Check for level completion ──────────────────────────────────────
    this._checkLevelComplete();

    // ── Handle death animation ──────────────────────────────────────────
    if (this.pacman.isDying) {
      if (this.pacman.deathProgress >= 1) {
        this._handleDeathComplete();
      }
    }

    // ── Update UI state ─────────────────────────────────────────────────
    this.ui.setScore(this.score);
    this.ui.setLevel(this.level);
    this.ui.setLives(this.lives);
  }

  /** Handle level transition between levels. */
  _updateLevelTransition(dt) {
    this.levelTransitionTimer += dt;

    // After 1.5 seconds, start next level
    if (this.levelTransitionTimer >= 1.5) {
      this.levelTransitionTimer = 0;
      this.level++;
      if (this.level > MAX_LEVEL) {
        this.level = MAX_LEVEL; // cap at max level
      }
      this._initLevel();
      this._startCountdown();
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Ghost mode management
  // ════════════════════════════════════════════════════════════════════════

  /** Update chase/scatter mode timers. */
  _updateGhostMode(dt) {
    const diffConfig = DIFFICULTY_CONFIG[this.difficulty];

    if (this.modeState === 'SCATTER') {
      this.scatterTimer -= dt;
      if (this.scatterTimer <= 0) {
        this.modeState = 'CHASE';
        this.chaseTimer = diffConfig.chaseDuration;
        // Switch ghosts to chase
        for (const ghost of this.ghosts) {
          if (ghost.state !== 'FRIGHTENED' && ghost.state !== 'EATEN') {
            ghost.state = 'CHASE';
          }
        }
      }
    } else {
      this.chaseTimer -= dt;
      if (this.chaseTimer <= 0) {
        this.modeState = 'SCATTER';
        this.scatterTimer = diffConfig.scatterDuration;
        // Switch ghosts to scatter
        for (const ghost of this.ghosts) {
          if (ghost.state !== 'FRIGHTENED' && ghost.state !== 'EATEN') {
            ghost.state = 'SCATTER';
          }
        }
      }
    }
  }

  /** Reset ghost chase/scatter timers at start of level. */
  _resetGhostTimers() {
    const diffConfig = DIFFICULTY_CONFIG[this.difficulty];
    this.modeState = 'SCATTER';
    this.scatterTimer = diffConfig.scatterDuration;
    this.chaseTimer = diffConfig.chaseDuration;
  }

  // ════════════════════════════════════════════════════════════════════════
  // Movement & collisions
  // ════════════════════════════════════════════════════════════════════════

  /** Process direction input from InputHandler. */
  _handleDirectionInput() {
    const dirStr = this.input.getCurrentDirection();
    if (dirStr && this.pacman) {
      const pacmanDir = STRING_TO_PACMAN[dirStr];
      if (pacmanDir) {
        this.pacman.setDirection(pacmanDir);
      }
    }
  }

  /** Move all ghosts for this frame. */
  _moveGhosts(dt, diffConfig) {
    const baseSpeed = GHOST_BASE_SPEED * diffConfig.ghostSpeedMultiplier;

    for (let i = 0; i < this.ghosts.length; i++) {
      const ghost = this.ghosts[i];
      const blinky = this.ghosts[0]; // First ghost is always Blinky

      // Determine speed based on ghost state
      let speedMultiplier = diffConfig.ghostSpeedMultiplier;
      let state = this.modeState;

      if (ghost.state === 'FRIGHTENED') {
        speedMultiplier = FRIGHTENED_GHOST_SPEED_MULT;
      } else if (ghost.state === 'EATEN') {
        speedMultiplier = EATEN_GHOST_SPEED_MULT;
        state = 'EATEN';
      }

      // Level-based speed increase
      const levelSpeedBoost = 1 + (this.level - 1) * 0.05;

      const ghostSpeed = baseSpeed * speedMultiplier * levelSpeedBoost * dt;

      // Build pacman proxy for ghost AI
      const pacmanProxy = {
        gridX: this.pacman.gridX,
        gridY: this.pacman.gridY,
        direction: this._pacmanDirToGhostDir(this.pacman.direction),
      };

      ghost.move(
        { MAZE_WIDTH, MAZE_HEIGHT, getCell, isWalkable },
        pacmanProxy,
        blinky,
        ghostSpeed,
        this.level
      );

      // Apply current mode if not frightened/eaten
      if (ghost.state === 'CHASE' || ghost.state === 'SCATTER') {
        ghost.state = state;
      }
    }
  }

  /** Convert Pacman direction {dx, dy} to ghost direction string. */
  _pacmanDirToGhostDir(dir) {
    if (!dir) return 'RIGHT';
    if (dir.dx === 0 && dir.dy === -1) return 'UP';
    if (dir.dx === 0 && dir.dy === 1) return 'DOWN';
    if (dir.dx === -1 && dir.dy === 0) return 'LEFT';
    return 'RIGHT';
  }

  /** Check if Pacman collides with any ghost. */
  _checkGhostCollisions() {
    if (!this.pacman || this.pacman.isDying) return;

    for (const ghost of this.ghosts) {
      if (ghost.isInHouse()) continue;

      const collides = this.pacman.collidesWithGhost(
        ghost.pixelX,
        ghost.pixelY,
        this.cellSize * 0.7
      );

      // Near-miss screen shake: ghost within 2 cells but not colliding
      if (!collides && this._getScreenShake()) {
        const nearMiss = this.pacman.collidesWithGhost(
          ghost.pixelX,
          ghost.pixelY,
          this.cellSize * 2.0
        );
        if (nearMiss && (ghost.state === 'CHASE' || ghost.state === 'SCATTER')) {
          this._shakeIntensity = Math.max(this._shakeIntensity, 0.3);
        }
      }

      if (!collides) continue;

      if (ghost.state === 'FRIGHTENED') {
        // Eat the ghost
        this._eatGhost(ghost);
      } else if (ghost.state === 'CHASE' || ghost.state === 'SCATTER') {
        // Pacman dies
        this._pacmanDies();
        if (this._getScreenShake()) {
          this._shakeIntensity = 1.0;
        }
        return;
      }
      // Eaten ghosts (eyes) don't hurt Pacman
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Gameplay actions
  // ════════════════════════════════════════════════════════════════════════

  /** Pacman eats a regular dot. */
  _eatDot() {
    this.score += DOT_POINTS;
    this.dotsEaten++;
    this.totalDotsEaten++;
    this._removeDotAtPosition();
    this.audio.playDotEat();

    // Announce score to screen readers
    this._announcePolite(`Score ${this.score}`);

    // Check fruit spawn
    this._checkFruitSpawn();

    // Check achievements
    if (this.totalDotsEaten >= 1000) this._checkAchievement('dot_master');
    if (this.score >= 10000) this._checkAchievement('high_score_10000');
  }

  /** Pacman eats a power pellet. */
  _eatPowerPellet() {
    this.score += POWER_PELLET_POINTS;
    this.dotsEaten++;
    this.totalDotsEaten++;
    this._removeDotAtPosition();
    this.audio.playPowerPellet();

    // Announce power pellet to screen readers
    this._announcePolite(`Power pellet! Score ${this.score}. Ghosts are vulnerable.`);

    // Make ghosts frightened
    const diffConfig = DIFFICULTY_CONFIG[this.difficulty];
    this.frightenedTimer = diffConfig.frightenedDuration;
    this.ghostEatCombo = 0;

    for (const ghost of this.ghosts) {
      if (ghost.state !== 'EATEN' && !ghost.isInHouse()) {
        ghost.setFrightened();
      }
    }

    // Screen flash (skip if reduced flash enabled)
    if (!this._getReducedFlash()) {
      this.ui.addFlash('#2121DE', 0.3);
    }

    // Visual audio feedback
    this.ui.addVisualAudio('🔊 POWER PELLET');

    // Check fruit spawn
    this._checkFruitSpawn();

    // Check achievements
    if (this.totalDotsEaten >= 1000) this._checkAchievement('dot_master');
    if (this.score >= 10000) this._checkAchievement('high_score_10000');
  }

  /** Pacman eats a frightened ghost. */
  _eatGhost(ghost) {
    ghost.setEaten();
    this.ghostEatCombo++;

    const points = GHOST_EAT_BASE_POINTS * Math.pow(2, this.ghostEatCombo - 1);
    this.score += points;
    this.totalGhostsEaten = (this.totalGhostsEaten || 0) + 1;

    this.audio.playGhostEat();

    // Visual audio feedback
    this.ui.addVisualAudio('🔊 GHOST EATEN');

    // Announce ghost eaten to screen readers
    this._announcePolite(`Ghost eaten! ${points} points. Score ${this.score}`);

    // Score popup at ghost position
    this.ui.addScorePopup(
      String(points),
      ghost.pixelX + this.offsetX,
      ghost.pixelY + this.offsetY
    );

    // Combo display
    if (this.ghostEatCombo > 1) {
      this.ui.addComboDisplay(
        this.ghostEatCombo * 100,
        ghost.pixelX + this.offsetX,
        ghost.pixelY + this.offsetY
      );
    }

    // Check achievements
    this._checkAchievement('first_blood');
    if (this.totalGhostsEaten >= 50) this._checkAchievement('ghost_hunter');
    if (this.ghostEatCombo >= 4) this._checkAchievement('combo_master');
  }

  /** Pacman dies — lose a life. */
  _pacmanDies() {
    this.pacman.isDying = true;
    this.pacman.deathProgress = 0;
    this.audio.playDeath();
    this.ui.addVisualAudio('🔊 LIFE LOST');
  }

  /** Handle completion of death animation. */
  _handleDeathComplete() {
    if (this.practiceMode) {
      // Practice mode — unlimited lives, just reset
      this._announceAssertive('Pacman died. Practice mode — resetting position.');
      this.pacman.resetPosition(PACMAN_START.x, PACMAN_START.y);
      this._resetGhostPositions();
      return;
    }

    this.lives--;
    this.ui.setLives(this.lives);

    if (this.lives <= 0) {
      // Game over
      this._gameOver();
    } else {
      // Announce life lost to screen readers
      this._announceAssertive(`Life lost. ${this.lives} lives remaining.`);
      // Reset positions and restart countdown
      this.pacman.resetPosition(PACMAN_START.x, PACMAN_START.y);
      this._resetGhostPositions();
      this._startCountdown();
    }
  }

  /** Handle game over. */
  _gameOver() {
    this.gameState = 'GAME_OVER';
    this.audio.stopMusic();
    this.audio.playGameOverMusic();

    // Save high score
    this.persistence.saveHighScore(this.score, this.level);

    // Update stats
    this.persistence.addScoreToStats(this.score);
    this.persistence.incrementStat('totalGames', 1);
    if (this.totalGhostsEaten) {
      this.persistence.incrementStat('totalGhostsEaten', this.totalGhostsEaten);
    }
    if (this.totalDotsEaten) {
      this.persistence.incrementStat('totalDotsEaten', this.totalDotsEaten);
    }

    // Update UI
    const stats = this.persistence.loadStats();
    this.ui.setHighScore(stats.highScore);
    this.ui.setScore(this.score);
    this.ui.setScreen(SCREENS.GAME_OVER);

    // Announce game over to screen readers
    this._announceAssertive(`Game over. Final score ${this.score}. Level ${this.level}. Press Enter to restart or return to main menu.`);

    // Load high scores for display
    const highScores = this.persistence.getHighScores();
    this.ui.setHighScores(highScores);
  }

  /** Check if all dots are eaten. */
  _checkLevelComplete() {
    if (!this.mazeData) return;

    let dotsRemaining = 0;
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        const cell = this.mazeData[y][x];
        if (cell.type === CELL_TYPES.DOT || cell.type === CELL_TYPES.POWER_PELLET) {
          dotsRemaining++;
        }
      }
    }

    if (dotsRemaining === 0) {
      // Level complete!
      this._completeLevel();
    }
  }

  /** Level completed — show transition and prepare next level. */
  _completeLevel() {
    this.gameState = 'LEVEL_TRANSITION';
    this.levelTransitionTimer = 0;
    this.audio.playLevelComplete();

    // Visual audio feedback
    this.ui.addVisualAudio('🔊 LEVEL COMPLETE');

    // Announce level complete to screen readers
    this._announceAssertive(`Level ${this.level} complete! Score ${this.score}.`);

    // Update stats
    this.persistence.incrementStat('totalLevelsCompleted', 1);
    if (this.level > (this.persistence.loadStats().bestLevel || 1)) {
      this.persistence.updateStats({ bestLevel: this.level });
    }

    // Screen flash (skip if reduced flash enabled)
    if (!this._getReducedFlash()) {
      this.ui.addFlash('#FFFFFF', 0.5);
    }

    // Check level achievements
    if (this.level >= 5) this._checkAchievement('level_5');
    if (this.level >= 10) this._checkAchievement('level_10');
  }

  // ════════════════════════════════════════════════════════════════════════
  // Fruit management
  // ════════════════════════════════════════════════════════════════════════

  /** Check if fruit should spawn. */
  _checkFruitSpawn() {
    if (this.currentFruit) return; // Already have a fruit

    const fruit = this.fruitSpawner.checkSpawn(
      this.dotsEaten,
      this.level,
      this.cellSize
    );

    if (fruit) {
      this.currentFruit = fruit;
    }
  }

  /** Update fruit state. */
  _updateFruit(dt) {
    if (!this.currentFruit || !this.currentFruit.active) return;

    this.currentFruit.update(dt);

    // Check if fruit expired
    if (this.currentFruit.isExpired()) {
      this.currentFruit = null;
      this.fruitSpawner.clearFruit();
      return;
    }

    // Check if Pacman collected the fruit
    if (!this.currentFruit.isCollected() && this.pacman) {
      if (
        this.pacman.gridX === this.currentFruit.gridX &&
        this.pacman.gridY === this.currentFruit.gridY
      ) {
        this._collectFruit();
      }
    }
  }

  /** Pacman collects the bonus fruit. */
  _collectFruit() {
    if (!this.currentFruit) return;

    this.currentFruit.collect();
    this.score += this.currentFruit.type.points;
    this.totalFruitsCollected = (this.totalFruitsCollected || 0) + 1;
    this.audio.playFruitCollect();

    // Visual audio feedback
    this.ui.addVisualAudio('🔊 FRUIT');

    // Announce fruit collection to screen readers
    this._announcePolite(`${this.currentFruit.type.name} collected! ${this.currentFruit.type.points} points. Score ${this.score}`);

    // Score popup
    this.ui.addScorePopup(
      String(this.currentFruit.type.points),
      this.currentFruit.pixelX + this.offsetX,
      this.currentFruit.pixelY + this.offsetY
    );

    // Track stats
    this.persistence.incrementStat('totalFruitsCollected', 1);

    // Check achievements
    if (this.totalFruitsCollected >= 20) this._checkAchievement('fruit_lover');
    if (this.score >= 10000) this._checkAchievement('high_score_10000');

    // Clear after particles finish
    setTimeout(() => {
      if (this.currentFruit && !this.currentFruit.active) {
        this.currentFruit = null;
        this.fruitSpawner.clearFruit();
      }
    }, 600);
  }

  // ════════════════════════════════════════════════════════════════════════
  // Dot consumption in maze data
  // ════════════════════════════════════════════════════════════════════════

  /** Remove the dot from maze data at Pacman's current position. */
  _removeDotAtPosition() {
    if (!this.mazeData) return;
    const cell = this.mazeData[this.pacman.gridY]?.[this.pacman.gridX];
    if (cell) {
      if (cell.type === CELL_TYPES.DOT) {
        cell.type = CELL_TYPES.PATH;
      } else if (cell.type === CELL_TYPES.POWER_PELLET) {
        cell.type = CELL_TYPES.PATH;
      }
    }
  }

  // Override _eatDot and _eatPowerPellet to also remove from maze
  // We handle this by calling _removeDotAtPosition after eating

  // ════════════════════════════════════════════════════════════════════════
  // Level initialization
  // ════════════════════════════════════════════════════════════════════════

  /** Initialize a new level. */
  _initLevel() {
    // Reset maze data (fresh dots) — clone pristine layout each level
    if (!this._pristineMaze) {
      this._pristineMaze = cloneMazeGrid(getMazeData());
    }
    this.mazeData = cloneMazeGrid(this._pristineMaze);

    // Create/update Pacman
    if (!this.pacman) {
      this.pacman = new Pacman(PACMAN_START.x, PACMAN_START.y, this.cellSize);
    }
    this.pacman.cellSize = this.cellSize;
    this.pacman.lives = this.lives;
    this.pacman.resetPosition(PACMAN_START.x, PACMAN_START.y);

    // Create/update ghosts
    this._initGhosts();

    // Reset fruit spawner
    this.fruitSpawner = new FruitSpawner();
    this.currentFruit = null;

    // Reset counters
    this.dotsEaten = 0;
    this.ghostEatCombo = 0;
    this.frightenedTimer = 0;
    this.totalGhostsEaten = 0;

    // Update UI
    this.ui.setScore(this.score);
    this.ui.setLevel(this.level);
    this.ui.setLives(this.lives);
  }

  /** Initialize all four ghosts. */
  _initGhosts() {
    this.ghosts = [];

    for (const name of GHOST_NAMES) {
      const start = GHOST_STARTS[name];
      const corner = GHOST_TARGET_CORNERS[name];
      const color = GHOST_COLORS[name];

      const ghost = new Ghost(
        name,
        color,
        start.x,
        start.y,
        this.cellSize,
        corner
      );
      ghost.reset(start.x, start.y, start.inHouse);
      this.ghosts.push(ghost);
    }
  }

  /** Reset ghost positions after Pacman dies. */
  _resetGhostPositions() {
    for (let i = 0; i < this.ghosts.length; i++) {
      const name = GHOST_NAMES[i];
      const start = GHOST_STARTS[name];
      this.ghosts[i].reset(start.x, start.y, start.inHouse);
    }
    this.frightenedTimer = 0;
    this.ghostEatCombo = 0;
  }

  /** Start the 3-2-1 countdown. */
  _startCountdown() {
    this.gameState = 'COUNTDOWN';
    this.countdownValue = 3;
    this.countdownTimer = 0;
    this.ui.setCountdown(3);
    this.ui.setScreen(SCREENS.COUNTDOWN);
    this._announceAssertive(`Level ${this.level}. Get ready.`);
  }

  // ════════════════════════════════════════════════════════════════════════
  // Input handling
  // ════════════════════════════════════════════════════════════════════════

  /** Set up all input callbacks. */
  _setupInputCallbacks() {
    // Direction callback (for gameplay)
    this.input.onDirectionCallback((dir) => {
      // Initialize audio on first input
      this._ensureAudio();

      if (this.pacman && (this.gameState === 'PLAYING')) {
        const pacmanDir = STRING_TO_PACMAN[dir];
        if (pacmanDir) {
          this.pacman.setDirection(pacmanDir);
        }
      }
    });

    // Confirm callback (for menus)
    this.input.onConfirmCallback(() => {
      this._ensureAudio();
      this._handleConfirm();
    });

    // Pause callback
    this.input.onPauseCallback(() => {
      this._ensureAudio();
      if (this.gameState === 'PLAYING') {
        this.pause();
      } else if (this.gameState === 'PAUSED') {
        this.resume();
      }
    });

    // Mute callback
    this.input.onMuteCallback(() => {
      this._ensureAudio();
      this.audio.setMuted(!this.audio.isMuted());
      const settings = this.persistence.loadSettings();
      settings.muted = this.audio.isMuted();
      this.persistence.saveSettings(settings);
    });

    // Menu navigation callback
    this.input.onMenuNavigateCallback((direction) => {
      this._ensureAudio();
      this._handleMenuNavigate(direction);
    });
  }

  /** Ensure audio context is initialized (on first user gesture). */
  _ensureAudio() {
    if (!this._audioInitialized) {
      this.audio.init();
      this._audioInitialized = true;
    }
  }

  /** Handle confirm/enter press in various screens. */
  _handleConfirm() {
    switch (this.ui.screen) {
      case SCREENS.ATTRACT:
        this.audio.playMenuConfirm();
        this.audio.stopMusic();
        this.ui.setScreen(SCREENS.MAIN_MENU);
        this.audio.startMenuMusic();
        break;

      case SCREENS.MAIN_MENU: {
        this.audio.playMenuConfirm();
        const idx = this.ui.handleMenuSelect();
        const item = this.ui._menuItems[idx];
        switch (item) {
          case 'PLAY':
            this.ui.setScreen(SCREENS.DIFFICULTY_SELECT);
            break;
          case 'PRACTICE':
            this.audio.playMenuConfirm();
            this.practiceMode = true;
            this.difficulty = this.ui.getDifficulty() || 'medium';
            this.ui.setPracticeMode(true);
            this.restart();
            break;
          case 'HIGH SCORES':
            this._showHighScores();
            break;
          case 'ACHIEVEMENTS':
            this._showAchievements();
            break;
          case 'SETTINGS':
            this._showSettings();
            break;
          case 'TUTORIAL':
            this.ui.setScreen(SCREENS.TUTORIAL);
            break;
        }
        break;
      }

      case SCREENS.DIFFICULTY_SELECT: {
        this.audio.playMenuConfirm();
        const idx = this.ui.handleMenuSelect();
        this.difficulty = DIFFICULTIES[idx];
        this.ui.setDifficulty(this.difficulty);

        // Save difficulty preference
        const settings = this.persistence.loadSettings();
        settings.difficulty = this.difficulty;
        this.persistence.saveSettings(settings);

        // Start the game
        this.restart();
        break;
      }

      case SCREENS.PAUSE: {
        const idx = this.ui.handleMenuSelect();
        const item = this.ui._menuItems[idx];
        switch (item) {
          case 'RESUME':
            this.audio.playMenuConfirm();
            this.resume();
            break;
          case 'SETTINGS':
            this.audio.playMenuClick();
            this._showSettings();
            break;
          case 'QUIT':
            this.audio.playMenuConfirm();
            this.quitToMenu();
            break;
        }
        break;
      }

      case SCREENS.GAME_OVER: {
        this.audio.playMenuConfirm();
        const idx = this.ui.handleMenuSelect();
        const item = this.ui._menuItems[idx];
        switch (item) {
          case 'RESTART':
            this.audio.startMenuMusic();
            this.restart();
            break;
          case 'MAIN MENU':
            this.quitToMenu();
            break;
        }
        break;
      }

      case SCREENS.HIGH_SCORES:
      case SCREENS.TUTORIAL:
      case SCREENS.ACHIEVEMENTS:
        this.audio.playMenuClick();
        this.ui.setScreen(SCREENS.MAIN_MENU);
        break;

      case SCREENS.SETTINGS:
        this.audio.playMenuClick();
        this._handleSettingsBack();
        break;
    }
  }

  /** Handle menu navigation (up/down/select). */
  _handleMenuNavigate(direction) {
    if (direction === 'select') {
      this._handleConfirm();
      return;
    }

    this.audio.playMenuClick();
    this.ui.handleMenuNavigate(direction);
  }

  /** Show high scores screen. */
  _showHighScores() {
    const highScores = this.persistence.getHighScores();
    this.ui.setHighScores(highScores);
    this.ui.setScreen(SCREENS.HIGH_SCORES);
  }

  /** Show achievements screen. */
  _showAchievements() {
    const achievements = this.persistence.getAchievements(ACHIEVEMENTS);
    this.ui.setAchievements(achievements);
    this.ui.setScreen(SCREENS.ACHIEVEMENTS);
  }

  /** Show settings screen. */
  _showSettings() {
    const settings = this.persistence.loadSettings();
    this.ui.setSettings(settings);
    this.ui.setScreen(SCREENS.SETTINGS);
  }

  /** Handle back from settings. */
  _handleSettingsBack() {
    const changes = this.ui.getSettingsChanges();
    if (changes) {
      this._applySettingsChanges(changes);
    }
    // Return to previous screen
    if (this.gameState === 'PAUSED') {
      this.ui.setScreen(SCREENS.PAUSE);
    } else {
      this.ui.setScreen(SCREENS.MAIN_MENU);
    }
  }

  /** Apply settings changes from UI. */
  _applySettingsChanges(changes) {
    const settings = this.persistence.loadSettings();

    if (typeof changes.masterVolume === 'number') {
      settings.masterVolume = changes.masterVolume;
      this.audio.setMasterVolume(changes.masterVolume);
    }
    if (typeof changes.musicVolume === 'number') {
      settings.musicVolume = changes.musicVolume;
      this.audio.setMusicVolume(changes.musicVolume);
    }
    if (typeof changes.effectsVolume === 'number') {
      settings.effectsVolume = changes.effectsVolume;
      this.audio.setEffectsVolume(changes.effectsVolume);
    }
    if (typeof changes.muted === 'boolean') {
      settings.muted = changes.muted;
      this.audio.setMuted(changes.muted);
    }
    if (changes.controlBindings) {
      settings.controlBindings = changes.controlBindings;
      this.input.setControlBindings(changes.controlBindings);
    }

    this.persistence.saveSettings(settings);
  }

  // ════════════════════════════════════════════════════════════════════════
  // Settings & persistence
  // ════════════════════════════════════════════════════════════════════════

  /** Load saved settings from persistence. */
  _loadSettings() {
    const settings = this.persistence.loadSettings();

    // Apply audio settings
    this.audio.setMasterVolume(settings.masterVolume);
    this.audio.setMusicVolume(settings.musicVolume);
    this.audio.setEffectsVolume(settings.effectsVolume);
    this.audio.setMuted(settings.muted);

    // Apply control bindings
    if (settings.controlBindings) {
      this.input.setControlBindings(settings.controlBindings);
    }

    // Apply difficulty
    this.difficulty = settings.difficulty || 'medium';
    this.ui.setDifficulty(this.difficulty);

    // Load high score
    const stats = this.persistence.loadStats();
    this.ui.setHighScore(stats.highScore);

    // Enable touch controls if needed
    if (this.input.isTouchDevice()) {
      this.input.enableTouchControls();
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Canvas sizing
  // ════════════════════════════════════════════════════════════════════════

  /** Calculate and apply canvas size based on current window dimensions. */
  _resize() {
    const canvas = this.canvas;
    const dpr = window.devicePixelRatio || 1;

    // Get available space
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;

    // Calculate cell size to fit maze within available space
    // Leave room for HUD
    const hudHeight = 60;
    const availableWidth = maxWidth - 20;  // padding
    const availableHeight = maxHeight - hudHeight - 20;

    // Calculate cell size based on maze dimensions
    const cellByWidth = Math.floor(availableWidth / MAZE_WIDTH);
    const cellByHeight = Math.floor(availableHeight / MAZE_HEIGHT);
    this.cellSize = Math.min(cellByWidth, cellByHeight, 20); // cap at 20px

    // Calculate maze pixel dimensions
    const mazeWidth = MAZE_WIDTH * this.cellSize;
    const mazeHeight = MAZE_HEIGHT * this.cellSize;

    // Set canvas size (account for DPR)
    canvas.width = Math.min(mazeWidth + 20, maxWidth);
    canvas.height = Math.min(mazeHeight + hudHeight, maxHeight);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;

    // Calculate offset to center maze
    this.offsetX = (canvas.width - mazeWidth) / 2;
    this.offsetY = hudHeight;

    // Update entity cell sizes
    if (this.pacman) {
      this.pacman.cellSize = this.cellSize;
      this.pacman.pixelX = this.pacman.gridX * this.cellSize;
      this.pacman.pixelY = this.pacman.gridY * this.cellSize;
    }
    for (const ghost of this.ghosts) {
      ghost.cellSize = this.cellSize;
      ghost.pixelX = ghost.gridX * this.cellSize;
      ghost.pixelY = ghost.gridY * this.cellSize;
    }
    if (this.currentFruit) {
      this.currentFruit.cellSize = this.cellSize;
    }
  }

  /** Bind resize event listener. */
  _bindResize() {
    this._onResize = () => {
      this._resize();
    };
    window.addEventListener('resize', this._onResize);
  }

  // ════════════════════════════════════════════════════════════════════════
  // Cleanup
  // ════════════════════════════════════════════════════════════════════════

  /** Destroy the game and free resources. */
  destroy() {
    if (this._frameId) {
      cancelAnimationFrame(this._frameId);
      this._frameId = null;
    }
    window.removeEventListener('resize', this._onResize);
    this._reducedMotionMediaQuery.removeEventListener('change', this._onReducedMotionChange);
    this.input.destroy();
    this.audio.stopMusic();
  }
}
