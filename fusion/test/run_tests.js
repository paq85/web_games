// Fusion game unit tests - Comprehensive edge case coverage
// Run with: node test/run_tests.js

const assert = require('assert');

// Mock browser globals for Node.js
global.window = {
  devicePixelRatio: 1,
  matchMedia: (query) => ({
    matches: false,
    addEventListener: () => {},
    media: query
  }),
  AudioContext: class {
    createGain() { return { gain: { value: 0 } }; }
    createOscillator() { return { type: 'sine', frequency: { value: 0 }, start: () => {}, stop: () => {}, connect: () => {} }; }
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
  getComputedStyle: () => ({}),
  addEventListener: () => {},
  removeEventListener: () => {},
  requestAnimationFrame: (fn) => setTimeout(fn, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
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
  createDocumentFragment: () => ({ appendChild: () => {} }),
  createElement: () => ({
    className: '',
    dataset: {},
    setAttribute: () => {},
    addEventListener: () => {},
    textContent: '',
    style: {},
    appendChild: () => {},
    innerHTML: '',
    click: () => {},
    focus: () => {},
    remove: () => {}
  }),
  body: {}
};
global.navigator = {};
global.HTMLElement = class {};
global.requestAnimationFrame = (fn) => setTimeout(fn, 16);

// Load game modules
const { Tile } = require('../js/tile.js');
const { Grid } = require('../js/grid.js');
const { ComboSystem } = require('../js/combo.js');
const { PowerUps } = require('../js/powerups.js');
const { Zones } = require('../js/zones.js');
const { Mutations } = require('../js/mutations.js');
const { SpecialTiles } = require('../js/special_tiles.js');

let passed = 0;
let failed = 0;
let skipped = 0;

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

function skip(name, reason) {
  skipped++;
  console.log(`  ⊘ ${name} (${reason})`);
}

// ─── Tile Tests ────────────────────────────────────────────────────────────────

console.log('\n=== Tile Tests ===');

test('Tile creates normal tile with correct value', () => {
  const t = new Tile(4, Tile.TYPES.NORMAL, 0, 0);
  assert.strictEqual(t.value, 4);
  assert.strictEqual(t.type, Tile.TYPES.NORMAL);
  assert.strictEqual(t.row, 0);
  assert.strictEqual(t.col, 0);
});

test('Tile canMergeWith returns true for same values', () => {
  const a = new Tile(4, Tile.TYPES.NORMAL, 0, 0);
  const b = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  assert.strictEqual(a.canMergeWith(b), true);
});

test('Tile canMergeWith returns false for different values', () => {
  const a = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  const b = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  assert.strictEqual(a.canMergeWith(b), false);
});

test('Wildcard can merge with any tile', () => {
  const w = Tile.createWildcard(0, 0);
  const n = new Tile(8, Tile.TYPES.NORMAL, 0, 1);
  assert.strictEqual(w.canMergeWith(n), true);
  assert.strictEqual(n.canMergeWith(w), true);
});

test('Two wildcards merge to value 4', () => {
  const a = Tile.createWildcard(0, 0);
  const b = Tile.createWildcard(0, 1);
  assert.strictEqual(a.mergeValue(b), 4);
});

test('Bomb cannot merge with normal tile', () => {
  const b = Tile.createBomb(0, 0);
  const n = new Tile(2, Tile.TYPES.NORMAL, 0, 1);
  assert.strictEqual(b.canMergeWith(n), false);
  assert.strictEqual(n.canMergeWith(b), false);
});

test('Multiplier cannot merge with normal tile', () => {
  const m = Tile.createMultiplier(0, 0);
  const n = new Tile(2, Tile.TYPES.NORMAL, 0, 1);
  assert.strictEqual(m.canMergeWith(n), false);
  assert.strictEqual(n.canMergeWith(m), false);
});

test('Shield tile cannot merge while shielded', () => {
  const s = Tile.createShield(4, 0, 0);
  const n = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  assert.strictEqual(s.canMergeWith(n), false);
  assert.strictEqual(s.shieldMovesLeft, 1);
});

test('Shield can merge after expiry', () => {
  const s = Tile.createShield(4, 0, 0);
  s.tickShield();
  const n = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  assert.strictEqual(s.type, Tile.TYPES.NORMAL);
  assert.strictEqual(s.canMergeWith(n), true);
});

test('Fusion Core triples merge value', () => {
  const fc = Tile.createFusionCore(8, 0, 0);
  const n = new Tile(8, Tile.TYPES.NORMAL, 0, 1);
  assert.strictEqual(fc.mergeValue(n), 24);
});

test('Tile clone creates independent copy', () => {
  const t = new Tile(8, Tile.TYPES.NORMAL, 1, 2);
  const c = t.clone();
  assert.strictEqual(c.value, 8);
  assert.strictEqual(c.row, 1);
  assert.strictEqual(c.col, 2);
  c.value = 16;
  assert.strictEqual(t.value, 8);
});

test('Tile merged flag defaults to false', () => {
  const t = new Tile(4, Tile.TYPES.NORMAL, 0, 0);
  assert.strictEqual(t.merged, false);
});

test('Tile has unique ID', () => {
  const a = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  const b = new Tile(2, Tile.TYPES.NORMAL, 0, 1);
  assert.notStrictEqual(a.id, b.id);
});

test('Wildcard merge with normal tile preserves normal value', () => {
  const w = Tile.createWildcard(0, 0);
  const n = new Tile(16, Tile.TYPES.NORMAL, 0, 1);
  assert.strictEqual(w.mergeValue(n), 16);
  assert.strictEqual(n.mergeValue(w), 16);
});

// ─── Grid Tests ────────────────────────────────────────────────────────────────

console.log('\n=== Grid Tests ===');

test('Grid initializes empty', () => {
  const g = new Grid(4);
  assert.strictEqual(g.size, 4);
  assert.strictEqual(g.getEmptyCells().length, 16);
});

test('Grid spawns initial tiles', () => {
  const g = new Grid(4);
  g.spawnInitialTiles(2);
  assert.strictEqual(g.getEmptyCells().length, 14);
});

test('Grid slide left merges adjacent tiles', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(2, Tile.TYPES.NORMAL, 0, 1);
  g.cells[0][2] = null;
  g.cells[0][3] = null;
  const result = g.slide('left');
  assert(result.moved, 'tiles should have moved');
  assert(result.merges >= 1, 'at least one merge should occur');
  assert.strictEqual(g.cells[0][0].value, 4, 'merged tile should have value 4');
});

test('Grid slide right merges adjacent tiles', () => {
  const g = new Grid(4);
  g.cells[0][2] = new Tile(4, Tile.TYPES.NORMAL, 0, 2);
  g.cells[0][3] = new Tile(4, Tile.TYPES.NORMAL, 0, 3);
  const result = g.slide('right');
  assert(result.moved);
  assert(result.merges >= 1);
  assert.strictEqual(g.cells[0][3].value, 8);
});

test('Grid slide up merges tiles in column', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(8, Tile.TYPES.NORMAL, 0, 0);
  g.cells[1][0] = new Tile(8, Tile.TYPES.NORMAL, 1, 0);
  g.cells[2][0] = null;
  g.cells[3][0] = null;
  const result = g.slide('up');
  assert(result.moved);
  assert(result.merges >= 1);
  assert.strictEqual(g.cells[0][0].value, 16);
});

