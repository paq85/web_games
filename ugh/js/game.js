// Main game engine
const Game = {
  state: CONSTANTS.STATE.TITLE,
  prevState: null,
  mode: CONSTANTS.MODE.SINGLE,
  level: 1,
  score: 0,
  lives: CONSTANTS.LIVES,
  bestScore: 0,
  running: false,
  lastTime: 0,
  animFrameId: null,
  levelCompleteTimer: 0,
  scoreAccum: 0,

  // Multiplayer/hotseat
  currentPlayer: 1,
  playerScores: { 1: 0, 2: 0 },
  hotseatTurn: 1,

  // World
  terrain: [],
  scrollOffset: 0,

  // Score popups
  popups: [],

  init() {
    this.bestScore = SaveSystem.getBestScore();
    this.setupButtonHandlers();
  },

  setupButtonHandlers() {
    // All buttons with data-action attribute
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        AudioSystem.resume();
        AudioSystem.sfx.menuSelect();
        const action = btn.getAttribute('data-action');
        this.handleAction(action);
      });

      // Keyboard focus support
      btn.addEventListener('keydown', (e) => {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          AudioSystem.resume();
          AudioSystem.sfx.menuSelect();
          const action = btn.getAttribute('data-action');
          this.handleAction(action);
        }
      });
    });
  },

  handleAction(action) {
    switch (action) {
      case 'single':
        this.startGame(CONSTANTS.MODE.SINGLE, 1);
        break;
      case 'multi':
        this.startGame(CONSTANTS.MODE.MULTI, 1);
        break;
      case 'hotseat':
        this.startGame(CONSTANTS.MODE.HOTSEAT, 1);
        break;
      case 'loadcode':
        this.handleLoadCode();
        break;
      case 'resume':
        this.resume();
        break;
      case 'restart':
        this.restartLevel();
        break;
      case 'menu':
        this.goToMenu();
        break;
      case 'nextlevel':
        this.nextLevel();
        break;
      case 'replay':
        this.restartLevel();
        break;
      case 'retry':
        this.startGame(this.mode, this.level);
        break;
      case 'settings':
        this.showSettings();
        break;
      case 'settingsback':
        this.showTitle();
        break;
      case 'turnstart':
        this.startHotseatTurn();
        break;
    }
  },

  handleLoadCode() {
    const input = document.getElementById('level-code-input');
    const code = input.value.trim();
    const decoded = Utils.decodeLevelCode(code);

    if (decoded) {
      document.getElementById('level-code-error').textContent = '';
      AudioSystem.sfx.menuConfirm();
      this.startGame(this.mode, decoded.level);
    } else {
      document.getElementById('level-code-error').textContent = 'Invalid level code';
    }
  },

  // Start a new game
  startGame(mode, startLevel) {
    AudioSystem.sfx.menuConfirm();
    AudioSystem.resume();

    this.mode = mode;
    this.level = startLevel || 1;
    this.score = 0;
    this.lives = CONSTANTS.LIVES;
    this.currentPlayer = 1;
    this.playerScores = { 1: 0, 2: 0 };
    this.hotseatTurn = 1;

    if (this.mode === CONSTANTS.MODE.HOTSEAT) {
      this.showTurnScreen();
    } else {
      this.startLevel(this.level);
    }
  },

  // Start a specific level
  startLevel(levelNum) {
    this.level = levelNum;
    this.score = 0;
    this.scoreAccum = 0;
    this.lives = CONSTANTS.LIVES;

    const levelConfig = CONSTANTS.LEVELS[this.level - 1];
    if (!levelConfig) {
      this.showCampaignComplete();
      return;
    }

    // Initialize level
    Helicopter.init(100, CONSTANTS.HEIGHT / 2);
    this.terrain = Terrain.generate(levelConfig, CONSTANTS.WIDTH + 200);
    Entities.init(levelConfig);
    Particles.init();
    this.popups = [];
    this.scrollOffset = 0;

    // Show level intro
    UI.updateLevelIntro(levelConfig);
    UI.showOverlay('levelIntro');
    UI.hideHUD();
    UI.hideMobileControls();
    this.state = CONSTANTS.STATE.LEVEL_INTRO;

    AudioSystem.startMusic();

    // Auto-transition to gameplay after intro
    setTimeout(() => {
      if (this.state === CONSTANTS.STATE.LEVEL_INTRO) {
        this.beginPlay();
      }
    }, 2500);
  },

  // Begin active gameplay
  beginPlay() {
    this.state = CONSTANTS.STATE.PLAYING;
    UI.hideAllOverlays();
    UI.showHUD();
    UI.showMobileControls();
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  },

  // Main game loop
  gameLoop(timestamp) {
    if (!this.running) return;

    const dt = Math.min(timestamp - this.lastTime, 50); // Cap delta to avoid huge jumps
    this.lastTime = timestamp;

    if (this.state === CONSTANTS.STATE.PLAYING) {
      this.update(dt);
      this.render();
    }

    this.animFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  },

  // Update game state
  update(dt) {
    const levelConfig = CONSTANTS.LEVELS[this.level - 1];
    const scrollSpeed = CONSTANTS.WORLD.SCROLL_SPEED * levelConfig.speed;

    // Update helicopter
    Helicopter.update(dt, levelConfig.fuelRate);

    // Scroll terrain
    Terrain.scroll(this.terrain, scrollSpeed);
    this.scrollOffset += scrollSpeed;

    // Update entities
    Entities.update(dt, scrollSpeed, levelConfig, Helicopter);

    // Check passenger pickup
    Entities.checkPassengerPickup(Helicopter);

    // Check delivery
    this.score += Entities.checkDelivery(Helicopter);

    // Check hazard collisions
    const died = Entities.checkHazardCollisions(Helicopter);

    // Check collectibles
    this.score += Entities.checkCollectiblePickup(Helicopter);

    // Terrain collision
    if (Collision.checkTerrainCollision(Helicopter, this.terrain)) {
      const died2 = Helicopter.takeDamage(20);
      if (died2 || died) {
        this.handleHelicopterDeath();
        return;
      }
    }

    // Fuel empty
    if (Helicopter.fuel <= 0 && Helicopter.y > CONSTANTS.HEIGHT - 100) {
      this.handleHelicopterDeath();
      return;
    }

    // Survival score
    this.scoreAccum += dt * 0.01;
    if (this.scoreAccum >= 1) {
      this.score += CONSTANTS.SCORE.SURVIVAL;
      this.scoreAccum -= 1;
    }

    // Update particles
    Particles.update();

    // Exhaust particles
    if (Math.random() < 0.3 && Helicopter.fuel > 0) {
      Particles.emitExhaust(
        Helicopter.x + 16,
        Helicopter.y + Helicopter.height
      );
    }

    // Update popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].y -= 0.5;
      this.popups[i].life--;
      if (this.popups[i].life <= 0) {
        this.popups.splice(i, 1);
      }
    }

    // Update HUD
    UI.updateHUD(
      this.score,
      this.level,
      Helicopter.fuel,
      this.lives,
      Entities.deliveriesCompleted,
      Entities.totalDeliveries,
      Helicopter.health
    );

    UI.updatePassengerIndicator(Helicopter.carrying);

    // Update objective
    if (!Helicopter.carrying && Entities.passengers.length > 0) {
      UI.updateObjectiveIndicator('FIND A PASSENGER');
    } else if (Helicopter.carrying && Entities.destinations.length > 0) {
      UI.updateObjectiveIndicator('DELIVER TO DROP ZONE');
    } else if (Helicopter.carrying) {
      UI.updateObjectiveIndicator('WAITING FOR DROP ZONE...');
    } else {
      UI.updateObjectiveIndicator('');
    }

    // Check level complete
    if (Entities.isLevelComplete()) {
      this.handleLevelComplete();
    }

    // Fuel warning
    if (Helicopter.fuel < 20 && Helicopter.fuel > 0 && Math.random() < 0.01) {
      AudioSystem.sfx.fuelWarning();
    }
  },

  // Render frame
  render() {
    const levelConfig = CONSTANTS.LEVELS[this.level - 1];
    const ctx = Renderer.ctx;

    Renderer.clear();
    Renderer.drawSky(this.level);
    Renderer.drawClouds(CONSTANTS.WORLD.SCROLL_SPEED * levelConfig.speed);
    Renderer.drawTerrain(this.terrain, this.level);

    // Draw entities
    for (const p of Entities.passengers) {
      Renderer.drawPassenger(p);
    }
    for (const d of Entities.destinations) {
      Renderer.drawDestination(d);
    }
    for (const h of Entities.hazards) {
      Renderer.drawHazard(h);
    }
    for (const c of Entities.collectibles) {
      Renderer.drawCollectible(c);
    }

    // Draw helicopter
    Renderer.drawHelicopter(Helicopter);

    // Draw particles
    Particles.render(ctx);

    // Draw popups
    for (const popup of this.popups) {
      Renderer.drawScorePopup(popup.x, popup.y, popup.text);
    }
  },

  // Handle helicopter death
  handleHelicopterDeath() {
    Particles.emitExplosion(
      Helicopter.x + Helicopter.width / 2,
      Helicopter.y + Helicopter.height / 2
    );

    this.lives--;

    if (this.lives <= 0) {
      this.handleGameOver();
    } else {
      // Respawn
      setTimeout(() => {
        Helicopter.init(100, CONSTANTS.HEIGHT / 2);
        Helicopter.addFuel(30);
      }, 500);
    }
  },

  // Handle level complete
  handleLevelComplete() {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);

    this.score += CONSTANTS.SCORE.LEVEL_BONUS;
    AudioSystem.sfx.levelComplete();
    AudioSystem.stopMusic();

    const levelCode = Utils.generateLevelCode(this.level, this.score);

    // Save progress
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
    SaveSystem.saveProgress(this.level + 1, this.score, this.bestScore);

    // Update player score in multiplayer
    if (this.mode === CONSTANTS.MODE.MULTI) {
      this.playerScores[this.currentPlayer] = this.score;
    }

    UI.updateLevelComplete(this.score, Entities.deliveriesCompleted, levelCode);
    UI.hideHUD();
    UI.hideMobileControls();
    UI.showOverlay('levelComplete');
    this.state = CONSTANTS.STATE.LEVEL_COMPLETE;
  },

  // Handle game over
  handleGameOver() {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);

    AudioSystem.sfx.gameOver();
    AudioSystem.stopMusic();

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
    SaveSystem.saveProgress(this.level, this.score, this.bestScore);

    // Update player score
    if (this.mode === CONSTANTS.MODE.MULTI) {
      this.playerScores[this.currentPlayer] = this.score;
    }

    UI.updateGameOver(this.score, this.level, this.bestScore);
    UI.hideHUD();
    UI.hideMobileControls();
    UI.showOverlay('gameOver');
    this.state = CONSTANTS.STATE.GAME_OVER;
  },

  // Handle campaign complete
  showCampaignComplete() {
    AudioSystem.sfx.levelComplete();
    AudioSystem.stopMusic();

    UI.updateCampaignComplete(this.score);
    UI.hideHUD();
    UI.hideMobileControls();
    UI.showOverlay('campaignComplete');
    this.state = CONSTANTS.STATE.CAMPAIGN_COMPLETE;
  },

  // Next level
  nextLevel() {
    AudioSystem.sfx.menuConfirm();
    const nextLevel = this.level + 1;

    if (nextLevel > CONSTANTS.LEVELS.length) {
      if (this.mode === CONSTANTS.MODE.HOTSEAT) {
        this.nextHotseatTurn();
      } else {
        this.showCampaignComplete();
      }
      return;
    }

    if (this.mode === CONSTANTS.MODE.MULTI) {
      // Switch players in local multi
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    this.startLevel(nextLevel);
  },

  // Restart current level
  restartLevel() {
    AudioSystem.sfx.menuConfirm();
    this.startLevel(this.level);
  },

  // Pause game
  pause() {
    if (this.state !== CONSTANTS.STATE.PLAYING) return;

    this.running = false;
    cancelAnimationFrame(this.animFrameId);
    this.prevState = this.state;
    this.state = CONSTANTS.STATE.PAUSED;

    UI.showOverlay('pause');
    Input.paused = false; // Reset pause flag
  },

  // Resume game
  resume() {
    if (this.state !== CONSTANTS.STATE.PAUSED) return;

    AudioSystem.sfx.menuConfirm();
    UI.hideAllOverlays();
    UI.showHUD();
    UI.showMobileControls();
    this.state = CONSTANTS.STATE.PLAYING;
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  },

  // Go to main menu
  goToMenu() {
    AudioSystem.sfx.menuConfirm();
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
    AudioSystem.stopMusic();

    Input.reset();
    UI.hideHUD();
    UI.hideMobileControls();
    this.showTitle();
  },

  // Show title screen
  showTitle() {
    this.state = CONSTANTS.STATE.TITLE;
    UI.showOverlay('title');

    // Show level code section if there's saved progress
    const progress = SaveSystem.loadProgress();
    const codeSection = document.getElementById('level-code-section');
    if (progress) {
      codeSection.classList.add('active');
    } else {
      codeSection.classList.remove('active');
    }
  },

  // Show settings
  showSettings() {
    AudioSystem.sfx.menuSelect();
    this.state = CONSTANTS.STATE.SETTINGS;
    UI.showOverlay('settings');
  },

  // Show turn screen (hotseat)
  showTurnScreen() {
    this.state = CONSTANTS.STATE.TURN;
    UI.updateTurnScreen(this.hotseatTurn, this.playerScores[this.hotseatTurn] || 0,
      this.hotseatTurn === 1 ? 2 : 1);
    UI.showOverlay('turn');
  },

  // Start hotseat turn
  startHotseatTurn() {
    AudioSystem.sfx.menuConfirm();
    this.currentPlayer = this.hotseatTurn;
    this.startLevel(this.level);
  },

  // Next hotseat turn
  nextHotseatTurn() {
    this.hotseatTurn = this.hotseatTurn === 1 ? 2 : 1;

    if (this.hotseatTurn === 1 && this.level > CONSTANTS.LEVELS.length) {
      // Both players done
      this.showCampaignComplete();
      return;
    }

    this.level = Math.min(this.level, CONSTANTS.LEVELS.length);
    this.showTurnScreen();
  },

  // Stop game completely
  stop() {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
    AudioSystem.stopMusic();
    Input.reset();
  },
};
