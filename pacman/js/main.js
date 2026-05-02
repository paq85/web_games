import { AudioEngine } from './audio.js';
import { createAnnouncer, focusFirstInteractive, isTouchDevice, prefersReducedMotion } from './accessibility.js';
import { ACTIONS, COUNTDOWN_START, DEMO_IDLE_DELAY, DIFFICULTIES, GHOST_NAMES } from './constants.js';
import { PacmanGame } from './game.js';
import { PacmanRenderer } from './renderer.js';
import {
  createDefaultSettings,
  createDefaultStats,
  getActionLabel,
  getBindingLabel,
  normalizeBindings,
  resetBindings,
  setBinding
} from './settings.js';
import {
  loadSettings,
  loadStats,
  recordScore,
  resetSettings,
  resetStats,
  saveSettings,
  saveStats
} from './storage.js';

const dom = {};
const state = {
  settings: null,
  stats: null,
  currentGame: null,
  currentSession: null,
  renderer: null,
  audio: null,
  announcer: null,
  bindingLookup: new Map(),
  bindingCaptureAction: null,
  activePanel: 'menu',
  panelReturnTarget: 'menu',
  idleTimer: null,
  idleActive: false,
  lastFrame: performance.now(),
  screenMessage: 'Press Play to begin.',
  testMode: new URLSearchParams(window.location.search).has('test') || new URLSearchParams(window.location.search).has('debug')
};

function cacheDom() {
  dom.canvas = document.getElementById('game-canvas');
  dom.scoreValue = document.getElementById('score-value');
  dom.highScoreValue = document.getElementById('high-score-value');
  dom.livesValue = document.getElementById('lives-value');
  dom.levelValue = document.getElementById('level-value');
  dom.modeValue = document.getElementById('mode-value');
  dom.topbarStatus = document.getElementById('topbar-status');
  dom.screenMessage = document.getElementById('screen-message');
  dom.screenAlert = document.getElementById('screen-alert');
  dom.countdownValue = document.getElementById('countdown-value');
  dom.finalScore = document.getElementById('final-score');
  dom.finalHighScore = document.getElementById('final-high-score');
  dom.finalSummary = document.getElementById('final-summary');
  dom.difficultySelect = document.getElementById('difficulty-select');
  dom.masterVolume = document.getElementById('master-volume');
  dom.musicVolume = document.getElementById('music-volume');
  dom.sfxVolume = document.getElementById('sfx-volume');
  dom.muteToggle = document.getElementById('mute-toggle');
  dom.reduceMotionToggle = document.getElementById('reduce-motion-toggle');
  dom.reduceEffectsToggle = document.getElementById('reduce-effects-toggle');
  dom.crtToggle = document.getElementById('crt-toggle');
  dom.practiceToggle = document.getElementById('practice-toggle');
  dom.controlScheme = document.getElementById('control-scheme');
  dom.bindingList = document.getElementById('binding-list');
  dom.scoresList = document.getElementById('scores-list');
  dom.touchControls = document.getElementById('touch-controls');
  dom.panels = Array.from(document.querySelectorAll('[data-screen]'));
  dom.menuPanel = document.getElementById('main-menu');
  dom.settingsPanel = document.getElementById('settings-panel');
  dom.scoresPanel = document.getElementById('scores-panel');
  dom.pausePanel = document.getElementById('pause-panel');
  dom.countdownPanel = document.getElementById('countdown-panel');
  dom.gameoverPanel = document.getElementById('gameover-panel');
  dom.menuButtons = Array.from(document.querySelectorAll('[data-menu-action]'));
  dom.touchButtons = Array.from(document.querySelectorAll('[data-touch-action]'));
}

function initState() {
  state.settings = loadSettings(undefined, { prefersReducedMotion: prefersReducedMotion() });
  state.stats = loadStats();
  state.audio = new AudioEngine(state.settings);
  state.renderer = new PacmanRenderer(dom.canvas, state.settings);
  state.announcer = createAnnouncer(dom.screenMessage, dom.screenAlert);
  syncBindingLookup();
  applySettingsToForm();
  renderBindingList();
  renderScoresList();
  updateHud();
  drawMenuBackdrop();
  updateTouchVisibility();
  scheduleIdleDemo();
}

