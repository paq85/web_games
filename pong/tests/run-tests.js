/**
 * Simple test runner for Node.js.
 */
const assert = require('assert');

let passed = 0;
let failed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL: ${name}`);
    console.log(`        ${e.message}`);
  }
}

function describe(suiteName, fn) {
  console.log(`\n${suiteName}`);
  fn();
}

function report() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed}/${total} passed, ${failed} failed`);
  console.log('='.repeat(50));
  process.exit(failed > 0 ? 1 : 0);
}

// Mock C (constants) for Node.js
const C = Object.freeze({
  FIELD_WIDTH: 800,
  FIELD_HEIGHT: 600,
  PADDLE_WIDTH: 15,
  PADDLE_HEIGHTS: { small: 60, medium: 90, large: 120 },
  PADDLE_SPEED: 7,
  PADDLE_MARGIN: 30,
  BALL_SIZE: 12,
  BALL_SPEED_MIN: 5,
  BALL_SPEED_MAX: 14,
  BALL_SPEED_INCREMENT: 0.5,
  BALL_ANGULAR_MAX: Math.PI / 3.5,
  DEFAULT_WIN_SCORE: 11,
  SHORT_WIN_SCORE: 5,
  WIN_BY: 2,
  AI_DIFFICULTIES: ['easy', 'medium', 'hard', 'impossible'],
  STORAGE_SETTINGS: 'pong_settings',
  STORAGE_STATS: 'pong_stats',
  DEFAULT_CONTROLS: {
    p1Up: 'KeyW',
    p1Down: 'KeyS',
    p2Up: 'ArrowUp',
    p2Down: 'ArrowDown',
    confirm: 'Enter',
    pause: 'Escape',
    mute: 'KeyM',
  },
});

// Make C globally available for modules that need it
global.C = C;

// Mock localStorage for Node.js
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val; },
  removeItem: (key) => { delete mockStorage[key]; },
};

// Mock setTimeout for AI testing
global.setTimeout = (fn, ms) => { fn(); };

// Load modules
const game = require('../js/game.js');
const ai = require('../js/ai.js');
const settings = require('../js/settings.js');
const stats = require('../js/stats.js');

// ===== GAME LOGIC TESTS =====
describe('Ball Creation', () => {
  test('creates ball at center of field', () => {
    const ball = game.createBall(1);
    assert.strictEqual(ball.x, C.FIELD_WIDTH / 2);
    assert.strictEqual(ball.y, C.FIELD_HEIGHT / 2);
  });

  test('ball has minimum speed', () => {
    const ball = game.createBall(1);
    assert.ok(ball.speed >= C.BALL_SPEED_MIN - 0.01);
    assert.ok(ball.speed <= C.BALL_SPEED_MIN + 0.01);
  });

  test('ball serves in correct direction', () => {
    const ballRight = game.createBall(1);
    assert.ok(ballRight.vx > 0);
    const ballLeft = game.createBall(-1);
    assert.ok(ballLeft.vx < 0);
  });

  test('ball has some vertical velocity', () => {
    const ball = game.createBall(1);
    assert.ok(Math.abs(ball.vy) < C.BALL_SPEED_MIN);
  });
});

describe('Paddle Creation', () => {
  test('left paddle is at correct position', () => {
    const paddle = game.createPaddle(true);
    assert.strictEqual(paddle.x, C.PADDLE_MARGIN);
  });

  test('right paddle is at correct position', () => {
    const paddle = game.createPaddle(false);
    assert.strictEqual(paddle.x, C.FIELD_WIDTH - C.PADDLE_MARGIN - C.PADDLE_WIDTH);
  });

  test('paddle starts centered vertically', () => {
    const paddle = game.createPaddle(true, 'medium');
    const expectedY = C.FIELD_HEIGHT / 2 - C.PADDLE_HEIGHTS.medium / 2;
    assert.strictEqual(paddle.y, expectedY);
  });

  test('paddle height matches selected size', () => {
    assert.strictEqual(game.createPaddle(true, 'small').height, C.PADDLE_HEIGHTS.small);
    assert.strictEqual(game.createPaddle(true, 'medium').height, C.PADDLE_HEIGHTS.medium);
    assert.strictEqual(game.createPaddle(true, 'large').height, C.PADDLE_HEIGHTS.large);
  });
});

