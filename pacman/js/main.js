// === Main Entry Point ===
import { Game } from './game.js';

function init() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Game canvas not found');
    return;
  }

  const game = new Game(canvas);
  game.init();

  // Initialize audio on first user interaction
  const initAudio = () => {
    game.audio.init();
    game.audio.resume();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
    document.removeEventListener('touchstart', initAudio);
  };
  document.addEventListener('click', initAudio);
  document.addEventListener('keydown', initAudio);
  document.addEventListener('touchstart', initAudio);

  game.start();

  // Expose for testing/debugging
  window.__PACMAN_APP__ = game;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
