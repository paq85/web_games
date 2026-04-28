// Game entities: passengers, destinations, hazards, collectibles
const Entities = {
  passengers: [],
  destinations: [],
  hazards: [],
  collectibles: [],
  spawnTimer: 0,
  passengerIndex: 0,
  deliveriesCompleted: 0,
  totalDeliveries: 0,

  init(levelConfig) {
    this.passengers = [];
    this.destinations = [];
    this.hazards = [];
    this.collectibles = [];
    this.spawnTimer = 0;
    this.passengerIndex = 0;
    this.deliveriesCompleted = 0;
    this.totalDeliveries = levelConfig.deliveries;
  },

  // Spawn a new passenger
  spawnPassenger() {
    if (this.passengerIndex >= this.totalDeliveries) return;
    if (this.passengers.length > 0) return; // Only one passenger at a time

    const y = Utils.randInt(80, CONSTANTS.HEIGHT - 150);
    this.passengers.push({
      x: CONSTANTS.WIDTH + 50,
      y: y,
      width: CONSTANTS.PASSENGER.WIDTH,
      height: CONSTANTS.PASSENGER.HEIGHT,
      id: this.passengerIndex,
    });
  },

  // Spawn destination when carrying passenger
  spawnDestination() {
    if (this.destinations.length > 0) return;

    const y = Utils.randInt(60, CONSTANTS.HEIGHT - 150);
    this.destinations.push({
      x: CONSTANTS.WIDTH + 100,
      y: y,
      width: 30,
      height: 40,
    });
  },

  // Spawn a hazard
  spawnHazard(levelConfig) {
    const types = levelConfig.hazards;
    const type = types[Utils.randInt(0, types.length - 1)];
    const config = CONSTANTS.HAZARD[type.toUpperCase()] || CONSTANTS.HAZARD.TREE;

    let y;
    switch (type) {
      case 'bird':
        y = Utils.randInt(30, CONSTANTS.HEIGHT - 200);
        break;
      case 'volcano':
        y = Utils.randInt(50, CONSTANTS.HEIGHT - 250);
        break;
      case 'lightning':
        y = Utils.randInt(-50, 50);
        break;
      case 'dinosaur':
        y = CONSTANTS.HEIGHT - 80 - Utils.randInt(0, 40);
        break;
      default:
        y = CONSTANTS.HEIGHT - config.height - Utils.randInt(0, 30);
    }

    this.hazards.push({
      x: CONSTANTS.WIDTH + 20,
      y: y,
      width: config.width,
      height: config.height,
      type: type,
      damage: config.damage,
      speed: config.speed,
    });
  },

  // Spawn a collectible
  spawnCollectible() {
    const type = Math.random() < 0.4 ? 'fuel_can' : 'score_item';
    const config = type === 'fuel_can'
      ? CONSTANTS.COLLECTIBLE.FUEL_CAN
      : CONSTANTS.COLLECTIBLE.SCORE_ITEM;

    this.collectibles.push({
      x: CONSTANTS.WIDTH + 30,
      y: Utils.randInt(60, CONSTANTS.HEIGHT - 120),
      width: config.width,
      height: config.height,
      type: type,
    });
  },

  // Update all entities
  update(dt, scrollSpeed, levelConfig, heli) {
    const speed = scrollSpeed * levelConfig.speed;

    // Spawn logic
    this.spawnTimer += dt;
    if (this.spawnTimer > 120 / speed) { // ~2 seconds at base speed
      this.spawnTimer = 0;

      // Spawn passenger if needed
      if (this.passengerIndex < this.totalDeliveries && this.passengers.length === 0 && !heli.carrying) {
        this.spawnPassenger();
      }

      // Spawn destination if carrying passenger
      if (heli.carrying && this.destinations.length === 0) {
        this.spawnDestination();
      }

      // Spawn hazards periodically
      if (Math.random() < 0.5 * speed) {
        this.spawnHazard(levelConfig);
      }

      // Spawn collectibles occasionally
      if (Math.random() < 0.15) {
        this.spawnCollectible();
      }
    }

    // Move and cull passengers
    for (let i = this.passengers.length - 1; i >= 0; i--) {
      this.passengers[i].x -= speed;
      if (this.passengers[i].x < -50) {
        this.passengers.splice(i, 1);
        this.passengerIndex++; // Missed passenger, move to next
      }
    }

    // Move and cull destinations
    for (let i = this.destinations.length - 1; i >= 0; i--) {
      this.destinations[i].x -= speed;
      if (this.destinations[i].x < -50) {
        this.destinations.splice(i, 1);
        heli.deliverPassenger(); // Missed delivery
        this.passengerIndex++;
      }
    }

    // Move and cull hazards
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.x -= speed + (h.type === 'bird' || h.type === 'volcano' ? h.speed : 0);
      if (h.type === 'bird') {
        h.y += Math.sin(Date.now() / 300) * 0.5;
      }
      if (h.x < -50) {
        this.hazards.splice(i, 1);
      }
    }

    // Move and cull collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      this.collectibles[i].x -= speed;
      if (this.collectibles[i].x < -50) {
        this.collectibles.splice(i, 1);
      }
    }
  },

  // Check passenger pickup
  checkPassengerPickup(heli) {
    if (heli.carrying) return false;

    const heliBox = { x: heli.x, y: heli.y, w: heli.width, h: heli.height };

    for (let i = this.passengers.length - 1; i >= 0; i--) {
      const p = this.passengers[i];
      const pBox = { x: p.x, y: p.y, w: p.width, h: p.height };

      if (Collision.aabb(heliBox, pBox)) {
        heli.pickupPassenger();
        this.passengers.splice(i, 1);
        AudioSystem.sfx.pickup();
        return true;
      }
    }
    return false;
  },

  // Check destination delivery - returns score delta
  checkDelivery(heli) {
    if (!heli.carrying) return 0;

    const heliBox = { x: heli.x, y: heli.y, w: heli.width, h: heli.height };

    for (let i = this.destinations.length - 1; i >= 0; i--) {
      const d = this.destinations[i];
      const dBox = { x: d.x, y: d.y, w: d.width, h: d.height };

      if (Collision.aabb(heliBox, dBox)) {
        heli.deliverPassenger();
        this.destinations.splice(i, 1);
        this.deliveriesCompleted++;
        AudioSystem.sfx.delivery();
        return CONSTANTS.SCORE.DELIVERY;
      }
    }
    return 0;
  },

  // Check hazard collisions
  checkHazardCollisions(heli) {
    const heliBox = { x: heli.x, y: heli.y, w: heli.width, h: heli.height };
    let hit = false;

    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      const hBox = { x: h.x, y: h.y, w: h.width, h: h.height };

      if (Collision.aabb(heliBox, hBox)) {
        const died = heli.takeDamage(h.damage);
        this.hazards.splice(i, 1);
        hit = true;
        if (died) return true; // helicopter died
      }
    }
    return false;
  },

  // Check collectible pickups - returns score delta
  checkCollectiblePickup(heli) {
    const heliBox = { x: heli.x, y: heli.y, w: heli.width, h: heli.height };
    let scoreDelta = 0;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      const cBox = { x: c.x, y: c.y, w: c.width, h: c.height };

      if (Collision.aabb(heliBox, cBox)) {
        if (c.type === 'fuel_can') {
          heli.addFuel(CONSTANTS.COLLECTIBLE.FUEL_CAN.fuel);
          scoreDelta += CONSTANTS.COLLECTIBLE.FUEL_CAN.score;
          AudioSystem.sfx.fuelCan();
        } else {
          scoreDelta += CONSTANTS.COLLECTIBLE.SCORE_ITEM.score;
          AudioSystem.sfx.collectible();
        }
        this.collectibles.splice(i, 1);
      }
    }
    return scoreDelta;
  },

  // Check if level is complete
  isLevelComplete() {
    return this.deliveriesCompleted >= this.totalDeliveries;
  },
};