describe('Paddle Movement', () => {
  test('moves paddle up', () => {
    const paddle = game.createPaddle(true);
    const moved = game.movePaddle(paddle, -1);
    assert.strictEqual(moved.y, paddle.y - C.PADDLE_SPEED);
  });

  test('moves paddle down', () => {
    const paddle = game.createPaddle(true);
    const moved = game.movePaddle(paddle, 1);
    assert.strictEqual(moved.y, paddle.y + C.PADDLE_SPEED);
  });

  test('clamps paddle at top boundary', () => {
    const paddle = { ...game.createPaddle(true), y: 2 };
    const moved = game.movePaddle(paddle, -1);
    assert.strictEqual(moved.y, 0);
  });

  test('clamps paddle at bottom boundary', () => {
    const paddle = game.createPaddle(true, 'medium');
    const maxY = C.FIELD_HEIGHT - paddle.height;
    const testPaddle = { ...paddle, y: maxY + 5 };
    const moved = game.movePaddle(testPaddle, 1);
    assert.strictEqual(moved.y, maxY);
  });

  test('no movement with zero input', () => {
    const paddle = game.createPaddle(true);
    const moved = game.movePaddle(paddle, 0);
    assert.strictEqual(moved.y, paddle.y);
  });
});

describe('Ball-Paddle Collision', () => {
  test('detects collision when ball touches paddle face', () => {
    const paddle = game.createPaddle(true);
    const ball = { x: paddle.x + paddle.width + 1, y: paddle.y + paddle.height / 2 };
    assert.strictEqual(game.ballCollidesPaddle(ball, paddle), true);
  });

  test('no collision when ball is far from paddle', () => {
    const paddle = game.createPaddle(true);
    const ball = { x: 200, y: 300 };
    assert.strictEqual(game.ballCollidesPaddle(ball, paddle), false);
  });

  test('no collision when ball is above paddle', () => {
    const paddle = game.createPaddle(true);
    const ball = { x: paddle.x + paddle.width + 1, y: paddle.y - 20 };
    assert.strictEqual(game.ballCollidesPaddle(ball, paddle), false);
  });

  test('no collision when ball is below paddle', () => {
    const paddle = game.createPaddle(true);
    const ball = { x: paddle.x + paddle.width + 1, y: paddle.y + paddle.height + 20 };
    assert.strictEqual(game.ballCollidesPaddle(ball, paddle), false);
  });

  test('collision at paddle edge', () => {
    const paddle = game.createPaddle(true);
    const ball = { x: paddle.x + paddle.width, y: paddle.y + 1 };
    assert.strictEqual(game.ballCollidesPaddle(ball, paddle), true);
  });
});

