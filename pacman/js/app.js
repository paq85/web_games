import { AccessibilityManager } from './accessibility/accessibility-manager.js';
import { evaluateAchievements, ACHIEVEMENTS, getAchievementById } from './data/achievements.js';
import { AudioManager } from './audio/audio-manager.js';
import { GAME_SCREENS, RUN_MODES } from './constants.js';
import { GameLoop } from './core/game-loop.js';
import { GameSession } from './core/game-session.js';
import { StateMachine } from './core/state-machine.js';
import { ACTION_LABELS, formatBindingLabel, formatKeyCode, InputManager } from './input/input-manager.js';
import { CanvasRenderer } from './render/canvas-renderer.js';
import { addHighScoreEntry, loadHighScores, loadSettings, loadStats, saveHighScores, saveSettings, saveStats } from './storage/storage.js';

function setVisible(element, visible, visibleClass = 'stage-overlay--visible') {
  if (!element) {
    return;
  }
  element.classList.toggle(visibleClass, visible);
  element.setAttribute('aria-hidden', String(!visible));
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function shouldPersistRun(summary) {
  return summary.mode !== RUN_MODES.DEMO && (summary.score > 0 || summary.pelletsEaten > 0 || summary.levelsCompleted > 0);
}

export class PacmanApp {
  constructor(document) {
    this.document = document;
    this.window = document.defaultView;
    this.prefersReducedMotion = this.window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.elements = {
      appShell: document.getElementById('app-shell'),
      canvas: document.getElementById('game-canvas'),
      pauseButton: document.getElementById('pause-button'),
      muteButton: document.getElementById('mute-button'),
      entryOverlay: document.getElementById('entry-overlay'),
      entryButton: document.getElementById('entry-button'),
      difficultyOverlay: document.getElementById('difficulty-overlay'),
      difficultyButtons: [...document.querySelectorAll('[data-difficulty]')],
      difficultyCancel: document.getElementById('difficulty-cancel'),
      pauseOverlay: document.getElementById('pause-overlay'),
      resumeButton: document.getElementById('resume-button'),
      restartButton: document.getElementById('restart-button'),
      pauseSettingsButton: document.getElementById('pause-settings-button'),
      quitButton: document.getElementById('quit-button'),
      gameOverOverlay: document.getElementById('game-over-overlay'),
      playAgainButton: document.getElementById('play-again-button'),
      gameOverMenuButton: document.getElementById('game-over-menu-button'),
      gameOverSummary: document.getElementById('game-over-summary'),
      levelCompleteOverlay: document.getElementById('level-complete-overlay'),
      levelCompleteSummary: document.getElementById('level-complete-summary'),
      countdownOverlay: document.getElementById('countdown-overlay'),
      demoBanner: document.getElementById('demo-banner'),
      captionText: document.getElementById('caption-text'),
      statusBanner: document.getElementById('status-banner'),
      touchControls: document.getElementById('touch-controls'),
      politeLiveRegion: document.getElementById('polite-live-region'),
      assertiveLiveRegion: document.getElementById('assertive-live-region'),
      scoreValue: document.getElementById('score-value'),
      livesValue: document.getElementById('lives-value'),
      levelValue: document.getElementById('level-value'),
      modeValue: document.getElementById('mode-value'),
      streakValue: document.getElementById('streak-value'),
      powerTimerFill: document.getElementById('power-timer-fill'),
      powerTimerText: document.getElementById('power-timer-text'),
      menuPanel: document.getElementById('menu-panel'),
      settingsPanel: document.getElementById('settings-panel'),
      scoresPanel: document.getElementById('scores-panel'),
      tutorialPanel: document.getElementById('tutorial-panel'),
      startGameButton: document.getElementById('start-game-button'),
      practiceButton: document.getElementById('practice-button'),
      tutorialButton: document.getElementById('tutorial-button'),
      tutorialStartButton: document.getElementById('tutorial-start-button'),
      scoresButton: document.getElementById('scores-button'),
      settingsButton: document.getElementById('settings-button'),
      demoButton: document.getElementById('demo-button'),
      settingsBackButton: document.getElementById('settings-back-button'),
      scoresBackButton: document.getElementById('scores-back-button'),
      tutorialBackButton: document.getElementById('tutorial-back-button'),
      difficultySelect: document.getElementById('difficulty-select'),
      themeSelect: document.getElementById('theme-select'),
      controlSchemeSelect: document.getElementById('control-scheme-select'),
      masterVolumeInput: document.getElementById('master-volume-input'),
      masterVolumeOutput: document.getElementById('master-volume-output'),
      musicVolumeInput: document.getElementById('music-volume-input'),
      musicVolumeOutput: document.getElementById('music-volume-output'),
      sfxVolumeInput: document.getElementById('sfx-volume-input'),
      sfxVolumeOutput: document.getElementById('sfx-volume-output'),
      practiceSpeedInput: document.getElementById('practice-speed-input'),
      practiceSpeedOutput: document.getElementById('practice-speed-output'),
      muteToggleInput: document.getElementById('mute-toggle-input'),
      crtToggleInput: document.getElementById('crt-toggle-input'),
      screenShakeToggleInput: document.getElementById('screen-shake-toggle-input'),
      particlesToggleInput: document.getElementById('particles-toggle-input'),
      reducedFlashToggleInput: document.getElementById('reduced-flash-toggle-input'),
      bindingButtons: [...document.querySelectorAll('[data-bind-action]')],
      bindingHint: document.getElementById('binding-hint'),
      scoresBody: document.getElementById('scores-body'),
      statsGrid: document.getElementById('stats-grid'),
      achievementList: document.getElementById('achievement-list')
    };

    this.settings = loadSettings({ prefersReducedMotion: this.prefersReducedMotion });
    this.highScores = loadHighScores();
    this.stats = loadStats();
    this.stateMachine = new StateMachine(GAME_SCREENS.ENTRY);
    this.renderer = new CanvasRenderer(this.elements.canvas);
    this.audio = new AudioManager();
    this.accessibility = new AccessibilityManager({
      politeRegion: this.elements.politeLiveRegion,
      assertiveRegion: this.elements.assertiveLiveRegion,
      captionText: this.elements.captionText,
      statusBanner: this.elements.statusBanner,
      canvas: this.elements.canvas
    });
    this.input = new InputManager({
      canvas: this.elements.canvas,
      touchControls: this.elements.touchControls,
      callbacks: {
        onAnyInput: () => this.handleGameplayInput(),
        onDirection: (direction) => this.handleDirection(direction),
        onPause: () => this.handlePauseShortcut(),
        onMute: () => this.toggleMute(),
        onConfirm: () => this.handleConfirmShortcut()
      }
    });
    this.loop = new GameLoop({
      update: (dt) => this.update(dt),
      render: (alpha) => this.render(alpha)
    });

    this.currentSession = null;
    this.persistedRunMarker = this.createPersistedRunMarker();
    this.runFinalized = false;
    this.lastRunConfig = { runMode: RUN_MODES.NORMAL, difficulty: this.settings.difficulty };
    this.activePanel = 'menu';
    this.previousPanel = 'menu';
    this.idleSeconds = 0;
    this.currentMusic = '';
    this.lastGameOverSummary = null;
  }

  init() {
    this.bindUi();
    this.input.attach();
    this.input.setBindings(this.settings.keyBindings);
    this.syncSettingsToControls();
    this.applySettings({ save: false, announce: false });
    this.renderScoresAndStats();
    this.showPanel('menu');
    this.updateHud(null);
    this.updateOverlays(null);
    this.accessibility.setCaption('Menu ready.');
    this.setMusic('menu');
    this.elements.entryButton.focus();
    this.loop.start();
  }

  bindUi() {
    const { elements, document } = this;

    elements.entryButton.addEventListener('click', () => this.enterArcade());
    elements.entryOverlay.addEventListener('click', (event) => {
      if (event.target === elements.entryOverlay) {
        this.enterArcade();
      }
    });

    elements.startGameButton.addEventListener('click', () => this.openDifficultyOverlay());
    elements.practiceButton.addEventListener('click', () => this.startRun(RUN_MODES.PRACTICE, this.settings.difficulty));
    elements.tutorialButton.addEventListener('click', () => this.showPanel('tutorial'));
    elements.tutorialStartButton.addEventListener('click', () => this.startRun(RUN_MODES.TUTORIAL, this.settings.difficulty));
    elements.scoresButton.addEventListener('click', () => this.showPanel('scores'));
    elements.settingsButton.addEventListener('click', () => this.openSettings());
    elements.demoButton.addEventListener('click', () => this.startDemo());
    elements.settingsBackButton.addEventListener('click', () => this.showPanel(this.previousPanel));
    elements.scoresBackButton.addEventListener('click', () => this.showPanel('menu'));
    elements.tutorialBackButton.addEventListener('click', () => this.showPanel('menu'));

    elements.difficultyButtons.forEach((button) => {
      button.addEventListener('click', () => this.startRun(RUN_MODES.NORMAL, button.dataset.difficulty));
    });
    elements.difficultyCancel.addEventListener('click', () => this.closeDifficultyOverlay());

    elements.pauseButton.addEventListener('click', () => this.togglePause());
    elements.resumeButton.addEventListener('click', () => this.resumeGame());
    elements.restartButton.addEventListener('click', () => this.restartCurrentRun());
    elements.pauseSettingsButton.addEventListener('click', () => this.openSettings());
    elements.quitButton.addEventListener('click', () => this.stopSession({ finalize: true }));
    elements.playAgainButton.addEventListener('click', () => this.restartLastRun());
    elements.gameOverMenuButton.addEventListener('click', () => this.stopSession({ finalize: false }));
    elements.muteButton.addEventListener('click', () => this.toggleMute());

    [
      elements.difficultySelect,
      elements.themeSelect,
      elements.controlSchemeSelect,
      elements.masterVolumeInput,
      elements.musicVolumeInput,
      elements.sfxVolumeInput,
      elements.practiceSpeedInput,
      elements.muteToggleInput,
      elements.crtToggleInput,
      elements.screenShakeToggleInput,
      elements.particlesToggleInput,
      elements.reducedFlashToggleInput
    ].forEach((input) => {
      input.addEventListener('input', () => this.handleSettingsInput());
      input.addEventListener('change', () => this.handleSettingsInput());
    });

    elements.bindingButtons.forEach((button) => {
      button.addEventListener('click', () => this.beginBinding(button.dataset.bindAction, button));
    });

    document.addEventListener('pointerdown', () => this.handleAnyInteraction(), { passive: true });
    document.addEventListener('keydown', () => this.handleAnyInteraction(), { passive: true, capture: true });

    document.querySelectorAll('button').forEach((button) => {
      button.addEventListener('focus', () => this.audio.playSound('menu-move'));
    });
  }

  handleAnyInteraction() {
    this.idleSeconds = 0;
    this.audio.unlock();
  }

  handleGameplayInput() {
    this.handleAnyInteraction();
    if (this.currentSession?.runMode === RUN_MODES.DEMO && this.stateMachine.state === GAME_SCREENS.DEMO) {
      this.takeOverDemo();
    }
  }

  enterArcade() {
    this.stateMachine.setState(GAME_SCREENS.MENU);
    this.accessibility.setCaption('Main menu ready.');
    this.accessibility.announce('Main menu ready.', 'polite');
    this.showPanel('menu');
    this.setMusic('menu');
    this.elements.startGameButton.focus();
  }

  openDifficultyOverlay() {
    this.stateMachine.setState(GAME_SCREENS.DIFFICULTY);
    this.elements.difficultyButtons[0]?.focus();
  }

  closeDifficultyOverlay() {
    this.stateMachine.setState(GAME_SCREENS.MENU);
    this.elements.startGameButton.focus();
  }

  showPanel(panelName) {
    if (panelName === 'settings') {
      this.previousPanel = this.activePanel;
    } else {
      this.previousPanel = panelName;
    }
    this.activePanel = panelName;

    const panelMap = {
      menu: this.elements.menuPanel,
      settings: this.elements.settingsPanel,
      scores: this.elements.scoresPanel,
      tutorial: this.elements.tutorialPanel
    };

    Object.entries(panelMap).forEach(([name, panel]) => {
      panel.classList.toggle('panel--visible', name === panelName);
      panel.setAttribute('aria-hidden', String(name !== panelName));
    });

    this.accessibility.focusFirstInteractive(panelMap[panelName]);
  }

  openSettings() {
    this.showPanel('settings');
  }

  handleSettingsInput() {
    const { elements } = this;
    this.settings = {
      ...this.settings,
      difficulty: elements.difficultySelect.value,
      theme: elements.themeSelect.value,
      controlScheme: elements.controlSchemeSelect.value,
      muted: elements.muteToggleInput.checked,
      masterVolume: Number(elements.masterVolumeInput.value) / 100,
      musicVolume: Number(elements.musicVolumeInput.value) / 100,
      sfxVolume: Number(elements.sfxVolumeInput.value) / 100,
      practiceSpeed: Number(elements.practiceSpeedInput.value) / 100,
      effects: {
        ...this.settings.effects,
        crt: elements.crtToggleInput.checked,
        screenShake: elements.screenShakeToggleInput.checked,
        particles: elements.particlesToggleInput.checked,
        reducedFlash: elements.reducedFlashToggleInput.checked,
        reducedMotion: this.prefersReducedMotion || elements.reducedFlashToggleInput.checked
      }
    };

    this.applySettings({ save: true, announce: true });
  }

  syncSettingsToControls() {
    const { elements } = this;
    elements.difficultySelect.value = this.settings.difficulty;
    elements.themeSelect.value = this.settings.theme;
    elements.controlSchemeSelect.value = this.settings.controlScheme;
    elements.masterVolumeInput.value = String(Math.round(this.settings.masterVolume * 100));
    elements.musicVolumeInput.value = String(Math.round(this.settings.musicVolume * 100));
    elements.sfxVolumeInput.value = String(Math.round(this.settings.sfxVolume * 100));
    elements.practiceSpeedInput.value = String(Math.round(this.settings.practiceSpeed * 100));
    elements.muteToggleInput.checked = this.settings.muted;
    elements.crtToggleInput.checked = this.settings.effects.crt;
    elements.screenShakeToggleInput.checked = this.settings.effects.screenShake;
    elements.particlesToggleInput.checked = this.settings.effects.particles;
    elements.reducedFlashToggleInput.checked = this.settings.effects.reducedFlash;

    elements.masterVolumeOutput.textContent = formatPercent(this.settings.masterVolume);
    elements.musicVolumeOutput.textContent = formatPercent(this.settings.musicVolume);
    elements.sfxVolumeOutput.textContent = formatPercent(this.settings.sfxVolume);
    elements.practiceSpeedOutput.textContent = formatPercent(this.settings.practiceSpeed);

    elements.bindingButtons.forEach((button) => {
      const action = button.dataset.bindAction;
      button.textContent = formatBindingLabel(this.settings.keyBindings[action] ?? []);
      button.dataset.listening = 'false';
    });
  }

  applySettings({ save = true, announce = false } = {}) {
    this.syncSettingsToControls();
    this.input.setBindings(this.settings.keyBindings);
    this.audio.applySettings(this.settings);
    this.elements.appShell.classList.remove('theme-classic', 'theme-neon', 'theme-amber', 'no-crt', 'reduced-effects');
    this.elements.appShell.classList.add(`theme-${this.settings.theme}`);
    if (!this.settings.effects.crt) {
      this.elements.appShell.classList.add('no-crt');
    }
    if (this.settings.effects.reducedFlash || this.settings.effects.reducedMotion) {
      this.elements.appShell.classList.add('reduced-effects');
    }

    const coarsePointer = this.window.matchMedia('(pointer: coarse)').matches;
    const showTouchControls = this.settings.controlScheme === 'touch' || (this.settings.controlScheme === 'auto' && coarsePointer);
    this.elements.touchControls.hidden = !showTouchControls;
    this.elements.muteButton.setAttribute('aria-pressed', String(this.settings.muted));
    this.elements.muteButton.textContent = this.settings.muted ? 'Unmute (M)' : 'Mute (M)';

    if (this.currentSession) {
      this.currentSession.updateSettings(this.settings);
    }

    if (save) {
      saveSettings(this.settings);
    }

    if (announce) {
      this.audio.playSound('menu-confirm');
      this.accessibility.setCaption('Settings updated.');
      this.accessibility.announce('Settings updated.', 'polite');
    }
  }

  beginBinding(action, button) {
    this.elements.bindingButtons.forEach((bindingButton) => {
      bindingButton.dataset.listening = 'false';
      bindingButton.textContent = formatBindingLabel(this.settings.keyBindings[bindingButton.dataset.bindAction] ?? []);
    });

    button.dataset.listening = 'true';
    button.textContent = 'Press a key…';
    this.elements.bindingHint.textContent = `Listening for a new ${ACTION_LABELS[action].toLowerCase()} binding.`;

    this.input.startBindingCapture(action, (capturedAction, code) => {
      this.settings.keyBindings = {
        ...this.settings.keyBindings,
        [capturedAction]: [code]
      };
      this.elements.bindingHint.textContent = `${ACTION_LABELS[capturedAction]} set to ${formatKeyCode(code)}.`;
      this.applySettings({ save: true, announce: true });
    });
  }

  createPersistedRunMarker() {
    return {
      levelsCompleted: 0,
      ghostsEaten: 0,
      fruitsCollected: 0,
      pelletsEaten: 0,
      powerPelletsEaten: 0,
      bestGhostChain: 0,
      currentStreak: 0,
      score: 0
    };
  }

  startRun(runMode, difficulty) {
    this.currentSession = new GameSession({
      difficulty,
      runMode,
      settings: this.settings,
      onEvent: (event) => this.handleSessionEvent(event)
    });
    this.persistedRunMarker = this.createPersistedRunMarker();
    this.runFinalized = false;
    this.lastRunConfig = { runMode, difficulty };
    this.stateMachine.setState(runMode === RUN_MODES.DEMO ? GAME_SCREENS.DEMO : GAME_SCREENS.PLAYING);
    this.showPanel(runMode === RUN_MODES.TUTORIAL ? 'tutorial' : 'menu');
    this.accessibility.focusCanvas();
    this.accessibility.setCaption(runMode === RUN_MODES.DEMO ? 'Demo mode active.' : 'Get ready.');
    this.accessibility.announce(
      runMode === RUN_MODES.DEMO ? 'Demo mode started.' : 'Game started. Use arrow keys or WASD to move.',
      'assertive'
    );
    this.setMusic('gameplay', 0.1);
  }

  startDemo() {
    this.startRun(RUN_MODES.DEMO, this.settings.difficulty);
  }

  takeOverDemo() {
    this.accessibility.announce('Demo ended. Starting a playable run.', 'assertive');
    this.startRun(RUN_MODES.NORMAL, this.settings.difficulty);
  }

  restartLastRun() {
    this.startRun(this.lastRunConfig.runMode === RUN_MODES.DEMO ? RUN_MODES.NORMAL : this.lastRunConfig.runMode, this.lastRunConfig.difficulty);
  }

  restartCurrentRun() {
    if (!this.currentSession) {
      return;
    }
    this.startRun(this.currentSession.runMode === RUN_MODES.DEMO ? RUN_MODES.NORMAL : this.currentSession.runMode, this.currentSession.difficulty);
  }

  stopSession({ finalize = true } = {}) {
    if (this.currentSession && finalize) {
      this.syncRunProgress(true);
    }

    this.currentSession = null;
    this.runFinalized = false;
    this.persistedRunMarker = this.createPersistedRunMarker();
    this.lastGameOverSummary = null;
    this.stateMachine.setState(GAME_SCREENS.MENU);
    this.showPanel('menu');
    this.setMusic('menu');
    this.accessibility.setCaption('Main menu ready.');
    this.elements.startGameButton.focus();
  }

  handleSessionEvent(event) {
    switch (event.type) {
      case 'sound':
        if (event.sound === 'level-complete') {
          this.audio.playSound(event.sound);
          this.setMusic('victory');
        } else if (event.sound === 'resume' && this.stateMachine.state !== GAME_SCREENS.PAUSED) {
          this.audio.playSound(event.sound);
          this.setMusic('gameplay', this.getGameplayIntensity());
        } else {
          this.audio.playSound(event.sound);
        }
        break;
      case 'caption':
        this.accessibility.setCaption(event.text);
        break;
      case 'announce':
        this.accessibility.announce(event.text, event.priority);
        break;
      case 'level-complete':
        this.syncRunProgress(false);
        break;
      case 'game-over':
        this.syncRunProgress(true);
        this.lastGameOverSummary = event.summary;
        this.stateMachine.setState(GAME_SCREENS.GAME_OVER);
        this.setMusic('gameOver');
        break;
      default:
        break;
    }
  }

  syncRunProgress(finalize = false) {
    if (!this.currentSession) {
      return;
    }

    const summary = this.currentSession.getRunSummary();
    const marker = this.persistedRunMarker;
    this.stats.totalLevelsCompleted += Math.max(0, summary.levelsCompleted - marker.levelsCompleted);
    this.stats.totalGhostsEaten += Math.max(0, summary.ghostsEaten - marker.ghostsEaten);
    this.stats.totalFruitsCollected += Math.max(0, summary.fruitsCollected - marker.fruitsCollected);
    this.stats.totalPelletsEaten += Math.max(0, summary.pelletsEaten - marker.pelletsEaten);
    this.stats.totalPowerPelletsEaten += Math.max(0, summary.powerPelletsEaten - marker.powerPelletsEaten);
    this.stats.bestGhostChain = Math.max(this.stats.bestGhostChain, summary.bestGhostChain);
    this.stats.bestLevel = Math.max(this.stats.bestLevel, summary.level);
    this.stats.bestStreak = Math.max(this.stats.bestStreak, summary.currentStreak);
    this.stats.highScore = Math.max(this.stats.highScore, summary.score);
    this.persistedRunMarker = {
      levelsCompleted: summary.levelsCompleted,
      ghostsEaten: summary.ghostsEaten,
      fruitsCollected: summary.fruitsCollected,
      pelletsEaten: summary.pelletsEaten,
      powerPelletsEaten: summary.powerPelletsEaten,
      bestGhostChain: summary.bestGhostChain,
      currentStreak: summary.currentStreak,
      score: summary.score
    };

    if (finalize && !this.runFinalized && shouldPersistRun(summary)) {
      this.stats.totalRuns += 1;
      this.stats.lastResult = {
        score: summary.score,
        level: summary.level,
        mode: summary.mode,
        difficulty: summary.difficulty,
        timestamp: new Date().toISOString()
      };
      this.highScores = addHighScoreEntry(this.highScores, {
        score: summary.score,
        level: summary.level,
        mode: summary.mode,
        difficulty: summary.difficulty,
        timestamp: new Date().toISOString()
      });
      this.runFinalized = true;
    }

    const achievementResult = evaluateAchievements(this.stats);
    if (achievementResult.newlyUnlocked.length > 0) {
      this.stats.achievementsUnlocked = achievementResult.unlocked;
      achievementResult.newlyUnlocked.forEach((achievementId) => {
        const achievement = getAchievementById(achievementId);
        if (achievement) {
          this.accessibility.announce(`Achievement unlocked: ${achievement.title}.`, 'assertive');
          this.accessibility.setCaption(`Achievement unlocked: ${achievement.title}.`);
          this.audio.playSound('level-complete');
        }
      });
    }

    saveStats(this.stats);
    saveHighScores(this.highScores);
    this.renderScoresAndStats();
  }

  renderScoresAndStats() {
    const { scoresBody, statsGrid, achievementList } = this.elements;
    scoresBody.innerHTML = '';

    if (this.highScores.length === 0) {
      scoresBody.innerHTML = '<tr><td colspan="4">No scores yet — start chewing through pellets.</td></tr>';
    } else {
      this.highScores.forEach((entry, index) => {
        const row = this.document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${entry.score}</td>
          <td>${entry.level}</td>
          <td>${entry.mode}</td>
        `;
        scoresBody.append(row);
      });
    }

    const statCards = [
      ['High score', this.stats.highScore],
      ['Total runs', this.stats.totalRuns],
      ['Levels cleared', this.stats.totalLevelsCompleted],
      ['Best level', this.stats.bestLevel],
      ['Ghosts eaten', this.stats.totalGhostsEaten],
      ['Fruits collected', this.stats.totalFruitsCollected],
      ['Pellets eaten', this.stats.totalPelletsEaten],
      ['Best streak', this.stats.bestStreak]
    ];
    statsGrid.innerHTML = '';
    statCards.forEach(([label, value]) => {
      const card = this.document.createElement('div');
      card.className = 'stats-card';
      card.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      statsGrid.append(card);
    });

    achievementList.innerHTML = '';
    ACHIEVEMENTS.forEach((achievement) => {
      const item = this.document.createElement('li');
      const unlocked = this.stats.achievementsUnlocked.includes(achievement.id);
      item.textContent = `${unlocked ? '✓' : '○'} ${achievement.title} — ${achievement.description}`;
      achievementList.append(item);
    });
  }

  handleDirection(direction) {
    if (this.currentSession && (this.stateMachine.state === GAME_SCREENS.PLAYING || this.stateMachine.state === GAME_SCREENS.DEMO || this.stateMachine.state === GAME_SCREENS.PAUSED)) {
      this.currentSession.setDesiredDirection(direction);
      if (this.stateMachine.state !== GAME_SCREENS.PAUSED) {
        this.accessibility.focusCanvas();
      }
    }
  }

  handlePauseShortcut() {
    if (!this.currentSession) {
      return;
    }
    this.togglePause();
  }

  togglePause() {
    if (!this.currentSession) {
      return;
    }

    if (this.stateMachine.state === GAME_SCREENS.PAUSED) {
      this.resumeGame();
      return;
    }

    if (this.stateMachine.state === GAME_SCREENS.PLAYING || this.stateMachine.state === GAME_SCREENS.DEMO) {
      this.currentSession.pause();
      this.stateMachine.setState(GAME_SCREENS.PAUSED);
      this.audio.playSound('pause');
      this.setMusic('menu');
      this.elements.resumeButton.focus();
    }
  }

  resumeGame() {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.resume();
    this.stateMachine.setState(this.currentSession.runMode === RUN_MODES.DEMO ? GAME_SCREENS.DEMO : GAME_SCREENS.PLAYING);
    this.audio.playSound('resume');
    this.setMusic('gameplay', this.getGameplayIntensity());
    this.accessibility.focusCanvas();
  }

  toggleMute() {
    this.settings.muted = !this.settings.muted;
    this.applySettings({ save: true, announce: true });
    this.audio.playSound('mute');
  }

  handleConfirmShortcut() {
    if (this.stateMachine.state === GAME_SCREENS.ENTRY) {
      this.enterArcade();
      return;
    }

    const activeElement = this.document.activeElement;
    if (activeElement && activeElement !== this.elements.canvas && typeof activeElement.click === 'function') {
      activeElement.click();
      return;
    }

    if (this.stateMachine.state === GAME_SCREENS.MENU) {
      this.elements.startGameButton.click();
    }
  }

  update(dt) {
    if (this.currentSession) {
      this.currentSession.update(dt);
      if (this.currentSession.runMode !== RUN_MODES.DEMO && this.stateMachine.state === GAME_SCREENS.PLAYING) {
        this.setMusic('gameplay', this.getGameplayIntensity());
      }
      if (this.currentSession.runMode === RUN_MODES.DEMO && this.stateMachine.state === GAME_SCREENS.DEMO) {
        this.setMusic('gameplay', 0.25);
      }
    } else if (this.stateMachine.state === GAME_SCREENS.MENU) {
      this.idleSeconds += dt;
      if (this.idleSeconds >= 18) {
        this.idleSeconds = 0;
        this.startDemo();
      }
    }
  }

  getGameplayIntensity() {
    if (!this.currentSession) {
      return 0;
    }
    const snapshot = this.currentSession.getSnapshot();
    return 1 - snapshot.pelletsRemaining / Math.max(1, snapshot.totalPellets);
  }

  setMusic(key, intensity = 0) {
    const resolved = key === 'gameplay' && intensity > 0.55 ? 'gameplay:intense' : `${key}:base`;
    if (this.currentMusic === resolved) {
      return;
    }

    this.currentMusic = resolved;
    if (!key) {
      this.audio.stopMusic();
      return;
    }

    this.audio.startMusic(key, intensity);
  }

  render(alpha) {
    if (this.currentSession) {
      const snapshot = this.currentSession.getSnapshot();
      this.renderer.render(snapshot, this.settings, alpha);
      this.updateHud(snapshot);
      this.updateOverlays(snapshot);
      return;
    }

    this.renderPlaceholder();
    this.updateHud(null);
    this.updateOverlays(null);
  }

  renderPlaceholder() {
    const context = this.elements.canvas.getContext('2d');
    context.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
    context.fillStyle = '#050510';
    context.fillRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
    context.fillStyle = '#2d5cff';
    context.fillRect(72, 92, this.elements.canvas.width - 144, this.elements.canvas.height - 184);
    context.fillStyle = '#050510';
    context.fillRect(92, 112, this.elements.canvas.width - 184, this.elements.canvas.height - 224);
    context.fillStyle = '#ffe84a';
    context.beginPath();
    context.arc(200, 240, 32, 0.35, Math.PI * 1.65);
    context.lineTo(200, 240);
    context.fill();
    context.fillStyle = '#ff4f5a';
    context.fillRect(420, 205, 54, 40);
    context.fillStyle = '#f7f7ff';
    context.fillRect(434, 220, 8, 8);
    context.fillRect(454, 220, 8, 8);
    context.fillStyle = '#f7f7ff';
    context.font = 'bold 58px sans-serif';
    context.textAlign = 'center';
    context.fillText('PAC-MAN', this.elements.canvas.width / 2, 408);
    context.font = '24px sans-serif';
    context.fillText('Enter the arcade to start your run.', this.elements.canvas.width / 2, 460);
  }

  updateHud(snapshot) {
    if (!snapshot) {
      this.elements.scoreValue.textContent = '0';
      this.elements.livesValue.textContent = '3';
      this.elements.levelValue.textContent = '1';
      this.elements.modeValue.textContent = 'Menu';
      this.elements.streakValue.textContent = String(this.stats.bestStreak ?? 0);
      this.elements.powerTimerFill.style.width = '0%';
      this.elements.powerTimerText.textContent = 'Ready';
      return;
    }

    this.elements.scoreValue.textContent = String(snapshot.score);
    this.elements.livesValue.textContent = snapshot.displayLives;
    this.elements.levelValue.textContent = String(snapshot.level);
    this.elements.streakValue.textContent = String(snapshot.currentStreak);
    this.elements.modeValue.textContent = this.getModeLabel(snapshot);

    const duration = this.currentSession?.levelConfig?.frightenedDuration ?? 1;
    const ratio = snapshot.powerTimer > 0 ? Math.max(0, snapshot.powerTimer / duration) : 0;
    this.elements.powerTimerFill.style.width = `${Math.round(ratio * 100)}%`;
    this.elements.powerTimerText.textContent = snapshot.powerTimer > 0 ? `${snapshot.powerTimer.toFixed(1)}s` : 'Ready';
  }

  getModeLabel(snapshot) {
    if (this.stateMachine.state === GAME_SCREENS.PAUSED) {
      return 'Paused';
    }
    if (this.stateMachine.state === GAME_SCREENS.GAME_OVER) {
      return 'Game Over';
    }
    if (snapshot.phase === 'countdown' || snapshot.phase === 'respawn') {
      return 'Countdown';
    }
    if (snapshot.phase === 'level-complete') {
      return 'Level clear';
    }
    switch (snapshot.runMode) {
      case RUN_MODES.PRACTICE:
        return 'Practice';
      case RUN_MODES.TUTORIAL:
        return 'Tutorial';
      case RUN_MODES.DEMO:
        return 'Demo';
      default:
        return 'Arcade';
    }
  }

  updateOverlays(snapshot) {
    setVisible(this.elements.entryOverlay, this.stateMachine.state === GAME_SCREENS.ENTRY);
    setVisible(this.elements.difficultyOverlay, this.stateMachine.state === GAME_SCREENS.DIFFICULTY);
    setVisible(this.elements.pauseOverlay, this.stateMachine.state === GAME_SCREENS.PAUSED);
    setVisible(this.elements.gameOverOverlay, this.stateMachine.state === GAME_SCREENS.GAME_OVER);
    setVisible(this.elements.levelCompleteOverlay, Boolean(snapshot && snapshot.phase === 'level-complete'));

    const showCountdown = Boolean(snapshot && (snapshot.phase === 'countdown' || snapshot.phase === 'respawn'));
    this.elements.countdownOverlay.setAttribute('aria-hidden', String(!showCountdown));
    this.elements.countdownOverlay.textContent = showCountdown ? String(Math.max(1, Math.ceil(snapshot.phaseTimer))) : '';

    const showDemoBanner = Boolean(snapshot && snapshot.runMode === RUN_MODES.DEMO && this.stateMachine.state !== GAME_SCREENS.GAME_OVER);
    this.elements.demoBanner.setAttribute('aria-hidden', String(!showDemoBanner));

    const showPauseButton = Boolean(snapshot && this.stateMachine.state !== GAME_SCREENS.GAME_OVER && this.stateMachine.state !== GAME_SCREENS.ENTRY && this.stateMachine.state !== GAME_SCREENS.DIFFICULTY);
    this.elements.pauseButton.hidden = !showPauseButton;

    if (snapshot && snapshot.phase === 'level-complete') {
      this.elements.levelCompleteSummary.textContent = `Level ${snapshot.level} cleared — next maze incoming.`;
    }

    if (this.stateMachine.state === GAME_SCREENS.GAME_OVER && this.lastGameOverSummary) {
      this.elements.gameOverSummary.textContent = `Final score: ${this.lastGameOverSummary.score} · Level ${this.lastGameOverSummary.level} · High score ${this.stats.highScore}`;
    }
  }
}
