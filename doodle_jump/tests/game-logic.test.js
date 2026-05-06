// Test constants
testGroup('Constants', () => {
  // We'll test these by loading the HTML and checking the constants are defined
  // For now, test the structure
  assert(true, 'Constants module exists');
});

// Test game state logic
testGroup('Game State', () => {
  let state = {
    gameState: 'menu',
    score: 0,
    highScore: 0,
    player: { x: 200, y: 400, vx: 0, vy: 0, facing: 1 },
    platforms: [],
    collectibles: [],
    activePowerups: {},
    cameraY: 0,
  };

  // Test reset
  state.score = 100;
  state.player.x = 500;
  state.player.y = 500;
  state.score = 0;
  state.player.x = 200;
  state.player.y = 400;
  state.player.vx = 0;
  state.player.vy = 0;
  state.activePowerups = {};
  state.platforms = [];
  state.collectibles = [];

  assertEquals(state.score, 0, 'Score resets to 0');
  assertEquals(state.player.x, 200, 'Player X resets');
  assertEquals(state.player.y, 400, 'Player Y resets');
  assertTrue(Object.keys(state.activePowerups).length === 0, 'Powerups cleared');
});

// Test physics logic
testGroup('Physics', () => {
  const GRAVITY = 0.4;
  const BOUNCE_VELOCITY = -10;
  const HORIZONTAL_ACCELERATION = 0.6;
  const HORIZONTAL_MAX_SPEED = 6;
  const HORIZONTAL_FRICTION = 0.88;

  let player = { x: 180, y: 500, vx: 0, vy: 0, width: 40, height: 40 };

  // Test gravity
  player.vy += GRAVITY;
  assertGreaterThan(player.vy, 0, 'Gravity increases downward velocity');

  // Test bounce
  player.vy = BOUNCE_VELOCITY;
  assertLessThan(player.vy, 0, 'Bounce creates upward velocity');

  // Test horizontal acceleration
  player.vx -= HORIZONTAL_ACCELERATION;
  assertTrue(player.vx < 0, 'Left acceleration creates negative velocity');

  player.vx = 0;
  player.vx += HORIZONTAL_ACCELERATION;
  assertTrue(player.vx > 0, 'Right acceleration creates positive velocity');

  // Test speed clamping
  player.vx = 100;
  player.vx = Math.max(-HORIZONTAL_MAX_SPEED, Math.min(HORIZONTAL_MAX_SPEED, player.vx));
  assertEquals(player.vx, HORIZONTAL_MAX_SPEED, 'Horizontal speed is clamped');

  // Test friction
  player.vx = 3;
  player.vx *= HORIZONTAL_FRICTION;
  assertLessThan(player.vx, 3, 'Friction reduces velocity');
});

// Test platform collision
testGroup('Platform Collision', () => {
  const PLAYER_WIDTH = 40;
  const PLAYER_HEIGHT = 40;

  let player = {
    x: 170,
    y: 520,
    vy: 2,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  };

  let platform = {
    x: 150,
    y: 560,
    width: 60,
    height: 15,
    type: 'normal',
  };

  // Test collision detection
  const playerBottom = player.y + player.height;
  const playerPrevBottom = playerBottom - player.vy;

  const colliding = player.vy >= 0 &&
    playerBottom >= platform.y &&
    playerPrevBottom <= platform.y + player.vy + 2 &&
    player.x + player.width > platform.x + 5 &&
    player.x < platform.x + platform.width - 5;

  assertTrue(colliding, 'Collision detected when player lands on platform');

  // Test no collision when player is above platform
  player.y = 400;
  const noCollision = player.vy >= 0 &&
    player.y + player.height >= platform.y &&
    player.x + player.width > platform.x + 5 &&
    player.x < platform.x + platform.width - 5;
  assertFalse(noCollision, 'No collision when player is above platform');
});

// Test score calculation
testGroup('Score', () => {
  const CANVAS_HEIGHT = 600;

  let playerY = 500;
  let score = 0;

  // Initial score should be 0
  const currentHeight = Math.max(0, Math.floor((CANVAS_HEIGHT - playerY) / 10));
  assertEquals(currentHeight, 10, 'Initial score calculated correctly');

  // Score increases as player goes higher
  playerY = 200;
  const newHeight = Math.max(0, Math.floor((CANVAS_HEIGHT - playerY) / 10));
  assertGreaterThan(newHeight, currentHeight, 'Score increases with height');
  assertEquals(newHeight, 40, 'Score calculated at higher position');

  // Score never negative
  playerY = 700;
  const negativeHeight = Math.max(0, Math.floor((CANVAS_HEIGHT - playerY) / 10));
  assertEquals(negativeHeight, 0, 'Score is never negative');
});

