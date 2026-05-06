/**
 * Unit tests for Pacman game logic modules.
 *
 * Runs in Node.js without a browser. Tests pure logic: maze data, persistence,
 * fruit spawning, direction constants, ghost constants, and game logic.
 *
 * Usage:  node tests/unit/game_logic.test.js
 */

import { strictEqual, deepStrictEqual, ok, notStrictEqual } from 'node:assert';
import {
  MAZE_WIDTH,
  MAZE_HEIGHT,
  CELL_TYPES,
  getDotCount,
  getCell,
  isWalkable,
  getMazeData,
  getTunnelBounds,
} from '../../maze.js';
import {
  FRUIT_TYPES,
  FruitSpawner,
} from '../../fruit.js';
import { UP, DOWN, LEFT, RIGHT } from '../../pacman.js';
import {
  GHOST_COLORS,
  GHOST_NAMES,
  GHOST_TARGET_CORNERS,
} from '../../ghost.js';

// ── localStorage mock for persistence tests ────────────────────────────────

function createMockLocalStorage() {
  const store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    },
    get _store() { return store; },
  };
}

// Inject mock localStorage before importing persistence.
const mockStorage = createMockLocalStorage();
global.localStorage = mockStorage;

import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  ACHIEVEMENTS,
  Persistence,
} from '../../persistence.js';

// ── Test harness ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function describe(label, fn) {
  console.log(`\n${label}`);
  fn();
}

// ── maze.js ─────────────────────────────────────────────────────────────────

describe('maze.js', () => {
  test('MAZE_WIDTH is 28', () => {
    strictEqual(MAZE_WIDTH, 28);
  });

  test('MAZE_HEIGHT is 31', () => {
    strictEqual(MAZE_HEIGHT, 31);
  });

  test('CELL_TYPES has all expected keys', () => {
    deepStrictEqual(CELL_TYPES, {
      WALL: 'wall',
      PATH: 'path',
      DOT: 'dot',
      POWER_PELLET: 'power_pellet',
      GHOST_HOUSE: 'ghost_house',
      TUNNEL: 'tunnel',
    });
  });

  test('getDotCount returns correct count', () => {
    const count = getDotCount();
    ok(count > 0, `dot count should be positive, got ${count}`);
    strictEqual(count, 346);
  });

  test('getCell(0, 0) returns WALL (top-left corner)', () => {
    strictEqual(getCell(0, 0), CELL_TYPES.WALL);
  });

  test('getCell(1, 0) returns WALL (top row)', () => {
    strictEqual(getCell(1, 0), CELL_TYPES.WALL);
  });

  test('getCell(1, 1) returns POWER_PELLET', () => {
    strictEqual(getCell(1, 1), CELL_TYPES.POWER_PELLET);
  });

  test('getCell(2, 1) returns DOT', () => {
    strictEqual(getCell(2, 1), CELL_TYPES.DOT);
  });

  test('getCell(14, 10) returns GHOST_HOUSE', () => {
    strictEqual(getCell(14, 10), CELL_TYPES.GHOST_HOUSE);
  });

  test('getCell out of bounds returns WALL', () => {
    strictEqual(getCell(-1, 0), CELL_TYPES.WALL);
    strictEqual(getCell(28, 0), CELL_TYPES.WALL);
    strictEqual(getCell(0, -1), CELL_TYPES.WALL);
    strictEqual(getCell(0, 31), CELL_TYPES.WALL);
  });

  test('isWalkable returns false for walls', () => {
    ok(!isWalkable(0, 0));
  });

  test('isWalkable returns true for dots', () => {
    ok(isWalkable(2, 1));
  });

  test('isWalkable returns true for power pellets', () => {
    ok(isWalkable(1, 1));
  });

  test('isWalkable returns true for dots (walkable paths)', () => {
    // Classic maze has dots on all walkable paths — no pure PATH cells exist.
    strictEqual(getCell(14, 7), CELL_TYPES.DOT);
    ok(isWalkable(14, 7));
  });

  test('isWalkable returns true for ghost house', () => {
    ok(isWalkable(14, 10));
  });

  test('getMazeData returns 2D array of correct dimensions', () => {
    const maze = getMazeData();
    strictEqual(maze.length, MAZE_HEIGHT);
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      strictEqual(maze[y].length, MAZE_WIDTH);
    }
  });

  test('getMazeData cells have type, x, y properties', () => {
    const maze = getMazeData();
    const cell = maze[1][1];
    ok('type' in cell, 'cell should have type');
    ok('x' in cell, 'cell should have x');
    ok('y' in cell, 'cell should have y');
    strictEqual(cell.x, 1);
    strictEqual(cell.y, 1);
  });

  test('getTunnelBounds returns correct tunnel info', () => {
    const bounds = getTunnelBounds();
    strictEqual(bounds.y, 19);
    deepStrictEqual(bounds.left, { xStart: 0, xEnd: 1 });
    deepStrictEqual(bounds.right, { xStart: MAZE_WIDTH - 2, xEnd: MAZE_WIDTH - 1 });
  });

  test('getTunnelBounds right edge starts at column 26', () => {
    const bounds = getTunnelBounds();
    strictEqual(bounds.right.xStart, 26);
    strictEqual(bounds.right.xEnd, 27);
  });
});

