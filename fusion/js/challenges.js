const CHALLENGE_DEFS = [
  {
    id: 'reach_1024',
    name: 'Reach 1024',
    description: 'Reach tile value 1024 in 50 moves',
    target: { tile: 1024 },
    moveLimit: 50,
    starThresholds: { 1: { tile: 1024 }, 2: { moves: 40 }, 3: { moves: 30 } },
    config: { specialTiles: true, mutations: false, zones: false },
    unlocks: 0
  },
  {
    id: 'score_5000',
    name: 'Score 5000',
    description: 'Score 5000 points in a single game',
    target: { score: 5000 },
    moveLimit: null,
    starThresholds: { 1: { score: 5000 }, 2: { score: 7500 }, 3: { score: 10000 } },
    config: { specialTiles: true, mutations: true, zones: false },
    unlocks: 'reach_1024'
  },
  {
    id: 'power_up_trio',
    name: 'Power-Up Trio',
    description: 'Use 3 different power-ups in one game',
    target: { powerUpsUsed: 3 },
    moveLimit: null,
    starThresholds: { 1: { powerUpsUsed: 3 }, 2: { powerUpsUsed: 4 }, 3: { powerUpsUsed: 6 } },
    config: { specialTiles: true, mutations: true, zones: true },
    unlocks: 'score_5000'
  },
  {
    id: 'bomb_free',
    name: 'Bomb Free',
    description: 'Reach score 3000 without triggering any bombs',
    target: { score: 3000, bombsTriggered: 0 },
    moveLimit: null,
    starThresholds: { 1: { score: 3000 }, 2: { score: 4000 }, 3: { score: 5000 } },
    config: { specialTiles: true, mutations: false, zones: false, bombRate: 0.04 },
    unlocks: 'score_5000'
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Achieve a 7-move combo streak',
    target: { streak: 7 },
    moveLimit: null,
    starThresholds: { 1: { streak: 7 }, 2: { streak: 8 }, 3: { streak: 10 } },
    config: { specialTiles: false, mutations: false, zones: false },
    unlocks: 'reach_1024'
  },
  {
    id: 'reach_2048_hard',
    name: 'Fusion Under Pressure',
    description: 'Reach 2048 with mutations and zones active',
    target: { tile: 2048 },
    moveLimit: null,
    starThresholds: { 1: { tile: 2048 }, 2: { score: 15000 }, 3: { score: 20000 } },
    config: { specialTiles: true, mutations: true, zones: true },
    unlocks: 'power_up_trio'
  },
  {
    id: 'endless_5000',
    name: 'Endless 5K',
    description: 'Score 5000 in Endless mode within 100 moves',
    target: { score: 5000 },
    moveLimit: 100,
    starThresholds: { 1: { score: 5000 }, 2: { moves: 80 }, 3: { moves: 60 } },
    config: { specialTiles: true, mutations: true, zones: true, endless: true },
    unlocks: 'reach_2048_hard'
  },
  {
    id: 'wildcard_wizard',
    name: 'Wildcard Wizard',
    description: 'Merge 20 wildcards in a single game',
    target: { wildcardsMerged: 20 },
    moveLimit: null,
    starThresholds: { 1: { wildcardsMerged: 20 }, 2: { wildcardsMerged: 30 }, 3: { wildcardsMerged: 50 } },
    config: { specialTiles: true, mutations: false, zones: false, wildcardRate: 0.06 },
    unlocks: 'streak_master'
  },
  {
    id: 'shield_wall',
    name: 'Shield Wall',
    description: 'Have 4 shields active on the grid at the same time',
    target: { shieldsActive: 4 },
    moveLimit: null,
    starThresholds: { 1: { shieldsActive: 4 }, 2: { shieldsActive: 5 }, 3: { shieldsActive: 6 } },
    config: { specialTiles: true, mutations: true, zones: false, shieldRate: 0.05 },
    unlocks: 'wildcard_wizard'
  },
  {
    id: 'multiplier_mania',
    name: 'Multiplier Mania',
    description: 'Trigger 10 multiplier boosts in one game',
    target: { multipliersTriggered: 10 },
    moveLimit: null,
    starThresholds: { 1: { multipliersTriggered: 10 }, 2: { multipliersTriggered: 15 }, 3: { multipliersTriggered: 25 } },
    config: { specialTiles: true, mutations: false, zones: true, multiplierRate: 0.04 },
    unlocks: 'shield_wall'
  }
];

class Challenges {
  constructor(persistence) {
    this.persistence = persistence;
  }