test('Grid slide down merges tiles in column', () => {
  const g = new Grid(4);
  g.cells[2][0] = new Tile(16, Tile.TYPES.NORMAL, 2, 0);
  g.cells[3][0] = new Tile(16, Tile.TYPES.NORMAL, 3, 0);
  const result = g.slide('down');
  assert(result.moved);
  assert(result.merges >= 1);
  assert.strictEqual(g.cells[3][0].value, 32);
});

test('Grid slide moves tiles without merging', () => {
  const g = new Grid(4);
  g.cells[0][3] = new Tile(4, Tile.TYPES.NORMAL, 0, 3);
  const result = g.slide('left');
  assert(result.moved);
  assert.strictEqual(result.merges, 0);
  assert(g.cells[0][0] !== null);
  assert.strictEqual(g.cells[0][0].value, 4);
  assert(g.cells[0][3] === null);
});

test('Grid slide does not double-merge [2,2,2,2] -> [4,4,_,_]', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(2, Tile.TYPES.NORMAL, 0, 1);
  g.cells[0][2] = new Tile(2, Tile.TYPES.NORMAL, 0, 2);
  g.cells[0][3] = new Tile(2, Tile.TYPES.NORMAL, 0, 3);
  g.slide('left');
  assert.strictEqual(g.cells[0][0].value, 4);
  assert.strictEqual(g.cells[0][1].value, 4);
  assert.strictEqual(g.cells[0][2], null);
  assert.strictEqual(g.cells[0][3], null);
});