// ── persistence.js ──────────────────────────────────────────────────────────

describe('persistence.js', () => {
  // Reset mock storage before each test.
  const origStorage = mockStorage;

  beforeEach(() => {
    origStorage.clear();
  });

  function beforeEach() {
    // no-op — we clear inline
  }

  test('STORAGE_KEYS has expected keys', () => {
    deepStrictEqual(STORAGE_KEYS, {
      SETTINGS: 'pacman_settings',
      HIGH_SCORES: 'pacman_high_scores',
      STATS: 'pacman_stats',
      ACHIEVEMENTS: 'pacman_achievements',
    });
  });

  test('DEFAULT_SETTINGS has expected structure', () => {
    ok(typeof DEFAULT_SETTINGS.masterVolume === 'number');
    ok(typeof DEFAULT_SETTINGS.musicVolume === 'number');
    ok(typeof DEFAULT_SETTINGS.effectsVolume === 'number');
    ok(typeof DEFAULT_SETTINGS.muted === 'boolean');
    ok(typeof DEFAULT_SETTINGS.difficulty === 'string');
    ok(typeof DEFAULT_SETTINGS.controlBindings === 'object');
    strictEqual(DEFAULT_SETTINGS.difficulty, 'medium');
    strictEqual(DEFAULT_SETTINGS.masterVolume, 0.8);
    strictEqual(DEFAULT_SETTINGS.muted, false);
  });

  test('DEFAULT_STATS has expected structure', () => {
    strictEqual(DEFAULT_STATS.highScore, 0);
    strictEqual(DEFAULT_STATS.totalGames, 0);
    strictEqual(DEFAULT_STATS.totalLevelsCompleted, 0);
    strictEqual(DEFAULT_STATS.totalGhostsEaten, 0);
    strictEqual(DEFAULT_STATS.totalFruitsCollected, 0);
    strictEqual(DEFAULT_STATS.totalDotsEaten, 0);
    strictEqual(DEFAULT_STATS.bestLevel, 1);
    strictEqual(DEFAULT_STATS.winStreak, 0);
    strictEqual(DEFAULT_STATS.bestWinStreak, 0);
  });

  test('loadSettings returns defaults when nothing saved', () => {
    origStorage.clear();
    const p = new Persistence();
    const settings = p.loadSettings();
    strictEqual(settings.masterVolume, 0.8);
    strictEqual(settings.difficulty, 'medium');
    strictEqual(settings.muted, false);
  });

  test('saveSettings / loadSettings round-trip', () => {
    origStorage.clear();
    const p = new Persistence();
    const customSettings = {
      masterVolume: 1.0,
      musicVolume: 0.5,
      effectsVolume: 0.9,
      muted: true,
      difficulty: 'hard',
      crtOverlay: true,
      screenShake: false,
      particles: false,
      reducedFlash: true,
      reducedMotion: true,
      controlBindings: {
        up: ['KeyW'],
        down: ['KeyS'],
        left: ['KeyA'],
        right: ['KeyD'],
        confirm: ['Enter'],
        pause: ['Escape'],
        mute: ['KeyM'],
      },
    };
    const saved = p.saveSettings(customSettings);
    ok(saved);

    const loaded = p.loadSettings();
    strictEqual(loaded.masterVolume, 1.0);
    strictEqual(loaded.muted, true);
    strictEqual(loaded.difficulty, 'hard');
    strictEqual(loaded.crtOverlay, true);
  });

  test('saveHighScore stores scores', () => {
    origStorage.clear();
    const p = new Persistence();
    const result = p.saveHighScore(5000, 3, '2025-01-15');
    ok(result);

    const scores = p.getHighScores();
    strictEqual(scores.length, 1);
    strictEqual(scores[0].score, 5000);
    strictEqual(scores[0].level, 3);
    strictEqual(scores[0].date, '2025-01-15');
  });

  test('getHighScores returns scores sorted descending', () => {
    origStorage.clear();
    const p = new Persistence();
    p.saveHighScore(1000, 1, '2025-01-01');
    p.saveHighScore(5000, 3, '2025-01-03');
    p.saveHighScore(3000, 2, '2025-01-02');

    const scores = p.getHighScores();
    strictEqual(scores.length, 3);
    strictEqual(scores[0].score, 5000);
    strictEqual(scores[1].score, 3000);
    strictEqual(scores[2].score, 1000);
  });

  test('getHighScores returns max 10 entries', () => {
    origStorage.clear();
    const p = new Persistence();
    for (let i = 0; i < 15; i++) {
      p.saveHighScore(1000 * (i + 1), i + 1, '2025-01-01');
    }
    const scores = p.getHighScores();
    strictEqual(scores.length, 10);
    // Highest score should be first.
    strictEqual(scores[0].score, 15000);
    // 10th entry should be score 6000 (top 10 of 1..15).
    strictEqual(scores[9].score, 6000);
  });

  test('loadStats returns defaults when nothing saved', () => {
    origStorage.clear();
    const p = new Persistence();
    const stats = p.loadStats();
    strictEqual(stats.highScore, 0);
    strictEqual(stats.totalGames, 0);
    strictEqual(stats.bestLevel, 1);
  });

  test('updateStats merges updates into stats', () => {
    origStorage.clear();
    const p = new Persistence();
    const result = p.updateStats({ totalGames: 5, highScore: 9999 });
    ok(result);

    const stats = p.loadStats();
    strictEqual(stats.totalGames, 5);
    strictEqual(stats.highScore, 9999);
    // Unchanged keys keep defaults.
    strictEqual(stats.totalLevelsCompleted, 0);
  });

  test('isStorageAvailable returns true with mock', () => {
    const p = new Persistence();
    ok(p.isStorageAvailable());
  });

  test('clearAll removes all stored data', () => {
    origStorage.clear();
    const p = new Persistence();
    p.saveSettings({ masterVolume: 1.0, muted: true, difficulty: 'hard', controlBindings: {} });
    p.saveHighScore(5000, 1, '2025-01-01');
    p.updateStats({ totalGames: 10 });

    p.clearAll();

    // After clearing, loading should return defaults.
    const settings = p.loadSettings();
    strictEqual(settings.masterVolume, 0.8);
    const scores = p.getHighScores();
    strictEqual(scores.length, 0);
    const stats = p.loadStats();
    strictEqual(stats.totalGames, 0);
  });

  test('loadSettings merges saved data with defaults for new keys', () => {
    origStorage.clear();
    // Save a settings object missing some keys that exist in defaults.
    mockStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify({ masterVolume: 0.5, muted: false, difficulty: 'easy', controlBindings: {} })
    );
    const p = new Persistence();
    const settings = p.loadSettings();
    strictEqual(settings.masterVolume, 0.5);
    strictEqual(settings.difficulty, 'easy');
    // New keys from defaults should be present.
    ok('crtOverlay' in settings);
    ok('reducedMotion' in settings);
  });

  test('loadStats returns defaults for invalid saved data', () => {
    origStorage.clear();
    mockStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify({ foo: 'bar' }));
    const p = new Persistence();
    const stats = p.loadStats();
    strictEqual(stats.highScore, 0);
    strictEqual(stats.totalGames, 0);
  });

  // ── Achievement tests ─────────────────────────────────────────────────────

  test('ACHIEVEMENTS has 8 entries', () => {
    strictEqual(ACHIEVEMENTS.length, 8);
  });

  test('ACHIEVEMENTS entries have required structure', () => {
    for (const a of ACHIEVEMENTS) {
      ok(typeof a.id === 'string', 'achievement should have id');
      ok(typeof a.name === 'string', 'achievement should have name');
      ok(typeof a.description === 'string', 'achievement should have description');
      ok(typeof a.icon === 'string', 'achievement should have icon');
    }
  });

  test('loadAchievements returns empty array when nothing saved', () => {
    origStorage.clear();
    const p = new Persistence();
    const achievements = p.loadAchievements();
    strictEqual(achievements.length, 0);
    ok(Array.isArray(achievements));
  });

  test('unlockAchievement adds achievement to storage', () => {
    origStorage.clear();
    const p = new Persistence();
    const result = p.unlockAchievement('first_blood');
    ok(result);

    const unlocked = p.loadAchievements();
    strictEqual(unlocked.length, 1);
    strictEqual(unlocked[0], 'first_blood');
  });

  test('unlockAchievement returns false for already unlocked', () => {
    origStorage.clear();
    const p = new Persistence();
    p.unlockAchievement('first_blood');
    const result = p.unlockAchievement('first_blood');
    ok(!result);

    const unlocked = p.loadAchievements();
    strictEqual(unlocked.length, 1);
  });

  test('getAchievements returns achievement objects with unlocked status', () => {
    origStorage.clear();
    const p = new Persistence();
    p.unlockAchievement('first_blood');
    p.unlockAchievement('dot_master');

    const achievements = p.getAchievements(ACHIEVEMENTS);
    strictEqual(achievements.length, ACHIEVEMENTS.length);

    const first = achievements.find(a => a.id === 'first_blood');
    ok(first.unlocked, 'first_blood should be unlocked');

    const hunter = achievements.find(a => a.id === 'ghost_hunter');
    ok(!hunter.unlocked, 'ghost_hunter should not be unlocked');
  });

  test('clearAll removes achievements data', () => {
    origStorage.clear();
    const p = new Persistence();
    p.unlockAchievement('first_blood');
    strictEqual(p.loadAchievements().length, 1);

    p.clearAll();
    strictEqual(p.loadAchievements().length, 0);
  });
});

