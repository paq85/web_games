import {
  DIRECTIONS,
  DIRECTION_ORDER,
  GHOST_COLORS,
  GHOST_NAMES,
  GHOST_SCATTER_TARGETS,
  cloneDirection,
  randomFrom
} from './constants.js';
import { findShortestDistance, isWalkableForGhost, moveTile, getCell, isInGhostHouse } from './maze.js';

const GHOST_DEFINITIONS = [
  { id: 'blinky', speedMultiplier: 1.08, releaseDelay: 0, houseOffset: 0 },
  { id: 'pinky', speedMultiplier: 1.02, releaseDelay: 900, houseOffset: 1 },
  { id: 'inky', speedMultiplier: 1, releaseDelay: 1600, houseOffset: 2 },
  { id: 'clyde', speedMultiplier: 0.96, releaseDelay: 2300, houseOffset: 3 }
];

export function createGhosts(maze, difficulty) {
  return GHOST_DEFINITIONS.map((definition, index) => createGhost(maze, difficulty, definition, index));
}

export function createGhost(maze, difficulty, definition, index) {
  const spawn = maze.ghostSpawns[index] || maze.ghostSpawns[0];
  return {
    id: definition.id,
    name: GHOST_NAMES[definition.id],
    color: GHOST_COLORS[definition.id],
    scatterTarget: { ...GHOST_SCATTER_TARGETS[definition.id] },
    spawn: { ...spawn },
    tile: { ...spawn },
    from: { ...spawn },
    to: { ...spawn },
    direction: 'up',
    queuedDirection: null,
    mode: 'holding',
    prevMode: 'scatter',
    released: false,
    releaseDelay: definition.releaseDelay,
    releaseTimer: definition.releaseDelay,
    baseSpeed: 4.1 * definition.speedMultiplier,
    stepProgress: 0,
    active: true,
    reverseRequested: false,
    homeIndex: definition.houseOffset,
    frightenedTicks: 0,
    eyesOnly: false
  };
}

export function resetGhost(ghost) {
  ghost.tile = { ...ghost.spawn };
  ghost.from = { ...ghost.spawn };
  ghost.to = { ...ghost.spawn };
  ghost.direction = 'up';
  ghost.queuedDirection = null;
  ghost.mode = 'holding';
  ghost.prevMode = 'scatter';
  ghost.released = false;
  ghost.releaseTimer = ghost.releaseDelay;
  ghost.stepProgress = 0;
  ghost.reverseRequested = false;
  ghost.frightenedTicks = 0;
  ghost.eyesOnly = false;
}

export function setGhostMode(ghost, mode) {
  if (ghost.mode === 'eaten' && mode !== 'eaten') {
    return;
  }
  if (ghost.mode !== mode) {
    ghost.prevMode = ghost.mode;
    ghost.mode = mode;
    if (mode === 'frightened') {
      ghost.reverseRequested = true;
    }
    if (mode === 'scatter' || mode === 'chase') {
      ghost.reverseRequested = true;
    }
  }
}

export function releaseGhost(ghost) {
  ghost.released = true;
  ghost.mode = ghost.prevMode === 'holding' ? 'scatter' : ghost.prevMode;
}

export function updateGhostRelease(ghost, dt) {
  if (ghost.released) {
    return;
  }
  ghost.releaseTimer -= dt;
  if (ghost.releaseTimer <= 0) {
    releaseGhost(ghost);
  }
}

export function getGhostTarget(ghost, state) {
  const maze = state.maze;
  const pacman = state.pacman;
  const blinky = state.ghosts.find((item) => item.id === 'blinky') || ghost;
  if (ghost.mode === 'eaten') {
    return { ...maze.ghostHouse.door };
  }
  if (!ghost.released) {
    return { ...maze.ghostHouse.door };
  }
  if (ghost.mode === 'frightened') {
    return { ...pacman.tile };
  }
  const mode = state.globalMode;
  if (mode === 'scatter') {
    return { ...ghost.scatterTarget };
  }
  switch (ghost.id) {
    case 'blinky':
      return { ...pacman.tile };
    case 'pinky': {
      const ahead = projectPacmanTile(pacman, maze, 4);
      return ahead;
    }
    case 'inky': {
      const ahead = projectPacmanTile(pacman, maze, 2);
      const vectorX = ahead.x - blinky.tile.x;
      const vectorY = ahead.y - blinky.tile.y;
      return {
        x: ahead.x + vectorX,
        y: ahead.y + vectorY
      };
    }
    case 'clyde': {
      const distance = Math.abs(ghost.tile.x - pacman.tile.x) + Math.abs(ghost.tile.y - pacman.tile.y);
      if (distance <= 6) {
        return { ...ghost.scatterTarget };
      }
      return { ...pacman.tile };
    }
    default:
      return { ...pacman.tile };
  }
}

