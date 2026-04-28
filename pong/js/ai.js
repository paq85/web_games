/**
 * AI opponent logic with 4 difficulty levels.
 */

/**
 * AI behavior parameters per difficulty.
 */
const AI_PARAMS = {
  easy: {
    reactionDelay: 0.35,
    maxSpeed: 3.5,
    errorChance: 0.25,
    errorMagnitude: 40,
    predictionNoise: 60,
    trackThreshold: 0.6,
  },
  medium: {
    reactionDelay: 0.15,
    maxSpeed: 5.0,
    errorChance: 0.1,
    errorMagnitude: 20,
    predictionNoise: 30,
    trackThreshold: 0.4,
  },
  hard: {
    reactionDelay: 0.05,
    maxSpeed: 6.5,
    errorChance: 0.03,
    errorMagnitude: 8,
    predictionNoise: 10,
    trackThreshold: 0.2,
  },
  impossible: {
    reactionDelay: 0.0,
    maxSpeed: 15,
    errorChance: 0.0,
    errorMagnitude: 0,
    predictionNoise: 0,
    trackThreshold: 0.1,
  },
};

/**
 * AI state for tracking behavior.
 */
function createAIState(difficulty) {
  const params = AI_PARAMS[difficulty];
  return {
    difficulty,
    params,
    targetY: C.FIELD_HEIGHT / 2,
    lastReactionTime: 0,
    isErroring: false,
    errorOffset: 0,
    isTracking: true,
  };
}

/**
 * Predict where the ball will reach the AI paddle's x position.
 * @param {object} ball
 * @param {number} aiPaddleX
 * @param {number} noise
 * @returns {number} Predicted y position
 */
function predictBallY(ball, aiPaddleX, noise) {
  // If ball is moving away, use last known trajectory
  if (ball.vx < 0) {
    return C.FIELD_HEIGHT / 2 + (Math.random() - 0.5) * noise * 2;
  }

  // Simulate ball trajectory
  let simX = ball.x;
  let simY = ball.y;
  let simVX = ball.vx;
  let simVY = ball.vy;

  while (simX < aiPaddleX) {
    simX += simVX;
    simY += simVY;

    // Wall bounces
    if (simY - C.BALL_SIZE / 2 <= 0) {
      simY = C.BALL_SIZE / 2;
      simVY = -simVY;
    } else if (simY + C.BALL_SIZE / 2 >= C.FIELD_HEIGHT) {
      simY = C.FIELD_HEIGHT - C.BALL_SIZE / 2;
      simVY = -simVY;
    }
  }

  return simY + (Math.random() - 0.5) * noise;
}

/**
 * Update AI state and return movement input.
 * @param {object} aiState
 * @param {object} ball
 * @param {object} aiPaddle
 * @param {number} time - Current time in seconds
 * @returns {number} Movement input (-1, 0, 1)
 */
function updateAI(aiState, ball, aiPaddle, time) {
  const params = aiState.params;

  // Reaction delay: only update target periodically
  if (time - aiState.lastReactionTime < params.reactionDelay) {
    // Continue moving toward last target
    return moveToward(aiState.targetY, aiPaddle, params.maxSpeed);
  }

  aiState.lastReactionTime = time;

  // Check if we should introduce an error
  if (Math.random() < params.errorChance && !aiState.isErroring) {
    aiState.isErroring = true;
    aiState.errorOffset = (Math.random() - 0.5) * params.errorMagnitude * 2;
    // Error lasts for a short time
    setTimeout(() => { aiState.isErroring = false; }, 200 + Math.random() * 300);
  }

  // Only track if ball is coming toward AI or is close enough
  const ballComing = ball.vx > 0 || ball.x > C.FIELD_WIDTH * 0.5;
  const distanceRatio = Math.abs(ball.vx) / C.BALL_SPEED_MAX;

  if (!ballComing && Math.random() > (1 - params.trackThreshold)) {
    // Return to center when ball is going away
    aiState.targetY = C.FIELD_HEIGHT / 2;
  } else {
    // Predict ball position
    const predictedY = predictBallY(ball, aiPaddle.x, params.predictionNoise);
    aiState.targetY = predictedY + (aiState.isErroring ? aiState.errorOffset : 0);
  }

  // Clamp target
  aiState.targetY = Math.max(0, Math.min(C.FIELD_HEIGHT - aiPaddle.height, aiState.targetY));

  return moveToward(aiState.targetY, aiPaddle, params.maxSpeed);
}

/**
 * Move paddle toward target Y position.
 * @param {number} targetY
 * @param {object} paddle
 * @param {number} maxSpeed
 * @returns {number} Movement input (-1, 0, 1)
 */
function moveToward(targetY, paddle, maxSpeed) {
  const paddleCenter = paddle.y + paddle.height / 2;
  const diff = targetY - paddleCenter;

  if (Math.abs(diff) < 3) return 0;
  if (diff > 0) return Math.min(1, maxSpeed / C.PADDLE_SPEED);
  return Math.max(-1, -maxSpeed / C.PADDLE_SPEED);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AI_PARAMS,
    createAIState,
    predictBallY,
    updateAI,
    moveToward,
  };
}
