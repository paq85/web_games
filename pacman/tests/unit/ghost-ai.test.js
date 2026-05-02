import { describe, expect, it } from 'vitest';

import { GHOST_STATES } from '../../js/constants.js';
import { chooseGhostDirection, createGhost, getGhostTarget } from '../../js/entities/ghost.js';
import { SeededRandom } from '../../js/utils/random.js';

function makeGhost(name, overrides = {}) {
  const ghost = createGhost(
    name,
    { x: 6, y: 6, direction: 'left', outside: true, ...overrides.spawn },
    overrides.scatterTarget ?? { x: 1, y: 1 },
    { x: 10, y: 7 },
    { x: 10, y: 9 }
  );
  ghost.state = overrides.state ?? GHOST_STATES.CHASE;
  ghost.tile = overrides.tile ?? { x: 6, y: 6 };
  return ghost;
}

describe('ghost targeting', () => {
  const pacman = { tile: { x: 10, y: 10 }, direction: 'right', lastMoveDirection: 'right' };
  const blinky = makeGhost('blinky', { tile: { x: 8, y: 10 } });
  const context = {
    pacman,
    blinky,
    globalMode: GHOST_STATES.CHASE,
    directionVectors: {
      right: { x: 1, y: 0 },
      left: { x: -1, y: 0 },
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 }
    }
  };

  it('makes blinky chase Pac-Man directly', () => {
    expect(getGhostTarget(blinky, context)).toEqual({ x: 10, y: 10 });
  });

  it('makes pinky aim ahead of Pac-Man', () => {
    const pinky = makeGhost('pinky');
    expect(getGhostTarget(pinky, context)).toEqual({ x: 14, y: 10 });
  });

  it('makes inky use Pac-Man and blinky together', () => {
    const inky = makeGhost('inky');
    expect(getGhostTarget(inky, context)).toEqual({ x: 16, y: 10 });
  });

  it('makes clyde retreat when close to Pac-Man', () => {
    const clyde = makeGhost('clyde', { tile: { x: 9, y: 10 }, scatterTarget: { x: 0, y: 20 } });
    expect(getGhostTarget(clyde, context)).toEqual({ x: 0, y: 20 });
  });

  it('chooses the direction that closes in on the target', () => {
    const ghost = makeGhost('blinky');
    const choice = chooseGhostDirection(
      ghost,
      ['left', 'right', 'up'],
      { x: 10, y: 6 },
      { width: 21, height: 21, tunnelRows: [] },
      new SeededRandom(123)
    );

    expect(choice).toBe('right');
  });
});
