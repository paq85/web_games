/**
 * Audio system using Web Audio API for procedural sound generation.
 */
const Audio = (function() {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let muted = false;
  let musicVolume = 0.7;
  let sfxVolume = 0.8;
  let masterVolume = 0.8;
  let musicOscillators = [];
  let musicPlaying = false;
  let currentMusicType = 'menu';

  function init() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = musicVolume;
      musicGain.connect(masterGain);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = sfxVolume;
      sfxGain.connect(masterGain);
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  function ensureCtx() {
    if (!ctx) init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function setVolumes(master, music, sfx) {
    masterVolume = master;
    musicVolume = music;
    sfxVolume = sfx;
    if (masterGain) masterGain.gain.value = muted ? 0 : masterVolume;
    if (musicGain) musicGain.gain.value = musicVolume;
    if (sfxGain) sfxGain.gain.value = sfxVolume;
  }

  function setMute(value) {
    muted = value;
    if (masterGain) masterGain.gain.value = muted ? 0 : masterVolume;
  }

  // --- Sound Effects ---
  function playTone(freq, duration, type, volume, dest) {
    ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.value = (volume || 0.3) * (muted ? 0 : 1);
    osc.connect(gain);
    gain.connect(dest || sfxGain);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  }

  function playNoise(duration, volume) {
    ensureCtx();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = (volume || 0.2) * (muted ? 0 : 1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(sfxGain);
    source.start();
  }

  const SFX = {
    menuNavigate: () => playTone(600, 0.05, 'square', 0.15),
    menuConfirm: () => { playTone(800, 0.08, 'square', 0.2); setTimeout(() => playTone(1200, 0.1, 'square', 0.2), 50); },
    countdown: () => playTone(440, 0.15, 'square', 0.2),
    countdownGo: () => playTone(880, 0.3, 'square', 0.3),
    serve: () => playTone(500, 0.1, 'triangle', 0.2),
    paddleHit: () => playTone(300 + Math.random() * 200, 0.08, 'square', 0.25),
    wallHit: () => playTone(200, 0.06, 'triangle', 0.15),
    pointScore: () => { playTone(523, 0.1, 'square', 0.3); setTimeout(() => playTone(659, 0.1, 'square', 0.3), 80); setTimeout(() => playTone(784, 0.15, 'square', 0.3), 160); },
    pointConcede: () => playTone(200, 0.3, 'sawtooth', 0.2),
    pause: () => playTone(400, 0.1, 'triangle', 0.15),
    resume: () => playTone(600, 0.1, 'triangle', 0.15),
    settingsChange: () => playTone(700, 0.05, 'square', 0.1),
    matchWin: () => {
      const notes = [523, 659, 784, 1047];
      notes.forEach((n, i) => setTimeout(() => playTone(n, 0.2, 'square', 0.3), i * 120));
    },
    matchLose: () => {
      const notes = [400, 350, 300, 200];
      notes.forEach((n, i) => setTimeout(() => playTone(n, 0.25, 'sawtooth', 0.2), i * 150));
    },
    particle: () => playNoise(0.05, 0.05),
  };

  // --- Background Music ---
  function stopMusic() {
    musicOscillators.forEach(osc => { try { osc.stop(); } catch(e) {} });
    musicOscillators = [];
    musicPlaying = false;
  }

  function playMenuMusic() {
    ensureCtx();
    if (!ctx || musicPlaying && currentMusicType === 'menu') return;
    stopMusic();
    currentMusicType = 'menu';
    musicPlaying = true;

    // Simple looping melody
    const melody = [262, 294, 330, 349, 330, 294, 262, 220];
    let noteIndex = 0;

    function playNote() {
      if (!musicPlaying || currentMusicType !== 'menu') return;
      const freq = melody[noteIndex % melody.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.value = 0.06;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(musicGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      musicOscillators.push(osc);
      noteIndex++;
      setTimeout(playNote, 400);
    }
    playNote();
  }

  function playGameMusic() {
    ensureCtx();
    if (!ctx || musicPlaying && currentMusicType === 'game') return;
    stopMusic();
    currentMusicType = 'game';
    musicPlaying = true;

    const bass = [130, 146, 164, 146, 130, 110, 130, 146];
    let noteIndex = 0;

    function playNote() {
      if (!musicPlaying || currentMusicType !== 'game') return;
      const freq = bass[noteIndex % bass.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(musicGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      musicOscillators.push(osc);
      noteIndex++;
      setTimeout(playNote, 350);
    }
    playNote();
  }

  function stopAll() {
    stopMusic();
  }

  return {
    init,
    setVolumes,
    setMute,
    SFX,
    playMenuMusic,
    playGameMusic,
    stopMusic,
    stopAll,
  };
})();
