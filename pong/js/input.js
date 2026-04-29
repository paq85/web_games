/**
 * Input handling with support for control rebinding, mouse, and touch.
 */
const Input = (function() {
  const keys = {};
  const justPressed = {};

  // Mouse state
  let mouseDown = false;
  let mouseX = 0;
  let mouseY = 0;
  let mouseJustClicked = false;

  // Touch state
  const touchZones = { p1: null, p2: null };
  let touchJustTapped = false;
  let touchTapSide = null;

  // Canvas reference (set by init)
  let canvasEl = null;

  function onKeyDown(e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.code)) {
      e.preventDefault();
    }
    if (!keys[e.code]) {
      justPressed[e.code] = true;
    }
    keys[e.code] = true;
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function onMouseDown(e) {
    mouseDown = true;
    mouseJustClicked = true;
    updateMousePos(e);
  }

  function onMouseUp(e) {
    mouseDown = false;
  }

  function onMouseMove(e) {
    updateMousePos(e);
  }

  function updateMousePos(e) {
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width;
    mouseY = (e.clientY - rect.top) / rect.height;
  }

  function onTouchStart(e) {
    e.preventDefault();
    touchJustTapped = true;

    for (const touch of e.changedTouches) {
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const nx = (touch.clientX - rect.left) / rect.width;
      const ny = (touch.clientY - rect.top) / rect.height;

      if (nx < 0.5) {
        touchZones.p1 = { x: nx, y: ny, prevY: ny, id: touch.identifier };
        touchTapSide = 'p1';
      } else {
        touchZones.p2 = { x: nx, y: ny, prevY: ny, id: touch.identifier };
        touchTapSide = 'p2';
      }
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      const ny = (touch.clientY - rect.top) / rect.height;

      for (const zone of ['p1', 'p2']) {
        const z = touchZones[zone];
        if (z && z.id === touch.identifier) {
          z.prevY = z.y;
          z.y = ny;
        }
      }
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      for (const zone of ['p1', 'p2']) {
        const z = touchZones[zone];
        if (z && z.id === touch.identifier) {
          touchZones[zone] = null;
        }
      }
    }
  }

  function init() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    canvasEl = document.getElementById('game-canvas');

    // Mouse events
    if (canvasEl) {
      canvasEl.addEventListener('mousedown', onMouseDown);
      canvasEl.addEventListener('mouseup', onMouseUp);
      canvasEl.addEventListener('mousemove', onMouseMove);

      // Touch events
      canvasEl.addEventListener('touchstart', onTouchStart, { passive: false });
      canvasEl.addEventListener('touchmove', onTouchMove, { passive: false });
      canvasEl.addEventListener('touchend', onTouchEnd, { passive: false });
      canvasEl.addEventListener('touchcancel', onTouchEnd, { passive: false });
    }
  }

  function isDown(code) {
    return !!keys[code];
  }

  function wasPressed(code) {
    return !!justPressed[code];
  }

  function consumePress(code) {
    const pressed = !!justPressed[code];
    justPressed[code] = false;
    return pressed;
  }

  function endFrame() {
    Object.keys(justPressed).forEach(k => { justPressed[k] = false; });
    mouseJustClicked = false;
    touchJustTapped = false;
    touchTapSide = null;
  }

  function getPlayer1Input(controls) {
    let input = 0;
    if (isDown(controls.p1Up)) input -= 1;
    if (isDown(controls.p1Down)) input += 1;

    // Touch input for P1
    const t1 = touchZones.p1;
    if (t1) {
      const dy = t1.y - t1.prevY;
      if (dy < -0.02) input -= 1;
      else if (dy > 0.02) input += 1;
    }

    // Mouse input for P1 (left half of canvas)
    if (mouseDown && mouseX < 0.5) {
      const targetY = mouseY;
      // Map mouse Y to paddle direction (used by game for position-based control)
      keys['_mouseP1Y'] = targetY;
    }

    return input;
  }

  function getPlayer2Input(controls) {
    let input = 0;
    if (isDown(controls.p2Up)) input -= 1;
    if (isDown(controls.p2Down)) input += 1;

    // Touch input for P2
    const t2 = touchZones.p2;
    if (t2) {
      const dy = t2.y - t2.prevY;
      if (dy < -0.02) input -= 1;
      else if (dy > 0.02) input += 1;
    }

    // Mouse input for P2 (right half of canvas)
    if (mouseDown && mouseX >= 0.5) {
      keys['_mouseP2Y'] = mouseY;
    }

    return input;
  }

  function wasConfirmPressed(controls) {
    if (consumePress(controls.confirm) || consumePress('Space')) return true;
    if (mouseJustClicked) return true;
    if (touchJustTapped) return true;
    return false;
  }

  function wasPausePressed(controls) {
    if (consumePress(controls.pause)) return true;
    // Tap on right 15% of canvas = pause (for touch)
    if (touchJustTapped && touchTapSide === 'p2') {
      const t2 = touchZones.p2;
      if (!t2) return true;
    }
    return false;
  }

  function wasMutePressed(controls) {
    return consumePress(controls.mute);
  }

  function wasKeyJustPressed() {
    for (const k in justPressed) {
      if (justPressed[k]) return true;
    }
    return mouseJustClicked || touchJustTapped;
  }

  function getMouseX() { return mouseX; }
  function getMouseY() { return mouseY; }
  function isMouseDown() { return mouseDown; }
  function getTouchZone(zone) { return touchZones[zone]; }

  return {
    init,
    isDown,
    wasPressed,
    consumePress,
    endFrame,
    getPlayer1Input,
    getPlayer2Input,
    wasConfirmPressed,
    wasPausePressed,
    wasMutePressed,
    wasKeyJustPressed,
    getMouseX,
    getMouseY,
    isMouseDown,
    getTouchZone,
    _getJustPressed: () => justPressed,
  };
})();