test('Grid slide score equals merged tile value', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(8, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(8, Tile.TYPES.NORMAL, 0, 1);
  const result = g.slide('left');
  assert.strictEqual(result.score, 16);
});

test('Grid slide multiple merges accumulate score', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(2, Tile.TYPES.NORMAL, 0, 1);
  g.cells[1][0] = new Tile(4, Tile.TYPES.NORMAL, 1, 0);
  g.cells[1][1] = new Tile(4, Tile.TYPES.NORMAL, 1, 1);
  const result = g.slide('left');
  assert.strictEqual(result.merges, 2);
  assert.strictEqual(result.score, 4 + 8); // 2+2=4, 4+4=8
});

test('Grid detects game over (no moves, full grid)', () => {
  const g = new Grid(2);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  g.cells[1][0] = new Tile(4, Tile.TYPES.NORMAL, 1, 0);
  g.cells[1][1] = new Tile(8, Tile.TYPES.NORMAL, 1, 1);
  assert.strictEqual(g.hasMoves(), false);
});

test('Grid detects available moves (merge possible)', () => {
  const g = new Grid(2);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(2, Tile.TYPES.NORMAL, 0, 1);
  g.cells[1][0] = new Tile(4, Tile.TYPES.NORMAL, 1, 0);
  g.cells[1][1] = new Tile(8, Tile.TYPES.NORMAL, 1, 1);
  assert.strictEqual(g.hasMoves(), true);
});

test('Grid detects available moves (empty cell exists)', () => {
  const g = new Grid(2);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  g.cells[1][0] = new Tile(8, Tile.TYPES.NORMAL, 1, 0);
  g.cells[1][1] = null;
  assert.strictEqual(g.hasMoves(), true);
});

test('Grid serialize and restore preserves state', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(8, Tile.TYPES.NORMAL, 0, 0);
  g.cells[1][2] = new Tile(4, Tile.TYPES.NORMAL, 1, 2);
  const data = g.serialize();
  g.cells[0][0] = null;
  g.cells[1][2] = null;
  g.restore(data);
  assert(g.cells[0][0] !== null);
  assert.strictEqual(g.cells[0][0].value, 8);
  assert(g.cells[1][2] !== null);
  assert.strictEqual(g.cells[1][2].value, 4);
});

test('Grid getHighestTile returns correct value', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[1][1] = new Tile(128, Tile.TYPES.NORMAL, 1, 1);
  g.cells[2][2] = new Tile(64, Tile.TYPES.NORMAL, 2, 2);
  assert.strictEqual(g.getHighestTile(), 128);
});

test('Grid getHighestTile returns 0 for empty grid', () => {
  const g = new Grid(4);
  assert.strictEqual(g.getHighestTile(), 0);
});

test('Grid row shift wraps correctly', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  g.cells[0][2] = new Tile(8, Tile.TYPES.NORMAL, 0, 2);
  g.cells[0][3] = new Tile(16, Tile.TYPES.NORMAL, 0, 3);
  g.shiftRow(0, 1);
  assert.strictEqual(g.cells[0][0].value, 16);
  assert.strictEqual(g.cells[0][1].value, 2);
  assert.strictEqual(g.cells[0][2].value, 4);
  assert.strictEqual(g.cells[0][3].value, 8);
});

test('Grid row shift reverse direction', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  g.cells[0][2] = new Tile(8, Tile.TYPES.NORMAL, 0, 2);
  g.cells[0][3] = new Tile(16, Tile.TYPES.NORMAL, 0, 3);
  g.shiftRow(0, -1);
  assert.strictEqual(g.cells[0][0].value, 4);
  assert.strictEqual(g.cells[0][3].value, 2);
});

test('Grid quadrant rotation clockwise', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  g.cells[1][0] = new Tile(8, Tile.TYPES.NORMAL, 1, 0);
  g.cells[1][1] = new Tile(16, Tile.TYPES.NORMAL, 1, 1);
  g.rotateQuadrant('tl', true);
  // Clockwise: [2,4;8,16] -> [8,2;16,4]
  assert.strictEqual(g.cells[0][0].value, 8);
  assert.strictEqual(g.cells[0][1].value, 2);
  assert.strictEqual(g.cells[1][0].value, 16);
  assert.strictEqual(g.cells[1][1].value, 4);
});

