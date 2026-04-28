// Collision tests - inline implementation
const Utils = {
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
};

const Collision = {
  aabb(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  },
  circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Utils.clamp(cx, rx, rx + rw);
    const closestY = Utils.clamp(cy, ry, ry + rh);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (cr * cr);
  },
  pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  },
  checkHelicopterCollisions(heli, entities) {
    const heliBox = { x: heli.x, y: heli.y, w: heli.width, h: heli.height };
    const hits = [];
    for (const entity of entities) {
      const entityBox = { x: entity.x, y: entity.y, w: entity.width, h: entity.height };
      if (this.aabb(heliBox, entityBox)) {
        hits.push(entity);
      }
    }
    return hits;
  },
  getTerrainHeightAt(x, terrainPoints) {
    if (!terrainPoints || terrainPoints.length === 0) return 0;
    for (let i = 0; i < terrainPoints.length - 1; i++) {
      if (x >= terrainPoints[i].x && x < terrainPoints[i + 1].x) {
        const t = (x - terrainPoints[i].x) / (terrainPoints[i + 1].x - terrainPoints[i].x);
        return Utils.lerp(terrainPoints[i].y, terrainPoints[i + 1].y, t);
      }
    }
    return terrainPoints[terrainPoints.length - 1].y;
  },
  checkTerrainCollision(heli, terrainPoints) {
    const heliLeft = heli.x;
    const heliRight = heli.x + heli.width;
    const heliBottom = heli.y + heli.height;
    for (let x = heliLeft; x <= heliRight; x += 4) {
      const terrainY = this.getTerrainHeightAt(x, terrainPoints);
      if (heliBottom >= terrainY - 5) {
        return true;
      }
    }
    return false;
  },
};

describe('Collision', () => {
  describe('aabb', () => {
    it('detects overlapping boxes', () => {
      expect(Collision.aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    });

    it('detects non-overlapping boxes (horizontal)', () => {
      expect(Collision.aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 15, y: 5, w: 10, h: 10 })).toBe(false);
    });

    it('detects non-overlapping boxes (vertical)', () => {
      expect(Collision.aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 15, w: 10, h: 10 })).toBe(false);
    });

    it('detects contained boxes', () => {
      expect(Collision.aabb({ x: 0, y: 0, w: 20, h: 20 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    });

    it('edge-touching is non-overlapping', () => {
      expect(Collision.aabb({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
    });
  });

  describe('circleRect', () => {
    it('detects circle inside rectangle', () => {
      expect(Collision.circleRect(5, 5, 2, 0, 0, 10, 10)).toBe(true);
    });

    it('detects circle outside rectangle', () => {
      expect(Collision.circleRect(20, 20, 2, 0, 0, 10, 10)).toBe(false);
    });

    it('detects circle touching rectangle edge', () => {
      expect(Collision.circleRect(10, 5, 2, 0, 0, 10, 10)).toBe(true);
    });
  });

  describe('pointInRect', () => {
    it('detects point inside rectangle', () => {
      expect(Collision.pointInRect(5, 5, 0, 0, 10, 10)).toBe(true);
    });

    it('detects point outside rectangle', () => {
      expect(Collision.pointInRect(15, 15, 0, 0, 10, 10)).toBe(false);
    });

    it('detects point on edge as inside', () => {
      expect(Collision.pointInRect(0, 0, 0, 0, 10, 10)).toBe(true);
      expect(Collision.pointInRect(10, 10, 0, 0, 10, 10)).toBe(true);
    });
  });

  describe('checkHelicopterCollisions', () => {
    it('returns empty array when no collisions', () => {
      const heli = { x: 0, y: 0, width: 10, height: 10 };
      const entities = [{ x: 100, y: 100, width: 10, height: 10 }];
      expect(Collision.checkHelicopterCollisions(heli, entities)).toHaveLength(0);
    });

    it('returns colliding entities', () => {
      const heli = { x: 0, y: 0, width: 20, height: 20 };
      const entities = [
        { x: 10, y: 10, width: 10, height: 10, type: 'hazard1' },
        { x: 100, y: 100, width: 10, height: 10, type: 'hazard2' },
      ];
      const hits = Collision.checkHelicopterCollisions(heli, entities);
      expect(hits).toHaveLength(1);
      expect(hits[0].type).toBe('hazard1');
    });

    it('handles empty entity list', () => {
      expect(Collision.checkHelicopterCollisions({ x: 0, y: 0, width: 10, height: 10 }, [])).toHaveLength(0);
    });
  });

  describe('getTerrainHeightAt', () => {
    it('returns correct height for flat segment', () => {
      expect(Collision.getTerrainHeightAt(5, [{ x: 0, y: 100 }, { x: 10, y: 100 }])).toBe(100);
    });

    it('interpolates height between segments', () => {
      expect(Collision.getTerrainHeightAt(5, [{ x: 0, y: 100 }, { x: 10, y: 120 }])).toBe(110);
    });

    it('returns last point height for out-of-range', () => {
      expect(Collision.getTerrainHeightAt(100, [{ x: 0, y: 100 }])).toBe(100);
    });

    it('returns 0 for empty array', () => {
      expect(Collision.getTerrainHeightAt(50, [])).toBe(0);
    });
  });

  describe('checkTerrainCollision', () => {
    it('detects helicopter near terrain', () => {
      const heli = { x: 5, y: 90, width: 20, height: 10 };
      const points = [{ x: 0, y: 100 }, { x: 30, y: 100 }];
      expect(Collision.checkTerrainCollision(heli, points)).toBe(true);
    });

    it('no collision when helicopter is above terrain', () => {
      const heli = { x: 5, y: 50, width: 20, height: 10 };
      const points = [{ x: 0, y: 100 }, { x: 30, y: 100 }];
      expect(Collision.checkTerrainCollision(heli, points)).toBe(false);
    });
  });
});
