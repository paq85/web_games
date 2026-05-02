export const GRID_WIDTH = 21;
export const GRID_HEIGHT = 21;

export const TILE = {
  WALL: '#',
  PATH: '.',
  EMPTY: ' ',
  HOUSE: 'H',
  DOOR: 'D',
  START: 'S',
  GHOST: 'G',
  POWER: 'o'
};

export const DIRECTIONS = {
  up: { name: 'up', dx: 0, dy: -1, opposite: 'down' },
  down: { name: 'down', dx: 0, dy: 1, opposite: 'up' },
  left: { name: 'left', dx: -1, dy: 0, opposite: 'right' },
  right: { name: 'right', dx: 1, dy: 0, opposite: 'left' }
};

export const DIRECTION_ORDER = ['up', 'left', 'down', 'right'];

export const ACTIONS = ['up', 'down', 'left', 'right', 'confirm', 'pause', 'mute'];

export const ACTION_LABELS = {
  up: 'Move up',
  down: 'Move down',
  left: 'Move left',
  right: 'Move right',
  confirm: 'Confirm / select',
  pause: 'Pause',
  mute: 'Mute'
};

export const KEY_LABELS = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Space: 'Space',
  Enter: 'Enter',
  Escape: 'Esc',
  KeyW: 'W',
  KeyA: 'A',
  KeyS: 'S',
  KeyD: 'D',
  KeyM: 'M'
};

export const DEFAULT_BINDINGS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  confirm: ['Enter', 'Space'],
  pause: ['Escape'],
  mute: ['KeyM']
};

export const STORAGE_KEYS = {
  settings: 'paq85-pacman-settings-v1',
  stats: 'paq85-pacman-stats-v1'
};

export const COLORS = {
  background: '#060816',
  wall: '#4368ff',
  wallGlow: 'rgba(64, 104, 255, 0.24)',
  pellet: '#f7f1d6',
  powerPellet: '#fff1a5',
  pacman: '#ffd94d',
  blinky: '#ff5a5f',
  pinky: '#ff7ccf',
  inky: '#61f2ff',
  clyde: '#ff9d4d',
  frightened: '#4368ff',
  frightenedBlink: '#f7f1d6',
  door: '#d0d4ff',
  text: '#f4f7ff',
  hud: '#11162b',
  fruitText: '#111427'
};

export const POWER_PELLET_POINTS = 50;
export const GHOST_EAT_POINTS = [200, 400, 800, 1600];
export const BONUS_FRUIT_LIFETIME = 12000;
export const COUNTDOWN_START = 3;
export const LEVEL_BETWEEN_DELAY = 900;
export const RESPAWN_DELAY = 1200;
export const DEMO_IDLE_DELAY = 30000;
export const MODE_FADE_DELAY = 700;

export const FRUITS = [
  { id: 'cherry', name: 'Cherry', points: 100, color: '#ff5b5f', accent: '#8b1320', symbol: '🍒' },
  { id: 'strawberry', name: 'Strawberry', points: 300, color: '#ff3b79', accent: '#ffd5e0', symbol: '🍓' },
  { id: 'orange', name: 'Orange', points: 500, color: '#ff9d4d', accent: '#7c3f0a', symbol: '🍊' },
  { id: 'apple', name: 'Apple', points: 700, color: '#ff6767', accent: '#3d0c11', symbol: '🍎' },
  { id: 'melon', name: 'Melon', points: 1000, color: '#8cff7a', accent: '#235a20', symbol: '🍉' },
  { id: 'galaxian', name: 'Galaxian', points: 1200, color: '#7ad8ff', accent: '#0c3551', symbol: '✨' },
  { id: 'bell', name: 'Bell', points: 1500, color: '#ffe06f', accent: '#8d5d00', symbol: '🔔' },
  { id: 'key', name: 'Key', points: 2000, color: '#d4dbff', accent: '#3a476f', symbol: '🔑' }
];

const scatterSchedule = [
  { mode: 'scatter', seconds: 7 },
  { mode: 'chase', seconds: 20 },
  { mode: 'scatter', seconds: 7 },
  { mode: 'chase', seconds: 20 },
  { mode: 'scatter', seconds: 5 },
  { mode: 'chase', seconds: Infinity }
];

export const DIFFICULTIES = {
  easy: {
    label: 'Easy',
    ghostSpeed: 0.84,
    pacmanSpeed: 1,
    frightenedSeconds: 8,
    fruitInterval: 26,
    ghostReleaseSpacing: 0.3,
    modeSchedule: scatterSchedule.map((entry, index) => ({
      ...entry,
      seconds: entry.seconds === Infinity ? Infinity : entry.seconds + (index === 0 ? 2 : 1.5)
    }))
  },
  medium: {
    label: 'Medium',
    ghostSpeed: 1,
    pacmanSpeed: 1,
    frightenedSeconds: 6,
    fruitInterval: 22,
    ghostReleaseSpacing: 0.45,
    modeSchedule: scatterSchedule
  },
  hard: {
    label: 'Hard',
    ghostSpeed: 1.18,
    pacmanSpeed: 1,
    frightenedSeconds: 4.2,
    fruitInterval: 18,
    ghostReleaseSpacing: 0.55,
    modeSchedule: scatterSchedule.map((entry, index) => ({
      ...entry,
      seconds: entry.seconds === Infinity ? Infinity : Math.max(4, entry.seconds - (index === 0 ? 2 : 1.5))
    }))
  }
};

export const GHOST_NAMES = {
  blinky: 'Blinky',
  pinky: 'Pinky',
  inky: 'Inky',
  clyde: 'Clyde'
};

export const GHOST_COLORS = {
  blinky: COLORS.blinky,
  pinky: COLORS.pinky,
  inky: COLORS.inky,
  clyde: COLORS.clyde
};

export const GHOST_SCATTER_TARGETS = {
  blinky: { x: GRID_WIDTH - 2, y: 1 },
  pinky: { x: 1, y: 1 },
  inky: { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2 },
  clyde: { x: 1, y: GRID_HEIGHT - 2 }
};

export const DEFAULT_FRUIT_SPAWN = { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) + 3 };
export const DEFAULT_PACMAN_START = { x: Math.floor(GRID_WIDTH / 2), y: GRID_HEIGHT - 4 };

export function cloneDirection(direction) {
  return direction ? { ...direction } : null;
}

export function getDirection(name) {
  return DIRECTIONS[name] || null;
}

export function oppositeDirection(name) {
  return DIRECTIONS[name]?.opposite ?? null;
}

export function directionFromKey(code) {
  switch (code) {
    case 'ArrowUp':
    case 'KeyW':
      return 'up';
    case 'ArrowDown':
    case 'KeyS':
      return 'down';
    case 'ArrowLeft':
    case 'KeyA':
      return 'left';
    case 'ArrowRight':
    case 'KeyD':
      return 'right';
    default:
      return null;
  }
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomFrom(array, random = Math.random) {
  return array[Math.floor(random() * array.length)];
}
