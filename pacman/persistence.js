/**
 * Persistence module for Pacman.
 *
 * Handles localStorage-based persistence for settings, high scores, and
 * cumulative statistics. All operations are wrapped in try/catch for
 * browser compatibility (e.g., private-mode Safari blocks localStorage).
 *
 * Vanilla JS — ES module export.
 */

// ---------------------------------------------------------------------------
// Storage key constants
// ---------------------------------------------------------------------------
export const STORAGE_KEYS = {
    SETTINGS: 'pacman_settings',
    HIGH_SCORES: 'pacman_high_scores',
    STATS: 'pacman_stats',
    ACHIEVEMENTS: 'pacman_achievements',
};

// ---------------------------------------------------------------------------
// Achievement definitions
// ---------------------------------------------------------------------------
export const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', description: 'Eat your first ghost', icon: '👻' },
    { id: 'ghost_hunter', name: 'Ghost Hunter', description: 'Eat 50 ghosts', icon: '🏆' },
    { id: 'dot_master', name: 'Dot Master', description: 'Eat 1000 dots', icon: '⚫' },
    { id: 'fruit_lover', name: 'Fruit Lover', description: 'Collect 20 fruits', icon: '🍒' },
    { id: 'level_5', name: 'Getting Serious', description: 'Reach level 5', icon: '⭐' },
    { id: 'level_10', name: 'Veteran', description: 'Reach level 10', icon: '🌟' },
    { id: 'high_score_10000', name: 'High Scorer', description: 'Score 10,000 points', icon: '💎' },
    { id: 'combo_master', name: 'Combo Master', description: 'Eat 4 ghosts in one power-up', icon: '🔥' },
];

// ---------------------------------------------------------------------------
// Default values (frozen to prevent accidental mutation)
// ---------------------------------------------------------------------------
const _DEFAULT_SETTINGS = {
    masterVolume: 0.8,
    musicVolume: 0.6,
    effectsVolume: 0.8,
    muted: false,
    difficulty: 'medium',
    crtOverlay: false,
    screenShake: true,
    particles: true,
    reducedFlash: false,
    reducedMotion: false,
    controlBindings: {
        up: ['ArrowUp', 'KeyW'],
        down: ['ArrowDown', 'KeyS'],
        left: ['ArrowLeft', 'KeyA'],
        right: ['ArrowRight', 'KeyD'],
        confirm: ['Enter', 'Space'],
        pause: ['Escape'],
        mute: ['KeyM'],
    },
};

const _DEFAULT_STATS = {
    highScore: 0,
    totalGames: 0,
    totalLevelsCompleted: 0,
    totalGhostsEaten: 0,
    totalFruitsCollected: 0,
    totalDotsEaten: 0,
    bestLevel: 1,
    winStreak: 0,
    bestWinStreak: 0,
};

/** Deep-clone a plain object via JSON round-trip (safe for our data shapes). */
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/** Deep-freeze recursively so defaults can't be mutated externally. */
function deepFreeze(obj) {
    Object.freeze(obj);
    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            deepFreeze(obj[key]);
        }
    }
    return obj;
}

export const DEFAULT_SETTINGS = deepFreeze(clone(_DEFAULT_SETTINGS));
export const DEFAULT_STATS = deepFreeze(clone(_DEFAULT_STATS));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether localStorage is usable.
 * Returns false if the API is missing or throws (e.g., Safari private mode).
 */
function storageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch {
        return false;
    }
}

/**
 * Safely parse JSON from localStorage. Returns null on failure.
 */
function loadJSON(key) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        const parsed = JSON.parse(raw);
        return parsed;
    } catch {
        return null;
    }
}

/**
 * Safely write a value to localStorage as JSON.
 */
function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate that a settings object has all required keys. Returns true
 * if the object looks like a valid settings snapshot.
 */
function isValidSettings(obj) {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        typeof obj.masterVolume === 'number' &&
        typeof obj.muted === 'boolean' &&
        typeof obj.difficulty === 'string' &&
        typeof obj.controlBindings === 'object'
    );
}

/**
 * Validate that a stats object has all required keys.
 */
function isValidStats(obj) {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        typeof obj.highScore === 'number' &&
        typeof obj.totalGames === 'number'
    );
}

/**
 * Validate a single high-score entry.
 */
function isValidHighScoreEntry(entry) {
    return (
        entry !== null &&
        typeof entry === 'object' &&
        typeof entry.score === 'number' &&
        typeof entry.level === 'number' &&
        typeof entry.date === 'string'
    );
}

/**
 * Return today's date as YYYY-MM-DD using the local timezone.
 */
function todayDateString() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ---------------------------------------------------------------------------
// Persistence class
// ---------------------------------------------------------------------------
export class Persistence {
    constructor() {
        this._available = storageAvailable();
    }

    /** Whether localStorage is available in this environment. */
    isStorageAvailable() {
        return this._available;
    }

    // ------------------------------------------------------------------
    // Settings
    // ------------------------------------------------------------------

    /** Load saved settings, falling back to defaults. */
    loadSettings() {
        if (!this._available) return clone(_DEFAULT_SETTINGS);
        const data = loadJSON(STORAGE_KEYS.SETTINGS);
        if (!isValidSettings(data)) return clone(_DEFAULT_SETTINGS);
        // Merge with defaults so that new keys added in future versions appear.
        const merged = clone(_DEFAULT_SETTINGS);
        for (const key of Object.keys(data)) {
            merged[key] = data[key];
        }
        return merged;
    }

