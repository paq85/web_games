/**
 * Input handling with support for control rebinding.
 */
const Input = (function() {
  const keys = {};
  const justPressed = {};

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

  function init() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
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
  }

  function getPlayer1Input(controls) {
    let input = 0;
    if (isDown(controls.p1Up)) input -= 1;
    if (isDown(controls.p1Down)) input += 1;
    return input;
  }

  function getPlayer2Input(controls) {
    let input = 0;
    if (isDown(controls.p2Up)) input -= 1;
    if (isDown(controls.p2Down)) input += 1;
    return input;
  }

  function wasConfirmPressed(controls) {
    return consumePress(controls.confirm) || consumePress('Space');
  }

  function wasPausePressed(controls) {
    return consumePress(controls.pause);
  }

  function wasMutePressed(controls) {
    return consumePress(controls.mute);
  }

  function wasKeyJustPressed() {
    for (const k in justPressed) {
      if (justPressed[k]) return true;
    }
    return false;
  }

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
    _getJustPressed: () => justPressed,
  };
})();
