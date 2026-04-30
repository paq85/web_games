class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.duckGain = null;
    this.initialized = false;
    this.muted = false;
    this.masterVolume = 0.8;
    this.musicVolume = 0.6;
    this.sfxVolume = 0.8;
    this.musicNodes = [];
    this.musicPlaying = false;
    this.currentTrack = null;
    this.streakIntensity = 0;
    this.ducking = false;
    this.duckTimer = null;

    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('fusion_audio_settings');
      if (saved) {
        const s = JSON.parse(saved);
        this.masterVolume = s.masterVolume !== undefined ? s.masterVolume : 0.8;
        this.musicVolume = s.musicVolume !== undefined ? s.musicVolume : 0.6;
        this.sfxVolume = s.sfxVolume !== undefined ? s.sfxVolume : 0.8;
        this.muted = s.muted || false;
      }
    } catch (e) {
      // ignore
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('fusion_audio_settings', JSON.stringify({
        masterVolume: this.masterVolume,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
        muted: this.muted,
      }));
    } catch (e) {
      // ignore
    }
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.duckGain = this.ctx.createGain();
      this.duckGain.gain.value = 1;
      this.musicGain.disconnect();
      this.musicGain.connect(this.duckGain);
      this.duckGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      // Audio not supported
    }
  }

  ensureInitialized() {
    if (!this.initialized) return;
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  initFromGesture() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    this.init();
  }

  setMasterVolume(v) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    }
    this.saveSettings();
  }

  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
    this.saveSettings();
  }

  setSfxVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
    this.saveSettings();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    }
    this.saveSettings();
    return this.muted;
  }

  duckMusic(duration) {
    if (!this.duckGain) return;
    this.ducking = true;
    const now = this.ctx.currentTime;
    this.duckGain.gain.cancelScheduledValues(now);
    this.duckGain.gain.setValueAtTime(this.duckGain.gain.value, now);
    this.duckGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      const t = this.ctx.currentTime;
      this.duckGain.gain.cancelScheduledValues(t);
      this.duckGain.gain.setValueAtTime(this.duckGain.gain.value, t);
      this.duckGain.gain.linearRampToValueAtTime(1, t + 0.2);
      this.ducking = false;
    }, duration * 1000);
  }

  playTone(freq, duration, type, volume, dest) {
    this.ensureInitialized();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const vol = (volume || 0.3) * (this.muted ? 0 : 1);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(dest || this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playNoise(duration, volume, dest) {
    this.ensureInitialized();
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    const vol = (volume || 0.2) * (this.muted ? 0 : 1);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(dest || this.sfxGain);
    source.start();
  }

  // --- SFX ---

  tileSpawn() {
    this.playTone(800, 0.06, 'sine', 0.15);
  }

  tileSlide() {
    this.ensureInitialized();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  tileMerge(value) {
    const baseFreq = 300 + Math.min(value / 20, 800);
    this.playTone(baseFreq, 0.15, 'sine', 0.25);
    this.playTone(baseFreq * 1.5, 0.1, 'triangle', 0.1);
    if (value >= 128) {
      this.playTone(baseFreq * 0.5, 0.2, 'sine', 0.15);
      this.duckMusic(0.3);
    }
  }

  bombExplosion() {
    this.playNoise(0.3, 0.4);
    this.playTone(80, 0.4, 'sawtooth', 0.3);
    this.playTone(60, 0.5, 'sine', 0.2);
    this.duckMusic(0.5);
  }

  shieldActivate() {
    this.playTone(600, 0.2, 'sine', 0.2);
    this.playTone(900, 0.15, 'sine', 0.15);
  }

  shieldExpire() {
    this.playTone(700, 0.15, 'sine', 0.15);
    this.playTone(500, 0.2, 'sine', 0.1);
  }

  multiplierActivate() {
    this.playTone(1200, 0.1, 'sine', 0.2);
    this.playTone(1600, 0.08, 'triangle', 0.15);
    this.playTone(2000, 0.06, 'sine', 0.1);
  }

  fusionCoreMerge() {
    this.ensureInitialized();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.6);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.6);
    this.playTone(400, 0.4, 'sine', 0.2);
    this.duckMusic(0.6);
  }

  gridMutationWarning() {
    this.playTone(400, 0.15, 'square', 0.15);
    setTimeout(() => this.playTone(300, 0.15, 'square', 0.15), 150);
    setTimeout(() => this.playTone(200, 0.2, 'square', 0.2), 300);
  }

  comboMilestone(streak) {
    const baseFreq = 400 + streak * 80;
    this.playTone(baseFreq, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(baseFreq * 1.25, 0.1, 'sine', 0.2), 80);
    setTimeout(() => this.playTone(baseFreq * 1.5, 0.15, 'sine', 0.25), 160);
    if (streak >= 5) {
      this.duckMusic(0.4);
    }
  }

  winCelebration() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.25), i * 150);
      setTimeout(() => this.playTone(freq * 0.5, 0.4, 'triangle', 0.1), i * 150);
    });
    setTimeout(() => this.playTone(1047, 0.6, 'sine', 0.3), 600);
    this.duckMusic(1.5);
  }

  gameOver() {
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.4, 'sine', 0.2), i * 200);
    });
  }

  powerUpActivate() {
    this.playTone(600, 0.1, 'sine', 0.2);
    this.playTone(900, 0.08, 'triangle', 0.15);
    this.playTone(1200, 0.12, 'sine', 0.15);
  }

  menuNavigate() {
    this.playTone(1000, 0.04, 'sine', 0.08);
  }

  menuConfirm() {
    this.playTone(800, 0.08, 'sine', 0.15);
    this.playTone(1200, 0.06, 'sine', 0.1);
  }

  achievementUnlocked() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 100);
    });
    this.duckMusic(0.8);
  }

  // --- Music ---

  stopMusic() {
    this.musicNodes.forEach(node => {
      try { node.stop(); } catch (e) {}
      try { node.disconnect(); } catch (e) {}
    });
    this.musicNodes = [];
    this.musicPlaying = false;
    this.currentTrack = null;
  }

  playMenuMusic() {
    this.ensureInitialized();
    if (!this.ctx) return;
    this.stopMusic();
    this.currentTrack = 'menu';

    const bpm = 90;
    const beatDur = 60 / bpm;
    const loopDur = beatDur * 16;

    const playLoop = () => {
      if (this.currentTrack !== 'menu' || !this.ctx) return;
      const now = this.ctx.currentTime;

      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(55, now);
      bassGain.gain.setValueAtTime(0.12, now);
      bassGain.gain.setValueAtTime(0.08, now + loopDur * 0.5);
      bassGain.gain.linearRampToValueAtTime(0, now + loopDur);
      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(now);
      bassOsc.stop(now + loopDur);
      this.musicNodes.push(bassOsc);

      const padOsc = this.ctx.createOscillator();
      const padGain = this.ctx.createGain();
      const padFilter = this.ctx.createBiquadFilter();
      padOsc.type = 'triangle';
      padOsc.frequency.setValueAtTime(220, now);
      padOsc.frequency.linearRampToValueAtTime(261, now + loopDur * 0.5);
      padOsc.frequency.linearRampToValueAtTime(220, now + loopDur);
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 800;
      padGain.gain.setValueAtTime(0.06, now);
      padGain.gain.linearRampToValueAtTime(0, now + loopDur);
      padOsc.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(this.musicGain);
      padOsc.start(now);
      padOsc.stop(now + loopDur);
      this.musicNodes.push(padOsc);

      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();
      arpOsc.type = 'square';
      const arpNotes = [440, 523, 659, 523, 440, 349, 440, 523];
      arpNotes.forEach((freq, i) => {
        const t = now + i * beatDur * 2;
        arpOsc.frequency.setValueAtTime(freq, t);
      });
      arpGain.gain.setValueAtTime(0.03, now);
      arpGain.gain.setValueAtTime(0.02, now + loopDur * 0.7);
      arpGain.gain.linearRampToValueAtTime(0, now + loopDur);
      arpOsc.connect(arpGain);
      arpGain.connect(this.musicGain);
      arpOsc.start(now);
      arpOsc.stop(now + loopDur);
      this.musicNodes.push(arpOsc);

      setTimeout(playLoop, (loopDur - 0.1) * 1000);
      this.musicPlaying = true;
    };

    playLoop();
  }

  playGameplayMusic() {
    this.ensureInitialized();
    if (!this.ctx) return;
    this.stopMusic();
    this.currentTrack = 'gameplay';

    const baseBpm = 120;
    const beatDur = 60 / baseBpm;
    const loopDur = beatDur * 16;

    const playLoop = () => {
      if (this.currentTrack !== 'gameplay' || !this.ctx) return;
      const now = this.ctx.currentTime;
      const bpm = baseBpm + this.streakIntensity * 20;
      const bd = 60 / bpm;

      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      const bassNotes = [55, 55, 65, 65, 73, 73, 65, 55];
      bassNotes.forEach((freq, i) => {
        bassOsc.frequency.setValueAtTime(freq, now + i * bd * 2);
      });
      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 400;
      bassGain.gain.setValueAtTime(0.1, now);
      bassGain.gain.linearRampToValueAtTime(0, now + loopDur);
      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(now);
      bassOsc.stop(now + loopDur);
      this.musicNodes.push(bassOsc);

      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      for (let i = 0; i < 16; i += 4) {
        const t = now + i * bd;
        kickOsc.frequency.setValueAtTime(150, t);
        kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        kickGain.gain.setValueAtTime(0.2, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      }
      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);
      kickOsc.start(now);
      kickOsc.stop(now + loopDur);
      this.musicNodes.push(kickOsc);

      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      const leadFilter = this.ctx.createBiquadFilter();
      leadOsc.type = 'square';
      const leadNotes = [523, 0, 659, 0, 784, 0, 659, 0, 523, 0, 440, 0, 523, 0, 659, 0];
      leadNotes.forEach((freq, i) => {
        if (freq > 0) {
          const t = now + i * bd;
          leadOsc.frequency.setValueAtTime(freq, t);
          leadGain.gain.setValueAtTime(0.04, t);
          leadGain.gain.exponentialRampToValueAtTime(0.001, t + bd * 0.8);
        }
      });
      leadFilter.type = 'lowpass';
      leadFilter.frequency.value = 2000;
      leadOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(this.musicGain);
      leadOsc.start(now);
      leadOsc.stop(now + loopDur);
      this.musicNodes.push(leadOsc);

      const hihatGain = this.ctx.createGain();
      const hihatBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
      const hihatData = hihatBuffer.getChannelData(0);
      for (let i = 0; i < hihatData.length; i++) {
        hihatData[i] = (Math.random() * 2 - 1);
      }
      for (let i = 0; i < 16; i += 2) {
        const src = this.ctx.createBufferSource();
        src.buffer = hihatBuffer;
        const filt = this.ctx.createBiquadFilter();
        filt.type = 'highpass';
        filt.frequency.value = 8000;
        const t = now + i * bd;
        hihatGain.gain.setValueAtTime(0.03, t);
        hihatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        src.connect(filt);
        filt.connect(hihatGain);
        src.start(t);
      }
      hihatGain.connect(this.musicGain);

      setTimeout(playLoop, (loopDur - 0.15) * 1000);
      this.musicPlaying = true;
    };

    playLoop();
  }

  setStreakIntensity(intensity) {
    this.streakIntensity = Math.max(0, Math.min(1, intensity));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioManager };
}
