import {
  GAME_STATES,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLATFORM_TYPES,
  POWERUP_TYPES,
  POWERUP_DURATION,
} from './constants.js';
import {
  gameState,
  player,
  platforms,
  collectibles,
  cameraY,
  score,
  highScore,
  activePowerups,
  resetGame,
  setGameState,
  setHighScore,
  getHighScore,
  updateScore,
  updateCamera,
  checkGameOver,
  updateActivePowerups,
  clearPowerups,
  getPowerupProgress,
  hasPowerup,
} from './state.js';
import {
  resetCoinBonus,
  getCoinBonus,
  checkCollectibleCollisions,
} from './collectibles.js';
import {
  updatePhysics,
  checkPlatformCollisions,
  updateMovingPlatforms,
  updateBrokenPlatforms,
  cleanupPlatforms,
  cleanupCollectibles,
} from './physics.js';
import {
  generateInitialPlatforms,
  generateMorePlatforms,
  removeOffscreenPlatforms,
} from './platforms.js';
import {
  getInput,
  isPausePressed,
  resetPauseFlag,
  setupInput,
  updateKeyBindings,
} from './input.js';
import {
  initAudio,
  playSFX,
  startMusic,
  stopGameMusic,
  getSettings,
  updateSetting,
  initSettingsUI,
  setupSettingsListeners,
  getAudioContext,
} from './audio.js';
import {
  initRenderer,
  render,
  resizeCanvas,
} from './renderer.js';
import {
  showMenu,
  showPauseMenu,
  resumeGame,
  showGameOver,
  showSettings,
  showHighScores,
  startCountdown,
  handlePauseInput,
  setupMenuListeners,
  updateHUD,
  announce,
} from './ui.js';
import {
  loadSettings,
  saveSettings,
  addHighScore,
  updateStats,
  loadHighScores,
} from './persistence.js';

let lastTime = 0;
let animFrameId = null;

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  if (gameState === GAME_STATES.PLAYING) {
    update(dt);
  }

  render();
  animFrameId = requestAnimationFrame(gameLoop);
}

function update(dt) {
  const input = getInput();

  // Handle pause
  if (isPausePressed()) {
    handlePauseInput();
    resetPauseFlag();
    return;
  }

  // Update physics
  updatePhysics(input, dt);

  // Check platform collisions
  const collision = checkPlatformCollisions(platforms);
  if (collision) {
    switch (collision.type) {
      case 'bounce':
        playSFX('bounce');
        break;
      case 'spring':
        playSFX('spring');
        break;
      case 'break':
        playSFX('break');
        break;
      case 'monster':
        handleMonsterCollision();
        return;
      case 'vine':
        playSFX('bounce');
        break;
    }
  }

  // Update moving platforms
  updateMovingPlatforms(dt);

  // Update broken platforms
  updateBrokenPlatforms();

  // Check collectible collisions
  checkCollectibleCollisions();

  // Update score
  updateScore();

  // Update camera
  updateCamera();

  // Generate more platforms
  generateMorePlatforms();

  // Clean up offscreen platforms and collectibles
  cleanupPlatforms();
  cleanupCollectibles();

  // Update active powerups
  updateActivePowerups(dt);

  // Check game over
  if (checkGameOver()) {
    handleGameOver();
    return;
  }

  // Update HUD
  updateHUD();
}

function handleMonsterCollision() {
  playSFX('monster');
  stopGameMusic();
  announce('Hit a monster! Game over.', true);
  setTimeout(() => {
    const finalScore = score + getCoinBonus();
    showGameOver(finalScore);
    const scores = addHighScore(finalScore);
    const isNewHigh = finalScore > getHighScore();
    if (isNewHigh) {
      setHighScore(finalScore);
    }
    updateStats(finalScore, getCoinBonus());
  }, 500);
}

function handleGameOver() {
  playSFX('gameover');
  stopGameMusic();

  const coinBonus = getCoinBonus();
  const finalScore = score + coinBonus;

  announce(`Game over. Score: ${finalScore}`, true);

  setTimeout(() => {
    showGameOver(finalScore);

    const scores = addHighScore(finalScore);
    const isNewHigh = finalScore > getHighScore();
    if (isNewHigh) {
      setHighScore(finalScore);
      playSFX('highscore');
      announce('New high score!', true);
    }

    updateStats(finalScore, coinBonus);
  }, 300);
}

function startGame() {
  initAudio();
  resumeAudio();

  resetGame();
  resetCoinBonus();
  generateInitialPlatforms();

  setGameState(GAME_STATES.COUNTDOWN);

  startCountdown(() => {
    startMusic('game');
  });
}

function quitToMenu() {
  stopGameMusic();
  clearPowerups();
  showMenu();
}

function resumeAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

function setupGame() {
  const canvas = document.getElementById('game-canvas');
  const container = document.getElementById('game-container');

  // Initialize renderer
  initRenderer(canvas);

  // Setup input
  setupInput(canvas);

  // Make updateKeyBindings available globally for audio.js rebinding
  window.updateKeyBindings = updateKeyBindings;

  // Expose game state for testing
  window.player = player;
  window.checkGameOver = checkGameOver;
  window.setGameState = setGameState;

  // Setup menu listeners
  setupMenuListeners({
    startGame,
    quitToMenu,
  });

  // Setup settings listeners
  setupSettingsListeners();

  // Initialize settings UI
  initSettingsUI();

  // Load high score
  const scores = loadHighScores();
  if (scores.length > 0) {
    setHighScore(scores[0].score);
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    resizeCanvas(container);
  });

  // Initial resize
  resizeCanvas(container);

  // Focus canvas for keyboard input
  canvas.focus();

  // Show main menu
  showMenu();

  // Start game loop
  lastTime = 0;
  window._frameCount = (window._frameCount || 0) + 1;
  animFrameId = requestAnimationFrame(gameLoop);
}

// Handle first user interaction for audio
function initAudioOnInteraction() {
  initAudio();
  document.removeEventListener('click', initAudioOnInteraction);
  document.removeEventListener('keydown', initAudioOnInteraction);
}

document.addEventListener('click', initAudioOnInteraction, { once: true });
document.addEventListener('keydown', initAudioOnInteraction, { once: true });

export { setupGame };
