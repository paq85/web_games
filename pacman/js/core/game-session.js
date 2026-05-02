import {
  BASE_LIVES,
  DIRECTION_VECTORS,
  GHOST_STATES,
  OPPOSITE_DIRECTION,
  RUN_MODES,
  TILE
} from '../constants.js';
import { getAchievementById } from '../data/achievements.js';
import { getLevelConfig, getFruitSpawnThresholds } from '../data/difficulty.js';
import { getFruitCollectionCaption, getFruitForLevel } from '../data/fruits.js';
import { getMazeDefinition } from '../data/mazes.js';
import { createFruit, resetFruit } from '../entities/fruit.js';
import {
  applyPendingReverse,
  chooseGhostDirection,
  createGhost,
  getGhostTarget,
  queueGhostReverse,
  resetGhost
} from '../entities/ghost.js';
import { createPacman, resetPacman } from '../entities/pacman.js';
import { SeededRandom } from '../utils/random.js';
import {
  canOccupyTile,
  cloneGrid,
  countPellets,
  getNeighborTile,
  getOpenDirections,
  getTile,
  lerpPosition,
  manhattanDistance,
  squaredDistance,
  tilesEqual,
  wrapX
} from '../utils/grid.js';

function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

export class GameSession {
  constructor({
    difficulty = 'medium',
    runMode = RUN_MODES.NORMAL,
    settings,
    startLevel = 1,
    seed = 0xdecafbad,
    onEvent = () => {}
  }) {
    this.difficulty = difficulty;
    this.runMode = runMode;
    this.settings = settings;
    this.onEvent = onEvent;
    this.random = new SeededRandom(seed);
    this.level = startLevel;
    this.score = 0;
    this.currentStreak = 0;
    this.bestGhostChain = 0;
    this.lives = this.isPracticeMode() ? Number.POSITIVE_INFINITY : BASE_LIVES;
    this.isPaused = false;
    this.phase = 'countdown';
    this.phaseTimer = 3;
    this.globalMode = GHOST_STATES.SCATTER;
    this.baseModeIndex = 0;
    this.baseModeTimer = 0;
    this.powerTimer = 0;
    this.fruitSpawnIndex = 0;
    this.message = '';
    this.messageTimer = 0;
    this.demoTakeoverRequested = false;
    this.runStats = {
      levelReached: startLevel,
      levelsCompleted: 0,
      ghostsEaten: 0,
      fruitsCollected: 0,
      pelletsEaten: 0,
      powerPelletsEaten: 0,
      bestGhostChain: 0
    };

    this.loadLevel(this.level, { announce: false });
  }

  isPracticeMode() {
    return this.runMode === RUN_MODES.PRACTICE || this.runMode === RUN_MODES.TUTORIAL;
  }

  emit(type, detail = {}) {
    this.onEvent({ type, ...detail });
  }

  updateSettings(settings) {
    this.settings = settings;
    this.levelConfig = getLevelConfig({
      difficulty: this.difficulty,
      level: this.level,
      runMode: this.runMode,
      practiceSpeed: this.settings.practiceSpeed
    });
  }

