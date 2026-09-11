/**
 * Game FreeWorld - GameState (v5.0)
 * Central state machine and game status registry with early persistence serialization
 */
import { events } from './EventBus.js';
import { StateSchema } from './StateSchema.js';

export class GameState {
  static instance = null;

  constructor() {
    if (GameState.instance) return GameState.instance;
    GameState.instance = this;

    this.isPaused = false;
    this.isGameOver = false;
    this.currentDistrict = 'Downtown Core';
    this.qualityPreset = 'HIGH'; // 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA'

    this.player = {
      isAlive: true,
      inVehicle: false,
      currentVehicle: null,
      health: 100,
      maxHealth: 100,
      armor: 50,
      maxArmor: 100,
      stamina: 100,
      maxStamina: 100,
      position: { x: 0, y: 0.5, z: 0 },
      inventory: []
    };

    this.outbreakStage = 0;
    this.powerGridState = {
      Downtown: true,
      Harbor: true,
      Financial: true,
      Heights: true
    };

    this.stats = {
      crimesCommitted: 0,
      vehiclesStolen: 0,
      missionsCompleted: 0,
      copsEvaded: 0,
      cashEarned: 0
    };

    this.setupListeners();
  }

  static get() {
    if (!GameState.instance) new GameState();
    return GameState.instance;
  }

  setupListeners() {
    events.on('CRIME_COMMITTED', () => {
      this.stats.crimesCommitted++;
    });

    events.on('PLAYER_ENTERED_VEHICLE', (data) => {
      this.player.inVehicle = true;
      this.player.currentVehicle = data ? data.vehicle : null;
    });

    events.on('PLAYER_EXITED_VEHICLE', () => {
      this.player.inVehicle = false;
      this.player.currentVehicle = null;
    });

    events.on('SET_DISTRICT', (districtName) => {
      if (this.currentDistrict !== districtName) {
        this.currentDistrict = districtName;
        events.emit('DISTRICT_CHANGED', districtName);
      }
    });

    events.on('OUTBREAK_STAGE_CHANGED', ({ stage }) => {
      this.outbreakStage = stage;
    });

    events.on('POWER_GRID_STATE_CHANGED', ({ district, isPowered }) => {
      if (this.powerGridState[district] !== undefined) {
        this.powerGridState[district] = isPowered;
      }
    });
  }

  toJSON() {
    const defaultState = StateSchema.createDefaultState();
    defaultState.timestamp = Date.now();
    defaultState.currentDistrict = this.currentDistrict;
    defaultState.outbreakStage = this.outbreakStage;
    defaultState.powerGridState = { ...this.powerGridState };
    defaultState.player = {
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      armor: this.player.armor,
      maxArmor: this.player.maxArmor,
      stamina: this.player.stamina,
      maxStamina: this.player.maxStamina,
      position: { ...this.player.position },
      inventory: [...this.player.inventory]
    };
    return defaultState;
  }

  fromJSON(data) {
    if (!StateSchema.validateSchema(data)) {
      console.warn('[GameState] Invalid state schema during restoration');
      return false;
    }
    this.currentDistrict = data.currentDistrict || 'Downtown Core';
    this.outbreakStage = data.outbreakStage || 0;
    if (data.powerGridState) {
      this.powerGridState = { ...data.powerGridState };
    }
    if (data.player) {
      this.player.health = data.player.health;
      this.player.maxHealth = data.player.maxHealth;
      this.player.armor = data.player.armor;
      this.player.maxArmor = data.player.maxArmor;
      this.player.stamina = data.player.stamina;
      this.player.maxStamina = data.player.maxStamina;
      if (data.player.position) {
        this.player.position = { ...data.player.position };
      }
    }
    return true;
  }
}
