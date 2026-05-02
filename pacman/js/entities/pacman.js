export function createPacman(spawn, speed) {
  return {
    name: 'Pac-Man',
    from: { x: spawn.x, y: spawn.y },
    to: { x: spawn.x, y: spawn.y },
    tile: { x: spawn.x, y: spawn.y },
    progress: 1,
    direction: spawn.direction ?? 'left',
    desiredDirection: spawn.direction ?? 'left',
    speed,
    mouthTimer: 0,
    lastMoveDirection: spawn.direction ?? 'left'
  };
}

export function resetPacman(pacman, spawn, speed) {
  pacman.from = { x: spawn.x, y: spawn.y };
  pacman.to = { x: spawn.x, y: spawn.y };
  pacman.tile = { x: spawn.x, y: spawn.y };
  pacman.progress = 1;
  pacman.direction = spawn.direction ?? 'left';
  pacman.desiredDirection = spawn.direction ?? 'left';
  pacman.speed = speed;
  pacman.mouthTimer = 0;
  pacman.lastMoveDirection = pacman.direction;
  return pacman;
}
