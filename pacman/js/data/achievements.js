export const ACHIEVEMENTS = [
  {
    id: 'first-chomp',
    title: 'First Chomp',
    description: 'Eat your first pellet.'
  },
  {
    id: 'power-player',
    title: 'Power Player',
    description: 'Eat 10 power pellets across all runs.'
  },
  {
    id: 'ghost-gobbler',
    title: 'Ghost Gobbler',
    description: 'Eat 10 ghosts across all runs.'
  },
  {
    id: 'chain-master',
    title: 'Chain Master',
    description: 'Reach the 1600-point ghost chain reward.'
  },
  {
    id: 'fruit-feast',
    title: 'Fruit Feast',
    description: 'Collect 8 fruits across all runs.'
  },
  {
    id: 'maze-runner',
    title: 'Maze Runner',
    description: 'Reach level 5 in a single run.'
  },
  {
    id: 'streak-starter',
    title: 'Streak Starter',
    description: 'Complete 3 levels in a row without losing all lives.'
  }
];

export function getAchievementById(id) {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id) ?? null;
}

export function evaluateAchievements(stats) {
  const unlocked = new Set(stats.achievementsUnlocked || []);
  const newlyUnlocked = [];

  const checks = [
    ['first-chomp', stats.totalPelletsEaten >= 1],
    ['power-player', stats.totalPowerPelletsEaten >= 10],
    ['ghost-gobbler', stats.totalGhostsEaten >= 10],
    ['chain-master', stats.bestGhostChain >= 1600],
    ['fruit-feast', stats.totalFruitsCollected >= 8],
    ['maze-runner', stats.bestLevel >= 5],
    ['streak-starter', stats.bestStreak >= 3]
  ];

  for (const [achievementId, shouldUnlock] of checks) {
    if (shouldUnlock && !unlocked.has(achievementId)) {
      unlocked.add(achievementId);
      newlyUnlocked.push(achievementId);
    }
  }

  return {
    unlocked: [...unlocked],
    newlyUnlocked
  };
}
