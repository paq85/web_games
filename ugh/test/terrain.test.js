// Terrain generation tests - inline implementation
const Utils = {
  clamp(val, min, max) { return Math.max(min, Math.min(max, val)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  randFloat(min, max) { return (min + max) / 2; },
  randInt(min, max) { return Math.floor((min + max) / 2); },
};

const CONSTANTS = {
  WIDTH: 800,
  HEIGHT: 450,
  WORLD: { SEGMENT_WIDTH: 4 },
};

const Terrain = {
  generate(levelConfig, width) {
    const points = [];
    const segWidth = CONSTANTS.WORLD.SEGMENT_WIDTH;
    const numSegments = Math.ceil(width / segWidth) + 2;
    let height = CONSTANTS.HEIGHT - 100;
    const baseHeight = CONSTANTS.HEIGHT - 120;

    switch (levelConfig.terrain) {
      case 'flat': height = this.generateFlat(numSegments, segWidth, baseHeight, points); break;
      case 'hilly': height = this.generateHilly(numSegments, segWidth, baseHeight, points); break;
      case 'mountain': height = this.generateMountain(numSegments, segWidth, baseHeight, points); break;
      default: height = this.generateFlat(numSegments, segWidth, baseHeight, points);
    }

    points.push({ x: points[points.length - 1].x + segWidth, y: CONSTANTS.HEIGHT });
    points.push({ x: 0, y: CONSTANTS.HEIGHT });
    return points;
  },

  generateFlat(numSegments, segWidth, baseHeight, points) {
    let height = baseHeight;
    for (let i = 0; i < numSegments; i++) {
      height += Utils.randFloat(-8, 8);
      height = Utils.clamp(height, baseHeight - 30, baseHeight + 40);
      points.push({ x: i * segWidth, y: height });
    }
    return height;
  },

  generateHilly(numSegments, segWidth, baseHeight, points) {
    let height = baseHeight;
    let trend = Utils.randFloat(-1, 1);
    for (let i = 0; i < numSegments; i++) {
      if (i % 20 === 0) trend = Utils.randFloat(-1.5, 1.5);
      height += trend + Utils.randFloat(-5, 5);
      height = Utils.clamp(height, CONSTANTS.HEIGHT - 250, CONSTANTS.HEIGHT - 40);
      points.push({ x: i * segWidth, y: height });
    }
    return height;
  },

  generateMountain(numSegments, segWidth, baseHeight, points) {
    let height = baseHeight;
    let trend = 0;
    for (let i = 0; i < numSegments; i++) {
      if (i % 15 === 0) trend = Utils.randFloat(-3, 3);
      height += trend + Utils.randFloat(-3, 3);
      height = Utils.clamp(height, CONSTANTS.HEIGHT - 300, CONSTANTS.HEIGHT - 30);
      points.push({ x: i * segWidth, y: height });
    }
    return height;
  },

  scroll(points, amount) {
    for (const p of points) p.x -= amount;
    while (points.length > 4 && points[0].x < -20) points.shift();
    const lastPoint = points[points.length - 2];
    if (lastPoint && lastPoint.x < CONSTANTS.WIDTH + 100) {
      let newY = lastPoint.y + Utils.randFloat(-10, 10);
      newY = Utils.clamp(newY, CONSTANTS.HEIGHT - 300, CONSTANTS.HEIGHT - 30);
      points.splice(points.length - 1, 0, { x: lastPoint.x + CONSTANTS.WORLD.SEGMENT_WIDTH, y: newY });
    }
  },

  getSkyColor(levelId) {
    const colors = [
      ['#87CEEB', '#E0F0FF'], ['#7EC8E3', '#D6EAF8'], ['#6BB3D9', '#C4DFE8'],
      ['#5DADE2', '#AED6F1'], ['#5499C7', '#85C1E9'], ['#E74C3C', '#FADBD8'],
      ['#2C3E50', '#5D6D7E'], ['#1ABC9C', '#A3E4D7'], ['#AED6F1', '#EAF2F8'],
      ['#2C3E50', '#E74C3C'],
    ];
    return colors[(levelId - 1) % colors.length];
  },

  getGroundColor(levelId) {
    const colors = ['#8B7355', '#7F8C8D', '#6B8E23', '#8B7355', '#696969',
      '#4A3728', '#4A4A4A', '#228B22', '#B0C4DE', '#3D3D3D'];
    return colors[(levelId - 1) % colors.length];
  },
};

describe('Terrain', () => {
  describe('generate', () => {
    it('generates terrain points for flat terrain', () => {
      const points = Terrain.generate({ terrain: 'flat' }, 800);
      expect(points.length).toBeGreaterThan(0);
      for (const p of points) expect(p.y).toBeLessThanOrEqual(CONSTANTS.HEIGHT);
    });

    it('generates terrain points for hilly terrain', () => {
      expect(Terrain.generate({ terrain: 'hilly' }, 800).length).toBeGreaterThan(0);
    });

    it('generates terrain points for mountain terrain', () => {
      expect(Terrain.generate({ terrain: 'mountain' }, 800).length).toBeGreaterThan(0);
    });

    it('closes the terrain shape', () => {
      const points = Terrain.generate({ terrain: 'flat' }, 800);
      expect(points[points.length - 1].y).toBe(CONSTANTS.HEIGHT);
    });
  });

  describe('scroll', () => {
    it('moves points left by scroll amount', () => {
      const points = [{ x: 10, y: 100 }, { x: 20, y: 100 }, { x: 850, y: 450 }, { x: 0, y: 450 }];
      Terrain.scroll(points, 5);
      expect(points[0].x).toBe(5);
      expect(points[1].x).toBe(15);
    });

    it('removes off-screen points', () => {
      const points = [{ x: -30, y: 100 }, { x: -10, y: 100 }, { x: 100, y: 100 }, { x: 850, y: 450 }, { x: 0, y: 450 }];
      Terrain.scroll(points, 5);
      for (const p of points) expect(p.x).toBeGreaterThanOrEqual(-20);
    });
  });

  describe('getSkyColor', () => {
    it('returns color array for level 1', () => {
      const colors = Terrain.getSkyColor(1);
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBe(2);
    });

    it('returns different colors for different levels', () => {
      expect(Terrain.getSkyColor(1)[0]).not.toBe(Terrain.getSkyColor(6)[0]);
    });

    it('wraps around for out-of-range levels', () => {
      expect(Terrain.getSkyColor(1)[0]).toBe(Terrain.getSkyColor(11)[0]);
    });
  });

  describe('getGroundColor', () => {
    it('returns a color string for any level', () => {
      const color = Terrain.getGroundColor(5);
      expect(typeof color).toBe('string');
      expect(color.startsWith('#')).toBe(true);
    });
  });
});
