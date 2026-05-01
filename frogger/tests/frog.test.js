import { describe, it, expect } from 'vitest';
import { Frog, DIRECTIONS } from '../js/frog.js';

describe('Frog', () => {
  it('starts at the correct position', () => {
    const frog = new Frog({ startX: 7, startY: 12 });
    expect(frog.x).toBe(7);
    expect(frog.y).toBe(12);
    expect(frog.direction).toBe(DIRECTIONS.UP);
  });

  it('moves up', () => {
    const frog = new Frog({ startX: 7, startY: 12 });
    const result = frog.move(DIRECTIONS.UP, 15, 13);
    expect(result).toBe(true);
    expect(frog.y).toBe(11);
    expect(frog.direction).toBe(DIRECTIONS.UP);
  });

  it('moves down', () => {
    const frog = new Frog({ startX: 7, startY: 12 });
    const result = frog.move(DIRECTIONS.DOWN, 15, 13);
    expect(result).toBe(false); // at bottom edge
  });

  it('moves left', () => {
    const frog = new Frog({ startX: 7, startY: 12 });
    const result = frog.move(DIRECTIONS.LEFT, 15, 13);
    expect(result).toBe(true);
    expect(frog.x).toBe(6);
  });

  it('moves right', () => {
    const frog = new Frog({ startX: 7, startY: 12 });
    const result = frog.move(DIRECTIONS.RIGHT, 15, 13);
    expect(result).toBe(true);
    expect(frog.x).toBe(8);
  });

  it('cannot move beyond left boundary', () => {
    const frog = new Frog({ startX: 0, startY: 6 });
    const result = frog.move(DIRECTIONS.LEFT, 15, 13);
    expect(result).toBe(false);
    expect(frog.x).toBe(0);
  });

  it('cannot move beyond right boundary', () => {
    const frog = new Frog({ startX: 14, startY: 6 });
    const result = frog.move(DIRECTIONS.RIGHT, 15, 13);
    expect(result).toBe(false);
    expect(frog.x).toBe(14);
  });

  it('cannot move beyond top boundary', () => {
    const frog = new Frog({ startX: 7, startY: 0 });
    const result = frog.move(DIRECTIONS.UP, 15, 13);
    expect(result).toBe(false);
    expect(frog.y).toBe(0);
  });

  it('cannot move when dead', () => {
    const frog = new Frog({ startX: 7, startY: 12 });
    frog.isDead = true;
    const result = frog.move(DIRECTIONS.UP, 15, 13);
    expect(result).toBe(false);
  });

  it('resets to starting position', () => {
    const frog = new Frog({ startX: 7, startY: 12 });
    frog.move(DIRECTIONS.UP, 15, 13);
    frog.move(DIRECTIONS.LEFT, 15, 13);
    frog.reset();
    expect(frog.x).toBe(7);
    expect(frog.y).toBe(12);
    expect(frog.isDead).toBe(false);
    expect(frog.isOnPlatform).toBe(false);
  });

  it('applies conveyor movement', () => {
    const frog = new Frog({ startX: 7, startY: 6 });
    frog.applyConveyor(10, 40);
    expect(frog.getConveyorOffset()).toBe(10);
  });

  it('gets pixel position with conveyor offset', () => {
    const frog = new Frog({ startX: 7, startY: 6 });
    frog.applyConveyor(10, 40);
    const pos = frog.getPixelPosition(40);
    expect(pos.x).toBe(7 * 40 + 10);
    expect(pos.y).toBe(6 * 40);
  });

  it('resets conveyor offset on reset', () => {
    const frog = new Frog({ startX: 7, startY: 12 });
    frog.applyConveyor(20, 40);
    frog.reset();
    expect(frog.getConveyorOffset()).toBe(0);
  });
});
