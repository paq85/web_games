class Game {
  static SCREENS = {
    SPLASH: 'splash-screen',
    MAIN_MENU: 'main-menu',
    MODE_SELECT: 'mode-select',
    PAUSE: 'pause-menu',
    GAME_OVER: 'game-over',
    WIN: 'win-screen',
    CHALLENGES: 'challenge-list',
    DAILY: 'daily-puzzle',
    SETTINGS: 'settings-screen',
    STATISTICS: 'statistics-screen',
    ACHIEVEMENTS: 'achievements-screen',
    INSTRUCTIONS: 'instructions-screen'
  };

  static MODES = {
    CLASSIC: 'classic',
    ENDLESS: 'endless',
    CHALLENGE: 'challenge',
    DAILY: 'daily'
  };

  constructor() {
    this.grid = null;
    this.score = 0;
    this.currentMode = null;
    this.currentScreen = null;
    this.gameState = 'splash';
    this.won = false;
    this.continuedAfterWin = false;
    this.isPaused = false;
    this.isAnimating = false;
    this.inputCooldown = false;
    this.cooldownMs = 50;
    this.activePowerUp = null;
    this.powerUpTarget = null;
    this.freezeActive = false;
    this.stabilizeActive = false;
    this.mutationPending = false;

    // Subsystems
    this.renderer = null;
    this.audio = null;
    this.persistence = null;
    this.progression = null;
    this.challenges = null;
    this.settings = null;
    this.combo = null;
    this.mutations = null;
    this.zones = null;
    this.powerUps = null;

    // Game session state
    this.sessionMerges = 0;
    this.sessionBestStreak = 0;
    this.sessionHighestTile = 0;
    this.sessionPowerUpsUsed = new Set();
    this.undoStates = [];
    this.maxUndoDepth = 2;
    this.consecutiveUndos = 0;
    this.level = 1;
    this.bombsDestroyed = 0;
    this.mutationsSurvived = 0;

    // Touch/mouse state
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._touchStartTime = 0;
    this._touchMoved = false;
    this._mouseDownX = 0;
    this._mouseDownY = 0;
    this._mouseDownTime = 0;

    // Daily puzzle
    this.dailyAttempts = 3;
    this.dailyTarget = 0;
    this.dailySeed = '';
  }

  init() {
    // Initialize subsystems
    this.persistence = new Persistence();
    this.settings = new Settings(this.persistence);
    this.progression = new Progression(this.persistence);
    this.challenges = new Challenges(this.persistence);
    this.audio = new AudioManager();
    this.combo = new ComboSystem();
    this.mutations = new Mutations();
    this.zones = new Zones();
    this.powerUps = new PowerUps();

    // Load persisted data
    this.persistence.load();
    this.level = this.progression.getLevelForScore(this.persistence.getStats().cumulativeScore || 0);

    // Setup canvas renderer
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas, {
      gridSize: 4,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });

    // Apply settings to audio
    this._applySettingsToAudio();

    // Build accessibility grid
    this._buildGridCells();

    // Bind one-time gesture listener to initialize audio on first user interaction
    this._bindAudioGesture();

    // Bind events
    this._bindEvents();

    // Start splash -> main menu flow
    this._showScreen(Game.SCREENS.SPLASH);
    setTimeout(() => {
      this._showScreen(Game.SCREENS.MAIN_MENU);
      this.gameState = 'menu';
      this.audio.playMenuMusic();
      this._focusMenu();
    }, 1800);

    // Start renderer loop
    this.renderer.start();
  }

  _applySettingsToAudio() {
    const s = this.settings.getAll();
    this.audio.masterVolume = (s.masterVolume || 80) / 100;
    this.audio.musicVolume = (s.musicVolume || 60) / 100;
    this.audio.sfxVolume = (s.sfxVolume || 80) / 100;
    this.audio.muted = s.muted || false;
    if (this.audio.masterGain) {
      this.audio.masterGain.gain.value = this.audio.muted ? 0 : this.audio.masterVolume;
    }
  }

  _buildGridCells() {
    const container = document.getElementById('grid-cells');
    container.innerHTML = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', 'Empty');
        cell.dataset.row = r;
        cell.dataset.col = c;
        container.appendChild(cell);
      }
    }
  }

  _bindEvents() {
    document.addEventListener('keydown', (e) => this._handleKey(e));
    document.addEventListener('click', (e) => this._handleClick(e));
    document.addEventListener('contextmenu', (e) => {
      if (this.gameState === 'playing') {
        e.preventDefault();
      }
    });
    document.addEventListener('touchstart', (e) => this._handleTouchStart(e), { passive: false });
    document.addEventListener('mousedown', (e) => this._handleMouseDown(e));
    document.addEventListener('mouseup', (e) => this._handleMouseUp(e));
    window.addEventListener('resize', () => {
      if (this.renderer) this.renderer.resize();
    });
    window.addEventListener('blur', () => {
      const s = this.settings.getAll();
      if (s.pauseOnFocusLoss && this.gameState === 'playing' && !this.isPaused) {
        this.pause();
      }
    });
    this._bindMenuActions();
    this._bindSettings();
    this._bindPowerUpSlots();
  }

  _bindAudioGesture() {
    const resume = () => {
      this.audio.initFromGesture();
      document.removeEventListener('click', resume);
      document.removeEventListener('keydown', resume);
      document.removeEventListener('touchstart', resume);
    };
    document.addEventListener('click', resume);
    document.addEventListener('keydown', resume);
    document.addEventListener('touchstart', resume, { once: true });
  }

  _bindMenuActions() {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.audio.menuConfirm();
        switch (action) {
          case 'play': this._showScreen(Game.SCREENS.MODE_SELECT); break;
          case 'challenges':
            this._showScreen(Game.SCREENS.CHALLENGES);
            this._populateChallenges();
            break;
          case 'daily':
            this._showScreen(Game.SCREENS.DAILY);
            this._populateDailyPuzzle();
            break;
          case 'statistics':
            this._showScreen(Game.SCREENS.STATISTICS);
            this._updateStatsScreen();
            break;
          case 'achievements':
            this._showScreen(Game.SCREENS.ACHIEVEMENTS);
            this._updateAchievementsScreen();
            break;
          case 'settings':
            this._showScreen(Game.SCREENS.SETTINGS);
            this._populateSettings();
            break;
          case 'instructions':
            this._showScreen(Game.SCREENS.INSTRUCTIONS);
            const instContent = document.querySelector('#instructions-screen .menu-content');
            if (instContent) instContent.scrollTop = 0;
            break;
          case 'pause': this.pause(); break;
          case 'resume': this.resume(); break;
          case 'restart': this.restart(); break;
          case 'menu': this.returnToMenu(); break;
          case 'retry': this.restart(); break;
          case 'continue': this.continueAfterWin(); break;
          case 'back': this._goBack(); break;
          case 'start-daily': this.startDaily(); break;
          case 'leaderboard': break;
        }
      });
    });

    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.menuConfirm();
        this.startGame(btn.dataset.mode);
      });
    });
  }

  _bindPowerUpSlots() {
    document.querySelectorAll('.powerup-slot').forEach(slot => {
      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.gameState !== 'playing' || this.isPaused) return;
        const type = slot.dataset.powerup;
        this.activatePowerUpSelection(type);
      });
      slot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          slot.click();
        }
      });
    });
  }

  _bindSettings() {
    const bindRange = (id, key) => {
      const el = document.getElementById(id);
      const valEl = document.getElementById(id + '-val');
      if (!el) return;
      el.addEventListener('input', () => {
        const val = parseInt(el.value);
        this.settings.set(key, val);
        if (valEl) valEl.textContent = val + '%';
        this._applySettingsToAudio();
        this.persistence.save();
      });
    };

    bindRange('master-volume', 'masterVolume');
    bindRange('music-volume', 'musicVolume');
    bindRange('sfx-volume', 'sfxVolume');

    const bindToggle = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', () => {
        const newVal = !this.settings.get(key);
        this.settings.set(key, newVal);
        el.setAttribute('aria-checked', newVal ? 'true' : 'false');
        this._applySettingsToAudio();
        this.persistence.save();
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    };

    bindToggle('mute-toggle', 'muted');
    bindToggle('shake-toggle', 'screenShake');
    bindToggle('flash-toggle', 'reducedFlash');
    bindToggle('numbers-toggle', 'showNumbers');
    bindToggle('pause-focus-toggle', 'pauseOnFocusLoss');

    const bindSelect = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        this.settings.set(key, el.value);
        this.persistence.save();
      });
    };

    bindSelect('particle-quality', 'particleQuality');
    bindSelect('glow-intensity', 'glowIntensity');
    bindSelect('tile-colors', 'tileColors');
    bindSelect('tile-probability', 'tileProbability');
    bindSelect('mutation-difficulty', 'mutationDifficulty');
    bindSelect('swipe-sensitivity', 'swipeSensitivity');

    const resetBtn = document.getElementById('reset-stats-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
          this.persistence.reset();
          this._announce('Statistics have been reset');
        }
      });
    }
  }

  _populateSettings() {
    const s = this.settings.getAll();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    const setToggle = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('aria-checked', val ? 'true' : 'false');
    };
    const setValWithLabel = (id, val) => {
      setVal(id, val);
      const valEl = document.getElementById(id + '-val');
      if (valEl) valEl.textContent = val + '%';
    };

    setValWithLabel('master-volume', s.masterVolume);
    setValWithLabel('music-volume', s.musicVolume);
    setValWithLabel('sfx-volume', s.sfxVolume);
    setToggle('mute-toggle', s.muted);
    setToggle('shake-toggle', s.screenShake);
    setToggle('flash-toggle', s.reducedFlash);
    setToggle('numbers-toggle', s.showNumbers);
    setToggle('pause-focus-toggle', s.pauseOnFocusLoss);
    setVal('particle-quality', s.particleQuality);
    setVal('glow-intensity', s.glowIntensity);
    setVal('tile-colors', s.tileColors);
    setVal('tile-probability', s.tileProbability);
    setVal('mutation-difficulty', s.mutationDifficulty);
    setVal('swipe-sensitivity', s.swipeSensitivity);
  }

  // --- Input handling ---

  _handleKey(e) {
    if (this.gameState === 'playing' && !this.isPaused && !this.isAnimating && !this.inputCooldown) {
      const keyMap = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right'
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        this._inputCooldown();
        this.makeMove(keyMap[e.key]);
        return;
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        this.togglePause();
        return;
      }

      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        this.usePowerUp('undo');
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        this.settings.set('muted', !this.settings.get('muted'));
        this._applySettingsToAudio();
        this.persistence.save();
        return;
      }
    }

    if (e.key === 'Escape' && this.currentScreen) {
      e.preventDefault();
      this._goBack();
    }
  }

  _handleClick(e) {
    if (this.gameState !== 'playing' || this.isPaused) return;

    // Handle grid cell clicks for power-up targeting
    const gridCell = e.target.closest('.grid-cell');
    if (gridCell && this.activePowerUp) {
      const row = parseInt(gridCell.dataset.row);
      const col = parseInt(gridCell.dataset.col);
      this._executePowerUpTarget(this.activePowerUp, row, col);
      return;
    }
  }

  _handleTouchStart(e) {
    if (this.gameState !== 'playing' || this.isPaused || this.isAnimating) return;
    if (e.target.closest('.powerup-slot') || e.target.closest('#pause-btn')) return;

    const touch = e.touches[0];
    this._touchStartX = touch.clientX;
    this._touchStartY = touch.clientY;
    this._touchStartTime = Date.now();
    this._touchMoved = false;

    const threshold = this._getSwipeThreshold();
    const onMove = (ev) => {
      const t = ev.touches[0];
      const dx = t.clientX - this._touchStartX;
      const dy = t.clientY - this._touchStartY;
      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        this._touchMoved = true;
        ev.preventDefault();
      }
    };
    const onEnd = (ev) => {
      if (!this._touchMoved) {
        // Tap - check for power-up targeting
        if (this.activePowerUp) {
          const t = ev.changedTouches[0];
          const el = document.elementFromPoint(t.clientX, t.clientY);
          const gridCell = el ? el.closest('.grid-cell') : null;
          if (gridCell) {
            const row = parseInt(gridCell.dataset.row);
            const col = parseInt(gridCell.dataset.col);
            this._executePowerUpTarget(this.activePowerUp, row, col);
          }
        }
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        return;
      }

      const t = ev.changedTouches[0];
      const dx = t.clientX - this._touchStartX;
      const dy = t.clientY - this._touchStartY;
      const elapsed = Date.now() - this._touchStartTime;

      if (elapsed < 300 && (Math.abs(dx) > threshold || Math.abs(dy) > threshold)) {
        this._inputCooldown();
        if (Math.abs(dx) > Math.abs(dy)) {
          this.makeMove(dx > 0 ? 'right' : 'left');
        } else {
          this.makeMove(dy > 0 ? 'down' : 'up');
        }
      }

      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  _handleMouseDown(e) {
    if (this.gameState !== 'playing' || this.isPaused || this.isAnimating) return;
    if (e.target.closest('.powerup-slot') || e.target.closest('#pause-btn')) return;
    if (e.button === 2) {
      e.preventDefault();
      this.togglePause();
      return;
    }
    if (e.button !== 0) return;
    this._mouseDownX = e.clientX;
    this._mouseDownY = e.clientY;
    this._mouseDownTime = Date.now();
  }

  _handleMouseUp(e) {
    if (this.gameState !== 'playing' || this.isPaused || this.isAnimating) return;
    const dx = e.clientX - this._mouseDownX;
    const dy = e.clientY - this._mouseDownY;
    const elapsed = Date.now() - this._mouseDownTime;
    const threshold = this._getSwipeThreshold();

    if (elapsed < 400 && (Math.abs(dx) > threshold || Math.abs(dy) > threshold)) {
      this._inputCooldown();
      if (Math.abs(dx) > Math.abs(dy)) {
        this.makeMove(dx > 0 ? 'right' : 'left');
      } else {
        this.makeMove(dy > 0 ? 'down' : 'up');
      }
    }
  }

  _getSwipeThreshold() {
    const s = this.settings.get('swipeSensitivity');
    switch (s) {
      case 'high': return 20;
      case 'low': return 50;
      default: return 30;
    }
  }

  _inputCooldown() {
    this.inputCooldown = true;
    setTimeout(() => { this.inputCooldown = false; }, this.cooldownMs);
  }

  // --- Game lifecycle ---

  startGame(mode) {
    this.currentMode = mode;
    this.grid = new Grid(4);
    this.score = 0;
    this.sessionMerges = 0;
    this.sessionBestStreak = 0;
    this.sessionHighestTile = 0;
    this.sessionPowerUpsUsed = new Set();
    this.won = false;
    this.continuedAfterWin = false;
    this.isPaused = false;
    this.undoStates = [];
    this.consecutiveUndos = 0;
    this.freezeActive = false;
    this.stabilizeActive = false;
    this.mutationPending = false;

    // Reset subsystems
    this.combo.reset();
    this.zones.reset();
    this.powerUps.reset();
    this.mutations.reset();

    // Spawn initial tiles
    this.grid.spawnInitialTiles(2);

    // Track game start
    const stats = this.persistence.getStats();
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    this.persistence.updateStats(stats);

    this.gameState = 'playing';

    // Setup renderer
    this._syncRenderer();
    this.renderer.setScore(0);
    this.renderer.setBestScore(stats.bestScore || 0);
    this.renderer.setLevel(this.level);

    // Hide overlays, show HUD
    this._hideAllOverlays();
    document.getElementById('hud').setAttribute('aria-hidden', 'false');
    document.getElementById('powerup-bar').setAttribute('aria-hidden', 'false');
    this._updateHUD();
    this._renderGrid();

    // Audio
    this.audio.stopMusic();
    this.audio.playGameplayMusic();
    this.audio.ensureInitialized();

    this._announce('Game started');
    this.persistence.save();
  }

  _syncRenderer() {
    if (!this.grid || !this.renderer) return;
    const tiles = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const t = this.grid.cells[r][c];
        if (t) {
          tiles.push({
            col: t.col,
            row: t.row,
            value: t.value,
            type: t.type === Tile.TYPES.NORMAL ? 'normal' : t.type,
            shieldMovesLeft: t.shieldMovesLeft || 0
          });
        }
      }
    }
    this.renderer.setTiles(tiles);
    this.renderer.setZones(this.zones.zones.map(z => ({
      type: z.type,
      cells: z.cells
    })));
  }

  // --- Core gameplay ---

  makeMove(direction) {
    if (this.gameState !== 'playing' || this.isPaused || this.isAnimating) return;

    // Save state for undo
    const prevState = this.grid.serialize();
    const prevScore = this.score;
    const prevStreak = this.combo.streak;
    const prevMerges = this.sessionMerges;

    // Slide
    const result = this.grid.slide(direction);
    if (!result.moved) return;

    this.audio.tileSlide();

    // Track undo
    this.undoStates.push({
      grid: prevState,
      score: prevScore,
      streak: prevStreak,
      merges: prevMerges
    });
    if (this.undoStates.length > 10) this.undoStates.shift();
    this.consecutiveUndos = 0;

    // Score and combo
    const streakMult = this.combo.getMultiplier();
    const mergeScore = result.score * streakMult;
    this.score += mergeScore;
    this.sessionMerges += result.merges;

    if (result.merges > 0) {
      this.combo.recordMerge(result.score);
    } else {
      this.combo.recordNoMerge();
    }

    if (this.combo.streak > this.sessionBestStreak) {
      this.sessionBestStreak = this.combo.streak;
    }

    // Audio for merges
    if (result.merges > 0) {
      const highest = this.grid.getHighestTile();
      this.audio.tileMerge(highest);
      if (this.combo.streak >= 3) {
        this.audio.comboMilestone(this.combo.streak);
      }
    }

    // Expire shields
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid.cells[r][c]) {
          this.grid.cells[r][c].tickShield();
        }
      }
    }

    // Spawn new tile (unless freeze active)
    if (!this.freezeActive) {
      const newTile = this.grid.spawnTile();
      if (newTile) {
        this.audio.tileSpawn();
      }
    } else {
      this.freezeActive = false;
    }

    // Earn power-ups
    this._earnPowerUps(result);

    // Update level
    const stats = this.persistence.getStats();
    stats.cumulativeScore = (stats.cumulativeScore || 0) + mergeScore;
    this.level = this.progression.getLevelForScore(stats.cumulativeScore);
    this.persistence.updateStats(stats);

    // Check achievements
    this._checkAchievements();

    // Grid zones tick
    this.zones.tickAllZones();

    // Apply zone effects
    this._applyZoneEffects();

    // Check for grid mutation
    this._checkMutation();

    // Update renderer
    this._syncRenderer();
    this.renderer.setScore(this.score);
    this.renderer.setStreak(this.combo.streak);
    this.renderer.setLevel(this.level);

    // Update HUD
    this._updateHUD();
    this._renderGrid();

    // Check win/lose
    const highest = this.grid.getHighestTile();
    if (highest > this.sessionHighestTile) this.sessionHighestTile = highest;

    if (highest >= 2048 && !this.won && !this.continuedAfterWin &&
        (this.currentMode === Game.MODES.CLASSIC || this.currentMode === Game.MODES.CHALLENGE)) {
      this.won = true;
      const st = this.persistence.getStats();
      st.wins = (st.wins || 0) + 1;
      this.persistence.updateStats(st);
      this.audio.winCelebration();
      setTimeout(() => this._showWinScreen(), 500);
    }

    if (!this.grid.hasMoves()) {
      this.audio.gameOver();
      setTimeout(() => this._showGameOver(), 500);
    }

    this.persistence.save();
  }

  _earnPowerUps(result) {
    const scoreThreshold = Math.floor(this.score / 500);
    const prevThreshold = Math.floor((this.score - result.score) / 500);
    if (scoreThreshold > prevThreshold) {
      this.powerUps.earn('undo');
    }
    if (this.combo.streak >= 3) {
      this.powerUps.earn('split');
    }
    if (this.bombsDestroyed > 0) {
      this.powerUps.earn('nuke');
    }
    const highest = this.grid.getHighestTile();
    if (highest >= 128) {
      this.powerUps.earn('freeze');
    }
  }

  _applyZoneEffects() {
    // Apply gravity wells
    const gravityZones = this.zones.zones.filter(z => z.type === 'gravity_well');
    if (gravityZones.length > 0) {
      this._applyGravityWells();
    }
  }

  _applyGravityWells() {
    // Simple gravity well implementation: pull tiles down in affected columns
    const gravityCols = new Set();
    for (const zone of this.zones.zones.filter(z => z.type === 'gravity_well')) {
      for (const cell of zone.cells) {
        gravityCols.add(cell.col);
      }
    }
    for (const col of gravityCols) {
      // Pull tiles down
      for (let r = 2; r < 4; r++) {
        if (!this.grid.cells[r][col] && this.grid.cells[r - 1][col]) {
          const tile = this.grid.cells[r - 1][col];
          // Check if can merge
          if (this.grid.cells[r][col] && tile.canMergeWith(this.grid.cells[r][col])) {
            // Merge handled by slide logic, skip for gravity
          } else if (!this.grid.cells[r][col]) {
            this.grid.cells[r][col] = tile;
            this.grid.cells[r - 1][col] = null;
            tile.row = r;
          }
        }
      }
    }
  }

  _checkMutation() {
    if (this.stabilizeActive) {
      this.stabilizeActive = false;
      return;
    }

    const mutationChance = this.progression.getMutationChance(this.level);
    if (Math.random() < mutationChance / 100) {
      this.mutationPending = true;
      this.mutations.warnMutation();
      this.audio.gridMutationWarning();
      this.renderer.triggerMutationFlash();
      this._announce('Warning: grid mutation incoming');

      setTimeout(() => {
        this._executeMutation();
      }, 500);
    }
  }

  _executeMutation() {
    if (!this.mutationPending) return;
    this.mutationPending = false;

    const prevState = this.grid.serialize();
    const mutationResult = this.mutations.executeMutation(this.grid.cells);

    if (mutationResult) {
      this.grid.cells = mutationResult.grid;
      const mutationType = mutationResult.type;
      this.mutationsSurvived++;
      this.powerUps.earn('stabilize');
      this._announce(`Grid mutation: ${mutationType}`);
    }

    // Safety check: if mutation causes game over, reverse it
    if (!this.grid.hasMoves()) {
      this.grid.restore(prevState);
      this.powerUps.earn('undo');
      this._announce('Mutation reversed - no valid moves');
    }

    this._syncRenderer();
    this._renderGrid();
  }

  // --- Power-ups ---

  activatePowerUpSelection(type) {
    if (this.powerUps.getCharges(type) <= 0) return;

    if (this.activePowerUp === type) {
      this.activePowerUp = null;
    } else {
      this.activePowerUp = type;
      this._announce(`${type} power-up selected - tap a tile to target`);
    }

    document.querySelectorAll('.powerup-slot').forEach(slot => {
      slot.classList.toggle('active', slot.dataset.powerup === this.activePowerUp);
    });
  }

  usePowerUp(type) {
    if (this.powerUps.getCharges(type) <= 0) return;

    switch (type) {
      case 'undo':
        this._useUndo();
        break;
      case 'freeze':
        this.powerUps.use('freeze');
        this.freezeActive = true;
        this.sessionPowerUpsUsed.add('freeze');
        this.audio.powerUpActivate();
        this._announce('Freeze activated - next move spawns no new tile');
        break;
      case 'stabilize':
        this.powerUps.use('stabilize');
        this.stabilizeActive = true;
        this.sessionPowerUpsUsed.add('stabilize');
        this.audio.powerUpActivate();
        this._announce('Stabilize activated - next mutation prevented');
        break;
      default:
        this.activatePowerUpSelection(type);
        return;
    }

    this._updatePowerUpBar();
    this.persistence.save();
  }

  _useUndo() {
    if (this.undoStates.length === 0) return;
    if (this.consecutiveUndos >= this.maxUndoDepth) return;
    if (this.powerUps.getCharges('undo') <= 0) return;

    this.powerUps.use('undo');
    this.consecutiveUndos++;
    this.sessionPowerUpsUsed.add('undo');
    this.audio.powerUpActivate();

    const state = this.undoStates.pop();
    this.grid.restore(state.grid);
    this.score = state.score;
    this.sessionMerges = state.merges;

    this._syncRenderer();
    this.renderer.setScore(this.score);
    this._updateHUD();
    this._renderGrid();
    this._announce('Move undone');
  }

  _executePowerUpTarget(type, row, col) {
    const tile = this.grid.cells[row] ? this.grid.cells[row][col] : null;
    if (!tile && type !== 'split') {
      this._announce('No tile at that position');
      this.activePowerUp = null;
      document.querySelectorAll('.powerup-slot').forEach(s => s.classList.remove('active'));
      return;
    }

    switch (type) {
      case 'split':
        this._useSplit(tile, row, col);
        break;
      case 'nuke':
        this._useNuke(tile.value);
        break;
      case 'swap':
        this._activateSwap(row, col);
        break;
    }

    this.activePowerUp = null;
    document.querySelectorAll('.powerup-slot').forEach(s => s.classList.remove('active'));
  }

  _useSplit(tile, row, col) {
    if (!tile || tile.value < 4) {
      this._announce('Cannot split this tile');
      return;
    }
    const halfValue = tile.value / 2;
    const directions = [
      { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
      { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
    ];
    for (const dir of directions) {
      const nr = row + dir.dr;
      const nc = col + dir.dc;
      if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4 && !this.grid.cells[nr][nc]) {
        this.grid.cells[row][col] = new Tile(halfValue, Tile.TYPES.NORMAL, row, col);
        this.grid.cells[nr][nc] = new Tile(halfValue, Tile.TYPES.NORMAL, nr, nc);
        this.powerUps.use('split');
        this.sessionPowerUpsUsed.add('split');
        this.audio.powerUpActivate();
        this._syncRenderer();
        this._updateHUD();
        this._renderGrid();
        this._announce('Tile split');
        return;
      }
    }
    this._announce('No adjacent empty cell for split');
  }

  _useNuke(value) {
    let destroyed = 0;
    let scoreGain = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const t = this.grid.cells[r][c];
        if (t && t.value === value && t.type === Tile.TYPES.NORMAL) {
          this.grid.cells[r][c] = null;
          destroyed++;
          scoreGain += value;
        }
      }
    }
    if (destroyed === 0) {
      this._announce('No matching tiles to destroy');
      return;
    }
    this.score += scoreGain;
    this.powerUps.use('nuke');
    this.sessionPowerUpsUsed.add('nuke');
    this.audio.bombExplosion();

    // Spawn new tiles in up to 3 empty cells
    const empty = this.grid.getEmptyCells();
    const count = Math.min(3, empty.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * empty.length);
      const pos = empty.splice(idx, 1)[0];
      this.grid.cells[pos.row][pos.col] = Tile.randomTile(pos.row, pos.col, this.level);
    }

    this._syncRenderer();
    this.renderer.setScore(this.score);
    this._updateHUD();
    this._renderGrid();
    this._announce(`${destroyed} tiles destroyed`);
  }

  _swapTarget1 = null;
  _activateSwap(row, col) {
    if (!this._swapTarget1) {
      this._swapTarget1 = { row, col };
      this._announce('First tile selected - tap second tile');
      // Re-activate for second tap
      this.activePowerUp = 'swap';
      document.querySelectorAll('.powerup-slot').forEach(s => {
        s.classList.toggle('active', s.dataset.powerup === 'swap');
      });
    } else {
      const t1 = this._swapTarget1;
      const tileA = this.grid.cells[t1.row][t1.col];
      const tileB = this.grid.cells[row][col];
      if (tileA && tileB) {
        this.grid.cells[t1.row][t1.col] = tileB;
        this.grid.cells[row][col] = tileA;
        if (tileA) { tileA.row = row; tileA.col = col; }
        if (tileB) { tileB.row = t1.row; tileB.col = t1.col; }
      }
      this._swapTarget1 = null;
      this.powerUps.use('swap');
      this.sessionPowerUpsUsed.add('swap');
      this.audio.powerUpActivate();
      this._syncRenderer();
      this._renderGrid();
      this._announce('Tiles swapped');
    }
  }

  // --- Game flow ---

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  pause() {
    this.isPaused = true;
    this._showScreen(Game.SCREENS.PAUSE);
    this._announce('Game paused');
  }

  resume() {
    this.isPaused = false;
    this._hideAllOverlays();
    this.audio.playGameplayMusic();
    this._announce('Game resumed');
  }

  restart() {
    this._hideAllOverlays();
    this.audio.stopMusic();
    this.startGame(this.currentMode);
  }

  returnToMenu() {
    this.gameState = 'menu';
    this.audio.stopMusic();
    this.audio.playMenuMusic();
    this._hideAllOverlays();
    document.getElementById('hud').setAttribute('aria-hidden', 'true');
    document.getElementById('powerup-bar').setAttribute('aria-hidden', 'true');
    this._showScreen(Game.SCREENS.MAIN_MENU);
    this._focusMenu();
  }

  continueAfterWin() {
    this.continuedAfterWin = true;
    this._hideAllOverlays();
    this._announce('Continuing after win');
  }

  startDaily() {
    const daily = this.challenges.getDailyPuzzle();
    if (!daily || daily.attemptsLeft <= 0) {
      this._announce('No attempts remaining today');
      return;
    }
    this.dailyAttempts = daily.attemptsLeft;
    this.dailyTarget = daily.target;
    this.dailySeed = daily.seed;
    this.dailyAttempts--;
    this.startGame(Game.MODES.DAILY);
  }

  _showGameOver() {
    this.gameState = 'gameover';
    this.audio.stopMusic();

    const stats = this.persistence.getStats();
    if (this.score > (stats.bestScore || 0)) stats.bestScore = this.score;
    if (this.currentMode === Game.MODES.CLASSIC && this.score > (stats.bestClassic || 0)) stats.bestClassic = this.score;
    if (this.currentMode === Game.MODES.ENDLESS && this.score > (stats.bestEndless || 0)) stats.bestEndless = this.score;
    if (this.sessionHighestTile > (stats.highestTile || 0)) stats.highestTile = this.sessionHighestTile;
    stats.totalMerges = (stats.totalMerges || 0) + this.sessionMerges;
    if (this.sessionBestStreak > (stats.bestStreak || 0)) stats.bestStreak = this.sessionBestStreak;
    stats.bombsDestroyed = (stats.bombsDestroyed || 0) + this.bombsDestroyed;
    stats.mutationsSurvived = (stats.mutationsSurvived || 0) + this.mutationsSurvived;
    this.persistence.updateStats(stats);

    document.getElementById('go-score').textContent = this.score;
    document.getElementById('go-highest').textContent = this.sessionHighestTile;
    document.getElementById('go-streak').textContent = this.sessionBestStreak;
    document.getElementById('go-merges').textContent = this.sessionMerges;

    this._showScreen(Game.SCREENS.GAME_OVER);
    this._announce('Game over. Final score: ' + this.score);
    this.persistence.save();
  }

  _showWinScreen() {
    document.getElementById('win-score').textContent = this.score;
    document.getElementById('win-highest').textContent = this.sessionHighestTile;
    document.getElementById('win-streak').textContent = this.sessionBestStreak;
    this._showScreen(Game.SCREENS.WIN);
    this._announce('Congratulations! You reached 2048!');
  }

  // --- HUD ---

  _updateHUD() {
    const stats = this.persistence.getStats();
    document.getElementById('score-value').textContent = this.score;
    document.getElementById('best-value').textContent = stats.bestScore || 0;
    document.getElementById('level-value').textContent = this.level;

    const streakEl = document.getElementById('streak-display');
    const streakVal = document.getElementById('streak-value');
    if (this.combo.streak >= 2) {
      streakEl.classList.add('active');
      const mult = this.combo.getMultiplier();
      streakVal.textContent = `${this.combo.streak}x STREAK (${mult}x)`;
    } else {
      streakEl.classList.remove('active');
      streakVal.textContent = '';
    }

    // Update renderer streak for audio intensity
    this.audio.setStreakIntensity(Math.min(1, this.combo.streak / 10));

    this._updatePowerUpBar();
  }

  _updatePowerUpBar() {
    document.querySelectorAll('.powerup-slot').forEach(slot => {
      const type = slot.dataset.powerup;
      const count = this.powerUps.getCharges(type);
      slot.querySelector('.powerup-count').textContent = count;
      slot.classList.toggle('disabled', count === 0);
      slot.setAttribute('aria-label', `${type} - ${count} charges`);
    });
  }

  // --- DOM Grid rendering (accessibility) ---

  _renderGrid() {
    if (!this.grid) return;
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      const tile = this.grid.cells[r] ? this.grid.cells[r][c] : null;

      if (tile) {
        const label = tile.type === Tile.TYPES.NORMAL
          ? `Tile value ${tile.value}`
          : `${tile.type} tile, value ${tile.value}`;
        cell.textContent = tile.value;
        cell.setAttribute('aria-label', label);
        cell.style.background = this._getTileColor(tile.value, tile.type);
        cell.style.color = this._getTileTextColor(tile.value);
        cell.style.textShadow = `0 0 8px ${this._getTileGlow(tile.value, tile.type)}`;
        cell.style.boxShadow = `0 0 6px ${this._getTileGlow(tile.value, tile.type)}`;
      } else {
        cell.textContent = '';
        cell.setAttribute('aria-label', 'Empty');
        cell.style.background = '';
        cell.style.color = '';
        cell.style.textShadow = '';
        cell.style.boxShadow = '';
      }
    });
  }

  _getTileColor(value, type) {
    if (type && type !== Tile.TYPES.NORMAL) {
      const specialColors = {
        wildcard: '#0d4f4f',
        bomb: '#4a0a0a',
        shield: '#0a3d1a',
        multiplier: '#4a3a0a',
        fusioncore: '#2a0a3a'
      };
      return specialColors[type] || '#1a1a2e';
    }
    const colors = {
      2: '#1a3a5c', 4: '#0d4f4f', 8: '#0a3d2e', 16: '#1a4a1a',
      32: '#3d4a0a', 64: '#4a3d0a', 128: '#4a2a0a', 256: '#4a1a0a',
      512: '#4a0a0a', 1024: '#3a0a2a', 2048: '#2a0a3a'
    };
    return colors[value] || '#1a0a3a';
  }

  _getTileTextColor(value) {
    return value >= 8 ? '#ffffff' : '#e8e8f0';
  }

  _getTileGlow(value, type) {
    if (type && type !== Tile.TYPES.NORMAL) {
      const glows = {
        wildcard: 'rgba(0,229,255,0.5)',
        bomb: 'rgba(255,23,68,0.5)',
        shield: 'rgba(105,240,174,0.5)',
        multiplier: 'rgba(255,215,64,0.5)',
        fusioncore: 'rgba(224,64,251,0.5)'
      };
      return glows[type] || 'rgba(255,255,255,0.3)';
    }
    const glows = {
      2: 'rgba(79,195,247,0.4)', 4: 'rgba(0,229,255,0.4)', 8: 'rgba(0,191,165,0.4)',
      16: 'rgba(105,240,174,0.4)', 32: 'rgba(178,255,89,0.4)', 64: 'rgba(238,255,65,0.4)',
      128: 'rgba(255,215,64,0.4)', 256: 'rgba(255,171,64,0.4)', 512: 'rgba(255,110,64,0.4)',
      1024: 'rgba(255,82,82,0.4)', 2048: 'rgba(255,23,68,0.6)'
    };
    return glows[value] || 'rgba(224,64,251,0.4)';
  }

  // --- Achievements ---

  _checkAchievements() {
    const highest = this.sessionHighestTile || this.grid.getHighestTile();
    const ach = this.persistence.getAchievements();

    const tileAchievements = [
      { key: 'first_fusion', target: 4 },
      { key: 'spark', target: 128 },
      { key: 'ignition', target: 512 },
      { key: 'plasma', target: 1024 },
      { key: 'fusion', target: 2048 },
      { key: 'singularity', target: 4096 },
      { key: 'starforge', target: 8192 }
    ];

    for (const ta of tileAchievements) {
      if (!ach[ta.key] || ach[ta.key].unlocked) continue;
      if (highest >= ta.target) {
        this.persistence.unlockAchievement(ta.key, highest, ta.target);
        this._showAchievementToast(ta.key);
        this.audio.achievementUnlocked();
      }
    }

    const comboAchievements = [
      { key: 'combo_starter', target: 3 },
      { key: 'chain_reaction', target: 5 },
      { key: 'unstoppable', target: 10 }
    ];

    for (const ca of comboAchievements) {
      if (!ach[ca.key] || ach[ca.key].unlocked) continue;
      if (this.sessionBestStreak >= ca.target) {
        this.persistence.unlockAchievement(ca.key, this.sessionBestStreak, ca.target);
        this._showAchievementToast(ca.key);
        this.audio.achievementUnlocked();
      }
    }

    if (ach['first_blood'] && !ach['first_blood'].unlocked && this.score >= 1000) {
      this.persistence.unlockAchievement('first_blood', this.score, 1000);
      this._showAchievementToast('first_blood');
      this.audio.achievementUnlocked();
    }

    if (this.sessionPowerUpsUsed.size >= 6 && ach['power_player'] && !ach['power_player'].unlocked) {
      this.persistence.unlockAchievement('power_player', 6, 6);
      this._showAchievementToast('power_player');
      this.audio.achievementUnlocked();
    }

    this.persistence.save();
  }

  _showAchievementToast(key) {
    const achDef = this.progression.getAchievementById(key);
    if (!achDef) return;
    const icons = {
      first_fusion: '🔥', spark: '✨', ignition: '🔥', plasma: '💫',
      fusion: '⚡', singularity: '🌀', starforge: '⭐',
      combo_starter: '🔗', chain_reaction: '💥', unstoppable: '🌟',
      first_blood: '🩸', power_player: '🎮', bomb_disposal: '💣',
      stabilizer: '⚓', daily_champion: '🏆', endless_runner: '🏃',
      challenge_master: '👑', perfectionist: '💎'
    };
    const toast = document.getElementById('achievement-toast');
    const notif = document.createElement('div');
    notif.className = 'achievement-notification';
    notif.innerHTML = `<div class="ach-title">${icons[key] || '🏆'} Achievement Unlocked</div><div class="ach-name">${achDef.name}</div>`;
    toast.appendChild(notif);
    this._announce(`Achievement unlocked: ${achDef.name}`);
    setTimeout(() => notif.remove(), 3000);
  }

  // --- Screens ---

  _showScreen(screenId) {
    this._hideAllOverlays();
    const el = document.getElementById(screenId);
    if (el) {
      el.classList.add('visible');
      this.currentScreen = screenId;
      this._focusMenu();
    }
  }

  _hideAllOverlays() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('visible'));
    this.currentScreen = null;
  }

  _goBack() {
    if (this.currentScreen === Game.SCREENS.SETTINGS ||
        this.currentScreen === Game.SCREENS.STATISTICS ||
        this.currentScreen === Game.SCREENS.ACHIEVEMENTS ||
        this.currentScreen === Game.SCREENS.CHALLENGES ||
        this.currentScreen === Game.SCREENS.DAILY ||
        this.currentScreen === Game.SCREENS.INSTRUCTIONS) {
      if (this.gameState === 'playing') {
        this.pause();
      } else {
        this.audio.stopMusic();
        this.audio.playMenuMusic();
        this._showScreen(Game.SCREENS.MAIN_MENU);
      }
    } else if (this.currentScreen === Game.SCREENS.MODE_SELECT) {
      this._showScreen(Game.SCREENS.MAIN_MENU);
    } else if (this.currentScreen === Game.SCREENS.PAUSE) {
      this.resume();
    }
  }

  _focusMenu() {
    setTimeout(() => {
      const visible = document.querySelector('.overlay.visible');
      if (visible) {
        const firstBtn = visible.querySelector('.menu-btn, .menu-back-btn, button, [role="menuitem"]');
        if (firstBtn) {
          firstBtn.setAttribute('tabindex', '0');
          firstBtn.focus();
        }
      }
    }, 150);
  }

  _updateStatsScreen() {
    const s = this.persistence.getStats();
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || 0;
    };
    setText('stat-games', s.gamesPlayed);
    setText('stat-wins', s.wins);
    setText('stat-best', s.bestScore);
    setText('stat-best-classic', s.bestClassic);
    setText('stat-best-endless', s.bestEndless);
    setText('stat-highest-tile', s.highestTile);
    setText('stat-merges', s.totalMerges);
    setText('stat-streak', s.bestStreak);
    setText('stat-bombs', s.bombsDestroyed);
    setText('stat-mutations', s.mutationsSurvived);
    setText('stat-challenges', s.challengesCompleted);
    setText('stat-daily', s.dailyCompleted);
    setText('stat-level', this.level);
  }

  _updateAchievementsScreen() {
    const list = document.getElementById('achievement-list');
    if (!list) return;
    list.innerHTML = '';
    const icons = {
      first_fusion: '🔥', spark: '✨', ignition: '🔥', plasma: '💫',
      fusion: '⚡', singularity: '🌀', starforge: '⭐',
      combo_starter: '🔗', chain_reaction: '💥', unstoppable: '🌟',
      first_blood: '🩸', power_player: '🎮', bomb_disposal: '💣',
      stabilizer: '⚓', daily_champion: '🏆', endless_runner: '🏃',
      challenge_master: '👑', perfectionist: '💎'
    };
    const achievements = this.progression.getUnlockedAchievements();
    for (const a of achievements) {
      const item = document.createElement('div');
      item.className = `achievement-item ${a.unlocked ? 'unlocked' : 'locked'}`;
      item.setAttribute('role', 'listitem');
      const progress = a.unlocked ? 'Unlocked' : `${a.progress || 0}/${a.target || '?'}`;
      item.innerHTML = `
        <div class="achievement-icon">${icons[a.id] || '🏆'}</div>
        <div class="achievement-details">
          <div class="achievement-name">${a.name}</div>
          <div class="achievement-desc">${a.description || ''}</div>
          <div class="achievement-progress">${progress}</div>
        </div>
      `;
      list.appendChild(item);
    }
  }

  _populateChallenges() {
    const container = document.getElementById('challenge-items');
    if (!container) return;
    container.innerHTML = '';
    const challenges = this.challenges.getAvailableChallenges();
    challenges.forEach(ch => {
      const item = document.createElement('div');
      item.className = `challenge-item ${ch.unlocked ? 'unlocked' : 'locked'}`;
      item.setAttribute('role', 'listitem');
      const stars = ch.stars || 0;
      item.innerHTML = `
        <div class="challenge-name">${ch.name}</div>
        <div class="challenge-desc">${ch.description || ''}</div>
        <div class="challenge-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
        <div class="challenge-info">${ch.moveLimit ? ch.moveLimit + ' moves' : ''} ${ch.targetScore ? '| Target: ' + ch.targetScore : ''}</div>
      `;
      if (ch.unlocked) {
        item.addEventListener('click', () => {
          this.audio.menuConfirm();
          this.startChallenge(ch.id);
        });
      }
      container.appendChild(item);
    });
  }

  _populateDailyPuzzle() {
    const daily = this.challenges.getDailyPuzzle();
    if (daily) {
      document.getElementById('daily-target-value').textContent = daily.target;
      document.getElementById('daily-attempts-value').textContent = daily.attemptsLeft;
    }
  }

  startChallenge(challengeId) {
    this._hideAllOverlays();
    this.startGame(Game.MODES.CHALLENGE);
    this.currentChallenge = challengeId;
  }

  // --- Accessibility ---

  _announce(message, priority = 'polite') {
    const el = document.getElementById(priority === 'assertive' ? 'sr-assertive' : 'sr-polite');
    if (!el) return;
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = message; });
  }
}
