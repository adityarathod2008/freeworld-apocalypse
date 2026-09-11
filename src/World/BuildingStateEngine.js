/**
 * Game FreeWorld - BuildingStateEngine (v5.0)
 * Authoritative 9-state building state engine controlling visual aesthetics, door locks,
 * security shutters, lighting, NPC occupancy, loot tables, and zombie accessibility.
 */

import { events } from '../Core/EventBus.js';

export const BUILDING_STATES = {
  NORMAL: 'NORMAL',
  ACTIVE: 'ACTIVE',
  ABANDONED: 'ABANDONED',
  POWER_FAILURE: 'POWER_FAILURE',
  LOCKDOWN: 'LOCKDOWN',
  DAMAGED: 'DAMAGED',
  INFESTED: 'INFESTED',
  OVERRUN: 'OVERRUN',
  SAFEHOUSE: 'SAFEHOUSE'
};

export class BuildingStateEngine {
  constructor(buildingId, initialState = BUILDING_STATES.NORMAL) {
    this.buildingId = buildingId;
    this.currentState = initialState;
    this.previousState = initialState;

    // Physical & Environmental Status
    this.health = 100; // 0 - 100%
    this.powerConnected = true;
    this.generatorFuel = 100; // Backup generator fuel %
    this.hasBackupGenerator = false;
    this.securityLevel = 1; // 0 (none) to 5 (military lockdown)
    this.doorsLocked = false;
    this.shuttersClosed = false;

    // Simulation & Gameplay
    this.npcOccupancyCount = 4;
    this.zombieAccessAllowed = true;
    this.lootTable = [];
    this.interior = null;

    this.applyStateConfig(initialState);
  }

  /**
   * Transition building to a new authoritative state
   */
  setState(newState) {
    if (!Object.values(BUILDING_STATES).includes(newState)) {
      console.warn(`[BuildingStateEngine] Invalid state '${newState}' for building ${this.buildingId}`);
      return false;
    }

    if (this.currentState === newState) return false;

    this.previousState = this.currentState;
    this.currentState = newState;

    this.applyStateConfig(newState);

    events.emit('BUILDING_STATE_CHANGED', {
      buildingId: this.buildingId,
      oldState: this.previousState,
      newState: this.currentState,
      config: this.getStateConfig()
    });

    return true;
  }

  /**
   * Apply visual, behavioral, and structural configurations for given state
   */
  applyStateConfig(state) {
    switch (state) {
      case BUILDING_STATES.NORMAL:
        this.powerConnected = true;
        this.doorsLocked = false;
        this.shuttersClosed = false;
        this.zombieAccessAllowed = true;
        this.npcOccupancyCount = 6;
        break;

      case BUILDING_STATES.ACTIVE:
        this.powerConnected = true;
        this.doorsLocked = false;
        this.shuttersClosed = false;
        this.zombieAccessAllowed = true;
        this.npcOccupancyCount = 12;
        break;

      case BUILDING_STATES.ABANDONED:
        this.powerConnected = false;
        this.doorsLocked = false;
        this.shuttersClosed = false;
        this.zombieAccessAllowed = true;
        this.npcOccupancyCount = 0;
        break;

      case BUILDING_STATES.POWER_FAILURE:
        this.powerConnected = false;
        this.doorsLocked = Math.random() > 0.5;
        this.shuttersClosed = false;
        this.zombieAccessAllowed = true;
        this.npcOccupancyCount = 2;
        break;

      case BUILDING_STATES.LOCKDOWN:
        this.powerConnected = true;
        this.doorsLocked = true;
        this.shuttersClosed = true;
        this.zombieAccessAllowed = false;
        this.npcOccupancyCount = 4;
        break;

      case BUILDING_STATES.DAMAGED:
        this.powerConnected = false;
        this.doorsLocked = false;
        this.shuttersClosed = false;
        this.zombieAccessAllowed = true;
        this.health = Math.min(this.health, 45);
        this.npcOccupancyCount = 0;
        break;

      case BUILDING_STATES.INFESTED:
        this.powerConnected = false;
        this.doorsLocked = false;
        this.shuttersClosed = false;
        this.zombieAccessAllowed = true;
        this.npcOccupancyCount = 0;
        break;

      case BUILDING_STATES.OVERRUN:
        this.powerConnected = false;
        this.doorsLocked = false;
        this.shuttersClosed = false;
        this.zombieAccessAllowed = true;
        this.health = Math.min(this.health, 20);
        this.npcOccupancyCount = 0;
        break;

      case BUILDING_STATES.SAFEHOUSE:
        this.powerConnected = true;
        this.hasBackupGenerator = true;
        this.generatorFuel = 100;
        this.doorsLocked = true;
        this.shuttersClosed = false;
        this.zombieAccessAllowed = false;
        this.npcOccupancyCount = 3;
        break;
    }

    if (this.interior) {
      this.interior.updateState(state);
    }
  }

