const LEVEL_THRESHOLDS = [0, 1000, 3000, 6000, 10000];

const ACHIEVEMENT_DEFS = {
  first_fusion: {
    id: 'first_fusion',
    name: 'First Fusion',
    description: 'Reach tile value 4',
    target: 4,
    type: 'highest_tile'
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    description: 'Reach tile value 128',
    target: 128,
    type: 'highest_tile'
  },
  ignition: {
    id: 'ignition',
    name: 'Ignition',
    description: 'Reach tile value 512',
    target: 512,
    type: 'highest_tile'
  },
  plasma: {
    id: 'plasma',
    name: 'Plasma',
    description: 'Reach tile value 1024',
    target: 1024,
    type: 'highest_tile'
  },
  fusion: {
    id: 'fusion',
    name: 'Fusion!',
    description: 'Reach tile value 2048',
    target: 2048,
    type: 'highest_tile'
  },
  singularity: {
    id: 'singularity',
    name: 'Singularity',
    description: 'Reach tile value 4096',
    target: 4096,
    type: 'highest_tile'
  },
  starforge: {
    id: 'starforge',
    name: 'Starforge',
    description: 'Reach tile value 8192',
    target: 8192,
    type: 'highest_tile'
  },
  combo_starter: {
    id: 'combo_starter',
    name: 'Combo Starter',
    description: 'Achieve a 3-move streak',
    target: 3,
    type: 'best_streak'
  },
  chain_reaction: {
    id: 'chain_reaction',
    name: 'Chain Reaction',
    description: 'Achieve a 5-move streak',
    target: 5,
    type: 'best_streak'
  },
  unstoppable: {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Achieve a 10-move streak',
    target: 10,
    type: 'best_streak'
  },
  first_blood: {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Score 1,000 points in a single game',
    target: 1000,
    type: 'single_game_score'
  },
  power_player: {
    id: 'power_player',
    name: 'Power Player',
    description: 'Use all 6 power-up types in one game',
    target: 6,
    type: 'power_ups_one_game'
  },
  bomb_disposal: {
    id: 'bomb_disposal',
    name: 'Bomb Disposal',
    description: 'Destroy 100 Bombs total',
    target: 100,
    type: 'cumulative'
  },
  stabilizer: {
    id: 'stabilizer',
    name: 'Stabilizer',
    description: 'Survive 50 grid mutations',
    target: 50,
    type: 'cumulative'
  },
  daily_champion: {
    id: 'daily_champion',
    name: 'Daily Champion',
    description: 'Complete 7 daily puzzles in a row',
    target: 7,
    type: 'daily_streak'
  },
  endless_runner: {
    id: 'endless_runner',
    name: 'Endless Runner',
    description: 'Score 10,000 in Endless mode',
    target: 10000,
    type: 'endless_score'
  },
  challenge_master: {
    id: 'challenge_master',
    name: 'Challenge Master',
    description: 'Complete all available challenges',
    target: 0,
    type: 'challenges_all'
  },
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Reach 3 stars on all challenges',
    target: 0,
    type: 'challenges_perfect'
  }
};

class Progression {
  constructor(persistence) {
    this.persistence = persistence;
  }

