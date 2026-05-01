// AABB collision detection between rectangular entities

/**
 * Check if two axis-aligned bounding boxes overlap.
 * All coordinates in pixels.
 */
export function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Check if the frog's bounding box overlaps with any obstacle in a list.
 * Returns the first obstacle that collides, or null.
 */
export function findCollision(frog, obstacles) {
  for (const obs of obstacles) {
    if (obs.visible !== false && checkCollision(frog, obs)) {
      return obs;
    }
  }
  return null;
}

/**
 * Get all obstacles that overlap with the frog's position.
 */
export function findAllCollisions(frog, obstacles) {
  return obstacles.filter(obs => obs.visible !== false && checkCollision(frog, obs));
}
