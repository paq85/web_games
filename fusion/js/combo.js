const STREAK_MULTIPLIERS = [1, 1.5, 2, 3, 5];

class ComboSystem {
  constructor() {
    this.streak = 0;
    this.currentComboPoints = 0;
    this.totalComboPoints = 0;
    this.chainSteps = 0;
    this.callbacks = {};
  }

  setCallback(event, callback) {
    this.callbacks[event] = callback;
  }

  triggerCallback(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  recordMerge(baseValue) {
    this.streak += 1;
    this.chainSteps = 0;
    const multiplier = this.getMultiplier();
    const points = Math.round(baseValue * multiplier);
    this.currentComboPoints += points;
    this.totalComboPoints += points;

    this.triggerCallback('merge', {
      streak: this.streak,
      multiplier,
      baseValue,
      points
    });

    if (this.streak >= 5) {
      this.triggerCallback('mega_combo', { streak: this.streak });
    }

    return points;
  }

  recordNoMerge() {
    if (this.streak > 0) {
      this.triggerCallback('streak_reset', { previousStreak: this.streak, comboPoints: this.currentComboPoints });
    }
    this.streak = 0;
    this.currentComboPoints = 0;
    this.chainSteps = 0;
  }

  getMultiplier() {
    const idx = Math.min(this.streak, STREAK_MULTIPLIERS.length) - 1;
    return STREAK_MULTIPLIERS[Math.max(0, idx)];
  }

  getStreak() {
    return this.streak;
  }

  processChainReactions(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    let chainActive = true;
    let totalChainPoints = 0;
    const chainLog = [];

    while (chainActive) {
      chainActive = false;
      const merged = new Set();

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!grid[r][c] || merged.has(`${r},${c}`)) continue;

          const current = grid[r][c];
          const neighbors = [
            { r: r - 1, c },
            { r: r + 1, c },
            { r, c: c - 1 },
            { r, c: c + 1 }
          ];

          for (const n of neighbors) {
            if (n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols && !merged.has(`${n.r},${n.c}`)) {
              const neighbor = grid[n.r][n.c];
              if (neighbor && neighbor.value === current.value && !merged.has(`${n.r},${n.c}`)) {
                const newValue = current.value * 2;
                grid[r][c] = {
                  value: newValue,
                  id: Math.random().toString(36).substring(2, 9)
                };
                grid[n.r][n.c] = null;
                merged.add(`${r},${c}`);
                merged.add(`${n.r},${n.c}`);

                this.chainSteps += 1;
                this.streak += 1;
                const multiplier = this.getMultiplier();
                const chainPoints = Math.round(newValue * multiplier * (this.chainSteps + 1));
                totalChainPoints += chainPoints;
                this.currentComboPoints += chainPoints;
                this.totalComboPoints += chainPoints;

                chainLog.push({
                  row: r,
                  col: c,
                  value: newValue,
                  chainStep: this.chainSteps,
                  points: chainPoints
                });

                this.triggerCallback('chain_reaction', {
                  row: r,
                  col: c,
                  value: newValue,
                  chainStep: this.chainSteps,
                  points: chainPoints
                });

                chainActive = true;
                break;
              }
            }
          }
          if (chainActive) break;
        }
        if (chainActive) break;
      }
    }

    return { totalChainPoints, chainLog };
  }

  reset() {
    this.streak = 0;
    this.currentComboPoints = 0;
    this.totalComboPoints = 0;
    this.chainSteps = 0;
  }

  getCurrentComboPoints() {
    return this.currentComboPoints;
  }

  getTotalComboPoints() {
    return this.totalComboPoints;
  }

  getChainSteps() {
    return this.chainSteps;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ComboSystem, STREAK_MULTIPLIERS };
}