describe('Ball Reflection', () => {
  test('ball bounces back from left paddle', () => {
    const paddle = game.createPaddle(true);
    const ball = { x: paddle.x + paddle.width, y: paddle.y + paddle.height / 2, vx: -3, vy: 0, speed: 5 };
    const reflected = game.reflectBall(ball, paddle);
    assert.ok(reflected.vx > 0, 'Ball should move right after hitting left paddle');
  });

  test('ball bounces back from right paddle', () => {
    const paddle = game.createPaddle(false);
    const ball = { x: paddle.x, y: paddle.y + paddle.height / 2, vx: 3, vy: 0, speed: 5 };
    const reflected = game.reflectBall(ball, paddle);
    assert.ok(reflected.vx < 0, 'Ball should move left after hitting right paddle');
  });

  test('central contact produces shallow angle', () => {
    const paddle = game.createPaddle(true);
    const ball = { x: paddle.x + paddle.width, y: paddle.y + paddle.height / 2, vx: -5, vy: 0, speed: 5 };
    const reflected = game.reflectBall(ball, paddle);
    assert.ok(Math.abs(reflected.vy) < 2, 'Central hit should have minimal vertical velocity');
  });

  test('edge contact produces steep angle', () => {
    const paddle = game.createPaddle(true);
    const ball = { x: paddle.x + paddle.width, y: paddle.y + 2, vx: -5, vy: 0, speed: 5 };
    const reflected = game.reflectBall(ball, paddle);
    assert.ok(Math.abs(reflected.vy) > 2, 'Edge hit should have significant vertical velocity');
  });

  test('ball speed increases on paddle hit', () => {
    const paddle = game.createPaddle(true);
    const ball = { x: paddle.x + paddle.width, y: paddle.y + paddle.height / 2, vx: -5, vy: 0, speed: 5 };
    const reflected = game.reflectBall(ball, paddle);
    assert.strictEqual(reflected.speed, ball.speed + C.BALL_SPEED_INCREMENT);
  });

  test('ball speed does not exceed maximum', () => {
    const paddle = game.createPaddle(true);
    const ball = { x: paddle.x + paddle.width, y: paddle.y + paddle.height / 2, vx: -14, vy: 0, speed: C.BALL_SPEED_MAX };
    const reflected = game.reflectBall(ball, paddle);
    assert.ok(reflected.speed <= C.BALL_SPEED_MAX);
  });

  test('wall reflection inverts vertical velocity', () => {
    const ball = { x: 400, y: 10, vx: 3, vy: -4, speed: 5 };
    const reflected = game.reflectWall(ball);
    assert.strictEqual(reflected.vy, 4);
    assert.strictEqual(reflected.vx, 3);
  });
});

describe('Ball Movement', () => {
  test('ball moves according to velocity', () => {
    const ball = { x: 100, y: 200, vx: 5, vy: 3, speed: 5 };
    const updated = game.updateBall(ball);
    assert.strictEqual(updated.x, 105);
    assert.strictEqual(updated.y, 203);
  });
});

describe('Scoring', () => {
  test('player 2 scores when ball passes left edge', () => {
    const ball = { x: -10, y: 300, vx: -5, vy: 0, speed: 5 };
    assert.strictEqual(game.checkScore(ball), 1);
  });

  test('player 1 scores when ball passes right edge', () => {
    const ball = { x: C.FIELD_WIDTH + 10, y: 300, vx: 5, vy: 0, speed: 5 };
    assert.strictEqual(game.checkScore(ball), -1);
  });

  test('no score when ball is in play', () => {
    const ball = { x: 400, y: 300, vx: 5, vy: 3, speed: 5 };
    assert.strictEqual(game.checkScore(ball), 0);
  });
});

describe('Match End Conditions', () => {
  test('match ends when player 1 reaches win score with margin', () => {
    const result = game.checkMatchOver(11, 5, 11);
    assert.strictEqual(result.over, true);
    assert.strictEqual(result.winner, 1);
  });

  test('match ends when player 2 reaches win score with margin', () => {
    const result = game.checkMatchOver(5, 11, 11);
    assert.strictEqual(result.over, true);
    assert.strictEqual(result.winner, 2);
  });

  test('match continues when scores are tied at win score', () => {
    const result = game.checkMatchOver(11, 11, 11);
    assert.strictEqual(result.over, false);
  });

  test('match continues when within win-by margin', () => {
    const result = game.checkMatchOver(12, 11, 11);
    assert.strictEqual(result.over, false);
  });

  test('match ends with win-by-2 after tie', () => {
    const result = game.checkMatchOver(13, 11, 11);
    assert.strictEqual(result.over, true);
    assert.strictEqual(result.winner, 1);
  });

  test('short match ends at 5 with margin', () => {
    const result = game.checkMatchOver(5, 2, 5);
    assert.strictEqual(result.over, true);
    assert.strictEqual(result.winner, 1);
  });
});

