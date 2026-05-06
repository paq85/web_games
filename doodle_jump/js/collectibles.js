import {
  POWERUP_TYPES,
  POWERUP_DURATION,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './constants.js';
import { player, collectibles, addActivePowerup, score } from './state.js';

export function checkCollectibleCollisions() {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  for (const item of collectibles) {
    if (item.collected || !item.visible) continue;

    const itemCenterX = item.x + item.width / 2;
    const itemCenterY = item.y + item.height / 2;

    const dx = playerCenterX - itemCenterX;
    const dy = playerCenterY - itemCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < (player.width + item.width) / 2) {
      item.collected = true;
      item.visible = false;

      switch (item.type) {
        case POWERUP_TYPES.COIN:
          addScore(item.value || 10);
          break;
        case POWERUP_TYPES.JETPACK:
          addActivePowerup('jetpack', POWERUP_DURATION.JETPACK);
          break;
        case POWERUP_TYPES.UFO:
          addActivePowerup('ufo', POWERUP_DURATION.UFO);
          player.vx = 8;
          break;
        case POWERUP_TYPES.PAPER:
          addActivePowerup('paper', POWERUP_DURATION.PAPER);
          break;
      }
    }
  }
}

function addScore(value) {
  // Score is primarily height-based, coins are tracked separately
  // We add coin value to a temporary bonus that gets added on game over
  if (!window._coinBonus) window._coinBonus = 0;
  window._coinBonus += value;
}

export function getCoinBonus() {
  const bonus = window._coinBonus || 0;
  window._coinBonus = 0;
  return bonus;
}

export function resetCoinBonus() {
  window._coinBonus = 0;
}

export function spawnCollectibleOnPlatform(platform) {
  if (Math.random() > POWERUP_SPAWN_CHANCE.coin) return;

  collectibles.push({
    type: POWERUP_TYPES.COIN,
    x: platform.x + platform.width / 2 - 8,
    y: platform.y - 25,
    width: 16,
    height: 16,
    collected: false,
    visible: true,
    value: 10,
  });
}