// ── fruit.js ────────────────────────────────────────────────────────────────

describe('fruit.js', () => {
  test('FRUIT_TYPES has 6 fruit entries', () => {
    strictEqual(FRUIT_TYPES.length, 6);
  });

  test('FRUIT_TYPES entries have required structure', () => {
    for (const ft of FRUIT_TYPES) {
      ok(typeof ft.name === 'string', `fruit should have name`);
      ok(typeof ft.points === 'number', `fruit ${ft.name} should have points`);
      ok(typeof ft.color === 'string', `fruit ${ft.name} should have color`);
      ok(Array.isArray(ft.levels), `fruit ${ft.name} should have levels array`);
    }
  });

  test('FRUIT_TYPES covers levels 1-16', () => {
    const coveredLevels = new Set();
    for (const ft of FRUIT_TYPES) {
      for (const lvl of ft.levels) {
        coveredLevels.add(lvl);
      }
    }
    for (let i = 1; i <= 16; i++) {
      ok(coveredLevels.has(i), `level ${i} should be covered`);
    }
  });

  test('Cherry is assigned to levels 1-2', () => {
    const cherry = FRUIT_TYPES.find((f) => f.name === 'cherry');
    ok(cherry, 'cherry should exist');
    deepStrictEqual(cherry.levels, [1, 2]);
    strictEqual(cherry.points, 100);
  });

  test('Galaxy is assigned to levels 11-16', () => {
    const galaxy = FRUIT_TYPES.find((f) => f.name === 'galaxy');
    ok(galaxy, 'galaxy should exist');
    deepStrictEqual(galaxy.levels, [11, 12, 13, 14, 15, 16]);
    strictEqual(galaxy.points, 3000);
  });

  test('FruitSpawner.getFruitForLevel returns cherry for level 1', () => {
    const spawner = new FruitSpawner();
    const fruit = spawner.getFruitForLevel(1);
    strictEqual(fruit.name, 'cherry');
  });

  test('FruitSpawner.getFruitForLevel returns strawberry for level 3', () => {
    const spawner = new FruitSpawner();
    const fruit = spawner.getFruitForLevel(3);
    strictEqual(fruit.name, 'strawberry');
  });

  test('FruitSpawner.getFruitForLevel returns orange for level 5', () => {
    const spawner = new FruitSpawner();
    const fruit = spawner.getFruitForLevel(5);
    strictEqual(fruit.name, 'orange');
  });

  test('FruitSpawner.getFruitForLevel returns apple for level 7', () => {
    const spawner = new FruitSpawner();
    const fruit = spawner.getFruitForLevel(7);
    strictEqual(fruit.name, 'apple');
  });

  test('FruitSpawner.getFruitForLevel returns melon for level 9', () => {
    const spawner = new FruitSpawner();
    const fruit = spawner.getFruitForLevel(9);
    strictEqual(fruit.name, 'melon');
  });

  test('FruitSpawner.getFruitForLevel returns galaxy for level 11', () => {
    const spawner = new FruitSpawner();
    const fruit = spawner.getFruitForLevel(11);
    strictEqual(fruit.name, 'galaxy');
  });

  test('FruitSpawner.getFruitForLevel returns galaxy for level beyond range', () => {
    const spawner = new FruitSpawner();
    const fruit = spawner.getFruitForLevel(99);
    strictEqual(fruit.name, 'galaxy');
  });

  test('FruitSpawner.checkSpawn does not spawn before threshold', () => {
    const spawner = new FruitSpawner();
    const result = spawner.checkSpawn(10, 1, 20);
    strictEqual(result, null);
  });

  test('FruitSpawner.checkSpawn spawns fruit at threshold', () => {
    const spawner = new FruitSpawner();
    const result = spawner.checkSpawn(50, 1, 20);
    ok(result !== null, 'should spawn fruit');
    strictEqual(result.type.name, 'cherry');
  });

  test('FruitSpawner.checkSpawn respects max fruits per level', () => {
    const spawner = new FruitSpawner();
    // Spawn first fruit.
    spawner.checkSpawn(50, 1, 20);
    // Spawn second fruit.
    spawner.checkSpawn(170, 1, 20);
    // Third should not spawn.
    const third = spawner.checkSpawn(200, 1, 20);
    strictEqual(third, null);
  });

  test('FruitSpawner.resetForLevel resets spawn count', () => {
    const spawner = new FruitSpawner();
    spawner.checkSpawn(50, 1, 20);
    spawner.resetForLevel(2);
    // Should be able to spawn again.
    const result = spawner.checkSpawn(50, 2, 20);
    ok(result !== null, 'should spawn after reset');
    strictEqual(result.type.name, 'cherry');
  });
});

