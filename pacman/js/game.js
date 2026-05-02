import {
  BONUS_FRUIT_LIFETIME,
  COUNTDOWN_START,
  DIFFICULTIES,
  DIRECTIONS,
  GHOST_EAT_POINTS,
  LEVEL_BETWEEN_DELAY,
  POWER_PELLET_POINTS,
  RESPAWN_DELAY,
  TILE
} from './constants.js';
import { canEnter, createMaze, findShortestPath, getCell, getNeighbors, isPelletTile, moveTile } from './maze.js';
import {
  chooseGhostDirection,
  createGhosts,
  getGhostSpeed,
  resetGhost,
  restoreGhostMode,
  setGhostEaten,
  setGhostFrightened,
  updateGhostRelease
} from './ghosts.js';

const PACMAN_BASE_SPEED = 4.45;
const FRUIT_SPAWN_JITTER = 2500;

function cloneTile(tile) {
  return { x: tile.x, y: tile.y };
}

function createMover(tile, speed) {
  return {
    tile: cloneTile(tile),
    from: cloneTile(tile),
    to: cloneTile(tile),
    direction: 'left',
    bufferedDirection: null,
    stepProgress: 0,
    moving: false,
    speed,
    stepsTaken: 0
  };
}

function startMove(entity, maze, direction, actor, speed) {
  if (!direction) {
    return false;
  }
  const next = moveTile(maze, entity.tile, direction);
  if (!canEnter(maze, next, actor)) {
    return false;
  }
  entity.direction = direction;
  entity.from = cloneTile(entity.tile);
  entity.to = next;
  entity.stepProgress = 0;
  entity.speed = speed;
  entity.moving = true;
  return true;
}

function positionBetween(entity) {
  return {
    x: entity.from.x + (entity.to.x - entity.from.x) * entity.stepProgress,
    y: entity.from.y + (entity.to.y - entity.from.y) * entity.stepProgress
  };
}

function getDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getGhostHomeTile(maze) {
  return { ...maze.ghostHouse.home };
}

function resetEntity(entity, tile, direction = 'left') {
  entity.tile = cloneTile(tile);
  entity.from = cloneTile(tile);
  entity.to = cloneTile(tile);
  entity.direction = direction;
  entity.bufferedDirection = null;
  entity.stepProgress = 0;
  entity.moving = false;
  entity.stepsTaken = 0;
}

function updateCountDown(game, delta) {
  game.state.countdown -= delta / 1000;
  if (game.state.countdown <= 0) {
    game.state.countdown = 0;
    game.state.phase = 'playing';
    game.emit('message', { text: 'Go!' });
    game.emit('countdown-finished', {});
  }
}

function updateRespawn(game, delta) {
  game.state.respawnTimer -= delta;
  if (game.state.respawnTimer <= 0) {
    game.resetRound();
    game.state.phase = 'playing';
    game.emit('message', { text: game.state.practiceMode ? 'Practice continues.' : 'Back in the maze!' });
  }
}

function updateBetweenLevels(game, delta) {
  game.state.levelAdvanceTimer -= delta;
  if (game.state.levelAdvanceTimer <= 0) {
    game.startLevel(game.state.level + 1, { keepScore: true, announce: false });
  }
}

function maybeSpawnFruit(game, dt) {
  const state = game.state;
  state.fruitTimer -= dt;
  if (state.fruit || state.fruitTimer > 0 || state.gameOver || state.phase !== 'playing') {
    return;
  }
  const fruitIndex = (state.level - 1) % 8;
  const fruit = {
    ...state.maze.fruitSpawn,
    value: 0,
    lifetime: BONUS_FRUIT_LIFETIME,
    data: fruitCatalog(fruitIndex)
  };
  state.fruit = fruit;
  state.fruitTimer = state.difficulty.fruitInterval * 1000 + Math.floor(game.random() * FRUIT_SPAWN_JITTER) + 5000;
  game.emit('fruit-spawned', { fruit });
  game.emit('message', { text: `${fruit.data.name} appeared!` });
}

