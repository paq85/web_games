/**
 * Constants used throughout the game.
 */
const C = Object.freeze({
  // Game dimensions (logical)
  FIELD_WIDTH: 800,
  FIELD_HEIGHT: 600,

  // Paddle
  PADDLE_WIDTH: 15,
  PADDLE_HEIGHTS: { small: 60, medium: 90, large: 120 },
  PADDLE_SPEED: 7,
  PADDLE_MARGIN: 30,

  // Ball
  BALL_SIZE: 12,
  BALL_SPEED_MIN: 5,
  BALL_SPEED_MAX: 14,
  BALL_SPEED_INCREMENT: 0.5,
  BALL_ANGULAR_MAX: Math.PI / 3.5,

  // Scoring
  DEFAULT_WIN_SCORE: 11,
  SHORT_WIN_SCORE: 5,
  WIN_BY: 2,

  // Countdown
  COUNTDOWN_DURATION: 1.5,
  POINT_BREAK_DURATION: 1.0,

  // AI
  AI_DIFFICULTIES: ['easy', 'medium', 'hard', 'impossible'],

  // Screens
  SCREENS: {
    ATTRACT: 'attract',
    MAIN_MENU: 'main_menu',
    MODE_SELECT: 'mode_select',
    DIFFICULTY_SELECT: 'difficulty_select',
    COUNTDOWN: 'countdown',
    PLAYING: 'playing',
    PAUSED: 'paused',
    POINT_BREAK: 'point_break',
    RESULTS: 'results',
    SETTINGS: 'settings',
    PRACTICE: 'practice',
  },

  // Themes
  THEMES: {
    classic: {
      name: 'Classic',
      bg: '#0a0a0a',
      fg: '#ffffff',
      accent: '#ffff00',
      paddle1: '#ffffff',
      paddle2: '#ffffff',
      ball: '#ffffff',
      divider: '#333333',
    },
    neon: {
      name: 'Neon',
      bg: '#0a0020',
      fg: '#00ffcc',
      accent: '#ff00ff',
      paddle1: '#00ffcc',
      paddle2: '#ff00ff',
      ball: '#ffff00',
      divider: '#1a0040',
    },
    amber: {
      name: 'Amber',
      bg: '#1a0e00',
      fg: '#ffbf00',
      accent: '#ff8800',
      paddle1: '#ffbf00',
      paddle2: '#ffbf00',
      ball: '#ffcc00',
      divider: '#3d2200',
    },
    green: {
      name: 'Green Phosphor',
      bg: '#000d00',
      fg: '#00ff00',
      accent: '#33ff33',
      paddle1: '#00ff00',
      paddle2: '#00ff00',
      ball: '#33ff33',
      divider: '#003300',
    },
  },

  // Default controls
  DEFAULT_CONTROLS: {
    p1Up: 'KeyW',
    p1Down: 'KeyS',
    p2Up: 'ArrowUp',
    p2Down: 'ArrowDown',
    confirm: 'Enter',
    pause: 'Escape',
    mute: 'KeyM',
  },

  // Storage keys
  STORAGE_SETTINGS: 'pong_settings',
  STORAGE_STATS: 'pong_stats',
});