  getAvailableChallenges() {
    const saved = this.persistence.getChallenges();
    return CHALLENGE_DEFS.map(def => {
      const savedData = saved[def.id] || {};
      const isUnlocked = this._isChallengeUnlocked(def, saved);
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        moveLimit: def.moveLimit,
        target: def.target,
        config: def.config,
        unlocked: isUnlocked,
        completed: savedData.completed || false,
        stars: savedData.stars || 0,
        starThresholds: def.starThresholds
      };
    });
  }

  _isChallengeUnlocked(def, saved) {
    if (def.unlocks === 0) return true;
    if (typeof def.unlocks === 'string') {
      const prereq = saved[def.unlocks];
      return prereq && prereq.completed;
    }
    return true;
  }

  getChallenge(id) {
    const def = CHALLENGE_DEFS.find(c => c.id === id);
    if (!def) return null;
    const saved = this.persistence.getChallenge(id);
    return {
      ...def,
      completed: saved.completed || false,
      stars: saved.stars || 0,
      unlocked: this._isChallengeUnlocked(def, this.persistence.getChallenges())
    };
  }

  checkChallengeProgress(challengeId, gameState) {
    const def = CHALLENGE_DEFS.find(c => c.id === challengeId);
    if (!def) return { progress: 0, completed: false };

    const progress = {};
    let completed = false;

    if (def.target.tile) {
      progress.tile = gameState.highestTile || 0;
      if (progress.tile >= def.target.tile) completed = true;
    }
    if (def.target.score) {
      progress.score = gameState.score || 0;
      if (progress.score >= def.target.score) completed = true;
    }
    if (def.target.streak) {
      progress.streak = gameState.bestStreak || 0;
      if (progress.streak >= def.target.streak) completed = true;
    }
    if (def.target.powerUpsUsed) {
      const used = gameState.powerUpsUsedThisGame ?
        Object.values(gameState.powerUpsUsedThisGame).filter(v => v > 0).length : 0;
      progress.powerUpsUsed = used;
      if (used >= def.target.powerUpsUsed) completed = true;
    }
    if (def.target.bombsTriggered !== undefined) {
      progress.bombsTriggered = gameState.bombsTriggered || 0;
      if (def.target.score && gameState.score >= def.target.score &&
          progress.bombsTriggered <= def.target.bombsTriggered) {
        completed = true;
      }
    }
    if (def.target.wildcardsMerged) {
      progress.wildcardsMerged = gameState.wildcardsMerged || 0;
      if (progress.wildcardsMerged >= def.target.wildcardsMerged) completed = true;
    }
    if (def.target.shieldsActive) {
      progress.shieldsActive = gameState.maxShieldsActive || 0;
      if (progress.shieldsActive >= def.target.shieldsActive) completed = true;
    }
    if (def.target.multipliersTriggered) {
      progress.multipliersTriggered = gameState.multipliersTriggered || 0;
      if (progress.multipliersTriggered >= def.target.multipliersTriggered) completed = true;
    }

    if (def.moveLimit && gameState.moves >= def.moveLimit && !completed) {
      completed = false;
    }

    return { progress, completed };
  }

  awardStars(challengeId, gameState) {
    const def = CHALLENGE_DEFS.find(c => c.id === challengeId);
    if (!def) return 0;

    const progress = this.checkChallengeProgress(challengeId, gameState);
    if (!progress.completed) return 0;

    let stars = 1;

    for (let s = 3; s >= 1; s--) {
      const thresholds = def.starThresholds[s];
      if (!thresholds) continue;

      let meets = true;
      for (const [key, value] of Object.entries(thresholds)) {
        if (key === 'moves') {
          if ((gameState.moves || 0) > value) { meets = false; break; }
        } else {
          const actual = gameState[key] || 0;
          if (actual < value) { meets = false; break; }
        }
      }
      if (meets) {
        stars = s;
        break;
      }
    }

    const saved = this.persistence.getChallenge(challengeId);
    const newStars = Math.max(saved.stars || 0, stars);
    const wasCompleted = saved.completed || false;

    this.persistence.saveChallenge(challengeId, {
      completed: true,
      stars: newStars
    });

    if (!wasCompleted) {
      this.persistence.updateStats({ challengesCompleted: 1 });
    }

    return stars;
  }

  getDailyPuzzle() {
    const today = new Date().toISOString().slice(0, 10);
    const daily = this.persistence.getDailyPuzzle();

    if (daily.date !== today) {
      const seed = this._generateDailySeed(today);
      const target = this._getDailyTarget(seed);
      this.persistence.setDailyPuzzle({
        date: today,
        attempts: 3,
        seed,
        completed: false,
        target
      });
    }

    const updated = this.persistence.getDailyPuzzle();

    return {
      date: updated.date,
      seed: updated.seed,
      target: updated.target,
      attemptsLeft: updated.attempts,
      completed: updated.completed,
      streak: updated.streak || 0,
      leaderboard: updated.leaderboard || []
    };
  }

  attemptDailyPuzzle(score, won) {
    const daily = this.persistence.getDailyPuzzle();
    if (daily.attempts <= 0) return { success: false, reason: 'No attempts remaining' };

    this.persistence.useDailyAttempt();
    this.persistence.recordDailyScore(score);

    if (won) {
      this.persistence.setDailyPuzzle({
        completed: true,
        streak: (daily.streak || 0) + 1
      });
      this.persistence.updateStats({ dailyPuzzlesCompleted: 1 });
    }

    return { success: true, attemptsLeft: daily.attempts - 1 };
  }

  getDailyLeaderboard() {
    const daily = this.persistence.getDailyPuzzle();
    return (daily.leaderboard || []).slice(0, 10);
  }

  _generateDailySeed(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      const char = dateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  _getDailyTarget(seed) {
    const targets = [512, 1024, 2048];
    return targets[seed % targets.length];
  }

  getAllChallengeDefs() {
    return CHALLENGE_DEFS;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Challenges, CHALLENGE_DEFS };
}
