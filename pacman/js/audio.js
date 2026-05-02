import { clamp } from './constants.js';

function makeGain(context, value = 1) {
  const gain = context.createGain();
  gain.gain.value = value;
  return gain;
}

export class AudioEngine {
  constructor(settings) {
    this.settings = settings;
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicTimer = null;
    this.musicPattern = 'menu';
    this.enabled = false;
    this.lastMusicTick = 0;
  }

  async ensureContext() {
    if (typeof window === 'undefined' || !window.AudioContext && !window.webkitAudioContext) {
      return null;
    }
    if (!this.context) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContextCtor();
      this.masterGain = makeGain(this.context, this.settings.muted ? 0 : this.settings.masterVolume);
      this.musicGain = makeGain(this.context, this.settings.muted ? 0 : this.settings.musicVolume);
      this.sfxGain = makeGain(this.context, this.settings.muted ? 0 : this.settings.sfxVolume);
      this.masterGain.connect(this.context.destination);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    this.enabled = true;
    return this.context;
  }

  updateSettings(settings) {
    this.settings = settings;
    if (this.masterGain && this.musicGain && this.sfxGain) {
      const muteFactor = this.settings.muted ? 0 : 1;
      this.masterGain.gain.value = this.settings.masterVolume * muteFactor;
      this.musicGain.gain.value = this.settings.musicVolume * muteFactor;
      this.sfxGain.gain.value = this.settings.sfxVolume * muteFactor;
    }
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  startMusic(pattern = 'menu') {
    this.musicPattern = pattern;
    if (!this.enabled || !this.context) {
      return;
    }
    this.stopMusic();
    const step = pattern === 'game' ? 220 : 340;
    const sequence = pattern === 'game' ? [220, 246.94, 196, 246.94, 293.66, 246.94] : [261.63, 329.63, 392, 523.25];
    let index = 0;
    this.musicTimer = setInterval(() => {
      this.playTone(sequence[index % sequence.length], step * 0.85, 'triangle', this.musicGain, 0.08);
      index += 1;
    }, step);
  }

  playTone(frequency, duration = 120, type = 'square', gainNode = this.sfxGain, volume = 0.08) {
    if (!this.context || this.settings.muted) {
      return;
    }
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(gainNode || this.sfxGain || this.masterGain || this.context.destination);
    const start = this.context.currentTime;
    const attack = Math.max(0.005, duration / 1000 / 6);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration / 1000);
    oscillator.start(start);
    oscillator.stop(start + duration / 1000 + 0.05);
  }

  playChomp() {
    this.playTone(330, 70, 'square', this.sfxGain, 0.04);
  }

  playDot() {
    this.playTone(720, 40, 'square', this.sfxGain, 0.035);
  }

  playPowerPellet() {
    this.playTone(130, 240, 'sawtooth', this.sfxGain, 0.07);
  }

  playGhostEaten(pointsIndex = 0) {
    const pitch = [320, 420, 540, 760][clamp(pointsIndex, 0, 3)];
    this.playTone(pitch, 160, 'triangle', this.sfxGain, 0.06);
  }

  playFruit() {
    this.playTone(880, 120, 'triangle', this.sfxGain, 0.07);
    setTimeout(() => this.playTone(1175, 90, 'triangle', this.sfxGain, 0.05), 90);
  }

  playLifeLost() {
    this.playTone(110, 380, 'sawtooth', this.sfxGain, 0.08);
  }

  playLevelComplete() {
    this.playTone(523.25, 130, 'triangle', this.sfxGain, 0.06);
    setTimeout(() => this.playTone(659.25, 130, 'triangle', this.sfxGain, 0.06), 110);
    setTimeout(() => this.playTone(783.99, 180, 'triangle', this.sfxGain, 0.06), 220);
  }

  playMenuMove() {
    this.playTone(660, 40, 'square', this.sfxGain, 0.02);
  }

  playConfirm() {
    this.playTone(880, 70, 'square', this.sfxGain, 0.04);
  }

  playPause(isPause = true) {
    this.playTone(isPause ? 392 : 523.25, 100, 'triangle', this.sfxGain, 0.04);
  }

  setMuted(muted) {
    this.settings.muted = muted;
    this.updateSettings(this.settings);
  }

  dispose() {
    this.stopMusic();
    if (this.context) {
      this.context.close().catch(() => {});
      this.context = null;
    }
    this.enabled = false;
  }
}

export async function createAudioEngine(settings) {
  const engine = new AudioEngine(settings);
  await engine.ensureContext();
  return engine;
}
