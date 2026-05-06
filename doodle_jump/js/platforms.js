import {
  PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
  PLATFORM_GAP_MIN,
  PLATFORM_GAP_MAX,
  PLATFORM_GAP_TIGHTEN,
  PLATFORM_TYPES,
  PLATFORM_DISTRIBUTION,
  POWERUP_SPAWN_CHANCE,
  POWERUP_TYPES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './constants.js';
import { cameraY, platforms, collectibles } from './state.js';

// Track consecutive unsafe platforms and X distribution of safe ones
let consecutiveUnsafeCount = 0;
const recentSafeXPositions = [];
const MAX_CONSECUTIVE_UNSAFE = 2;
const RECENT_SAFE_HISTORY = 5;

const UNSAFE_TYPES = new Set([PLATFORM_TYPES.BREAKABLE, PLATFORM_TYPES.MONSTER]);
const SAFE_TYPES = [
  { type: PLATFORM_TYPES.NORMAL, weight: 0.6 },
  { type: PLATFORM_TYPES.SPRING, weight: 0.15 },
  { type: PLATFORM_TYPES.VINE, weight: 0.15 },
  { type: PLATFORM_TYPES.MOVING, weight: 0.1 },
];

function pickWeightedSafeType() {
  const totalWeight = SAFE_TYPES.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  for (const safe of SAFE_TYPES) {
    random -= safe.weight;
    if (random <= 0) return safe.type;
  }
  return SAFE_TYPES[0].type;
}

function getCanvasThird(x) {
  const thirdWidth = CANVAS_WIDTH / 3;
  if (x < thirdWidth) return 0;
  if (x < thirdWidth * 2) return 1;
  return 2;
}

function ensureReachability(type, x) {
  const isUnsafe = UNSAFE_TYPES.has(type);

  if (isUnsafe && consecutiveUnsafeCount >= MAX_CONSECUTIVE_UNSAFE) {
    type = pickWeightedSafeType();
  }

  if (!UNSAFE_TYPES.has(type)) {
    recentSafeXPositions.push(x);
    if (recentSafeXPositions.length > RECENT_SAFE_HISTORY) {
      recentSafeXPositions.shift();
    }

    if (recentSafeXPositions.length >= 3) {
      const recentThirds = new Set(recentSafeXPositions.map(getCanvasThird));
      if (recentThirds.size === 1) {
        const currentThird = getCanvasThird(x);
        const availableThirds = [0, 1, 2].filter(t => t !== currentThird);
        const newThird = availableThirds[Math.floor(Math.random() * availableThirds.length)];
        const thirdWidth = CANVAS_WIDTH / 3;
        x = newThird * thirdWidth + Math.random() * (thirdWidth - PLATFORM_WIDTH);
        x = Math.max(0, Math.min(CANVAS_WIDTH - PLATFORM_WIDTH, x));
        recentSafeXPositions[recentSafeXPositions.length - 1] = x;
      }
    }

    consecutiveUnsafeCount = 0;
  } else {
    consecutiveUnsafeCount++;
  }

  return { type, x };
}

function getRandomType(height) {
  const heightFactor = Math.min(height / 10000, 1);

  const types = Object.keys(PLATFORM_DISTRIBUTION);
  const weights = types.map(type => {
    const config = PLATFORM_DISTRIBUTION[type];
    let weight = config.base;
    if (heightFactor > 0) {
      if (config.max) {
        weight = config.base + (config.max - config.base) * heightFactor;
      }
      if (type === PLATFORM_TYPES.NORMAL) {
        weight = config.base - config.base * heightFactor * 0.6;
      }
    }
    return Math.max(0.02, weight);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < types.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return types[i];
    }
  }

  return PLATFORM_TYPES.NORMAL;
}

function generatePlatform(y, height) {
  let type = getRandomType(height);
  let x = Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH);

  const corrected = ensureReachability(type, x);
  type = corrected.type;
  x = corrected.x;

  const platform = {
    type,
    x,
    y,
    width: PLATFORM_WIDTH,
    height: PLATFORM_HEIGHT,
    broken: false,
    visible: true,
    breakTimer: 0,
  };

  if (type === PLATFORM_TYPES.MOVING) {
    platform.speed = (1 + Math.random() * 2) * (Math.random() < 0.5 ? 1 : -1);
  }

  if (type === PLATFORM_TYPES.SPRING) {
    platform.springX = x + PLATFORM_WIDTH / 2 - 10;
    platform.springWidth = 20;
    platform.springHeight = 12;
  }

  // Chance to add collectible
  if (Math.random() < POWERUP_SPAWN_CHANCE.coin) {
    collectibles.push({
      type: POWERUP_TYPES.COIN,
      x: x + PLATFORM_WIDTH / 2 - 8,
      y: y - 25,
      width: 16,
      height: 16,
      collected: false,
      visible: true,
      value: 10,
    });
  }

  // Chance for special powerup
  const powerupRoll = Math.random();
  let cumulative = 0;
  for (const [ptype, chance] of Object.entries(POWERUP_SPAWN_CHANCE)) {
    if (ptype === 'coin') continue;
    cumulative += chance;
    if (powerupRoll < cumulative) {
      collectibles.push({
        type: ptype,
        x: x + PLATFORM_WIDTH / 2 - 12,
        y: y - 40,
        width: 24,
        height: 24,
        collected: false,
        visible: true,
      });
      break;
    }
  }

  return platform;
}

export function generateInitialPlatforms() {
  consecutiveUnsafeCount = 0;
  recentSafeXPositions.length = 0;

  // Starting platform (always normal, centered)
  platforms.push({
    type: PLATFORM_TYPES.NORMAL,
    x: CANVAS_WIDTH / 2 - PLATFORM_WIDTH / 2,
    y: CANVAS_HEIGHT - 80,
    width: PLATFORM_WIDTH,
    height: PLATFORM_HEIGHT,
    broken: false,
    visible: true,
    breakTimer: 0,
  });

  let y = CANVAS_HEIGHT - 80 - (PLATFORM_GAP_MIN + PLATFORM_GAP_MAX) / 2;
  let height = 0;

  while (y > -200) {
    const platform = generatePlatform(y, height);
    platforms.push(platform);
    const gap = PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
    y -= gap;
    height += gap;
  }
}

export function generateMorePlatforms() {
  const highestPlatform = platforms.reduce((min, p) => Math.min(min, p.y), Infinity);

  if (highestPlatform > -100) {
    const currentHeight = Math.max(0, Math.floor(-cameraY / 10));
    const gap = PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
    const newY = highestPlatform - gap;
    const platform = generatePlatform(newY, currentHeight);
    platforms.push(platform);
  }
}

export function resetPlatformGenerators() {
  consecutiveUnsafeCount = 0;
  recentSafeXPositions.length = 0;
}

export function getPlatformGenState() {
  return { consecutiveUnsafeCount, recentSafeXPositions: [...recentSafeXPositions] };
}

export function removeOffscreenPlatforms() {
  const visiblePlatforms = platforms.filter(p => p.y < CANVAS_HEIGHT + 200 && p.visible !== false);
  platforms.splice(0, platforms.length, ...visiblePlatforms);
  collectibles.forEach(c => {
    if (c.y > CANVAS_HEIGHT + 200) {
      c.visible = false;
    }
  });
  const visibleCollectibles = collectibles.filter(c => c.visible !== false);
  collectibles.splice(0, collectibles.length, ...visibleCollectibles);
}
