import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Brick, BrickGrid, BRICK_TYPES, BRICK_COLORS } from '../../js/bricks.js';

describe('Brick', () => {
  it('standard brick destroyed on one hit', () => {
    const brick = new Brick(0, 0, 30, 20, BRICK_TYPES.STANDARD, 1);
    const destroyed = brick.hit();
    expect(destroyed).toBe(true);
    expect(brick.alive).toBe(false);
  });

  it('reinforced brick requires two hits', () => {
    const brick = new Brick(0, 0, 30, 20, BRICK_TYPES.REINFORCED, 2);
    const first = brick.hit();
    expect(first).toBe(false);
    expect(brick.alive).toBe(true);
    expect(brick.hits).toBe(1);

    const second = brick.hit();
    expect(second).toBe(true);
    expect(brick.alive).toBe(false);
  });

  it('unbreakable brick cannot be destroyed', () => {
    const brick = new Brick(0, 0, 30, 20, BRICK_TYPES.UNBREAKABLE, 999);
    const destroyed = brick.hit();
    expect(destroyed).toBe(false);
    expect(brick.alive).toBe(true);
  });

  it('standard brick awards 10 points', () => {
    const brick = new Brick(0, 0, 30, 20, BRICK_TYPES.STANDARD, 1);
    expect(brick.getScore()).toBe(10);
  });

  it('reinforced brick awards 20 points', () => {
    const brick = new Brick(0, 0, 30, 20, BRICK_TYPES.REINFORCED, 2);
    expect(brick.getScore()).toBe(20);
  });

  it('unbreakable brick awards 0 points', () => {
    const brick = new Brick(0, 0, 30, 20, BRICK_TYPES.UNBREAKABLE, 999);
    expect(brick.getScore()).toBe(0);
  });
});

describe('BrickGrid', () => {
  let grid;

  beforeEach(() => {
    grid = new BrickGrid(5, 3, 30, 20, 3, 10, 50);
  });

  it('creates bricks from matrix', () => {
    grid.createFromMatrix([
      [1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
    ]);
    expect(grid.bricks.length).toBe(10);
  });

  it('getAliveCount returns correct count', () => {
    grid.createFromMatrix([
      [1, 1, 1],
    ]);
    expect(grid.getAliveCount()).toBe(3);
    grid.bricks[0].alive = false;
    expect(grid.getAliveCount()).toBe(2);
  });

  it('getDestructibleCount excludes unbreakable', () => {
    grid.createFromMatrix([
      [1, 3, 1],
    ]);
    expect(grid.getDestructibleCount()).toBe(2);
  });

  it('checkCollision detects ball-brick collision', () => {
    grid.createFromMatrix([
      [1, 0, 0],
    ]);
    const ball = {
      x: 15,
      y: 55,
      radius: 6,
      vx: 3,
      vy: 2,
      collidesWithRect: function(rx, ry, rw, rh) {
        return true;
      },
      bounceOffBrick: vi.fn(),
    };
    const hit = grid.checkCollision(ball);
    expect(hit).not.toBeNull();
    expect(hit.destroyed).toBe(true);
  });

  it('checkCollision returns null when no collision', () => {
    grid.createFromMatrix([
      [1, 0, 0],
    ]);
    const ball = {
      x: 500,
      y: 500,
      radius: 6,
      vx: 3,
      vy: 2,
      collidesWithRect: function(rx, ry, rw, rh) {
        return false;
      },
      bounceOffBrick: vi.fn(),
    };
    const hit = grid.checkCollision(ball);
    expect(hit).toBeNull();
  });

  it('checkLaserCollision detects laser-brick collision', () => {
    grid.createFromMatrix([
      [1, 0, 0],
    ]);
    const hit = grid.checkLaserCollision(15, 55, 4, 12);
    expect(hit).not.toBeNull();
    expect(hit.destroyed).toBe(true);
  });
});


