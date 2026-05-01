// Bonus system - ladybugs and bonus goals

import { HomeSlots } from './homeslots.js';

export class BonusSystem {
  constructor() {
    this.bonusGoalInterval = 12; // seconds between bonus goal spawns
    this.bonusGoalTimer = 0;
    this.homeSlots = null; // set by game
  }

  /**
   * Set reference to home slots manager.
   */
  setHomeSlots(homeSlots) {
    this.homeSlots = homeSlots;
  }

  /**
   * Update bonus goal spawning timer.
   */
  update(delta) {
    if (!this.homeSlots) return;

    this.bonusGoalTimer += delta;
    if (this.bonusGoalTimer >= this.bonusGoalInterval) {
      this.bonusGoalTimer = 0;
      this.homeSlots.spawnBonus();
    }
  }

  /**
   * Check if a ladybug should be collected.
   * Ladybugs are attached to log obstacles.
   */
  checkLadybug(frogBounds, obstacles) {
    for (const obs of obstacles) {
      if (obs.ladybug && obs.ladybug.active) {
        // Ladybug is on the log, slightly offset
        const ladybugBounds = {
          x: obs.x + obs.width / 2 - 8,
          y: obs.y - 8,
          width: 16,
          height: 16,
        };

        if (
          frogBounds.x < ladybugBounds.x + ladybugBounds.width &&
          frogBounds.x + frogBounds.width > ladybugBounds.x &&
          frogBounds.y < ladybugBounds.y + ladybugBounds.height &&
          frogBounds.y + frogBounds.height > ladybugBounds.y
        ) {
          obs.ladybug.active = false;
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Reset bonus timers.
   */
  reset() {
    this.bonusGoalTimer = 0;
  }
}
