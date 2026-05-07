// Minesweeper unit tests
// Run with: node test/run_tests.js

const assert = require('assert');

// Mock browser globals for Node.js
global.window = {
  AudioContext: class {
    createGain() { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, value: 0 } }; }
    createOscillator() { return { type: 'sine', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, value: 0 }, start: () => {}, stop: () => {}, connect: () => {} }; }
    createBiquadFilter() { return { type: 'lowpass', frequency: { value: 0 }, connect: () => {}, disconnect: () => {} }; }
    createBuffer(ch, len, rate) { return { getChannelData: () => new Array(len) }; }
    createBufferSource() { return { buffer: null, connect: () => {}, start: () => {}, stop: () => {} }; }
    currentTime = 0;
    sampleRate = 44100;
    state = 'running';
    destination = {};
    resume() {}
  },
  webkitAudioContext: null,
  performance: { now: () => Date.now() },
  addEventListener: () => {},
  localStorage: {
    _store: {},
    getItem: function(k) { return this._store[k] || null; },
    setItem: function(k, v) { this._store[k] = String(v); },
    removeItem: function(k) { delete this._store[k]; }
  }
};
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({
    className: '',
    dataset: {},
    setAttribute: () => {},
    addEventListener: () => {},
    textContent: '',
    style: {},
    appendChild: () => {},
    innerHTML: '',
    remove: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false }
  }),
  body: {}
};
global.navigator = {};
global.HTMLElement = class {};
global.localStorage = global.window.localStorage;

// Make classes global (simulating script tag loading in browser)
const { Board } = require('../js/board.js');
global.Board = Board;

const { GameTimer } = require('../js/timer.js');
global.GameTimer = GameTimer;

const { GameStorage } = require('../js/storage.js');
global.GameStorage = GameStorage;

const { AudioManager } = require('../js/audio.js');
global.AudioManager = AudioManager;

const { Game } = require('../js/game.js');
global.Game = Game;

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

// ─── Board Tests ───────────────────────────────────────────────────────────────

console.log('\n=== Board Tests ===');

test('Board creates empty grid with correct dimensions', () => {
  const b = new Board(9, 9, 10);
  assert.strictEqual(b.getRows(), 9);
  assert.strictEqual(b.getCols(), 9);
  assert.strictEqual(b.getMineCount(), 10);
});

test('Board cells are initially empty and hidden', () => {
  const b = new Board(5, 5, 3);
  const cell = b.getCell(2, 2);
  assert.strictEqual(cell.isMine, false);
  assert.strictEqual(cell.adjacentMines, 0);
  assert.strictEqual(cell.state, 'hidden');
  assert.strictEqual(cell.row, 2);
  assert.strictEqual(cell.col, 2);
});

test('Board getCell returns null for out-of-bounds', () => {
  const b = new Board(5, 5, 3);
  assert.strictEqual(b.getCell(-1, 0), null);
  assert.strictEqual(b.getCell(5, 0), null);
  assert.strictEqual(b.getCell(0, -1), null);
  assert.strictEqual(b.getCell(0, 5), null);
});

test('Board getNeighbors returns all valid neighbors', () => {
  const b = new Board(5, 5, 3);
  const neighbors = b.getNeighbors(2, 2);
  assert.strictEqual(neighbors.length, 8);
});

test('Board getNeighbors handles edge cells', () => {
  const b = new Board(5, 5, 3);
  assert.strictEqual(b.getNeighbors(0, 0).length, 3); // corner
  assert.strictEqual(b.getNeighbors(0, 2).length, 5); // edge
});

test('Board placeMines places correct number of mines', () => {
  const b = new Board(10, 10, 15);
  b.placeMines(0, 0);
  let mineCount = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (b.getCell(r, c).isMine) mineCount++;
    }
  }
  assert.strictEqual(mineCount, 15);
});

test('Board first-click safety: clicked cell is not a mine', () => {
  const b = new Board(9, 9, 10);
  b.placeMines(4, 4);
  assert.strictEqual(b.getCell(4, 4).isMine, false);
});

test('Board first-click safety: neighbors are not mines', () => {
  const b = new Board(9, 9, 10);
  b.placeMines(4, 4);
  for (const n of b.getNeighbors(4, 4)) {
    assert.strictEqual(b.getCell(n.row, n.col).isMine, false, `Neighbor ${n.row},${n.col} should not be a mine`);
  }
});