function syncBindingLookup() {
  state.bindingLookup = new Map();
  for (const [action, codes] of Object.entries(state.settings.bindings)) {
    for (const code of codes) {
      state.bindingLookup.set(code, action);
    }
  }
}

function applySettingsToForm() {
  dom.difficultySelect.value = state.settings.difficulty;
  dom.masterVolume.value = Math.round(state.settings.masterVolume * 100);
  dom.musicVolume.value = Math.round(state.settings.musicVolume * 100);
  dom.sfxVolume.value = Math.round(state.settings.sfxVolume * 100);
  dom.muteToggle.checked = state.settings.muted;
  dom.reduceMotionToggle.checked = state.settings.reduceMotion;
  dom.reduceEffectsToggle.checked = state.settings.reduceEffects;
  dom.crtToggle.checked = state.settings.crtOverlay;
  dom.practiceToggle.checked = state.settings.practiceMode;
  dom.controlScheme.value = state.settings.controlScheme;
}

function readSettingsFromForm() {
  state.settings.difficulty = dom.difficultySelect.value;
  state.settings.masterVolume = Number(dom.masterVolume.value) / 100;
  state.settings.musicVolume = Number(dom.musicVolume.value) / 100;
  state.settings.sfxVolume = Number(dom.sfxVolume.value) / 100;
  state.settings.muted = dom.muteToggle.checked;
  state.settings.reduceMotion = dom.reduceMotionToggle.checked;
  state.settings.reduceEffects = dom.reduceEffectsToggle.checked;
  state.settings.crtOverlay = dom.crtToggle.checked;
  state.settings.practiceMode = dom.practiceToggle.checked;
  state.settings.controlScheme = dom.controlScheme.value;
}

function persistSettings() {
  readSettingsFromForm();
  saveSettings(state.settings);
  state.audio.updateSettings(state.settings);
  state.renderer.updateSettings(state.settings);
  updateTouchVisibility();
  renderBindingList();
  announce(`Settings saved. Difficulty ${DIFFICULTIES[state.settings.difficulty].label}.`, false);
}

function resetSettingsToDefaults() {
  state.settings = resetSettings(undefined, { prefersReducedMotion: prefersReducedMotion() });
  state.audio.updateSettings(state.settings);
  state.renderer.updateSettings(state.settings);
  syncBindingLookup();
  applySettingsToForm();
  renderBindingList();
  updateTouchVisibility();
  saveSettings(state.settings);
  announce('Settings restored to defaults.', false);
}

function resetHighScores() {
  state.stats = resetStats();
  saveStats(state.stats);
  renderScoresList();
  updateHud();
  announce('High scores cleared.', false);
}

function renderBindingList() {
  dom.bindingList.innerHTML = '';
  for (const action of ACTIONS) {
    const row = document.createElement('div');
    row.className = 'binding-row';
    row.dataset.bindingAction = action;
    const label = document.createElement('span');
    label.textContent = getActionLabel(action);
    const value = document.createElement('strong');
    value.textContent = getBindingLabel(state.settings.bindings[action]);
    const change = document.createElement('button');
    change.type = 'button';
    change.dataset.bindingChange = action;
    change.textContent = state.bindingCaptureAction === action ? 'Press a key...' : 'Change';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'binding-row__secondary';
    clear.dataset.bindingClear = action;
    clear.textContent = 'Reset';
    row.append(label, value, change, clear);
    dom.bindingList.append(row);
  }
}

function renderScoresList() {
  dom.scoresList.innerHTML = '';
  const scores = state.stats.highScores.length ? state.stats.highScores : [{ name: '—', score: 0, difficulty: 'medium', mode: 'arcade', achievedAt: new Date().toISOString() }];
  scores.forEach((entry, index) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    const date = new Date(entry.achievedAt);
    const dateLabel = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    label.textContent = `${index + 1}. ${entry.name} · ${DIFFICULTIES[entry.difficulty]?.label || entry.difficulty} · ${entry.mode}`;
    const score = document.createElement('strong');
    score.textContent = `${entry.score}${dateLabel ? ` · ${dateLabel}` : ''}`;
    item.append(label, score);
    dom.scoresList.append(item);
  });
}

