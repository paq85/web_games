// Game constants
const CONSTANTS = {
  // Canvas logical size
  WIDTH: 800,
  HEIGHT: 450,

  // Game states
  STATE: {
    TITLE: 'title',
    LEVEL_INTRO: 'level_intro',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over',
    CAMPAIGN_COMPLETE: 'campaign_complete',
    SETTINGS: 'settings',
    TURN: 'turn',
  },

  // Game modes
  MODE: {
    SINGLE: 'single',
    MULTI: 'multi',
    HOTSEAT: 'hotseat',
  },

  // Helicopter
  HELI: {
    WIDTH: 48,
    HEIGHT: 32,
    RISE_SPEED: 3.5,
    FALL_SPEED: 2.5,
    MOVE_SPEED: 2.5,
    GRAVITY: 0.15,
    MAX_FUEL: 100,
    FUEL_DRAIN: 0.08,
    FUEL_DRAIN_HOVER: 0.15,
    MAX_HEALTH: 100,
    INVINCIBLE_TIME: 2000,
    BOOST_FUEL_COST: 3,
    BOOST_DURATION: 500,
  },

  // World
  WORLD: {
    SCROLL_SPEED: 1.5,
    TERRAIN_HEIGHT_MIN: 80,
    TERRAIN_HEIGHT_MAX: 200,
    SEGMENT_WIDTH: 4,
  },

  // Passengers
  PASSENGER: {
    WIDTH: 20,
    HEIGHT: 28,
    PICKUP_DISTANCE: 50,
    DELIVERY_SCORE: 100,
  },

  // Hazards
  HAZARD: {
    TREE: { width: 24, height: 60, damage: 15, speed: 0 },
    ROCK: { width: 30, height: 20, damage: 20, speed: 0 },
    BIRD: { width: 20, height: 16, damage: 10, speed: 2 },
    DINOSAUR: { width: 40, height: 36, damage: 30, speed: 1.2 },
    VOLCANO_ROCK: { width: 12, height: 12, damage: 25, speed: 3 },
    LIGHTNING: { width: 16, height: 50, damage: 35, speed: 0 },
  },

  // Collectibles
  COLLECTIBLE: {
    FUEL_CAN: { width: 16, height: 20, fuel: 25, score: 10 },
    SCORE_ITEM: { width: 16, height: 16, score: 50 },
  },

  // Levels
  LEVELS: [
    { id: 1, name: 'The Savannah', deliveries: 3, terrain: 'flat', hazards: ['tree', 'rock'], speed: 1.0, fuelRate: 1.0, hint: 'Watch out for trees and rocks!' },
    { id: 2, name: 'Rocky Hills', deliveries: 3, terrain: 'hilly', hazards: ['tree', 'rock'], speed: 1.1, fuelRate: 1.0, hint: 'The terrain gets rougher!' },
    { id: 3, name: 'Bird Valley', deliveries: 4, terrain: 'hilly', hazards: ['tree', 'rock', 'bird'], speed: 1.2, fuelRate: 1.1, hint: 'Watch the sky for birds!' },
    { id: 4, name: 'Dinosaur Plains', deliveries: 4, terrain: 'flat', hazards: ['tree', 'rock', 'dinosaur'], speed: 1.3, fuelRate: 1.1, hint: 'Dinosaurs roam the ground!' },
    { id: 5, name: 'Mountain Pass', deliveries: 4, terrain: 'mountain', hazards: ['tree', 'rock', 'bird'], speed: 1.3, fuelRate: 1.2, hint: 'Navigate through narrow passes!' },
    { id: 6, name: 'Volcanic Zone', deliveries: 5, terrain: 'hilly', hazards: ['tree', 'rock', 'volcano'], speed: 1.4, fuelRate: 1.2, hint: 'Avoid volcanic rocks!' },
    { id: 7, name: 'Stormy Skies', deliveries: 5, terrain: 'mountain', hazards: ['tree', 'rock', 'lightning'], speed: 1.4, fuelRate: 1.3, hint: 'Lightning strikes from above!' },
    { id: 8, name: 'Jungle River', deliveries: 5, terrain: 'hilly', hazards: ['tree', 'rock', 'bird', 'dinosaur'], speed: 1.5, fuelRate: 1.3, hint: 'Everything wants to hurt you!' },
    { id: 9, name: 'Ice Caves', deliveries: 6, terrain: 'mountain', hazards: ['rock', 'bird', 'dinosaur'], speed: 1.6, fuelRate: 1.4, hint: 'Slippery and dangerous!' },
    { id: 10, name: 'Final Frontier', deliveries: 6, terrain: 'mountain', hazards: ['tree', 'rock', 'bird', 'dinosaur', 'volcano', 'lightning'], speed: 1.7, fuelRate: 1.5, hint: 'Everything at once! Good luck!' },
  ],

  // Scoring
  SCORE: {
    DELIVERY: 100,
    FUEL_CAN: 10,
    COLLECTIBLE: 50,
    LEVEL_BONUS: 500,
    SURVIVAL: 1,
  },

  // Lives
  LIVES: 3,

  // Persistence keys
  STORAGE_KEY: 'ugh_save_data',
  SETTINGS_KEY: 'ugh_settings',
};