function fruitCatalog(index) {
  const fruits = [
    { id: 'cherry', name: 'Cherry', points: 100, color: '#ff5b5f', accent: '#8b1320', symbol: '🍒' },
    { id: 'strawberry', name: 'Strawberry', points: 300, color: '#ff3b79', accent: '#ffd5e0', symbol: '🍓' },
    { id: 'orange', name: 'Orange', points: 500, color: '#ff9d4d', accent: '#7c3f0a', symbol: '🍊' },
    { id: 'apple', name: 'Apple', points: 700, color: '#ff6767', accent: '#3d0c11', symbol: '🍎' },
    { id: 'melon', name: 'Melon', points: 1000, color: '#8cff7a', accent: '#235a20', symbol: '🍉' },
    { id: 'galaxian', name: 'Galaxian', points: 1200, color: '#7ad8ff', accent: '#0c3551', symbol: '✨' },
    { id: 'bell', name: 'Bell', points: 1500, color: '#ffe06f', accent: '#8d5d00', symbol: '🔔' },
    { id: 'key', name: 'Key', points: 2000, color: '#d4dbff', accent: '#3a476f', symbol: '🔑' }
  ];
  return fruits[index % fruits.length];
}

function updateFruit(game, dt) {
  const state = game.state;
  if (!state.fruit) {
    maybeSpawnFruit(game, dt);
    return;
  }
  state.fruit.lifetime -= dt;
  if (state.fruit.lifetime <= 0) {
    state.fruit = null;
    game.emit('message', { text: 'The bonus fruit vanished.' });
    return;
  }
  const pacmanPos = positionBetween(state.pacman);
  const fruitDistance = getDistance(pacmanPos, state.fruit);
  if (fruitDistance < 0.45) {
    const fruitData = state.fruit.data;
    state.score += fruitData.points;
    state.summary.fruitsCollected += 1;
    game.emit('score', { amount: fruitData.points, score: state.score });
    game.emit('fruit-collected', { fruit: fruitData, score: state.score });
    state.fruit = null;
    state.message = `${fruitData.name} collected!`;
  }
}

function updateGlobalMode(game, delta) {
  const state = game.state;
  const schedule = state.difficulty.modeSchedule;
  if (!schedule.length) {
    return;
  }
  state.modeRemaining -= delta;
  if (state.modeRemaining > 0) {
    return;
  }
  state.modeIndex = Math.min(state.modeIndex + 1, schedule.length - 1);
  state.globalMode = schedule[state.modeIndex].mode;
  state.modeRemaining = schedule[state.modeIndex].seconds === Infinity ? Infinity : schedule[state.modeIndex].seconds * 1000;
  state.ghosts.forEach((ghost) => {
    if (!ghost.released || ghost.mode === 'frightened' || ghost.mode === 'eaten') {
      return;
    }
    ghost.mode = state.globalMode;
    ghost.reverseRequested = true;
  });
  game.emit('mode-change', { mode: state.globalMode });
}

function updateFrightenedState(game, delta) {
  const state = game.state;
  if (state.frightenedTimer <= 0) {
    return;
  }
  state.frightenedTimer -= delta;
  if (state.frightenedTimer > 0) {
    return;
  }
  state.frightenedTimer = 0;
  state.frightenedCombo = 0;
  state.ghosts.forEach((ghost) => {
    if (ghost.mode === 'frightened') {
      restoreGhostMode(ghost, state.globalMode);
    }
  });
  game.emit('message', { text: 'Ghosts are chasing again.' });
  game.emit('frightened-ended', {});
}

function maybeReverseOnModeChange(ghost) {
  if (ghost.reverseRequested) {
    ghost.reverseRequested = false;
    if (DIRECTIONS[ghost.direction]) {
      ghost.direction = DIRECTIONS[ghost.direction].opposite;
    }
  }
}

function updatePacman(game, delta) {
  const state = game.state;
  const pacman = state.pacman;
  const maze = state.maze;
  const speed = PACMAN_BASE_SPEED * state.difficulty.pacmanSpeed;
  const desiredDirection = state.demoMode ? chooseDemoDirection(game) : pacman.bufferedDirection;

  if (!pacman.moving) {
    const initialDirection = desiredDirection && canEnter(maze, moveTile(maze, pacman.tile, desiredDirection), 'pacman')
      ? desiredDirection
      : (pacman.direction && canEnter(maze, moveTile(maze, pacman.tile, pacman.direction), 'pacman') ? pacman.direction : null);
    if (initialDirection) {
      startMove(pacman, maze, initialDirection, 'pacman', speed);
    }
  }

  if (!pacman.moving) {
    return;
  }

  pacman.stepProgress += (delta * pacman.speed) / 1000;
  let guard = 0;
  while (pacman.stepProgress >= 1 && guard < 5) {
    guard += 1;
    pacman.stepProgress -= 1;
    pacman.tile = cloneTile(pacman.to);
    pacman.from = cloneTile(pacman.tile);
    pacman.stepsTaken += 1;
    handlePacmanArrival(game);

    const nextDirection = state.demoMode ? chooseDemoDirection(game) : pacman.bufferedDirection;
    const fallbackDirection = pacman.direction && canEnter(maze, moveTile(maze, pacman.tile, pacman.direction), 'pacman') ? pacman.direction : null;
    const chosen = nextDirection && canEnter(maze, moveTile(maze, pacman.tile, nextDirection), 'pacman') ? nextDirection : fallbackDirection;
    if (chosen) {
      startMove(pacman, maze, chosen, 'pacman', speed);
      continue;
    }
    pacman.moving = false;
    pacman.stepProgress = 0;
    break;
  }
}

