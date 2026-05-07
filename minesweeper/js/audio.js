class AudioManager {
  constructor() {
    this.muted = false;
    this._context = null;
  }

  _ensureContext() {
    if (!this._context) {
      this._context = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._context.state === 'suspended') {
      this._context.resume();
    }
    return this._context;
  }

  _playTone(freq, duration, type, volume) {
    if (this.muted) return;
    const ctx = this._ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  }

  playReveal() {
    this._playTone(800, 50, 'sine', 0.3);
  }

  playEmptyReveal() {
    this._playTone(1200, 30, 'sine', 0.15);
  }

  playFlag() {
    this._playTone(600, 80, 'square', 0.2);
  }

  playChord() {
    this._playTone(400, 60, 'triangle', 0.3);
  }

  playDetonate() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    const duration = 0.3;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);
  }

  playGameOver() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    const notes = [400, 300, 200];
    const noteDur = 0.15;
    const gap = 0.2;
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * gap;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + noteDur);
    });
  }

  playVictory() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    const notes = [523, 659, 784, 1047];
    const noteDur = 0.12;
    const gap = 0.1;
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * gap;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + noteDur);
    });
  }

  playPause() {
    this._playTone(660, 100, 'sine', 0.25);
  }

  playNumberReveal(n) {
    const freq = 300 + (n * 80);
    this._playTone(freq, 60, 'sine', 0.25);
  }

  toggleMute() {
    this.muted = !this.muted;
  }

  isMuted() {
    return this.muted;
  }

  setMuted(m) {
    this.muted = m;
  }
}

if (typeof module !== 'undefined') module.exports = { AudioManager };