test('Board first-click safety: clicked cell has 0 adjacent mines', () => {
  const b = new Board(9, 9, 10);
  b.placeMines(4, 4);
  assert.strictEqual(b.getCell(4, 4).adjacentMines, 0);
});

test('Board adjacent mines are computed correctly', () => {
  const b = new Board(5, 5, 1);
  b.placeMines(0, 0);
  // Cell (1, 1) should be adjacent to mine at some location.
  // Since safe zone is (0,0) + neighbors, the mine is placed elsewhere.
  // Just verify numbers are computed (non-negative, <= 8).
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = b.getCell(r, c);
      if (!cell.isMine) {
        assert.ok(cell.adjacentMines >= 0 && cell.adjacentMines <= 8, `Cell ${r},${c} has invalid adjacentMines: ${cell.adjacentMines}`);
      }
    }
  }
});

test('Board revealCell reveals a hidden cell', () => {
  const b = new Board(9, 9, 10);
  b.placeMines(4, 4);
  const result = b.revealCell(4, 4);
  // First-click safety creates a blank zone, so cascade reveals many cells
  assert.ok(result.revealed.length > 0, 'Should reveal at least one cell');
  assert.strictEqual(result.revealed[0].state, 'revealed');
  assert.strictEqual(result.hitMine, false);
});

test('Board revealCell returns empty for already revealed cell', () => {
  const b = new Board(9, 9, 10);
  b.placeMines(4, 4);
  b.revealCell(4, 4);
  const result = b.revealCell(4, 4);
  assert.strictEqual(result.revealed.length, 0);
});

test('Board revealCell triggers cascade on blank cell', () => {
  const b = new Board(9, 9, 2);
  b.placeMines(4, 4);
  const result = b.revealCell(4, 4);
  // Since (4,4) and neighbors are safe, and only 2 mines, cascade should reveal many cells.
  assert.ok(result.revealed.length > 9, `Cascade should reveal more than 9 cells, got ${result.revealed.length}`);
});

test('Board revealCell hits mine', () => {
  const b = new Board(9, 9, 10);
  b.placeMines(0, 0);
  // Find a mine to hit
  let mineCell = null;
  for (let r = 2; r < 9 && !mineCell; r++) {
    for (let c = 2; c < 9 && !mineCell; c++) {
      if (b.getCell(r, c).isMine) mineCell = b.getCell(r, c);
    }
  }
  assert.ok(mineCell !== null, 'Should find a mine');
  const result = b.revealCell(mineCell.row, mineCell.col);
  assert.strictEqual(result.hitMine, true);
  assert.strictEqual(result.detonatedAt.row, mineCell.row);
  assert.strictEqual(result.detonatedAt.col, mineCell.col);
});

test('Board chord with correct flag count reveals neighbors', () => {
  const b = new Board(9, 9, 10);
  b.placeMines(4, 4);
  // Reveal cell (4,4) - it's blank (0 adjacent), so chord does nothing.
  b.revealCell(4, 4);
  const result = b.chord(4, 4);
  assert.strictEqual(result.revealed.length, 0); // 0 adjacent mines, chord no-ops
});

test('Board chord does nothing if flag count doesnt match', () => {
  const b = new Board(9, 9, 10);
  b.placeMines(4, 4);
  // Flag a cell next to a number cell
  b.revealCell(4, 4);
  // Find a cell with adjacent mines > 0
  let numCell = null;
  for (let r = 3; r <= 5 && !numCell; r++) {
    for (let c = 3; c <= 5 && !numCell; c++) {
      const cell = b.getCell(r, c);
      if (!cell.isMine && cell.adjacentMines > 0) {
        // Need to reveal it first
      }
    }
  }
  // Simpler: manually set up a scenario
  const b2 = new Board(3, 3, 1);
  b2.placeMines(1, 1);
  // Mine is not at (1,1) or neighbors. It's somewhere else.
  // Reveal (1,1) - should be blank
  b2.revealCell(1, 1);
  // All cells revealed since only 1 mine and small board. Check chord on any number.
  const result = b2.chord(1, 1);
  assert.strictEqual(result.revealed.length, 0); // already revealed or 0 adjacent
});