function updateGhost(game, ghost, delta) {
  const state = game.state;
  const maze = state.maze;
  if (!ghost.released) {
    updateGhostRelease(ghost, delta);
    if (!ghost.released) {
      return;
    }
    ghost.mode = state.globalMode;
    ghost.reverseRequested = true;
  }

  if (ghost.mode === 'eaten' && ghost.tile.x === maze.ghostHouse.home.x && ghost.tile.y === maze.ghostHouse.home.y) {
    ghost.mode = state.globalMode;
    ghost.eyesOnly = false;
    ghost.reverseRequested = true;
  }

  const speed = getGhostSpeed(ghost, state);
  if (!ghost.moving && speed > 0) {
    const nextDirection = chooseGhostDirection(ghost, state, game.random);
    if (nextDirection) {
      maybeReverseOnModeChange(ghost);
      startMove(ghost, maze, nextDirection, 'ghost', speed);
    }
  }

  if (!ghost.moving) {
    return;
  }

  ghost.stepProgress += (delta * ghost.speed) / 1000;
  let guard = 0;
  while (ghost.stepProgress >= 1 && guard < 5) {
    guard += 1;
    ghost.stepProgress -= 1;
    ghost.tile = cloneTile(ghost.to);
    ghost.from = cloneTile(ghost.tile);
    ghost.stepsTaken += 1;
    handleGhostArrival(game, ghost);

    const nextDirection = chooseGhostDirection(ghost, state, game.random);
    if (nextDirection && startMove(ghost, maze, nextDirection, 'ghost', getGhostSpeed(ghost, state))) {
      continue;
    }
    ghost.moving = false;
    ghost.stepProgress = 0;
    break;
  }
}

function handlePacmanArrival(game) {
  const state = game.state;
  const maze = state.maze;
  const tile = state.pacman.tile;
  const cell = getCell(maze.grid, tile.x, tile.y);

  if (cell === TILE.PATH || cell === TILE.POWER) {
    state.maze.grid[tile.y][tile.x] = TILE.EMPTY;
    state.maze.pelletsRemaining -= 1;
    state.score += cell === TILE.POWER ? POWER_PELLET_POINTS : 10;
    state.summary.score = state.score;
    if (cell === TILE.POWER) {
      state.frightenedTimer = state.difficulty.frightenedSeconds * 1000;
      state.frightenedCombo = 0;
      state.ghosts.forEach((ghost) => {
        if (ghost.mode !== 'eaten') {
          setGhostFrightened(ghost, state.difficulty.frightenedSeconds * 1000);
        }
      });
      game.emit('power-pellet', { score: state.score });
      game.emit('message', { text: 'Power pellet! Ghosts are vulnerable.' });
    } else {
      game.emit('dot-eaten', { score: state.score });
    }
    game.emit('score', { amount: cell === TILE.POWER ? POWER_PELLET_POINTS : 10, score: state.score });
  }

  if (state.fruit && tile.x === state.fruit.x && tile.y === state.fruit.y) {
    state.score += state.fruit.data.points;
    state.summary.fruitsCollected += 1;
    game.emit('score', { amount: state.fruit.data.points, score: state.score });
    game.emit('fruit-collected', { fruit: state.fruit.data, score: state.score });
    state.fruit = null;
  }

  state.ghosts.forEach((ghost) => {
    if ((ghost.mode === 'frightened' || ghost.mode === 'eaten') && ghost.tile.x === tile.x && ghost.tile.y === tile.y) {
      return;
    }
    if (ghost.tile.x === tile.x && ghost.tile.y === tile.y) {
      if (ghost.mode === 'frightened') {
        handleGhostEaten(game, ghost);
      } else if (ghost.mode !== 'eaten') {
        handleLifeLost(game, ghost);
      }
    }
  });

  if (state.maze.pelletsRemaining <= 0) {
    handleLevelComplete(game);
  }
}

