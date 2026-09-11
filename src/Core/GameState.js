/**
 * Game FreeWorld - GameState (v5.0)
 * Master central state machine and game status registry with authoritative serialization
 */
import { events } from './EventBus.js';
import { StateSchema, SAVE_VERSION, SCHEMA_VERSION, MIGRATION_VERSION } from './StateSchema.js';

export class GameState {
  static instance = null;

  constructor() {
    if (GameState.instance) return GameState.instance;
    GameState.instance = this;

    this.isPaused = false;
    this.isGameOver = false;

    // Authoritative Central Sub-States
    const initial = StateSchema.createDefaultState();

    this.worldState = initial.worldState;
    this.playerState = initial.playerState;
    this.vehicleState = initial.vehicleState;
    this.npcState = initial.npcState;
    this.zombieState = initial.zombieState;
    this.buildingState = initial.buildingState;
    this.trafficState = initial.trafficState;
    this.policeState = initial.policeState;
    this.emergencyState = initial.emergencyState;
    this.powerState = initial.powerState;
    this.weatherState = initial.weatherState;
    this.storyState = initial.storyState;
    this.missionState = initial.missionState;
    this.relationshipState = initial.relationshipState;
    this.investigationState = initial.investigationState;
    this.bucketListState = initial.bucketListState;
    this.outbreakState = initial.outbreakState;
    this.persistenceState = initial.persistenceState;
    this.performanceState = initial.performanceState;

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

  // Backwards Compatibility Accessors
  get player() {
    return this.playerState;
  }

  get currentDistrict() {
    return this.worldState.currentDistrict;
  }

  set currentDistrict(val) {
    this.worldState.currentDistrict = val;
  }

  get qualityPreset() {
    return this.performanceState.qualityPreset;
  }

  set qualityPreset(val) {
    this.performanceState.qualityPreset = val;
  }

  get outbreakStage() {
    return this.outbreakState.stage;
  }

  set outbreakStage(val) {
    this.outbreakState.stage = val;
  }

  get powerGridState() {
    return this.powerState.grid;
  }

  setupListeners() {
    events.on('CRIME_COMMITTED', () => {
      this.stats.crimesCommitted++;
      this.policeState.wantedLevel = Math.min(5, this.policeState.wantedLevel + 1);
    });

    events.on('CrimeCommitted', () => {
      this.stats.crimesCommitted++;
      this.policeState.wantedLevel = Math.min(5, this.policeState.wantedLevel + 1);
    });

    events.on('PLAYER_ENTERED_VEHICLE', (data) => {
      this.playerState.inVehicle = true;
      this.playerState.currentVehicleId = data && data.vehicle ? (data.vehicle.id || 'active_vehicle') : null;
    });

    events.on('PLAYER_EXITED_VEHICLE', () => {
      this.playerState.inVehicle = false;
      this.playerState.currentVehicleId = null;
    });

    events.on('SET_DISTRICT', (districtName) => {
      if (this.worldState.currentDistrict !== districtName) {
        this.worldState.currentDistrict = districtName;
        events.emit('DISTRICT_CHANGED', districtName);
      }
    });

    events.on('OUTBREAK_STAGE_CHANGED', ({ stage, stageName }) => {
      this.outbreakState.stage = stage;
      if (stageName) this.outbreakState.stageName = stageName;
      events.emit('OutbreakEscalated', { stage, stageName });
    });

    events.on('POWER_GRID_STATE_CHANGED', ({ district, isPowered }) => {
      if (this.powerState.grid[district] !== undefined) {
        this.powerState.grid[district] = isPowered;
        events.emit('PowerChanged', { district, isPowered });
      }
    });

    events.on('WANTED_LEVEL_CHANGED', ({ level }) => {
      this.policeState.wantedLevel = level;
    });

    events.on('ZOMBIE_KILLED', () => {
      this.zombieState.killCount++;
    });

    events.on('ZombieKilled', () => {
      this.zombieState.killCount++;
    });

    events.on('BUCKET_LIST_ITEM_COMPLETED', ({ itemId }) => {
      if (!this.bucketListState.completedItems.includes(itemId)) {
        this.bucketListState.completedItems.push(itemId);
      }
    });

    events.on('STORY_CHAPTER_STARTED', ({ chapterId }) => {
      this.storyState.currentChapter = chapterId;
    });

    events.on('ChapterStarted', ({ chapterId }) => {
      this.storyState.currentChapter = chapterId;
    });
  }

  toJSON() {
    return {
      saveVersion: SAVE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      migrationVersion: MIGRATION_VERSION,
      timestamp: Date.now(),
      worldState: JSON.parse(JSON.stringify(this.worldState)),
      playerState: JSON.parse(JSON.stringify(this.playerState)),
      vehicleState: JSON.parse(JSON.stringify(this.vehicleState)),
      npcState: JSON.parse(JSON.stringify(this.npcState)),
      zombieState: JSON.parse(JSON.stringify(this.zombieState)),
      buildingState: JSON.parse(JSON.stringify(this.buildingState)),
      trafficState: JSON.parse(JSON.stringify(this.trafficState)),
      policeState: JSON.parse(JSON.stringify(this.policeState)),
      emergencyState: JSON.parse(JSON.stringify(this.emergencyState)),
      powerState: JSON.parse(JSON.stringify(this.powerState)),
      weatherState: JSON.parse(JSON.stringify(this.weatherState)),
      storyState: JSON.parse(JSON.stringify(this.storyState)),
      missionState: JSON.parse(JSON.stringify(this.missionState)),
      relationshipState: JSON.parse(JSON.stringify(this.relationshipState)),
      investigationState: JSON.parse(JSON.stringify(this.investigationState)),
      bucketListState: JSON.parse(JSON.stringify(this.bucketListState)),
      outbreakState: JSON.parse(JSON.stringify(this.outbreakState)),
      persistenceState: JSON.parse(JSON.stringify(this.persistenceState)),
      performanceState: JSON.parse(JSON.stringify(this.performanceState)),
      stats: JSON.parse(JSON.stringify(this.stats))
    };
  }

  fromJSON(data) {
    if (!data || typeof data !== 'object') {
      console.warn('[GameState] Invalid data provided to fromJSON');
      return false;
    }

    if (data.worldState) this.worldState = { ...this.worldState, ...data.worldState };
    if (data.playerState) this.playerState = { ...this.playerState, ...data.playerState };
    else if (data.player) this.playerState = { ...this.playerState, ...data.player };

    if (data.vehicleState) this.vehicleState = { ...this.vehicleState, ...data.vehicleState };
    if (data.npcState) this.npcState = { ...this.npcState, ...data.npcState };
    if (data.zombieState) this.zombieState = { ...this.zombieState, ...data.zombieState };
    if (data.buildingState) this.buildingState = { ...this.buildingState, ...data.buildingState };
    if (data.trafficState) this.trafficState = { ...this.trafficState, ...data.trafficState };
    if (data.policeState) this.policeState = { ...this.policeState, ...data.policeState };
    if (data.emergencyState) this.emergencyState = { ...this.emergencyState, ...data.emergencyState };
    if (data.powerState) this.powerState = { ...this.powerState, ...data.powerState };
    else if (data.powerGridState) this.powerState.grid = { ...this.powerState.grid, ...data.powerGridState };

    if (data.weatherState) this.weatherState = { ...this.weatherState, ...data.weatherState };
    if (data.storyState) this.storyState = { ...this.storyState, ...data.storyState };
    if (data.missionState) this.missionState = { ...this.missionState, ...data.missionState };
    if (data.relationshipState) this.relationshipState = { ...this.relationshipState, ...data.relationshipState };
    if (data.investigationState) this.investigationState = { ...this.investigationState, ...data.investigationState };
    if (data.bucketListState) this.bucketListState = { ...this.bucketListState, ...data.bucketListState };
    if (data.outbreakState) this.outbreakState = { ...this.outbreakState, ...data.outbreakState };
    else if (data.outbreakStage !== undefined) this.outbreakState.stage = data.outbreakStage;

    if (data.persistenceState) this.persistenceState = { ...this.persistenceState, ...data.persistenceState };
    if (data.performanceState) this.performanceState = { ...this.performanceState, ...data.performanceState };
    if (data.stats) this.stats = { ...this.stats, ...data.stats };

    return true;
  }
}

