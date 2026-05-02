// === Settings Management ===

const STORAGE_KEY = 'pacman_settings';

const DEFAULT_SETTINGS = {
  masterVolume: 0.7,
  musicVolume: 0.4,
  sfxVolume: 0.7,
  muted: false,
  difficulty: 'MEDIUM',
  crtOverlay: true,
  screenShake: true,
  particles: true,
  reducedFlash: false,
  reducedMotion: false,
  controlScheme: 'keyboard',
  keyBindings: {
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    confirm: ['Enter', 'Space'],
    pause: ['Escape'],
    mute: ['KeyM'],
  },
};

export class Settings {
  constructor() {
    this.data = { ...DEFAULT_SETTINGS };
    this.load();
    this._detectReducedMotion();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.data = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      // Use defaults
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      // Ignore
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  getAll() {
    return { ...this.data };
  }

  reset() {
    this.data = { ...DEFAULT_SETTINGS };
    this.save();
  }

  _detectReducedMotion() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.data.reducedMotion = true;
      this.data.screenShake = false;
      this.data.particles = false;
      this.data.crtOverlay = false;
    }
  }

  getSettingsMenuItems() {
    return [
      { key: 'masterVolume', label: 'Master Volume', value: Math.round(this.data.masterVolume * 100) + '%', type: 'range' },
      { key: 'musicVolume', label: 'Music Volume', value: Math.round(this.data.musicVolume * 100) + '%', type: 'range' },
      { key: 'sfxVolume', label: 'SFX Volume', value: Math.round(this.data.sfxVolume * 100) + '%', type: 'range' },
      { key: 'muted', label: 'Muted', value: this.data.muted ? 'ON' : 'OFF', type: 'toggle' },
      { key: 'crtOverlay', label: 'CRT Effect', value: this.data.crtOverlay ? 'ON' : 'OFF', type: 'toggle' },
      { key: 'screenShake', label: 'Screen Shake', value: this.data.screenShake ? 'ON' : 'OFF', type: 'toggle' },
      { key: 'particles', label: 'Particles', value: this.data.particles ? 'ON' : 'OFF', type: 'toggle' },
      { key: 'reducedFlash', label: 'Reduced Flash', value: this.data.reducedFlash ? 'ON' : 'OFF', type: 'toggle' },
    ];
  }

  adjustSetting(key, direction) {
    const item = this.getSettingsMenuItems().find(i => i.key === key);
    if (!item) return;

    if (item.type === 'toggle') {
      this.data[key] = !this.data[key];
    } else if (item.type === 'range') {
      const step = 0.1;
      this.data[key] = Math.max(0, Math.min(1, this.data[key] + direction * step));
    }
    this.save();
  }
}
