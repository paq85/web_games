/**
 * Main entry point - initializes game, manages screens, runs game loop
 */

import { InputHandler } from './input.js';
import { Game, SCREEN } from './game.js';
import { Renderer } from './renderer.js';
import { AccessibilityManager } from './accessibility.js';
import { loadSettings, saveSettings, getMasterVolume, getMusicVolume, getSfxVolume } from './settings.js';
import { loadStats, saveStats, incrementStat, updateHighScore, updateTimedBest, updateBestLevel, formatPlayTime } from './stats.js';
import { initAudio, setVolumes, playSound, startMusic, stopMusic, resumeAudio } from './audio.js';

// ===== Canvas Setup =====
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 750;

function resizeCanvas() {
  const container = document.getElementById('game-container');
  const maxW = Math.min(window.innerWidth - 20, CANVAS_WIDTH);
  const maxH = Math.min(window.innerHeight - 20, CANVAS_HEIGHT);
  const scale = Math.min(maxW / CANVAS_WIDTH, maxH / CANVAS_HEIGHT);

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.style.width = `${CANVAS_WIDTH * scale}px`;
  canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
  container.style.width = `${CANVAS_WIDTH * scale}px`;
  container.style.height = `${CANVAS_HEIGHT * scale}px`;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===== Initialize Components =====
const input = new InputHandler(canvas);
const settings = loadSettings();
const stats = loadStats();
const a11y = new AccessibilityManager();
const renderer = new Renderer(canvas);
const game = new Game(canvas, input, settings, a11y);

// Apply settings to renderer
renderer.setTheme(settings.theme);
renderer.setGlowIntensity(settings.glowIntensity);
renderer.reducedFlash = settings.reducedFlash;
// Particles enabled will be set on game after creation
// Apply reduced motion
if (a11y.getReducedEffects()) {
  renderer.setGlowIntensity('low');
  renderer.reducedFlash = true;
  renderer.reducedFlash = true;
}

// Apply theme class
document.body.className = `theme-${settings.theme}`;

// ===== Audio =====
let audioInitialized = false;
function ensureAudio() {
  if (!audioInitialized) {
    initAudio();
    setVolumes(
      getMasterVolume(settings),
      getMusicVolume(settings),
      getSfxVolume(settings)
    );
    audioInitialized = true;
  }
  resumeAudio();
}

// ===== Overlay Management =====
const overlays = {
  'main-menu': document.getElementById('overlay-main-menu'),
  'paused': document.getElementById('overlay-pause'),
  'level-complete': document.getElementById('overlay-level-complete'),
  'game-over': document.getElementById('overlay-game-over'),
  'timed-results': document.getElementById('overlay-timed-results'),
  'settings': document.getElementById('overlay-settings'),
  'stats': document.getElementById('overlay-stats'),
  'countdown': document.getElementById('overlay-countdown'),
};

const hud = document.getElementById('hud');
const hudScore = document.getElementById('hud-score');
const hudLevel = document.getElementById('hud-level');
const hudLives = document.getElementById('hud-lives');
const hudTimer = document.getElementById('hud-timer');
const hudPowerups = document.getElementById('hud-powerups');
const countdownNumber = document.getElementById('countdown-number');

function showScreen(screenName) {
  for (const [name, el] of Object.entries(overlays)) {
    if (name === screenName) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  // Show/hide HUD
  if (screenName === SCREEN.PLAYING || screenName === SCREEN.COUNTDOWN || screenName === SCREEN.ATTRACT) {
    hud.classList.remove('hidden');
  } else {
    hud.classList.add('hidden');
  }
}

function updateHUD() {
  hudScore.textContent = `Score: ${game.scoreDisplay}`;
  hudLevel.textContent = `Level ${game.levelDisplay}`;
  hudLives.textContent = '♥'.repeat(Math.max(0, game.livesDisplay));

  if (game.isTimedMode) {
    hudTimer.classList.remove('hidden');
    hudTimer.querySelector('span').textContent = `Time: ${game.timedChallenge.timeDisplay}`;
  } else {
    hudTimer.classList.add('hidden');
  }

  // Active power-up indicators
  hudPowerups.innerHTML = '';
  for (const ap of game.activePowerUps) {
    if (!ap.active) continue;
    const config = Object.values(game.powerUps.length > 0 ? {} : {})[0];
    const puConfig = {
      paddle_extend: { color: '#00ff88', symbol: '↔' },
      multiball: { color: '#00ffff', symbol: '●' },
      laser: { color: '#ff4444', symbol: '↑' },
      slow_ball: { color: '#ffff00', symbol: '⏱' },
    }[ap.type];
    if (!puConfig) continue;

    const div = document.createElement('div');
    div.className = 'powerup-indicator';
    div.style.borderColor = puConfig.color;
    div.style.color = puConfig.color;
    div.innerHTML = `${puConfig.symbol}<div class="timer-bar" style="width:${ap.progress * 100}%"></div>`;
    hudPowerups.appendChild(div);
  }
}

function updateCountdownDisplay() {
  countdownNumber.textContent = game.countdownDisplay;
}

function updateLevelCompleteScreen() {
  document.getElementById('level-score').textContent = game.scoreDisplay;
  document.getElementById('level-bricks').textContent = game.bricksRemaining;
  document.getElementById('level-lives').textContent = game.livesDisplay;
}

function updateGameOverScreen() {
  document.getElementById('gameover-score').textContent = game.scoreDisplay;
  document.getElementById('gameover-highscore').textContent = game.highScore;
  document.getElementById('gameover-level').textContent = game.levelDisplay;
  document.getElementById('gameover-streak').textContent = stats.currentWinStreak || 0;
}

function updateTimedResultsScreen() {
  document.getElementById('timed-bricks').textContent = game.timedChallenge.bricksDestroyed;
  document.getElementById('timed-score').textContent = game.timedChallenge.score;
  document.getElementById('timed-best').textContent = stats.timedBestScore || 0;
}

function updateStatsScreen() {
  document.getElementById('stat-games').textContent = stats.totalGamesPlayed || 0;
  document.getElementById('stat-levels').textContent = stats.levelsCompleted || 0;
  document.getElementById('stat-bricks').textContent = stats.totalBricksDestroyed || 0;
  document.getElementById('stat-best-level').textContent = stats.bestLevelReached || 1;
  document.getElementById('stat-streak').textContent = stats.bestWinStreak || 0;
  document.getElementById('stat-highscore').textContent = stats.highScore || 0;
  document.getElementById('stat-timed-best').textContent = stats.timedBestScore || 0;
  document.getElementById('stat-playtime').textContent = formatPlayTime(stats.totalPlayTime || 0);
}

// ===== Settings UI =====
function populateSettingsUI() {
  document.getElementById('setting-master-volume').value = settings.masterVolume;
  document.getElementById('val-master-volume').textContent = `${settings.masterVolume}%`;
  document.getElementById('setting-music-volume').value = settings.musicVolume;
  document.getElementById('val-music-volume').textContent = `${settings.musicVolume}%`;
  document.getElementById('setting-sfx-volume').value = settings.sfxVolume;
  document.getElementById('val-sfx-volume').textContent = `${settings.sfxVolume}%`;
  document.getElementById('setting-mute').checked = settings.mute;
  document.getElementById('setting-paddle-size').value = settings.paddleSize;
  document.getElementById('setting-ball-speed').value = settings.ballSpeed;
  document.getElementById('setting-glow-intensity').value = settings.glowIntensity;
  document.getElementById('setting-particles').checked = settings.particles;
  document.getElementById('setting-reduced-flash').checked = settings.reducedFlash;
  document.getElementById('setting-pause-focus').checked = settings.pauseOnFocusLoss;
  document.getElementById('setting-theme').value = settings.theme;
}

function readSettingsFromUI() {
  settings.masterVolume = parseInt(document.getElementById('setting-master-volume').value);
  settings.musicVolume = parseInt(document.getElementById('setting-music-volume').value);
  settings.sfxVolume = parseInt(document.getElementById('setting-sfx-volume').value);
  settings.mute = document.getElementById('setting-mute').checked;
  settings.paddleSize = document.getElementById('setting-paddle-size').value;
  settings.ballSpeed = document.getElementById('setting-ball-speed').value;
  settings.glowIntensity = document.getElementById('setting-glow-intensity').value;
  settings.particles = document.getElementById('setting-particles').checked;
  settings.reducedFlash = document.getElementById('setting-reduced-flash').checked;
  settings.pauseOnFocusLoss = document.getElementById('setting-pause-focus').checked;
  settings.theme = document.getElementById('setting-theme').value;
}

// ===== Action Handlers =====
function handleAction(action) {
  ensureAudio();
  playSound('menu_confirm');

  switch (action) {
    case 'play':
      incrementStat(stats, 'totalGamesPlayed');
      game.startGame(false);
      startMusic('gameplay');
      break;

    case 'timed-challenge':
      incrementStat(stats, 'totalGamesPlayed');
      game.startGame(true);
      startMusic('gameplay');
      break;

    case 'settings':
      game.prevScreen = game.screen;
      game.screen = SCREEN.SETTINGS;
      populateSettingsUI();
      showScreen(SCREEN.SETTINGS);
      break;

    case 'stats':
      game.prevScreen = game.screen;
      game.screen = SCREEN.STATS;
      updateStatsScreen();
      showScreen(SCREEN.STATS);
      break;

    case 'resume':
      game.resume();
      showScreen(game.screen);
      break;

    case 'quit':
      stopMusic();
      game.screen = SCREEN.MAIN_MENU;
      showScreen(SCREEN.MAIN_MENU);
      break;

    case 'next-level':
      incrementStat(stats, 'levelsCompleted');
      incrementStat(stats, 'currentWinStreak');
      if (stats.currentWinStreak > (stats.bestWinStreak || 0)) {
        stats.bestWinStreak = stats.currentWinStreak;
      }
      if (game.level > (stats.bestLevelReached || 1)) {
        stats.bestLevelReached = game.level;
      }
      game.nextLevel();
      showScreen(SCREEN.COUNTDOWN);
      break;

    case 'restart':
      stats.currentWinStreak = 0;
      incrementStat(stats, 'totalGamesPlayed');
      game.startGame(game.isTimedMode);
      startMusic('gameplay');
      break;

    case 'save-settings':
      readSettingsFromUI();
      saveSettings(settings);

      // Apply settings
      renderer.setTheme(settings.theme);
      renderer.setGlowIntensity(settings.glowIntensity);
      renderer.reducedFlash = settings.reducedFlash;
      game.particles.enabled = settings.particles;
      document.body.className = `theme-${settings.theme}`;

      if (audioInitialized) {
        setVolumes(
          getMasterVolume(settings),
          getMusicVolume(settings),
          getSfxVolume(settings)
        );
      }

      // Return to previous screen
      if (game.prevScreen === SCREEN.PAUSED) {
        game.screen = SCREEN.PAUSED;
        showScreen(SCREEN.PAUSED);
      } else {
        game.screen = SCREEN.MAIN_MENU;
        showScreen(SCREEN.MAIN_MENU);
      }
      break;
  }
}

// ===== Button Event Listeners =====
document.querySelectorAll('.neon-btn[data-action]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    handleAction(btn.dataset.action);
  });
});

