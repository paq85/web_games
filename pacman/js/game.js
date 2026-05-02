// === Game Controller (Central FSM & Game Loop) ===
import {
  STATE, GHOST_STATE, TILE, DIR, SCORE, INITIAL_LIVES, MAX_LIVES,
  READY_TIME, DEATH_TIME, LEVEL_FLASH_TIME, LEVEL_FLASH_COUNT,
  ATTRACT_IDLE_TIME, TILE_SIZE, GHOST_RELEASE_DOTS, CANVAS_WIDTH, CANVAS_HEIGHT,
} from './constants.js';
import { Maze } from './maze.js';
import { Pacman } from './pacman.js';
import { Blinky, Pinky, Inky, Clyde } from './ghost.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { Scores } from './scores.js';
import { Levels } from './levels.js';
import { Fruits } from './fruits.js';
import { Particles } from './particles.js';
import { Settings } from './settings.js';
import { Accessibility } from './accessibility.js';
import { AttractMode } from './attract.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new Input();
    this.audio = new Audio();
    this.scores = new Scores();
    this.levels = new Levels();
    this.fruits = new Fruits();
    this.particles = new Particles();
    this.settings = new Settings();
    this.accessibility = new Accessibility();
    this.attract = new AttractMode();

    this.maze = new Maze();
    this.pacman = new Pacman();
    this.ghosts = [];

    this.state = STATE.MENU;
    this.score = 0;
    this.lives = INITIAL_LIVES;
    this.ghostsEatenCombo = 0;
    this.stateTimer = 0;
    this.modeTimer = 0;
    this.modeIndex = 0;
    this.idleTimer = 0;
    this.practiceMode = false;

    // Menu state
    this.menuIndex = 0;
    this.menuItems = ['Play', 'Practice', 'High Scores', 'Settings'];
    this.difficultyIndex = 1;
    this.settingsIndex = 0;

    // Score popup display
    this.scorePopups = [];

    // Level complete animation
    this.flashTimer = 0;
    this.flashOn = false;

    // Game stats for this session
    this.sessionStats = { ghostsEaten: 0, fruitsCollected: 0, dotsEaten: 0 };

    // Last timestamp
    this.lastTime = 0;
    this.running = false;

    // New high score flag
    this.isNewHighScore = false;
  }

  init() {
    this.input.init(this.canvas);
    this.accessibility.init();
    this._applySettings();
    this.renderer.resizeToFit();

    window.addEventListener('resize', () => this.renderer.resizeToFit());

    // Focus canvas
    this.accessibility.focusCanvas();
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this._loop();
  }

  stop() {
    this.running = false;
  }

  _loop() {
    if (!this.running) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // Cap at 50ms
    this.lastTime = now;

    this._update(dt);
    this._render();

    requestAnimationFrame(() => this._loop());
  }

  _update(dt) {
    // Handle mute toggle in any state
    if (this.input.consumeMute()) {
      this.audio.toggleMute();
      this.settings.set('muted', this.audio.muted);
    }

    switch (this.state) {
      case STATE.MENU:
        this._updateMenu(dt);
        break;
      case STATE.DIFFICULTY:
        this._updateDifficulty(dt);
        break;
      case STATE.READY:
        this._updateReady(dt);
        break;
      case STATE.PLAYING:
        this._updatePlaying(dt);
        break;
      case STATE.PAUSED:
        this._updatePaused(dt);
        break;
      case STATE.DYING:
        this._updateDying(dt);
        break;
      case STATE.LEVEL_COMPLETE:
        this._updateLevelComplete(dt);
        break;
      case STATE.GAME_OVER:
        this._updateGameOver(dt);
        break;
      case STATE.SETTINGS:
        this._updateSettings(dt);
        break;
      case STATE.SCORES:
        this._updateScores(dt);
        break;
      case STATE.ATTRACT:
        this._updateAttract(dt);
        break;
    }
  }

  _render() {
    this.renderer.beginFrame();

    switch (this.state) {
      case STATE.MENU:
        this.renderer.drawMenu(this.menuIndex, this.menuItems);
        break;
      case STATE.DIFFICULTY:
        this.renderer.drawDifficultySelect(this.difficultyIndex);
        break;
      case STATE.READY:
        this.renderer.clear();
        this.renderer.drawMaze(this.maze);
        this._renderEntities();
        this.renderer.drawHUD(this.score, this.scores.getHighScore(), this.lives, this.levels.currentLevel);
        this.renderer.drawReady();
        break;
      case STATE.PLAYING:
        this.renderer.clear();
        this.renderer.drawMaze(this.maze);
        this._renderEntities();
        this.renderer.drawHUD(this.score, this.scores.getHighScore(), this.lives, this.levels.currentLevel);
        this._renderPowerUpTimer();
        this.particles.draw(this.renderer.ctx);
        this._renderScorePopups();
        break;
      case STATE.PAUSED:
        this.renderer.clear();
        this.renderer.drawMaze(this.maze);
        this._renderEntities();
        this.renderer.drawHUD(this.score, this.scores.getHighScore(), this.lives, this.levels.currentLevel);
        this.renderer.drawPaused();
        break;
      case STATE.DYING:
        this.renderer.clear();
        this.renderer.drawMaze(this.maze);
        this.renderer.drawPacman(this.pacman);
        this.renderer.drawHUD(this.score, this.scores.getHighScore(), this.lives, this.levels.currentLevel);
        break;
      case STATE.LEVEL_COMPLETE:
        this.renderer.clear();
        this.renderer.drawMaze(this.maze);
        this.renderer.drawPacman(this.pacman);
        this.renderer.drawHUD(this.score, this.scores.getHighScore(), this.lives, this.levels.currentLevel);
        this.renderer.drawLevelComplete(this.flashOn);
        break;
      case STATE.GAME_OVER:
        this.renderer.clear();
        this.renderer.drawMaze(this.maze);
        this.renderer.drawHUD(this.score, this.scores.getHighScore(), this.lives, this.levels.currentLevel);
        this.renderer.drawGameOverScreen(this.score, this.scores.getHighScore(), this.isNewHighScore);
        break;
      case STATE.SETTINGS:
        this.renderer.drawSettings(
          this.settings.getAll(),
          this.settingsIndex,
          this.settings.getSettingsMenuItems()
        );
        break;
      case STATE.SCORES:
        this.renderer.drawHighScores(this.scores.getTopScores());
        break;
      case STATE.ATTRACT:
        this.renderer.clear();
        this.renderer.drawMaze(this.maze);
        this._renderEntities();
        this.renderer.drawHUD(this.score, this.scores.getHighScore(), this.lives, this.levels.currentLevel);
        break;
    }

    this.renderer.endFrame();
  }

  _renderEntities() {
    this.renderer.drawPacman(this.pacman);
    for (const ghost of this.ghosts) {
      this.renderer.drawGhost(ghost);
    }
    this.renderer.drawFruit(this.fruits.getDisplayData());
  }

  _renderPowerUpTimer() {
    // Show timer for frightened mode
    const frightenedGhost = this.ghosts.find(g => g.state === GHOST_STATE.FRIGHTENED);
    if (frightenedGhost) {
      const config = this.levels.getSpeedConfig();
      this.renderer.drawPowerUpTimer(frightenedGhost.frightenedTimer, config.frightenTime);
    }
  }

  _renderScorePopups() {
    const ctx = this.renderer.ctx;
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const popup = this.scorePopups[i];
      popup.timer -= 1 / 60;
      popup.y -= 0.5;
      if (popup.timer <= 0) {
        this.scorePopups.splice(i, 1);
      } else {
        ctx.globalAlpha = popup.timer;
        ctx.fillStyle = '#00FFFF';
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(popup.text, popup.x * TILE_SIZE + TILE_SIZE / 2, popup.y * TILE_SIZE);
        ctx.globalAlpha = 1;
      }
    }
  }

  // === State Updates ===

  _updateMenu(dt) {
    this.idleTimer += dt;

    if (this.input.consumeMenuUp()) {
      this.menuIndex = (this.menuIndex - 1 + this.menuItems.length) % this.menuItems.length;
      this.audio.playMenuNav();
      this.idleTimer = 0;
    }
    if (this.input.consumeMenuDown()) {
      this.menuIndex = (this.menuIndex + 1) % this.menuItems.length;
      this.audio.playMenuNav();
      this.idleTimer = 0;
    }
    if (this.input.consumeConfirm()) {
      this.audio.playMenuConfirm();
      this.idleTimer = 0;
      switch (this.menuIndex) {
        case 0: // Play
          this.practiceMode = false;
          this._setState(STATE.DIFFICULTY);
          break;
        case 1: // Practice
          this.practiceMode = true;
          this._setState(STATE.DIFFICULTY);
          break;
        case 2: // High Scores
          this._setState(STATE.SCORES);
          break;
        case 3: // Settings
          this.settingsIndex = 0;
          this._setState(STATE.SETTINGS);
          break;
      }
    }

    // Attract mode after idle
    if (this.idleTimer > ATTRACT_IDLE_TIME / 1000) {
      this._startAttract();
    }
  }

  _updateDifficulty(dt) {
    if (this.input.consumeMenuUp()) {
      this.difficultyIndex = (this.difficultyIndex - 1 + 3) % 3;
      this.audio.playMenuNav();
    }
    if (this.input.consumeMenuDown()) {
      this.difficultyIndex = (this.difficultyIndex + 1) % 3;
      this.audio.playMenuNav();
    }
    if (this.input.consumeConfirm()) {
      this.audio.playMenuConfirm();
      const diffs = ['EASY', 'MEDIUM', 'HARD'];
      this.levels.setDifficulty(diffs[this.difficultyIndex]);
      this.settings.set('difficulty', diffs[this.difficultyIndex]);
      this._startNewGame();
    }
    if (this.input.consumePause()) {
      this._setState(STATE.MENU);
    }
  }

  _updateReady(dt) {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this._setState(STATE.PLAYING);
      this.audio.startGameMusic();
    }
  }

  _updatePlaying(dt) {
    // Pause
    if (this.input.consumePause()) {
      this._setState(STATE.PAUSED);
      this.audio.playPause();
      this.audio.stopMusic();
      return;
    }

    // Input
    const dir = this.input.getDirection();
    if (dir) {
      this.pacman.queueDirection(dir);
    }

    // Update pacman
    this.pacman.update(dt, this.maze);

    // Update ghosts
    this._updateGhosts(dt);

    // Update mode timer (scatter/chase alternation)
    this._updateModeTimer(dt);

    // Check dot eating
    this._checkDotEating();

    // Check fruit
    this.fruits.update(dt, this.maze.dotsEaten, this.levels.getFruit());
    this._checkFruitCollision();

    // Check ghost collisions
    this._checkGhostCollisions();

    // Check ghost release
    this._checkGhostRelease();

    // Update particles
    this.particles.update(dt);

    // Update score popups
    // (handled in render)

    // Check level complete
    if (this.maze.isLevelComplete()) {
      this._onLevelComplete();
    }
  }

  _updatePaused(dt) {
    if (this.input.consumePause()) {
      this._setState(STATE.PLAYING);
      this.audio.playPause();
      this.audio.startGameMusic();
    }
  }

  _updateDying(dt) {
    this.stateTimer -= dt;
    this.pacman.deathFrame += 1;
    if (this.stateTimer <= 0) {
      if (this.lives <= 0) {
        this._onGameOver();
      } else {
        this._resetPositions();
        this.stateTimer = READY_TIME / 1000;
        this._setState(STATE.READY);
      }
    }
  }

  _updateLevelComplete(dt) {
    this.stateTimer -= dt;
    this.flashTimer -= dt;
    if (this.flashTimer <= 0) {
      this.flashOn = !this.flashOn;
      this.flashTimer = (LEVEL_FLASH_TIME / 1000) / (LEVEL_FLASH_COUNT * 2);
    }
    if (this.stateTimer <= 0) {
      this._nextLevel();
    }
  }

  _updateGameOver(dt) {
    if (this.input.consumeConfirm()) {
      this.practiceMode = false;
      this._startNewGame();
    }
    if (this.input.consumePause()) {
      this._setState(STATE.MENU);
      this.audio.stopMusic();
    }
  }

  _updateSettings(dt) {
    const items = this.settings.getSettingsMenuItems();
    if (this.input.consumeMenuUp()) {
      this.settingsIndex = (this.settingsIndex - 1 + items.length) % items.length;
      this.audio.playMenuNav();
    }
    if (this.input.consumeMenuDown()) {
      this.settingsIndex = (this.settingsIndex + 1) % items.length;
      this.audio.playMenuNav();
    }
    if (this.input.consumeMenuLeft()) {
      const item = items[this.settingsIndex];
      this.settings.adjustSetting(item.key, -1);
      this._applySettings();
    }
    if (this.input.consumeMenuRight()) {
      const item = items[this.settingsIndex];
      this.settings.adjustSetting(item.key, 1);
      this._applySettings();
    }
    if (this.input.consumePause()) {
      this._setState(STATE.MENU);
    }
  }

  _updateScores(dt) {
    if (this.input.consumePause() || this.input.consumeConfirm()) {
      this._setState(STATE.MENU);
    }
  }

  _updateAttract(dt) {
    // Any input exits attract mode
    if (this.input.consumeConfirm() || this.input.consumePause() ||
        this.input.consumeMenuUp() || this.input.consumeMenuDown()) {
      this.attract.stop();
      this._setState(STATE.MENU);
      return;
    }

    // AI controls pacman
    const dir = this.attract.update(dt, this.pacman, this.maze);
    if (dir) {
      this.pacman.queueDirection(dir);
    }

    this.pacman.update(dt, this.maze);
    this._updateGhosts(dt);
    this._checkDotEating();
  }

  // === Game Logic ===

  _startNewGame() {
    this.score = 0;
    this.lives = INITIAL_LIVES;
    this.levels.reset();
    this.sessionStats = { ghostsEaten: 0, fruitsCollected: 0, dotsEaten: 0 };
    this.isNewHighScore = false;
    this._startLevel();
  }

  _startLevel() {
    this.maze.reset();
    this.fruits.reset();
    this._initGhosts();
    this._resetPositions();
    this.ghostsEatenCombo = 0;
    this.modeIndex = 0;
    this.modeTimer = this.levels.getModeTimings()[0];
    this.scorePopups = [];
    this.particles.clear();
    this._applySpeedConfig();

    this.stateTimer = READY_TIME / 1000;
    this._setState(STATE.READY);
    this.accessibility.announceLevel(this.levels.currentLevel);
  }

  _initGhosts() {
    this.ghosts = [new Blinky(), new Pinky(), new Inky(), new Clyde()];
  }

  _resetPositions() {
    this.pacman.reset();
    const config = this.levels.getSpeedConfig();
    this.pacman.setSpeed(config.pacman);

    for (const ghost of this.ghosts) {
      ghost.reset();
      ghost.setSpeed(config.ghost);
    }
    // Blinky starts outside
    this.ghosts[0].state = GHOST_STATE.SCATTER;
    this.ghosts[0].released = true;
  }

  _applySpeedConfig() {
    const config = this.levels.getSpeedConfig();
    this.pacman.setSpeed(config.pacman);
    for (const ghost of this.ghosts) {
      ghost.setSpeed(config.ghost);
    }
  }

  _updateGhosts(dt) {
    const blinky = this.ghosts[0];
    for (const ghost of this.ghosts) {
      ghost.update(dt, this.maze, this.pacman, blinky);
    }
  }

  _updateModeTimer(dt) {
    // Only update when ghosts are in chase/scatter mode
    const timings = this.levels.getModeTimings();
    if (this.modeIndex >= timings.length) return;

    this.modeTimer -= dt;
    if (this.modeTimer <= 0) {
      this.modeIndex++;
      if (this.modeIndex < timings.length) {
        this.modeTimer = timings[this.modeIndex];
        // Switch all non-frightened/eaten ghosts
        const newMode = this.modeIndex % 2 === 0 ? GHOST_STATE.SCATTER : GHOST_STATE.CHASE;
        for (const ghost of this.ghosts) {
          if (ghost.state === GHOST_STATE.SCATTER || ghost.state === GHOST_STATE.CHASE) {
            ghost.setState(newMode);
          }
        }
      }
    }
  }

  _checkDotEating() {
    const tx = this.pacman.getTileX();
    const ty = this.pacman.getTileY();
    const eaten = this.maze.eatDot(tx, ty);

    if (eaten === TILE.DOT) {
      this.score += SCORE.DOT;
      this.sessionStats.dotsEaten++;
      this.audio.playDot();
      this.accessibility.announceScore(this.score);
      this._checkExtraLife();
    } else if (eaten === TILE.POWER_PELLET) {
      this.score += SCORE.POWER_PELLET;
      this.sessionStats.dotsEaten++;
      this.audio.playPowerPellet();
      this._activatePowerMode();
      this.accessibility.announceScore(this.score);
      this.accessibility.announcePowerUp();
      this._checkExtraLife();
    }
  }

  _activatePowerMode() {
    const config = this.levels.getSpeedConfig();
    this.ghostsEatenCombo = 0;
    for (const ghost of this.ghosts) {
      ghost.frighten(config.frightenTime);
      if (ghost.state === GHOST_STATE.FRIGHTENED) {
        ghost.setSpeed(config.ghostFright);
      }
    }
  }

  _checkGhostCollisions() {
    for (const ghost of this.ghosts) {
      if (ghost.state === GHOST_STATE.IN_HOUSE || ghost.state === GHOST_STATE.LEAVING_HOUSE) continue;
      if (ghost.state === GHOST_STATE.EATEN) continue;

      const dx = Math.abs(this.pacman.x - ghost.x);
      const dy = Math.abs(this.pacman.y - ghost.y);

      if (dx < 0.7 && dy < 0.7) {
        if (ghost.state === GHOST_STATE.FRIGHTENED) {
          this._eatGhost(ghost);
        } else {
          this._pacmanDies();
          return;
        }
      }
    }
  }

  _eatGhost(ghost) {
    ghost.eat();
    this.ghostsEatenCombo++;
    const points = SCORE.GHOST_BASE * Math.pow(2, this.ghostsEatenCombo - 1);
    this.score += points;
    this.sessionStats.ghostsEaten++;
    this.audio.playGhostEaten();
    this.accessibility.announceGhostEaten(points);

    // Score popup
    this.scorePopups.push({
      x: ghost.x, y: ghost.y,
      text: points.toString(),
      timer: 1.5,
    });

    // Particles
    this.particles.emit(
      ghost.x * TILE_SIZE + TILE_SIZE / 2,
      ghost.y * TILE_SIZE + TILE_SIZE / 2,
      ghost.color, 10
    );

    this.renderer.shake(3, 10);
    this._checkExtraLife();
  }

  _checkFruitCollision() {
    if (!this.fruits.isActive()) return;
    const dx = Math.abs(this.pacman.x - this.fruits.x);
    const dy = Math.abs(this.pacman.y - this.fruits.y);
    if (dx < 0.8 && dy < 0.8) {
      const points = this.fruits.collect();
      if (points > 0) {
        this.score += points;
        this.sessionStats.fruitsCollected++;
        this.audio.playFruit();
        this.accessibility.announceFruit(points);

        this.scorePopups.push({
          x: this.fruits.x, y: this.fruits.y,
          text: points.toString(),
          timer: 2.0,
        });

        this.particles.emit(
          this.fruits.x * TILE_SIZE + TILE_SIZE / 2,
          this.fruits.y * TILE_SIZE + TILE_SIZE / 2,
          this.fruits.color, 12
        );
        this._checkExtraLife();
      }
    }
  }

  _checkGhostRelease() {
    const thresholds = this.levels.getGhostReleaseDots();
    for (const ghost of this.ghosts) {
      if (ghost.state === GHOST_STATE.IN_HOUSE && !ghost.released) {
        const threshold = thresholds[ghost.name] || 0;
        if (this.maze.dotsEaten >= threshold) {
          ghost.release();
        }
      }
    }
  }

  _checkExtraLife() {
    const prevLives = this.lives;
    const scoreMilestone = Math.floor(this.score / SCORE.EXTRA_LIFE);
    const prevMilestone = Math.floor((this.score - SCORE.DOT) / SCORE.EXTRA_LIFE);
    if (scoreMilestone > prevMilestone && this.lives < MAX_LIVES) {
      this.lives++;
      this.audio.playExtraLife();
      this.accessibility.announceLives(this.lives);
    }
  }

  _pacmanDies() {
    this.pacman.die();
    this.lives--;
    this.audio.playDeath();
    this.audio.stopMusic();
    this.stateTimer = DEATH_TIME / 1000;
    this._setState(STATE.DYING);
    this.accessibility.announceLives(this.lives);

    if (this.practiceMode) {
      this.lives = Math.max(this.lives, 1); // Practice mode: always keep at least 1 life
    }
  }

  _onLevelComplete() {
    this.audio.playLevelComplete();
    this.audio.stopMusic();
    this.stateTimer = LEVEL_FLASH_TIME / 1000;
    this.flashTimer = (LEVEL_FLASH_TIME / 1000) / (LEVEL_FLASH_COUNT * 2);
    this.flashOn = false;
    this._setState(STATE.LEVEL_COMPLETE);
  }

  _nextLevel() {
    this.levels.advance();
    this._startLevel();
  }

  _onGameOver() {
    this.audio.stopMusic();
    this.audio.startGameOverMusic();
    this.isNewHighScore = this.scores.isHighScore(this.score);

    if (!this.practiceMode) {
      this.scores.addScore(this.score, this.levels.currentLevel);
      this.scores.updateStats({
        score: this.score,
        level: this.levels.currentLevel,
        ...this.sessionStats,
      });
    }

    this._setState(STATE.GAME_OVER);
    this.accessibility.announceGameOver(this.score);
  }

  _startAttract() {
    this.maze.reset();
    this._initGhosts();
    this._resetPositions();
    this._applySpeedConfig();
    this.attract.start();
    this.score = 0;
    this._setState(STATE.ATTRACT);
  }

  _setState(newState) {
    this.state = newState;
    this.idleTimer = 0;
  }

  _applySettings() {
    const s = this.settings.getAll();
    this.audio.loadSettings({
      masterVolume: s.masterVolume,
      musicVolume: s.musicVolume,
      sfxVolume: s.sfxVolume,
      muted: s.muted,
    });
    this.renderer.crtEnabled = s.crtOverlay;
    this.renderer.screenShakeEnabled = s.screenShake;
    this.particles.enabled = s.particles;

    if (s.reducedMotion || s.reducedFlash) {
      this.renderer.crtEnabled = false;
      this.renderer.screenShakeEnabled = false;
    }
  }

  // Public API for testing
  getState() { return this.state; }
  getScore() { return this.score; }
  getLives() { return this.lives; }
  getLevel() { return this.levels.currentLevel; }
}
