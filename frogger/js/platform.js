// Platform types - Log, Turtle
import { Obstacle } from './obstacle.js';

export class Log extends Obstacle {
  constructor(config) {
    super(config);
    this.type = 'log';
  }
}

export class Turtle extends Obstacle {
  constructor(config) {
    super(config);
    this.type = 'turtle';
    this.isDiver = config.isDiver || false;
    this.diveCycle = config.diveCycle || 0;
    this.diveInterval = config.diveInterval || 3;
    this.isDiving = false;
  }
}

// Factory to create the right platform type
export function createPlatform(type, config) {
  switch (type) {
    case 'log': return new Log(config);
    case 'turtle': return new Turtle(config);
    default: return new Obstacle(config);
  }
}
