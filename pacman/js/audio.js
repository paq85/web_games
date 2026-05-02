// === Audio System (Web Audio API Synthesis) ===

export class Audio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
    this.masterVolume = 0.7;
    this.musicVolume = 0.4;
    this.sfxVolume = 0.7;
    this.musicOsc = null;
    this.musicPlaying = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this._updateVolumes();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _updateVolumes() {
    if (!this.masterGain) return;
    this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    this.musicGain.gain.value = this.musicVolume;
    this.sfxGain.gain.value = this.sfxVolume;
  }

  setMasterVolume(v) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    this._updateVolumes();
  }

  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    this._updateVolumes();
  }

  setSfxVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    this._updateVolumes();
  }

  toggleMute() {
    this.muted = !this.muted;
    this._updateVolumes();
    return this.muted;
  }

  setMuted(muted) {
    this.muted = muted;
    this._updateVolumes();
  }

  // === Sound Effects ===

  playChomp() {
    if (!this.ctx) return;
    this._playTone(440, 0.05, 'square', this.sfxGain, 0.3);
  }

  playDot() {
    if (!this.ctx) return;
    this._playTone(600, 0.03, 'sine', this.sfxGain, 0.2);
  }

  playPowerPellet() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this._playToneAt(200, 0.3, 'sine', this.sfxGain, 0.4, now);
    this._playToneAt(300, 0.3, 'sine', this.sfxGain, 0.3, now + 0.1);
  }

  playGhostEaten() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      this._playToneAt(400 + i * 100, 0.08, 'sawtooth', this.sfxGain, 0.3, now + i * 0.05);
    }
  }

  playDeath() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 8; i++) {
      this._playToneAt(500 - i * 50, 0.15, 'sawtooth', this.sfxGain, 0.3, now + i * 0.12);
    }
  }

  playLevelComplete() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this._playToneAt(freq, 0.2, 'square', this.sfxGain, 0.3, now + i * 0.15);
    });
  }

  playFruit() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this._playToneAt(800, 0.1, 'sine', this.sfxGain, 0.3, now);
    this._playToneAt(1000, 0.1, 'sine', this.sfxGain, 0.3, now + 0.08);
    this._playToneAt(1200, 0.15, 'sine', this.sfxGain, 0.3, now + 0.16);
  }

  playMenuNav() {
    if (!this.ctx) return;
    this._playTone(300, 0.05, 'square', this.sfxGain, 0.2);
  }

  playMenuConfirm() {
    if (!this.ctx) return;
    this._playTone(500, 0.1, 'square', this.sfxGain, 0.3);
  }

  playPause() {
    if (!this.ctx) return;
    this._playTone(200, 0.1, 'triangle', this.sfxGain, 0.3);
  }

  playExtraLife() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [660, 880, 1100, 1320, 1100, 880, 660];
    notes.forEach((freq, i) => {
      this._playToneAt(freq, 0.1, 'sine', this.sfxGain, 0.3, now + i * 0.08);
    });
  }

  // === Music ===

  startMenuMusic() {
    this._startMusic([262, 330, 392, 523, 392, 330], 0.25, 'triangle');
  }

  startGameMusic() {
    this._startMusic([220, 262, 330, 262, 220, 196], 0.2, 'square');
  }

  startGameOverMusic() {
    if (!this.ctx) return;
    this.stopMusic();
    const now = this.ctx.currentTime;
    const notes = [392, 370, 349, 330, 311, 294, 262];
    notes.forEach((freq, i) => {
      this._playToneAt(freq, 0.4, 'triangle', this.musicGain, 0.3, now + i * 0.3);
    });
  }

  _startMusic(notes, noteLength, waveType) {
    if (!this.ctx) return;
    this.stopMusic();
    this.musicPlaying = true;

    let noteIndex = 0;
    const playNext = () => {
      if (!this.musicPlaying) return;
      const freq = notes[noteIndex % notes.length];
      this._playToneAt(freq, noteLength * 0.8, waveType, this.musicGain, 0.15, this.ctx.currentTime);
      noteIndex++;
      this._musicTimeout = setTimeout(playNext, noteLength * 1000);
    };
    playNext();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this._musicTimeout) {
      clearTimeout(this._musicTimeout);
      this._musicTimeout = null;
    }
  }

  // === Helpers ===

  _playTone(freq, duration, type, dest, volume) {
    this._playToneAt(freq, duration, type, dest, volume, this.ctx.currentTime);
  }

  _playToneAt(freq, duration, type, dest, volume, startTime) {
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  getSettings() {
    return {
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      muted: this.muted,
    };
  }

  loadSettings(settings) {
    if (settings.masterVolume !== undefined) this.masterVolume = settings.masterVolume;
    if (settings.musicVolume !== undefined) this.musicVolume = settings.musicVolume;
    if (settings.sfxVolume !== undefined) this.sfxVolume = settings.sfxVolume;
    if (settings.muted !== undefined) this.muted = settings.muted;
    this._updateVolumes();
  }
}
