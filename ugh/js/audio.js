// Audio system using Web Audio API
const AudioSystem = {
  ctx: null,
  masterGain: null,
  sfxGain: null,
  musicGain: null,
  enabled: true,
  musicEnabled: true,
  musicOsc: null,
  musicInterval: null,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.5;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.sfxGain.gain.value = 0.7;

      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
      this.musicGain.gain.value = 0.3;
    } catch (e) {
      console.warn('Web Audio API not available:', e);
      this.enabled = false;
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // Generate a short noise burst
  playNoise(duration = 0.1, frequency = 1000, volume = 0.3) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.value = volume;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
  },

  // Play a tone
  playTone(frequency, duration = 0.15, type = 'square', volume = 0.2) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  // Sound effects
  sfx: {
    menuSelect() {
      AudioSystem.playTone(600, 0.08, 'square', 0.15);
    },
    menuConfirm() {
      AudioSystem.playTone(800, 0.1, 'square', 0.2);
      setTimeout(() => AudioSystem.playTone(1000, 0.1, 'square', 0.15), 80);
    },
    pickup() {
      AudioSystem.playTone(523, 0.1, 'square', 0.2);
      setTimeout(() => AudioSystem.playTone(659, 0.1, 'square', 0.2), 80);
      setTimeout(() => AudioSystem.playTone(784, 0.15, 'square', 0.2), 160);
    },
    delivery() {
      AudioSystem.playTone(784, 0.1, 'square', 0.25);
      setTimeout(() => AudioSystem.playTone(988, 0.1, 'square', 0.25), 100);
      setTimeout(() => AudioSystem.playTone(1175, 0.2, 'square', 0.25), 200);
    },
    damage() {
      AudioSystem.playNoise(0.2, 300, 0.4);
    },
    fuelWarning() {
      AudioSystem.playTone(200, 0.3, 'sawtooth', 0.15);
    },
    fuelEmpty() {
      AudioSystem.playTone(150, 0.5, 'sawtooth', 0.2);
    },
    explosion() {
      AudioSystem.playNoise(0.4, 200, 0.5);
    },
    levelComplete() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((note, i) => {
        setTimeout(() => AudioSystem.playTone(note, 0.2, 'square', 0.2), i * 120);
      });
    },
    gameOver() {
      const notes = [400, 350, 300, 200];
      notes.forEach((note, i) => {
        setTimeout(() => AudioSystem.playTone(note, 0.3, 'sawtooth', 0.15), i * 200);
      });
    },
    fuelCan() {
      AudioSystem.playTone(880, 0.08, 'square', 0.15);
      setTimeout(() => AudioSystem.playTone(1100, 0.1, 'square', 0.15), 60);
    },
    collectible() {
      AudioSystem.playTone(1200, 0.08, 'sine', 0.15);
      setTimeout(() => AudioSystem.playTone(1500, 0.12, 'sine', 0.15), 60);
    },
    boost() {
      AudioSystem.playNoise(0.15, 2000, 0.2);
    },
  },

  // Background music (simple loop)
  startMusic() {
    if (!this.enabled || !this.musicEnabled || !this.ctx) return;
    this.resume();
    this.stopMusic();

    let noteIndex = 0;
    const notes = [130, 146, 164, 174, 196, 174, 164, 146];
    const tempo = 250;

    this.musicInterval = setInterval(() => {
      if (!this.musicEnabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = notes[noteIndex % notes.length];

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
      noteIndex++;
    }, tempo);
  },

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  },

  setSoundEnabled(enabled) {
    this.enabled = enabled;
    if (this.sfxGain) {
      this.sfxGain.gain.value = enabled ? 0.7 : 0;
    }
  },

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (this.musicGain) {
      this.musicGain.gain.value = enabled ? 0.3 : 0;
    }
    if (!enabled) {
      this.stopMusic();
    }
  },
};
