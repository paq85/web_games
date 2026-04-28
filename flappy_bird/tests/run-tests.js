/**
 * Automated test runner for Flappy Bird game logic.
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
  FIELD_WIDTH: 400,
  FIELD_HEIGHT: 600,
  BIRD_WIDTH: 34,
  BIRD_HEIGHT: 24,
  BIRD_X: 80,
  BIRD_START_Y: 300,
  GRAVITY: 0.45,
  FLAP_STRENGTH: -7.5,
  MAX_FALL_SPEED: 10,
  ROTATION_MAX: Math.PI / 4,
  ROTATION_SPEED: 0.1,
  PIPE_WIDTH: 52,
  PIPE_GAP: 140,
  PIPE_SPEED: 2.5,
  PIPE_SPAWN_INTERVAL: 100,
  PIPE_MIN_TOP: 60,
  PIPE_MAX_TOP: 600 - 120 - 140,
  GROUND_HEIGHT: 80,
  STORAGE_BEST_SCORE: 'flappy_best_score',
  SCREENS: {
    START: 'start',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
  },
  COLORS: {},
  MEDAL_THRESHOLDS: {
    platinum: 40,
    gold: 30,
    silver: 20,
    bronze: 10,
  },
});

global.C = C;

// Mock localStorage for Node.js
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val; },
  removeItem: (key) => { delete mockStorage[key]; },
};

// Load module
const game = require('../js/game.js');

// ===== BIRD CREATION TESTS =====
describe('Bird Creation', () => {
  test('creates bird at correct X position', () => {
    const bird = game.createBird();
    assert.strictEqual(bird.x, C.BIRD_X);
  });

  test('creates bird at correct starting Y position', () => {
    const bird = game.createBird();
    assert.strictEqual(bird.y, C.BIRD_START_Y);
  });

  test('creates bird with zero initial velocity', () => {
    const bird = game.createBird();
    assert.strictEqual(bird.vy, 0);
  });

  test('creates bird with zero initial rotation', () => {
    const bird = game.createBird();
    assert.strictEqual(bird.rotation, 0);
  });

  test('creates bird with initial wing frame 0', () => {
    const bird = game.createBird();
    assert.strictEqual(bird.wingFrame, 0);
  });
});

// ===== FLAP TESTS =====
describe('Bird Flap', () => {
  test('flap sets upward velocity', () => {
    const bird = game.createBird();
    const flapped = game.flapBird(bird);
    assert.strictEqual(flapped.vy, C.FLAP_STRENGTH);
  });

  test('flap produces negative (upward) velocity', () => {
    const bird = game.createBird();
    const flapped = game.flapBird(bird);
    assert.ok(flapped.vy < 0);
  });

  test('flap does not change bird position', () => {
    const bird = game.createBird();
    const flapped = game.flapBird(bird);
    assert.strictEqual(flapped.x, bird.x);
    assert.strictEqual(flapped.y, bird.y);
  });

  test('flap overrides existing velocity', () => {
    const bird = { ...game.createBird(), vy: 5 };
    const flapped = game.flapBird(bird);
    assert.strictEqual(flapped.vy, C.FLAP_STRENGTH);
  });
});

// ===== BIRD PHYSICS TESTS =====
describe('Bird Physics', () => {
  test('gravity increases downward velocity', () => {
    const bird = game.createBird();
    const updated = game.updateBird(bird);
    assert.strictEqual(updated.vy, C.GRAVITY);
  });

  test('bird falls when no flap input', () => {
    const bird = game.createBird();
    const updated = game.updateBird(bird);
    assert.ok(updated.y > bird.y);
  });

  test('bird rises after flap', () => {
    const bird = game.flapBird(game.createBird());
    const updated = game.updateBird(bird);
    assert.ok(updated.y < bird.y);
  });

  test('fall speed caps at MAX_FALL_SPEED', () => {
    const bird = { ...game.createBird(), vy: 100 };
    const updated = game.updateBird(bird);
    assert.ok(updated.vy <= C.MAX_FALL_SPEED);
  });

  test('positive rotation when falling fast', () => {
    const bird = { ...game.createBird(), vy: 8 };
    const updated = game.updateBird(bird);
    assert.ok(updated.rotation > 0);
  });

  test('negative rotation when rising', () => {
    const bird = game.flapBird(game.createBird());
    const updated = game.updateBird(bird);
    assert.ok(updated.rotation < 0);
  });

  test('rotation does not exceed maximum', () => {
    const bird = { ...game.createBird(), vy: 100 };
    const updated = game.updateBird(bird);
    assert.ok(Math.abs(updated.rotation) <= C.ROTATION_MAX);
  });

  test('wing frame cycles over time', () => {
    let bird = game.createBird();
    const frames = [];
    for (let i = 0; i < 20; i++) {
      bird = game.updateBird(bird);
      frames.push(bird.wingFrame);
    }
    assert.ok(frames.includes(0));
    assert.ok(frames.includes(1));
    assert.ok(frames.includes(2));
  });

  test('multiple gravity updates increase velocity', () => {
    let bird = game.createBird();
    bird = game.updateBird(bird);
    const vy1 = bird.vy;
    bird = game.updateBird(bird);
    assert.ok(bird.vy > vy1);
  });
});

// ===== PIPE CREATION TESTS =====
describe('Pipe Creation', () => {
  test('creates pipe at specified X position', () => {
    const pipe = game.createPipe(300, 300);
    assert.strictEqual(pipe.x, 300);
  });

  test('pipe gap top is correct', () => {
    const pipe = game.createPipe(300, 300);
    assert.strictEqual(pipe.gapTop, 300 - C.PIPE_GAP / 2);
  });

  test('pipe gap bottom is correct', () => {
    const pipe = game.createPipe(300, 300);
    assert.strictEqual(pipe.gapBottom, 300 + C.PIPE_GAP / 2);
  });

  test('pipe starts unscored', () => {
    const pipe = game.createPipe(300, 300);
    assert.strictEqual(pipe.scored, false);
  });

  test('random gap Y is within valid range', () => {
    for (let i = 0; i < 50; i++) {
      const gapY = game.randomGapY();
      const gapTop = gapY - C.PIPE_GAP / 2;
      const gapBottom = gapY + C.PIPE_GAP / 2;
      assert.ok(gapTop >= C.PIPE_MIN_TOP, `gapTop ${gapTop} < min ${C.PIPE_MIN_TOP}`);
      assert.ok(gapBottom <= C.FIELD_HEIGHT - C.GROUND_HEIGHT, `gapBottom ${gapBottom} > ground`);
    }
  });
});

// ===== PIPE MOVEMENT TESTS =====
describe('Pipe Movement', () => {
  test('pipe moves left each frame', () => {
    const pipe = game.createPipe(300, 300);
    const moved = game.movePipe(pipe);
    assert.strictEqual(moved.x, 300 - C.PIPE_SPEED);
  });

  test('pipe gap position unchanged when moving', () => {
    const pipe = game.createPipe(300, 300);
    const moved = game.movePipe(pipe);
    assert.strictEqual(moved.gapTop, pipe.gapTop);
    assert.strictEqual(moved.gapBottom, pipe.gapBottom);
  });
});

// ===== COLLISION DETECTION TESTS =====
describe('Bird-Pipe Collision', () => {
  test('no collision when bird is far from pipe', () => {
    const bird = game.createBird();
    const pipe = game.createPipe(300, 300);
    assert.strictEqual(game.birdCollidesPipe(bird, [pipe]), false);
  });

  test('collision when bird hits top pipe', () => {
    const bird = { ...game.createBird(), y: 50 };
    const pipe = game.createPipe(80, 300);
    assert.strictEqual(game.birdCollidesPipe(bird, [pipe]), true);
  });

  test('collision when bird hits bottom pipe', () => {
    const bird = { ...game.createBird(), y: 550 };
    const pipe = game.createPipe(80, 300);
    assert.strictEqual(game.birdCollidesPipe(bird, [pipe]), true);
  });

  test('no collision when bird passes through gap', () => {
    const bird = { ...game.createBird(), y: 300 };
    const pipe = game.createPipe(80, 300);
    assert.strictEqual(game.birdCollidesPipe(bird, [pipe]), false);
  });

  test('no collision when bird is past the pipe', () => {
    const bird = { ...game.createBird(), x: 200 };
    const pipe = game.createPipe(80, 300);
    assert.strictEqual(game.birdCollidesPipe(bird, [pipe]), false);
  });

  test('collision with pipe edge (bird right edge)', () => {
    const bird = { ...game.createBird(), x: 80 - 5, y: 50 };
    const pipe = game.createPipe(80, 300);
    assert.strictEqual(game.birdCollidesPipe(bird, [pipe]), true);
  });

  test('multiple pipes checked for collision', () => {
    const bird = { ...game.createBird(), x: 70, y: 50 };
    const pipe1 = game.createPipe(80, 300);
    const pipe2 = game.createPipe(200, 300);
    assert.strictEqual(game.birdCollidesPipe(bird, [pipe1, pipe2]), true);
  });

  test('no collision with empty pipe array', () => {
    const bird = game.createBird();
    assert.strictEqual(game.birdCollidesPipe(bird, []), false);
  });
});

describe('Bird-Boundary Collision', () => {
  test('no collision at normal position', () => {
    const bird = game.createBird();
    assert.strictEqual(game.birdCollidesBoundary(bird), false);
  });

  test('collision when bird hits ground', () => {
    const groundY = C.FIELD_HEIGHT - C.GROUND_HEIGHT;
    const bird = { ...game.createBird(), y: groundY + C.BIRD_HEIGHT / 2 };
    assert.strictEqual(game.birdCollidesBoundary(bird), true);
  });

  test('collision when bird hits ceiling', () => {
    const bird = { ...game.createBird(), y: -C.BIRD_HEIGHT / 2 - 1 };
    assert.strictEqual(game.birdCollidesBoundary(bird), true);
  });

  test('no collision just above ground', () => {
    const groundY = C.FIELD_HEIGHT - C.GROUND_HEIGHT;
    const bird = { ...game.createBird(), y: groundY - C.BIRD_HEIGHT / 2 - 1 };
    assert.strictEqual(game.birdCollidesBoundary(bird), false);
  });

  test('no collision just below ceiling', () => {
    const bird = { ...game.createBird(), y: C.BIRD_HEIGHT / 2 + 1 };
    assert.strictEqual(game.birdCollidesBoundary(bird), false);
  });
});

// ===== SCORING TESTS =====
describe('Pipe Scoring', () => {
  test('bird has passed pipe when x is beyond pipe right edge', () => {
    const bird = { ...game.createBird(), x: 200 };
    const pipe = game.createPipe(80, 300);
    assert.strictEqual(game.birdPassedPipe(bird, pipe), true);
  });

  test('bird has not passed pipe when still approaching', () => {
    const bird = { ...game.createBird(), x: 50 };
    const pipe = game.createPipe(80, 300);
    assert.strictEqual(game.birdPassedPipe(bird, pipe), false);
  });

  test('already scored pipe does not score again', () => {
    const bird = { ...game.createBird(), x: 200 };
    const pipe = { ...game.createPipe(80, 300), scored: true };
    assert.strictEqual(game.birdPassedPipe(bird, pipe), false);
  });
});

// ===== PIPE UPDATE TESTS =====
describe('Pipe Update', () => {
  test('pipes move left', () => {
    const pipe = game.createPipe(300, 300);
    const bird = game.createBird();
    const result = game.updatePipes([pipe], 0, bird);
    assert.strictEqual(result.pipes[0].x, 300 - C.PIPE_SPEED);
  });

  test('off-screen pipes are removed', () => {
    const pipe = game.createPipe(-100, 300);
    const bird = game.createBird();
    const result = game.updatePipes([pipe], 0, bird);
    assert.strictEqual(result.pipes.length, 0);
  });

  test('new pipe spawns at interval', () => {
    const bird = game.createBird();
    const result = game.updatePipes([], C.PIPE_SPAWN_INTERVAL, bird);
    assert.strictEqual(result.pipes.length, 1);
  });

  test('no new pipe before spawn interval', () => {
    const bird = game.createBird();
    const result = game.updatePipes([], 1, bird);
    assert.strictEqual(result.pipes.length, 0);
  });

  test('score gained when bird passes pipe', () => {
    const pipe = game.createPipe(30, 300);
    const bird = { ...game.createBird(), x: 100 };
    const result = game.updatePipes([pipe], 0, bird);
    assert.strictEqual(result.newScore, 1);
  });

  test('no score when bird has not passed pipe', () => {
    const pipe = game.createPipe(300, 300);
    const bird = game.createBird();
    const result = game.updatePipes([pipe], 0, bird);
    assert.strictEqual(result.newScore, 0);
  });
});

// ===== DEATH CHECK TESTS =====
describe('Death Check', () => {
  test('bird dies when hitting pipe', () => {
    const bird = { ...game.createBird(), y: 50 };
    const pipe = game.createPipe(80, 300);
    assert.strictEqual(game.checkDeath(bird, [pipe]), true);
  });

  test('bird dies when hitting ground', () => {
    const bird = { ...game.createBird(), y: C.FIELD_HEIGHT - C.GROUND_HEIGHT + 10 };
    assert.strictEqual(game.checkDeath(bird, []), true);
  });

  test('bird dies when hitting ceiling', () => {
    const bird = { ...game.createBird(), y: -20 };
    assert.strictEqual(game.checkDeath(bird, []), true);
  });

  test('bird lives in safe position', () => {
    const bird = game.createBird();
    assert.strictEqual(game.checkDeath(bird, []), false);
  });

  test('bird lives when passing through gap', () => {
    const bird = { ...game.createBird(), y: 300 };
    const pipe = game.createPipe(80, 300);
    assert.strictEqual(game.checkDeath(bird, [pipe]), false);
  });
});

// ===== GAME STATE TESTS =====
describe('Game State', () => {
  test('creates valid initial game state', () => {
    const state = game.createGameState();
    assert.strictEqual(state.score, 0);
    assert.strictEqual(state.frameCount, 0);
    assert.strictEqual(state.pipes.length, 0);
    assert.strictEqual(state.bird.x, C.BIRD_X);
    assert.strictEqual(state.bird.y, C.BIRD_START_Y);
  });

  test('best score loads from storage', () => {
    mockStorage[C.STORAGE_BEST_SCORE] = '42';
    const state = game.createGameState();
    assert.strictEqual(state.bestScore, 42);
    delete mockStorage[C.STORAGE_BEST_SCORE];
  });

  test('best score defaults to 0 when not stored', () => {
    delete mockStorage[C.STORAGE_BEST_SCORE];
    const state = game.createGameState();
    assert.strictEqual(state.bestScore, 0);
  });

  test('reset preserves best score', () => {
    const state = game.resetGameState(25);
    assert.strictEqual(state.bestScore, 25);
    assert.strictEqual(state.score, 0);
    assert.strictEqual(state.frameCount, 0);
  });

  test('reset creates fresh bird', () => {
    const state = game.resetGameState(0);
    assert.strictEqual(state.bird.y, C.BIRD_START_Y);
    assert.strictEqual(state.bird.vy, 0);
  });

  test('reset clears pipes', () => {
    const state = game.resetGameState(0);
    assert.strictEqual(state.pipes.length, 0);
  });
});

// ===== GROUND OFFSET TESTS =====
describe('Ground Offset', () => {
  test('ground offset advances by PIPE_SPEED', () => {
    const newOffset = game.updateGroundOffset(0);
    assert.strictEqual(newOffset, C.PIPE_SPEED);
  });

  test('ground offset wraps around', () => {
    const newOffset = game.updateGroundOffset(50);
    assert.ok(newOffset < 50);
  });
});

// ===== BEST SCORE PERSISTENCE TESTS =====
describe('Best Score Persistence', () => {
  test('saveBestScore stores value', () => {
    delete mockStorage[C.STORAGE_BEST_SCORE];
    game.saveBestScore(15);
    assert.strictEqual(mockStorage[C.STORAGE_BEST_SCORE], '15');
  });

  test('loadBestScore retrieves stored value', () => {
    mockStorage[C.STORAGE_BEST_SCORE] = '7';
    const score = game.loadBestScore();
    assert.strictEqual(score, 7);
  });

  test('loadBestScore returns 0 for invalid data', () => {
    mockStorage[C.STORAGE_BEST_SCORE] = 'abc';
    const score = game.loadBestScore();
    assert.strictEqual(score, 0);
  });

  test('loadBestScore returns 0 for negative values', () => {
    mockStorage[C.STORAGE_BEST_SCORE] = '-5';
    const score = game.loadBestScore();
    assert.strictEqual(score, 0);
  });
});

// ===== MEDAL TESTS =====
describe('Medals', () => {
  test('no medal below bronze threshold', () => {
    assert.strictEqual(game.getMedal(0), null);
    assert.strictEqual(game.getMedal(9), null);
  });

  test('bronze medal at threshold', () => {
    assert.strictEqual(game.getMedal(10), 'bronze');
  });

  test('silver medal at threshold', () => {
    assert.strictEqual(game.getMedal(20), 'silver');
  });

  test('gold medal at threshold', () => {
    assert.strictEqual(game.getMedal(30), 'gold');
  });

  test('platinum medal at threshold', () => {
    assert.strictEqual(game.getMedal(40), 'platinum');
  });

  test('platinum for very high score', () => {
    assert.strictEqual(game.getMedal(100), 'platinum');
  });

  test('bronze between bronze and silver', () => {
    assert.strictEqual(game.getMedal(15), 'bronze');
  });

  test('silver between silver and gold', () => {
    assert.strictEqual(game.getMedal(25), 'silver');
  });
});

// ===== FULL GAME TICK TESTS =====
describe('Game Tick', () => {
  test('tick updates bird position', () => {
    const state = game.createGameState();
    const result = game.tick(state, false);
    assert.ok(result.state.bird.y > state.bird.y);
  });

  test('tick applies flap when requested', () => {
    const state = game.createGameState();
    const result = game.tick(state, true);
    assert.ok(result.state.bird.vy < 0);
  });

  test('tick increments frame count', () => {
    const state = game.createGameState();
    const result = game.tick(state, false);
    assert.strictEqual(result.state.frameCount, 1);
  });

  test('tick does not die on first frame', () => {
    const state = game.createGameState();
    const result = game.tick(state, false);
    assert.strictEqual(result.dead, false);
  });

  test('tick detects death when bird falls to ground', () => {
    let state = game.createGameState();
    state = { ...state, bird: { ...state.bird, y: C.FIELD_HEIGHT - C.GROUND_HEIGHT } };
    const result = game.tick(state, false);
    assert.strictEqual(result.dead, true);
  });

  test('tick spawns pipe at interval', () => {
    let state = game.createGameState();
    state = { ...state, frameCount: C.PIPE_SPAWN_INTERVAL - 1 };
    const result = game.tick(state, false);
    assert.strictEqual(result.state.pipes.length, 1, `Expected 1 pipe at frame ${result.state.frameCount}`);
  });

  test('tick scores when bird passes pipe', () => {
    let state = game.createGameState();
    const pipe = game.createPipe(30, 300);
    state = {
      ...state,
      pipes: [pipe],
      bird: { ...state.bird, x: 100 },
    };
    const result = game.tick(state, false);
    assert.strictEqual(result.state.score, 1);
    assert.strictEqual(result.scoreGained, 1);
  });

  test('tick updates best score when score exceeds it', () => {
    let state = game.createGameState();
    state = { ...state, bestScore: 5 };
    const pipe = game.createPipe(30, 300);
    state = {
      ...state,
      pipes: [pipe],
      score: 5,
      bird: { ...state.bird, x: 100 },
    };
    const result = game.tick(state, false);
    assert.strictEqual(result.state.bestScore, 6);
  });

  test('tick saves best score on death', () => {
    let state = game.createGameState();
    state = {
      ...state,
      bird: { ...state.bird, y: C.FIELD_HEIGHT - C.GROUND_HEIGHT },
      score: 10,
      bestScore: 5,
    };
    const result = game.tick(state, false);
    assert.strictEqual(result.dead, true);
    assert.strictEqual(mockStorage[C.STORAGE_BEST_SCORE], '10');
  });

  test('tick updates ground offset', () => {
    const state = game.createGameState();
    const result = game.tick(state, false);
    assert.strictEqual(result.state.groundOffset, C.PIPE_SPEED);
  });

  test('multiple ticks increase fall speed', () => {
    let state = game.createGameState();
    let prevVy = 0;
    for (let i = 0; i < 10; i++) {
      const result = game.tick(state, false);
      assert.ok(result.state.bird.vy > prevVy);
      prevVy = result.state.bird.vy;
      state = result.state;
    }
  });

  test('fall speed caps at maximum', () => {
    let state = game.createGameState();
    for (let i = 0; i < 50; i++) {
      const result = game.tick(state, false);
      state = result.state;
    }
    assert.ok(state.bird.vy <= C.MAX_FALL_SPEED);
  });

  test('flap resets fall velocity', () => {
    let state = game.createGameState();
    for (let i = 0; i < 10; i++) {
      const result = game.tick(state, false);
      state = result.state;
    }
    assert.ok(state.bird.vy > 0);
    const result = game.tick(state, true);
    assert.strictEqual(result.state.bird.vy, C.FLAP_STRENGTH + C.GRAVITY);
  });

  test('score does not increase without passing pipes', () => {
    let state = game.createGameState();
    for (let i = 0; i < 10; i++) {
      const result = game.tick(state, false);
      state = result.state;
    }
    assert.strictEqual(state.score, 0);
  });

  test('bird rotation tracks velocity direction', () => {
    let state = game.createGameState();
    const result1 = game.tick(state, true);
    assert.ok(result1.state.bird.rotation < 0, 'Rising bird should have negative rotation');

    let s = result1.state;
    for (let i = 0; i < 25; i++) {
      const r = game.tick(s, false);
      s = r.state;
    }
    assert.ok(s.bird.rotation > 0, `Falling bird should have positive rotation, got ${s.bird.rotation} with vy=${s.bird.vy}`);
  });

  test('pipe scored flag prevents double scoring', () => {
    let state = game.createGameState();
    const pipe = game.createPipe(30, 300);
    state = {
      ...state,
      pipes: [pipe],
      bird: { ...state.bird, x: 100 },
    };
    let result = game.tick(state, false);
    assert.strictEqual(result.state.score, 1);

    result = game.tick(result.state, false);
    assert.strictEqual(result.state.score, 1);
  });
});

// ===== EDGE CASE TESTS =====
describe('Edge Cases', () => {
  test('rapid flapping does not cause issues', () => {
    let state = game.createGameState();
    for (let i = 0; i < 100; i++) {
      const result = game.tick(state, true);
      state = result.state;
      assert.ok(!isNaN(state.bird.y));
      assert.ok(!isNaN(state.bird.vy));
    }
  });

  test('many pipes do not cause issues', () => {
    let state = game.createGameState();
    for (let i = 0; i < 500; i++) {
      const result = game.tick(state, i % 5 === 0);
      state = result.state;
    }
    assert.ok(state.pipes.length < 20);
  });

  test('bird at exact ground boundary dies', () => {
    const bird = { ...game.createBird(), y: C.FIELD_HEIGHT - C.GROUND_HEIGHT + C.BIRD_HEIGHT / 2 };
    assert.strictEqual(game.checkDeath(bird, []), true);
  });

  test('bird at exact ceiling boundary dies', () => {
    const bird = { ...game.createBird(), y: -C.BIRD_HEIGHT / 2 };
    assert.strictEqual(game.checkDeath(bird, []), true);
  });

  test('pipe at field edge is still checked', () => {
    const bird = { ...game.createBird(), y: 50 };
    const pipe = game.createPipe(C.BIRD_X - C.PIPE_WIDTH / 2, 300);
    assert.strictEqual(game.birdCollidesPipe(bird, [pipe]), true);
  });
});

// Run report
report();