// ===== Settings slider live updates =====
document.getElementById('setting-master-volume').addEventListener('input', (e) => {
  document.getElementById('val-master-volume').textContent = `${e.target.value}%`;
});
document.getElementById('setting-music-volume').addEventListener('input', (e) => {
  document.getElementById('val-music-volume').textContent = `${e.target.value}%`;
});
document.getElementById('setting-sfx-volume').addEventListener('input', (e) => {
  document.getElementById('val-sfx-volume').textContent = `${e.target.value}%`;
});

// ===== Keyboard menu navigation =====
let menuFocusIndex = 0;
function handleMenuKeyboard() {
  if (game.screen === SCREEN.MAIN_MENU || game.screen === SCREEN.PAUSED ||
      game.screen === SCREEN.LEVEL_COMPLETE || game.screen === SCREEN.GAME_OVER ||
      game.screen === SCREEN.TIMED_RESULTS || game.screen === SCREEN.STATS) {
    const activeOverlay = document.querySelector('.overlay:not(.hidden)');
    if (!activeOverlay) return;
    const buttons = activeOverlay.querySelectorAll('.neon-btn');
    if (buttons.length === 0) return;

    if (input.keys['ArrowUp']) {
      menuFocusIndex = (menuFocusIndex - 1 + buttons.length) % buttons.length;
      buttons[menuFocusIndex].focus();
      playSound('menu_navigate');
      input.keys['ArrowUp'] = false;
    }
    if (input.keys['ArrowDown']) {
      menuFocusIndex = (menuFocusIndex + 1) % buttons.length;
      buttons[menuFocusIndex].focus();
      playSound('menu_navigate');
      input.keys['ArrowDown'] = false;
    }
  }
}