test('Grid quadrant rotation counter-clockwise', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  g.cells[1][0] = new Tile(8, Tile.TYPES.NORMAL, 1, 0);
  g.cells[1][1] = new Tile(16, Tile.TYPES.NORMAL, 1, 1);
  g.rotateQuadrant('tl', false);
  // Counter-clockwise: [2,4;8,16] -> [4,16;2,8]
  assert.strictEqual(g.cells[0][0].value, 4);
  assert.strictEqual(g.cells[0][1].value, 16);
  assert.strictEqual(g.cells[1][0].value, 2);
  assert.strictEqual(g.cells[1][1].value, 8);
});

test('Grid tile positions updated after slide', () => {
  const g = new Grid(4);
  g.cells[0][3] = new Tile(4, Tile.TYPES.NORMAL, 0, 3);
  g.slide('left');
  assert.strictEqual(g.cells[0][0].row, 0);
  assert.strictEqual(g.cells[0][0].col, 0);
});

test('Grid slide clears merged flag after slide', () => {
  const g = new Grid(4);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(2, Tile.TYPES.NORMAL, 0, 1);
  g.slide('left');
  assert.strictEqual(g.cells[0][0].merged, false);
});

test('Grid isFull returns true for full grid', () => {
  const g = new Grid(2);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  g.cells[1][0] = new Tile(8, Tile.TYPES.NORMAL, 1, 0);
  g.cells[1][1] = new Tile(16, Tile.TYPES.NORMAL, 1, 1);
  assert.strictEqual(g.isFull(), true);
});

test('Grid isFull returns false when empty cells exist', () => {
  const g = new Grid(2);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = null;
  g.cells[1][0] = null;
  g.cells[1][1] = null;
  assert.strictEqual(g.isFull(), false);
});

test('Grid spawnTile returns null when grid is full', () => {
  const g = new Grid(2);
  g.cells[0][0] = new Tile(2, Tile.TYPES.NORMAL, 0, 0);
  g.cells[0][1] = new Tile(4, Tile.TYPES.NORMAL, 0, 1);
  g.cells[1][0] = new Tile(8, Tile.TYPES.NORMAL, 1, 0);
  g.cells[1][1] = new Tile(16, Tile.TYPES.NORMAL, 1, 1);
  const result = g.spawnTile();
  assert.strictEqual(result, null);
});

test('Grid spawnTile with fixed value', () => {
  const g = new Grid(4);
  const tile = g.spawnTile(8);
  assert.strictEqual(tile.value, 8);
});

// ─── Combo System Tests ────────────────────────────────────────────────────────

console.log('\n=== Combo System Tests ===');

test('Combo streak starts at 0', () => {
  const c = new ComboSystem();
  assert.strictEqual(c.streak, 0);
});

test('Combo multiplier increases with streak', () => {
  const c = new ComboSystem();
  c.recordMerge(100);
  assert.strictEqual(c.streak, 1);
  assert.strictEqual(c.getMultiplier(), 1);
  c.recordMerge(100);
  assert.strictEqual(c.streak, 2);
  assert.strictEqual(c.getMultiplier(), 1.5);
  c.recordMerge(100);
  assert.strictEqual(c.streak, 3);
  assert.strictEqual(c.getMultiplier(), 2);
  c.recordMerge(100);
  assert.strictEqual(c.streak, 4);
  assert.strictEqual(c.getMultiplier(), 3);
  c.recordMerge(100);
  assert.strictEqual(c.streak, 5);
  assert.strictEqual(c.getMultiplier(), 5);
});

test('Combo multiplier caps at max streak', () => {
  const c = new ComboSystem();
  for (let i = 0; i < 10; i++) c.recordMerge(100);
  assert.strictEqual(c.getMultiplier(), 5); // Should cap at 5
});

test('Combo resets on no merge', () => {
  const c = new ComboSystem();
  c.recordMerge(100);
  c.recordMerge(100);
  assert.strictEqual(c.streak, 2);
  c.recordNoMerge();
  assert.strictEqual(c.streak, 0);
});

test('Combo reset clears state', () => {
  const c = new ComboSystem();
  c.recordMerge(100);
  c.reset();
  assert.strictEqual(c.streak, 0);
  assert.strictEqual(c.currentComboPoints, 0);
});

test('Combo tracks total combo points', () => {
  const c = new ComboSystem();
  c.recordMerge(100);
  c.recordMerge(100);
  assert(c.totalComboPoints > 0);
});

