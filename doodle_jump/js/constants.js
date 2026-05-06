export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 600;

export const GRAVITY = 0.4;
export const BOUNCE_VELOCITY = -10;
export const SPRING_BOOST_VELOCITY = -18;
export const JETPACK_VELOCITY = -6;
export const VINE_CLIMB_SPEED = 4;
export const HORIZONTAL_ACCELERATION = 0.6;
export const HORIZONTAL_MAX_SPEED = 6;
export const HORIZONTAL_FRICTION = 0.88;
export const HORIZONTAL_WRAP = true;

export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 40;

export const PLATFORM_WIDTH = 60;
export const PLATFORM_HEIGHT = 15;
export const PLATFORM_GAP_MIN = 55;
export const PLATFORM_GAP_MAX = 85;
export const PLATFORM_GAP_TIGHTEN = 0.0003;

export const PLATFORM_TYPES = {
  NORMAL: 'normal',
  MOVING: 'moving',
  BREAKABLE: 'breakable',
  SPRING: 'spring',
  VINE: 'vine',
  MONSTER: 'monster',
};

export const POWERUP_TYPES = {
  COIN: 'coin',
  JETPACK: 'jetpack',
  UFO: 'ufo',
  PAPER: 'paper',
};

export const POWERUP_DURATION = {
  JETPACK: 3000,
  UFO: 4000,
  PAPER: 5000,
};

export const SCREEN_EDGE_MARGIN = 10;

export const COUNTDOWN_SECONDS = 3;

export const MAX_HIGH_SCORES = 10;

export const DEFAULT_SETTINGS = {
  masterVolume: 80,
  musicVolume: 70,
  sfxVolume: 80,
  muted: false,
  reducedMotion: false,
  reducedEffects: false,
  paperTexture: true,
  controls: {
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    pause: ['Escape', 'KeyP'],
  },
};

export const STORAGE_KEYS = {
  SETTINGS: 'doodle_jump_settings',
  HIGH_SCORES: 'doodle_jump_highscores',
  STATS: 'doodle_jump_stats',
};

export const PLATFORM_COLORS = {
  normal: '#8B7355',
  moving: '#5B8DB8',
  breakable: '#A0522D',
  spring: '#6db37e',
  vine: '#4a7c59',
  monster: '#c0392b',
};

export const POWERUP_COLORS = {
  coin: '#f1c40f',
  jetpack: '#e74c3c',
  ufo: '#9b59b6',
  paper: '#ecf0f1',
};

export const PLATFORM_DISTRIBUTION = {
  normal: { base: 0.5, min: 0.2 },
  moving: { base: 0.15, max: 0.3 },
  breakable: { base: 0.15, max: 0.35 },
  spring: { base: 0.1, max: 0.2 },
  vine: { base: 0.05, max: 0.1 },
  monster: { base: 0.05, max: 0.15 },
};

export const POWERUP_SPAWN_CHANCE = {
  coin: 0.3,
  jetpack: 0.02,
  ufo: 0.015,
  paper: 0.015,
};

export const GAME_STATES = {
  MENU: 'menu',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  SETTINGS: 'settings',
  HIGH_SCORES: 'high_scores',
};