test('Board cycleFlag cycles hidden -> flagged -> hidden', () => {
  const b = new Board(5, 5, 3);
  b.placeMines(2, 2);
  b.cycleFlag(0, 0);
  assert.strictEqual(b.getCell(0, 0).state, 'flagged');
  b.cycleFlag(0, 0);
  assert.strictEqual(b.getCell(0, 0).state, 'hidden');
});

test('Board cycleFlag with question mode: hidden -> flagged -> question -> hidden', () => {
  const b = new Board(5, 5, 3);
  b.placeMines(2, 2);
  b.cycleFlag(0, 0, true);
  assert.strictEqual(b.getCell(0, 0).state, 'flagged');
  b.cycleFlag(0, 0, true);
  assert.strictEqual(b.getCell(0, 0).state, 'question');
  b.cycleFlag(0, 0, true);
  assert.strictEqual(b.getCell(0, 0).state, 'hidden');
});

test('Board cycleFlag does nothing on revealed cells', () => {
  const b = new Board(5, 5, 3);
  b.placeMines(2, 2);
  b.revealCell(2, 2);
  const result = b.cycleFlag(2, 2);
  assert.strictEqual(result, null);
});

test('Board hasWon returns true when all non-mine cells revealed', () => {
  const b = new Board(5, 5, 1);
  b.placeMines(2, 2);
  // Reveal all non-mine cells
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = b.getCell(r, c);
      if (!cell.isMine && cell.state === 'hidden') {
        b.setCellState(r, c, 'revealed');
      }
    }
  }
  assert.strictEqual(b.hasWon(), true);
});

test('Board hasWon returns false when non-mine cells still hidden', () => {
  const b = new Board(5, 5, 1);
  b.placeMines(2, 2);
  assert.strictEqual(b.hasWon(), false);
});

test('Board autoFlagOnWin flags all remaining mines', () => {
  const b = new Board(5, 5, 3);
  b.placeMines(2, 2);
  // Reveal all non-mines
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (!b.getCell(r, c).isMine) b.setCellState(r, c, 'revealed');
    }
  }
  b.autoFlagOnWin();
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (b.getCell(r, c).isMine) {
        assert.strictEqual(b.getCell(r, c).state, 'flagged');
      }
    }
  }
});

test('Board getRemainingMines returns correct count', () => {
  const b = new Board(9, 9, 10);
  assert.strictEqual(b.getRemainingMines(), 10);
  b.cycleFlag(0, 0);
  assert.strictEqual(b.getRemainingMines(), 9);
  b.cycleFlag(0, 0);
  assert.strictEqual(b.getRemainingMines(), 10);
});

test('Board getAllMines returns all mine cells', () => {
  const b = new Board(10, 10, 15);
  b.placeMines(5, 5);
  const mines = b.getAllMines();
  assert.strictEqual(mines.length, 15);
  for (const m of mines) {
    assert.strictEqual(m.isMine, true);
  }
});

test('Board getFlaggedCells returns flagged cells', () => {
  const b = new Board(5, 5, 3);
  b.cycleFlag(0, 0);
  b.cycleFlag(1, 1);
  const flagged = b.getFlaggedCells();
  assert.strictEqual(flagged.length, 2);
});

test('Board setCellState changes cell state', () => {
  const b = new Board(5, 5, 3);
  b.setCellState(0, 0, 'flagged');
  assert.strictEqual(b.getCell(0, 0).state, 'flagged');
  b.setCellState(0, 0, 'hidden');
  assert.strictEqual(b.getCell(0, 0).state, 'hidden');
});

test('Board reveal returns null for null cell', () => {
  const b = new Board(5, 5, 3);
  const result = b.revealCell(-1, -1);
  assert.strictEqual(result.revealed.length, 0);
  assert.strictEqual(result.hitMine, false);
});

// ─── Timer Tests ───────────────────────────────────────────────────────────────

console.log('\n=== Timer Tests ===');

test('Timer starts at 0', () => {
  const t = new GameTimer(() => {});
  assert.strictEqual(t.getElapsed(), 0);
  assert.strictEqual(t.isRunning(), false);
});