test('Combo callback fires on merge', () => {
  const c = new ComboSystem();
  let callbackFired = false;
  c.setCallback('merge', (data) => {
    callbackFired = true;
    assert.strictEqual(data.streak, 1);
  });
  c.recordMerge(50);
  assert(callbackFired);
});

test('Combo mega_combo callback fires at streak 5', () => {
  const c = new ComboSystem();
  let megaFired = false;
  c.setCallback('mega_combo', (data) => {
    megaFired = true;
    assert.strictEqual(data.streak, 5);
  });
  for (let i = 0; i < 5; i++) c.recordMerge(10);
  assert(megaFired);
});

// ─── Power-Up Tests ────────────────────────────────────────────────────────────

console.log('\n=== Power-Up Tests ===');

test('PowerUps start with no charges', () => {
  const p = new PowerUps();
  assert.strictEqual(p.getCharges('undo'), 0);
});

test('PowerUps earn charges', () => {
  const p = new PowerUps();
  p.earn('undo');
  assert.strictEqual(p.getCharges('undo'), 1);
});

test('PowerUps cap at max charges', () => {
  const p = new PowerUps();
  p.earn('undo');
  p.earn('undo');
  p.earn('undo');
  p.earn('undo');
  assert.strictEqual(p.getCharges('undo'), 3);
});

test('PowerUps use charges', () => {
  const p = new PowerUps();
  p.earn('freeze');
  p.use('freeze');
  assert.strictEqual(p.getCharges('freeze'), 0);
});

test('PowerUps cannot use when empty', () => {
  const p = new PowerUps();
  assert.strictEqual(p.canUse('undo'), false);
});

test('PowerUps undo consecutive limit', () => {
  const p = new PowerUps();
  p.earn('undo');
  p.earn('undo');
  assert.strictEqual(p.canUse('undo'), true);
  p.use('undo');
  p.use('undo');
  assert.strictEqual(p.canUse('undo'), false);
});

test('PowerUps reset clears all', () => {
  const p = new PowerUps();
  p.earn('undo');
  p.earn('split');
  p.reset();
  assert.strictEqual(p.getCharges('undo'), 0);
  assert.strictEqual(p.getCharges('split'), 0);
});

test('PowerUps earn returns false when capped', () => {
  const p = new PowerUps();
  p.earn('nuke');
  p.earn('nuke');
  p.earn('nuke');
  const result = p.earn('nuke');
  assert.strictEqual(result, false);
});

test('PowerUps getAllCharges returns all types', () => {
  const p = new PowerUps();
  p.earn('undo');
  const all = p.getAllCharges();
  assert.strictEqual(all.undo, 1);
  assert.strictEqual(all.split, 0);
  assert.strictEqual(all.nuke, 0);
});

test('PowerUps freeze activation', () => {
  const p = new PowerUps();
  p.earn('freeze');
  p.use('freeze');
  assert.strictEqual(p.isFreezeActive(), true);
  p.deactivateFreeze();
  assert.strictEqual(p.isFreezeActive(), false);
});

test('PowerUps stabilize tick down', () => {
  const p = new PowerUps();
  p.earn('stabilize');
  p.use('stabilize');
  assert.strictEqual(p.isStabilizeActive(), true);
  for (let i = 0; i < 3; i++) p.tickStabilize();
  assert.strictEqual(p.isStabilizeActive(), false);
});

// ─── Zone Tests ────────────────────────────────────────────────────────────────

console.log('\n=== Zone Tests ===');

test('Zones add and remove zones', () => {
  const z = new Zones();
  const zone = z.addZone('gravity_well', [{ row: 0, col: 0 }, { row: 1, col: 0 }], 5);
  assert.strictEqual(z.zones.length, 1);
  z.removeZone(zone.id);
  assert.strictEqual(z.zones.length, 0);
});

test('Zones expire after moves', () => {
  const z = new Zones();
  z.addZone('boost', [{ row: 0, col: 0 }], 2);
  assert.strictEqual(z.zones.length, 1);
  z.tickAllZones();
  assert.strictEqual(z.zones.length, 1);
  z.tickAllZones();
  assert.strictEqual(z.zones.length, 0);
});

test('Zones detect frozen cells', () => {
  const z = new Zones();
  z.addZone('frozen', [{ row: 1, col: 1 }], 5);
  assert.strictEqual(z.isFrozen(1, 1), true);
  assert.strictEqual(z.isFrozen(0, 0), false);
});

