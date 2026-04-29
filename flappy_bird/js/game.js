/**
 * Core game logic: bird physics, pipe management, collision detection, scoring.
 * Pure functions where possible for testability.
 */

/**
 * Create initial bird state.
 * @returns {object} Bird state
 */
function createBird() {
  return {
    x: C.BIRD_X,
    y: C.BIRD_START_Y,
    vy: 0,
    rotation: 0,
    wingFrame: 0,
    wingTimer: 0,
  };
}

/**
 * Apply flap to the bird.
 * @param {object} bird
 * @returns {object} Updated bird with upward velocity
 */
function flapBird(bird) {
  return {
    ...bird,
    vy: C.FLAP_STRENGTH,
  };
}

/**
 * Update bird position with gravity.
 * @param {object} bird
 * @returns {object} Updated bird
 */
function updateBird(bird) {
  let newVy = bird.vy + C.GRAVITY;
  newVy = Math.min(newVy, C.MAX_FALL_SPEED);

  let newY = bird.y + newVy;

  // Rotation based on velocity
  let newRotation = bird.vy * C.ROTATION_SPEED;
  newRotation = Math.max(-C.ROTATION_MAX / 2, Math.min(newRotation, C.ROTATION_MAX));

  // Wing animation
  let newWingTimer = bird.wingTimer + 1;
  let newWingFrame = bird.wingFrame;
  if (newWingTimer >= 6) {
    newWingFrame = (newWingFrame + 1) % 3;
    newWingTimer = 0;
  }

  return {
    ...bird,
    y: newY,
    vy: newVy,
    rotation: newRotation,
    wingFrame: newWingFrame,
    wingTimer: newWingTimer,
  };
}

/**
 * Create a pipe pair with a gap.
 * @param {number} x - X position of the pipe
 * @param {number} gapY - Center Y position of the gap
 * @returns {object} Pipe with top and bottom segments
 */
function createPipe(x, gapY) {
  return {
    x: x,
    gapY: gapY,
    gapTop: gapY - C.PIPE_GAP / 2,
    gapBottom: gapY + C.PIPE_GAP / 2,
    scored: false,
  };
}

/**
 * Generate a random gap Y position within valid range.
 * @returns {number} Random gap center Y
 */
function randomGapY() {
  const minTop = C.PIPE_MIN_TOP;
  const maxTop = C.PIPE_MAX_TOP;
  const range = maxTop - minTop;
  return minTop + Math.random() * range + C.PIPE_GAP / 2;
}

/**
 * Move a pipe left by the configured speed.
 * @param {object} pipe
 * @returns {object} Updated pipe
 */
function movePipe(pipe) {
  return {
    ...pipe,
    x: pipe.x - C.PIPE_SPEED,
  };
}

/**
 * Check if the bird collides with any pipe.
 * @param {object} bird
 * @param {Array<object>} pipes
 * @returns {boolean}
 */
