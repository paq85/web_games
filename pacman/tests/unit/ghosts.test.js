import assert from 'node:assert/strict';
import test from 'node:test';

import { DIFFICULTIES } from '../../js/constants.js';
import { createMaze } from '../../js/maze.js';
import { chooseGhostDirection, createGhosts, getGhostTarget, projectPacmanTile, setGhostFrightened } from '../../js/ghosts.js';

function createState(overrides = {}) {
  const maze = createMaze(1);
  const difficulty = DIFFICULTIES.medium;
  const ghosts = createGhosts(maze, difficulty);
  const state = {
    maze,
    difficulty,
    globalMode: 'scatter',
    pacman: {
      tile: { x: 10, y: 15 },
      direction: 'left',
      nextDirection: 'left'
    },
    ghosts,
    ...overrides
  };
  state.ghosts.forEach((ghost) => {
    ghost.released = true;
    ghost.mode = 'scatter';
  });
  return state;
}

test('ghosts target different tiles in chase mode', () => {
  const state = createState({ globalMode: 'chase' });
  const [blinky, pinky, inky, clyde] = state.ghosts;
  clyde.tile = { x: 3, y: 3 };
  assert.deepEqual(getGhostTarget(blinky, state), state.pacman.tile);
  assert.deepEqual(getGhostTarget(pinky, state), projectPacmanTile(state.pacman, state.maze, 4));
  assert.deepEqual(getGhostTarget(clyde, state), state.pacman.tile);
  const inkyTarget = getGhostTarget(inky, state);
  assert.ok(Number.isInteger(inkyTarget.x));
  assert.ok(Number.isInteger(inkyTarget.y));
});

test('clyde falls back to scatter target when close', () => {
  const state = createState({ globalMode: 'chase' });
  const clyde = state.ghosts[3];
  clyde.tile = { x: 11, y: 14 };
  state.pacman.tile = { x: 10, y: 15 };
  assert.deepEqual(getGhostTarget(clyde, state), clyde.scatterTarget);
});

test('frightened ghosts still choose a valid direction', () => {
  const state = createState({ globalMode: 'chase' });
  const ghost = state.ghosts[0];
  ghost.tile = { ...state.maze.pacmanStart };
  ghost.direction = 'left';
  setGhostFrightened(ghost, 3000);
  const direction = chooseGhostDirection(ghost, state, () => 0.2);
  assert.ok(['up', 'down', 'left', 'right'].includes(direction));
});
