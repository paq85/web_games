import { describe, it, expect } from 'vitest';
import { getLevelMatrix, getBaseBallSpeed, getPaddleSize } from '../../js/levels.js';

describe('getLevelMatrix', () => {
  it('returns pre-designed level 1', () => {
    const matrix = getLevelMatrix(1);
    expect(matrix.length).toBe(5);
    expect(matrix[0].length).toBe(15);
  });

  it('returns pre-designed level 10', () => {
    const matrix = getLevelMatrix(10);
    expect(matrix.length).toBe(8);
    expect(matrix[0].length).toBe(15);
  });

  it('returns procedural level for level 11', () => {
    const matrix = getLevelMatrix(11);
    expect(Array.isArray(matrix)).toBe(true);
    expect(matrix.length).toBeGreaterThan(0);
  });

  it('level 1 has only standard bricks', () => {
    const matrix = getLevelMatrix(1);
    for (const row of matrix) {
      for (const val of row) {
        expect(val).toBe(1);
      }
    }
  });

  it('level 6 has unbreakable bricks', () => {
    const matrix = getLevelMatrix(6);
    let hasUnbreakable = false;
    for (const row of matrix) {
      for (const val of row) {
        if (val === 3) hasUnbreakable = true;
      }
    }
    expect(hasUnbreakable).toBe(true);
  });
});

describe('getBaseBallSpeed', () => {
  it('normal speed starts at 8', () => {
    expect(getBaseBallSpeed(1, 'normal')).toBe(8);
  });

  it('fast speed starts at 10', () => {
    expect(getBaseBallSpeed(1, 'fast')).toBe(10);
  });

  it('speed increases with level', () => {
    const speed1 = getBaseBallSpeed(1, 'normal');
    const speed5 = getBaseBallSpeed(5, 'normal');
    expect(speed5).toBeGreaterThan(speed1);
  });
});

describe('getPaddleSize', () => {
  it('normal size is 100', () => {
    expect(getPaddleSize(1, 'normal')).toBe(100);
  });

  it('small size is 70', () => {
    expect(getPaddleSize(1, 'small')).toBe(70);
  });

  it('large size is 130', () => {
    expect(getPaddleSize(1, 'large')).toBe(130);
  });

  it('paddle shrinks at higher levels', () => {
    const size1 = getPaddleSize(1, 'normal');
    const size10 = getPaddleSize(10, 'normal');
    expect(size10).toBeLessThanOrEqual(size1);
  });
});
