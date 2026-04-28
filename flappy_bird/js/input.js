/**
 * Input handling for Flappy Bird.
 * Supports keyboard, mouse/touch.
 */
window.Input = (function() {
  let flapPressed = false;
  let actionPending = false;

  function onKeyDown(e) {
    if (['Space', 'ArrowUp'].includes(e.code)) {
      e.preventDefault();
      flapPressed = true;
    }
  }

  function onMouseDown(e) {
    e.preventDefault();
    flapPressed = true;
  }

  function onTouchStart(e) {
    e.preventDefault();
    flapPressed = true;
  }

  function init(canvasEl) {
    window.addEventListener('keydown', onKeyDown);
    canvasEl.addEventListener('mousedown', onMouseDown);
    canvasEl.addEventListener('touchstart', onTouchStart, { passive: false });
  }

  function consumeFlap() {
    if (flapPressed) {
      flapPressed = false;
      return true;
    }
    return false;
  }

  function requestAction() {
    actionPending = true;
  }

  function consumeAction() {
    if (actionPending) {
      actionPending = false;
      return true;
    }
    return false;
  }

  function endFrame() {
    // flapPressed is consumed, no need to reset
  }

  return {
    init,
    consumeFlap,
    requestAction,
    consumeAction,
    endFrame,
  };
})();
