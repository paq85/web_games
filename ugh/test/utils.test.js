// Utility tests - inline implementation
const Utils = {
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  randFloat(min, max) {
    return Math.random() * (max - min) + min;
  },
  rectsOverlap(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  },
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },
  generateLevelCode(level, score) {
    const data = `${level}-${score}-${Date.now() % 10000}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const code = Math.abs(hash).toString(36).toUpperCase();
    return `UGH${code.padStart(8, '0')}`;
  },
  decodeLevelCode(code) {
    if (!code || typeof code !== 'string') return null;
    const trimmed = code.trim().toUpperCase();
    if (!trimmed.startsWith('UGH')) return null;
    if (trimmed.length < 6 || trimmed.length > 12) return null;
    const hash = parseInt(trimmed.substring(3), 36);
    if (isNaN(hash)) return null;
    const level = (hash % 10) + 1;
    return { level };
  },
};

describe('Utils', () => {
  describe('clamp', () => {
    it('clamps value to min when below range', () => {
      expect(Utils.clamp(-5, 0, 10)).toBe(0);
    });

    it('clamps value to max when above range', () => {
      expect(Utils.clamp(15, 0, 10)).toBe(10);
    });

    it('returns value when within range', () => {
      expect(Utils.clamp(5, 0, 10)).toBe(5);
    });

    it('handles equal min and max', () => {
      expect(Utils.clamp(99, 5, 5)).toBe(5);
    });
  });

  describe('lerp', () => {
    it('interpolates between two values', () => {
      expect(Utils.lerp(0, 10, 0.5)).toBe(5);
    });

    it('returns start when t is 0', () => {
      expect(Utils.lerp(0, 10, 0)).toBe(0);
    });

    it('returns end when t is 1', () => {
      expect(Utils.lerp(0, 10, 1)).toBe(10);
    });
  });

  describe('randInt', () => {
    it('returns integer within range', () => {
      for (let i = 0; i < 100; i++) {
        const val = Utils.randInt(1, 10);
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(10);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('handles single value range', () => {
      expect(Utils.randInt(5, 5)).toBe(5);
    });
  });

  describe('randFloat', () => {
    it('returns float within range', () => {
      for (let i = 0; i < 100; i++) {
        const val = Utils.randFloat(0, 10);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(10);
      }
    });
  });

  describe('rectsOverlap', () => {
    it('detects overlapping rectangles', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 };
      const b = { x: 5, y: 5, width: 10, height: 10 };
      expect(Utils.rectsOverlap(a, b)).toBe(true);
    });

    it('detects non-overlapping rectangles', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 };
      const b = { x: 15, y: 15, width: 10, height: 10 };
      expect(Utils.rectsOverlap(a, b)).toBe(false);
    });

    it('handles touching edges as non-overlapping', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 };
      const b = { x: 10, y: 0, width: 10, height: 10 };
      expect(Utils.rectsOverlap(a, b)).toBe(false);
    });
  });

  describe('distance', () => {
    it('calculates correct distance', () => {
      expect(Utils.distance(0, 0, 3, 4)).toBe(5);
    });

    it('returns 0 for same point', () => {
      expect(Utils.distance(5, 5, 5, 5)).toBe(0);
    });
  });

  describe('generateLevelCode', () => {
    it('generates a code starting with UGH', () => {
      const code = Utils.generateLevelCode(1, 1000);
      expect(code.startsWith('UGH')).toBe(true);
    });

    it('generates consistent format', () => {
      const code = Utils.generateLevelCode(5, 5000);
      expect(code.length).toBeGreaterThanOrEqual(6);
      expect(code.length).toBeLessThanOrEqual(14);
    });
  });

  describe('decodeLevelCode', () => {
    it('rejects null/undefined', () => {
      expect(Utils.decodeLevelCode(null)).toBeNull();
      expect(Utils.decodeLevelCode(undefined)).toBeNull();
    });

    it('rejects non-string', () => {
      expect(Utils.decodeLevelCode(123)).toBeNull();
    });

    it('rejects codes without UGH prefix', () => {
      expect(Utils.decodeLevelCode('ABC12345')).toBeNull();
    });

    it('rejects too short codes', () => {
      expect(Utils.decodeLevelCode('UGH')).toBeNull();
    });

    it('accepts valid format codes', () => {
      const result = Utils.decodeLevelCode('UGH12345678');
      expect(result).not.toBeNull();
      expect(result.level).toBeGreaterThanOrEqual(1);
      expect(result.level).toBeLessThanOrEqual(10);
    });

    it('handles lowercase codes', () => {
      const result = Utils.decodeLevelCode('ugh12345678');
      expect(result).not.toBeNull();
    });
  });
});