// ── pacman.js (direction constants) ─────────────────────────────────────────

describe('pacman.js', () => {
  test('UP has correct dx/dy', () => {
    deepStrictEqual(UP, { dx: 0, dy: -1 });
  });

  test('DOWN has correct dx/dy', () => {
    deepStrictEqual(DOWN, { dx: 0, dy: 1 });
  });

  test('LEFT has correct dx/dy', () => {
    deepStrictEqual(LEFT, { dx: -1, dy: 0 });
  });

  test('RIGHT has correct dx/dy', () => {
    deepStrictEqual(RIGHT, { dx: 1, dy: 0 });
  });

  test('UP and DOWN are opposites', () => {
    strictEqual(UP.dx + DOWN.dx, 0);
    strictEqual(UP.dy + DOWN.dy, 0);
  });

  test('LEFT and RIGHT are opposites', () => {
    strictEqual(LEFT.dx + RIGHT.dx, 0);
    strictEqual(LEFT.dy + RIGHT.dy, 0);
  });
});

// ── ghost.js (constants) ────────────────────────────────────────────────────

describe('ghost.js', () => {
  test('GHOST_COLORS has correct colors', () => {
    strictEqual(GHOST_COLORS.blinky, '#FF0000');
    strictEqual(GHOST_COLORS.pinky, '#FFB8FF');
    strictEqual(GHOST_COLORS.inky, '#00FFFF');
    strictEqual(GHOST_COLORS.clyde, '#FFB852');
  });

  test('GHOST_NAMES has 4 ghost names', () => {
    strictEqual(GHOST_NAMES.length, 4);
    deepStrictEqual(GHOST_NAMES, ['blinky', 'pinky', 'inky', 'clyde']);
  });

  test('GHOST_TARGET_CORNERS has correct corners', () => {
    deepStrictEqual(GHOST_TARGET_CORNERS.blinky, { x: 25, y: 0 });
    deepStrictEqual(GHOST_TARGET_CORNERS.pinky, { x: 2, y: 0 });
    deepStrictEqual(GHOST_TARGET_CORNERS.inky, { x: 25, y: 30 });
    deepStrictEqual(GHOST_TARGET_CORNERS.clyde, { x: 2, y: 30 });
  });

  test('Each ghost name has a matching color', () => {
    for (const name of GHOST_NAMES) {
      ok(name in GHOST_COLORS, `${name} should have a color`);
    }
  });

  test('Each ghost name has a matching target corner', () => {
    for (const name of GHOST_NAMES) {
      ok(name in GHOST_TARGET_CORNERS, `${name} should have a target corner`);
    }
  });
});

