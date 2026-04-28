/**
 * Settings management with localStorage persistence.
 */

/**
 * Default settings.
 */
const DEFAULT_SETTINGS = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  muted: false,
  winScore: C.DEFAULT_WIN_SCORE,
  aiDifficulty: 'medium',
  paddleSize: 'medium',
  crtEffect: false,
  screenShake: true,
  reducedFlash: false,
  particles: true,
  theme: 'classic',
  pauseOnBlur: true,
  controls: { ...C.DEFAULT_CONTROLS },
};

/**
 * Load settings from localStorage or return defaults.
 * @returns {object} Settings
 */
function loadSettings() {
  try {
    const stored = localStorage.getItem(C.STORAGE_SETTINGS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new settings
      return { ...DEFAULT_SETTINGS, ...parsed, controls: { ...C.DEFAULT_CONTROLS, ...(parsed.controls || {}) } };
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage.
 * @param {object} settings
 */
function saveSettings(settings) {
  try {
    localStorage.setItem(C.STORAGE_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

/**
 * Reset settings to defaults.
 * @returns {object} Default settings
 */
function resetSettings() {
  const defaults = { ...DEFAULT_SETTINGS, controls: { ...C.DEFAULT_CONTROLS } };
  saveSettings(defaults);
  return defaults;
}

/**
 * Update a single setting.
 * @param {object} settings
 * @param {string} key
 * @param {*} value
 * @returns {object} Updated settings
 */
function updateSetting(settings, key, value) {
  const updated = { ...settings, [key]: value };
  saveSettings(updated);
  return updated;
}

/**
 * Rebind a control key.
 * @param {object} settings
 * @param {string} action - Control action name
 * @param {string} code - New key code
 * @returns {object} Updated settings
 */
function rebindControl(settings, action, code) {
  const updated = {
    ...settings,
    controls: { ...settings.controls, [action]: code },
  };
  saveSettings(updated);
  return updated;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_SETTINGS,
    loadSettings,
    saveSettings,
    resetSettings,
    updateSetting,
    rebindControl,
  };
}
