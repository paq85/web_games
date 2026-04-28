/**
 * Player statistics tracking with persistence.
 */

const DEFAULT_STATS = {
  totalMatches: 0,
  wins: 0,
  losses: 0,
  totalPointsScored: 0,
  totalPointsConceded: 0,
  currentWinStreak: 0,
  bestWinStreak: 0,
  matchesVsAI: 0,
  winsVsAI: 0,
  matches2P: 0,
  wins2P: 0,
};

/**
 * Load stats from localStorage.
 * @returns {object} Stats
 */
function loadStats() {
  try {
    const stored = localStorage.getItem(C.STORAGE_STATS);
    if (stored) {
      return { ...DEFAULT_STATS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load stats:', e);
  }
  return { ...DEFAULT_STATS };
}

/**
 * Save stats to localStorage.
 * @param {object} stats
 */
function saveStats(stats) {
  try {
    localStorage.setItem(C.STORAGE_STATS, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save stats:', e);
  }
}

/**
 * Record a match result.
 * @param {object} stats
 * @param {number} playerScore
 * @param {number} opponentScore
 * @param {number} winner - 1 or 2
 * @param {boolean} vsAI
 * @returns {object} Updated stats
 */
function recordMatch(stats, playerScore, opponentScore, winner, vsAI) {
  const updated = { ...stats };
  updated.totalMatches++;
  updated.totalPointsScored += playerScore;
  updated.totalPointsConceded += opponentScore;

  if (winner === 1) {
    updated.wins++;
    updated.currentWinStreak++;
    if (updated.currentWinStreak > updated.bestWinStreak) {
      updated.bestWinStreak = updated.currentWinStreak;
    }
  } else {
    updated.losses++;
    updated.currentWinStreak = 0;
  }

  if (vsAI) {
    updated.matchesVsAI++;
    if (winner === 1) updated.winsVsAI++;
  } else {
    updated.matches2P++;
    if (winner === 1) updated.wins2P++;
  }

  saveStats(updated);
  return updated;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_STATS,
    loadStats,
    saveStats,
    recordMatch,
  };
}