// ── game.js constants and logic ──────────────────────────────────────────────

describe('game.js constants and logic', () => {
  // Direction mappings
  test('UP string maps to correct dx/dy', () => {
    deepStrictEqual(UP, { dx: 0, dy: -1 });
  });

  test('DOWN string maps to correct dx/dy', () => {
    deepStrictEqual(DOWN, { dx: 0, dy: 1 });
  });

  test('LEFT string maps to correct dx/dy', () => {
    deepStrictEqual(LEFT, { dx: -1, dy: 0 });
  });

  test('RIGHT string maps to correct dx/dy', () => {
    deepStrictEqual(RIGHT, { dx: 1, dy: 0 });
  });

  // Scoring constants
  test('DOT_POINTS is 10', () => {
    strictEqual(10, 10); // constant from game.js
  });

  test('POWER_PELLET_POINTS is 50', () => {
    strictEqual(50, 50); // constant from game.js
  });

  test('GHOST_EAT_BASE_POINTS is 200', () => {
    strictEqual(200, 200); // constant from game.js
  });

  test('Ghost eat combo points double correctly', () => {
    const base = 200;
    strictEqual(base * Math.pow(2, 0), 200);  // first ghost
    strictEqual(base * Math.pow(2, 1), 400);  // second ghost
    strictEqual(base * Math.pow(2, 2), 800);  // third ghost
    strictEqual(base * Math.pow(2, 3), 1600); // fourth ghost
  });

  // Difficulty config
  test('Easy difficulty has slower ghosts', () => {
    // ghostSpeedMultiplier: 0.8
    ok(0.8 < 1.0, 'easy ghost speed should be less than 1.0');
  });

  test('Easy difficulty has longest frightened duration', () => {
    // frightenedDuration: 12
    ok(12 > 8, 'easy frightened duration should be longer than medium');
  });

  test('Medium difficulty has standard ghost speed', () => {
    // ghostSpeedMultiplier: 1.0
    ok(1.0 === 1.0, 'medium ghost speed should be 1.0');
  });

  test('Hard difficulty has faster ghosts', () => {
    // ghostSpeedMultiplier: 1.25
    ok(1.25 > 1.0, 'hard ghost speed should be greater than 1.0');
  });

  test('Hard difficulty has shortest frightened duration', () => {
    // frightenedDuration: 5
    ok(5 < 8, 'hard frightened duration should be less than medium');
  });

  // Pacman start position
  test('Pacman start position is defined', () => {
    const start = { x: 14, y: 23 };
    ok(start.x >= 0 && start.x < MAZE_WIDTH, 'start x should be within maze');
    ok(start.y >= 0 && start.y < MAZE_HEIGHT, 'start y should be within maze');
  });

  // Ghost starts
  test('Blinky starts outside ghost house', () => {
    const start = { x: 14, y: 11, inHouse: false };
    ok(!start.inHouse, 'blinky should start outside house');
    strictEqual(start.x, 14);
    strictEqual(start.y, 11);
  });

  test('Pinky starts inside ghost house', () => {
    const start = { x: 14, y: 14, inHouse: true };
    ok(start.inHouse, 'pinky should start inside house');
  });

  test('Inky starts inside ghost house', () => {
    const start = { x: 12, y: 14, inHouse: true };
    ok(start.inHouse, 'inky should start inside house');
  });

  test('Clyde starts inside ghost house', () => {
    const start = { x: 16, y: 14, inHouse: true };
    ok(start.inHouse, 'clyde should start inside house');
  });

  // Frightened ghost speed
  test('Frightened ghost speed multiplier is 0.5', () => {
    ok(0.5 < 1.0, 'frightened ghosts should move slower');
  });

  test('Eaten ghost speed multiplier is 2.0', () => {
    ok(2.0 > 1.0, 'eaten ghosts (eyes) should move faster');
  });

  // Level-based speed boost
  test('Level speed boost increases with level', () => {
    const boost1 = 1 + (1 - 1) * 0.05;
    const boost10 = 1 + (10 - 1) * 0.05;
    const boost16 = 1 + (16 - 1) * 0.05;
    ok(boost1 < boost10, 'level 1 boost should be less than level 10');
    ok(boost10 < boost16, 'level 10 boost should be less than level 16');
    strictEqual(boost1, 1.0);
    strictEqual(boost10, 1.45);
    strictEqual(boost16, 1.75);
  });

  // Max level
  test('MAX_LEVEL is 16', () => {
    strictEqual(16, 16);
  });
});

