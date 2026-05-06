import {
  GRAVITY,
  BOUNCE_VELOCITY,
  SPRING_BOOST_VELOCITY,
  JETPACK_VELOCITY,
  VINE_CLIMB_SPEED,
  HORIZONTAL_ACCELERATION,
  HORIZONTAL_MAX_SPEED,
  HORIZONTAL_FRICTION,
  HORIZONTAL_WRAP,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  SCREEN_EDGE_MARGIN,
  PLATFORM_TYPES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './constants.js';
import { player, activePowerups, hasPowerup, collectibles, platforms } from './state.js';

export function updatePhysics(input, dt) {
  // Horizontal movement
  if (input.left) {
    player.vx -= HORIZONTAL_ACCELERATION;
    player.facing = -1;
  }
  if (input.right) {
    player.vx += HORIZONTAL_ACCELERATION;
    player.facing = 1;
  }

  // Apply friction
  if (!input.left && !input.right) {
    player.vx *= HORIZONTAL_FRICTION;
  }

  // Clamp horizontal speed
  player.vx = Math.max(-HORIZONTAL_MAX_SPEED, Math.min(HORIZONTAL_MAX_SPEED, player.vx));

  // Remove tiny velocities
  if (Math.abs(player.vx) < 0.01) {
    player.vx = 0;
  }

  // Jetpack powerup
  if (hasPowerup('jetpack')) {
    player.vy = JETPACK_VELOCITY;
    player.onGround = false;
  } else {
    // Gravity
    player.vy += GRAVITY;

    // Vine climbing
    if (player.onVine) {
      if (input.left || input.right) {
        player.vy = -VINE_CLIMB_SPEED;
      }
    }
  }

  // Update position
  player.x += player.vx;
  player.y += player.vy;

  // Horizontal wrapping
  if (HORIZONTAL_WRAP) {
    if (player.x + player.width < 0) {
      player.x = CANVAS_WIDTH + SCREEN_EDGE_MARGIN;
    } else if (player.x > CANVAS_WIDTH + SCREEN_EDGE_MARGIN) {
      player.x = -player.width - SCREEN_EDGE_MARGIN;
    }
  } else {
    // Clamp to canvas
    if (player.x < 0) {
      player.x = 0;
      player.vx = 0;
    }
    if (player.x + player.width > CANVAS_WIDTH) {
      player.x = CANVAS_WIDTH - player.width;
      player.vx = 0;
    }
  }

  player.onGround = false;
  player.onVine = false;
}

export function checkPlatformCollisions(platforms) {
  const playerBottom = player.y + player.height;
  const playerPrevBottom = playerBottom - player.vy;

  for (const platform of platforms) {
    if (platform.broken) continue;

    const platformLeft = platform.x;
    const platformRight = platform.x + platform.width;
    const platformTop = platform.y;
    const platformBottom = platform.y + platform.height;

    // Check if player is falling and crosses platform level
    if (player.vy >= 0 &&
        playerBottom >= platformTop &&
        playerPrevBottom <= platformTop + player.vy + 2 &&
        player.x + player.width > platformLeft + 5 &&
        player.x < platformRight - 5) {

      if (platform.type === PLATFORM_TYPES.MONSTER) {
        return { type: 'monster', platform };
      }

      if (platform.type === PLATFORM_TYPES.BREAKABLE && !hasPowerup('paper')) {
        platform.broken = true;
        platform.breakTimer = 200;
        return { type: 'break', platform };
      }

      if (platform.type === PLATFORM_TYPES.SPRING) {
        player.vy = SPRING_BOOST_VELOCITY;
        player.onGround = true;
        return { type: 'spring', platform };
      }

      if (platform.type === PLATFORM_TYPES.VINE) {
        player.onVine = true;
        player.onGround = true;
        player.vy = 0;
        return { type: 'vine', platform };
      }

      // Normal and moving platforms
      player.vy = BOUNCE_VELOCITY;
      player.onGround = true;
      return { type: 'bounce', platform };
    }
  }

  return null;
}

export function updateMovingPlatforms(dt) {
  for (const platform of platforms) {
    if (platform.type !== PLATFORM_TYPES.MOVING) continue;

    platform.x += platform.speed;

    // Bounce off edges
    if (platform.x <= 0 || platform.x + platform.width >= CANVAS_WIDTH) {
      platform.speed *= -1;
      platform.x = Math.max(0, Math.min(CANVAS_WIDTH - platform.width, platform.x));
    }
  }
}

export function updateBrokenPlatforms() {
  for (const platform of platforms) {
    if (platform.broken && platform.breakTimer !== undefined) {
      platform.breakTimer -= 16;
      if (platform.breakTimer <= 0) {
        platform.visible = false;
      }
    }
  }
}

export function cleanupPlatforms() {
  const visible = platforms.filter(p => p.visible !== false && p.y < CANVAS_HEIGHT + 100);
  platforms.splice(0, platforms.length, ...visible);
}

export function cleanupCollectibles() {
  const visible = collectibles.filter(c => c.visible !== false && c.y < CANVAS_HEIGHT + 100);
  collectibles.splice(0, collectibles.length, ...visible);
}
