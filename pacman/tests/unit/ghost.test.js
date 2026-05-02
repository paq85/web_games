// === Ghost Unit Tests ===
import { describe, it, expect, beforeEach } from 'vitest';
import { Ghost, Blinky, Pinky, Inky, Clyde } from '../../js/ghost.js';
import { Maze } from '../../js/maze.js';
import { Pacman } from '../../js/pacman.js';
import { DIR, GHOST_STATE, SCATTER_TARGETS } from '../../js/constants.js';

describe('Ghost', () => {
  let maze;
  let pacman;

  beforeEach(() => {
    maze = new Maze();
    pacman = new Pacman();
    pacman.x = 14;
    pacman.y = 23;
    pacman.dir = DIR.LEFT;
  });

  describe('Blinky', () => {
    let blinky;

    beforeEach(() => {
      blinky = new Blinky();
    });

    it('starts at correct position', () => {
      expect(blinky.x).toBe(13.5);
      expect(blinky.y).toBe(11);
    });

    it('starts in scatter state', () => {
      expect(blinky.state).toBe(GHOST_STATE.SCATTER);
    });

    it('targets pacman directly in chase mode', () => {
      const target = blinky.getChaseTarget(pacman);
      expect(target.x).toBe(pacman.getTileX());
      expect(target.y).toBe(pacman.getTileY());
    });

    it('targets top-right corner in scatter mode', () => {
      blinky.state = GHOST_STATE.SCATTER;
      const target = blinky.getTarget(pacman, null);
      expect(target).toEqual(SCATTER_TARGETS.blinky);
    });

    it('becomes frightened from power pellet', () => {
      blinky.frighten(6);
      expect(blinky.state).toBe(GHOST_STATE.FRIGHTENED);
      expect(blinky.frightenedTimer).toBe(6);
    });

    it('transitions to eaten when consumed', () => {
      blinky.frighten(6);
      blinky.eat();
      expect(blinky.state).toBe(GHOST_STATE.EATEN);
    });

    it('does not become frightened when eaten', () => {
      blinky.eat();
      blinky.frighten(6);
      expect(blinky.state).toBe(GHOST_STATE.EATEN);
    });
  });

  describe('Pinky', () => {
    let pinky;

    beforeEach(() => {
      pinky = new Pinky();
    });

    it('starts in ghost house', () => {
      expect(pinky.state).toBe(GHOST_STATE.IN_HOUSE);
    });

    it('targets 4 tiles ahead of pacman in chase', () => {
      pacman.dir = DIR.RIGHT;
      const target = pinky.getChaseTarget(pacman);
      expect(target.x).toBe(pacman.getTileX() + 4);
      expect(target.y).toBe(pacman.getTileY());
    });

    it('implements classic overflow bug when facing up', () => {
      pacman.dir = DIR.UP;
      const target = pinky.getChaseTarget(pacman);
      expect(target.x).toBe(pacman.getTileX() - 4);
      expect(target.y).toBe(pacman.getTileY() - 4);
    });

    it('can be released from house', () => {
      pinky.release();
      expect(pinky.state).toBe(GHOST_STATE.LEAVING_HOUSE);
      expect(pinky.released).toBe(true);
    });
  });

  describe('Inky', () => {
    let inky;
    let blinky;

    beforeEach(() => {
      inky = new Inky();
      blinky = new Blinky();
      blinky.x = 10;
      blinky.y = 10;
    });

    it('starts in ghost house', () => {
      expect(inky.state).toBe(GHOST_STATE.IN_HOUSE);
    });

    it('uses blinky position for targeting', () => {
      pacman.dir = DIR.RIGHT;
      const target = inky.getChaseTarget(pacman, blinky);
      // Target is based on vector from blinky to 2 ahead of pacman, doubled
      expect(target.x).not.toBeNaN();
      expect(target.y).not.toBeNaN();
    });

    it('falls back to ahead-of-pacman when no blinky', () => {
      pacman.dir = DIR.RIGHT;
      const target = inky.getChaseTarget(pacman, null);
      expect(target.x).toBe(pacman.getTileX() + 2);
      expect(target.y).toBe(pacman.getTileY());
    });
  });

  describe('Clyde', () => {
    let clyde;

    beforeEach(() => {
      clyde = new Clyde();
    });

    it('starts in ghost house', () => {
      expect(clyde.state).toBe(GHOST_STATE.IN_HOUSE);
    });

    it('chases when far from pacman', () => {
      clyde.x = 1;
      clyde.y = 1;
      pacman.x = 20;
      pacman.y = 20;
      const target = clyde.getChaseTarget(pacman);
      expect(target.x).toBe(pacman.getTileX());
      expect(target.y).toBe(pacman.getTileY());
    });

    it('scatters to corner when close to pacman', () => {
      clyde.x = pacman.x + 2;
      clyde.y = pacman.y + 2;
      const target = clyde.getChaseTarget(pacman);
      expect(target).toEqual(SCATTER_TARGETS.clyde);
    });
  });

  describe('Ghost state transitions', () => {
    let ghost;

    beforeEach(() => {
      ghost = new Blinky();
      ghost.setSpeed(0.75);
    });

    it('reverses direction on mode change', () => {
      ghost.dir = DIR.RIGHT;
      ghost.setState(GHOST_STATE.CHASE);
      expect(ghost.dir).toBe(DIR.LEFT);
    });

    it('frightened timer decreases', () => {
      ghost.frighten(6);
      ghost.update(1, maze, pacman, null);
      expect(ghost.frightenedTimer).toBeLessThan(6);
    });

    it('returns to scatter after frightened expires', () => {
      ghost.frighten(0.1);
      ghost.update(0.2, maze, pacman, null);
      expect(ghost.state).not.toBe(GHOST_STATE.FRIGHTENED);
    });

    it('flashes when frightened time is low', () => {
      ghost.frighten(1.5);
      ghost.update(0.1, maze, pacman, null);
      expect(ghost.flashing).toBe(true);
    });

    it('reset restores initial state', () => {
      ghost.x = 5;
      ghost.y = 5;
      ghost.state = GHOST_STATE.CHASE;
      ghost.reset();
      expect(ghost.x).toBe(ghost.startPos.x);
      expect(ghost.y).toBe(ghost.startPos.y);
      expect(ghost.state).toBe(GHOST_STATE.SCATTER);
    });
  });
});
