import { describe, it, expect } from 'vitest';
import { Obstacle } from '../js/obstacle.js';

describe('Obstacle', () => {
  it('creates with correct properties', () => {
    const obs = new Obstacle({
      id: 'test',
      x: 100,
      y: 200,
      width: 40,
      height: 40,
      speed: 2,
      direction: 1,
      type: 'car',
      row: 12,
    });

    expect(obs.id).toBe('test');
    expect(obs.x).toBe(100);
    expect(obs.y).toBe(200);
    expect(obs.width).toBe(40);
    expect(obs.height).toBe(40);
    expect(obs.speed).toBe(2);
    expect(obs.direction).toBe(1);
    expect(obs.type).toBe('car');
    expect(obs.visible).toBe(true);
  });

  it('moves right when direction is positive', () => {
    const obs = new Obstacle({
      id: 'test', x: 100, y: 200, width: 40, height: 40,
      speed: 2, direction: 1, type: 'car', row: 12,
    });
    obs.update(0.5, 40, 600);
    expect(obs.x).toBe(100 + 2 * 40 * 0.5); // 140
  });

  it('moves left when direction is negative', () => {
    const obs = new Obstacle({
      id: 'test', x: 100, y: 200, width: 40, height: 40,
      speed: 2, direction: -1, type: 'car', row: 12,
    });
    obs.update(0.5, 40, 600);
    expect(obs.x).toBe(100 - 2 * 40 * 0.5); // 60
  });

  it('does not move when direction is 0', () => {
    const obs = new Obstacle({
      id: 'test', x: 100, y: 200, width: 40, height: 40,
      speed: 2, direction: 0, type: 'car', row: 12,
    });
    obs.update(0.5, 40, 600);
    expect(obs.x).toBe(100);
  });

  it('wraps around right edge', () => {
    const obs = new Obstacle({
      id: 'test', x: 580, y: 200, width: 40, height: 40,
      speed: 2, direction: 1, type: 'car', row: 12,
    });
    obs.update(1, 40, 600);
    // 580 + 80 = 660 > 600, so wraps to -40
    expect(obs.x).toBe(-40);
  });

  it('wraps around left edge', () => {
    const obs = new Obstacle({
      id: 'test', x: -30, y: 200, width: 40, height: 40,
      speed: 2, direction: -1, type: 'car', row: 12,
    });
    obs.update(1, 40, 600);
    // -30 - 80 = -110, x + width = -70 < 0, so wraps to 600
    expect(obs.x).toBe(600);
  });

  it('returns correct bounds', () => {
    const obs = new Obstacle({
      id: 'test', x: 100, y: 200, width: 40, height: 40,
      speed: 2, direction: 1, type: 'car', row: 12,
    });
    const bounds = obs.getBounds();
    expect(bounds).toEqual({ x: 100, y: 200, width: 40, height: 40 });
  });
});