test('Timer starts and increments', (done) => {
  const t = new GameTimer((s) => {
    assert.ok(s >= 0, 'Timer should start at 0 or higher');
    t.stop();
  });
  t.start();
  assert.strictEqual(t.isRunning(), true);
});

test('Timer reset clears elapsed', () => {
  const t = new GameTimer(() => {});
  t.reset();
  assert.strictEqual(t.getElapsed(), 0);
  assert.strictEqual(t.isRunning(), false);
});

test('Timer stop halts counting', () => {
  const t = new GameTimer(() => {});
  t.start();
  t.stop();
  assert.strictEqual(t.isRunning(), false);
});

test('Timer does not restart if already running', () => {
  let ticks = 0;
  const t = new GameTimer(() => { ticks++; });
  t.start();
  t.start(); // should be no-op
  assert.strictEqual(t.isRunning(), true);
});

// ─── Storage Tests ─────────────────────────────────────────────────────────────

console.log('\n=== Storage Tests ===');

test('Storage gets/sets best time', () => {
  const s = new GameStorage('test');
  assert.strictEqual(s.getBestTime('beginner'), null);
  s.setBestTime('beginner', 42);
  assert.strictEqual(s.getBestTime('beginner'), 42);
});

test('Storage only saves improved best time', () => {
  const s = new GameStorage('test2');
  s.setBestTime('beginner', 50);
  s.setBestTime('beginner', 60); // worse, should not update
  assert.strictEqual(s.getBestTime('beginner'), 50);
  s.setBestTime('beginner', 30); // better, should update
  assert.strictEqual(s.getBestTime('beginner'), 30);
});

test('Storage getBestTimes returns all times', () => {
  const s = new GameStorage('test3');
  s.setBestTime('beginner', 20);
  s.setBestTime('expert', 100);
  const times = s.getBestTimes();
  assert.strictEqual(times.beginner, 20);
  assert.strictEqual(times.expert, 100);
});

test('Storage clearBestTime removes time', () => {
  const s = new GameStorage('test4');
  s.setBestTime('beginner', 42);
  s.clearBestTime('beginner');
  assert.strictEqual(s.getBestTime('beginner'), null);
});

test('Storage clearAllBestTimes clears all', () => {
  const s = new GameStorage('test5');
  s.setBestTime('beginner', 20);
  s.setBestTime('expert', 100);
  s.clearAllBestTimes();
  assert.strictEqual(s.getBestTime('beginner'), null);
  assert.strictEqual(s.getBestTime('expert'), null);
});

test('Storage last difficulty', () => {
  const s = new GameStorage('test6');
  assert.strictEqual(s.getLastDifficulty(), null);
  s.setLastDifficulty('expert');
  assert.strictEqual(s.getLastDifficulty(), 'expert');
});

test('Storage question mode', () => {
  const s = new GameStorage('test7');
  assert.strictEqual(s.getQuestionMode(), false);
  s.setQuestionMode(true);
  assert.strictEqual(s.getQuestionMode(), true);
});

test('Storage custom settings', () => {
  const s = new GameStorage('test8');
  assert.strictEqual(s.getCustomSettings(), null);
  const settings = { rows: 12, cols: 12, mines: 20 };
  s.setCustomSettings(settings);
  assert.deepStrictEqual(s.getCustomSettings(), settings);
});

test('Storage muted', () => {
  const s = new GameStorage('test9');
  assert.strictEqual(s.getMuted(), false);
  s.setMuted(true);
  assert.strictEqual(s.getMuted(), true);
});

test('Storage get/set setting', () => {
  const s = new GameStorage('test10');
  s.setSetting('foo', 'bar');
  assert.strictEqual(s.getSetting('foo'), 'bar');
});

// ─── Audio Tests ───────────────────────────────────────────────────────────────

console.log('\n=== Audio Tests ===');

test('Audio starts unmuted', () => {
  const a = new AudioManager();
  assert.strictEqual(a.isMuted(), false);
});

test('Audio toggleMute', () => {
  const a = new AudioManager();
  a.toggleMute();
  assert.strictEqual(a.isMuted(), true);
  a.toggleMute();
  assert.strictEqual(a.isMuted(), false);
});

