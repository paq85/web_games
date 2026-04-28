/**
 * Main game state machine and entry point.
 */
const Game = (function() {
  let screen = C.SCREENS.ATTRACT;
  let prevScreen = null;
  let settings = null;
  let stats = null;

  // Game state
  let gameState = null;
  let matchWinner = 0;
  let aiState = null;
  let aiDifficulty = 'medium';
  let gameMode = '2p'; // '2p', 'ai', 'practice'

  // Menu state
  let menuIndex = 0;
  let menuItems = [];
  let menuSubMode = null;
  let menuSubHint = '';
  let rebindingAction = null;

  // Timing
  let countdownTimer = 0;
  let countdownLastBeep = 0;
  let pointBreakTimer = 0;
  let lastTime = 0;
  let animFrameId = null;
  let idleTimer = 0;

  // Attract mode
  let attractState = null;
  let attractAI1 = null;
  let attractAI2 = null;
  let attractResetTimer = 0;

  function init() {
    settings = loadSettings();
    stats = loadStats();

    Audio.init();
    Audio.setVolumes(settings.masterVolume, settings.musicVolume, settings.sfxVolume);
    Audio.setMute(settings.muted);

    const canvas = document.getElementById('game-canvas');
    Renderer.init(canvas);
    Renderer.setTheme(settings.theme);
    Renderer.setScanlines(settings.crtEffect);

    Input.init();

    // Pause on blur
    window.addEventListener('blur', () => {
      if (settings.pauseOnBlur && screen === C.SCREENS.PLAYING) {
        pauseGame();
      }
    });

    // Start attract mode
    startAttract();
    gameLoop(0);
  }

  function startAttract() {
    screen = C.SCREENS.ATTRACT;
    attractState = createGameState(11, settings.paddleSize, false);
    attractAI1 = createAIState('medium');
    attractAI2 = createAIState('medium');
    Audio.stopMusic();
    Audio.playMenuMusic();
  }

  function goToMainMenu() {
    screen = C.SCREENS.MAIN_MENU;
    menuIndex = 0;
    menuSubMode = null;
    Audio.stopMusic();
    Audio.playMenuMusic();
  }

  function startMatch(mode, difficulty) {
    gameMode = mode;
    aiDifficulty = difficulty || 'medium';
    gameState = createGameState(settings.winScore, settings.paddleSize, mode === 'practice');

    if (mode === 'ai') {
      aiState = createAIState(aiDifficulty);
    }

    screen = C.SCREENS.COUNTDOWN;
    countdownTimer = C.COUNTDOWN_DURATION;
    gameState.servingDir = 1;
    Audio.stopMusic();
    Audio.playGameMusic();
    Audio.SFX.serve();
  }

  function pauseGame() {
    if (screen !== C.SCREENS.PLAYING) return;
    screen = C.SCREENS.PAUSED;
    prevScreen = C.SCREENS.PLAYING;
    Audio.SFX.pause();
  }

  function resumeGame() {
    if (screen !== C.SCREENS.PAUSED) return;
    screen = C.SCREENS.PLAYING;
    Audio.SFX.resume();
  }

  function handleMainMenu() {
    const items = ['PLAY', 'STATS', 'SETTINGS', 'DEMO MODE'];
    const keys = settings.controls;

    if (Input.consumePress(keys.p1Up) || Input.consumePress(keys.p2Up)) {
      menuIndex = (menuIndex - 1 + items.length) % items.length;
      Audio.SFX.menuNavigate();
    } else if (Input.consumePress(keys.p1Down) || Input.consumePress(keys.p2Down)) {
      menuIndex = (menuIndex + 1) % items.length;
      Audio.SFX.menuNavigate();
    }

    if (Input.consumePress(keys.confirm) || Input.consumePress('Space')) {
      Audio.SFX.menuConfirm();
      if (items[menuIndex] === 'PLAY') {
        screen = C.SCREENS.MODE_SELECT;
        menuIndex = 0;
      } else if (items[menuIndex] === 'STATS') {
        screen = C.SCREENS.SETTINGS;
        menuIndex = 10; // stats is item index 10 in settings
        menuSubMode = null;
      } else if (items[menuIndex] === 'SETTINGS') {
        screen = C.SCREENS.SETTINGS;
        menuIndex = 0;
        menuSubMode = null;
      } else if (items[menuIndex] === 'DEMO MODE') {
        startAttract();
      }
    }

    if (Input.consumePress(keys.mute)) {
      settings.muted = !settings.muted;
      Audio.setMute(settings.muted);
      saveSettings(settings);
      Audio.SFX.settingsChange();
    }

    return { selectedIndex: menuIndex, muted: settings.muted };
  }

  function handleModeSelect() {
    const items = ['2 PLAYERS', 'VS AI', 'PRACTICE', '< BACK'];
    const keys = settings.controls;

    if (Input.consumePress(keys.p1Up) || Input.consumePress(keys.p2Up)) {
      menuIndex = (menuIndex - 1 + items.length) % items.length;
      Audio.SFX.menuNavigate();
    } else if (Input.consumePress(keys.p1Down) || Input.consumePress(keys.p2Down)) {
      menuIndex = (menuIndex + 1) % items.length;
      Audio.SFX.menuNavigate();
    }

    if (Input.consumePress(keys.confirm) || Input.consumePress('Space')) {
      Audio.SFX.menuConfirm();
      if (items[menuIndex] === '2 PLAYERS') {
        startMatch('2p');
      } else if (items[menuIndex] === 'VS AI') {
        screen = C.SCREENS.DIFFICULTY_SELECT;
        menuIndex = ['easy', 'medium', 'hard', 'impossible'].indexOf(settings.aiDifficulty);
      } else if (items[menuIndex] === 'PRACTICE') {
        startMatch('practice');
      } else if (items[menuIndex] === '< BACK') {
        goToMainMenu();
      }
    }

    if (Input.consumePress(keys.pause)) {
      goToMainMenu();
    }

    return { selectedIndex: menuIndex };
  }

  function handleDifficultySelect() {
    const items = ['EASY', 'MEDIUM', 'HARD', 'IMPOSSIBLE', '< BACK'];
    const keys = settings.controls;

    if (Input.consumePress(keys.p1Up) || Input.consumePress(keys.p2Up)) {
      menuIndex = (menuIndex - 1 + items.length) % items.length;
      Audio.SFX.menuNavigate();
    } else if (Input.consumePress(keys.p1Down) || Input.consumePress(keys.p2Down)) {
      menuIndex = (menuIndex + 1) % items.length;
      Audio.SFX.menuNavigate();
    }

    if (Input.consumePress(keys.confirm) || Input.consumePress('Space')) {
      Audio.SFX.menuConfirm();
      if (menuIndex < 4) {
        settings.aiDifficulty = items[menuIndex].toLowerCase();
        saveSettings(settings);
        startMatch('ai', settings.aiDifficulty);
      } else {
        screen = C.SCREENS.MODE_SELECT;
        menuIndex = 0;
      }
    }

    if (Input.consumePress(keys.pause)) {
      screen = C.SCREENS.MODE_SELECT;
      menuIndex = 0;
    }

    return { selectedIndex: menuIndex };
  }

  function handleSettings() {
    const keys = settings.controls;
    const items = [
      'musicVol', 'sfxVol', 'matchLength', 'paddleSize',
      'crtEffect', 'screenShake', 'reducedFlash', 'theme',
      'pauseOnBlur', 'controls', 'stats', 'back'
    ];

    if (Input.consumePress(keys.p1Up) || Input.consumePress(keys.p2Up)) {
      menuIndex = (menuIndex - 1 + items.length) % items.length;
      Audio.SFX.menuNavigate();
    } else if (Input.consumePress(keys.p1Down) || Input.consumePress(keys.p2Down)) {
      menuIndex = (menuIndex + 1) % items.length;
      Audio.SFX.menuNavigate();
    }

    if (menuSubMode) {
      handleSettingsSub(items[menuIndex], keys);
      return { selectedIndex: menuIndex, muted: settings.muted, subMode: menuSubMode, subHint: menuSubHint };
    }

    if (Input.consumePress(keys.confirm) || Input.consumePress('Space')) {
      Audio.SFX.menuConfirm();
      if (items[menuIndex] === 'back') {
        screen = prevScreen || C.SCREENS.MAIN_MENU;
        menuIndex = 0;
        menuSubMode = null;
        return { selectedIndex: menuIndex, muted: settings.muted };
      }

      // Enter sub-mode for this setting
      const setting = items[menuIndex];
      if (setting === 'musicVol' || setting === 'sfxVol' || setting === 'matchLength' ||
          setting === 'paddleSize' || setting === 'theme') {
        menuSubMode = setting;
        menuSubHint = getSubHint(setting);
      } else if (setting === 'controls') {
        rebindingAction = 'p1Up';
        menuSubMode = 'rebinding';
        menuSubHint = `Press any key for P1 UP [${rebindingAction}]`;
      } else if (setting === 'stats') {
        menuSubMode = 'stats';
        menuSubHint = 'Press ENTER to go back';
      } else {
        // Toggle boolean settings
        toggleSetting(setting);
        Audio.SFX.settingsChange();
      }
    }

    if (Input.consumePress(keys.pause)) {
      screen = prevScreen || C.SCREENS.MAIN_MENU;
      menuIndex = 0;
      menuSubMode = null;
    }

    return { selectedIndex: menuIndex, muted: settings.muted, subMode: menuSubMode, subHint: menuSubHint };
  }

  function getSubHint(setting) {
    switch (setting) {
      case 'musicVol': return 'UP/DOWN: Volume  LEFT/RIGHT: Fine-tune';
      case 'sfxVol': return 'UP/DOWN: Volume  LEFT/RIGHT: Fine-tune';
      case 'matchLength': return 'UP/DOWN: Select match length';
      case 'paddleSize': return 'UP/DOWN: Select paddle size';
      case 'theme': return 'UP/DOWN: Select theme';
      default: return '';
    }
  }

  function handleSettingsSub(setting, keys) {
    if (menuSubMode === 'rebinding') {
      // Wait for any key press
      for (const code in Input._getJustPressed()) {
        if (Input._getJustPressed()[code]) {
          rebindControl(settings, rebindingAction, code);
          saveSettings(settings);
          Audio.SFX.settingsChange();

          // Move to next control
          const actions = ['p1Up', 'p1Down', 'p2Up', 'p2Down', 'confirm', 'pause', 'mute'];
          const idx = actions.indexOf(rebindingAction);
          if (idx < actions.length - 1) {
            rebindingAction = actions[idx + 1];
            menuSubHint = `Press any key for ${rebindingAction.toUpperCase()} [${code}]`;
          } else {
            rebindingAction = null;
            menuSubMode = null;
            menuSubHint = '';
          }
          return;
        }
      }
      if (Input.consumePress(keys.pause)) {
        rebindingAction = null;
        menuSubMode = null;
        menuSubHint = '';
      }
      return;
    }

    if (menuSubMode === 'stats') {
      if (Input.consumePress(keys.confirm) || Input.consumePress('Space') || Input.consumePress(keys.pause)) {
        menuSubMode = null;
        menuSubHint = '';
      }
      return;
    }

    if (Input.consumePress('ArrowLeft') || Input.consumePress(keys.p1Up)) {
      adjustSetting(setting, -1);
      Audio.SFX.settingsChange();
    } else if (Input.consumePress('ArrowRight') || Input.consumePress(keys.p1Down)) {
      adjustSetting(setting, 1);
      Audio.SFX.settingsChange();
    }

    if (Input.consumePress(keys.confirm) || Input.consumePress('Space')) {
      menuSubMode = null;
      menuSubHint = '';
    }

    if (Input.consumePress(keys.pause)) {
      menuSubMode = null;
      menuSubHint = '';
    }
  }

  function adjustSetting(setting, dir) {
    switch (setting) {
      case 'musicVol':
        settings.musicVolume = Math.max(0, Math.min(1, settings.musicVolume + dir * 0.1));
        Audio.setVolumes(settings.masterVolume, settings.musicVolume, settings.sfxVolume);
        break;
      case 'sfxVol':
        settings.sfxVolume = Math.max(0, Math.min(1, settings.sfxVolume + dir * 0.1));
        Audio.setVolumes(settings.masterVolume, settings.musicVolume, settings.sfxVolume);
        break;
      case 'matchLength':
        settings.winScore = dir > 0 ? 11 : 5;
        break;
      case 'paddleSize': {
        const sizes = ['small', 'medium', 'large'];
        let idx = sizes.indexOf(settings.paddleSize);
        idx = (idx + dir + sizes.length) % sizes.length;
        settings.paddleSize = sizes[idx];
        break;
      }
      case 'theme': {
        const themes = Object.keys(C.THEMES);
        let idx = themes.indexOf(settings.theme);
        idx = (idx + dir + themes.length) % themes.length;
        settings.theme = themes[idx];
        Renderer.setTheme(settings.theme);
        break;
      }
    }
    saveSettings(settings);
  }

  function toggleSetting(setting) {
    switch (setting) {
      case 'crtEffect':
        settings.crtEffect = !settings.crtEffect;
        Renderer.setScanlines(settings.crtEffect);
        break;
      case 'screenShake':
        settings.screenShake = !settings.screenShake;
        break;
      case 'reducedFlash':
        settings.reducedFlash = !settings.reducedFlash;
        break;
      case 'pauseOnBlur':
        settings.pauseOnBlur = !settings.pauseOnBlur;
        break;
    }
    saveSettings(settings);
  }

  function handleCountdown(dt) {
    countdownTimer -= dt;

    if (countdownTimer <= 0) {
      screen = C.SCREENS.PLAYING;
      Audio.SFX.countdownGo();
      countdownLastBeep = 0;
      return;
    }

    const count = Math.ceil(countdownTimer);
    if (count !== countdownLastBeep) {
      Audio.SFX.countdown();
      countdownLastBeep = count;
    }

    Renderer.renderCountdown(count, gameState);
  }

  function handlePlaying(dt) {
    const keys = settings.controls;

    if (Input.consumePress(keys.pause)) {
      pauseGame();
      return;
    }

    if (Input.consumePress(keys.mute)) {
      settings.muted = !settings.muted;
      Audio.setMute(settings.muted);
      saveSettings(settings);
      Audio.SFX.settingsChange();
    }

    // Player inputs
    const p1Input = Input.getPlayer1Input(keys);
    let p2Input = Input.getPlayer2Input(keys);

    // AI input
    if (gameMode === 'ai') {
      p2Input = updateAI(aiState, gameState.ball, gameState.paddle2, performance.now() / 1000);
    }

    // Game tick
    const result = tickGameState(gameState, p1Input, p2Input);
    gameState = result.state;

    // Handle events
    if (result.events.paddleHit) {
      Audio.SFX.paddleHit();
      if (settings.screenShake) Renderer.addShake(2);
      if (!settings.reducedFlash) Renderer.addFlash(0.05);
      const hitPaddle = result.events.paddleHit === 1 ? gameState.paddle1 : gameState.paddle2;
      Renderer.spawnParticles(
        hitPaddle.x + hitPaddle.width / 2,
        gameState.ball.y,
        theme().ball,
        5
      );
    }

    if (result.events.wallHit) {
      Audio.SFX.wallHit();
      if (settings.screenShake) Renderer.addShake(1);
    }

    if (result.events.scored) {
      const scorer = result.events.scored;
      if (scorer === 1) {
        Audio.SFX.pointScore();
        Renderer.spawnParticles(0, gameState.ball.y, theme().paddle1, 15);
      } else {
        Audio.SFX.pointConcede();
        Renderer.spawnParticles(C.FIELD_WIDTH, gameState.ball.y, theme().paddle2, 15);
      }
      if (settings.screenShake) Renderer.addShake(5);
      if (!settings.reducedFlash) Renderer.addFlash(0.15);

      // If match is over, go directly to results
      if (result.events.matchOver) {
        const winner = result.events.winner;
        matchWinner = winner;
        stats = recordMatch(stats, gameState.score1, gameState.score2, winner, gameMode === 'ai');
        if (winner === 1) Audio.SFX.matchWin();
        else Audio.SFX.matchLose();
        if (settings.screenShake) Renderer.addShake(8);
        if (!settings.reducedFlash) Renderer.addFlash(0.3);
        screen = C.SCREENS.RESULTS;
        Audio.stopMusic();
        Audio.playMenuMusic();
        return;
      }

      // Reset ball and go to point break
      gameState = resetBallAfterScore(gameState);
      screen = C.SCREENS.POINT_BREAK;
      pointBreakTimer = C.POINT_BREAK_DURATION;
      return;
    }

    if (result.events.matchOver) {
      const winner = result.events.winner;
      matchWinner = winner;
      stats = recordMatch(stats, gameState.score1, gameState.score2, winner, gameMode === 'ai');
      if (winner === 1) Audio.SFX.matchWin();
      else Audio.SFX.matchLose();

      if (settings.screenShake) Renderer.addShake(8);
      if (!settings.reducedFlash) Renderer.addFlash(0.3);

      screen = C.SCREENS.RESULTS;
      Audio.stopMusic();
      Audio.playMenuMusic();
      return;
    }

    // Reset rally hits for serve (handled in point break)
    Renderer.renderGame(gameState, performance.now() / 1000);
  }

  function handlePointBreak(dt) {
    pointBreakTimer -= dt;
    Renderer.renderGame(gameState, performance.now() / 1000);

    if (pointBreakTimer <= 0) {
      screen = C.SCREENS.COUNTDOWN;
      countdownTimer = C.COUNTDOWN_DURATION;
      Audio.SFX.serve();
    }
  }

  function handleResults() {
    const keys = settings.controls;

    if (Input.consumePress(keys.confirm) || Input.consumePress('Space')) {
      Audio.SFX.menuConfirm();
      // Rematch
      startMatch(gameMode, aiDifficulty);
      return;
    }

    if (Input.consumePress(keys.pause)) {
      Audio.SFX.menuConfirm();
      goToMainMenu();
      return;
    }

    if (Input.consumePress(keys.mute)) {
      settings.muted = !settings.muted;
      Audio.setMute(settings.muted);
      saveSettings(settings);
    }

    Renderer.renderResults(gameState, matchWinner, stats);
  }

  function handleAttract(dt) {
    const keys = settings.controls;

    if (Input.consumePress(keys.confirm) || Input.consumePress('Space')) {
      Audio.SFX.menuConfirm();
      goToMainMenu();
      return;
    }

    if (Input.consumePress(keys.mute)) {
      settings.muted = !settings.muted;
      Audio.setMute(settings.muted);
      saveSettings(settings);
    }

    // Handle ball reset after scoring
    if (attractResetTimer > 0) {
      attractResetTimer -= dt;
      if (attractResetTimer <= 0) {
        attractState = resetBallAfterScore(attractState);
      }
      Renderer.renderAttract(attractState);
      return;
    }

    // Run AI vs AI
    const ai1Input = updateAI(attractAI1, attractState.ball, attractState.paddle1, performance.now() / 1000);
    const ai2Input = updateAI(attractAI2, attractState.ball, attractState.paddle2, performance.now() / 1000);

    const result = tickGameState(attractState, ai1Input, ai2Input);
    attractState = result.state;

    // Reset ball if scored (with delay)
    if (result.events.scored) {
      attractResetTimer = 1.0;
    }

    Renderer.renderAttract(attractState);
  }

  function theme() {
    return C.THEMES[settings.theme] || C.THEMES.classic;
  }

  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    switch (screen) {
      case C.SCREENS.ATTRACT:
        handleAttract(dt);
        break;
      case C.SCREENS.MAIN_MENU: {
        const menuState = handleMainMenu();
        Renderer.renderMainMenu(menuState);
        break;
      }
      case C.SCREENS.MODE_SELECT: {
        const menuState = handleModeSelect();
        Renderer.renderModeSelect(menuState);
        break;
      }
      case C.SCREENS.DIFFICULTY_SELECT: {
        const menuState = handleDifficultySelect();
        Renderer.renderDifficultySelect(menuState);
        break;
      }
      case C.SCREENS.COUNTDOWN:
        handleCountdown(dt);
        break;
      case C.SCREENS.PLAYING:
        handlePlaying(dt);
        break;
      case C.SCREENS.PAUSED: {
        const keys = settings.controls;
        if (Input.consumePress(keys.pause) || Input.consumePress(keys.confirm) || Input.consumePress('Space')) {
          resumeGame();
        }
        if (Input.consumePress(keys.mute)) {
          settings.muted = !settings.muted;
          Audio.setMute(settings.muted);
          saveSettings(settings);
        }
        Renderer.renderPaused(gameState);
        break;
      }
      case C.SCREENS.POINT_BREAK:
        handlePointBreak(dt);
        break;
      case C.SCREENS.RESULTS:
        handleResults();
        break;
      case C.SCREENS.SETTINGS: {
        const menuState = handleSettings();
        Renderer.renderSettings(settings, menuState);
        break;
      }
    }

    Input.endFrame();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  // Expose for testing/debugging
  return {
    init,
    getScreen: () => screen,
    getSettings: () => settings,
    getStats: () => stats,
    getGameState: () => gameState,
  };
})();

// Expose on window for testing and external access
window.Game = Game;

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
