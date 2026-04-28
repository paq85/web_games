// Collision detection utilities
const Collision = {
  // Axis-aligned bounding box collision
  aabb(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  },

  // Circle vs AABB
  circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = Utils.clamp(cx, rx, rx + rw);
    const closestY = Utils.clamp(cy, ry, ry + rh);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (cr * cr);
  },

  // Point vs AABB
  pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  },

  // Check helicopter against a list of entities
  checkHelicopterCollisions(heli, entities) {
    const heliBox = {
      x: heli.x,
      y: heli.y,
      w: heli.width,
      h: heli.height,
    };

    const hits = [];
    for (const entity of entities) {
      const entityBox = {
        x: entity.x,
        y: entity.y,
        w: entity.width,
        h: entity.height,
      };

      if (this.aabb(heliBox, entityBox)) {
        hits.push(entity);
      }
    }
    return hits;
  },

  // Check if helicopter is on or near terrain
  checkTerrainCollision(heli, terrainPoints) {
    const heliLeft = heli.x;
    const heliRight = heli.x + heli.width;
    const heliBottom = heli.y + heli.height;

    for (let x = heliLeft; x <= heliRight; x += 4) {
      const terrainY = this.getTerrainHeightAt(x, terrainPoints);
      if (heliBottom >= terrainY - 5) {
        return true;
      }
    }
    return false;
  },

  // Get terrain height at a given x position
  getTerrainHeightAt(x, terrainPoints) {
    if (!terrainPoints || terrainPoints.length === 0) return 0;

    for (let i = 0; i < terrainPoints.length - 1; i++) {
      if (x >= terrainPoints[i].x && x < terrainPoints[i + 1].x) {
        const t = (x - terrainPoints[i].x) / (terrainPoints[i + 1].x - terrainPoints[i].x);
        return Utils.lerp(terrainPoints[i].y, terrainPoints[i + 1].y, t);
      }
    }

    // Use last point if beyond range
    return terrainPoints[terrainPoints.length - 1].y;
  },
};
