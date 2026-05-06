import {
  GAME_STATES,
  MAX_HIGH_SCORES,
} from './constants.js';
import {
  gameState,
  score,
  highScore,
  setGameState,
  getHighScore,
  setHighScore,
} from './state.js';
import {
  loadHighScores,
  saveHighScores,
  addHighScore,
  loadStats,
  updateStats,
} from './persistence.js';
import { playSFX, startMusic, stopGameMusic, toggleMute, getSettings } from './audio.js';

function showScreen(screenId) {
  const screens = [
    'main-menu',
    'countdown',
    'pause-menu',
    'game-over',
    'settings-menu',
    'highscores-menu',
  ];

  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === screenId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  const hud = document.getElementById('hud');
  if (hud) {
    if (screenId === null || screenId === 'game-canvas') {
      hud.classList.remove('hidden');
    } else {
      hud.classList.add('hidden');
    }
  }
}

export function announce(message, assertive) {
  const el = document.getElementById(assertive ? 'urgent-announcer' : 'announcer');
  if (el) {
    el.textContent = '';
    setTimeout(() => { el.textContent = message; }, 100);
  }
}

export function showMenu() {
  setGameState(GAME_STATES.MENU);
  showScreen('main-menu');
  startMusic('menu');
  announce('Doodle Jump main menu. Use arrow keys to move, ESC to pause.');
}

export function showPauseMenu() {
  setGameState(GAME_STATES.PAUSED);
  showScreen('pause-menu');
  playSFX('pause');
  announce('Game paused. Press ESC or P to resume.');
}

export function resumeGame() {
  setGameState(GAME_STATES.PLAYING);
  showScreen(null);
  playSFX('pause');
  announce('Game resumed.');
}

export function showGameOver(finalScore) {
  setGameState(GAME_STATES.GAME_OVER);
  showScreen('game-over');

  const scoreEl = document.getElementById('game-over-score');
  const highscoreEl = document.getElementById('game-over-highscore');
  const newHighEl = document.getElementById('new-highscore-msg');

  if (scoreEl) scoreEl.textContent = `Score: ${finalScore}`;
  if (highscoreEl) highscoreEl.textContent = `Best: ${getHighScore()}`;

  if (newHighEl) {
    if (finalScore > getHighScore()) {
      newHighEl.classList.remove('hidden');
    } else {
      newHighEl.classList.add('hidden');
    }
  }

  stopGameMusic();
  playSFX('gameover');

  if (finalScore > getHighScore()) {
    setHighScore(finalScore);
    playSFX('highscore');
    announce(`New high score! Your score is ${finalScore}.`, true);
  } else {
    announce(`Game over. Your score is ${finalScore}. Best is ${getHighScore()}.`, true);
  }
}

export function showSettings() {
  setGameState(GAME_STATES.SETTINGS);
  showScreen('settings-menu');
  playSFX('menuSelect');
  announce('Settings screen.');
}

export function showHighScores() {
  setGameState(GAME_STATES.HIGH_SCORES);
  showScreen('highscores-menu');
  playSFX('menuSelect');
  renderHighScores();
  announce('High scores screen.');
}

function renderHighScores() {
  const listEl = document.getElementById('highscores-list');
  const statsEl = document.getElementById('player-stats');

  if (!listEl) return;

  const scores = loadHighScores();
  listEl.innerHTML = '';

  if (scores.length === 0) {
    listEl.innerHTML = '<div class="score-entry"><span>No scores yet</span></div>';
  } else {
    scores.forEach((entry, i) => {
      const div = document.createElement('div');
      div.className = 'score-entry';
      div.setAttribute('role', 'listitem');

      const date = new Date(entry.date);
      const dateStr = date.toLocaleDateString();

      div.innerHTML = `
        <span class="rank">${i + 1}.</span>
        <span class="score-val">${entry.score}</span>
        <span class="date">${dateStr}</span>
      `;
      listEl.appendChild(div);
    });
  }

  if (statsEl) {
    const stats = loadStats();
    statsEl.innerHTML = `
      <span>Runs played:</span><strong>${stats.totalRuns || 0}</strong>
      <span>Best score:</span><strong>${stats.bestScore || 0}</strong>
      <span>Coins collected:</span><strong>${stats.totalCoins || 0}</strong>
      <span>Distance climbed:</span><strong>${stats.totalDistance || 0}</strong>
    `;
  }
}

