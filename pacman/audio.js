/**
 * Procedural Audio Engine for Pacman
 *
 * All audio is generated using the Web Audio API — no external files.
 * Exports an `AudioEngine` class with sound effects, background music,
 * volume controls, mute toggle, and localStorage persistence.
 */

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------
const STORAGE_KEY = "pacman_audio_settings";

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* ignore */ }
  return null;
}

function saveSettings(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (_) { /* ignore */ }
}

// ---------------------------------------------------------------------------
// AudioEngine
// ---------------------------------------------------------------------------
export class AudioEngine {
  // ---- Constructor --------------------------------------------------------
  constructor() {
    this._ctx = null;          // AudioContext (lazy)
    this._masterGain = null;   // Master GainNode
    this._musicGain = null;    // Music bus GainNode
    this._effectsGain = null;  // Effects bus GainNode

    // Volume state  (0 – 1)
    this._masterVolume = 0.7;
    this._musicVolume = 0.6;
    this._effectsVolume = 0.8;
    this._muted = false;

    // Music scheduling
    this._musicTimer = null;
    this._musicPlaying = false;
    this._musicScheduleId = null;

    // Waka-waka state
    this._wakaAlt = false;     // alternation flag
    this._wakaTimer = null;

    // Load persisted settings
    const saved = loadSettings();
    if (saved) {
      if (typeof saved.masterVolume === "number") this._masterVolume = saved.masterVolume;
      if (typeof saved.musicVolume === "number") this._musicVolume = saved.musicVolume;
      if (typeof saved.effectsVolume === "number") this._effectsVolume = saved.effectsVolume;
      if (typeof saved.muted === "boolean") this._muted = saved.muted;
    }
  }

  // ---- Lazy AudioContext initialisation -----------------------------------
  _ensureCtx() {
    if (!this._ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return; // browser does not support Web Audio

      this._ctx = new Ctx();

      // Master gain (sits at top of the tree)
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = this._muted ? 0 : this._masterVolume;
      this._masterGain.connect(this._ctx.destination);

      // Music bus
      this._musicGain = this._ctx.createGain();
      this._musicGain.gain.value = this._musicVolume;
      this._musicGain.connect(this._masterGain);

      // Effects bus
      this._effectsGain = this._ctx.createGain();
      this._effectsGain.gain.value = this._effectsVolume;
      this._effectsGain.connect(this._masterGain);
    }
    // Resume if suspended (autoplay policy)
    if (this._ctx && this._ctx.state === "suspended") {
      this._ctx.resume();
    }
  }

  // ---- Public initialisation (call on first user gesture) -----------------
  init() {
    this._ensureCtx();
  }

  // ---- Volume control -----------------------------------------------------
  setMasterVolume(vol) {
    this._masterVolume = Math.max(0, Math.min(1, vol));
    if (this._masterGain) {
      this._masterGain.gain.value = this._muted ? 0 : this._masterVolume;
    }
    saveSettings(this._persistState());
  }

  setMusicVolume(vol) {
    this._musicVolume = Math.max(0, Math.min(1, vol));
    if (this._musicGain) {
      this._musicGain.gain.value = this._musicVolume;
    }
    saveSettings(this._persistState());
  }

  setEffectsVolume(vol) {
    this._effectsVolume = Math.max(0, Math.min(1, vol));
    if (this._effectsGain) {
      this._effectsGain.gain.value = this._effectsVolume;
    }
    saveSettings(this._persistState());
  }

  getMasterVolume() { return this._masterVolume; }
  getMusicVolume()  { return this._musicVolume; }
  getEffectsVolume(){ return this._effectsVolume; }

  setMuted(muted) {
    this._muted = !!muted;
    if (this._masterGain) {
      this._masterGain.gain.value = this._muted ? 0 : this._masterVolume;
    }
    saveSettings(this._persistState());
  }

  isMuted() { return this._muted; }