describe('Game Tick', () => {
  test('game tick updates ball position', () => {
    const state = game.createGameState(11, 'medium');
    const result = game.tickGameState(state, 0, 0);
    assert.notStrictEqual(result.state.ball.x, state.ball.x);
  });

  test('game tick moves paddles on input', () => {
    const state = game.createGameState(11, 'medium');
    const result = game.tickGameState(state, -1, 1);
    assert.strictEqual(result.state.paddle1.y, state.paddle1.y - C.PADDLE_SPEED);
    assert.strictEqual(result.state.paddle2.y, state.paddle2.y + C.PADDLE_SPEED);
  });

  test('game tick detects paddle hit', () => {
    const state = game.createGameState(11, 'medium');
    // Position ball to hit paddle 1
    const hitState = {
      ...state,
      ball: {
        x: state.paddle1.x + state.paddle1.width - 1,
        y: state.paddle1.y + state.paddle1.height / 2,
        vx: -5,
        vy: 0,
        speed: 5,
      },
    };
    const result = game.tickGameState(hitState, 0, 0);
    assert.strictEqual(result.events.paddleHit, 1);
  });

  test('game tick detects scoring', () => {
    const state = game.createGameState(11, 'medium');
    const scoreState = {
      ...state,
      ball: { x: -20, y: 300, vx: -5, vy: 0, speed: 5 },
    };
    const result = game.tickGameState(scoreState, 0, 0);
    assert.strictEqual(result.events.scored, 2);
  });

  test('game tick updates score correctly', () => {
    const state = game.createGameState(11, 'medium');
    const scoreState = {
      ...state,
      ball: { x: -20, y: 300, vx: -5, vy: 0, speed: 5 },
    };
    const result = game.tickGameState(scoreState, 0, 0);
    assert.strictEqual(result.state.score2, 1);
    assert.strictEqual(result.state.score1, 0);
  });

  test('game tick detects match over', () => {
    const state = game.createGameState(5, 'medium');
    const nearEndState = {
      ...state,
      score1: 0,
      score2: 4,
      ball: { x: -20, y: 300, vx: -5, vy: 0, speed: 5 },
      servingDir: 1,
    };
    const result = game.tickGameState(nearEndState, 0, 0);
    assert.strictEqual(result.events.matchOver, true);
    assert.strictEqual(result.events.winner, 2);
  });

  test('rally hits counter increments', () => {
    const state = game.createGameState(11, 'medium');
    const hitState = {
      ...state,
      ball: {
        x: state.paddle1.x + state.paddle1.width - 1,
        y: state.paddle1.y + state.paddle1.height / 2,
        vx: -5,
        vy: 0,
        speed: 5,
      },
    };
    const result = game.tickGameState(hitState, 0, 0);
    assert.strictEqual(result.state.rallyHits, 1);
  });

  test('practice mode never ends', () => {
    const state = game.createGameState(5, 'medium', true);
    const nearEndState = {
      ...state,
      score1: 10,
      score2: 0,
      ball: { x: -20, y: 300, vx: -5, vy: 0, speed: 5 },
      servingDir: 1,
    };
    const result = game.tickGameState(nearEndState, 0, 0);
    assert.strictEqual(result.events.matchOver, false);
  });

  test('serving direction goes toward player who conceded', () => {
    const state = game.createGameState(11, 'medium');
    const scoreState = {
      ...state,
      ball: { x: -20, y: 300, vx: -5, vy: 0, speed: 5 },
    };
    const result = game.tickGameState(scoreState, 0, 0);
    assert.strictEqual(result.state.servingDir, -1, 'Serve should go toward P1 who conceded');
  });
});

