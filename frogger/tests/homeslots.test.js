import { describe, it, expect } from 'vitest';
import { HomeSlots } from '../js/homeslots.js';

describe('HomeSlots', () => {
  let slots;

  beforeEach(() => {
    slots = new HomeSlots();
  });

  it('identifies home slot columns correctly', () => {
    expect(slots.getSlotForColumn(1)).toBe(0);
    expect(slots.getSlotForColumn(2)).toBe(0);
    expect(slots.getSlotForColumn(4)).toBe(1);
    expect(slots.getSlotForColumn(5)).toBe(1);
    expect(slots.getSlotForColumn(7)).toBe(2);
    expect(slots.getSlotForColumn(8)).toBe(2);
    expect(slots.getSlotForColumn(10)).toBe(3);
    expect(slots.getSlotForColumn(11)).toBe(3);
    expect(slots.getSlotForColumn(13)).toBe(4);
    expect(slots.getSlotForColumn(14)).toBe(4);
  });

  it('returns -1 for columns not in any slot', () => {
    expect(slots.getSlotForColumn(0)).toBe(-1);
    expect(slots.getSlotForColumn(3)).toBe(-1);
    expect(slots.getSlotForColumn(6)).toBe(-1);
    expect(slots.getSlotForColumn(9)).toBe(-1);
    expect(slots.getSlotForColumn(12)).toBe(-1);
  });

  it('fills an empty slot', () => {
    const result = slots.handleArrival(1);
    expect(result).toBe('filled');
    expect(slots.slots[0].filled).toBe(true);
  });

  it('returns occupied for already filled slot', () => {
    slots.handleArrival(1);
    const result = slots.handleArrival(1);
    expect(result).toBe('occupied');
  });

  it('returns outside for non-slot column', () => {
    const result = slots.handleArrival(3);
    expect(result).toBe('outside');
  });

  it('detects when all slots are filled', () => {
    expect(slots.allFilled()).toBe(false);

    slots.handleArrival(1);  // slot 0
    slots.handleArrival(4);  // slot 1
    slots.handleArrival(7);  // slot 2
    slots.handleArrival(10); // slot 3
    slots.handleArrival(13); // slot 4

    expect(slots.allFilled()).toBe(true);
  });

  it('resets all slots', () => {
    slots.handleArrival(1);
    slots.handleArrival(4);
    slots.reset();

    expect(slots.allFilled()).toBe(false);
    for (const slot of slots.slots) {
      expect(slot.filled).toBe(false);
      expect(slot.hasBonus).toBe(false);
    }
  });

  it('spawns bonus in an eligible slot', () => {
    const result = slots.spawnBonus();
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(4);
    expect(slots.slots[result].hasBonus).toBe(true);
  });

  it('returns -1 when no eligible slots for bonus', () => {
    // Fill all slots
    slots.handleArrival(1);
    slots.handleArrival(4);
    slots.handleArrival(7);
    slots.handleArrival(10);
    slots.handleArrival(13);

    const result = slots.spawnBonus();
    expect(result).toBe(-1);
  });

  it('bonus expires after timer', () => {
    slots.spawnBonus();
    expect(slots.slots.some(s => s.hasBonus)).toBe(true);

    // Fast-forward timer
    slots.updateTimers(10);

    expect(slots.slots.every(s => !s.hasBonus)).toBe(true);
  });

  it('filled slots do not accept bonus', () => {
    slots.handleArrival(1); // fill slot 0
    slots.handleArrival(4); // fill slot 1
    slots.handleArrival(7); // fill slot 2
    slots.handleArrival(10); // fill slot 3

    const result = slots.spawnBonus();
    expect(result).toBe(4); // only slot 4 is eligible
  });
});
