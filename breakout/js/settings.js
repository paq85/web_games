/**
 * Settings management - localStorage persistence
 */

const STORAGE_KEY = 'breakout_settings';

const DEFAULT_SETTINGS = {
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 80,
  mute: false,
  paddleSize: 'normal',
  ballSpeed: 'normal',
  glowIntensity: 'normal',
  particles: true,
  reducedFlash: false,
  pauseOnFocusLoss: true,
  theme: 'neon',
};

export function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    // localStorage not available
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // localStorage not available
  }
}

export function getMasterVolume(settings) {
  if (settings.mute) return 0;
  return settings.masterVolume / 100;
}

export function getMusicVolume(settings) {
  if (settings.mute) return 0;
  return (settings.masterVolume / 100) * (settings.musicVolume / 100);
}

export function getSfxVolume(settings) {
  if (settings.mute) return 0;
  return (settings.masterVolume / 100) * (settings.sfxVolume / 100);
}