function handleGhostArrival(game, ghost) {
  const state = game.state;
  const maze = state.maze;

  if (ghost.mode === 'eaten' && ghost.tile.x === maze.ghostHouse.home.x && ghost.tile.y === maze.ghostHouse.home.y) {
    ghost.mode = state.globalMode;
    ghost.eyesOnly = false;
    ghost.reverseRequested = true;
  }

  if (ghost.mode === 'frightened' && state.frightenedTimer <= 0) {
    restoreGhostMode(ghost, state.globalMode);
  }
}

function handleGhostEaten(game, ghost) {
  const state = game.state;
  const comboIndex = Math.min(state.frightenedCombo, GHOST_EAT_POINTS.length - 1);
  const points = GHOST_EAT_POINTS[comboIndex];
  state.frightenedCombo += 1;
  state.summary.ghostsEaten += 1;
  state.summary.longestGhostCombo = Math.max(state.summary.longestGhostCombo, state.frightenedCombo);
  state.score += points;
  ghost.mode = 'eaten';
  ghost.eyesOnly = true;
  ghost.reverseRequested = false;
  game.emit('ghost-eaten', { ghost: ghost.id, points, combo: state.frightenedCombo, score: state.score });
  game.emit('score', { amount: points, score: state.score });
}

function handleLifeLost(game, ghost) {
  const state = game.state;
  if (state.phase !== 'playing') {
    return;
  }
  if (state.practiceMode) {
    state.score = Math.max(0, state.score - 50);
    game.emit('life-lost', { lives: Infinity, score: state.score, practice: true });
    game.emit('message', { text: 'Practice mode: keep going!' });
    game.resetRound(true);
    state.phase = 'respawn';
    state.respawnTimer = RESPAWN_DELAY;
    return;
  }
  state.lives -= 1;
  game.emit('life-lost', { lives: state.lives, score: state.score, ghost: ghost.id });
  game.emit('message', { text: 'Pacman lost a life.' });
  if (state.lives <= 0) {
    state.lives = 0;
    state.phase = 'gameover';
    state.gameOver = true;
    state.summary.completed = false;
    game.emit('game-over', { score: state.score, summary: { ...state.summary } });
    return;
  }
  state.phase = 'respawn';
  state.respawnTimer = RESPAWN_DELAY;
  game.resetRound(true);
}

function handleLevelComplete(game) {
  const state = game.state;
  if (state.phase === 'between-level' || state.gameOver) {
    return;
  }
  state.summary.levelsCompleted += 1;
  state.phase = 'between-level';
  state.levelAdvanceTimer = LEVEL_BETWEEN_DELAY;
  game.emit('level-complete', { level: state.level, score: state.score });
  game.emit('message', { text: 'Level complete!' });
}

function chooseDemoDirection(game) {
  const state = game.state;
  const maze = state.maze;
  const pacman = state.pacman;
  const ghosts = state.ghosts.filter((ghost) => ghost.released && ghost.mode !== 'eaten');
  const validDirections = getNeighbors(maze, pacman.tile, 'pacman').map((entry) => entry.direction);
  if (!validDirections.length) {
    return pacman.direction;
  }

  const frightenedThreat = ghosts.some((ghost) => getDistance(ghost.tile, pacman.tile) <= 3 && ghost.mode !== 'frightened');
  if (frightenedThreat) {
    const scored = validDirections.map((direction) => {
      const next = moveTile(maze, pacman.tile, direction);
      const danger = ghosts.reduce((min, ghost) => Math.min(min, getDistance(next, ghost.tile)), Number.POSITIVE_INFINITY);
      return { direction, score: danger };
    });
    const best = Math.max(...scored.map((item) => item.score));
    return scored.find((item) => item.score === best)?.direction || validDirections[0];
  }

  const collectiblePath = findNearestCollectiblePath(maze, pacman.tile);
  if (!collectiblePath || collectiblePath.length < 2) {
    return validDirections[0];
  }
  const nextTile = collectiblePath[1];
  return directionToward(maze, pacman.tile, nextTile) || validDirections[0];
}

