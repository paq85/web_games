/**
 * Main game state machine and entry point.
 */
window.Game = (function() {
  let screen = C.SCREENS.START;
  let gameState = null;
  let lastTime = 0;
  let animFrameId = null;
  let deathAnimTimer = 0;
  let flashAlpha = 0;
  let lastAnnouncedScore = -1;
  let gameOverAnnounced = false;

  function announce(text, assertive) {
    const elId = assertive ? 'game-alerts' : 'game-status';
    const el = document.getElementById(elId);
    if (el) {
      el.textContent = '';
      requestAnimationFrame(() => { el.textContent = text; });
    }
  }

  function init() {
    gameState = createGameState();
    const canvas = document.getElementById('game-canvas');
    Renderer.init(canvas);
    Input.init(canvas);
    announce('Flappy Bird. Press Space, Arrow Up, click, or tap to start.', false);
    gameLoop(0);
  }

  function startGame() {
    gameState = resetGameState(gameState.bestScore);
    screen = C.SCREENS.PLAYING;
    deathAnimTimer = 0;
    flashAlpha = 0;
    lastAnnouncedScore = -1;
    gameOverAnnounced = false;
    announce('Game started.', false);
  }

  function handleStart() {
    Renderer.drawStartScreen();

    if (Input.consumeFlap() || Input.consumeAction()) {
      startGame();
    }
  }

  function handlePlaying(dt) {
    const flapped = Input.consumeFlap();
    const result = tick(gameState, flapped, Renderer.shouldAnimate());
    gameState = result.state;

    if (result.scoreGained > 0 && gameState.score !== lastAnnouncedScore) {
      lastAnnouncedScore = gameState.score;
      announce(`Score: ${gameState.score}`, false);
    }

    if (result.dead) {
      screen = C.SCREENS.GAME_OVER;
      deathAnimTimer = 0.5;
      flashAlpha = 0.6;
    }

    Renderer.drawPlaying(gameState);
  }

  function handleGameOver(dt) {
    deathAnimTimer -= dt;
    if (flashAlpha > 0.01) flashAlpha *= 0.92;
    else flashAlpha = 0;

    if (!gameOverAnnounced) {
      gameOverAnnounced = true;
      let msg = `Game over. Score: ${gameState.score}. Best: ${gameState.bestScore}.`;
      const medal = getMedal(gameState.score);
      if (medal) {
        msg += ` Medal: ${medal}.`;
      }
      announce(msg, true);
    }

    Renderer.drawGameOverScreen(gameState);

    // Draw flash
    if (flashAlpha > 0.01) {
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (Input.consumeFlap() || Input.consumeAction()) {
      startGame();
    }
  }

  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    switch (screen) {
      case C.SCREENS.START:
        handleStart();
        break;
      case C.SCREENS.PLAYING:
        handlePlaying(dt);
        break;
      case C.SCREENS.GAME_OVER:
        handleGameOver(dt);
        break;
    }

    Input.endFrame();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  return {
    init,
    getScreen: () => screen,
    getGameState: () => gameState,
  };
})();

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
