import { describe, it, expect } from 'vitest';
import { RiverSystem } from '../js/river.js';
import { Frog } from '../js/frog.js';

describe('RiverSystem', () => {
  let river;

  beforeEach(() => {
    river = new RiverSystem();
  });

  it('identifies river rows', () => {
    expect(river.isRiverRow(3)).toBe(true);
    expect(river.isRiverRow(4)).toBe(true);
    expect(river.isRiverRow(5)).toBe(true);
    expect(river.isRiverRow(6)).toBe(true);
    expect(river.isRiverRow(7)).toBe(true);
  });

  it('does not identify non-river rows', () => {
    expect(river.isRiverRow(1)).toBe(false);
    expect(river.isRiverRow(8)).toBe(false);
    expect(river.isRiverRow(12)).toBe(false);
  });

  it('finds platform when frog is on one', () => {
    const frogBounds = { x: 200, y: 200, width: 30, height: 30 };
    const obstacles = [
      {
        row: 5,
        visible: true,
        getBounds: () => ({ x: 190, y: 190, width: 50, height: 40 }),
      },
    ];
    const platform = river.findPlatform(frogBounds, obstacles);
    expect(platform).toBe(obstacles[0]);
  });

  it('returns null when no platform under frog', () => {
    const frogBounds = { x: 200, y: 200, width: 30, height: 30 };
    const obstacles = [
      {
        row: 5,
        visible: true,
        getBounds: () => ({ x: 0, y: 0, width: 30, height: 30 }),
      },
    ];
    expect(river.findPlatform(frogBounds, obstacles)).toBeNull();
  });

  it('ignores invisible platforms', () => {
    const frogBounds = { x: 200, y: 200, width: 30, height: 30 };
    const obstacles = [
      {
        row: 5,
        visible: false,
        getBounds: () => ({ x: 190, y: 190, width: 50, height: 40 }),
      },
    ];
    expect(river.findPlatform(frogBounds, obstacles)).toBeNull();
  });

  it('detects drowning', () => {
    const frogBounds = { x: 200, y: 200, width: 30, height: 30 };
    const obstacles = [
      {
        row: 5,
        visible: true,
        getBounds: () => ({ x: 0, y: 0, width: 30, height: 30 }),
      },
    ];
    expect(river.isDrowning(5, frogBounds, obstacles)).toBe(true);
  });

  it('does not detect drowning on platform', () => {
    const frogBounds = { x: 200, y: 200, width: 30, height: 30 };
    const obstacles = [
      {
        row: 5,
        visible: true,
        getBounds: () => ({ x: 190, y: 190, width: 50, height: 40 }),
      },
    ];
    expect(river.isDrowning(5, frogBounds, obstacles)).toBe(false);
  });

  it('does not detect drowning outside river', () => {
    const frogBounds = { x: 200, y: 200, width: 30, height: 30 };
    expect(river.isDrowning(12, frogBounds, [])).toBe(false);
  });

  it('checks if frog is off-screen', () => {
    const frog = new Frog({ startX: 7, startY: 6 });
    // pixel x = 7*40 + offset = 280 + offset; threshold: < -20 or > 620
    frog.conveyorOffset = -350;
    expect(river.isOffScreen(frog, 600, 40)).toBe(true);

    frog.conveyorOffset = 400;
    expect(river.isOffScreen(frog, 600, 40)).toBe(true);

    frog.conveyorOffset = 0;
    expect(river.isOffScreen(frog, 600, 40)).toBe(false);
  });
});