function directionToward(maze, from, to) {
  for (const direction of Object.keys(DIRECTIONS)) {
    const next = moveTile(maze, from, direction);
    if (next.x === to.x && next.y === to.y) {
      return direction;
    }
  }
  return null;
}

function findNearestCollectiblePath(maze, start) {
  const queue = [start];
  const visited = new Set([`${start.x},${start.y}`]);
  const parents = new Map();

  while (queue.length) {
    const current = queue.shift();
    const cell = getCell(maze.grid, current.x, current.y);
    if (isPelletTile(cell) || cell === TILE.POWER || cell === TILE.START) {
      return reconstructPath(start, current, parents);
    }
    for (const { tile: next } of getNeighbors(maze, current, 'pacman')) {
      const key = `${next.x},${next.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        parents.set(key, `${current.x},${current.y}`);
        queue.push(next);
      }
    }
  }
  return null;
}

function reconstructPath(start, end, parents) {
  const path = [end];
  let cursor = `${end.x},${end.y}`;
  const startKey = `${start.x},${start.y}`;
  while (cursor !== startKey && parents.has(cursor)) {
    const previous = parents.get(cursor);
    const [x, y] = previous.split(',').map(Number);
    path.unshift({ x, y });
    cursor = previous;
  }
  return path;
}

export class PacmanGame {
  constructor({ difficultyKey = 'medium', practiceMode = false, demoMode = false, random = Math.random, onEvent = () => {} } = {}) {
    this.random = random;
    this.onEvent = onEvent;
    this.state = null;
    this.difficultyKey = difficultyKey;
    this.practiceMode = practiceMode;
    this.demoMode = demoMode;
    this.startLevel(1, { keepScore: false, announce: false, initialStart: true });
  }

  emit(type, payload = {}) {
    this.onEvent({ type, payload, state: this.getSnapshot() });
  }

  getSnapshot() {
    return this.state;
  }

  setDifficulty(difficultyKey) {
    if (!DIFFICULTIES[difficultyKey]) {
      return;
    }
    this.difficultyKey = difficultyKey;
    this.state.difficultyKey = difficultyKey;
    this.state.difficulty = DIFFICULTIES[difficultyKey];
  }

  setPracticeMode(enabled) {
    this.practiceMode = enabled;
    this.state.practiceMode = enabled;
    this.state.lives = enabled ? Infinity : 3;
  }

  setDemoMode(enabled) {
    this.demoMode = enabled;
    this.state.demoMode = enabled;
  }

  startLevel(levelNumber, { keepScore = true, announce = true, initialStart = false } = {}) {
    const previousScore = keepScore && this.state ? this.state.score : 0;
    const previousSummary = this.state ? { ...this.state.summary } : null;
    const difficulty = DIFFICULTIES[this.difficultyKey] || DIFFICULTIES.medium;
    const maze = createMaze(levelNumber);
    const pacman = createMover(maze.pacmanStart, PACMAN_BASE_SPEED * difficulty.pacmanSpeed);
    pacman.direction = 'left';
    pacman.bufferedDirection = 'left';
    const ghosts = createGhosts(maze, difficulty);
    const lives = this.practiceMode ? Infinity : this.state?.lives ?? 3;
    this.state = {
      phase: initialStart ? 'countdown' : 'countdown',
      previousPhase: 'playing',
      difficultyKey: this.difficultyKey,
      difficulty,
      practiceMode: this.practiceMode,
      demoMode: this.demoMode,
      maze,
      score: previousScore,
      level: levelNumber,
      lives,
      highScore: this.state?.highScore || 0,
      globalMode: difficulty.modeSchedule[0].mode,
      modeIndex: 0,
      modeRemaining: difficulty.modeSchedule[0].seconds * 1000,
      countdown: COUNTDOWN_START,
      respawnTimer: 0,
      levelAdvanceTimer: 0,
      frightenedTimer: 0,
      frightenedCombo: 0,
      fruitTimer: difficulty.fruitInterval * 1000,
      fruit: null,
      pacman,
      ghosts,
      gameOver: false,
      summary: previousSummary || {
        score: 0,
        ghostsEaten: 0,
        fruitsCollected: 0,
        levelsCompleted: 0,
        longestGhostCombo: 0,
        completed: false,
        difficulty: this.difficultyKey,
        mode: this.demoMode ? 'demo' : this.practiceMode ? 'practice' : 'arcade'
      },
      message: initialStart ? 'Ready!' : `Level ${levelNumber}`,
      powerFlash: 0
    };
    if (!keepScore) {
      this.state.summary = {
        score: 0,
        ghostsEaten: 0,
        fruitsCollected: 0,
        levelsCompleted: 0,
        longestGhostCombo: 0,
        completed: false,
        difficulty: this.difficultyKey,
        mode: this.demoMode ? 'demo' : this.practiceMode ? 'practice' : 'arcade'
      };
    }
    if (announce) {
      this.emit('message', { text: `Level ${levelNumber}: ${maze.layoutName}` });
    }
  }

  resetRound(preserveScore = true) {
    const state = this.state;
    const maze = state.maze;
    resetEntity(state.pacman, maze.pacmanStart, 'left');
    state.pacman.bufferedDirection = 'left';
    state.ghosts.forEach((ghost) => resetGhost(ghost));
    if (!preserveScore) {
      state.score = 0;
    }
    state.fruit = null;
    state.fruitTimer = state.difficulty.fruitInterval * 1000;
    state.frightenedTimer = 0;
    state.frightenedCombo = 0;
    state.modeIndex = 0;
    state.globalMode = state.difficulty.modeSchedule[0].mode;
    state.modeRemaining = state.difficulty.modeSchedule[0].seconds * 1000;
    state.phase = 'countdown';
    state.countdown = COUNTDOWN_START;
  }

  queueDirection(direction) {
    const state = this.state;
    if (!state || state.phase === 'gameover' || state.phase === 'paused') {
      return;
    }
    state.pacman.bufferedDirection = direction;
    if (state.phase === 'countdown') {
      state.phase = 'playing';
      state.countdown = 0;
    }
  }

  pause() {
    const state = this.state;
    if (state.phase === 'paused' || state.phase === 'gameover') {
      return false;
    }
    state.previousPhase = state.phase;
    state.phase = 'paused';
    this.emit('pause', {});
    return true;
  }

  resume() {
    const state = this.state;
    if (state.phase !== 'paused') {
      return false;
    }
    state.phase = state.previousPhase || 'playing';
    this.emit('resume', {});
    return true;
  }

  togglePause() {
    return this.state.phase === 'paused' ? this.resume() : this.pause();
  }

  update(delta) {
    if (!this.state || !delta || delta <= 0) {
      return;
    }
    const state = this.state;
    if (state.phase === 'paused' || state.phase === 'gameover') {
      return;
    }
    if (state.phase === 'countdown') {
      updateCountDown(this, delta);
      return;
    }
    if (state.phase === 'respawn') {
      updateRespawn(this, delta);
      return;
    }
    if (state.phase === 'between-level') {
      updateBetweenLevels(this, delta);
      return;
    }

    updateGlobalMode(this, delta);
    updateFrightenedState(this, delta);
    updateFruit(this, delta);
    updatePacman(this, delta);
    state.ghosts.forEach((ghost) => updateGhost(this, ghost, delta));
    resolveCollisions(this);

    if (state.practiceMode) {
      state.lives = Infinity;
    }
    state.summary.score = state.score;
    state.summary.difficulty = state.difficultyKey;
    state.summary.mode = state.demoMode ? 'demo' : state.practiceMode ? 'practice' : 'arcade';
  }

  forceGameOver() {
    this.state.phase = 'gameover';
    this.state.gameOver = true;
    this.emit('game-over', { score: this.state.score, summary: { ...this.state.summary } });
  }

  handleAction(action) {
    switch (action) {
      case 'up':
      case 'down':
      case 'left':
      case 'right':
        this.queueDirection(action);
        break;
      case 'pause':
        this.togglePause();
        break;
      default:
        break;
    }
  }
}

function resolveCollisions(game) {
  const state = game.state;
  const pacman = state.pacman;
  const pacmanPos = positionBetween(pacman);
  const ghostHit = state.ghosts.find((ghost) => {
    if (!ghost.released || ghost.mode === 'eaten') {
      return false;
    }
    const pos = positionBetween(ghost);
    return getDistance(pacmanPos, pos) < 0.45;
  });
  if (!ghostHit) {
    return;
  }
  if (ghostHit.mode === 'frightened') {
    handleGhostEaten(game, ghostHit);
    return;
  }
  handleLifeLost(game, ghostHit);
}

export function createPacmanGame(options) {
  return new PacmanGame(options);
}