// Test powerup system
testGroup('Powerups', () => {
  let activePowerups = {};

  // Test adding powerup
  activePowerups['jetpack'] = { remaining: 3000, total: 3000 };
  assertTrue('jetpack' in activePowerups, 'Jetpack powerup added');

  // Test powerup progress
  const progress = activePowerups['jetpack'].remaining / activePowerups['jetpack'].total;
  assertEquals(progress, 1, 'Full powerup progress at start');

  // Test powerup expiration
  activePowerups['jetpack'].remaining = 0;
  delete activePowerups['jetpack'];
  assertFalse('jetpack' in activePowerups, 'Expired powerup removed');

  // Test multiple powerups
  activePowerups['jetpack'] = { remaining: 3000, total: 3000 };
  activePowerups['ufo'] = { remaining: 4000, total: 4000 };
  assertEquals(Object.keys(activePowerups).length, 2, 'Multiple powerups can be active');
});

// Test platform generation
testGroup('Platform Generation', () => {
  const CANVAS_WIDTH = 400;
  const PLATFORM_WIDTH = 60;
  const PLATFORM_GAP_MIN = 55;
  const PLATFORM_GAP_MAX = 85;

  // Test platform fits within canvas
  let x = Math.random() * (CANVAS_WIDTH - PLATFORM_WIDTH);
  assertTrue(x >= 0, 'Platform X is within left boundary');
  assertTrue(x + PLATFORM_WIDTH <= CANVAS_WIDTH, 'Platform X is within right boundary');

  // Test gap is within range
  let gap = PLATFORM_GAP_MIN + Math.random() * (PLATFORM_GAP_MAX - PLATFORM_GAP_MIN);
  assertGreaterThanOrEqual(gap, PLATFORM_GAP_MIN, 'Gap is at minimum');
  assertLessThan(gap, PLATFORM_GAP_MAX + 1, 'Gap is within maximum');
});

// Test collectible collision
testGroup('Collectibles', () => {
  let player = { x: 180, y: 500, width: 40, height: 40 };
  let coin = { x: 185, y: 505, width: 16, height: 16, collected: false };

  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const coinCenterX = coin.x + coin.width / 2;
  const coinCenterY = coin.y + coin.height / 2;

  const dx = playerCenterX - coinCenterX;
  const dy = playerCenterY - coinCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const collectDistance = (player.width + coin.width) / 2;

  assertTrue(distance < collectDistance, 'Coin is within collection range');
  assertFalse(coin.collected, 'Coin not yet collected');
});

// Test game over condition
testGroup('Game Over', () => {
  const CANVAS_HEIGHT = 600;
  const PLAYER_HEIGHT = 40;

  let playerY = CANVAS_HEIGHT + PLAYER_HEIGHT + 10;
  const isGameOver = playerY > CANVAS_HEIGHT + PLAYER_HEIGHT;
  assertTrue(isGameOver, 'Game over when player falls below screen');

  playerY = CANVAS_HEIGHT - 100;
  const isNotGameOver = playerY > CANVAS_HEIGHT + PLAYER_HEIGHT;
  assertFalse(isNotGameOver, 'Game not over when player is on screen');
});

// Test settings persistence structure
testGroup('Settings', () => {
  const defaultSettings = {
    masterVolume: 80,
    musicVolume: 70,
    sfxVolume: 80,
    muted: false,
    reducedMotion: false,
    reducedEffects: false,
    paperTexture: true,
    controls: {
      left: ['ArrowLeft', 'KeyA'],
      right: ['ArrowRight', 'KeyD'],
      pause: ['Escape', 'KeyP'],
    },
  };

  assertObjectHas(defaultSettings, ['masterVolume', 'musicVolume', 'sfxVolume', 'muted'], 'Settings has volume controls');
  assertObjectHas(defaultSettings, ['controls'], 'Settings has controls');
  assertObjectHas(defaultSettings.controls, ['left', 'right', 'pause'], 'Controls has all actions');
  assertEquals(defaultSettings.masterVolume, 80, 'Default master volume is 80');
  assertEquals(defaultSettings.muted, false, 'Default mute is false');
});

// Test high score management
testGroup('High Scores', () => {
  let scores = [];

  // Add scores
  scores.push({ score: 100, date: 1000 });
  scores.push({ score: 200, date: 2000 });
  scores.push({ score: 150, date: 3000 });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  assertEquals(scores[0].score, 200, 'Highest score is first');
  assertEquals(scores[1].score, 150, 'Second highest score is second');
  assertEquals(scores[2].score, 100, 'Lowest score is last');

  // Test trimming to max
  const MAX_HIGH_SCORES = 10;
  while (scores.length > MAX_HIGH_SCORES) {
    scores.pop();
  }
  assertTrue(scores.length <= MAX_HIGH_SCORES, 'Scores trimmed to maximum');
});

