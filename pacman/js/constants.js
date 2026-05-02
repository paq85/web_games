export const GAME_SCREENS = {
  ENTRY: 'entry',
  MENU: 'menu',
  SETTINGS: 'settings',
  SCORES: 'scores',
  TUTORIAL: 'tutorial',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game-over',
  DIFFICULTY: 'difficulty',
  DEMO: 'demo'
};

export const RUN_MODES = {
  NORMAL: 'normal',
  PRACTICE: 'practice',
  TUTORIAL: 'tutorial',
  DEMO: 'demo'
};

export const GHOST_STATES = {
  HOUSE: 'house',
  SCATTER: 'scatter',
  CHASE: 'chase',
  FRIGHTENED: 'frightened',
  EATEN: 'eaten'
};

export const DIRECTIONS = ['up', 'left', 'down', 'right'];

export const DIRECTION_VECTORS = {
  up: { x: 0, y: -1, angle: -Math.PI / 2 },
  down: { x: 0, y: 1, angle: Math.PI / 2 },
  left: { x: -1, y: 0, angle: Math.PI },
  right: { x: 1, y: 0, angle: 0 }
};

export const OPPOSITE_DIRECTION = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left'
};

export const TILE = {
  WALL: '#',
  PELLET: '.',
  POWER: 'o',
  EMPTY: ' ',
  DOOR: '='
};

export const PASSABLE_TILES = new Set([TILE.PELLET, TILE.POWER, TILE.EMPTY, TILE.DOOR]);
export const PACMAN_PASSABLE_TILES = new Set([TILE.PELLET, TILE.POWER, TILE.EMPTY]);

export const STORAGE_KEYS = {
  SETTINGS: 'paq85.pacman.settings',
  SCORES: 'paq85.pacman.scores',
  STATS: 'paq85.pacman.stats'
};

export const DEFAULT_KEY_BINDINGS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  confirm: ['Enter', 'Space'],
  pause: ['Escape'],
  mute: ['KeyM']
};

export const ACTION_LABELS = {
  up: 'Move up',
  down: 'Move down',
  left: 'Move left',
  right: 'Move right',
  confirm: 'Confirm / select',
  pause: 'Pause',
  mute: 'Mute'
};

export const TOUCH_SWIPE_THRESHOLD = 28;
export const HIGH_SCORE_LIMIT = 10;
export const BASE_LIVES = 3;
export const FIXED_TIMESTEP = 1 / 60;
