import { loadSettings, saveSettings } from './persistence.js';

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let musicOscillators = [];
let isMusicPlaying = false;
let settings = loadSettings();
let musicInterval = null;

function initAudio() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  musicGain = audioCtx.createGain();
  sfxGain = audioCtx.createGain();

  masterGain.connect(audioCtx.destination);
  musicGain.connect(masterGain);
  sfxGain.connect(masterGain);

  updateVolumes();
}

function updateVolumes() {
  if (!masterGain) return;

  const masterVol = settings.muted ? 0 : settings.masterVolume / 100;
  masterGain.gain.setValueAtTime(masterVol, audioCtx.currentTime);

  const musicVol = settings.muted ? 0 : (settings.musicVolume / 100) * masterVol;
  musicGain.gain.setValueAtTime(musicVol, audioCtx.currentTime);

  const sfxVol = settings.muted ? 0 : (settings.sfxVolume / 100) * masterVol;
  sfxGain.gain.setValueAtTime(sfxVol, audioCtx.currentTime);
}

function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// === Sound Effects ===

function playBounce() {
  if (!audioCtx || settings.muted) return;
  resumeAudio();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.15);
}

function playSpring() {
  if (!audioCtx || settings.muted) return;
  resumeAudio();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.25);
}

function playBreak() {
  if (!audioCtx || settings.muted) return;
  resumeAudio();

  const bufferSize = audioCtx.sampleRate * 0.15;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();

  source.buffer = buffer;
  source.connect(gain);
  gain.connect(sfxGain);

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

  source.start(audioCtx.currentTime);
}

function playMonster() {
  if (!audioCtx || settings.muted) return;
  resumeAudio();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.4);

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.4);
}

function playCoin() {
  if (!audioCtx || settings.muted) return;
  resumeAudio();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.15);
}

function playPowerup() {
  if (!audioCtx || settings.muted) return;
  resumeAudio();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(500, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.3);

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.35);
}

function playGameOver() {
  if (!audioCtx || settings.muted) return;
  resumeAudio();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.8);

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.8);
}

function playMenuSelect() {
  if (!audioCtx || settings.muted) return;
  resumeAudio();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.1);
}

function playMenuNavigate() {
  if (!audioCtx || settings.muted) return;
  resumeAudio();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(500, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.05);
}

function playPause() {
  if (!audioCtx || settings.muted) return;
  resumeAudio();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.setValueAtTime(300, audioCtx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.15);
}

function playHighScore() {
  if (!audioCtx || settings.muted) return;
  resumeAudio();

  [523, 659, 784].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);

    gain.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.15);
    gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + i * 0.15 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.3);

    osc.start(audioCtx.currentTime + i * 0.15);
    osc.stop(audioCtx.currentTime + i * 0.15 + 0.3);
  });
}

// === Music ===

const MENU_MELODY = [
  { freq: 523, dur: 0.2 },
  { freq: 659, dur: 0.2 },
  { freq: 784, dur: 0.2 },
  { freq: 659, dur: 0.2 },
  { freq: 523, dur: 0.2 },
  { freq: 392, dur: 0.2 },
  { freq: 440, dur: 0.2 },
  { freq: 523, dur: 0.4 },
];

const GAME_MELODY = [
  { freq: 330, dur: 0.15 },
  { freq: 392, dur: 0.15 },
  { freq: 440, dur: 0.15 },
  { freq: 523, dur: 0.15 },
  { freq: 440, dur: 0.15 },
  { freq: 392, dur: 0.15 },
  { freq: 330, dur: 0.15 },
  { freq: 294, dur: 0.15 },
  { freq: 330, dur: 0.15 },
  { freq: 392, dur: 0.15 },
  { freq: 440, dur: 0.3 },
];

let melodyIndex = 0;
let melodyTimer = null;
let currentMelody = MENU_MELODY;

function playMelodyNote() {
  if (!audioCtx || settings.muted || !isMusicPlaying) return;

  const note = currentMelody[melodyIndex];
  if (!note) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(musicGain);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(note.freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + note.dur * 0.9);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + note.dur);

  melodyIndex = (melodyIndex + 1) % currentMelody.length;
}

function startGameMusic(type) {
  stopMusic();

  if (!audioCtx || settings.muted) return;
  resumeAudio();

  currentMelody = type === 'menu' ? MENU_MELODY : GAME_MELODY;
  melodyIndex = 0;
  isMusicPlaying = true;

  playMelodyNote();
  const interval = currentMelody[0] ? currentMelody[0].dur * 1000 : 200;
  melodyTimer = setInterval(playMelodyNote, interval);
}

function stopMusic() {
  isMusicPlaying = false;
  if (melodyTimer) {
    clearInterval(melodyTimer);
    melodyTimer = null;
  }
}

// === Settings Management ===

export function toggleMute() {
  settings.muted = !settings.muted;
  saveSettings(settings);
  updateVolumes();
  if (settings.muted) {
    stopMusic();
    showMuteIndicator();
  } else {
    hideMuteIndicator();
    if (window._currentMusicType) {
      startGameMusic(window._currentMusicType);
    }
  }
  return settings.muted;
}