function updateHud() {
  const game = state.currentGame;
  const snapshot = game?.getSnapshot();
  const currentScore = snapshot?.score || 0;
  const currentLives = snapshot?.lives ?? 3;
  const currentLevel = snapshot?.level || 1;
  const currentMode = snapshot ? getModeLabel(snapshot) : 'Menu';
  dom.scoreValue.textContent = String(currentScore);
  dom.highScoreValue.textContent = String(Math.max(state.stats.highScore || 0, currentScore));
  dom.livesValue.textContent = currentLives === Infinity ? '∞' : String(currentLives);
  dom.levelValue.textContent = String(currentLevel);
  dom.modeValue.textContent = currentMode;
  dom.topbarStatus.textContent = state.screenMessage;
}

function getModeLabel(snapshot) {
  if (snapshot.phase === 'paused') {
    return 'Paused';
  }
  if (snapshot.phase === 'countdown') {
    return `Countdown ${Math.ceil(snapshot.countdown)}`;
  }
  if (snapshot.phase === 'between-level') {
    return 'Level clear';
  }
  if (snapshot.demoMode) {
    return 'Demo';
  }
  if (snapshot.practiceMode) {
    return 'Practice';
  }
  return snapshot.globalMode === 'scatter' ? 'Scatter' : 'Chase';
}

function updateCountdownDisplay() {
  const countdown = state.currentGame?.getSnapshot()?.countdown || COUNTDOWN_START;
  dom.countdownValue.textContent = String(Math.max(1, Math.ceil(countdown)));
}

function announce(message, assertive = false) {
  state.screenMessage = message;
  dom.screenMessage.textContent = message;
  dom.topbarStatus.textContent = message;
  if (assertive) {
    state.announcer.announceAssertive(message);
  } else {
    state.announcer.announcePolite(message);
  }
}

function handleGameEvent(event) {
  const { type, payload, state: snapshot } = event;
  switch (type) {
    case 'message':
      announce(payload.text);
      break;
    case 'score':
      updateHud();
      break;
    case 'dot-eaten':
      state.audio.playDot();
      updateHud();
      break;
    case 'power-pellet':
      state.audio.playPowerPellet();
      announce('Ghosts turned vulnerable!');
      updateHud();
      break;
    case 'ghost-eaten':
      state.audio.playGhostEaten(Math.max(0, (payload.combo || 1) - 1));
      state.stats.ghostsEaten += 1;
      state.stats.longestGhostCombo = Math.max(state.stats.longestGhostCombo, payload.combo || 1);
      saveStats(state.stats);
      announce(`${GHOST_NAMES[payload.ghost] || payload.ghost} eaten for ${payload.points} points!`);
      updateHud();
      break;
    case 'fruit-spawned':
      announce(`${payload.fruit.data.name} spawned.`);
      break;
    case 'fruit-collected':
      state.audio.playFruit();
      state.stats.fruitsCollected += 1;
      saveStats(state.stats);
      announce(`${payload.fruit.name} collected for ${payload.score} points!`);
      updateHud();
      break;
    case 'life-lost':
      state.audio.playLifeLost();
      announce(payload.practice ? 'Practice mode: Pacman lost a life, but the run continues.' : `Pacman lost a life. ${payload.lives} lives left.`, true);
      updateHud();
      break;
    case 'level-complete':
      state.audio.playLevelComplete();
      state.stats.levelsCompleted += 1;
      saveStats(state.stats);
      announce(`Level ${payload.level} cleared!`);
      updateHud();
      break;
    case 'mode-change':
      updateHud();
      break;
    case 'pause':
      state.audio.playPause(true);
      state.audio.stopMusic();
      showPanel('pause');
      updateHud();
      break;
    case 'resume':
      state.audio.playPause(false);
      state.audio.startMusic('game');
      hideGamePanels();
      state.currentGame && state.currentGame.state && updateHud();
      break;
    case 'game-over': {
      state.audio.stopMusic();
      state.audio.playLifeLost();
      finalizeStats({
        ...(payload.summary || snapshot?.summary || {}),
        score: payload.score ?? snapshot?.score ?? payload.summary?.score ?? snapshot?.summary?.score ?? 0
      });
      dom.finalScore.textContent = String(snapshot?.score || payload.score || 0);
      dom.finalHighScore.textContent = String(state.stats.highScore);
      dom.finalSummary.textContent = `${payload.summary?.levelsCompleted || snapshot?.summary?.levelsCompleted || 0} levels completed, ${payload.summary?.ghostsEaten || snapshot?.summary?.ghostsEaten || 0} ghosts eaten.`;
      showPanel('gameover');
      renderScoresList();
      updateHud();
      break;
    }
    case 'countdown-finished':
      hideGamePanels();
      updateHud();
      break;
    default:
      break;
  }
}

