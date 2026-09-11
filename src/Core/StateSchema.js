/**
 * Game FreeWorld - StateSchema (v5.0)
 * Authoritative persistent-state serialization schema definitions
 * Guarantees serializable JSON structure across all 20 simulation sub-states
 */

export const SAVE_VERSION = 5;
export const SCHEMA_VERSION = 1;
export const MIGRATION_VERSION = 1;

export const INITIAL_STATE_SCHEMA = {
  saveVersion: SAVE_VERSION,
  schemaVersion: SCHEMA_VERSION,
  migrationVersion: MIGRATION_VERSION,
  timestamp: Date.now(),

  worldState: {
    currentDistrict: 'Downtown Core',
    timeOfDay: 12.0,
    dayCount: 1,
    destroyedProps: [],
    activeSectors: ['0_0']
  },

  playerState: {
    isAlive: true,
    inVehicle: false,
    currentVehicleId: null,
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 100,
    stamina: 100,
    maxStamina: 100,
    position: { x: 0, y: 0.5, z: 0 },
    rotation: { y: 0 },
    inventory: [],
    weapons: [
      { id: 1, name: 'VORTEX-9', ammo: 48 },
      { id: 2, name: 'APEX CARBINE', ammo: 120 }
    ],
    cash: 15400,
    bank: 45000
  },

  vehicleState: {
    ownedVehicles: [],
    stolenVehiclesCount: 0,
    activePursuitVehicle: null,
    fleetRegistry: {}
  },

  npcState: {
    totalSpawned: 0,
    civilianPanicLevel: 0,
    activeWitnesses: []
  },

  zombieState: {
    totalZombies: 0,
    activeHordes: [],
    killCount: 0,
    alertLevel: 0
  },

  buildingState: {
    buildings: {},
    activeBlackouts: [],
    safehousesUnlocked: ['safehouse_downtown']
  },

  trafficState: {
    density: 'NORMAL',
    signalPhase: 'GREEN',
    activeTrafficCount: 0
  },

  policeState: {
    wantedLevel: 0,
    copsEvaded: 0,
    pursuitActive: false,
    dispatchedUnits: 0
  },

  emergencyState: {
    activeDispatches: [],
    ambulancesActive: 0,
    fireEnginesActive: 0
  },

  powerState: {
    grid: {
      Downtown: true,
      Harbor: true,
      Financial: true,
      Heights: true
    },
    substationsOperational: true
  },

  weatherState: {
    currentWeather: 'CLEAR',
    rainIntensity: 0.0,
    fogDensity: 0.0,
    windSpeed: 5.0
  },

  storyState: {
    currentChapter: 'PROLOGUE',
    completedChapters: [],
    storyFlags: {},
    unlockedFlashbacks: []
  },

  missionState: {
    activeMission: null,
    stage: 0,
    completedMissions: []
  },

  relationshipState: {
    factions: {
      Police: 0,
      Syndicate: 50,
      Civilians: 75
    },
    characterRep: {}
  },

  investigationState: {
    cluesDiscovered: [],
    openCases: [],
    evidenceCollected: []
  },

  bucketListState: {
    completedItems: [],
    progress: {}
  },

  outbreakState: {
    stage: 0,
    stageName: 'NORMAL',
    infectedCount: 0,
    quarantineZones: []
  },

  persistenceState: {
    lastSaveTime: Date.now(),
    saveCount: 0,
    autoSaveEnabled: true
  },

  performanceState: {
    targetFPS: 60,
    qualityPreset: 'HIGH',
    lodTier: 'MID'
  }
};

export class StateSchema {
  static createDefaultState() {
    return JSON.parse(JSON.stringify(INITIAL_STATE_SCHEMA));
  }

  static validateSchema(data) {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.saveVersion !== 'number' && typeof data.version !== 'number') return false;
    if (!data.playerState && !data.player) return false;
    return true;
  }
}

