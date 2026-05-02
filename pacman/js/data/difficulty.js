const PRESETS = {
  easy: {
    pacmanSpeed: 6.6,
    ghostSpeed: 4.85,
    frightenedSpeed: 3.7,
    frightenedDuration: 8.5,
    minFrightenedDuration: 4.75,
    fruitDuration: 11,
    ghostReleaseDelays: [0, 4, 8, 12],
    schedule: [
      { mode: 'scatter', duration: 7 },
      { mode: 'chase', duration: 20 },
      { mode: 'scatter', duration: 7 },
      { mode: 'chase', duration: 20 },
      { mode: 'scatter', duration: 5 },
      { mode: 'chase', duration: Infinity }
    ]
  },
  medium: {
    pacmanSpeed: 6.95,
    ghostSpeed: 5.25,
    frightenedSpeed: 4.05,
    frightenedDuration: 7,
    minFrightenedDuration: 3.9,
    fruitDuration: 10,
    ghostReleaseDelays: [0, 3.4, 6.8, 10],
    schedule: [
      { mode: 'scatter', duration: 7 },
      { mode: 'chase', duration: 20 },
      { mode: 'scatter', duration: 7 },
      { mode: 'chase', duration: 20 },
      { mode: 'scatter', duration: 5 },
      { mode: 'chase', duration: Infinity }
    ]
  },
  hard: {
    pacmanSpeed: 7.2,
    ghostSpeed: 5.75,
    frightenedSpeed: 4.45,
    frightenedDuration: 5.8,
    minFrightenedDuration: 2.8,
    fruitDuration: 8.5,
    ghostReleaseDelays: [0, 2.4, 5.3, 8],
    schedule: [
      { mode: 'scatter', duration: 5 },
      { mode: 'chase', duration: 24 },
      { mode: 'scatter', duration: 4 },
      { mode: 'chase', duration: 24 },
      { mode: 'scatter', duration: 3 },
      { mode: 'chase', duration: Infinity }
    ]
  }
};

export function getDifficultyConfig(name = 'medium') {
  return PRESETS[name] ?? PRESETS.medium;
}

export function getLevelConfig({ difficulty = 'medium', level = 1, runMode = 'normal', practiceSpeed = 0.7 } = {}) {
  const preset = getDifficultyConfig(difficulty);
  const levelBoost = Math.min(level - 1, 12);
  const isPractice = runMode === 'practice' || runMode === 'tutorial';
  const pacmanMultiplier = isPractice ? Math.max(0.45, practiceSpeed) : 1;
  const ghostMultiplier = isPractice ? Math.max(0.35, practiceSpeed * 0.85) : 1;
  const frightenedDuration = Math.max(
    preset.minFrightenedDuration,
    preset.frightenedDuration - levelBoost * (difficulty === 'hard' ? 0.35 : 0.25)
  );

  return {
    pacmanSpeed: preset.pacmanSpeed * pacmanMultiplier,
    ghostSpeed: (preset.ghostSpeed + levelBoost * 0.12) * ghostMultiplier,
    frightenedSpeed: preset.frightenedSpeed * ghostMultiplier,
    frightenedDuration,
    fruitDuration: Math.max(5, preset.fruitDuration - levelBoost * 0.2),
    ghostReleaseDelays: preset.ghostReleaseDelays.map((delay, index) => {
      if (index === 0) {
        return delay;
      }
      return Math.max(0.8, delay - levelBoost * 0.15);
    }),
    schedule: preset.schedule.map((entry) => ({
      ...entry,
      duration: entry.duration === Infinity ? Infinity : Math.max(2, entry.duration - levelBoost * 0.12)
    }))
  };
}

export function getFruitSpawnThresholds(totalPellets) {
  return [Math.floor(totalPellets * 0.65), Math.floor(totalPellets * 0.3)];
}
