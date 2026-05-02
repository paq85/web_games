import { GHOST_STATES, OPPOSITE_DIRECTION } from '../constants.js';
import { getNeighborTile, squaredDistance, tilesEqual } from '../utils/grid.js';

const GHOST_COLORS = {
  blinky: '#ff4f5a',
  pinky: '#ff8ef1',
  inky: '#5ef6ff',
  clyde: '#ffb15a'
};

const GHOST_LABELS = {
  blinky: 'B',
  pinky: 'P',
  inky: 'I',
  clyde: 'C'
};

export function createGhost(name, spawn, scatterTarget, houseDoor, houseCenter) {
  return {
    name,
    label: GHOST_LABELS[name] ?? name.slice(0, 1).toUpperCase(),
    color: GHOST_COLORS[name] ?? '#ffffff',
    from: { x: spawn.x, y: spawn.y },
    to: { x: spawn.x, y: spawn.y },
    tile: { x: spawn.x, y: spawn.y },
    progress: 1,
    direction: spawn.direction ?? 'left',
    speed: 0,
    state: spawn.outside ? GHOST_STATES.SCATTER : GHOST_STATES.HOUSE,
    targetTile: scatterTarget,
    scatterTarget,
    houseDoor,
    houseCenter,
    releaseDelay: 0,
    frightenedTimer: 0,
    isReleased: spawn.outside,
    pendingReverse: false,
    wasEatenThisFrightenedCycle: false
  };
}

export function resetGhost(ghost, spawn, speed, releaseDelay) {
  ghost.from = { x: spawn.x, y: spawn.y };
  ghost.to = { x: spawn.x, y: spawn.y };
  ghost.tile = { x: spawn.x, y: spawn.y };
  ghost.progress = 1;
  ghost.direction = spawn.direction ?? 'left';
  ghost.speed = speed;
  ghost.state = spawn.outside ? GHOST_STATES.SCATTER : GHOST_STATES.HOUSE;
  ghost.releaseDelay = releaseDelay;
  ghost.frightenedTimer = 0;
  ghost.isReleased = spawn.outside;
  ghost.pendingReverse = false;
  ghost.wasEatenThisFrightenedCycle = false;
  return ghost;
}

export function queueGhostReverse(ghost) {
  ghost.pendingReverse = true;
}

export function applyPendingReverse(ghost) {
  if (!ghost.pendingReverse) {
    return;
  }
  ghost.direction = OPPOSITE_DIRECTION[ghost.direction] ?? ghost.direction;
  const currentFrom = ghost.from;
  ghost.from = ghost.to;
  ghost.to = currentFrom;
  ghost.progress = 1 - ghost.progress;
  ghost.pendingReverse = false;
}

export function getGhostTarget(ghost, context) {
  const { pacman, blinky, globalMode } = context;
  const ahead = (distance) => {
    const vector = context.directionVectors[pacman.lastMoveDirection || pacman.direction];
    return {
      x: pacman.tile.x + vector.x * distance,
      y: pacman.tile.y + vector.y * distance
    };
  };

  if (ghost.state === GHOST_STATES.EATEN || ghost.state === GHOST_STATES.HOUSE) {
    return ghost.houseDoor;
  }

  if (globalMode === GHOST_STATES.SCATTER) {
    return ghost.scatterTarget;
  }

  switch (ghost.name) {
    case 'blinky':
      return { ...pacman.tile };
    case 'pinky':
      return ahead(4);
    case 'inky': {
      const pivot = ahead(2);
      const dx = pivot.x - blinky.tile.x;
      const dy = pivot.y - blinky.tile.y;
      return { x: pivot.x + dx, y: pivot.y + dy };
    }
    case 'clyde': {
      const distanceFromPacman = Math.sqrt(squaredDistance(ghost.tile, pacman.tile));
      return distanceFromPacman > 8 ? { ...pacman.tile } : ghost.scatterTarget;
    }
    default:
      return { ...pacman.tile };
  }
}

export function chooseGhostDirection(ghost, candidates, targetTile, maze, random) {
  if (candidates.length === 0) {
    return ghost.direction;
  }

  if (ghost.state === GHOST_STATES.FRIGHTENED) {
    const ordered = [...candidates].sort();
    return random.pick(ordered) ?? ordered[0];
  }

  let bestDirection = candidates[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const direction of candidates) {
    const nextTile = getNeighborTile(maze, ghost.tile, direction);
    const distance = squaredDistance(nextTile, targetTile);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestDirection = direction;
    }
  }

  return bestDirection;
}

export function hasReachedHouseCenter(ghost) {
  return tilesEqual(ghost.tile, ghost.houseCenter);
}