describe('Game State Management', () => {
  test('creates valid initial game state', () => {
    const state = game.createGameState(11, 'medium');
    assert.strictEqual(state.score1, 0);
    assert.strictEqual(state.score2, 0);
    assert.strictEqual(state.rallyHits, 0);
    assert.strictEqual(state.winScore, 11);
    assert.strictEqual(state.isPractice, false);
  });

  test('reset ball after score', () => {
    const state = game.createGameState(11, 'medium');
    const scoredState = {
      ...state,
      score1: 1,
      servingDir: 1,
      rallyHits: 5,
      ball: { x: 900, y: 100, vx: 5, vy: 3, speed: 8 },
    };
    const reset = game.resetBallAfterScore(scoredState);
    assert.strictEqual(reset.ball.x, C.FIELD_WIDTH / 2);
    assert.strictEqual(reset.ball.y, C.FIELD_HEIGHT / 2);
    assert.strictEqual(reset.rallyHits, 0);
    assert.strictEqual(reset.score1, 1);
  });
});

// ===== AI TESTS =====
describe('AI Parameters', () => {
  test('all difficulty levels have parameters', () => {
    const difficulties = ['easy', 'medium', 'hard', 'impossible'];
    for (const diff of difficulties) {
      assert.ok(ai.AI_PARAMS[diff], `Missing params for ${diff}`);
    }
  });

  test('impossible has highest speed', () => {
    assert.ok(ai.AI_PARAMS.impossible.maxSpeed > ai.AI_PARAMS.hard.maxSpeed);
  });

  test('easy has highest error chance', () => {
    assert.ok(ai.AI_PARAMS.easy.errorChance > ai.AI_PARAMS.medium.errorChance);
    assert.ok(ai.AI_PARAMS.medium.errorChance > ai.AI_PARAMS.hard.errorChance);
  });

  test('impossible has zero error chance', () => {
    assert.strictEqual(ai.AI_PARAMS.impossible.errorChance, 0);
  });

  test('impossible has zero prediction noise', () => {
    assert.strictEqual(ai.AI_PARAMS.impossible.predictionNoise, 0);
  });
});

describe('AI State Creation', () => {
  test('creates valid AI state', () => {
    const state = ai.createAIState('medium');
    assert.strictEqual(state.difficulty, 'medium');
    assert.ok(state.params);
  });

  test('AI state starts centered', () => {
    const state = ai.createAIState('medium');
    assert.strictEqual(state.targetY, C.FIELD_HEIGHT / 2);
  });
});

describe('Ball Prediction', () => {
  test('prediction returns valid y position', () => {
    const ball = { x: 400, y: 300, vx: 5, vy: 2, speed: 5 };
    const predicted = ai.predictBallY(ball, 750, 0);
    assert.ok(predicted >= 0);
    assert.ok(predicted <= C.FIELD_HEIGHT);
  });

  test('prediction with noise varies', () => {
    const ball = { x: 400, y: 300, vx: 5, vy: 2, speed: 5 };
    const p1 = ai.predictBallY(ball, 750, 20);
    const p2 = ai.predictBallY(ball, 750, 20);
    // With noise, results may differ
    assert.ok(p1 >= 0 && p1 <= C.FIELD_HEIGHT);
    assert.ok(p2 >= 0 && p2 <= C.FIELD_HEIGHT);
  });
});

describe('AI Movement', () => {
  test('moveToward returns 0 when close to target', () => {
    const paddle = { y: 290, height: 90 };
    // Paddle center = 290 + 45 = 335, target 333 is within 3 pixels
    const input = ai.moveToward(333, paddle, 5);
    assert.strictEqual(input, 0);
  });

  test('moveToward returns positive when target is below', () => {
    const paddle = { y: 200, height: 90 };
    const input = ai.moveToward(400, paddle, 7);
    assert.ok(input > 0);
  });

  test('moveToward returns negative when target is above', () => {
    const paddle = { y: 400, height: 90 };
    const input = ai.moveToward(200, paddle, 7);
    assert.ok(input < 0);
  });
});

