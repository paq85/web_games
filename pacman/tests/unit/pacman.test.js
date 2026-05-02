// === Pacman Unit Tests ===
import { describe, it, expect, beforeEach } from 'vitest';
import { Pacman } from '../../js/pacman.js';
import { Maze } from '../../js/maze.js';
import { DIR, PACMAN_START } from '../../js/constants.js';

describe('Pacman', () => {
  let pacman;
  let maze;

  beforeEach(() => {
    pacman = new Pacman();
    maze = new Maze();
  });

  it('starts at correct position', () => {
    expect(pacman.x).toBe(PACMAN_START.x);
    expect(pacman.y).toBe(PACMAN_START.y);
  });

  it('starts with no direction', () => {
    expect(pacman.dir).toBe(DIR.NONE);
  });

  it('starts alive', () => {
    expect(pacman.alive).toBe(true);
  });

  it('queues direction', () => {
    pacman.queueDirection(DIR.LEFT);
    expect(pacman.nextDir).toBe(DIR.LEFT);
  });

  it('moves when direction is set and path is clear', () => {
    pacman.setSpeed(1.0);
    pacman.dir = DIR.LEFT;
    // Position pacman on a walkable tile
    pacman.x = 13;
    pacman.y = 23;
    const startX = pacman.x;
    pacman.update(0.1, maze);
    // Should have moved left if there's path
    expect(pacman.x).not.toBe(startX);
  });

  it('does not move through walls', () => {
    pacman.setSpeed(1.0);
    // Put pacman next to a wall and try to move into it
    pacman.x = 1;
    pacman.y = 1;
    pacman.dir = DIR.UP; // Row 0 is all walls
    pacman.nextDir = DIR.UP;
    const startY = pacman.y;
    pacman.update(0.1, maze);
    // Should not have moved into wall
    expect(pacman.y).toBeGreaterThanOrEqual(startY - 0.5); // Approximate
  });

  it('dies correctly', () => {
    pacman.die();
    expect(pacman.alive).toBe(false);
    expect(pacman.moving).toBe(false);
  });

  it('reset restores to start', () => {
    pacman.x = 5;
    pacman.y = 5;
    pacman.dir = DIR.LEFT;
    pacman.die();
    pacman.reset();
    expect(pacman.x).toBe(PACMAN_START.x);
    expect(pacman.y).toBe(PACMAN_START.y);
    expect(pacman.alive).toBe(true);
    expect(pacman.dir).toBe(DIR.NONE);
  });

  it('getTileX and getTileY return integer positions', () => {
    pacman.x = 5.3;
    pacman.y = 10.7;
    expect(pacman.getTileX()).toBe(5);
    expect(pacman.getTileY()).toBe(11);
  });

  it('getAngle returns correct angles', () => {
    pacman.dir = DIR.RIGHT;
    expect(pacman.getAngle()).toBe(0);
    pacman.dir = DIR.DOWN;
    expect(pacman.getAngle()).toBe(Math.PI / 2);
    pacman.dir = DIR.LEFT;
    expect(pacman.getAngle()).toBe(Math.PI);
    pacman.dir = DIR.UP;
    expect(pacman.getAngle()).toBe(-Math.PI / 2);
  });

  it('setSpeed sets speed based on percentage', () => {
    pacman.setSpeed(0.8);
    expect(pacman.speed).toBeGreaterThan(0);
  });
});