test('Zones detect boost cells', () => {
  const z = new Zones();
  z.addZone('boost', [{ row: 2, col: 2 }], 5);
  assert.strictEqual(z.isBoost(2, 2), true);
  assert.strictEqual(z.getBoostMultiplier(2, 2), 2);
});

test('Zones boost multiplier stacks', () => {
  const z = new Zones();
  z.addZone('boost', [{ row: 0, col: 0 }], 5);
  z.addZone('boost', [{ row: 0, col: 0 }], 5);
  assert.strictEqual(z.getBoostMultiplier(0, 0), 4); // 2^2
});

test('Zones get swap zone', () => {
  const z = new Zones();
  const zone = z.addZone('swap', [{ row: 0, col: 0 }, { row: 0, col: 1 }], 5);
  const swap = z.getSwapZone();
  assert(swap !== null);
  z.useSwapZone(zone.id);
  assert.strictEqual(z.getSwapZone(), undefined);
});

test('Zones reset clears all', () => {
  const z = new Zones();
  z.addZone('boost', [{ row: 0, col: 0 }], 5);
  z.reset();
  assert.strictEqual(z.zones.length, 0);
});

test('Zones getZoneAt finds zones at position', () => {
  const z = new Zones();
  z.addZone('boost', [{ row: 1, col: 1 }], 5);
  const found = z.getZoneAt(1, 1);
  assert.strictEqual(found.length, 1);
  assert.strictEqual(z.getZoneAt(0, 0).length, 0);
});

// ─── Mutation Tests ────────────────────────────────────────────────────────────

console.log('\n=== Mutation Tests ===');

test('Mutations start clean', () => {
  const m = new Mutations();
  assert.strictEqual(m.lastMutation, null);
});

test('Mutations execute row shift', () => {
  const m = new Mutations();
  const grid = [
    [{ value: 2 }, { value: 4 }, { value: 8 }, { value: 16 }],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ];
  const result = m.executeRowShift(grid);
  assert(result.result);
  assert(result.details.row >= 0);
});

test('Mutations execute column shift', () => {
  const m = new Mutations();
  const grid = Array(4).fill(null).map(() => Array(4).fill(null));
  grid[0][0] = { value: 2 };
  grid[1][0] = { value: 4 };
  const result = m.executeColumnShift(grid);
  assert(result.result);
});