function finalizeStats(summary) {
  const score = Number(summary.score || 0);
  state.stats.gamesPlayed += 1;
  state.stats.totalScore += score;
  state.stats.lastScore = score;
  state.stats.lastDifficulty = summary.difficulty || state.settings.difficulty;
  state.stats.lastPlayedAt = new Date().toISOString();
  state.stats.highScore = Math.max(state.stats.highScore, score);
  state.stats.highScores = [...state.stats.highScores, {
    name: summary.mode === 'practice' ? 'PRACTICE' : 'PLAYER',
    score,
    difficulty: summary.difficulty || state.settings.difficulty,
    mode: summary.mode || 'arcade',
    achievedAt: state.stats.lastPlayedAt
  }]
    .sort((a, b) => b.score - a.score || a.achievedAt.localeCompare(b.achievedAt))
    .slice(0, 10);
  saveStats(state.stats);
}

function showPanel(name) {
  state.activePanel = name;
  for (const panel of dom.panels) {
    panel.hidden = panel.dataset.screen !== name;
  }
  if (name === 'menu') {
    dom.menuPanel.hidden = false;
    focusFirstInteractive(dom.menuPanel);
  } else if (name === 'settings') {
    dom.settingsPanel.hidden = false;
    focusFirstInteractive(dom.settingsPanel);
  } else if (name === 'scores') {
    dom.scoresPanel.hidden = false;
    focusFirstInteractive(dom.scoresPanel);
  } else if (name === 'pause') {
    dom.pausePanel.hidden = false;
    focusFirstInteractive(dom.pausePanel);
  } else if (name === 'countdown') {
    dom.countdownPanel.hidden = false;
    updateCountdownDisplay();
    dom.canvas.focus();
  } else if (name === 'gameover') {
    dom.gameoverPanel.hidden = false;
    focusFirstInteractive(dom.gameoverPanel);
  }
  updateTouchVisibility();
}

function hideGamePanels() {
  for (const panel of dom.panels) {
    panel.hidden = panel.dataset.screen === 'menu' ? false : panel.dataset.screen !== 'menu';
  }
  dom.menuPanel.hidden = state.currentGame ? true : false;
  if (!state.currentGame) {
    showPanel('menu');
  } else {
    dom.menuPanel.hidden = true;
    dom.settingsPanel.hidden = true;
    dom.scoresPanel.hidden = true;
    dom.pausePanel.hidden = true;
    dom.countdownPanel.hidden = true;
    dom.gameoverPanel.hidden = true;
  }
}

function returnToMenu() {
  if (state.currentGame) {
    state.currentGame = null;
  }
  state.currentSession = null;
  state.audio.stopMusic();
  state.audio.startMusic('menu');
  showPanel('menu');
  state.screenMessage = 'Main menu ready';
  updateHud();
  drawMenuBackdrop();
  scheduleIdleDemo();
}

async function startSession({ difficultyKey, practiceMode = false, demoMode = false }) {
  clearIdleTimer();
  if (state.currentGame && state.currentGame.state?.phase !== 'gameover') {
    state.currentGame = null;
  }
  await state.audio.ensureContext();
  state.settings.difficulty = difficultyKey;
  state.settings.practiceMode = practiceMode;
  saveSettings(state.settings);
  applySettingsToForm();
  state.currentGame = new PacmanGame({
    difficultyKey,
    practiceMode,
    demoMode,
    random: Math.random,
    onEvent: handleGameEvent
  });
  state.currentSession = { difficultyKey, practiceMode, demoMode };
  state.audio.startMusic('game');
  showPanel('countdown');
  updateHud();
  dom.canvas.focus();
  announce(demoMode ? 'Demo mode engaged.' : practiceMode ? 'Practice mode started.' : `${DIFFICULTIES[difficultyKey].label} game starting.`);
}

function scheduleIdleDemo() {
  clearIdleTimer();
  if (state.currentGame || state.activePanel !== 'menu') {
    return;
  }
  state.idleActive = true;
  state.idleTimer = window.setTimeout(() => {
    if (!state.currentGame && state.activePanel === 'menu') {
      void startSession({ difficultyKey: state.settings.difficulty, practiceMode: false, demoMode: true });
    }
  }, DEMO_IDLE_DELAY);
}

