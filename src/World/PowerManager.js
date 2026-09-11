/**
 * Game FreeWorld - PowerManager (v5.0)
 * Systemic multi-tier power grid simulation controlling master PowerGrid, DistrictPower,
 * BuildingPower, and EmergencyPower backups. Manages blackout triggers, traffic signal states,
 * streetlamps, and emergency lighting.
 */

import { events } from '../Core/EventBus.js';
import { GameState } from '../Core/GameState.js';

export class PowerManager {
  constructor() {
    this.isMasterGridOnline = true;
    this.districtPower = {
      'Downtown Core': true,
      'Financial District': true,
      'Harbor District': true,
      'Heights Residential': true,
      'Suburbs': true
    };

    this.buildingsMap = new Map();
    this.substationsMap = new Map();
    this.setupListeners();
  }

  setupListeners() {
    events.on('TIME_UPDATE', ({ hour }) => {
      // Automatic streetlamp control (on between 19:00 and 06:00 if powered)
      const isNight = hour >= 19 || hour < 6;
      events.emit('STREETLAMPS_TOGGLED', { isNight, isPowered: this.isMasterGridOnline });
    });

    events.on('DISTRICT_BLACKOUT_TRIGGERED', ({ district }) => {
      this.setDistrictPower(district, false);
    });

    events.on('DISTRICT_POWER_RESTORED', ({ district }) => {
      this.setDistrictPower(district, true);
    });
  }

  /**
   * Register a building state engine with PowerManager
   */
  registerBuilding(buildingId, buildingStateEngine, district = 'Downtown Core') {
    this.buildingsMap.set(buildingId, {
      engine: buildingStateEngine,
      district,
      hasBreakerTripped: false
    });
  }

  /**
   * Toggle Central Master Power Grid
   */
  setMasterGridPower(isOnline) {
    if (this.isMasterGridOnline === isOnline) return;

    this.isMasterGridOnline = isOnline;

    Object.keys(this.districtPower).forEach(district => {
      this.districtPower[district] = isOnline;
    });

    this.updateAllBuildingPower();

    const gameState = GameState.get();
    if (gameState && gameState.powerState) {
      gameState.powerState.masterGridOnline = isOnline;
      Object.keys(this.districtPower).forEach(d => {
        gameState.powerState.grid[d] = isOnline;
      });
    }

    events.emit('MASTER_POWER_GRID_CHANGED', { isOnline });
    events.emit('POWER_GRID_STATE_CHANGED', { isPowered: isOnline });
  }

  /**
   * Toggle power for a specific district
   */
  setDistrictPower(district, isPowered) {
    if (this.districtPower[district] === isPowered) return;

    this.districtPower[district] = isPowered;

    this.buildingsMap.forEach((data) => {
      if (data.district === district) {
        this.updateBuildingPower(data);
      }
    });

    const gameState = GameState.get();
    if (gameState && gameState.powerState && gameState.powerState.grid) {
      gameState.powerState.grid[district] = isPowered;
    }

    events.emit('DISTRICT_POWER_CHANGED', { district, isPowered });
  }

  /**
   * Toggle power for a single building's main breaker
   */
  setBuildingBreaker(buildingId, isEngaged) {
    const data = this.buildingsMap.get(buildingId);
    if (!data) return;

    data.hasBreakerTripped = !isEngaged;
    this.updateBuildingPower(data);
  }

  updateBuildingPower(data) {
    const isDistrictPowered = this.districtPower[data.district] && this.isMasterGridOnline;
    const isBuildingPowered = isDistrictPowered && !data.hasBreakerTripped;

    if (data.engine) {
      data.engine.togglePowerGrid(isBuildingPowered);
    }
  }

  updateAllBuildingPower() {
    this.buildingsMap.forEach(data => this.updateBuildingPower(data));
  }

  /**
   * Get traffic signal status based on district power
   */
  getTrafficSignalMode(district = 'Downtown Core') {
    const isPowered = this.districtPower[district] && this.isMasterGridOnline;
    return isPowered ? 'NORMAL_CYCLED' : 'FLASHING_AMBER';
  }

  toJSON() {
    const buildingsState = {};
    this.buildingsMap.forEach((data, id) => {
      buildingsState[id] = {
        hasBreakerTripped: data.hasBreakerTripped,
        district: data.district
      };
    });

    return {
      isMasterGridOnline: this.isMasterGridOnline,
      districtPower: { ...this.districtPower },
      buildingsState
    };
  }

  fromJSON(data) {
    if (!data) return;
    if (data.isMasterGridOnline !== undefined) this.isMasterGridOnline = data.isMasterGridOnline;
    if (data.districtPower) this.districtPower = { ...this.districtPower, ...data.districtPower };

    if (data.buildingsState) {
      Object.entries(data.buildingsState).forEach(([id, bState]) => {
        const existing = this.buildingsMap.get(id);
        if (existing) {
          existing.hasBreakerTripped = bState.hasBreakerTripped;
        }
      });
    }

    this.updateAllBuildingPower();
  }
}
