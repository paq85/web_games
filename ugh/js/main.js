// Main entry point
(function () {
  'use strict';

  // Initialize systems
  const canvas = document.getElementById('game-canvas');

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Initialize audio (needs user gesture)
    document.addEventListener('click', () => AudioSystem.init(), { once: true });
    document.addEventListener('keydown', () => AudioSystem.init(), { once: true });
    document.addEventListener('touchstart', () => AudioSystem.init(), { once: true });

    // Initialize renderer
    Renderer.init(canvas);

    // Initialize input
    Input.init();

    // Initialize UI
    UI.init();

    // Initialize game
    Game.init();

    // Handle resize
    window.addEventListener('resize', Utils.debounce(() => {
      Renderer.resize();
    }, 200));

    // Prevent default touch behaviors
    document.addEventListener('touchmove', (e) => {
      if (Game.state === CONSTANTS.STATE.PLAYING) {
        e.preventDefault();
      }
    }, { passive: false });
  }
})();