export function projectPacmanTile(pacman, maze, steps = 4) {
  const direction = pacman.direction || pacman.nextDirection || 'left';
  let tile = { ...pacman.tile };
  for (let index = 0; index < steps; index += 1) {
    tile = moveTile(maze, tile, direction);
  }
  return tile;
}

export function getValidGhostDirections(ghost, maze) {
  return DIRECTION_ORDER.filter((name) => {
    const next = moveTile(maze, ghost.tile, name);
    return isWalkableForGhost(getCell(maze.grid, next.x, next.y));
  });
}

export function chooseGhostDirection(ghost, state, random = Math.random) {
  const maze = state.maze;
  const validDirections = getValidGhostDirections(ghost, maze);
  if (!validDirections.length) {
    return ghost.direction;
  }

  const reverse = DIRECTIONS[ghost.direction]?.opposite;
  let candidates = validDirections.filter((direction) => direction !== reverse);
  if (!candidates.length) {
    candidates = validDirections;
  }

  if (ghost.reverseRequested && validDirections.includes(reverse)) {
    ghost.reverseRequested = false;
    return reverse;
  }

  if (ghost.mode === 'frightened') {
    const pacmanTile = state.pacman.tile;
    const scored = candidates.map((direction) => {
      const next = moveTile(maze, ghost.tile, direction);
      const distance = findShortestDistance(maze, next, pacmanTile, 'ghost');
      return { direction, distance };
    });
    const maxDistance = Math.max(...scored.map((item) => item.distance));
    const options = scored.filter((item) => item.distance === maxDistance).map((item) => item.direction);
    return randomFrom(options, random);
  }

  const target = getGhostTarget(ghost, state);
  const scored = candidates.map((direction) => {
    const next = moveTile(maze, ghost.tile, direction);
    const distance = findShortestDistance(maze, next, target, 'ghost');
    const bias = direction === ghost.direction ? -0.12 : 0;
    return { direction, score: distance + bias };
  });
  const minScore = Math.min(...scored.map((item) => item.score));
  const options = scored.filter((item) => item.score === minScore).map((item) => item.direction);
  return randomFrom(options, random);
}

export function getGhostSpeed(ghost, state) {
  const difficulty = state.difficulty;
  const base = ghost.baseSpeed * (difficulty.ghostSpeed || 1);
  if (ghost.mode === 'frightened') {
    return base * 0.74;
  }
  if (ghost.mode === 'eaten') {
    return base * 1.35;
  }
  if (!ghost.released) {
    return 0;
  }
  return base;
}

export function isGhostHouseResident(ghost, maze) {
  return isInGhostHouse(ghost.tile, maze);
}

export function setGhostFrightened(ghost, frightenedSeconds) {
  if (ghost.mode === 'eaten') {
    return;
  }
  ghost.prevMode = ghost.mode;
  ghost.mode = 'frightened';
  ghost.frightenedTicks = frightenedSeconds;
  ghost.reverseRequested = true;
}

export function restoreGhostMode(ghost, globalMode) {
  if (ghost.mode === 'eaten') {
    return;
  }
  if (ghost.prevMode === 'frightened') {
    ghost.prevMode = globalMode;
  }
  ghost.mode = globalMode;
  ghost.reverseRequested = true;
}

export function setGhostEaten(ghost) {
  ghost.prevMode = ghost.mode === 'frightened' ? 'chase' : ghost.mode;
  ghost.mode = 'eaten';
  ghost.eyesOnly = true;
  ghost.reverseRequested = false;
}

export function getGhostVisualMode(ghost) {
  if (ghost.mode === 'eaten') {
    return 'eaten';
  }
  if (ghost.mode === 'frightened') {
    return ghost.frightenedTicks <= 2000 ? 'frightened-blink' : 'frightened';
  }
  return ghost.mode;
}

export function ghostCanLeaveHouse(ghost) {
  return ghost.released;
}
