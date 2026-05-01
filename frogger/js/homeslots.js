// Home slots management

export class HomeSlots {
  constructor() {
    // 5 home slots, each 2 tiles wide, with gaps
    // Positions: cols 1-2, 4-5, 7-8, 10-11, 13-14
    this.slots = [
      { index: 0, cols: [1, 2], filled: false, hasBonus: false },
      { index: 1, cols: [4, 5], filled: false, hasBonus: false },
      { index: 2, cols: [7, 8], filled: false, hasBonus: false },
      { index: 3, cols: [10, 11], filled: false, hasBonus: false },
      { index: 4, cols: [13, 14], filled: false, hasBonus: false },
    ];
    this.bonusTimers = new Map(); // slotIndex -> remaining time
  }

  /**
   * Check if a grid column is in a home slot.
   * Returns the slot index or -1.
   */
  getSlotForColumn(col) {
    for (const slot of this.slots) {
      if (slot.cols.includes(col)) {
        return slot.index;
      }
    }
    return -1;
  }

  /**
   * Check if the frog's column is in a gap between home slots.
   */
  isGapColumn(col) {
    return col === 0 || col === 3 || col === 6 || col === 9 || col === 12 || col === 14 + 1;
  }

  /**
   * Handle frog arriving at row 1 (home row).
   * Returns result: 'filled', 'bonus', 'occupied', 'gap', or 'outside'.
   */
  handleArrival(col) {
    const slotIndex = this.getSlotForColumn(col);

    if (slotIndex < 0) {
      return 'outside'; // not in any home slot area
    }

    const slot = this.slots[slotIndex];

    if (slot.filled) {
      return 'occupied'; // slot already has a frog
    }

    const result = slot.hasBonus ? 'bonus' : 'filled';
    slot.filled = true;
    slot.hasBonus = false;
    this.bonusTimers.delete(slotIndex);
    return result;
  }

  /**
   * Check if all slots are filled (level complete).
   */
  allFilled() {
    return this.slots.every(s => s.filled);
  }

  /**
   * Reset all slots for next level.
   */
  reset() {
    for (const slot of this.slots) {
      slot.filled = false;
      slot.hasBonus = false;
    }
    this.bonusTimers.clear();
  }

  /**
   * Spawn a bonus in a random empty, non-bonus slot.
   * Returns the slot index or -1 if no eligible slot.
   */
  spawnBonus() {
    const eligible = this.slots
      .filter(s => !s.filled && !s.hasBonus)
      .map(s => s.index);

    if (eligible.length === 0) return -1;

    const chosen = eligible[Math.floor(Math.random() * eligible.length)];
    this.slots[chosen].hasBonus = true;
    this.bonusTimers.set(chosen, 8); // bonus lasts 8 seconds
    return chosen;
  }

  /**
   * Update bonus timers. Call each frame.
   */
  updateTimers(delta) {
    for (const [slotIndex, timeLeft] of this.bonusTimers) {
      this.bonusTimers.set(slotIndex, timeLeft - delta);
      if (timeLeft - delta <= 0) {
        this.slots[slotIndex].hasBonus = false;
        this.bonusTimers.delete(slotIndex);
      }
    }
  }
}