export function updateSetting(key, value) {
  settings[key] = value;
  saveSettings(settings);
  if (audioCtx) {
    updateVolumes();
  }
}

export function getSettings() {
  return { ...settings };
}

export function initSettingsUI() {
  const masterVol = document.getElementById('master-volume');
  const musicVol = document.getElementById('music-volume');
  const sfxVol = document.getElementById('sfx-volume');
  const muteCheck = document.getElementById('mute-checkbox');
  const reducedMotion = document.getElementById('reduced-motion');
  const reducedEffects = document.getElementById('reduced-effects');
  const paperTexture = document.getElementById('paper-texture');

  if (masterVol) masterVol.value = settings.masterVolume;
  if (musicVol) musicVol.value = settings.musicVolume;
  if (sfxVol) sfxVol.value = settings.sfxVolume;
  if (muteCheck) muteCheck.checked = settings.muted;
  if (reducedMotion) reducedMotion.checked = settings.reducedMotion;
  if (reducedEffects) reducedEffects.checked = settings.reducedEffects;
  if (paperTexture) paperTexture.checked = settings.paperTexture;

  updateVolumeDisplays();
}

function updateVolumeDisplays() {
  const masterVal = document.getElementById('master-volume-val');
  const musicVal = document.getElementById('music-volume-val');
  const sfxVal = document.getElementById('sfx-volume-val');

  if (masterVal) masterVal.textContent = document.getElementById('master-volume').value + '%';
  if (musicVal) musicVal.textContent = document.getElementById('music-volume').value + '%';
  if (sfxVal) sfxVal.textContent = document.getElementById('sfx-volume').value + '%';
}

export function setupSettingsListeners() {
  document.getElementById('master-volume').addEventListener('input', (e) => {
    updateSetting('masterVolume', parseInt(e.target.value));
    updateVolumeDisplays();
  });

  document.getElementById('music-volume').addEventListener('input', (e) => {
    updateSetting('musicVolume', parseInt(e.target.value));
    updateVolumeDisplays();
  });

  document.getElementById('sfx-volume').addEventListener('input', (e) => {
    updateSetting('sfxVolume', parseInt(e.target.value));
    updateVolumeDisplays();
  });

  document.getElementById('mute-checkbox').addEventListener('change', (e) => {
    updateSetting('muted', e.target.checked);
    if (audioCtx) updateVolumes();
    if (e.target.checked) {
      stopMusic();
      showMuteIndicator();
    } else {
      hideMuteIndicator();
      if (window._currentMusicType) startGameMusic(window._currentMusicType);
    }
  });

  document.getElementById('reduced-motion').addEventListener('change', (e) => {
    updateSetting('reducedMotion', e.target.checked);
  });

  document.getElementById('reduced-effects').addEventListener('change', (e) => {
    updateSetting('reducedEffects', e.target.checked);
  });

  document.getElementById('paper-texture').addEventListener('change', (e) => {
    updateSetting('paperTexture', e.target.checked);
  });

  // Control rebinding
  setupRebindButton('rebind-left', 'left');
  setupRebindButton('rebind-right', 'right');
  setupRebindButton('rebind-pause', 'pause');
}

function setupRebindButton(buttonId, action) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.addEventListener('click', () => {
    btn.textContent = '...';
    btn.disabled = true;

    const handler = (e) => {
      e.preventDefault();
      document.removeEventListener('keydown', handler);

      settings.controls[action] = [e.code];
      saveSettings(settings);
      btn.textContent = e.code;
      btn.disabled = false;

      if (window.updateKeyBindings) {
        window.updateKeyBindings(settings);
      }
    };

    document.addEventListener('keydown', handler, { once: false });
  });
}

function showMuteIndicator() {
  const indicator = document.getElementById('mute-indicator');
  if (indicator) {
    indicator.classList.remove('hidden');
    setTimeout(() => indicator.classList.add('hidden'), 1500);
  }
}

function hideMuteIndicator() {
  const indicator = document.getElementById('mute-indicator');
  if (indicator) indicator.classList.add('hidden');
}

// === Public API ===

export function playSFX(type) {
  switch (type) {
    case 'bounce': playBounce(); break;
    case 'spring': playSpring(); break;
    case 'break': playBreak(); break;
    case 'monster': playMonster(); break;
    case 'coin': playCoin(); break;
    case 'powerup': playPowerup(); break;
    case 'gameover': playGameOver(); break;
    case 'menuSelect': playMenuSelect(); break;
    case 'menuNavigate': playMenuNavigate(); break;
    case 'pause': playPause(); break;
    case 'highscore': playHighScore(); break;
  }
}

export function startMusic(type) {
  window._currentMusicType = type;
  startGameMusic(type);
}

export function stopGameMusic() {
  stopMusic();
  window._currentMusicType = null;
}

export { initAudio, getSettings as getAudioSettings, updateVolumes };

// Expose audioCtx for resume
export function getAudioContext() {
  return audioCtx;
}
