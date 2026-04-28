/**
 * Core game logic: ball physics, paddle movement, collision detection, scoring.
 * Pure functions where possible for testability.
 */

/**
 * Create initial ball state.
 * @param {number} dirX - Direction to serve (-1 for left, 1 for right)
 * @returns {object} Ball state
 */
function createBall(dirX = 1) {
  const angle = (Math.random() - 0.5) * (C.BALL_ANGULAR_MAX * 0.5);
  return {
    x: C.FIELD_WIDTH / 2,
    y: C.FIELD_HEIGHT / 2,
    vx: C.BALL_SPEED_MIN * Math.cos(angle) * dirX,
    vy: C.BALL_SPEED_MIN * Math.sin(angle),
    speed: C.BALL_SPEED_MIN,
  };
}

/**
 * Create initial paddle state.
 * @param {boolean} isLeft - Whether this is the left paddle
 * @param {string} sizeKey - 'small', 'medium', or 'large'
 * @returns {object} Paddle state
 */
function createPaddle(isLeft, sizeKey = 'medium') {
  const height = C.PADDLE_HEIGHTS[sizeKey] || C.PADDLE_HEIGHTS.medium;
  return {
    x: isLeft ? C.PADDLE_MARGIN : C.FIELD_WIDTH - C.PADDLE_MARGIN - C.PADDLE_WIDTH,
    y: C.FIELD_HEIGHT / 2 - height / 2,
    width: C.PADDLE_WIDTH,
    height: height,
    vy: 0,
  };
}

/**
 * Move a paddle with clamping to playfield bounds.
 * @param {object} paddle
 * @param {number} input - -1 for up, 1 for down, 0 for none
 * @returns {object} Updated paddle
 */
function movePaddle(paddle, input) {
  const newY = paddle.y + input * C.PADDLE_SPEED;
  const clampedY = Math.max(0, Math.min(C.FIELD_HEIGHT - paddle.height, newY));
  return { ...paddle, y: clampedY, vy: input * C.PADDLE_SPEED };
}

/**
 * Check if ball collides with a paddle.
 * @param {object} ball
 * @param {object} paddle
 * @returns {boolean}
 */
function ballCollidesPaddle(ball, paddle) {
  return (
    ball.x - C.BALL_SIZE / 2 < paddle.x + paddle.width &&
    ball.x + C.BALL_SIZE / 2 > paddle.x &&
    ball.y - C.BALL_SIZE / 2 < paddle.y + paddle.height &&
    ball.y + C.BALL_SIZE / 2 > paddle.y
  );
}

/**
 * Reflect ball off a paddle, adjusting angle based on contact position.
 * @param {object} ball
 * @param {object} paddle
 * @returns {object} Updated ball with new velocity and increased speed
 */
function reflectBall(ball, paddle) {
  // Where on the paddle did the ball hit? (-1 = top, 0 = center, 1 = bottom)
  const paddleCenter = paddle.y + paddle.height / 2;
  const contactPos = (ball.y - paddleCenter) / (paddle.height / 2);
  const clampedContact = Math.max(-1, Math.min(1, contactPos));

  // Angle: center = shallow, edges = steep
  const angle = clampedContact * C.BALL_ANGULAR_MAX;

  // Increase speed
  const newSpeed = Math.min(C.BALL_SPEED_MAX, ball.speed + C.BALL_SPEED_INCREMENT);

  // Determine direction (left or right) based on which paddle
  const dirX = paddle.x < C.FIELD_WIDTH / 2 ? 1 : -1;

  return {
    ...ball,
    x: dirX > 0 ? paddle.x + paddle.width + C.BALL_SIZE / 2 : paddle.x - C.BALL_SIZE / 2,
    vx: newSpeed * Math.cos(angle) * dirX,
    vy: newSpeed * Math.sin(angle),
    speed: newSpeed,
  };
}

/**
 * Update ball position.
 * @param {object} ball
 * @returns {object} Updated ball
 */
function updateBall(ball) {
  return {
    ...ball,
    x: ball.x + ball.vx,
    y: ball.y + ball.vy,
  };
}

/**
 * Reflect ball off top or bottom wall.
 * @param {object} ball
 * @returns {object} Updated ball
 */
function reflectBallWall(ball) {
  return { ...ball, vy: -ball.vy };
}

const reflectWall = reflectBallWall;

/**
 * Check if ball has scored (gone past left or right edge).
 * @param {object} ball
 * @returns {number} 1 if player 2 scores, -1 if player 1 scores, 0 if no score
 */
function checkScore(ball) {
  if (ball.x + C.BALL_SIZE / 2 <= 0) return 1; // Player 2 scores (ball left P1's side)
  if (ball.x - C.BALL_SIZE / 2 >= C.FIELD_WIDTH) return -1; // Player 1 scores
  return 0;
}

