import { loadSettings } from './persistence.js';

let settings = loadSettings();

let input = {
  left: false,
  right: false,
  pause: false,
  pausePressed: false,
};

let keyMap = {
  left: new Set(settings.controls.left),
  right: new Set(settings.controls.right),
  pause: new Set(settings.controls.pause),
};

function isLeftKey(code) {
  return keyMap.left.has(code);
}

function isRightKey(code) {
  return keyMap.right.has(code);
}

function isPauseKey(code) {
  return keyMap.pause.has(code);
}

function handleKeyDown(e) {
  // Prevent default for game keys to avoid page scrolling
  if (isLeftKey(e.code) || isRightKey(e.code) || isPauseKey(e.code)) {
    e.preventDefault();
  }

  if (isLeftKey(e.code)) {
    input.left = true;
  }
  if (isRightKey(e.code)) {
    input.right = true;
  }
  if (isPauseKey(e.code) && !input.pause) {
    input.pause = true;
    input.pausePressed = true;
  }
}

function handleKeyUp(e) {
  if (isLeftKey(e.code)) {
    input.left = false;
  }
  if (isRightKey(e.code)) {
    input.right = false;
  }
  if (isPauseKey(e.code)) {
    input.pause = false;
  }
}

function handleMouseDown(e) {
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const halfWidth = rect.width / 2;

  if (x < halfWidth) {
    input.left = true;
  } else {
    input.right = true;
  }
}

function handleMouseUp(e) {
  input.left = false;
  input.right = false;
}

function handleMouseMove(e) {
  // No action needed for mouse move
}

function handleTouchStart(e) {
  e.preventDefault();
  const rect = e.target.getBoundingClientRect();

  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    const x = touch.clientX - rect.left;
    const halfWidth = rect.width / 2;

    if (x < halfWidth) {
      input.left = true;
    } else {
      input.right = true;
    }
  }
}

function handleTouchEnd(e) {
  e.preventDefault();

  // Check which sides still have touches
  let leftActive = false;
  let rightActive = false;
  const rect = e.target.getBoundingClientRect();
  const halfWidth = rect.width / 2;

  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    const x = touch.clientX - rect.left;
    if (x < halfWidth) {
      leftActive = true;
    } else {
      rightActive = true;
    }
  }

  input.left = leftActive;
  input.right = rightActive;
}

function handleTouchMove(e) {
  e.preventDefault();
}

export function getInput() {
  return { ...input };
}

export function isPausePressed() {
  const val = input.pausePressed;
  console.log('[Input] isPausePressed() returning:', val);
  return val;
}

export function resetPauseFlag() {
  input.pausePressed = false;
}

export function updateKeyBindings(newSettings) {
  settings = newSettings;
  keyMap.left = new Set(newSettings.controls.left);
  keyMap.right = new Set(newSettings.controls.right);
  keyMap.pause = new Set(newSettings.controls.pause);
}

export function setupInput(canvas) {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mousemove', handleMouseMove);

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

  // Prevent context menu on right click
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Prevent scrolling on mobile
  document.body.addEventListener('touchmove', e => {
    if (e.target === canvas || canvas.contains(e.target)) {
      e.preventDefault();
    }
  }, { passive: false });
}

export function cleanupInput() {
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
}
