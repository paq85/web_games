/**
 * Constants used throughout the Flappy Bird game.
 */
(function() {
  const FIELD_WIDTH = 400;
  const FIELD_HEIGHT = 600;
  const PIPE_GAP = 140;
  const GROUND_HEIGHT = 80;

  window.C = Object.freeze({
    // Game dimensions (logical)
    FIELD_WIDTH: FIELD_WIDTH,
    FIELD_HEIGHT: FIELD_HEIGHT,

    // Bird
    BIRD_WIDTH: 34,
    BIRD_HEIGHT: 24,
    BIRD_X: 80,
    BIRD_START_Y: 300,
    GRAVITY: 0.45,
    FLAP_STRENGTH: -7.5,
    MAX_FALL_SPEED: 10,
    ROTATION_MAX: Math.PI / 4,
    ROTATION_SPEED: 0.1,

    // Pipes
    PIPE_WIDTH: 52,
    PIPE_GAP: PIPE_GAP,
    PIPE_SPEED: 2.5,
    PIPE_SPAWN_INTERVAL: 100,
    PIPE_MIN_TOP: 60,
    PIPE_MAX_TOP: FIELD_HEIGHT - GROUND_HEIGHT - PIPE_GAP,

    // Ground
    GROUND_HEIGHT: GROUND_HEIGHT,

    // Scoring
    STORAGE_BEST_SCORE: 'flappy_best_score',

    // Screens
    SCREENS: {
      START: 'start',
      PLAYING: 'playing',
      GAME_OVER: 'game_over',
    },

    // Colors
    COLORS: {
      sky: '#70c5ce',
      skyDark: '#4a9ba9',
      ground: '#ded895',
      groundDark: '#d4c872',
      groundStripe: '#c8b84e',
      pipe: '#73bf2e',
      pipeDark: '#5a9a22',
      pipeLight: '#82d936',
      pipeBorder: '#3d6e15',
      birdBody: '#f5c842',
      birdDark: '#e6a817',
      birdWing: '#e8d44d',
      birdEye: '#ffffff',
      birdPupil: '#333333',
      birdBeak: '#e86020',
      birdBelly: '#fce8ab',
      textPrimary: '#ffffff',
      textShadow: '#543847',
      scoreBg: 'rgba(0, 0, 0, 0.3)',
      medalGold: '#ffd700',
      medalSilver: '#c0c0c0',
      medalBronze: '#cd7f32',
      medalPlatinum: '#e5e4e2',
    },

    // Medal thresholds
    MEDAL_THRESHOLDS: {
      platinum: 40,
      gold: 30,
      silver: 20,
      bronze: 10,
    },
  });
})();