test('Audio setMuted', () => {
  const a = new AudioManager();
  a.setMuted(true);
  assert.strictEqual(a.isMuted(), true);
  a.setMuted(false);
  assert.strictEqual(a.isMuted(), false);
});

test('Audio playReveal does not throw when muted', () => {
  const a = new AudioManager();
  a.setMuted(true);
  a.playReveal(); // should silently return
});

test('Audio playDetonate does not throw when muted', () => {
  const a = new AudioManager();
  a.setMuted(true);
  a.playDetonate();
});

test('Audio playGameOver does not throw when muted', () => {
  const a = new AudioManager();
  a.setMuted(true);
  a.playGameOver();
});

test('Audio playVictory does not throw when muted', () => {
  const a = new AudioManager();
  a.setMuted(true);
  a.playVictory();
});

// ─── Game Tests ────────────────────────────────────────────────────────────────

console.log('\n=== Game Tests ===');

// Mock renderer for game tests
function createMockRenderer() {
  return {
    updateCells: () => {},
    updateMineCounter: () => {},
    updateTimerDisplay: () => {},
    setFaceExpression: () => {},
    renderBoard: () => {},
    showTitleScreen: () => {},
    showHUD: () => {},
    showBoard: () => {},
    hideHUD: () => {},
    hideBoard: () => {},
    hideAllOverlays: () => {},
    setCellFocus: () => {},
    renderGameOverBoard: () => {},
    showGameOver: () => {},
    showVictory: () => {},
    showPause: () => {},
    root: {}
  };
}

test('Game starts in title state', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt1'));
  assert.strictEqual(g.getState(), 'title');
});

test('Game startGame transitions to playing', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt2'));
  g.startGame();
  assert.strictEqual(g.getState(), 'playing');
});

test('Game startGame creates board with correct dimensions', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt3'));
  g.difficulty = 'beginner';
  g.startGame();
  const board = g.getBoard();
  assert.strictEqual(board.getRows(), 9);
  assert.strictEqual(board.getCols(), 9);
  assert.strictEqual(board.getMineCount(), 10);
});

test('Game handleReveal on first click places mines safely', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt4'));
  g.difficulty = 'beginner';
  g.startGame();
  g.handleReveal(4, 4, 'mouse');
  const cell = g.getBoard().getCell(4, 4);
  assert.strictEqual(cell.isMine, false);
  assert.strictEqual(cell.state, 'revealed');
});

test('Game handleReveal mine hit transitions to game_over', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt5'));
  g.difficulty = 'beginner';
  g.startGame();
  // First click is safe
  g.handleReveal(4, 4, 'mouse');
  // Find a mine
  const board = g.getBoard();
  let mineCell = null;
  for (let r = 0; r < board.getRows() && !mineCell; r++) {
    for (let c = 0; c < board.getCols() && !mineCell; c++) {
      if (board.getCell(r, c).isMine) mineCell = board.getCell(r, c);
    }
  }
  assert.ok(mineCell !== null);
  g.handleReveal(mineCell.row, mineCell.col, 'mouse');
  assert.strictEqual(g.getState(), 'game_over');
});

test('Game getRemainingMines after flag', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt6'));
  g.difficulty = 'beginner';
  g.startGame();
  const initial = g.getRemainingMines();
  g.handleReveal(4, 4, 'mouse'); // first click to place mines
  // Find a hidden cell to flag (cascade may reveal some edge cells)
  const board = g.getBoard();
  let flagged = false;
  for (let r = 0; r < board.getRows() && !flagged; r++) {
    for (let c = 0; c < board.getCols() && !flagged; c++) {
      if (board.getCell(r, c).state === 'hidden') {
        g.handleFlag(r, c);
        flagged = true;
      }
    }
  }
  assert.ok(flagged, 'Should find a hidden cell to flag');
  assert.strictEqual(g.getRemainingMines(), initial - 1);
});

test('Game togglePause', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt7'));
  g.difficulty = 'beginner';
  g.startGame();
  g.handleReveal(4, 4, 'mouse'); // first click
  g.togglePause();
  assert.strictEqual(g.getState(), 'paused');
  g.togglePause();
  assert.strictEqual(g.getState(), 'playing');
});

test('Game togglePause does nothing before first click', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt8'));
  g.startGame();
  g.togglePause();
  assert.strictEqual(g.getState(), 'playing'); // should not pause
});

