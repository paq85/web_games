import { DEFAULT_KEY_BINDINGS } from '../constants.js';

export function createDefaultSettings({ prefersReducedMotion = false } = {}) {
  return {
    difficulty: 'medium',
    theme: 'classic',
    controlScheme: 'auto',
    muted: false,
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 0.85,
    effects: {
      crt: true,
      screenShake: true,
      particles: true,
      reducedFlash: prefersReducedMotion,
      reducedMotion: prefersReducedMotion
    },
    practiceSpeed: 0.7,
    keyBindings: structuredClone(DEFAULT_KEY_BINDINGS)
  };
}

export function cloneSettings(settings) {
  return JSON.parse(JSON.stringify(settings));
}
