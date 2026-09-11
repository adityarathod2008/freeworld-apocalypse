/**
 * Game FreeWorld - StateSchema (v5.0)
 * Early persistent-state serialization schema definitions
 * Guarantees serializable JSON structure across all simulation subsystems
 */

export const INITIAL_STATE_SCHEMA = {
  version: 5,
  timestamp: Date.now(),
  player: {
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 100,
    stamina: 100,
    maxStamina: 100,
    position: { x: 0, y: 0.5, z: 0 },
    rotation: { y: 0 },
    inventory: []
  },
  economy: {
    cash: 15400,
    bank: 45000
  },
  district: 'Downtown Core',
  outbreakStage: 0,
  powerGridState: {
    Downtown: true,
    Harbor: true,
    Financial: true,
    Heights: true
  },
  metroState: {
    lineId: 'RED_LINE',
    status: 'OPERATIONAL',
    activeTrains: []
  },
  storyState: {
    currentChapter: 'PROLOGUE',
    completedChapters: [],
    storyFlags: {}
  },
  sectors: {
    sectorSpan: 60,
    activePlayerSector: '0_0',
    sectors: []
  },
  bucketListProgress: [],
  destroyedProps: [],
  infectedNPCs: []
};

export class StateSchema {
  static createDefaultState() {
    return JSON.parse(JSON.stringify(INITIAL_STATE_SCHEMA));
  }

  static validateSchema(data) {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.version !== 'number') return false;
    if (!data.player || typeof data.player.health !== 'number') return false;
    if (!data.economy || typeof data.economy.cash !== 'number') return false;
    if (data.sectors && typeof data.sectors.sectorSpan !== 'number') return false;
    return true;
  }
}
