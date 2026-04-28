// Utility functions
const Utils = {
  // Clamp value between min and max
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  // Linear interpolation
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  // Random integer between min and max (inclusive)
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Random float between min and max
  randFloat(min, max) {
    return Math.random() * (max - min) + min;
  },

  // Check if two rectangles overlap
  rectsOverlap(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  },

  // Distance between two points
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  // Generate a level code from level number and score
  generateLevelCode(level, score) {
    const data = `${level}-${score}-${Date.now() % 10000}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const code = Math.abs(hash).toString(36).toUpperCase();
    return `UGH${code.padStart(8, '0')}`;
  },

  // Validate and decode a level code
  decodeLevelCode(code) {
    if (!code || typeof code !== 'string') return null;
    const trimmed = code.trim().toUpperCase();
    if (!trimmed.startsWith('UGH')) return null;
    if (trimmed.length < 6 || trimmed.length > 12) return null;
    // Accept any valid-format code and map to a level
    const hash = parseInt(trimmed.substring(3), 36);
    if (isNaN(hash)) return null;
    const level = (hash % CONSTANTS.LEVELS.length) + 1;
    return { level };
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Check if device is touch-capable
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Check if reduced motion is preferred
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
};