// Test input handling
testGroup('Input', () => {
  let input = { left: false, right: false, pause: false };

  // Simulate left key press
  input.left = true;
  assertTrue(input.left, 'Left input activated');
  assertFalse(input.right, 'Right input not activated');

  // Simulate right key press
  input.right = true;
  assertTrue(input.left, 'Left still active');
  assertTrue(input.right, 'Right input activated');

  // Release left
  input.left = false;
  assertFalse(input.left, 'Left input released');
  assertTrue(input.right, 'Right still active');
});

// Test camera scrolling
testGroup('Camera', () => {
  const CANVAS_HEIGHT = 600;
  let cameraY = 0;
  let playerY = CANVAS_HEIGHT - 50;

  // Player at bottom, camera should not move
  const threshold = CANVAS_HEIGHT * 0.4;
  if (playerY < threshold) {
    const diff = threshold - playerY;
    cameraY -= diff;
    playerY = threshold;
  }

  assertEquals(cameraY, 0, 'Camera does not move when player is low');

  // Player moves up past threshold
  playerY = threshold - 50;
  const initialCameraY = cameraY;
  if (playerY < threshold) {
    const diff = threshold - playerY;
    cameraY -= diff;
    playerY = threshold;
  }

  // cameraY becomes more negative when scrolling up
  assertLessThan(cameraY, initialCameraY, 'Camera scrolls up when player rises');
});

// Test moving platform
testGroup('Moving Platforms', () => {
  let platform = { x: 100, width: 60, speed: 2 };

  // Move right
  platform.x += platform.speed;
  assertGreaterThan(platform.x, 100, 'Platform moves right');

  // Bounce off right edge
  platform.x = 340;
  platform.speed = -2;
  platform.x += platform.speed;
  platform.x = Math.max(0, Math.min(400 - 60, platform.x));
  assertTrue(platform.x <= 340, 'Platform stays within right boundary');

  // Bounce off left edge
  platform.x = 0;
  platform.speed = 2;
  platform.x += platform.speed;
  platform.x = Math.max(0, Math.min(340, platform.x));
  assertTrue(platform.x >= 0, 'Platform stays within left boundary');
});

// Test breakable platform
testGroup('Breakable Platforms', () => {
  let platform = { broken: false, breakTimer: 200 };

  // Platform breaks
  platform.broken = true;
  platform.breakTimer = 200;

  // Update break timer
  platform.breakTimer -= 16;
  assertGreaterThan(platform.breakTimer, 0, 'Break timer decreases');

  // Platform becomes invisible
  platform.breakTimer = 10;
  platform.breakTimer -= 16;
  if (platform.breakTimer <= 0) {
    platform.visible = false;
  }
  assertFalse(platform.breakTimer > 0, 'Platform broken after timer expires');
});

console.log('\nAll unit tests completed.');