  // ---- Persistence helper -------------------------------------------------
  _persistState() {
    return {
      masterVolume: this._masterVolume,
      musicVolume: this._musicVolume,
      effectsVolume: this._effectsVolume,
      muted: this._muted,
    };
  }

  // ---- Helper: create oscillator with envelope ----------------------------
  _tone(freq, type, duration, destination, volume = 0.3) {
    this._ensureCtx();
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this._ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(destination);
    osc.start();
    osc.stop(this._ctx.currentTime + duration + 0.01);
    return { osc, gain };
  }

  // ---- Helper: play a sequence of notes through a destination ------------
  _playNotes(notes, destination, noteLen = 0.12, gap = 0.02, vol = 0.25, type = "square") {
    this._ensureCtx();
    const bus = this._ctx.createGain();
    bus.gain.value = 1;
    bus.connect(destination);
    let t = this._ctx.currentTime;
    for (const n of notes) {
      if (n === null) {
        t += noteLen + gap;
        continue;
      }
      this._tone(n, type, noteLen, bus, vol);
      t += noteLen + gap;
    }
    return bus;
  }

  // =========================================================================
  // SOUND EFFECTS
  // =========================================================================

  /** Waka-waka — alternating low-frequency oscillators */
  playWaka() {
    this._ensureCtx();
    const freq = this._wakaAlt ? 150 : 100;
    this._wakaAlt = !this._wakaAlt;
    this._tone(freq, "sawtooth", 0.08, this._effectsGain, 0.15);
  }

  /** Dot eaten — short high-pitched beep */
  playDotEat() {
    this._ensureCtx();
    this._tone(600, "sine", 0.06, this._effectsGain, 0.12);
  }

