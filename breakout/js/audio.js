/**
 * Audio manager - Web Audio API synthesized sounds
 */

let audioContext = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let musicOscillators = [];
let musicPlaying = false;

export function initAudio() {
  if (audioContext) return;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);

    musicGain = audioContext.createGain();
    musicGain.connect(masterGain);

    sfxGain = audioContext.createGain();
    sfxGain.connect(masterGain);
  } catch (e) {
    // Audio not supported
  }
}

export function setVolumes(masterVol, musicVol, sfxVol) {
  if (!masterGain || !musicGain || !sfxGain) return;
  masterGain.gain.setValueAtTime(masterVol, audioContext.currentTime);
  musicGain.gain.setValueAtTime(musicVol, audioContext.currentTime);
  sfxGain.gain.setValueAtTime(sfxVol, audioContext.currentTime);
}

export function resumeAudio() {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

// ===== Sound Effects =====

export function playSound(type) {
  if (!audioContext || !sfxGain) return;
  resumeAudio();

  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(sfxGain);

  switch (type) {
    case 'ball_launch':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'paddle_hit':
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
      break;

    case 'wall_bounce':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
      break;

    case 'brick_destroy':
      osc.type = 'square';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
      break;

    case 'brick_reinforced':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;

    case 'brick_unbreakable':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case 'powerup_collect':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.08);
      osc.frequency.setValueAtTime(784, now + 0.16);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
      break;

    case 'powerup_expire':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;

    case 'level_complete':
      playMelody([523, 659, 784, 1047], 0.12, now);
      return;

    case 'game_over':
      playMelody([400, 350, 300, 200], 0.2, now);
      return;

    case 'menu_navigate':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
      break;

    case 'menu_confirm':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.06);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
      break;

    case 'pause':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.setValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'laser':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
      break;

    case 'countdown':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'countdown_go':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;

    default:
      osc.start(now);
      osc.stop(now + 0.05);
  }
}

function playMelody(notes, duration, startTime) {
  if (!audioContext) return;
  notes.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.type = 'sine';
    const t = startTime + i * duration;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  });
}

// ===== Background Music =====

export function startMusic(context) {
  if (!audioContext || musicPlaying) return;
  resumeAudio();
  musicPlaying = true;
  playMusicLoop(context);
}

export function stopMusic() {
  musicPlaying = false;
  musicOscillators.forEach(osc => {
    try { osc.stop(); } catch (e) {}
  });
  musicOscillators = [];
}

function playMusicLoop(context) {
  if (!musicPlaying || !audioContext) return;

  // Simple ambient loop - bass drone + high shimmer
  const now = audioContext.currentTime;
  const duration = 4; // 4 second loop

  // Bass drone
  const bass = audioContext.createOscillator();
  const bassGain = audioContext.createGain();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(55, now); // A1
  bassGain.gain.setValueAtTime(0.08, now);
  bassGain.gain.setValueAtTime(0.08, now + duration - 0.5);
  bassGain.gain.linearRampToValueAtTime(0, now + duration);
  bass.connect(bassGain);
  bassGain.connect(musicGain);
  bass.start(now);
  bass.stop(now + duration);
  musicOscillators.push(bass);

  // High shimmer
  const high = audioContext.createOscillator();
  const highGain = audioContext.createGain();
  high.type = 'sine';
  high.frequency.setValueAtTime(440, now);
  high.frequency.setValueAtTime(523, now + 1);
  high.frequency.setValueAtTime(587, now + 2);
  high.frequency.setValueAtTime(659, now + 3);
  highGain.gain.setValueAtTime(0.03, now);
  highGain.gain.setValueAtTime(0.03, now + duration - 0.5);
  highGain.gain.linearRampToValueAtTime(0, now + duration);
  high.connect(highGain);
  highGain.connect(musicGain);
  high.start(now);
  high.stop(now + duration);
  musicOscillators.push(high);

  // Schedule next loop
  setTimeout(() => {
    if (musicPlaying) playMusicLoop(context);
  }, duration * 1000);
}
