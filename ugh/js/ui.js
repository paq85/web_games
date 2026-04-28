// UI management
const UI = {
  overlays: {},
  hud: null,

  init() {
    this.overlays = {
      title: document.getElementById('overlay-title'),
      pause: document.getElementById('overlay-pause'),
      levelIntro: document.getElementById('overlay-level-intro'),
      levelComplete: document.getElementById('overlay-level-complete'),
      gameOver: document.getElementById('overlay-gameover'),
      campaignComplete: document.getElementById('overlay-campaign-complete'),
      settings: document.getElementById('overlay-settings'),
      turn: document.getElementById('overlay-turn'),
    };

    this.hud = document.getElementById('hud');

    // Settings checkboxes
    const soundCheck = document.getElementById('settings-sound');
    const musicCheck = document.getElementById('settings-music');
    const motionCheck = document.getElementById('settings-reduced-motion');

    soundCheck.addEventListener('change', () => {
      AudioSystem.setSoundEnabled(soundCheck.checked);
      SaveSystem.saveSettings({ sound: soundCheck.checked });
    });

    musicCheck.addEventListener('change', () => {
      AudioSystem.setMusicEnabled(musicCheck.checked);
      SaveSystem.saveSettings({ music: musicCheck.checked });
    });

    motionCheck.addEventListener('change', () => {
      Particles.enabled = !motionCheck.checked;
      SaveSystem.saveSettings({ reducedMotion: motionCheck.checked });
    });

    // Level code input
    const codeInput = document.getElementById('level-code-input');
    const codeSection = document.getElementById('level-code-section');

    codeInput.addEventListener('keydown', (e) => {
      if (e.code === 'Enter') {
        e.preventDefault();
        const code = codeInput.value.trim();
        const decoded = Utils.decodeLevelCode(code);
        if (decoded) {
          document.getElementById('level-code-error').textContent = '';
          return decoded;
        } else {
          document.getElementById('level-code-error').textContent = 'Invalid level code';
        }
      }
    });

    // Load saved settings
    this.loadSettings();
  },

  loadSettings() {
    const settings = SaveSystem.loadSettings();
    if (settings) {
      const soundCheck = document.getElementById('settings-sound');
      const musicCheck = document.getElementById('settings-music');
      const motionCheck = document.getElementById('settings-reduced-motion');

      if (settings.sound !== undefined) soundCheck.checked = settings.sound;
      if (settings.music !== undefined) musicCheck.checked = settings.music;
      if (settings.reducedMotion !== undefined) motionCheck.checked = settings.reducedMotion;

      AudioSystem.setSoundEnabled(soundCheck.checked);
      AudioSystem.setMusicEnabled(musicCheck.checked);
      Particles.enabled = !motionCheck.checked;
    }
  },

  // Show a specific overlay, hide all others
  showOverlay(name) {
    for (const [key, el] of Object.entries(this.overlays)) {
      if (key === name) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    }
  },

  // Hide all overlays
  hideAllOverlays() {
    for (const el of Object.values(this.overlays)) {
      el.classList.remove('active');
    }
  },

  // Show/hide HUD
  showHUD() {
    this.hud.classList.add('active');
  },

  hideHUD() {
    this.hud.classList.remove('active');
  },

  // Update HUD values
  updateHUD(score, level, fuel, lives, deliveries, totalDeliveries, health) {
    document.getElementById('hud-score').textContent = score;
    document.getElementById('hud-level').textContent = level;
    document.getElementById('hud-lives').textContent = lives;
    document.getElementById('hud-deliveries').textContent = `${deliveries}/${totalDeliveries}`;

    // Fuel bar
    const fuelBar = document.getElementById('fuel-bar');
    const fuelPct = (fuel / CONSTANTS.HELI.MAX_FUEL) * 100;
    fuelBar.style.width = `${fuelPct}%`;
    if (fuelPct < 20) {
      fuelBar.style.background = '#ff4444';
      fuelBar.parentElement.previousElementSibling.classList.add('hud-warning');
    } else if (fuelPct < 50) {
      fuelBar.style.background = '#ffaa00';
      fuelBar.parentElement.previousElementSibling.classList.remove('hud-warning');
    } else {
      fuelBar.style.background = '#44ff44';
      fuelBar.parentElement.previousElementSibling.classList.remove('hud-warning');
    }

    // Health bar
    const healthBar = document.getElementById('health-bar');
    const healthPct = (health / CONSTANTS.HELI.MAX_HEALTH) * 100;
    healthBar.style.width = `${healthPct}%`;
  },

  // Update passenger indicator
  updatePassengerIndicator(carrying) {
    const el = document.getElementById('passenger-indicator');
    if (carrying) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  },

  // Update objective indicator
  updateObjectiveIndicator(text) {
    const el = document.getElementById('objective-indicator');
    if (text) {
      el.textContent = text;
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  },

  // Show/hide mobile controls
  showMobileControls() {
    if (Input.isMobile) {
      document.getElementById('mobile-controls').classList.add('active');
    }
  },

  hideMobileControls() {
    document.getElementById('mobile-controls').classList.remove('active');
  },

  // Update level intro screen
  updateLevelIntro(levelConfig) {
    document.getElementById('level-intro-title').textContent = `LEVEL ${levelConfig.id}`;
    document.getElementById('level-intro-desc').textContent = levelConfig.name;
    document.getElementById('level-intro-objective').textContent =
      `Deliver ${levelConfig.deliveries} passengers to their destinations.`;
    document.getElementById('level-intro-hint').textContent = levelConfig.hint;
  },

  // Update level complete screen
  updateLevelComplete(score, deliveries, levelCode) {
    document.getElementById('lc-score').textContent = score;
    document.getElementById('lc-deliveries').textContent = deliveries;
    document.getElementById('lc-code').textContent = levelCode;
  },

  // Update game over screen
  updateGameOver(score, level, bestScore) {
    document.getElementById('go-score').textContent = score;
    document.getElementById('go-level').textContent = level;
    document.getElementById('go-best').textContent = bestScore;
  },

  // Update campaign complete screen
  updateCampaignComplete(score) {
    document.getElementById('cc-score').textContent = score;
  },

  // Update turn screen (hotseat)
  updateTurnScreen(playerNum, score, nextPlayer) {
    document.getElementById('turn-player-label').textContent = `PLAYER ${playerNum}`;
    document.getElementById('turn-score').textContent = score;
    document.getElementById('turn-next-label').textContent = `Player ${nextPlayer}`;
  },
};