test('Mutations reverse row shift', () => {
  const m = new Mutations();
  const grid = [
    [{ value: 2 }, { value: 4 }, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ];
  const shifted = m.executeRowShift(grid);
  m.lastMutation = { type: 'row_shift', details: shifted.details, previousGrid: grid };
  const reversed = m.reverseMutation(shifted.result);
  assert(reversed);
});

test('Mutations detect valid moves', () => {
  const m = new Mutations();
  const grid = [
    [{ value: 2 }, { value: 4 }],
    [{ value: 8 }, { value: 16 }]
  ];
  assert.strictEqual(m.hasValidMoves(grid), false);

  const grid2 = [
    [{ value: 2 }, null],
    [null, null]
  ];
  assert.strictEqual(m.hasValidMoves(grid2), true);
});

test('Mutations detect valid moves with matching values', () => {
  const m = new Mutations();
  const grid = [
    [{ value: 2 }, { value: 2 }],
    [{ value: 4 }, { value: 8 }]
  ];
  assert.strictEqual(m.hasValidMoves(grid), true);
});

test('Mutations reset clears state', () => {
  const m = new Mutations();
  m.warnMutation();
  m.reset();
  assert.strictEqual(m.isWarningActive, false);
  assert.strictEqual(m.lastMutation, null);
});

test('Mutations getMutationChance scales with level', () => {
  const m = new Mutations();
  const chance1 = m.getMutationChance(1);
  const chance5 = m.getMutationChance(5);
  assert(chance5 > chance1);
  assert(chance5 <= 0.3);
});

test('Mutations quadrant rotation produces valid result', () => {
  const m = new Mutations();
  const grid = [
    [{ value: 1 }, { value: 2 }, { value: 5 }, { value: 6 }],
    [{ value: 3 }, { value: 4 }, { value: 7 }, { value: 8 }],
    [{ value: 9 }, { value: 10 }, { value: 11 }, { value: 12 }],
    [{ value: 13 }, { value: 14 }, { value: 15 }, { value: 16 }]
  ];
  const result = m.executeQuadrantRotation(grid);
  assert(result.result);
  // Result should be 4x4
  assert.strictEqual(result.result.length, 4);
  assert.strictEqual(result.result[0].length, 4);
  // All 16 values should still be present (just rearranged)
  const allValues = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      allValues.push(result.result[r][c].value);
  for (let v = 1; v <= 16; v++) {
    assert(allValues.includes(v), `Value ${v} should be present after rotation`);
  }
});

// ─── Special Tiles Tests ───────────────────────────────────────────────────────

console.log('\n=== Special Tiles Tests ===');

test('SpecialTiles identifies special tiles', () => {
  assert.strictEqual(SpecialTiles.isSpecial({ type: 'wildcard' }), true);
  assert.strictEqual(SpecialTiles.isSpecial({ type: 'bomb' }), true);
  assert.strictEqual(SpecialTiles.isSpecial({ type: 'normal' }), false); // 'normal' not in SPECIAL_TYPES
  assert.strictEqual(SpecialTiles.isSpecial(null), null); // short-circuits to null
  assert(SpecialTiles.isSpecial({ value: 4 }) === false || SpecialTiles.isSpecial({ value: 4 }) === undefined);
});

test('SpecialTiles identifies normal tiles', () => {
  assert.strictEqual(SpecialTiles.isNormal({ value: 4 }), true);
  assert.strictEqual(SpecialTiles.isNormal({ value: 4, type: 'wildcard' }), false);
});

test('SpecialTiles wildcard merge with normal', () => {
  const result = SpecialTiles.getMergeResult(
    { value: 2, type: 'wildcard' },
    { value: 8 }
  );
  assert.strictEqual(result.value, 8);
});

test('SpecialTiles two wildcards merge to 4', () => {
  const result = SpecialTiles.getMergeResult(
    { value: 2, type: 'wildcard' },
    { value: 2, type: 'wildcard' }
  );
  assert.strictEqual(result.value, 4);
});

test('SpecialTiles bomb cannot merge', () => {
  const result = SpecialTiles.getMergeResult(
    { value: 2, type: 'bomb' },
    { value: 2 }
  );
  assert.strictEqual(result, null);
});

test('SpecialTiles multiplier cannot merge', () => {
  const result = SpecialTiles.getMergeResult(
    { value: 2, type: 'multiplier' },
    { value: 2 }
  );
  assert.strictEqual(result, null);
});

test('SpecialTiles fusion core triples merge', () => {
  const result = SpecialTiles.getMergeResult(
    { value: 8, type: 'fusion_core' },
    { value: 8 }
  );
  assert.strictEqual(result.value, 24);
});

test('SpecialTiles shield cannot merge when active', () => {
  const result = SpecialTiles.getMergeResult(
    { value: 4, type: 'shield', shieldMovesLeft: 1 },
    { value: 4 }
  );
  assert.strictEqual(result, null);
});

test('SpecialTiles normal tiles merge', () => {
  const result = SpecialTiles.getMergeResult(
    { value: 16 },
    { value: 16 }
  );
  assert.strictEqual(result.value, 32);
});

test('SpecialTiles normal tiles with different values do not merge', () => {
  const result = SpecialTiles.getMergeResult(
    { value: 16 },
    { value: 32 }
  );
  assert.strictEqual(result, null);
});

test('SpecialTiles multiplier check', () => {
  const grid = [
    [{ type: 'multiplier' }, null, null],
    [{ value: 4 }, null, null],
    [null, null, null]
  ];
  const { multiplier, consumed } = SpecialTiles.checkMultipliers(grid, 1, 0);
  assert.strictEqual(multiplier, 2);
  assert.strictEqual(consumed.length, 1);
});

test('SpecialTiles shield expiry', () => {
  const grid = [
    [{ value: 4, type: 'shield', shieldMovesLeft: 1 }]
  ];
  const result = SpecialTiles.expireShields(grid);
  assert.strictEqual(result[0][0].type, undefined);
  assert.strictEqual(result[0][0].shieldMovesLeft, undefined);
});

test('SpecialTiles spawn probability increases with level', () => {
  const p1 = SpecialTiles.getSpawnProbability('wildcard', 1);
  const p5 = SpecialTiles.getSpawnProbability('wildcard', 5);
  assert(p5 > p1);
});

// ─── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${skipped} skipped ===\n`);
process.exit(failed > 0 ? 1 : 0);