  loadLevel(level, { announce = true } = {}) {
    this.level = level;
    this.maze = getMazeDefinition(level);
    this.grid = cloneGrid(this.maze.rows);
    this.totalPellets = countPellets(this.grid);
    this.pelletsRemaining = this.totalPellets;
    this.levelConfig = getLevelConfig({
      difficulty: this.difficulty,
      level,
      runMode: this.runMode,
      practiceSpeed: this.settings.practiceSpeed
    });
    this.fruitSpawnThresholds = getFruitSpawnThresholds(this.totalPellets);
    this.fruitSpawnIndex = 0;
    this.globalMode = GHOST_STATES.SCATTER;
    this.baseModeIndex = 0;
    this.baseModeTimer = 0;
    this.powerTimer = 0;
    this.phase = 'countdown';
    this.phaseTimer = 3;
    this.messageTimer = 0;
    this.demoTakeoverRequested = false;
    this.runStats.levelReached = Math.max(this.runStats.levelReached, level);

    if (this.pacman) {
      resetPacman(this.pacman, this.maze.pacmanSpawn, this.levelConfig.pacmanSpeed);
    } else {
      this.pacman = createPacman(this.maze.pacmanSpawn, this.levelConfig.pacmanSpeed);
    }

    if (!this.ghosts) {
      this.ghosts = {};
      for (const [name, spawn] of Object.entries(this.maze.ghostSpawns)) {
        this.ghosts[name] = createGhost(
          name,
          spawn,
          this.maze.scatterTargets[name],
          this.maze.houseDoor,
          this.maze.houseCenter
        );
      }
    }

    const ghostNames = ['blinky', 'pinky', 'inky', 'clyde'];
    ghostNames.forEach((name, index) => {
      resetGhost(
        this.ghosts[name],
        this.maze.ghostSpawns[name],
        this.levelConfig.ghostSpeed,
        this.levelConfig.ghostReleaseDelays[index]
      );
    });

    const fruitInfo = getFruitForLevel(level);
    if (this.fruit) {
      resetFruit(this.fruit, fruitInfo, this.levelConfig.fruitDuration);
    } else {
      this.fruit = createFruit(fruitInfo, this.maze.fruitSpawn, this.levelConfig.fruitDuration);
    }

    this.ghostChainValue = 200;

    if (announce) {
      this.emit('caption', { text: `Level ${level} ready.` });
      this.emit('announce', { priority: 'assertive', text: `Level ${level} starting.` });
    }
  }

  startRespawn() {
    this.phase = 'respawn';
    this.phaseTimer = this.isPracticeMode() ? 1.5 : 2;
    resetPacman(this.pacman, this.maze.pacmanSpawn, this.levelConfig.pacmanSpeed);

    const ghostNames = ['blinky', 'pinky', 'inky', 'clyde'];
    ghostNames.forEach((name, index) => {
      resetGhost(
        this.ghosts[name],
        this.maze.ghostSpawns[name],
        this.levelConfig.ghostSpeed,
        this.levelConfig.ghostReleaseDelays[index]
      );
    });

    this.globalMode = GHOST_STATES.SCATTER;
    this.baseModeIndex = 0;
    this.baseModeTimer = 0;
    this.powerTimer = 0;
    this.ghostChainValue = 200;
  }

