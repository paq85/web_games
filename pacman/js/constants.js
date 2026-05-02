// === Game Constants ===

// Grid dimensions (classic Pacman)
export const COLS = 28;
export const ROWS = 31;
export const TILE_SIZE = 16;

// Canvas dimensions
export const CANVAS_WIDTH = COLS * TILE_SIZE;  // 448
export const CANVAS_HEIGHT = ROWS * TILE_SIZE; // 496

// Tile types
export const TILE = {
  EMPTY: 0,
  WALL: 1,
  DOT: 2,
  POWER_PELLET: 3,
  GHOST_HOUSE: 4,
  GHOST_DOOR: 5,
  TUNNEL: 6,
};

// Directions
export const DIR = {
  NONE: null,
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

// Direction keys
export const DIR_KEYS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

// Game states
export const STATE = {
  MENU: 'MENU',
  DIFFICULTY: 'DIFFICULTY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  DYING: 'DYING',
  READY: 'READY',
  SETTINGS: 'SETTINGS',
  SCORES: 'SCORES',
  ATTRACT: 'ATTRACT',
  PRACTICE: 'PRACTICE',
};

// Ghost states
export const GHOST_STATE = {
  SCATTER: 'SCATTER',
  CHASE: 'CHASE',
  FRIGHTENED: 'FRIGHTENED',
  EATEN: 'EATEN',
  IN_HOUSE: 'IN_HOUSE',
  LEAVING_HOUSE: 'LEAVING_HOUSE',
};

// Ghost names
export const GHOST_NAME = {
  BLINKY: 'blinky',
  PINKY: 'pinky',
  INKY: 'inky',
  CLYDE: 'clyde',
};

// Colors
export const COLORS = {
  BLACK: '#000000',
  WALL: '#2121DE',
  WALL_BORDER: '#4242FF',
  DOT: '#FFB8AE',
  POWER_PELLET: '#FFB8AE',
  PACMAN: '#FFFF00',
  BLINKY: '#FF0000',
  PINKY: '#FFB8FF',
  INKY: '#00FFFF',
  CLYDE: '#FFB852',
  FRIGHTENED: '#2121FF',
  FRIGHTENED_FLASH: '#FFFFFF',
  EATEN: '#FFFFFF',
  TEXT: '#FFFFFF',
  SCORE: '#FFFFFF',
  HIGH_SCORE_LABEL: '#FF0000',
  READY: '#FFFF00',
  GAME_OVER: '#FF0000',
  FRUIT: '#FF0000',
  GHOST_DOOR: '#FFB8FF',
  HUD: '#FFFFFF',
  MENU_HIGHLIGHT: '#FFFF00',
  MENU_TEXT: '#FFFFFF',
  MENU_DIM: '#888888',
};

// Speeds (tiles per second at base)
export const BASE_SPEED = 9.5; // tiles/second base rate (adjusted per level)

// Speed percentages per level (index 0 = level 1)
export const SPEED_TABLE = [
  // { pacman, ghost, ghostFright, ghostTunnel, frightenTime, flashCount }
  { pacman: 0.80, ghost: 0.75, ghostFright: 0.50, ghostTunnel: 0.40, frightenTime: 6, flashCount: 5 },
  { pacman: 0.90, ghost: 0.85, ghostFright: 0.55, ghostTunnel: 0.45, frightenTime: 5, flashCount: 5 },
  { pacman: 0.90, ghost: 0.85, ghostFright: 0.55, ghostTunnel: 0.45, frightenTime: 4, flashCount: 5 },
  { pacman: 0.90, ghost: 0.85, ghostFright: 0.55, ghostTunnel: 0.45, frightenTime: 3, flashCount: 5 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 2, flashCount: 5 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 5, flashCount: 5 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 2, flashCount: 3 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 2, flashCount: 3 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 1, flashCount: 3 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 5, flashCount: 5 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 2, flashCount: 5 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 1, flashCount: 3 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 1, flashCount: 3 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 3, flashCount: 5 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 1, flashCount: 3 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 1, flashCount: 3 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 0, flashCount: 0 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 1, flashCount: 3 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 0, flashCount: 0 },
  { pacman: 1.00, ghost: 0.95, ghostFright: 0.60, ghostTunnel: 0.50, frightenTime: 0, flashCount: 0 },
];

// Scatter/Chase mode timings (in seconds) - classic pattern
// [scatter, chase, scatter, chase, scatter, chase, scatter, chase_forever]
export const MODE_TIMINGS = [7, 20, 7, 20, 5, 20, 5, Infinity];

// Ghost house release timers (dots eaten thresholds)
export const GHOST_RELEASE_DOTS = {
  blinky: 0,   // starts outside
  pinky: 0,    // released immediately
  inky: 30,    // after 30 dots
  clyde: 60,   // after 60 dots
};

// Scoring
export const SCORE = {
  DOT: 10,
  POWER_PELLET: 50,
  GHOST_BASE: 200,  // doubles each ghost: 200, 400, 800, 1600
  EXTRA_LIFE: 10000,
};

// Fruit definitions per level
export const FRUITS = [
  { name: 'cherry', points: 100, color: '#FF0000' },
  { name: 'strawberry', points: 300, color: '#FF6688' },
  { name: 'orange', points: 500, color: '#FFB852' },
  { name: 'apple', points: 700, color: '#00FF00' },
  { name: 'melon', points: 1000, color: '#00FF99' },
  { name: 'galaxian', points: 2000, color: '#4444FF' },
  { name: 'bell', points: 3000, color: '#FFFF00' },
  { name: 'key', points: 5000, color: '#00FFFF' },
];

// Fruit appear at these dot counts
export const FRUIT_DOT_THRESHOLDS = [70, 170];

// Fruit display duration (seconds)
export const FRUIT_DURATION = 9;

// Difficulty modifiers
export const DIFFICULTY = {
  EASY: { speedMult: 0.85, frightenMult: 1.5, label: 'Easy' },
  MEDIUM: { speedMult: 1.0, frightenMult: 1.0, label: 'Medium' },
  HARD: { speedMult: 1.15, frightenMult: 0.7, label: 'Hard' },
};

// Timing
export const READY_TIME = 2000;     // ms to show "READY!" before level starts
export const DEATH_TIME = 1500;     // ms for death animation
export const LEVEL_FLASH_TIME = 2000; // ms for level complete flashing
export const LEVEL_FLASH_COUNT = 4;
export const ATTRACT_IDLE_TIME = 30000; // ms idle before attract mode starts

// Lives
export const INITIAL_LIVES = 3;
export const MAX_LIVES = 5;

// Ghost scatter corners (tile coordinates)
export const SCATTER_TARGETS = {
  blinky: { x: 25, y: 0 },   // top-right
  pinky: { x: 2, y: 0 },     // top-left
  inky: { x: 27, y: 30 },    // bottom-right
  clyde: { x: 0, y: 30 },    // bottom-left
};

// Ghost house position
export const GHOST_HOUSE = {
  doorX: 13,
  doorY: 12,
  centerX: 13.5,
  centerY: 14.5,
  minX: 11,
  maxX: 16,
  minY: 13,
  maxY: 15,
};

// Pacman start position
export const PACMAN_START = { x: 13.5, y: 23 };

// Ghost start positions
export const GHOST_START = {
  blinky: { x: 13.5, y: 11 },
  pinky: { x: 13.5, y: 14 },
  inky: { x: 11.5, y: 14 },
  clyde: { x: 15.5, y: 14 },
};

// Tunnel positions (y=14 on left/right edges for classic maze)
export const TUNNEL_Y = 14;
export const TUNNEL_LEFT = { x: 0, y: 14 };
export const TUNNEL_RIGHT = { x: 27, y: 14 };

// Animation
export const PACMAN_ANIM_SPEED = 8; // frames per mouth cycle
export const GHOST_ANIM_SPEED = 10;
export const PELLET_BLINK_SPEED = 15; // frames per blink cycle
