import { GAME_STATES, PLAYER_WIDTH, PLAYER_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

export let gameState = GAME_STATES.MENU;
export let score = 0;
export let highScore = 0;
export let cameraY = 0;
export let isPracticeMode = false;
export let activePowerups = {};
let countdownValue = 3;
let countdownTimer = null;

export const player = {
  x: 200,
  y: 400,
  vx: 0,
  vy: 0,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  facing: 1,
  onGround: false,
  isJumping: false,
};

export let platforms = [];
export let collectibles = [];
let highestY = 0;

export function resetGame() {
  player.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
  player.y = CANVAS_HEIGHT - 150;
  player.vx = 0;
  player.vy = 0;
  player.facing = 1;
  player.onGround = false;
  player.isJumping = false;
  score = 0;
  cameraY = 0;
  highestY = player.y;
  platforms = [];
  collectibles = [];
  activePowerups = {};
  countdownValue = 3;
  if (countdownTimer) {
    clearTimeout(countdownTimer);
    countdownTimer = null;
  }
}

export function setGameState(newState) {
  gameState = newState;
}

export function getHighestScore() {
  return highestY;
}

export function updateScore() {
  const currentHeight = Math.max(0, Math.floor((CANVAS_HEIGHT - player.y) / 10));
  if (currentHeight > score) {
    score = currentHeight;
  }
}

export function updateCamera() {
  const threshold = CANVAS_HEIGHT * 0.4;
  if (player.y < threshold) {
    const diff = threshold - player.y;
    cameraY -= diff;
    player.y = threshold;

    platforms.forEach(p => {
      p.y += diff;
      if (p.type === 'moving') {
        p.startX += 0;
      }
    });

    collectibles.forEach(c => {
      c.y += diff;
    });
  }
}

export function checkGameOver() {
  if (player.y > CANVAS_HEIGHT + player.height) {
    return true;
  }
  return false;
}

export function addActivePowerup(type, duration) {
  activePowerups[type] = {
    remaining: duration,
    total: duration,
  };
}

export function updateActivePowerups(dt) {
  for (const type in activePowerups) {
    activePowerups[type].remaining -= dt;
    if (activePowerups[type].remaining <= 0) {
      delete activePowerups[type];
    }
  }
}

export function hasPowerup(type) {
  return type in activePowerups;
}

export function getPowerupProgress(type) {
  if (!activePowerups[type]) return 0;
  return activePowerups[type].remaining / activePowerups[type].total;
}

export function clearPowerups() {
  activePowerups = {};
}

export function setHighScore(newScore) {
  highScore = newScore;
}

export function getHighScore() {
  return highScore;
}

export function resetCountdown(callback) {
  countdownValue = 3;
  if (countdownTimer) {
    clearTimeout(countdownTimer);
  }
}