  setDesiredDirection(direction) {
    this.pacman.desiredDirection = direction;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  restartRun() {
    this.score = 0;
    this.currentStreak = 0;
    this.bestGhostChain = 0;
    this.lives = this.isPracticeMode() ? Number.POSITIVE_INFINITY : BASE_LIVES;
    this.runStats = {
      levelReached: 1,
      levelsCompleted: 0,
      ghostsEaten: 0,
      fruitsCollected: 0,
      pelletsEaten: 0,
      powerPelletsEaten: 0,
      bestGhostChain: 0
    };
    this.loadLevel(1);
  }

  requestDemoTakeover() {
    if (this.runMode === RUN_MODES.DEMO) {
      this.demoTakeoverRequested = true;
    }
  }

  update(dt) {
    if (this.isPaused) {
      return;
    }

    if (this.messageTimer > 0) {
      this.messageTimer = Math.max(0, this.messageTimer - dt);
      if (this.messageTimer === 0) {
        this.message = '';
      }
    }

    if (this.runMode === RUN_MODES.DEMO && this.phase === 'playing') {
      this.pacman.desiredDirection = this.chooseDemoDirection();
    }

    if (this.phase === 'countdown' || this.phase === 'respawn') {
      this.phaseTimer = Math.max(0, this.phaseTimer - dt);
      if (this.phaseTimer === 0) {
        this.phase = 'playing';
        this.emit('caption', { text: 'Go!' });
        this.emit('sound', { sound: 'resume' });
      }
      return;
    }

    if (this.phase === 'level-complete') {
      this.phaseTimer = Math.max(0, this.phaseTimer - dt);
      if (this.phaseTimer === 0) {
        this.loadLevel(this.level + 1);
      }
      return;
    }

    if (this.phase === 'game-over') {
      return;
    }

    this.updateModeSchedule(dt);
    this.updatePowerTimer(dt);
    this.updateFruit(dt);
    this.advancePacman(dt);
    Object.values(this.ghosts).forEach((ghost) => this.advanceGhost(ghost, dt));
    this.checkFruitCollection();
    this.checkGhostCollisions();
    this.checkLevelCompletion();
  }

  updateModeSchedule(dt) {
    const currentSchedule = this.levelConfig.schedule[this.baseModeIndex];
    if (!currentSchedule) {
      return;
    }

    this.globalMode = currentSchedule.mode;
    if (currentSchedule.duration === Infinity) {
      return;
    }

    this.baseModeTimer += dt;
    if (this.baseModeTimer >= currentSchedule.duration) {
      this.baseModeTimer = 0;
      this.baseModeIndex = Math.min(this.baseModeIndex + 1, this.levelConfig.schedule.length - 1);
      const nextMode = this.levelConfig.schedule[this.baseModeIndex].mode;
      if (nextMode !== this.globalMode) {
        this.globalMode = nextMode;
        Object.values(this.ghosts).forEach((ghost) => {
          if (ghost.state !== GHOST_STATES.HOUSE && ghost.state !== GHOST_STATES.EATEN) {
            queueGhostReverse(ghost);
            applyPendingReverse(ghost);
          }
        });
        this.emit('caption', { text: `${nextMode === GHOST_STATES.SCATTER ? 'Scatter' : 'Chase'} mode.` });
      }
    }
  }

  updatePowerTimer(dt) {
    if (this.powerTimer <= 0) {
      return;
    }

    this.powerTimer = Math.max(0, this.powerTimer - dt);
    Object.values(this.ghosts).forEach((ghost) => {
      if (ghost.state !== GHOST_STATES.FRIGHTENED) {
        return;
      }
      ghost.frightenedTimer = Math.max(0, ghost.frightenedTimer - dt);
      if (ghost.frightenedTimer === 0) {
        ghost.state = this.globalMode;
        queueGhostReverse(ghost);
        applyPendingReverse(ghost);
      }
    });
  }

  spawnFruitIfNeeded() {
    if (this.fruit.active || this.fruitSpawnIndex >= this.fruitSpawnThresholds.length) {
      return;
    }

    if (this.pelletsRemaining <= this.fruitSpawnThresholds[this.fruitSpawnIndex]) {
      this.fruit.active = true;
      this.fruit.timer = this.fruit.duration;
      this.fruitSpawnIndex += 1;
      this.emit('caption', { text: `${this.fruit.name} appeared in the maze.` });
      this.emit('sound', { sound: 'fruit-spawn' });
      this.emit('announce', { priority: 'polite', text: `${this.fruit.name} bonus fruit appeared.` });
    }
  }

  updateFruit(dt) {
    this.spawnFruitIfNeeded();
    if (!this.fruit.active) {
      return;
    }

    this.fruit.timer = Math.max(0, this.fruit.timer - dt);
    if (this.fruit.timer === 0) {
      this.fruit.active = false;
      this.emit('caption', { text: `${this.fruit.name} disappeared.` });
    }
  }

  advancePacman(dt) {
    this.pacman.speed = this.levelConfig.pacmanSpeed;
    this.advanceMover(this.pacman, dt, 'pacman', () => this.choosePacmanDirection());
    this.pacman.mouthTimer += dt;
  }

  advanceGhost(ghost, dt) {
    if (ghost.state === GHOST_STATES.HOUSE && ghost.releaseDelay > 0) {
      ghost.releaseDelay = Math.max(0, ghost.releaseDelay - dt);
      return;
    }

    ghost.speed = this.getGhostSpeed(ghost);
    const entityType = ghost.state === GHOST_STATES.EATEN || ghost.state === GHOST_STATES.HOUSE ? 'ghost-door' : 'ghost';
    this.advanceMover(ghost, dt, entityType, () => this.chooseGhostDirection(ghost));

    if (ghost.state === GHOST_STATES.EATEN && tilesEqual(ghost.tile, ghost.houseCenter)) {
      ghost.state = GHOST_STATES.HOUSE;
      ghost.releaseDelay = 1.4;
      ghost.isReleased = false;
      ghost.frightenedTimer = 0;
      ghost.direction = 'up';
    }

    if (ghost.state === GHOST_STATES.HOUSE && tilesEqual(ghost.tile, ghost.houseDoor)) {
      ghost.state = this.globalMode;
      ghost.isReleased = true;
    }
  }

  advanceMover(entity, dt, entityType, chooseDirection) {
    let remainingDistance = entity.speed * dt;

    while (remainingDistance > 0) {
      if (entity.progress < 1) {
        const segmentRemaining = 1 - entity.progress;
        if (remainingDistance < segmentRemaining) {
          entity.progress += remainingDistance;
          return;
        }

        remainingDistance -= segmentRemaining;
        entity.progress = 1;
        entity.tile = { ...entity.to };
        entity.from = { ...entity.tile };
      }

      if (entity.progress === 1) {
        const direction = chooseDirection();
        if (!direction) {
          entity.from = { ...entity.tile };
          entity.to = { ...entity.tile };
          entity.progress = 1;
          return;
        }

        entity.direction = direction;
        const nextTile = getNeighborTile(this.maze, entity.tile, direction);
        if (!canOccupyTile(this.maze, this.grid, nextTile.x, nextTile.y, entityType)) {
          entity.from = { ...entity.tile };
          entity.to = { ...entity.tile };
          entity.progress = 1;
          return;
        }

        entity.from = { ...entity.tile };
        entity.to = {
          x: wrapX(this.maze, nextTile.x, nextTile.y),
          y: nextTile.y
        };
        entity.progress = 0;
      }
    }
  }

  choosePacmanDirection() {
    const options = getOpenDirections(this.maze, this.grid, this.pacman.tile, 'pacman');
    if (options.includes(this.pacman.desiredDirection)) {
      this.pacman.lastMoveDirection = this.pacman.desiredDirection;
      return this.pacman.desiredDirection;
    }

    if (options.includes(this.pacman.direction)) {
      this.pacman.lastMoveDirection = this.pacman.direction;
      return this.pacman.direction;
    }

    return null;
  }

  chooseGhostDirection(ghost) {
    applyPendingReverse(ghost);

    if (ghost.state === GHOST_STATES.HOUSE) {
      if (ghost.releaseDelay > 0) {
        return null;
      }

      if (ghost.tile.y > ghost.houseDoor.y) {
        return 'up';
      }

      if (ghost.tile.x < ghost.houseDoor.x) {
        return 'right';
      }

      if (ghost.tile.x > ghost.houseDoor.x) {
        return 'left';
      }

      return 'up';
    }

    const entityType = ghost.state === GHOST_STATES.EATEN ? 'ghost-door' : 'ghost';
    const openDirections = getOpenDirections(this.maze, this.grid, ghost.tile, entityType);
    const filteredDirections =
      openDirections.length > 1
        ? openDirections.filter((direction) => direction !== OPPOSITE_DIRECTION[ghost.direction])
        : openDirections;

    let targetTile;
    if (ghost.state === GHOST_STATES.EATEN) {
      targetTile = ghost.houseCenter;
    } else {
      targetTile = getGhostTarget(ghost, {
        pacman: this.pacman,
        blinky: this.ghosts.blinky,
        globalMode: this.globalMode,
        directionVectors: DIRECTION_VECTORS
      });
    }

    ghost.targetTile = targetTile;
    return chooseGhostDirection(ghost, filteredDirections, targetTile, this.maze, this.random);
  }

  getGhostSpeed(ghost) {
    if (ghost.state === GHOST_STATES.EATEN) {
      return this.levelConfig.ghostSpeed * 1.65;
    }
    if (ghost.state === GHOST_STATES.FRIGHTENED) {
      return this.levelConfig.frightenedSpeed;
    }
    if (ghost.state === GHOST_STATES.HOUSE) {
      return this.levelConfig.ghostSpeed * 0.8;
    }
    return this.levelConfig.ghostSpeed;
  }

  consumeTile() {
    const tile = getTile(this.maze, this.grid, this.pacman.tile.x, this.pacman.tile.y);
    if (tile === TILE.PELLET) {
      this.grid[this.pacman.tile.y][this.pacman.tile.x] = TILE.EMPTY;
      this.pelletsRemaining -= 1;
      this.score += 10;
      this.runStats.pelletsEaten += 1;
      this.emit('sound', { sound: 'pellet' });
      this.emit('caption', { text: 'Pellet collected.' });
      this.emit('score', { score: this.score });
    }

    if (tile === TILE.POWER) {
      this.grid[this.pacman.tile.y][this.pacman.tile.x] = TILE.EMPTY;
      this.pelletsRemaining -= 1;
      this.score += 50;
      this.runStats.pelletsEaten += 1;
      this.runStats.powerPelletsEaten += 1;
      this.activateFrightenedMode();
      this.emit('sound', { sound: 'power' });
      this.emit('caption', { text: 'Power pellet! Ghosts frightened.' });
      this.emit('announce', { priority: 'assertive', text: 'Power pellet eaten. Ghosts are vulnerable.' });
      this.emit('score', { score: this.score });
    }
  }

  activateFrightenedMode() {
    this.powerTimer = this.levelConfig.frightenedDuration;
    this.ghostChainValue = 200;
    Object.values(this.ghosts).forEach((ghost) => {
      if (ghost.state === GHOST_STATES.EATEN || ghost.state === GHOST_STATES.HOUSE) {
        return;
      }
      ghost.state = GHOST_STATES.FRIGHTENED;
      ghost.frightenedTimer = this.levelConfig.frightenedDuration;
      ghost.wasEatenThisFrightenedCycle = false;
      queueGhostReverse(ghost);
      applyPendingReverse(ghost);
    });
  }

  checkFruitCollection() {
    this.consumeTile();

    if (!this.fruit.active) {
      return;
    }

    if (tilesEqual(this.pacman.tile, this.fruit.spawn)) {
      this.score += this.fruit.value;
      this.fruit.active = false;
      this.runStats.fruitsCollected += 1;
      this.emit('sound', { sound: 'fruit' });
      this.emit('caption', { text: getFruitCollectionCaption(this.level) });
      this.emit('announce', { priority: 'polite', text: `${this.fruit.name} collected.` });
      this.emit('score', { score: this.score });
    }
  }

  checkGhostCollisions() {
    const pacmanPosition = lerpPosition(this.pacman, 1);

    for (const ghost of Object.values(this.ghosts)) {
      const ghostPosition = lerpPosition(ghost, 1);
      const distance = squaredDistance(pacmanPosition, ghostPosition);
      if (distance > 0.25) {
        continue;
      }

      if (ghost.state === GHOST_STATES.FRIGHTENED) {
        ghost.state = GHOST_STATES.EATEN;
        ghost.frightenedTimer = 0;
        this.score += this.ghostChainValue;
        this.bestGhostChain = Math.max(this.bestGhostChain, this.ghostChainValue);
        this.runStats.ghostsEaten += 1;
        this.runStats.bestGhostChain = Math.max(this.runStats.bestGhostChain, this.ghostChainValue);
        this.emit('sound', { sound: 'ghost-eaten' });
        this.emit('caption', { text: `Ghost eaten for ${this.ghostChainValue} points.` });
        this.emit('announce', { priority: 'polite', text: `Ghost eaten for ${this.ghostChainValue} points.` });
        this.emit('score', { score: this.score });
        this.ghostChainValue = Math.min(1600, this.ghostChainValue * 2);
        continue;
      }

      if (ghost.state !== GHOST_STATES.EATEN) {
        this.handleLifeLost();
        break;
      }
    }
  }

  handleLifeLost() {
    if (this.isPracticeMode()) {
      this.emit('caption', { text: 'Practice reset. Unlimited lives keep you going.' });
      this.emit('announce', { priority: 'assertive', text: 'Ghost collision. Practice reset.' });
      this.emit('sound', { sound: 'life-lost' });
      this.startRespawn();
      return;
    }

    this.lives -= 1;
    this.emit('sound', { sound: 'life-lost' });
    this.emit('announce', { priority: 'assertive', text: `Life lost. ${this.lives} lives remaining.` });
    this.emit('caption', { text: `Life lost. ${this.lives} remaining.` });

    if (this.lives <= 0) {
      this.phase = 'game-over';
      this.emit('game-over', {
        summary: this.getRunSummary()
      });
      return;
    }

    this.startRespawn();
  }

  checkLevelCompletion() {
    if (this.pelletsRemaining > 0) {
      return;
    }

    this.currentStreak += 1;
    this.runStats.levelsCompleted += 1;
    this.phase = 'level-complete';
    this.phaseTimer = 2.4;
    this.emit('sound', { sound: 'level-complete' });
    this.emit('caption', { text: `Level ${this.level} complete!` });
    this.emit('announce', { priority: 'assertive', text: `Level ${this.level} complete.` });
    this.emit('level-complete', {
      level: this.level,
      summary: this.getRunSummary()
    });
  }

  chooseDemoDirection() {
    const options = getOpenDirections(this.maze, this.grid, this.pacman.tile, 'pacman');
    if (options.length === 0) {
      return this.pacman.direction;
    }

    let bestOption = options[0];
    let bestScore = -Infinity;
    const dangerousGhosts = Object.values(this.ghosts).filter(
      (ghost) => ghost.state !== GHOST_STATES.FRIGHTENED && ghost.state !== GHOST_STATES.EATEN && ghost.state !== GHOST_STATES.HOUSE
    );

    for (const option of options) {
      const nextTile = getNeighborTile(this.maze, this.pacman.tile, option);
      const pelletDistance = this.findNearestPelletDistance(nextTile);
      const fruitDistance = this.fruit.active ? manhattanDistance(nextTile, this.fruit.spawn) : 8;
      const ghostDistance = dangerousGhosts.length
        ? Math.min(...dangerousGhosts.map((ghost) => manhattanDistance(nextTile, ghost.tile)))
        : 10;
      const frightenedDistance = Math.min(
        ...Object.values(this.ghosts)
          .filter((ghost) => ghost.state === GHOST_STATES.FRIGHTENED)
          .map((ghost) => manhattanDistance(nextTile, ghost.tile)),
        9
      );

      const score = ghostDistance * 5 - pelletDistance * 1.5 - fruitDistance * 0.4 - frightenedDistance * 0.2;
      if (score > bestScore) {
        bestScore = score;
        bestOption = option;
      }
    }

    return bestOption;
  }

  findNearestPelletDistance(start) {
    const queue = [{ tile: start, distance: 0 }];
    const visited = new Set([`${start.x},${start.y}`]);

    while (queue.length) {
      const current = queue.shift();
      const tile = getTile(this.maze, this.grid, current.tile.x, current.tile.y);
      if (tile === TILE.PELLET || tile === TILE.POWER) {
        return current.distance;
      }

      for (const direction of getOpenDirections(this.maze, this.grid, current.tile, 'pacman')) {
        const next = getNeighborTile(this.maze, current.tile, direction);
        const key = `${next.x},${next.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ tile: next, distance: current.distance + 1 });
        }
      }
    }

    return 20;
  }

  getRunSummary() {
    return {
      difficulty: this.difficulty,
      mode: this.runMode,
      score: this.score,
      level: this.level,
      lives: Number.isFinite(this.lives) ? this.lives : null,
      currentStreak: this.currentStreak,
      ...this.runStats,
      bestGhostChain: Math.max(this.bestGhostChain, this.runStats.bestGhostChain)
    };
  }

  getSnapshot() {
    return {
      difficulty: this.difficulty,
      level: this.level,
      score: this.score,
      lives: Number.isFinite(this.lives) ? this.lives : Infinity,
      displayLives: Number.isFinite(this.lives) ? String(this.lives) : '∞',
      runMode: this.runMode,
      currentStreak: this.currentStreak,
      phase: this.phase,
      phaseTimer: this.phaseTimer,
      isPaused: this.isPaused,
      globalMode: this.globalMode,
      powerTimer: this.powerTimer,
      pelletsRemaining: this.pelletsRemaining,
      totalPellets: this.totalPellets,
      currentMessage: this.message,
      pacman: this.pacman,
      ghosts: Object.values(this.ghosts),
      fruit: this.fruit,
      maze: this.maze,
      grid: this.grid,
      scoreSummary: this.getRunSummary(),
      demoTakeoverRequested: this.demoTakeoverRequested
    };
  }
}