  getLevelForScore(score) {
    if (score <= 0) return 1;

    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (score >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  getLevelThreshold(level) {
    if (level <= 0) return 0;
    if (level <= LEVEL_THRESHOLDS.length) {
      return LEVEL_THRESHOLDS[level - 1];
    }

    let threshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    for (let i = LEVEL_THRESHOLDS.length; i < level; i++) {
      threshold += i * 2000;
    }
    return threshold;
  }

  getNextLevelThreshold(level) {
    return this.getLevelThreshold(level + 1);
  }

  getLevelProgress(level, cumulativeScore) {
    const current = this.getLevelThreshold(level);
    const next = this.getNextLevelThreshold(level);
    if (next <= current) return 1;
    return Math.min(1, (cumulativeScore - current) / (next - current));
  }

  getMutationChance(level) {
    const baseChance = Math.min(level * 3, 30);

    const diff = this.persistence.getSetting('mutationDifficulty');
    if (diff === 'easy') return Math.max(0, baseChance - 10);
    if (diff === 'hard') return Math.min(50, baseChance + 10);
    return baseChance;
  }

  getSpecialTileRates(level) {
    const base = {
      wildcard: 0.03,
      bomb: 0.02,
      shield: 0.02,
      multiplier: 0.015,
      fusionCore: 0.005
    };

    const perLevel = 0.002;
    return {
      wildcard: Math.min(base.wildcard + level * perLevel, 0.10),
      bomb: Math.min(base.bomb + level * perLevel, 0.08),
      shield: Math.min(base.shield + level * perLevel, 0.06),
      multiplier: Math.min(base.multiplier + level * perLevel * 0.5, 0.05),
      fusionCore: Math.min(base.fusionCore + level * perLevel * 0.2, 0.02)
    };
  }

  getZoneVariety(level) {
    const zones = [];
    if (level >= 2) zones.push('gravity');
    if (level >= 3) zones.push('frozen');
    if (level >= 4) zones.push('boost');
    if (level >= 5) zones.push('swap');
    return zones;
  }

  getZoneDuration(level) {
    return Math.max(3, 10 - Math.floor(level / 2));
  }

  checkAchievements(gameState) {
    const newlyUnlocked = [];
    const stats = this.persistence.getStats();

    const checks = [
      { id: 'first_fusion', value: stats.highestTile || 0 },
      { id: 'spark', value: stats.highestTile || 0 },
      { id: 'ignition', value: stats.highestTile || 0 },
      { id: 'plasma', value: stats.highestTile || 0 },
      { id: 'fusion', value: stats.highestTile || 0 },
      { id: 'singularity', value: stats.highestTile || 0 },
      { id: 'starforge', value: stats.highestTile || 0 },
      { id: 'combo_starter', value: stats.bestStreak || 0 },
      { id: 'chain_reaction', value: stats.bestStreak || 0 },
      { id: 'unstoppable', value: stats.bestStreak || 0 },
      { id: 'first_blood', value: gameState ? (gameState.singleGameScore || 0) : 0 },
      { id: 'bomb_disposal', value: stats.bombsDestroyed || 0 },
      { id: 'stabilizer', value: stats.mutationsSurvived || 0 },
      { id: 'endless_runner', value: this.persistence._data ? this.persistence._data.scores.bestEndless : 0 },
    ];

    if (gameState && gameState.powerUpsUsedThisGame) {
      const typesUsed = Object.values(gameState.powerUpsUsedThisGame).filter(v => v > 0).length;
      checks.push({ id: 'power_player', value: typesUsed });
    }

    const daily = this.persistence.getDailyPuzzle();
    checks.push({ id: 'daily_champion', value: daily.streak || 0 });

    const challenges = this.persistence.getChallenges();
    const allChallenges = Object.keys(challenges);
    if (allChallenges.length > 0) {
      const completed = allChallenges.filter(id => challenges[id] && challenges[id].completed).length;
      checks.push({ id: 'challenge_master', value: completed, target: allChallenges.length });

      const perfect = allChallenges.filter(id => challenges[id] && challenges[id].stars >= 3).length;
      checks.push({ id: 'perfectionist', value: perfect, target: allChallenges.length });
    }

    checks.forEach(check => {
      const def = ACHIEVEMENT_DEFS[check.id];
      if (!def) return;

      const target = check.target !== undefined ? check.target : def.target;
      const unlocked = this.persistence.unlockAchievement(check.id, check.value, target);
      if (unlocked) {
        newlyUnlocked.push({ ...def, progress: check.value, target });
      } else {
        this.persistence.updateAchievementProgress(check.id, check.value, target);
      }
    });

    return newlyUnlocked;
  }

  getUnlockedAchievements() {
    const stored = this.persistence.getAchievements();
    return Object.entries(ACHIEVEMENT_DEFS).map(([id, def]) => {
      const storedAch = stored[id] || { unlocked: false, progress: 0, target: def.target };
      return {
        id,
        name: def.name,
        description: def.description,
        unlocked: storedAch.unlocked,
        progress: storedAch.progress,
        target: def.target,
        type: def.type
      };
    });
  }

  getAchievementById(id) {
    const def = ACHIEVEMENT_DEFS[id];
    if (!def) return null;
    const stored = this.persistence.getAchievements()[id] || { unlocked: false, progress: 0 };
    return {
      id,
      name: def.name,
      description: def.description,
      unlocked: stored.unlocked,
      progress: stored.progress,
      target: def.target,
      type: def.type
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Progression, ACHIEVEMENT_DEFS, LEVEL_THRESHOLDS };
}
