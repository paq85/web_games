// Helicopter entity
const Helicopter = {
  x: 100,
  y: 200,
  vx: 0,
  vy: 0,
  width: CONSTANTS.HELI.WIDTH,
  height: CONSTANTS.HELI.HEIGHT,
  fuel: CONSTANTS.HELI.MAX_FUEL,
  health: CONSTANTS.HELI.MAX_HEALTH,
  carrying: false,
  invincible: false,
  invincibleTimer: 0,
  boosting: false,
  boostTimer: 0,
  rotorAngle: 0,
  alive: true,

  init(x, y) {
    this.x = x || 100;
    this.y = y || 200;
    this.vx = 0;
    this.vy = 0;
    this.fuel = CONSTANTS.HELI.MAX_FUEL;
    this.health = CONSTANTS.HELI.MAX_HEALTH;
    this.carrying = false;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.boosting = false;
    this.boostTimer = 0;
    this.rotorAngle = 0;
    this.alive = true;
  },

  update(dt, fuelRate) {
    if (!this.alive) return;

    // Rotor animation
    this.rotorAngle += dt * 10;

    // Gravity
    this.vy += CONSTANTS.HELI.GRAVITY;

    // Fuel drain
    const drain = this.boosting
      ? CONSTANTS.HELI.BOOST_FUEL_COST * fuelRate
      : CONSTANTS.HELI.FUEL_DRAIN * fuelRate;
    this.fuel -= drain * dt * 0.06;
    this.fuel = Utils.clamp(this.fuel, 0, CONSTANTS.HELI.MAX_FUEL);

    // Movement
    if (Input.isPressed('up') && this.fuel > 0) {
      this.vy -= CONSTANTS.HELI.RISE_SPEED * 0.3;
      this.fuel -= CONSTANTS.HELI.FUEL_DRAIN_HOVER * fuelRate * dt * 0.06;
    }

    if (Input.isPressed('left')) {
      this.vx = -CONSTANTS.HELI.MOVE_SPEED;
    } else if (Input.isPressed('right')) {
      this.vx = CONSTANTS.HELI.MOVE_SPEED;
    } else {
      this.vx *= 0.9;
    }

    // Boost
    if (Input.isPressed('action') && !this.boosting && this.fuel > 10) {
      this.boosting = true;
      this.boostTimer = CONSTANTS.HELI.BOOST_DURATION;
      AudioSystem.sfx.boost();
    }

    if (this.boosting) {
      this.boostTimer -= dt * 16.67;
      this.vy -= CONSTANTS.HELI.RISE_SPEED * 0.5;
      if (this.boostTimer <= 0) {
        this.boosting = false;
      }
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;

    // Terminal velocity
    this.vy = Utils.clamp(this.vy, -6, 6);

    // Boundaries
    this.x = Utils.clamp(this.x, 0, CONSTANTS.WIDTH - this.width);
    this.y = Utils.clamp(this.y, 0, CONSTANTS.HEIGHT - this.height - 20);

    // Invincibility timer
    if (this.invincible) {
      this.invincibleTimer -= dt * 16.67;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }

    // Fuel empty check
    if (this.fuel <= 0) {
      this.vy += 0.3; // Extra gravity when out of fuel
    }
  },

  takeDamage(amount) {
    if (this.invincible || !this.alive) return false;

    this.health -= amount;
    this.invincible = true;
    this.invincibleTimer = CONSTANTS.HELI.INVINCIBLE_TIME;
    AudioSystem.sfx.damage();

    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      AudioSystem.sfx.explosion();
      return true; // died
    }
    return false;
  },

  addFuel(amount) {
    this.fuel = Utils.clamp(this.fuel + amount, 0, CONSTANTS.HELI.MAX_FUEL);
  },

  pickupPassenger() {
    this.carrying = true;
  },

  deliverPassenger() {
    this.carrying = false;
  },
};