export function startCountdown(callback) {
  setGameState(GAME_STATES.COUNTDOWN);
  showScreen('countdown');

  const countdownEl = document.querySelector('.countdown-number');
  let count = 3;

  if (countdownEl) {
    countdownEl.textContent = count;
  }

  playSFX('menuNavigate');

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      if (countdownEl) {
        countdownEl.textContent = count;
        countdownEl.style.animation = 'none';
        countdownEl.offsetHeight; // Trigger reflow
        countdownEl.style.animation = '';
      }
      playSFX('menuNavigate');
    } else {
      clearInterval(interval);
      if (countdownEl) countdownEl.textContent = 'GO!';
      playSFX('menuSelect');

      setTimeout(() => {
        showScreen(null);
        setGameState(GAME_STATES.PLAYING);
        if (callback) callback();
      }, 500);
    }
  }, 800);
}

export function handlePauseInput() {
  if (gameState === GAME_STATES.PLAYING) {
    showPauseMenu();
  } else if (gameState === GAME_STATES.PAUSED) {
    resumeGame();
  }
}

export function handleMuteToggle() {
  const muted = toggleMute();
  if (muted) {
    announce('Audio muted.', true);
  } else {
    announce('Audio unmuted.');
  }
}

export function setupMenuListeners(gameActions) {
  // Main menu buttons
  document.getElementById('btn-play').addEventListener('click', () => {
    playSFX('menuSelect');
    gameActions.startGame();
  });

  document.getElementById('btn-highscores').addEventListener('click', () => {
    playSFX('menuSelect');
    showHighScores();
  });

  document.getElementById('btn-settings').addEventListener('click', () => {
    playSFX('menuSelect');
    showSettings();
  });

  // Pause menu buttons
  document.getElementById('btn-resume').addEventListener('click', () => {
    playSFX('menuSelect');
    resumeGame();
  });

  document.getElementById('btn-pause-settings').addEventListener('click', () => {
    playSFX('menuSelect');
    showSettings();
  });

  document.getElementById('btn-pause-quit').addEventListener('click', () => {
    playSFX('menuSelect');
    gameActions.quitToMenu();
  });

  // Game over buttons
  document.getElementById('btn-rematch').addEventListener('click', () => {
    playSFX('menuSelect');
    gameActions.startGame();
  });

  document.getElementById('btn-go-menu').addEventListener('click', () => {
    playSFX('menuSelect');
    gameActions.quitToMenu();
  });

  // Settings buttons
  document.getElementById('btn-settings-back').addEventListener('click', () => {
    playSFX('menuSelect');
    showMenu();
  });

  // High scores button
  document.getElementById('btn-hs-back').addEventListener('click', () => {
    playSFX('menuSelect');
    showMenu();
  });

  // Pause button (HUD)
  document.getElementById('pause-btn').addEventListener('click', () => {
    handlePauseInput();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') {
      handleMuteToggle();
    }
    if ((e.code === 'Escape' || e.code === 'KeyP') && (gameState === GAME_STATES.PLAYING || gameState === GAME_STATES.PAUSED)) {
      handlePauseInput();
    }
  });
}

export function updateHUD() {
  const scoreDisplay = document.getElementById('score-display');
  if (scoreDisplay) {
    scoreDisplay.textContent = `Score: ${score}`;
  }
}

export function announceScore(newScore) {
  announce(`Score: ${newScore}`);
}

export function announceGameOver(finalScore) {
  announce(`Game over. Score: ${finalScore}`, true);
}

export function announceHighScore() {
  announce('New high score!', true);
}