  /** Power pellet eaten — deep tone with echo */
  playPowerPellet() {
    this._ensureCtx();
    const t = this._ctx.currentTime;
    // Main descending tone
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.4);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.setValueAtTime(0.3, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(this._effectsGain);
    osc.start(t);
    osc.stop(t + 0.55);

    // Echo (delayed repeat)
    const osc2 = this._ctx.createOscillator();
    const gain2 = this._ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(400, t + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(80, t + 0.55);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.setValueAtTime(0.15, t + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc2.connect(gain2);
    gain2.connect(this._effectsGain);
    osc2.start(t + 0.15);
    osc2.stop(t + 0.65);
  }

  /** Ghost eaten — siren-like rising pitch */
  playGhostEat() {
    this._ensureCtx();
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.35);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.setValueAtTime(0.25, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(this._effectsGain);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  /** Life lost — sad descending arpeggio */
  playDeath() {
    this._ensureCtx();
    // Descending minor arpeggio: E4 → C4 → G3 → E3 → C3 → A2
    const notes = [329.63, 261.63, 196.00, 164.81, 130.81, 110.00];
    this._playNotes(notes, this._effectsGain, 0.2, 0.05, 0.25, "triangle");
  }

  /** Level completed — celebratory fanfare */
  playLevelComplete() {
    this._ensureCtx();
    // Ascending major fanfare: C4 → D4 → E4 → G4 → C5
    const notes = [261.63, 293.66, 329.63, 392.00, 523.25];
    this._playNotes(notes, this._effectsGain, 0.18, 0.04, 0.3, "square");
    // Hold final note longer
    setTimeout(() => {
      this._tone(523.25, "square", 0.5, this._effectsGain, 0.25);
    }, (0.18 + 0.04) * 1000 * 4);
  }

  /** Bonus fruit collected — bright chime with harmonics */
  playFruitCollect() {
    this._ensureCtx();
    const t = this._ctx.currentTime;
    // Fundamental + 2 harmonics for chime quality
    const freqs = [880, 1760, 2640];
    const vols =  [0.2, 0.08, 0.04];
    freqs.forEach((f, i) => {
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(vols[i], t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(this._effectsGain);
      osc.start(t);
      osc.stop(t + 0.65);
    });
    // Second chime note
    setTimeout(() => {
      this._ensureCtx();
      const t2 = this._ctx.currentTime;
      [1100, 2200].forEach((f, i) => {
        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        gain.gain.setValueAtTime(i === 0 ? 0.18 : 0.06, t2);
        gain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.5);
        osc.connect(gain);
        gain.connect(this._effectsGain);
        osc.start(t2);
        osc.stop(t2 + 0.55);
      });
    }, 150);
  }

  /** Menu navigation — short blip */
  playMenuClick() {
    this._ensureCtx();
    this._tone(800, "sine", 0.04, this._effectsGain, 0.1);
  }

  /** Menu confirmation — pleasant tone */
  playMenuConfirm() {
    this._ensureCtx();
    // Two-note pleasant confirmation
    this._tone(523.25, "sine", 0.1, this._effectsGain, 0.15);
    setTimeout(() => {
      this._tone(659.25, "sine", 0.15, this._effectsGain, 0.15);
    }, 80);
  }

  /** Achievement unlocked — bright ascending chime C5 → E5 → G5 → C6 */
  playAchievement() {
    this._ensureCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this._tone(freq, "square", 0.1, this._effectsGain, 0.2);
      }, i * 100);
    });
  }

  /** Pause — distinct whoosh-down */
  playPause() {
    this._ensureCtx();
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this._effectsGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  /** Resume — whoosh-up */
  playResume() {
    this._ensureCtx();
    const t = this._ctx.currentTime;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.2);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this._effectsGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // =========================================================================
  // BACKGROUND MUSIC
  // =========================================================================

  /** Stop any currently running background music */
  stopMusic() {
    this._musicPlaying = false;
    if (this._musicScheduleId) {
      clearTimeout(this._musicScheduleId);
      this._musicScheduleId = null;
    }
    if (this._wakaTimer) {
      clearInterval(this._wakaTimer);
      this._wakaTimer = null;
    }
  }

  /** Start menu background music — upbeat arcade-style loop */
  startMenuMusic() {
    this.stopMusic();
    this._ensureCtx();
    this._musicPlaying = true;

    // Simple upbeat 8-note melody (C major) — fast tempo
    const melody = [
      523.25, 587.33, 659.25, 698.46, // C5 D5 E5 F5
      659.25, 587.33, 523.25, 493.88, // E5 D5 C5 B4
      523.25, 587.33, 659.25, 783.99, // C5 D5 E5 G5
      698.46, 659.25, 587.33, 523.25, // F5 E5 D5 C5
    ];

    // Bass line (lower octave, slower)
    const bass = [
      130.81, 130.81, 146.83, 146.83, // C3 C3 D3 D3
      164.81, 164.81, 174.61, 174.61, // E3 E3 F3 F3
      130.81, 130.81, 196.00, 196.00, // C3 C3 G3 G3
      174.61, 164.81, 146.83, 130.81, // F3 E3 D3 C3
    ];

    const noteLen = 0.12; // 120ms per note (fast arcade tempo)
    let idx = 0;

    const scheduleTick = () => {
      if (!this._musicPlaying || !this._ctx) return;

      const t = this._ctx.currentTime;

      // Melody note
      const mOsc = this._ctx.createOscillator();
      const mGain = this._ctx.createGain();
      mOsc.type = "square";
      mOsc.frequency.value = melody[idx % melody.length];
      mGain.gain.setValueAtTime(0.06, t);
      mGain.gain.setValueAtTime(0.06, t + noteLen * 0.7);
      mGain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);
      mOsc.connect(mGain);
      mGain.connect(this._musicGain);
      mOsc.start(t);
      mOsc.stop(t + noteLen + 0.01);

      // Bass note (every 2 melody notes)
      if (idx % 2 === 0) {
        const bOsc = this._ctx.createOscillator();
        const bGain = this._ctx.createGain();
        bOsc.type = "triangle";
        bOsc.frequency.value = bass[Math.floor(idx / 2) % bass.length];
        bGain.gain.setValueAtTime(0.08, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 2);
        bOsc.connect(bGain);
        bGain.connect(this._musicGain);
        bOsc.start(t);
        bOsc.stop(t + noteLen * 2 + 0.01);
      }

      idx++;
      this._musicScheduleId = setTimeout(scheduleTick, noteLen * 1000);
    };

    scheduleTick();
  }

  /** Start gameplay background music — adaptive intensity loop */
  startGameMusic() {
    this.stopMusic();
    this._ensureCtx();
    this._musicPlaying = true;

    // Slower, more atmospheric melody for gameplay
    // Uses a pentatonic-ish pattern that doesn't distract
    const melody = [
      392.00, 440.00, 493.88, 523.25, // G4 A4 B4 C5
      493.88, 440.00, 392.00, 349.23, // B4 A4 G4 F4
      329.63, 349.23, 392.00, 440.00, // E4 F4 G4 A4
      392.00, 349.23, 329.63, 293.66, // G4 F4 E4 D4
    ];

    const bass = [
      130.81, 130.81, 130.81, 130.81, // C3
      174.61, 174.61, 174.61, 174.61, // F3
      146.83, 146.83, 146.83, 146.83, // D3
      130.81, 130.81, 130.81, 130.81, // C3
    ];

    const noteLen = 0.18; // 180ms — slower, more relaxed
    let idx = 0;

    const scheduleTick = () => {
      if (!this._musicPlaying || !this._ctx) return;

      const t = this._ctx.currentTime;

      // Melody — quieter to not distract from SFX
      const mOsc = this._ctx.createOscillator();
      const mGain = this._ctx.createGain();
      mOsc.type = "triangle";
      mOsc.frequency.value = melody[idx % melody.length];
      mGain.gain.setValueAtTime(0.04, t);
      mGain.gain.setValueAtTime(0.04, t + noteLen * 0.6);
      mGain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);
      mOsc.connect(mGain);
      mGain.connect(this._musicGain);
      mOsc.start(t);
      mOsc.stop(t + noteLen + 0.01);

      // Bass (every 4 melody notes)
      if (idx % 4 === 0) {
        const bOsc = this._ctx.createOscillator();
        const bGain = this._ctx.createGain();
        bOsc.type = "sine";
        bOsc.frequency.value = bass[Math.floor(idx / 4) % bass.length];
        bGain.gain.setValueAtTime(0.06, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 4);
        bOsc.connect(bGain);
        bGain.connect(this._musicGain);
        bOsc.start(t);
        bOsc.stop(t + noteLen * 4 + 0.01);
      }

      idx++;
      this._musicScheduleId = setTimeout(scheduleTick, noteLen * 1000);
    };

    scheduleTick();
  }

  /** Play game over music — sad descending melody loop */
  playGameOverMusic() {
    this.stopMusic();
    this._ensureCtx();
    this._musicPlaying = true;

    // Sad descending minor pattern
    const melody = [
      329.63, 293.66, 261.63, 246.94, // E4 D4 C4 B3
      220.00, 196.00, 174.61, 164.81, // A3 G3 F3 E3
    ];

    const noteLen = 0.3; // 300ms per note (slow, sad tempo)
    let idx = 0;

    const scheduleTick = () => {
      if (!this._musicPlaying || !this._ctx) return;

      const t = this._ctx.currentTime;
      const mOsc = this._ctx.createOscillator();
      const mGain = this._ctx.createGain();
      mOsc.type = "triangle";
      mOsc.frequency.value = melody[idx % melody.length];
      mGain.gain.setValueAtTime(0.04, t);
      mGain.gain.setValueAtTime(0.04, t + noteLen * 0.7);
      mGain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);
      mOsc.connect(mGain);
      mGain.connect(this._musicGain);
      mOsc.start(t);
      mOsc.stop(t + noteLen + 0.01);

      idx++;
      this._musicScheduleId = setTimeout(scheduleTick, noteLen * 1000);
    };

    scheduleTick();
  }

}
