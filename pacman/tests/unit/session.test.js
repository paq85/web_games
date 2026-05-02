import { describe, expect, it } from 'vitest';

import { GHOST_STATES, RUN_MODES } from '../../js/constants.js';
import { GameSession } from '../../js/core/game-session.js';
import { createDefaultSettings } from '../../js/data/default-settings.js';

describe('GameSession core mechanics', () => {
  it('activates frightened mode after a power pellet', () => {
    const session = new GameSession({
      difficulty: 'medium',
      runMode: RUN_MODES.NORMAL,
      settings: createDefaultSettings()
    });

    session.phase = 'playing';
    session.pacman.tile = { x: 1, y: 1 };
    session.consumeTile();

    expect(session.powerTimer).toBeGreaterThan(0);
    expect(session.score).toBe(50);
    expect(session.ghosts.blinky.state).toBe(GHOST_STATES.FRIGHTENED);
    expect(session.ghosts.pinky.state).toBe(GHOST_STATES.HOUSE);
  });

  it('awards the ghost chain values in order', () => {
    const session = new GameSession({
      difficulty: 'medium',
      runMode: RUN_MODES.NORMAL,
      settings: createDefaultSettings()
    });

    session.phase = 'playing';
    session.ghosts.blinky.state = GHOST_STATES.FRIGHTENED;
    session.ghosts.blinky.tile = { ...session.pacman.tile };
    session.ghosts.blinky.from = { ...session.pacman.tile };
    session.ghosts.blinky.to = { ...session.pacman.tile };
    session.ghosts.blinky.progress = 1;

    session.checkGhostCollisions();

    expect(session.score).toBe(200);
    expect(session.ghosts.blinky.state).toBe(GHOST_STATES.EATEN);

    session.ghosts.pinky.state = GHOST_STATES.FRIGHTENED;
    session.ghosts.pinky.tile = { ...session.pacman.tile };
    session.ghosts.pinky.from = { ...session.pacman.tile };
    session.ghosts.pinky.to = { ...session.pacman.tile };
    session.ghosts.pinky.progress = 1;

    session.checkGhostCollisions();

    expect(session.score).toBe(600);
    expect(session.bestGhostChain).toBe(400);
  });
});