// ===== Focus loss pause =====
window.addEventListener('blur', () => {
  if (settings.pauseOnFocusLoss && game.screen === SCREEN.PLAYING) {
    game.pause();
    showScreen(SCREEN.PAUSED);
  }
});

// ===== Game Loop =====
let lastTime = 0;
let countdownSoundPlayed = true;

function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  // Cap dt to avoid huge jumps
  const cappedDt = Math.min(dt, 50);

  // Handle menu keyboard
  handleMenuKeyboard();

  // Update game
  game.update(cappedDt);

  // Countdown sound
  if (game.screen === SCREEN.COUNTDOWN) {
    updateCountdownDisplay();
    const cv = game.countdownDisplay;
    if (cv !== countdownSoundPlayed && cv > 0) {
      playSound('countdown');
      countdownSoundPlayed = cv;
    }
    if (cv <= 0 && countdownSoundPlayed > 0) {
      playSound('countdown_go');
      countdownSoundPlayed = 0;
    }
  } else if (game.screen !== SCREEN.COUNTDOWN) {
    countdownSoundPlayed = 99;
  }

  // Render
  if (game.screen === SCREEN.PLAYING || game.screen === SCREEN.ATTRACT) {
    renderer.render(
      game.paddle,
      game.balls,
      game.brickGrid,
      game.powerUps,
      game.lasers,
      game.particles,
      settings
    );
    updateHUD();
  } else if (game.screen === SCREEN.COUNTDOWN) {
    // Render level preview behind countdown
    if (game.paddle && game.brickGrid) {
      renderer.render(
        game.paddle,
        game.balls,
        game.brickGrid,
        game.powerUps,
        game.lasers,
        game.particles,
        settings
      );
      updateHUD();
    }
  }

  // Update screen overlays
  if (game.screen === SCREEN.LEVEL_COMPLETE) {
    updateLevelCompleteScreen();
    showScreen(SCREEN.LEVEL_COMPLETE);
  } else if (game.screen === SCREEN.GAME_OVER) {
    game.highScore = Math.max(game.score, stats.highScore || 0);
    updateHighScore(stats, game.score);
    updateGameOverScreen();
    showScreen(SCREEN.GAME_OVER);
  } else if (game.screen === SCREEN.TIMED_RESULTS) {
    updateTimedBest(stats, game.timedChallenge.score);
    updateTimedResultsScreen();
    showScreen(SCREEN.TIMED_RESULTS);
  } else if (game.screen === SCREEN.PAUSED) {
    showScreen(SCREEN.PAUSED);
  } else if (game.screen === SCREEN.MAIN_MENU) {
    showScreen(SCREEN.MAIN_MENU);
  } else if (game.screen === SCREEN.COUNTDOWN) {
    showScreen(SCREEN.COUNTDOWN);
  } else if (game.screen === SCREEN.PLAYING) {
    showScreen(SCREEN.PLAYING);
  } else if (game.screen === SCREEN.SETTINGS) {
    showScreen(SCREEN.SETTINGS);
  } else if (game.screen === SCREEN.STATS) {
    showScreen(SCREEN.STATS);
  }

  // Save stats periodically
  if (game.screen === SCREEN.GAME_OVER || game.screen === SCREEN.TIMED_RESULTS) {
    incrementStat(stats, 'totalBricksDestroyed', game.bricksDestroyed);
    const playTime = (Date.now() - game.sessionStartTime) / 1000;
    stats.totalPlayTime = (stats.totalPlayTime || 0) + playTime;
    saveStats(stats);
    game.bricksDestroyed = 0; // Reset to avoid double-counting
  }

  requestAnimationFrame(gameLoop);
}

// ===== Initial Focus =====
canvas.focus();

// Expose game for testing
window.__test_game = game;

// ===== Start =====
showScreen(SCREEN.MAIN_MENU);
requestAnimationFrame(gameLoop);
