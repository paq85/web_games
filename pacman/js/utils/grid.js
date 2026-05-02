import {
  DIRECTIONS,
  DIRECTION_VECTORS,
  PACMAN_PASSABLE_TILES,
  PASSABLE_TILES,
  TILE
} from '../constants.js';

export function cloneGrid(rows) {
  return rows.map((row) => [...row]);
}

export function countPellets(grid) {
  let pellets = 0;
  for (const row of grid) {
    for (const tile of row) {
      if (tile === TILE.PELLET || tile === TILE.POWER) {
        pellets += 1;
      }
    }
  }
  return pellets;
}

export function isTunnelRow(maze, y) {
  return maze.tunnelRows.includes(y);
}

export function wrapX(maze, x, y) {
  if (!isTunnelRow(maze, y)) {
    return x;
  }
  if (x < 0) {
    return maze.width - 1;
  }
  if (x >= maze.width) {
    return 0;
  }
  return x;
}

export function getTile(maze, grid, x, y) {
  if (y < 0 || y >= maze.height) {
    return TILE.WALL;
  }
  const wrappedX = wrapX(maze, x, y);
  if (wrappedX < 0 || wrappedX >= maze.width) {
    return TILE.WALL;
  }
  return grid[y]?.[wrappedX] ?? TILE.WALL;
}

export function canOccupyTile(maze, grid, x, y, entityType = 'pacman') {
  const tile = getTile(maze, grid, x, y);
  if (entityType === 'pacman') {
    return PACMAN_PASSABLE_TILES.has(tile);
  }
  if (entityType === 'ghost-door') {
    return PASSABLE_TILES.has(tile);
  }
  return PASSABLE_TILES.has(tile) && tile !== TILE.DOOR;
}

export function getNeighborTile(maze, tile, direction) {
  const vector = DIRECTION_VECTORS[direction];
  const x = wrapX(maze, tile.x + vector.x, tile.y + vector.y);
  const y = tile.y + vector.y;
  return { x, y };
}

export function getOpenDirections(maze, grid, tile, entityType = 'pacman') {
  return DIRECTIONS.filter((direction) => {
    const next = getNeighborTile(maze, tile, direction);
    return canOccupyTile(maze, grid, next.x, next.y, entityType);
  });
}

export function tilesEqual(left, right) {
  return left.x === right.x && left.y === right.y;
}

export function squaredDistance(left, right) {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return dx * dx + dy * dy;
}

export function manhattanDistance(left, right) {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

export function lerpPosition(entity, alpha = 1) {
  const progress = entity.progress >= 1 ? 1 : Math.min(1, entity.progress + (1 - entity.progress) * alpha);
  return {
    x: entity.from.x + (entity.to.x - entity.from.x) * progress,
    y: entity.from.y + (entity.to.y - entity.from.y) * progress
  };
}