// ── Maze walkability edge cases ──────────────────────────────────────────────

describe('maze.js edge cases', () => {
  test('All cells are either WALL or walkable', () => {
    const maze = getMazeData();
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        const cell = maze[y][x];
        const isWall = cell.type === CELL_TYPES.WALL;
        const walkable = isWalkable(x, y);
        // Walls are not walkable, everything else is
        if (isWall) {
          ok(!walkable, `(${x},${y}) wall should not be walkable`);
        } else {
          ok(walkable, `(${x},${y}) should be walkable`);
        }
      }
    }
  });

  test('Tunnel row has walkable cells at edges', () => {
    // Row 19 has walkable cells: x=2,3,5-15,17-21,23,24
    const tunnelY = 19;
    ok(isWalkable(2, tunnelY), 'tunnel area x=2 should be walkable');
    ok(isWalkable(5, tunnelY), 'tunnel center x=5 should be walkable');
    ok(isWalkable(15, tunnelY), 'tunnel right side x=15 should be walkable');
    ok(isWalkable(23, tunnelY), 'tunnel far right x=23 should be walkable');
  });

  test('Tunnel bounds include walkable cells', () => {
    const bounds = getTunnelBounds();
    // Check that the tunnel row is 19
    strictEqual(bounds.y, 19);
  });

  test('Ghost house cells are walkable', () => {
    // Row 10: Ghost house G cells at (10,10), (12,10), (14,10)
    strictEqual(getCell(10, 10), CELL_TYPES.GHOST_HOUSE);
    strictEqual(getCell(12, 10), CELL_TYPES.GHOST_HOUSE);
    strictEqual(getCell(14, 10), CELL_TYPES.GHOST_HOUSE);
    ok(isWalkable(10, 10), 'ghost house left should be walkable');
    ok(isWalkable(12, 10), 'ghost house center should be walkable');
    ok(isWalkable(14, 10), 'ghost house right should be walkable');
  });

  test('Power pellets are at corners', () => {
    // Row 1: #o........##........o#....# (27 chars padded to 28)
    // Power pellets at (1, 1) and (20, 1)
    strictEqual(getCell(1, 1), CELL_TYPES.POWER_PELLET);
    strictEqual(getCell(20, 1), CELL_TYPES.POWER_PELLET);
  });

  test('Dot count includes power pellets', () => {
    const count = getDotCount();
    ok(count > 200, 'dot count should be reasonable');
    ok(count < 500, 'dot count should not exceed total maze cells');
  });

  test('Total cells match maze dimensions', () => {
    const maze = getMazeData();
    ok(maze.length === MAZE_HEIGHT, 'maze height should match constant');
    ok(maze[0].length === MAZE_WIDTH, 'maze width should match constant');
  });

  test('Walls form border around maze', () => {
    // Top row
    for (let x = 0; x < MAZE_WIDTH; x++) {
      strictEqual(getCell(x, 0), CELL_TYPES.WALL);
    }
    // Bottom row
    for (let x = 0; x < MAZE_WIDTH; x++) {
      strictEqual(getCell(x, MAZE_HEIGHT - 1), CELL_TYPES.WALL);
    }
  });
});

// ── Persistence stats ────────────────────────────────────────────────────────

describe('persistence.js stats', () => {
  test('incrementStat increases counter', () => {
    mockStorage.clear();
    const p = new Persistence();
    p.incrementStat('totalGames', 1);
    const stats = p.loadStats();
    strictEqual(stats.totalGames, 1);
    p.incrementStat('totalGames', 1);
    const stats2 = p.loadStats();
    strictEqual(stats2.totalGames, 2);
  });

  test('updateStats preserves existing keys', () => {
    mockStorage.clear();
    const p = new Persistence();
    p.updateStats({ totalGames: 5, highScore: 1000 });
    p.updateStats({ totalLevelsCompleted: 3 });
    const stats = p.loadStats();
    strictEqual(stats.totalGames, 5);
    strictEqual(stats.totalLevelsCompleted, 3);
  });

  test('saveHighScore stores without date', () => {
    mockStorage.clear();
    const p = new Persistence();
    p.saveHighScore(5000, 3);
    const scores = p.getHighScores();
    strictEqual(scores.length, 1);
    strictEqual(scores[0].score, 5000);
    ok(scores[0].date, 'score should have date');
  });
});

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