  /**
   * Return behavioral and visual descriptors for current state
   */
  getStateConfig() {
    return {
      state: this.currentState,
      powerConnected: this.powerConnected,
      doorsLocked: this.doorsLocked,
      shuttersClosed: this.shuttersClosed,
      zombieAccessAllowed: this.zombieAccessAllowed,
      npcOccupancyCount: this.npcOccupancyCount,
      health: this.health,
      hasBackupGenerator: this.hasBackupGenerator,
      generatorFuel: this.generatorFuel
    };
  }

  /**
   * Apply damage to building structure
   */
  applyDamage(amount) {
    this.health = Math.max(0, this.health - amount);

    if (this.health <= 0 && this.currentState !== BUILDING_STATES.OVERRUN) {
      this.setState(BUILDING_STATES.DAMAGED);
    } else if (this.health < 50 && this.currentState === BUILDING_STATES.NORMAL) {
      this.setState(BUILDING_STATES.DAMAGED);
    }

    events.emit('BUILDING_DAMAGED', { buildingId: this.buildingId, health: this.health, amount });
  }

  /**
   * Toggle main grid power supply
   */
  togglePowerGrid(isPowered) {
    if (this.currentState === BUILDING_STATES.SAFEHOUSE && this.hasBackupGenerator && this.generatorFuel > 0) {
      // Safehouses maintain backup power
      this.powerConnected = true;
      return;
    }

    this.powerConnected = isPowered;

    if (!isPowered && this.currentState === BUILDING_STATES.NORMAL) {
      this.setState(BUILDING_STATES.POWER_FAILURE);
    } else if (isPowered && this.currentState === BUILDING_STATES.POWER_FAILURE) {
      this.setState(BUILDING_STATES.NORMAL);
    }
  }

  toJSON() {
    return {
      buildingId: this.buildingId,
      currentState: this.currentState,
      previousState: this.previousState,
      health: this.health,
      powerConnected: this.powerConnected,
      generatorFuel: this.generatorFuel,
      hasBackupGenerator: this.hasBackupGenerator,
      securityLevel: this.securityLevel,
      doorsLocked: this.doorsLocked,
      shuttersClosed: this.shuttersClosed,
      npcOccupancyCount: this.npcOccupancyCount,
      zombieAccessAllowed: this.zombieAccessAllowed
    };
  }

  fromJSON(data) {
    if (!data) return;
    if (data.currentState) this.currentState = data.currentState;
    if (data.previousState) this.previousState = data.previousState;

    this.applyStateConfig(this.currentState);

    if (data.health !== undefined) this.health = data.health;
    if (data.powerConnected !== undefined) this.powerConnected = data.powerConnected;
    if (data.generatorFuel !== undefined) this.generatorFuel = data.generatorFuel;
    if (data.hasBackupGenerator !== undefined) this.hasBackupGenerator = data.hasBackupGenerator;
    if (data.securityLevel !== undefined) this.securityLevel = data.securityLevel;
    if (data.doorsLocked !== undefined) this.doorsLocked = data.doorsLocked;
    if (data.shuttersClosed !== undefined) this.shuttersClosed = data.shuttersClosed;
    if (data.npcOccupancyCount !== undefined) this.npcOccupancyCount = data.npcOccupancyCount;
    if (data.zombieAccessAllowed !== undefined) this.zombieAccessAllowed = data.zombieAccessAllowed;
  }
}
