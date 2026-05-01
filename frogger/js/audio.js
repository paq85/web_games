// Audio manager - procedural sound effects via Web Audio API

const MUTE_KEY = 'frogger_audio_muted';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = this.loadMuteState();
    this.masterGain = null;
    this.initialized = false;
    this.musicPlaying = false;
    this.musicInterval = null;
  }

  /**
   * Initialize audio context on first user gesture.
   */
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this.muted ? 0 : 0.5;
      this.initialized = true;
    } catch {
      // Audio not supported
    }
  }

  /**
   * Toggle mute state.
   */
  toggleMute() {
    this.muted = !this.muted;
    this.saveMuteState();
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.5;
    }
    return this.muted;
  }

  /**
   * Play a simple tone.
   */
  playTone(freq, duration, type = 'square', volume = 0.3) {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  /**
   * Play a sequence of tones.
   */
  playSequence(freqs, duration = 0.1, type = 'square', volume = 0.2) {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    let time = this.ctx.currentTime;
    for (const freq of freqs) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + duration);
      time += duration;
    }
  }

  /**
   * Sound: frog hop (ascending frequency ramp 400Hz → 800Hz)
   */
  playHop() {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
    gain.gain.value = 0.2;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  /**
   * Sound: turtle dive (subtle bubbling)
   */
  playTurtleDive() {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const freqs = [200, 250, 200];
    let time = this.ctx.currentTime;
    for (const freq of freqs) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.05);
      time += 0.05;
    }
  }

  /**
   * Sound: frog death (road)
   */
  playDeathRoad() {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
    gain.gain.value = 0.2;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  /**
   * Sound: frog death (river - splash)
   */
  playDeathRiver() {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.3;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  /**
   * Sound: home slot reached
   */
  playHome() {
    this.playSequence([523, 659, 784], 0.1, 'sine', 0.25);
  }

  /**
   * Sound: ladybug collected
   */
  playLadybug() {
    this.playSequence([880, 1100, 1320], 0.06, 'sine', 0.2);
  }

  /**
   * Sound: level complete
   */
  playLevelComplete() {
    this.playSequence([523, 659, 784, 1047], 0.15, 'square', 0.2);
  }

  /**
   * Sound: game over
   */
  playGameOver() {
    this.playSequence([400, 350, 300, 200], 0.2, 'sawtooth', 0.15);
  }

  /**
   * Sound: timer warning (3 quick 880Hz pulses with 0.08s gaps)
   */
  playTimerWarning() {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const noteLen = 0.08;
    let time = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + noteLen);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + noteLen);
      time += noteLen + 0.08;
    }
  }

  /**
   * Sound: pause
   */
  playPause() {
    this.playTone(220, 0.15, 'triangle', 0.2);
  }

  /**
   * Sound: resume
   */
  playResume() {
    this.playTone(440, 0.15, 'triangle', 0.2);
  }

  /**
   * Start looping gameplay music (bass melody: A2, C3, A2, G2)
   */
  startGameplayMusic() {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stopMusic();

    this.musicPlaying = true;
    const notes = [110, 130, 110, 98];
    const noteDuration = 0.4;
    let noteIndex = 0;

    const playNext = () => {
      if (!this.musicPlaying || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = notes[noteIndex % notes.length];
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + noteDuration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + noteDuration);
      noteIndex++;
    };

    playNext();
    this.musicInterval = setInterval(playNext, noteDuration * 1000);
  }

  /**
   * Start looping idle music (simpler melody: A3, C4, E4)
   */
  startIdleMusic() {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stopMusic();

    this.musicPlaying = true;
    const notes = [220, 261, 329];
    const noteDuration = 0.5;
    let noteIndex = 0;

    const playNext = () => {
      if (!this.musicPlaying || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[noteIndex % notes.length];
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + noteDuration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + noteDuration);
      noteIndex++;
    };

    playNext();
    this.musicInterval = setInterval(playNext, noteDuration * 1000);
  }

  /**
   * Stop any playing background music.
   */
  stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  /**
   * Stop all audio (music, useful for pause/game over).
   */
  stopAll() {
    this.stopMusic();
  }

  /**
   * Load mute state from localStorage.
   */
  loadMuteState() {
    try {
      return localStorage.getItem(MUTE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Save mute state to localStorage.
   */
  saveMuteState() {
    try {
      localStorage.setItem(MUTE_KEY, this.muted.toString());
    } catch {
      // localStorage not available
    }
  }
}