/**
 * Process one game tick: update ball, check collisions, return events.
 * @param {object} ball
 * @param {object} paddle1 - Left paddle (player 1)
 * @param {object} paddle2 - Right paddle (player 2)
 * @returns {{ ball: object, scored: number, wallHit: boolean, paddleHit: number }}
 */
function gameTick(ball, paddle1, paddle2) {
  let currentBall = updateBall(ball);
  let scored = 0;
  let wallHit = false;
  let paddleHit = 0;

  // Top/bottom wall collision
  if (currentBall.y - C.BALL_SIZE / 2 <= 0) {
    currentBall = reflectWall(currentBall);
    currentBall.y = C.BALL_SIZE / 2;
    wallHit = true;
  } else if (currentBall.y + C.BALL_SIZE / 2 >= C.FIELD_HEIGHT) {
    currentBall = reflectWall(currentBall);
    currentBall.y = C.FIELD_HEIGHT - C.BALL_SIZE / 2;
    wallHit = true;
  }

  // Paddle collisions
  if (ballCollidesPaddle(currentBall, paddle1)) {
    currentBall = reflectBall(currentBall, paddle1);
    paddleHit = 1;
  } else if (ballCollidesPaddle(currentBall, paddle2)) {
    currentBall = reflectBall(currentBall, paddle2);
    paddleHit = 2;
  }

  // Check scoring
  scored = checkScore(currentBall);

  return { ball: currentBall, scored, wallHit, paddleHit };
}

/**
 * Check if a match is over.
 * @param {number} score1
 * @param {number} score2
 * @param {number} winScore
 * @returns {{ over: boolean, winner: number }} winner: 1 or 2
 */
function checkMatchOver(score1, score2, winScore) {
  if (score1 >= winScore && score1 - score2 >= C.WIN_BY) {
    return { over: true, winner: 1 };
  }
  if (score2 >= winScore && score2 - score1 >= C.WIN_BY) {
    return { over: true, winner: 2 };
  }
  return { over: false, winner: 0 };
}

/**
 * Reset ball for next serve.
 * @param {number} dirX - Direction to serve (-1 toward P1, 1 toward P2)
 * @returns {object} New ball state
 */
function resetBall(dirX) {
  return createBall(dirX);
}

/**
 * Full game state for easy management.
 */
function createGameState(winScore, paddleSize, isPractice) {
  return {
    paddle1: createPaddle(true, paddleSize),
    paddle2: createPaddle(false, paddleSize),
    ball: createBall(1),
    score1: 0,
    score2: 0,
    winScore: winScore,
    isPractice: isPractice || false,
    rallyHits: 0,
    servingDir: 1,
    lastScorer: 0,
  };
}

/**
 * Tick the full game state.
 * @param {object} state
 * @param {number} p1Input - Player 1 input (-1, 0, 1)
 * @param {number} p2Input - Player 2 input (-1, 0, 1)
 * @returns {{ state: object, events: object }}
 */
function tickGameState(state, p1Input, p2Input) {
  const newPaddle1 = movePaddle(state.paddle1, p1Input);
  const newPaddle2 = movePaddle(state.paddle2, p2Input);

  const tickResult = gameTick(state.ball, newPaddle1, newPaddle2);
  const newState = {
    ...state,
    paddle1: newPaddle1,
    paddle2: newPaddle2,
    ball: tickResult.ball,
    rallyHits: state.rallyHits + (tickResult.paddleHit > 0 ? 1 : 0),
  };

  const events = {
    wallHit: tickResult.wallHit,
    paddleHit: tickResult.paddleHit,
    scored: 0,
    matchOver: false,
    winner: 0,
  };

  if (tickResult.scored !== 0) {
    if (tickResult.scored === 1) {
      newState.score2++;
      events.scored = 2;
      newState.lastScorer = 2;
      newState.servingDir = -1;
    } else {
      newState.score1++;
      events.scored = 1;
      newState.lastScorer = 1;
      newState.servingDir = 1;
    }
    newState.rallyHits = 0;

    if (!newState.isPractice) {
      const matchResult = checkMatchOver(newState.score1, newState.score2, newState.winScore);
      if (matchResult.over) {
        events.matchOver = true;
        events.winner = matchResult.winner;
      }
    }
  }

  return { state: newState, events };
}

/**
 * Reset ball after scoring, keeping scores.
 * @param {object} state
 * @returns {object} Updated state with reset ball
 */
function resetBallAfterScore(state) {
  return {
    ...state,
    ball: resetBall(state.servingDir),
    rallyHits: 0,
  };
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createBall,
    createPaddle,
    movePaddle,
    ballCollidesPaddle,
    reflectBall,
    reflectWall,
    updateBall,
    checkScore,
    gameTick,
    checkMatchOver,
    resetBall,
    createGameState,
    tickGameState,
    resetBallAfterScore,
  };
}