// ===== SETTINGS TESTS =====
describe('Settings', () => {
  test('loads default settings when none stored', () => {
    localStorage.removeItem(C.STORAGE_SETTINGS);
    const s = settings.loadSettings();
    assert.strictEqual(s.masterVolume, 0.8);
    assert.strictEqual(s.muted, false);
    assert.strictEqual(s.winScore, 11);
  });

  test('saves and loads settings', () => {
    const s = settings.loadSettings();
    const updated = settings.updateSetting(s, 'muted', true);
    assert.strictEqual(updated.muted, true);
    const loaded = settings.loadSettings();
    assert.strictEqual(loaded.muted, true);
  });

  test('resets settings to defaults', () => {
    settings.updateSetting(settings.loadSettings(), 'muted', true);
    const reset = settings.resetSettings();
    assert.strictEqual(reset.muted, false);
  });

  test('rebinds control keys', () => {
    const s = settings.resetSettings();
    const updated = settings.rebindControl(s, 'p1Up', 'KeyA');
    assert.strictEqual(updated.controls.p1Up, 'KeyA');
    assert.strictEqual(updated.controls.p1Down, 'KeyS'); // Unchanged
  });

  test('persists control rebinding', () => {
    const s = settings.resetSettings();
    settings.rebindControl(s, 'p1Up', 'KeyA');
    const loaded = settings.loadSettings();
    assert.strictEqual(loaded.controls.p1Up, 'KeyA');
  });
});

// ===== STATS TESTS =====
describe('Statistics', () => {
  test('loads default stats when none stored', () => {
    localStorage.removeItem(C.STORAGE_STATS);
    const s = stats.loadStats();
    assert.strictEqual(s.totalMatches, 0);
    assert.strictEqual(s.wins, 0);
  });

  test('records a win correctly', () => {
    const s = { ...stats.DEFAULT_STATS };
    const updated = stats.recordMatch(s, 11, 5, 1, false);
    assert.strictEqual(updated.totalMatches, 1);
    assert.strictEqual(updated.wins, 1);
    assert.strictEqual(updated.currentWinStreak, 1);
    assert.strictEqual(updated.bestWinStreak, 1);
  });

  test('records a loss correctly', () => {
    const s = { ...stats.DEFAULT_STATS, currentWinStreak: 3, bestWinStreak: 3 };
    const updated = stats.recordMatch(s, 8, 11, 2, false);
    assert.strictEqual(updated.losses, 1);
    assert.strictEqual(updated.currentWinStreak, 0);
    assert.strictEqual(updated.bestWinStreak, 3);
  });

  test('updates best win streak', () => {
    let s = { ...stats.DEFAULT_STATS, currentWinStreak: 2, bestWinStreak: 2 };
    s = stats.recordMatch(s, 11, 5, 1, false);
    assert.strictEqual(s.currentWinStreak, 3);
    assert.strictEqual(s.bestWinStreak, 3);
  });

  test('tracks vs AI matches separately', () => {
    const s = { ...stats.DEFAULT_STATS };
    const updated = stats.recordMatch(s, 11, 5, 1, true);
    assert.strictEqual(updated.matchesVsAI, 1);
    assert.strictEqual(updated.winsVsAI, 1);
    assert.strictEqual(updated.matches2P, 0);
  });

  test('tracks 2P matches separately', () => {
    const s = { ...stats.DEFAULT_STATS };
    const updated = stats.recordMatch(s, 11, 5, 1, false);
    assert.strictEqual(updated.matches2P, 1);
    assert.strictEqual(updated.wins2P, 1);
    assert.strictEqual(updated.matchesVsAI, 0);
  });

  test('accumulates points scored and conceded', () => {
    let s = { ...stats.DEFAULT_STATS };
    s = stats.recordMatch(s, 11, 7, 1, false);
    s = stats.recordMatch(s, 5, 11, 2, false);
    assert.strictEqual(s.totalPointsScored, 16);
    assert.strictEqual(s.totalPointsConceded, 18);
  });

  test('persists stats across save/load', () => {
    localStorage.removeItem(C.STORAGE_STATS);
    let s = stats.loadStats();
    s = stats.recordMatch(s, 11, 5, 1, false);
    const loaded = stats.loadStats();
    assert.strictEqual(loaded.totalMatches, 1);
    assert.strictEqual(loaded.wins, 1);
  });
});

// Run report
report();