function birdCollidesPipe(bird, pipes) {
  const birdLeft = bird.x - C.BIRD_WIDTH / 2 + 4;
  const birdRight = bird.x + C.BIRD_WIDTH / 2 - 4;
  const birdTop = bird.y - C.BIRD_HEIGHT / 2 + 4;
  const birdBottom = bird.y + C.BIRD_HEIGHT / 2 - 4;

  for (const pipe of pipes) {
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + C.PIPE_WIDTH;

    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      if (birdTop < pipe.gapTop || birdBottom > pipe.gapBottom) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if the bird collides with ground or ceiling.
 * @param {object} bird
 * @returns {boolean}
 */
function birdCollidesBoundary(bird) {
  const birdTop = bird.y - C.BIRD_HEIGHT / 2;
  const birdBottom = bird.y + C.BIRD_HEIGHT / 2;
  const groundY = C.FIELD_HEIGHT - C.GROUND_HEIGHT;

  return birdBottom >= groundY || birdTop <= 0;
}

/**
 * Check if the bird has passed a pipe (for scoring).
 * @param {object} bird
 * @param {object} pipe
 * @returns {boolean}
 */
function birdPassedPipe(bird, pipe) {
  return bird.x > pipe.x + C.PIPE_WIDTH && !pipe.scored;
}

/**
 * Update pipes: move, spawn new ones, remove off-screen.
 * @param {Array<object>} pipes
 * @param {number} frameCount
 * @returns {{ pipes: Array<object>, newScore: number }}
 */
function updatePipes(pipes, frameCount, bird) {
  let movedPipes = pipes.map(p => movePipe(p));

  // Remove off-screen pipes
  movedPipes = movedPipes.filter(p => p.x + C.PIPE_WIDTH > -10);

  // Spawn new pipe
  if (frameCount > 0 && frameCount % C.PIPE_SPAWN_INTERVAL === 0) {
    const newPipe = createPipe(C.FIELD_WIDTH + 10, randomGapY());
    movedPipes.push(newPipe);
  }

  // Check for scoring
  let newScore = 0;
  movedPipes = movedPipes.map(p => {
    if (birdPassedPipe(bird, p)) {
      newScore++;
      return { ...p, scored: true };
    }
    return p;
  });

  return { pipes: movedPipes, newScore };
}

/**
 * Check if the bird should die this frame.
 * @param {object} bird
 * @param {Array<object>} pipes
 * @returns {boolean}
 */
function checkDeath(bird, pipes) {
  return birdCollidesPipe(bird, pipes) || birdCollidesBoundary(bird);
}

/**
 * Create initial game state.
 * @returns {object} Full game state
 */
function createGameState() {
  return {
    bird: createBird(),
    pipes: [],
    score: 0,
    bestScore: loadBestScore(),
    frameCount: 0,
    groundOffset: 0,
  };
}

/**
 * Reset game state for a new run.
 * @param {number} bestScore - Preserve best score
 * @returns {object} Fresh game state
 */
function resetGameState(bestScore) {
  return {
    bird: createBird(),
    pipes: [],
    score: 0,
    bestScore: bestScore,
    frameCount: 0,
    groundOffset: 0,
  };
}

/**
 * Update ground scroll offset.
 * @param {number} offset
 * @returns {number} New offset
 */
function updateGroundOffset(offset) {
  return (offset + C.PIPE_SPEED) % 48;
}

/**
 * Load best score from localStorage.
 * @returns {number}
 */
function loadBestScore() {
  try {
    const stored = localStorage.getItem(C.STORAGE_BEST_SCORE);
    if (stored !== null) {
      const val = parseInt(stored, 10);
      if (!isNaN(val) && val >= 0) return val;
    }
  } catch (e) {
    // localStorage not available
  }
  return 0;
}

/**
 * Save best score to localStorage.
 * @param {number} score
 */
function saveBestScore(score) {
  try {
    localStorage.setItem(C.STORAGE_BEST_SCORE, String(score));
  } catch (e) {
    // localStorage not available
  }
}

/**
 * Determine medal for a given score.
 * @param {number} score
 * @returns {string|null} Medal type or null
 */
function getMedal(score) {
  if (score >= C.MEDAL_THRESHOLDS.platinum) return 'platinum';
  if (score >= C.MEDAL_THRESHOLDS.gold) return 'gold';
  if (score >= C.MEDAL_THRESHOLDS.silver) return 'silver';
  if (score >= C.MEDAL_THRESHOLDS.bronze) return 'bronze';
  return null;
}

/**
 * Full game tick: update bird, pipes, check collisions, update score.
 * @param {object} state
 * @param {boolean} flapped - Whether the player flapped this frame
 * @param {boolean} [animateGround=true] - Whether to animate ground scroll
 * @returns {{ state: object, dead: boolean, scoreGained: number }}
 */
function tick(state, flapped, animateGround) {
  let bird = state.bird;

  if (flapped) {
    bird = flapBird(bird);
  }

  bird = updateBird(bird);

  const frameCount = state.frameCount + 1;
  const pipeResult = updatePipes(state.pipes, frameCount, bird);

  const newScore = state.score + pipeResult.newScore;
  let bestScore = state.bestScore;
  if (newScore > bestScore) {
    bestScore = newScore;
  }

  const newState = {
    ...state,
    bird: bird,
    pipes: pipeResult.pipes,
    score: newScore,
    bestScore: bestScore,
    frameCount: frameCount,
    groundOffset: animateGround !== false ? updateGroundOffset(state.groundOffset) : state.groundOffset,
  };

  const dead = checkDeath(bird, pipeResult.pipes);

  if (dead) {
    saveBestScore(bestScore);
  }

  return { state: newState, dead, scoreGained: pipeResult.newScore };
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createBird,
    flapBird,
    updateBird,
    createPipe,
    randomGapY,
    movePipe,
    birdCollidesPipe,
    birdCollidesBoundary,
    birdPassedPipe,
    updatePipes,
    checkDeath,
    createGameState,
    resetGameState,
    updateGroundOffset,
    loadBestScore,
    saveBestScore,
    getMedal,
    tick,
  };
}
