/**
 * Game FreeWorld - SaveSchema (v5.0)
 * Versioned save data schema with migration and validation support
 */
import { SAVE_VERSION, SCHEMA_VERSION, MIGRATION_VERSION, StateSchema } from '../Core/StateSchema.js';

export { SAVE_VERSION, SCHEMA_VERSION, MIGRATION_VERSION };

export class SaveSchema {
  static createDefaultSave() {
    return StateSchema.createDefaultState();
  }

  static validate(data) {
    if (!data || typeof data !== 'object') return false;
    if (data.saveVersion === undefined && data.version === undefined) return false;
    return true;
  }

  static migrate(data) {
    if (!data || typeof data !== 'object') {
      return this.createDefaultSave();
    }

    const defaultState = this.createDefaultSave();

    // Version Migration Pipeline (v1, v2, v3, v4 -> v5)
    const currentVersion = data.saveVersion || data.version || 1;

    let migrated = { ...defaultState };

    if (currentVersion < 5) {
      console.log(`[SaveSchema] Migrating save data from version ${currentVersion} to ${SAVE_VERSION}...`);

      // Migrate player vitals & position
      if (data.player) {
        if (data.player.health !== undefined) migrated.playerState.health = data.player.health;
        if (data.player.armor !== undefined) migrated.playerState.armor = data.player.armor;
        if (data.player.stamina !== undefined) migrated.playerState.stamina = data.player.stamina;
        if (data.player.position) migrated.playerState.position = { ...data.player.position };
        if (data.player.cash !== undefined) migrated.playerState.cash = data.player.cash;
        if (data.player.bank !== undefined) migrated.playerState.bank = data.player.bank;
        if (data.player.weapons) migrated.playerState.weapons = [...data.player.weapons];
      }

      // Migrate economy
      if (data.economy) {
        if (data.economy.cash !== undefined) migrated.playerState.cash = data.economy.cash;
        if (data.economy.bank !== undefined) migrated.playerState.bank = data.economy.bank;
      }

      // Migrate police wanted level
      if (data.wantedLevel !== undefined) {
        migrated.policeState.wantedLevel = data.wantedLevel;
      }

      // Migrate time of day
      if (data.timeOfDay !== undefined) {
        migrated.worldState.timeOfDay = data.timeOfDay;
      }

      // Migrate outbreak stage
      if (data.outbreakStage !== undefined) {
        migrated.outbreakState.stage = data.outbreakStage;
      }
    } else {
      // Version 5 structure
      migrated = { ...defaultState, ...data };
      if (data.worldState) migrated.worldState = { ...defaultState.worldState, ...data.worldState };
      if (data.playerState) migrated.playerState = { ...defaultState.playerState, ...data.playerState };
      if (data.vehicleState) migrated.vehicleState = { ...defaultState.vehicleState, ...data.vehicleState };
      if (data.npcState) migrated.npcState = { ...defaultState.npcState, ...data.npcState };
      if (data.zombieState) migrated.zombieState = { ...defaultState.zombieState, ...data.zombieState };
      if (data.buildingState) migrated.buildingState = { ...defaultState.buildingState, ...data.buildingState };
      if (data.trafficState) migrated.trafficState = { ...defaultState.trafficState, ...data.trafficState };
      if (data.policeState) migrated.policeState = { ...defaultState.policeState, ...data.policeState };
      if (data.emergencyState) migrated.emergencyState = { ...defaultState.emergencyState, ...data.emergencyState };
      if (data.powerState) migrated.powerState = { ...defaultState.powerState, ...data.powerState };
      if (data.weatherState) migrated.weatherState = { ...defaultState.weatherState, ...defaultState.weatherState, ...data.weatherState };
      if (data.storyState) migrated.storyState = { ...defaultState.storyState, ...data.storyState };
      if (data.missionState) migrated.missionState = { ...defaultState.missionState, ...data.missionState };
      if (data.relationshipState) migrated.relationshipState = { ...defaultState.relationshipState, ...data.relationshipState };
      if (data.investigationState) migrated.investigationState = { ...defaultState.investigationState, ...data.investigationState };
      if (data.bucketListState) migrated.bucketListState = { ...defaultState.bucketListState, ...data.bucketListState };
      if (data.outbreakState) migrated.outbreakState = { ...defaultState.outbreakState, ...data.outbreakState };
      if (data.persistenceState) migrated.persistenceState = { ...defaultState.persistenceState, ...data.persistenceState };
      if (data.performanceState) migrated.performanceState = { ...defaultState.performanceState, ...data.performanceState };
    }

    migrated.saveVersion = SAVE_VERSION;
    migrated.schemaVersion = SCHEMA_VERSION;
    migrated.migrationVersion = MIGRATION_VERSION;
    migrated.timestamp = Date.now();

    return migrated;
  }
}