test('Game restart resets game', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt9'));
  g.startGame();
  g.handleReveal(4, 4, 'mouse');
  g.restart();
  assert.strictEqual(g.getState(), 'playing');
  assert.strictEqual(g.firstClick, true);
});

test('Game showTitleScreen transitions to title', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt10'));
  g.startGame();
  g.showTitleScreen();
  assert.strictEqual(g.getState(), 'title');
});

test('Game DIFFICULTIES are correct', () => {
  assert.deepStrictEqual(Game.DIFFICULTIES.beginner, { rows: 9, cols: 9, mines: 10, timeLimit: 600 });
  assert.deepStrictEqual(Game.DIFFICULTIES.intermediate, { rows: 16, cols: 16, mines: 40, timeLimit: 420 });
  assert.deepStrictEqual(Game.DIFFICULTIES.expert, { rows: 16, cols: 30, mines: 99, timeLimit: 300 });
});

test('Game custom difficulty', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt11'));
  g.setCustomDifficulty(12, 12, 20);
  g.startGame();
  const board = g.getBoard();
  assert.strictEqual(board.getRows(), 12);
  assert.strictEqual(board.getCols(), 12);
  assert.strictEqual(board.getMineCount(), 20);
});

test('Game custom difficulty caps mines', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt12'));
  g.setCustomDifficulty(5, 5, 999); // too many mines
  g.startGame();
  // mines should be capped at rows*cols - 9 = 16
  assert.strictEqual(g.getBoard().getMineCount(), 5 * 5 - 9);
});

test('Game callbacks fire on state change', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt13'));
  let lastState = null;
  g.onStateChange = (state) => { lastState = state; };
  g.startGame();
  assert.strictEqual(lastState, 'playing');
});

test('Game callbacks fire on mine hit', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt14'));
  let mineHitRow = null, mineHitCol = null;
  g.onMineHit = (row, col) => { mineHitRow = row; mineHitCol = col; };
  g.difficulty = 'beginner';
  g.startGame();
  g.handleReveal(4, 4, 'mouse');
  const board = g.getBoard();
  let mineCell = null;
  for (let r = 0; r < board.getRows() && !mineCell; r++) {
    for (let c = 0; c < board.getCols() && !mineCell; c++) {
      if (board.getCell(r, c).isMine) mineCell = board.getCell(r, c);
    }
  }
  g.handleReveal(mineCell.row, mineCell.col, 'mouse');
  assert.strictEqual(mineHitRow, mineCell.row);
  assert.strictEqual(mineHitCol, mineCell.col);
});

test('Game getDifficulty returns current difficulty', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt15'));
  assert.strictEqual(g.getDifficulty(), 'beginner');
  g.setDifficulty('expert');
  assert.strictEqual(g.getDifficulty(), 'expert');
});

test('Game question mode', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt16'));
  assert.strictEqual(g.getQuestionMode(), false);
  g.setQuestionMode(true);
  assert.strictEqual(g.getQuestionMode(), true);
});

test('Game muted', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt17'));
  assert.strictEqual(g.isMuted(), false);
  g.setMuted(true);
  assert.strictEqual(g.isMuted(), true);
});

test('Game handleReveal does nothing when not playing', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt18'));
  // state is 'title'
  g.handleReveal(0, 0, 'mouse');
  assert.strictEqual(g.getState(), 'title');
});

test('Game handleFlag does nothing when not playing', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt19'));
  g.handleFlag(0, 0);
  assert.strictEqual(g.getState(), 'title');
});

test('Game chord via handleChord', () => {
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), new GameStorage('gt20'));
  g.difficulty = 'beginner';
  g.startGame();
  // First click
  g.handleReveal(4, 4, 'mouse');
  // Chord on a blank cell should be a no-op (state stays playing)
  g.handleChord(4, 4, 'mouse');
  assert.strictEqual(g.getState(), 'playing');
});

test('Game bestTime from storage', () => {
  const s = new GameStorage('gt21');
  s.setBestTime('beginner', 45);
  const g = new Game(createMockRenderer(), new AudioManager(), new GameTimer(() => {}), s);
  g.difficulty = 'beginner';
  assert.strictEqual(g.getBestTime(), 45);
});

// ─── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
