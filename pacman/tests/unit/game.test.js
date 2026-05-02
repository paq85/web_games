import assert from 'node:assert/strict';
import test from 'node:test';

import { createPacmanGame } from '../../js/game.js';
import { getNeighbors } from '../../js/maze.js';

function runUntilPlaying(game, steps = 10) {
  for (let index = 0; index < steps; index += 1) {
    game.update(400);
  }
}

test('game starts in countdown then enters play', () => {
  const game = createPacmanGame({ difficultyKey: 'easy', random: () => 0.25 });
  assert.equal(game.state.phase, 'countdown');
  game.update(4000);
  assert.equal(game.state.phase, 'playing');
});

test('pacman can move and score on pellets', () => {
  const game = createPacmanGame({ difficultyKey: 'medium', random: () => 0.25 });
  game.update(4000);
  const direction = getNeighbors(game.state.maze, game.state.pacman.tile, 'pacman')[0]?.direction;
  assert.ok(direction);
  game.queueDirection(direction);
  runUntilPlaying(game, 8);
  assert.ok(game.state.score >= 10);
});

test('pause and game over flows work', () => {
  const game = createPacmanGame({ difficultyKey: 'medium', random: () => 0.25 });
  game.update(4000);
  assert.equal(game.togglePause(), true);
  assert.equal(game.state.phase, 'paused');
  assert.equal(game.togglePause(), true);
  assert.equal(game.state.phase, 'playing');
  game.forceGameOver();
  assert.equal(game.state.phase, 'gameover');
  assert.equal(game.state.gameOver, true);
});
