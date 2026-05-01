// Vehicle types - Car, Truck, Bulldozer
import { Obstacle } from './obstacle.js';

export class Car extends Obstacle {
  constructor(config) {
    super(config);
    this.type = 'car';
  }
}

export class Truck extends Obstacle {
  constructor(config) {
    super(config);
    this.type = 'truck';
  }
}

export class Bulldozer extends Obstacle {
  constructor(config) {
    super(config);
    this.type = 'bulldozer';
  }
}

// Factory to create the right vehicle type
export function createVehicle(type, config) {
  switch (type) {
    case 'car': return new Car(config);
    case 'truck': return new Truck(config);
    case 'bulldozer': return new Bulldozer(config);
    default: return new Obstacle(config);
  }
}