function clearIdleTimer() {
  if (state.idleTimer) {
    clearTimeout(state.idleTimer);
    state.idleTimer = null;
  }
  state.idleActive = false;
}

function resetIdleTimer() {
  if (state.currentGame || state.activePanel !== 'menu') {
    clearIdleTimer();
    return;
  }
  scheduleIdleDemo();
}

function handleMenuAction(action) {
  if (state.bindingCaptureAction) {
    return;
  }
  switch (action) {
    case 'play':
      state.audio.playConfirm();
      void startSession({ difficultyKey: dom.difficultySelect.value, practiceMode: dom.practiceToggle.checked, demoMode: false });
      break;
    case 'practice':
      state.audio.playConfirm();
      void startSession({ difficultyKey: dom.difficultySelect.value, practiceMode: true, demoMode: false });
      break;
    case 'demo':
      state.audio.playConfirm();
      void startSession({ difficultyKey: dom.difficultySelect.value, practiceMode: false, demoMode: true });
      break;
    case 'settings':
      state.audio.playMenuMove();
      state.panelReturnTarget = state.currentGame ? 'pause' : 'menu';
      showPanel('settings');
      break;
    case 'scores':
      state.audio.playMenuMove();
      state.panelReturnTarget = state.currentGame ? 'pause' : 'menu';
      renderScoresList();
      showPanel('scores');
      break;
    case 'save-settings':
      state.audio.playConfirm();
      persistSettings();
      showPanel(state.panelReturnTarget === 'pause' ? 'pause' : 'menu');
      break;
    case 'reset-settings':
      state.audio.playMenuMove();
      resetSettingsToDefaults();
      break;
    case 'reset-scores':
      state.audio.playMenuMove();
      resetHighScores();
      break;
    case 'back':
      state.audio.playMenuMove();
      if (state.panelReturnTarget === 'pause' && state.currentGame) {
        showPanel('pause');
      } else {
        showPanel('menu');
      }
      break;
    case 'resume':
      if (state.currentGame) {
        state.currentGame.resume();
      }
      break;
    case 'restart':
      state.audio.playConfirm();
      if (state.currentSession) {
        void startSession(state.currentSession);
      } else {
        void startSession({ difficultyKey: dom.difficultySelect.value, practiceMode: dom.practiceToggle.checked, demoMode: false });
      }
      break;
    case 'menu':
      state.audio.playMenuMove();
      returnToMenu();
      break;
    default:
      break;
  }
  resetIdleTimer();
}

function handleTouchAction(action) {
  if (action === 'pause' && state.currentGame) {
    state.currentGame.togglePause();
    return;
  }
  if (['up', 'down', 'left', 'right'].includes(action) && state.currentGame) {
    state.currentGame.handleAction(action);
    return;
  }
  if (action === 'confirm') {
    if (state.activePanel === 'menu') {
      handleMenuAction('play');
      return;
    }
    if (state.activePanel === 'pause') {
      handleMenuAction('resume');
      return;
    }
  }
}

function updateTouchVisibility() {
  const shouldShow = state.settings.controlScheme !== 'keyboard' && (isTouchDevice() || window.innerWidth <= 980);
  dom.touchControls.style.display = shouldShow ? 'grid' : 'none';
}

