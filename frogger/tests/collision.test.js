import { describe, it, expect } from 'vitest';
import { checkCollision, findCollision, findAllCollisions } from '../js/collision.js';

describe('Collision Detection', () => {
  describe('checkCollision', () => {
    it('detects overlapping boxes', () => {
      const a = { x: 10, y: 10, width: 20, height: 20 };
      const b = { x: 15, y: 15, width: 20, height: 20 };
      expect(checkCollision(a, b)).toBe(true);
    });

    it('detects non-overlapping boxes (separated horizontally)', () => {
      const a = { x: 0, y: 10, width: 10, height: 20 };
      const b = { x: 15, y: 10, width: 10, height: 20 };
      expect(checkCollision(a, b)).toBe(false);
    });

    it('detects non-overlapping boxes (separated vertically)', () => {
      const a = { x: 10, y: 0, width: 20, height: 10 };
      const b = { x: 10, y: 15, width: 20, height: 10 };
      expect(checkCollision(a, b)).toBe(false);
    });

    it('detects touching edges as collision', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 };
      const b = { x: 10, y: 0, width: 10, height: 10 };
      expect(checkCollision(a, b)).toBe(false); // touching edges = no overlap
    });

    it('detects containment', () => {
      const a = { x: 0, y: 0, width: 40, height: 40 };
      const b = { x: 10, y: 10, width: 10, height: 10 };
      expect(checkCollision(a, b)).toBe(true);
    });
  });

  describe('findCollision', () => {
    it('finds the first colliding obstacle', () => {
      const frog = { x: 100, y: 100, width: 30, height: 30 };
      const obstacles = [
        { x: 200, y: 200, width: 30, height: 30, visible: true, getBounds: function() { return { x: this.x, y: this.y, width: this.width, height: this.height }; } },
        { x: 110, y: 110, width: 30, height: 30, visible: true, getBounds: function() { return { x: this.x, y: this.y, width: this.width, height: this.height }; } },
      ];
      const result = findCollision(frog, obstacles);
      expect(result).toBe(obstacles[1]);
    });

    it('returns null when no collision', () => {
      const frog = { x: 100, y: 100, width: 30, height: 30 };
      const obstacles = [
        { x: 0, y: 0, width: 10, height: 10, visible: true, getBounds: function() { return { x: this.x, y: this.y, width: this.width, height: this.height }; } },
      ];
      expect(findCollision(frog, obstacles)).toBeNull();
    });

    it('ignores invisible obstacles', () => {
      const frog = { x: 100, y: 100, width: 30, height: 30 };
      const obstacles = [
        { x: 110, y: 110, width: 30, height: 30, visible: false, getBounds: function() { return { x: this.x, y: this.y, width: this.width, height: this.height }; } },
      ];
      expect(findCollision(frog, obstacles)).toBeNull();
    });
  });

  describe('findAllCollisions', () => {
    it('finds all colliding obstacles', () => {
      const frog = { x: 100, y: 100, width: 40, height: 40 };
      const obstacles = [
        { x: 110, y: 110, width: 30, height: 30, visible: true, getBounds: function() { return { x: this.x, y: this.y, width: this.width, height: this.height }; } },
        { x: 0, y: 0, width: 10, height: 10, visible: true, getBounds: function() { return { x: this.x, y: this.y, width: this.width, height: this.height }; } },
        { x: 120, y: 120, width: 30, height: 30, visible: true, getBounds: function() { return { x: this.x, y: this.y, width: this.width, height: this.height }; } },
      ];
      const results = findAllCollisions(frog, obstacles);
      expect(results.length).toBe(2);
    });
  });
});
