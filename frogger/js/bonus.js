// Bonus system - ladybugs and bonus goals

import { HomeSlots } from './homeslots.js';

export class BonusSystem {
  constructor() {
    this.bonusGoalInterval = 12; // seconds between bonus goal spawns
    this.bonusGoalTimer = 0;
    this.homeSlots = null; // set by game
    this.ladybugSpawnInterval = 5; // seconds between ladybug spawn attempts
    this.ladybugSpawnTimer = 0;
    this.ladybugSpawnChance = 0.3; // low probability per attempt
  }

  /**
   * Set reference to home slots manager.
   */
  setHomeSlots(homeSlots) {
    this.homeSlots = homeSlots;
  }

  /**
   * Update bonus goal spawning timer and ladybug respawning.
   */
  update(delta, obstacles) {
    if (!this.homeSlots) return;

    this.bonusGoalTimer += delta;
    if (this.bonusGoalTimer >= this.bonusGoalInterval) {
      this.bonusGoalTimer = 0;
      this.homeSlots.spawnBonus();
    }

    // Periodically try to spawn ladybugs on logs
    this.ladybugSpawnTimer += delta;
    if (this.ladybugSpawnTimer >= this.ladybugSpawnInterval) {
      this.ladybugSpawnTimer = 0;
      this.trySpawnLadybug(obstacles);
    }
  }

  /**
   * Try to spawn a ladybug on a random log obstacle.
   */
  trySpawnLadybug(obstacles) {
    if (!obstacles) return;

    // Find logs without active ladybugs
    const eligibleLogs = obstacles.filter(
      obs => obs.type === 'log' && (!obs.ladybug || !obs.ladybug.active)
    );

    if (eligibleLogs.length === 0) return;

    if (Math.random() < this.ladybugSpawnChance) {
      const chosen = eligibleLogs[Math.floor(Math.random() * eligibleLogs.length)];
      chosen.ladybug = {
        active: true,
        bobPhase: Math.random() * Math.PI * 2,
      };
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