function drawMenuBackdrop() {
  const ctx = dom.canvas.getContext('2d');
  const width = dom.canvas.width;
  const height = dom.canvas.height;
  if (!width || !height) {
    return;
  }
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#04050d');
  gradient.addColorStop(1, '#090d1d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(67, 104, 255, 0.08)';
  for (let row = 0; row < height; row += 18) {
    ctx.fillRect(0, row, width, 1);
  }
  ctx.fillStyle = '#4368ff';
  ctx.fillRect(width * 0.2, height * 0.2, width * 0.08, height * 0.04);
  ctx.fillRect(width * 0.72, height * 0.18, width * 0.08, height * 0.04);
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(width * 0.35, height * 0.55, width * 0.07, 0.25 * Math.PI, 1.75 * Math.PI);
  ctx.lineTo(width * 0.35, height * 0.55);
  ctx.fill();
  ctx.fillStyle = '#fff7d5';
  ctx.font = `700 ${Math.max(20, width * 0.04)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Pacman Arcade', width / 2, height * 0.84);
  ctx.font = `400 ${Math.max(12, width * 0.02)}px system-ui, sans-serif`;
  ctx.fillText('Press Play to begin', width / 2, height * 0.9);
  ctx.restore();
}

function handleKeydown(event) {
  if (state.bindingCaptureAction) {
    if (event.code === 'Escape') {
      state.bindingCaptureAction = null;
      renderBindingList();
      announce('Binding capture cancelled.');
      event.preventDefault();
      return;
    }
    if (event.code && event.code !== 'Tab') {
      const nextBindings = { ...state.settings.bindings };
      for (const action of ACTIONS) {
        nextBindings[action] = nextBindings[action].filter((code) => code !== event.code);
      }
      nextBindings[state.bindingCaptureAction] = [event.code];
      state.settings.bindings = normalizeBindings(nextBindings);
      syncBindingLookup();
      renderBindingList();
      saveSettings(state.settings);
      announce(`${getActionLabel(state.bindingCaptureAction)} mapped to ${event.code.replace(/^Key/, '')}.`);
      state.bindingCaptureAction = null;
      event.preventDefault();
    }
    return;
  }

  const action = state.bindingLookup.get(event.code);
  if (action) {
    event.preventDefault();
    if (['up', 'down', 'left', 'right', 'pause'].includes(action)) {
      state.audio.playMenuMove();
    }
    if (action === 'mute') {
      state.settings.muted = !state.settings.muted;
      saveSettings(state.settings);
      state.audio.setMuted(state.settings.muted);
      announce(state.settings.muted ? 'Muted.' : 'Sound on.');
      return;
    }
    if (state.currentGame) {
      state.currentGame.handleAction(action);
      if (state.currentGame.demoMode && state.currentGame.state.phase !== 'paused') {
        state.currentGame.setDemoMode(false);
      }
      resetIdleTimer();
      return;
    }
    if (action === 'confirm' && state.activePanel === 'menu') {
      handleMenuAction('play');
      return;
    }
    if (action === 'pause' && state.activePanel === 'pause') {
      handleMenuAction('resume');
      return;
    }
  }

  if (event.code === 'Escape') {
    event.preventDefault();
    if (state.currentGame) {
      state.currentGame.togglePause();
    } else if (state.activePanel !== 'menu') {
      showPanel('menu');
    }
    return;
  }

  if ((event.code === 'Enter' || event.code === 'Space') && state.activePanel === 'menu') {
    event.preventDefault();
    handleMenuAction('play');
    return;
  }

  if (event.code === 'KeyM') {
    event.preventDefault();
    state.settings.muted = !state.settings.muted;
    saveSettings(state.settings);
    state.audio.setMuted(state.settings.muted);
    announce(state.settings.muted ? 'Muted.' : 'Sound on.');
  }
}

function handleMenuPointer(event) {
  if (state.currentGame && state.currentGame.state.phase === 'playing' && event.target === dom.canvas) {
    return;
  }
  if (state.activePanel === 'menu' && !(event.target instanceof HTMLElement && event.target.closest('button, input, select, label, a'))) {
    handleMenuAction('play');
  }
}

function handleCanvasPointerDown(event) {
  if (!state.currentGame) {
    return;
  }
  dom.canvas.setPointerCapture?.(event.pointerId);
  state.pointerStart = { x: event.clientX, y: event.clientY, time: performance.now() };
}

function handleCanvasPointerUp(event) {
  if (!state.currentGame || !state.pointerStart) {
    return;
  }
  const dx = event.clientX - state.pointerStart.x;
  const dy = event.clientY - state.pointerStart.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const threshold = 28;
  if (Math.max(absX, absY) < threshold) {
    state.pointerStart = null;
    return;
  }
  const direction = absX > absY ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  state.currentGame.handleAction(direction);
  state.pointerStart = null;
  resetIdleTimer();
}

function buildTestApi() {
  if (!state.testMode) {
    return;
  }
  window.__PACMAN_TEST_API__ = {
    startGame: (options = {}) => startSession({
      difficultyKey: options.difficultyKey || state.settings.difficulty,
      practiceMode: Boolean(options.practiceMode),
      demoMode: Boolean(options.demoMode)
    }),
    getState: () => state.currentGame?.getSnapshot() || null,
    forceGameOver: () => state.currentGame?.forceGameOver(),
    setScore: (score) => {
      if (state.currentGame) {
        state.currentGame.state.score = score;
        state.currentGame.state.summary.score = score;
        updateHud();
      }
    },
    setLives: (lives) => {
      if (state.currentGame) {
        state.currentGame.state.lives = lives;
        updateHud();
      }
    },
    setPanel: (name) => showPanel(name),
    settings: () => state.settings,
    stats: () => state.stats,
    returnToMenu
  };
}

function frame(now) {
  const dt = now - state.lastFrame;
  state.lastFrame = now;
  if (state.currentGame) {
    state.currentGame.update(dt);
    state.renderer.render(state.currentGame.getSnapshot(), dt);
    updateHud();
    const snapshot = state.currentGame.getSnapshot();
    if (snapshot.phase === 'countdown') {
      showPanel('countdown');
      updateCountdownDisplay();
    } else if (snapshot.phase === 'paused') {
      showPanel('pause');
    } else if (snapshot.phase === 'between-level') {
      showPanel('countdown');
      dom.countdownValue.textContent = 'Next';
    } else if (snapshot.phase === 'gameover') {
      showPanel('gameover');
    } else if (snapshot.phase === 'playing') {
      hideGamePanels();
    } else if (snapshot.phase === 'respawn') {
      showPanel('countdown');
      dom.countdownValue.textContent = '3';
    }
    if (snapshot.phase === 'gameover' && !state.currentSession?.demoMode) {
      state.currentSession = null;
    }
  } else if (state.activePanel === 'menu') {
    drawMenuBackdrop();
  }
  requestAnimationFrame(frame);
}

function bindEvents() {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('pointerdown', handleMenuPointer, { passive: true });
  dom.canvas.addEventListener('pointerdown', handleCanvasPointerDown);
  dom.canvas.addEventListener('pointerup', handleCanvasPointerUp);
  dom.touchButtons.forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      handleTouchAction(button.dataset.touchAction);
    });
  });
  dom.menuButtons.forEach((button) => {
    button.addEventListener('click', () => handleMenuAction(button.dataset.menuAction));
  });
  dom.bindingList.addEventListener('click', (event) => {
    const changeButton = event.target.closest('[data-binding-change]');
    if (changeButton) {
      state.bindingCaptureAction = changeButton.dataset.bindingChange;
      renderBindingList();
      announce(`Press a key for ${getActionLabel(state.bindingCaptureAction)}.`);
      return;
    }
    const clearButton = event.target.closest('[data-binding-clear]');
    if (clearButton) {
      const action = clearButton.dataset.bindingClear;
      state.settings.bindings = setBinding(state.settings.bindings, action, resetBindings()[action][0]);
      state.settings.bindings[action] = resetBindings()[action];
      syncBindingLookup();
      renderBindingList();
      saveSettings(state.settings);
      announce(`${getActionLabel(action)} reset.`);
    }
  });
  [dom.difficultySelect, dom.masterVolume, dom.musicVolume, dom.sfxVolume, dom.muteToggle, dom.reduceMotionToggle, dom.reduceEffectsToggle, dom.crtToggle, dom.practiceToggle, dom.controlScheme].forEach((element) => {
    element.addEventListener('change', () => {
      persistSettings();
      resetIdleTimer();
    });
  });
  [dom.masterVolume, dom.musicVolume, dom.sfxVolume].forEach((element) => {
    element.addEventListener('input', persistSettings);
  });
  window.addEventListener('resize', () => {
    updateTouchVisibility();
    if (!state.currentGame) {
      drawMenuBackdrop();
    }
  });
  window.addEventListener('beforeunload', () => {
    saveSettings(state.settings);
    saveStats(state.stats);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.currentGame && state.currentGame.state.phase === 'playing') {
      state.currentGame.pause();
    }
  });
  dom.canvas.addEventListener('touchstart', () => resetIdleTimer(), { passive: true });
  dom.canvas.addEventListener('touchend', () => resetIdleTimer(), { passive: true });
}

function setupInitialScreen() {
  showPanel('menu');
  state.audio.startMusic('menu');
  updateHud();
}

async function boot() {
  cacheDom();
  initState();
  bindEvents();
  buildTestApi();
  setupInitialScreen();
  requestAnimationFrame(frame);
}

void boot();