    /** Save settings to localStorage. */
    saveSettings(settings) {
        if (!this._available) return false;
        return saveJSON(STORAGE_KEYS.SETTINGS, settings);
    }

    // ------------------------------------------------------------------
    // High scores
    // ------------------------------------------------------------------

    /** Load high-score entries from storage. Returns empty array on failure. */
    loadHighScores() {
        if (!this._available) return [];
        const data = loadJSON(STORAGE_KEYS.HIGH_SCORES);
        if (!Array.isArray(data)) return [];
        // Filter out invalid entries and return sorted.
        const valid = data.filter(isValidHighScoreEntry);
        valid.sort((a, b) => b.score - a.score);
        return valid;
    }

    /**
     * Persist high-score entries back to storage.
     * @param {Array} entries - Already sorted array of high-score entries.
     */
    _saveHighScores(entries) {
        if (!this._available) return false;
        return saveJSON(STORAGE_KEYS.HIGH_SCORES, entries);
    }

    /**
     * Add a high-score entry if it qualifies for the top 10.
     * @param {number} score
     * @param {number} level
     * @param {string} [date] - YYYY-MM-DD (defaults to today).
     */
    saveHighScore(score, level, date) {
        if (!this._available) return false;
        const entries = this.loadHighScores();
        const entry = {
            score,
            level,
            date: date || todayDateString(),
            difficulty: 'medium', // Will be overridden by caller if needed.
        };

        // Only add if there's room or it beats the lowest entry.
        if (entries.length < 10 || score > entries[entries.length - 1].score) {
            entries.push(entry);
            entries.sort((a, b) => b.score - a.score);
            // Keep only top 10.
            if (entries.length > 10) {
                entries.length = 10;
            }
            return this._saveHighScores(entries);
        }
        return true; // No change needed — still a success.
    }

    /** Return the current top-10 high scores (sorted descending by score). */
    getHighScores() {
        return this.loadHighScores();
    }

    // ------------------------------------------------------------------
    // Statistics
    // ------------------------------------------------------------------

    /** Load cumulative stats, falling back to defaults. */
    loadStats() {
        if (!this._available) return clone(_DEFAULT_STATS);
        const data = loadJSON(STORAGE_KEYS.STATS);
        if (!isValidStats(data)) return clone(_DEFAULT_STATS);
        // Merge with defaults so new keys appear.
        const merged = clone(_DEFAULT_STATS);
        for (const key of Object.keys(data)) {
            if (typeof merged[key] !== 'undefined') {
                merged[key] = data[key];
            }
        }
        return merged;
    }

    /**
     * Merge partial updates into stats and persist.
     * @param {Object} updates - Key-value pairs to merge.
     */
    updateStats(updates) {
        if (!this._available) return false;
        const stats = this.loadStats();
        for (const key of Object.keys(updates)) {
            if (typeof stats[key] !== 'undefined') {
                stats[key] = updates[key];
            }
        }
        return saveJSON(STORAGE_KEYS.STATS, stats);
    }

    /**
     * Update highScore in stats if the given score is better.
     * @param {number} score
     */
    addScoreToStats(score) {
        if (!this._available) return false;
        const stats = this.loadStats();
        if (score > stats.highScore) {
            stats.highScore = score;
        }
        return saveJSON(STORAGE_KEYS.STATS, stats);
    }

    /**
     * Increment a numeric stat by a given amount.
     * @param {string} statName - Key in the stats object.
     * @param {number} amount - Value to add (can be negative).
     */
    incrementStat(statName, amount) {
        if (!this._available) return false;
        const stats = this.loadStats();
        if (typeof stats[statName] === 'number') {
            stats[statName] += amount;
            return saveJSON(STORAGE_KEYS.STATS, stats);
        }
        return false;
    }

    /** Reset cumulative stats to defaults. */
    resetStats() {
        if (!this._available) return false;
        return saveJSON(STORAGE_KEYS.STATS, clone(_DEFAULT_STATS));
    }

    // ------------------------------------------------------------------
    // Achievements
    // ------------------------------------------------------------------

    /** Load unlocked achievement IDs from storage. Returns empty array on failure. */
    loadAchievements() {
        if (!this._available) return [];
        const data = loadJSON(STORAGE_KEYS.ACHIEVEMENTS);
        if (!Array.isArray(data)) return [];
        return data;
    }

    /**
     * Unlock an achievement if not already unlocked.
     * @param {string} id - Achievement ID to unlock.
     * @returns {boolean} - True if the achievement was newly unlocked, false if already unlocked.
     */
    unlockAchievement(id) {
        if (!this._available) return false;
        const unlocked = this.loadAchievements();
        if (unlocked.includes(id)) return false;
        unlocked.push(id);
        return saveJSON(STORAGE_KEYS.ACHIEVEMENTS, unlocked);
    }

    /**
     * Get achievement objects with unlocked status.
     * @param {Array} definitions - Achievement definitions (ACHIEVEMENTS constant).
     * @returns {Array} - Achievement objects with `unlocked` boolean.
     */
    getAchievements(definitions) {
        const unlocked = new Set(this.loadAchievements());
        return (definitions || ACHIEVEMENTS).map(a => ({
            ...a,
            unlocked: unlocked.has(a.id),
        }));
    }

    // ------------------------------------------------------------------
    // Utility
    // ------------------------------------------------------------------

    /** Remove all persisted data for this game. */
    clearAll() {
        if (!this._available) return false;
        try {
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);
            localStorage.removeItem(STORAGE_KEYS.HIGH_SCORES);
            localStorage.removeItem(STORAGE_KEYS.STATS);
            localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
            return true;
        } catch {
            return false;
        }
    }
}
