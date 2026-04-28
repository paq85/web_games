// Terrain generation
const Terrain = {
  // Generate terrain points for a level
  generate(levelConfig, width) {
    const points = [];
    const segWidth = CONSTANTS.WORLD.SEGMENT_WIDTH;
    const numSegments = Math.ceil(width / segWidth) + 2;

    let height = CONSTANTS.HEIGHT - 100;
    const baseHeight = CONSTANTS.HEIGHT - 120;

    switch (levelConfig.terrain) {
      case 'flat':
        height = this.generateFlat(numSegments, segWidth, baseHeight, points);
        break;
      case 'hilly':
        height = this.generateHilly(numSegments, segWidth, baseHeight, points);
        break;
      case 'mountain':
        height = this.generateMountain(numSegments, segWidth, baseHeight, points);
        break;
      default:
        height = this.generateFlat(numSegments, segWidth, baseHeight, points);
    }

    // Close the shape
    points.push({ x: points[points.length - 1].x + segWidth, y: CONSTANTS.HEIGHT });
    points.push({ x: 0, y: CONSTANTS.HEIGHT });

    return points;
  },

  generateFlat(numSegments, segWidth, baseHeight, points) {
    let height = baseHeight;
    for (let i = 0; i < numSegments; i++) {
      height += Utils.randFloat(-8, 8);
      height = Utils.clamp(height, baseHeight - 30, baseHeight + 40);
      points.push({ x: i * segWidth, y: height });
    }
    return height;
  },

  generateHilly(numSegments, segWidth, baseHeight, points) {
    let height = baseHeight;
    let trend = Utils.randFloat(-1, 1);
    for (let i = 0; i < numSegments; i++) {
      if (i % 20 === 0) trend = Utils.randFloat(-1.5, 1.5);
      height += trend + Utils.randFloat(-5, 5);
      height = Utils.clamp(height, CONSTANTS.HEIGHT - 250, CONSTANTS.HEIGHT - 40);
      points.push({ x: i * segWidth, y: height });
    }
    return height;
  },

  generateMountain(numSegments, segWidth, baseHeight, points) {
    let height = baseHeight;
    let trend = 0;
    for (let i = 0; i < numSegments; i++) {
      if (i % 15 === 0) trend = Utils.randFloat(-3, 3);
      height += trend + Utils.randFloat(-3, 3);
      height = Utils.clamp(height, CONSTANTS.HEIGHT - 300, CONSTANTS.HEIGHT - 30);
      points.push({ x: i * segWidth, y: height });
    }
    return height;
  },

  // Scroll terrain points
  scroll(points, amount) {
    for (const p of points) {
      p.x -= amount;
    }

    // Remove off-screen points
    while (points.length > 4 && points[0].x < -20) {
      points.shift();
    }

    // Add new points at the end
    const lastPoint = points[points.length - 2]; // -2 because last is the bottom-close point
    if (lastPoint && lastPoint.x < CONSTANTS.WIDTH + 100) {
      let newY = lastPoint.y + Utils.randFloat(-10, 10);
      newY = Utils.clamp(newY, CONSTANTS.HEIGHT - 300, CONSTANTS.HEIGHT - 30);
      points.splice(points.length - 1, 0, { x: lastPoint.x + CONSTANTS.WORLD.SEGMENT_WIDTH, y: newY });
    }
  },

  // Get sky color based on level
  getSkyColor(levelId) {
    const colors = [
      ['#87CEEB', '#E0F0FF'],  // 1: Savannah - bright blue
      ['#7EC8E3', '#D6EAF8'],  // 2: Rocky Hills - light blue
      ['#6BB3D9', '#C4DFE8'],  // 3: Bird Valley
      ['#5DADE2', '#AED6F1'],  // 4: Dinosaur Plains
      ['#5499C7', '#85C1E9'],  // 5: Mountain Pass
      ['#E74C3C', '#FADBD8'],  // 6: Volcanic Zone - reddish
      ['#2C3E50', '#5D6D7E'],  // 7: Stormy Skies - dark
      ['#1ABC9C', '#A3E4D7'],  // 8: Jungle River - greenish
      ['#AED6F1', '#EAF2F8'],  // 9: Ice Caves - icy
      ['#2C3E50', '#E74C3C'],  // 10: Final - dramatic
    ];
    return colors[(levelId - 1) % colors.length];
  },

  // Get ground color based on level
  getGroundColor(levelId) {
    const colors = [
      '#8B7355',  // 1: Savannah - brown
      '#7F8C8D',  // 2: Rocky Hills - gray
      '#6B8E23',  // 3: Bird Valley - olive
      '#8B7355',  // 4: Dinosaur Plains
      '#696969',  // 5: Mountain Pass - dim gray
      '#4A3728',  // 6: Volcanic - dark brown
      '#4A4A4A',  // 7: Stormy - dark gray
      '#228B22',  // 8: Jungle - forest green
      '#B0C4DE',  // 9: Ice Caves - light steel blue
      '#3D3D3D',  // 10: Final - very dark
    ];
    return colors[(levelId - 1) % colors.length];
  },
};