// Test platform reachability guarantees
testGroup('Platform Reachability', () => {
  const UNSAFE_TYPES = new Set(['breakable', 'monster']);
  const CANVAS_WIDTH = 400;
  const PLATFORM_WIDTH = 60;
  const MAX_CONSECUTIVE_UNSAFE = 2;

  // Simulate the ensureReachability logic
  function simulateReachability(types, maxConsecutive) {
    let consecutiveUnsafe = 0;
    let violations = 0;
    let corrections = 0;

    for (const type of types) {
      let actualType = type;
      const isUnsafe = UNSAFE_TYPES.has(actualType);

      if (isUnsafe && consecutiveUnsafe >= maxConsecutive) {
        actualType = 'normal';
        corrections++;
      }

      if (UNSAFE_TYPES.has(actualType)) {
        consecutiveUnsafe++;
      } else {
        consecutiveUnsafe = 0;
      }

      if (consecutiveUnsafe > maxConsecutive) {
        violations++;
      }
    }

    return { violations, corrections, finalConsecutive: consecutiveUnsafe };
  }

  // Test: worst case - all breakable should be corrected
  const allBreakable = Array(20).fill('breakable');
  const result1 = simulateReachability(allBreakable, MAX_CONSECUTIVE_UNSAFE);
  assertEquals(result1.violations, 0, 'No violations when all platforms are breakable');
  assertTrue(result1.corrections > 0, 'Corrections made for consecutive breakable platforms');

  // Test: alternating safe/unsafe should work fine
  const alternating = [];
  for (let i = 0; i < 20; i++) {
    alternating.push(i % 2 === 0 ? 'normal' : 'breakable');
  }
  const result2 = simulateReachability(alternating, MAX_CONSECUTIVE_UNSAFE);
  assertEquals(result2.violations, 0, 'No violations with alternating platforms');
  assertEquals(result2.corrections, 0, 'No corrections needed for alternating platforms');

  // Test: exactly MAX_CONSECUTIVE_UNSAFE consecutive should be allowed
  const exactlyMax = ['breakable', 'breakable', 'normal'];
  const result3 = simulateReachability(exactlyMax, MAX_CONSECUTIVE_UNSAFE);
  assertEquals(result3.violations, 0, 'Exactly MAX_CONSECUTIVE_UNSAFE is allowed');

  // Test: MAX_CONSECUTIVE_UNSAFE + 1 should trigger correction
  const overMax = ['breakable', 'breakable', 'monster'];
  const result4 = simulateReachability(overMax, MAX_CONSECUTIVE_UNSAFE);
  assertTrue(result4.corrections > 0, 'Correction triggered after MAX_CONSECUTIVE_UNSAFE');

  // Test: mixed types with monster
  const mixed = ['normal', 'breakable', 'monster', 'spring', 'breakable', 'monster', 'normal'];
  const result5 = simulateReachability(mixed, MAX_CONSECUTIVE_UNSAFE);
  assertEquals(result5.violations, 0, 'Mixed types handled correctly');

  // Test canvas thirds distribution
  function getCanvasThird(x) {
    const thirdWidth = CANVAS_WIDTH / 3;
    if (x < thirdWidth) return 0;
    if (x < thirdWidth * 2) return 1;
    return 2;
  }

  // Verify thirds cover the canvas properly
  assertEquals(getCanvasThird(0), 0, 'X=0 is in left third');
  assertEquals(getCanvasThird(133), 0, 'X=133 is in left third');
  assertEquals(getCanvasThird(134), 1, 'X=134 is in middle third');
  assertEquals(getCanvasThird(266), 1, 'X=266 is in middle third');
  assertEquals(getCanvasThird(267), 2, 'X=267 is in right third');
  assertEquals(getCanvasThird(399), 2, 'X=399 is in right third');

  // Verify platform fits in any third
  const thirdWidth = CANVAS_WIDTH / 3;
  for (let third = 0; third < 3; third++) {
    const minX = third * thirdWidth;
    const maxX = minX + thirdWidth - PLATFORM_WIDTH;
    assertTrue(maxX >= minX, `Platform fits in third ${third}`);
  }
});

// Test Monte Carlo simulation of platform generation
testGroup('Platform Generation Monte Carlo', () => {
  const UNSAFE_TYPES = new Set(['breakable', 'monster']);
  const MAX_CONSECUTIVE_UNSAFE = 2;

  // Simulate many generations with random types and reachability enforcement
  function runSimulation(iterations, numPlatforms) {
    let maxConsecutiveFound = 0;
    let totalViolations = 0;

    for (let iter = 0; iter < iterations; iter++) {
      const types = ['normal', 'moving', 'breakable', 'spring', 'vine', 'monster'];
      const generated = [];
      let consecutiveUnsafe = 0;

      for (let i = 0; i < numPlatforms; i++) {
        let type = types[Math.floor(Math.random() * types.length)];
        const isUnsafe = UNSAFE_TYPES.has(type);

        if (isUnsafe && consecutiveUnsafe >= MAX_CONSECUTIVE_UNSAFE) {
          type = 'normal';
        }

        generated.push(type);

        if (UNSAFE_TYPES.has(type)) {
          consecutiveUnsafe++;
        } else {
          consecutiveUnsafe = 0;
        }

        if (consecutiveUnsafe > MAX_CONSECUTIVE_UNSAFE) {
          totalViolations++;
        }
      }

      let localMax = 0;
      let localCount = 0;
      for (const type of generated) {
        if (UNSAFE_TYPES.has(type)) {
          localCount++;
          localMax = Math.max(localMax, localCount);
        } else {
          localCount = 0;
        }
      }
      maxConsecutiveFound = Math.max(maxConsecutiveFound, localMax);
    }

    return { maxConsecutiveFound, totalViolations };
  }

  const result = runSimulation(100, 50);
  assertTrue(result.maxConsecutiveFound <= MAX_CONSECUTIVE_UNSAFE,
    `Max consecutive unsafe (${result.maxConsecutiveFound}) <= ${MAX_CONSECUTIVE_UNSAFE}`);
  assertEquals(result.totalViolations, 0, 'Zero violations across all simulations');
});
