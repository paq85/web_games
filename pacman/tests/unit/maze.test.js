import assert from 'node:assert/strict';
import test from 'node:test';

import { TILE } from '../../js/constants.js';
import { canEnter, createMaze, findShortestDistance, getNeighbors } from '../../js/maze.js';

function reachablePelletCount(maze) {
  const start = maze.pacmanStart;
  const queue = [start];
  const seen = new Set([`${start.x},${start.y}`]);
  let count = 0;
  while (queue.length) {
    const tile = queue.shift();
    const cell = maze.grid[tile.y][tile.x];
    if (cell === TILE.PATH || cell === TILE.POWER) {
      count += 1;
    }
    for (const neighbor of getNeighbors(maze, tile, 'pacman')) {
      const key = `${neighbor.tile.x},${neighbor.tile.y}`;
      if (!seen.has(key)) {
        seen.add(key);
        queue.push(neighbor.tile);
      }
    }
  }
  return count;
}

test('maze creates a connected Pacman board', () => {
  const maze = createMaze(1);
  assert.equal(maze.width, 21);
  assert.equal(maze.height, 21);
  assert.ok(maze.pelletsRemaining > 0);
  assert.equal(canEnter(maze, maze.pacmanStart, 'pacman'), true);
  assert.equal(maze.grid[maze.ghostHouse.y + 1][maze.ghostHouse.x + 1], TILE.HOUSE);
  assert.equal(maze.grid[maze.ghostHouse.door.y][maze.ghostHouse.door.x], TILE.DOOR);
  assert.equal(reachablePelletCount(maze), maze.totalPellets);
});

test('maze wraps the tunnel correctly', () => {
  const maze = createMaze(1);
  const rightSide = { x: maze.width - 1, y: maze.tunnelRow };
  const leftSide = { x: 0, y: maze.tunnelRow };
  assert.ok(findShortestDistance(maze, { x: 1, y: maze.tunnelRow }, rightSide, 'pacman') > 0);
  assert.ok(findShortestDistance(maze, { x: maze.width - 2, y: maze.tunnelRow }, leftSide, 'ghost') > 0);
});
