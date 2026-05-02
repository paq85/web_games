// === Scores & Statistics ===

const STORAGE_KEY_SCORES = 'pacman_highscores';
const STORAGE_KEY_STATS = 'pacman_stats';

export class Scores {
  constructor() {
    this.highScores = [];
    this.stats = {
      totalGamesPlayed: 0,
      totalScore: 0,
      highestLevel: 0,
      totalGhostsEaten: 0,
      totalFruitsCollected: 0,
      totalDotsEaten: 0,
    };
    this.load();
  }

  load() {
    try {
      const scores = localStorage.getItem(STORAGE_KEY_SCORES);
      if (scores) this.highScores = JSON.parse(scores);
      const stats = localStorage.getItem(STORAGE_KEY_STATS);
      if (stats) this.stats = { ...this.stats, ...JSON.parse(stats) };
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(this.highScores));
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(this.stats));
    } catch (e) {
      // Ignore
    }
  }

  addScore(score, level) {
    this.highScores.push({ score, level, date: Date.now() });
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 10);
    this.save();
  }

  isHighScore(score) {
    if (this.highScores.length < 10) return score > 0;
    return score > this.highScores[this.highScores.length - 1].score;
  }

  getHighScore() {
    return this.highScores.length > 0 ? this.highScores[0].score : 0;
  }

  getTopScores() {
    return [...this.highScores];
  }

  updateStats(gameStats) {
    this.stats.totalGamesPlayed++;
    this.stats.totalScore += gameStats.score || 0;
    this.stats.highestLevel = Math.max(this.stats.highestLevel, gameStats.level || 1);
    this.stats.totalGhostsEaten += gameStats.ghostsEaten || 0;
    this.stats.totalFruitsCollected += gameStats.fruitsCollected || 0;
    this.stats.totalDotsEaten += gameStats.dotsEaten || 0;
    this.save();
  }

  getStats() {
    return { ...this.stats };
  }

  reset() {
    this.highScores = [];
    this.stats = {
      totalGamesPlayed: 0,
      totalScore: 0,
      highestLevel: 0,
      totalGhostsEaten: 0,
      totalFruitsCollected: 0,
      totalDotsEaten: 0,
    };
    this.save();
  }
}
