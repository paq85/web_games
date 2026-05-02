const SOUND_MAP = {
  pellet: {
    notes: [
      { frequency: 520, duration: 0.05, volume: 0.18, type: 'square' },
      { frequency: 780, duration: 0.04, volume: 0.12, type: 'triangle', delay: 0.04 }
    ]
  },
  power: {
    notes: [
      { frequency: 220, duration: 0.14, volume: 0.28, type: 'sawtooth' },
      { frequency: 330, duration: 0.16, volume: 0.22, type: 'triangle', delay: 0.07 }
    ]
  },
  'ghost-eaten': {
    notes: [
      { frequency: 440, duration: 0.05, volume: 0.24, type: 'square' },
      { frequency: 660, duration: 0.05, volume: 0.22, type: 'square', delay: 0.05 },
      { frequency: 880, duration: 0.08, volume: 0.2, type: 'square', delay: 0.1 }
    ]
  },
  'life-lost': {
    notes: [
      { frequency: 320, duration: 0.14, volume: 0.22, type: 'sine' },
      { frequency: 240, duration: 0.18, volume: 0.24, type: 'sine', delay: 0.13 },
      { frequency: 160, duration: 0.22, volume: 0.26, type: 'triangle', delay: 0.3 }
    ]
  },
  'level-complete': {
    notes: [
      { frequency: 523.25, duration: 0.08, volume: 0.22, type: 'triangle' },
      { frequency: 659.25, duration: 0.08, volume: 0.22, type: 'triangle', delay: 0.08 },
      { frequency: 783.99, duration: 0.08, volume: 0.22, type: 'triangle', delay: 0.16 },
      { frequency: 1046.5, duration: 0.16, volume: 0.24, type: 'triangle', delay: 0.24 }
    ]
  },
  fruit: {
    notes: [
      { frequency: 740, duration: 0.06, volume: 0.22, type: 'triangle' },
      { frequency: 988, duration: 0.1, volume: 0.22, type: 'triangle', delay: 0.07 }
    ]
  },
  'fruit-spawn': {
    notes: [
      { frequency: 660, duration: 0.05, volume: 0.18, type: 'triangle' },
      { frequency: 520, duration: 0.05, volume: 0.16, type: 'triangle', delay: 0.05 }
    ]
  },
  'menu-move': {
    notes: [{ frequency: 510, duration: 0.04, volume: 0.12, type: 'square' }]
  },
  'menu-confirm': {
    notes: [
      { frequency: 620, duration: 0.05, volume: 0.16, type: 'square' },
      { frequency: 820, duration: 0.06, volume: 0.16, type: 'square', delay: 0.04 }
    ]
  },
  pause: {
    notes: [{ frequency: 260, duration: 0.08, volume: 0.16, type: 'triangle' }]
  },
  resume: {
    notes: [{ frequency: 390, duration: 0.08, volume: 0.16, type: 'triangle' }]
  },
  mute: {
    notes: [{ frequency: 180, duration: 0.05, volume: 0.12, type: 'sine' }]
  }
};

const MUSIC_PATTERNS = {
  menu: {
    beatMs: 420,
    notes: [392, 523.25, 659.25, 523.25, 392, 523.25, 659.25, 783.99]
  },
  gameplay: {
    beatMs: 280,
    notes: [220, 220, 246.94, 261.63, 293.66, 261.63, 246.94, 220]
  },
  gameplayIntense: {
    beatMs: 210,
    notes: [246.94, 329.63, 369.99, 440, 369.99, 329.63, 293.66, 261.63]
  },
  gameOver: {
    beatMs: 480,
    notes: [392, 349.23, 293.66, 261.63, 220, 196]
  },
  victory: {
    beatMs: 220,
    notes: [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25]
  }
};

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.musicInterval = null;
    this.musicPattern = null;
    this.musicIndex = 0;
    this.settings = {
      muted: false,
      masterVolume: 0.8,
      musicVolume: 0.6,
      sfxVolume: 0.85
    };
  }

  ensureContext() {
    if (this.audioContext) {
      return this.audioContext;
    }

    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) {
      return null;
    }

    this.audioContext = new Context();
    return this.audioContext;
  }

  unlock() {
    const context = this.ensureContext();
    if (context && context.state === 'suspended') {
      context.resume().catch(() => {});
    }
  }

  applySettings(settings) {
    this.settings = {
      muted: settings.muted,
      masterVolume: settings.masterVolume,
      musicVolume: settings.musicVolume,
      sfxVolume: settings.sfxVolume
    };

    if (this.settings.muted) {
      this.stopMusic();
    } else if (this.musicPattern) {
      this.startMusic(this.musicPattern.key, this.musicPattern.intensity);
    }
  }

  getChannelVolume(channel, noteVolume) {
    const master = this.settings.masterVolume;
    const specific = channel === 'music' ? this.settings.musicVolume : this.settings.sfxVolume;
    return master * specific * noteVolume;
  }

  playNote({ frequency, duration, volume, type = 'sine', delay = 0 }, channel = 'sfx') {
    if (this.settings.muted) {
      return;
    }

    const context = this.ensureContext();
    if (!context) {
      return;
    }

    const startTime = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const finalVolume = this.getChannelVolume(channel, volume);

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(finalVolume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
  }

  playSound(name) {
    const config = SOUND_MAP[name];
    if (!config) {
      return;
    }

    this.unlock();
    config.notes.forEach((note) => this.playNote(note, 'sfx'));
  }

  startMusic(key, intensity = 0) {
    if (this.settings.muted) {
      return;
    }

    const patternKey = key === 'gameplay' && intensity > 0.55 ? 'gameplayIntense' : key;
    const pattern = MUSIC_PATTERNS[patternKey];
    if (!pattern) {
      return;
    }

    if (this.musicInterval && this.musicPattern?.resolvedKey === patternKey) {
      return;
    }

    this.stopMusic();
    this.musicPattern = { key, intensity, resolvedKey: patternKey };
    this.musicIndex = 0;
    this.unlock();

    const playBeat = () => {
      const frequency = pattern.notes[this.musicIndex % pattern.notes.length];
      this.musicIndex += 1;
      this.playNote({ frequency, duration: pattern.beatMs / 1200, volume: 0.12, type: 'triangle' }, 'music');
    };

    playBeat();
    this.musicInterval = window.setInterval(playBeat, pattern.beatMs);
  }

  stopMusic() {
    if (this.musicInterval) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}
