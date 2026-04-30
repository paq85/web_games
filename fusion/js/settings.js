class Settings {
  constructor(persistence) {
    this.persistence = persistence;
  }

  getAll() {
    const result = {};
    const defs = this._defaults();
    for (const [key, def] of Object.entries(defs)) {
      const stored = this.persistence.getSetting(key);
      if (stored && typeof stored === 'object' && 'value' in stored) {
        result[key] = stored.value;
      } else if (stored !== undefined) {
        result[key] = stored;
      } else {
        result[key] = def.value;
      }
    }
    return result;
  }

  get(key) {
    const stored = this.persistence.getSetting(key);
    if (stored && typeof stored === 'object' && 'value' in stored) {
      return stored.value;
    }
    if (stored !== undefined) return stored;
    const def = this._defaults()[key];
    return def ? def.value : undefined;
  }

  set(key, value) {
    this.persistence.setSetting(key, value);
  }

  reset() {
    const defaults = this._defaults();
    for (const [key, def] of Object.entries(defaults)) {
      this.persistence.setSetting(key, def.value);
    }
  }

  applyToAudio(audioManager) {
    if (!audioManager) return;
    if (typeof audioManager.setMasterVolume === 'function') {
      audioManager.setMasterVolume(this.get('masterVolume') / 100);
    }
    if (typeof audioManager.setMusicVolume === 'function') {
      audioManager.setMusicVolume(this.get('musicVolume') / 100);
    }
    if (typeof audioManager.setSfxVolume === 'function') {
      audioManager.setSfxVolume(this.get('sfxVolume') / 100);
    }
  }

  isNewTileRisky() {
    return this.get('newTileProbability') === 'Risky';
  }

  getSpawnChance2() {
    return this.isNewTileRisky() ? 0.5 : 0.9;
  }

  getSwipeThreshold() {
    const s = this.get('swipeSensitivity');
    if (s === 'High') return 20;
    if (s === 'Low') return 50;
    return 30;
  }

  shouldShowTileNumbers() {
    return this.get('showTileNumbers');
  }

  shouldPauseOnBlur() {
    return this.get('pauseOnFocusLoss');
  }

  getParticleLevel() {
    const level = this.get('particleEffects');
    if (level === 'Off') return 0;
    if (level === 'Reduced') return 1;
    return 2;
  }

  getMaxParticles() {
    const level = this.getParticleLevel();
    if (level === 0) return 0;
    if (level === 1) return 100;
    return 200;
  }

  shouldScreenShake() {
    return this.get('screenShake');
  }

  getGlowIntensity() {
    const level = this.get('gridGlow');
    if (level === 'Low') return 0.3;
    if (level === 'Medium') return 0.6;
    return 1.0;
  }

  getTileColorScheme() {
    return this.get('tileColors') || 'Neon';
  }

  isReducedFlash() {
    return this.get('reducedFlash');
  }

  _defaults() {
    return {
      masterVolume: { value: 80, type: 'range', min: 0, max: 100 },
      musicVolume: { value: 60, type: 'range', min: 0, max: 100 },
      sfxVolume: { value: 80, type: 'range', min: 0, max: 100 },
      muted: { value: false, type: 'toggle' },
      screenShake: { value: true, type: 'toggle' },
      particleQuality: { value: 'full', type: 'select', options: ['full', 'reduced', 'off'] },
      glowIntensity: { value: 'high', type: 'select', options: ['high', 'medium', 'low'] },
      tileColors: { value: 'neon', type: 'select', options: ['neon', 'classic', 'high-contrast'] },
      reducedFlash: { value: false, type: 'toggle' },
      showNumbers: { value: true, type: 'toggle' },
      tileProbability: { value: 'balanced', type: 'select', options: ['balanced', 'risky'] },
      mutationDifficulty: { value: 'normal', type: 'select', options: ['easy', 'normal', 'hard'] },
      pauseOnFocusLoss: { value: true, type: 'toggle' },
      swipeSensitivity: { value: 'medium', type: 'select', options: ['high', 'medium', 'low'] }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Settings };
}
