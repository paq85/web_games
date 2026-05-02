// === Fruits Unit Tests ===
import { describe, it, expect, beforeEach } from 'vitest';
import { Fruits } from '../../js/fruits.js';
import { FRUITS, FRUIT_DOT_THRESHOLDS, FRUIT_DURATION } from '../../js/constants.js';

describe('Fruits', () => {
  let fruits;
  const fruitConfig = FRUITS[0]; // Cherry

  beforeEach(() => {
    fruits = new Fruits();
  });

  it('starts inactive', () => {
    expect(fruits.isActive()).toBe(false);
  });

  it('spawns at first dot threshold', () => {
    fruits.update(0.1, FRUIT_DOT_THRESHOLDS[0], fruitConfig);
    expect(fruits.isActive()).toBe(true);
    expect(fruits.points).toBe(fruitConfig.points);
  });

  it('does not spawn before threshold', () => {
    fruits.update(0.1, FRUIT_DOT_THRESHOLDS[0] - 1, fruitConfig);
    expect(fruits.isActive()).toBe(false);
  });

  it('disappears after timeout', () => {
    fruits.spawn(fruitConfig);
    expect(fruits.isActive()).toBe(true);
    // Advance past duration
    fruits.update(FRUIT_DURATION + 1, FRUIT_DOT_THRESHOLDS[0], fruitConfig);
    expect(fruits.isActive()).toBe(false);
  });

  it('collecting returns points', () => {
    fruits.spawn(fruitConfig);
    const points = fruits.collect();
    expect(points).toBe(fruitConfig.points);
    expect(fruits.isActive()).toBe(false);
  });

  it('collecting inactive returns 0', () => {
    const points = fruits.collect();
    expect(points).toBe(0);
  });

  it('getDisplayData returns null when inactive', () => {
    expect(fruits.getDisplayData()).toBeNull();
  });

  it('getDisplayData returns data when active', () => {
    fruits.spawn(fruitConfig);
    const data = fruits.getDisplayData();
    expect(data).not.toBeNull();
    expect(data.active).toBe(true);
    expect(data.color).toBe(fruitConfig.color);
  });

  it('spawns at second threshold', () => {
    // Trigger first threshold
    fruits.update(0.1, FRUIT_DOT_THRESHOLDS[0], fruitConfig);
    expect(fruits.isActive()).toBe(true);
    // Let it expire
    fruits.update(FRUIT_DURATION + 1, FRUIT_DOT_THRESHOLDS[0], fruitConfig);
    expect(fruits.isActive()).toBe(false);
    // Trigger second threshold
    fruits.update(0.1, FRUIT_DOT_THRESHOLDS[1], fruitConfig);
    expect(fruits.isActive()).toBe(true);
  });

  it('reset clears state', () => {
    fruits.spawn(fruitConfig);
    fruits.reset();
    expect(fruits.isActive()).toBe(false);
    expect(fruits.fruitsSpawned).toBe(0);
  });
});
