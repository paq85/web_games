// Helicopter tests - inline implementation
const CONSTANTS = {
  HELI: {
    WIDTH: 48, HEIGHT: 32, RISE_SPEED: 3.5, GRAVITY: 0.15,
    MAX_FUEL: 100, FUEL_DRAIN: 0.08, FUEL_DRAIN_HOVER: 0.15,
    MAX_HEALTH: 100, INVINCIBLE_TIME: 2000,
  },
};

const Helicopter = {
  x: 100, y: 200, vx: 0, vy: 0,
  width: CONSTANTS.HELI.WIDTH, height: CONSTANTS.HELI.HEIGHT,
  fuel: CONSTANTS.HELI.MAX_FUEL, health: CONSTANTS.HELI.MAX_HEALTH,
  carrying: false, invincible: false, invincibleTimer: 0,
  alive: true,

  init(x, y) {
    this.x = x || 100; this.y = y || 200;
    this.vx = 0; this.vy = 0;
    this.fuel = CONSTANTS.HELI.MAX_FUEL;
    this.health = CONSTANTS.HELI.MAX_HEALTH;
    this.carrying = false;
    this.invincible = false; this.invincibleTimer = 0;
    this.alive = true;
  },

  takeDamage(amount) {
    if (this.invincible || !this.alive) return false;
    this.health -= amount;
    this.invincible = true;
    this.invincibleTimer = CONSTANTS.HELI.INVINCIBLE_TIME;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      return true;
    }
    return false;
  },

  addFuel(amount) {
    this.fuel = Math.min(this.fuel + amount, CONSTANTS.HELI.MAX_FUEL);
  },

  pickupPassenger() { this.carrying = true; },
  deliverPassenger() { this.carrying = false; },
};

describe('Helicopter', () => {
  beforeEach(() => {
    Helicopter.init(100, 200);
  });

  describe('init', () => {
    it('sets default position', () => {
      Helicopter.init();
      expect(Helicopter.x).toBe(100);
      expect(Helicopter.y).toBe(200);
    });

    it('accepts custom position', () => {
      Helicopter.init(50, 150);
      expect(Helicopter.x).toBe(50);
      expect(Helicopter.y).toBe(150);
    });

    it('resets all state', () => {
      Helicopter.fuel = 0;
      Helicopter.health = 0;
      Helicopter.alive = false;
      Helicopter.carrying = true;
      Helicopter.invincible = true;
      Helicopter.init();
      expect(Helicopter.fuel).toBe(CONSTANTS.HELI.MAX_FUEL);
      expect(Helicopter.health).toBe(CONSTANTS.HELI.MAX_HEALTH);
      expect(Helicopter.alive).toBe(true);
      expect(Helicopter.carrying).toBe(false);
      expect(Helicopter.invincible).toBe(false);
    });
  });

  describe('takeDamage', () => {
    it('reduces health', () => {
      Helicopter.takeDamage(20);
      expect(Helicopter.health).toBe(80);
    });

    it('makes helicopter invincible', () => {
      Helicopter.takeDamage(20);
      expect(Helicopter.invincible).toBe(true);
    });

    it('does not damage when invincible', () => {
      Helicopter.invincible = true;
      Helicopter.health = 80;
      Helicopter.takeDamage(20);
      expect(Helicopter.health).toBe(80);
    });

    it('kills helicopter when health reaches 0', () => {
      Helicopter.health = 20;
      const died = Helicopter.takeDamage(30);
      expect(died).toBe(true);
      expect(Helicopter.alive).toBe(false);
      expect(Helicopter.health).toBe(0);
    });

    it('returns false when not dead', () => {
      expect(Helicopter.takeDamage(20)).toBe(false);
      expect(Helicopter.alive).toBe(true);
    });

    it('does not damage dead helicopter', () => {
      Helicopter.health = 20;
      Helicopter.takeDamage(30); // kill it
      expect(Helicopter.alive).toBe(false);
      Helicopter.takeDamage(20); // try to damage again
      expect(Helicopter.health).toBe(0); // should stay at 0
    });
  });

  describe('addFuel', () => {
    it('adds fuel', () => {
      Helicopter.fuel = 50;
      Helicopter.addFuel(25);
      expect(Helicopter.fuel).toBe(75);
    });

    it('caps fuel at maximum', () => {
      Helicopter.fuel = 90;
      Helicopter.addFuel(25);
      expect(Helicopter.fuel).toBe(CONSTANTS.HELI.MAX_FUEL);
    });
  });

  describe('passenger', () => {
    it('picks up passenger', () => {
      expect(Helicopter.carrying).toBe(false);
      Helicopter.pickupPassenger();
      expect(Helicopter.carrying).toBe(true);
    });

    it('delivers passenger', () => {
      Helicopter.pickupPassenger();
      Helicopter.deliverPassenger();
      expect(Helicopter.carrying).toBe(false);
    });
  });
});
