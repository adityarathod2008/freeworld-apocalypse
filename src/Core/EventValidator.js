/**
 * Game FreeWorld - EventValidator (v5.0)
 * Authoritative schema validator and telemetry history buffer for EventBus
 */

export const EVENT_SCHEMAS = {
  // 1. Crime & Law Enforcement Chain
  CrimeCommitted: { required: [], optional: ['type', 'severity', 'position', 'perpetrator'] },
  CRIME_COMMITTED: { required: [], optional: ['type', 'severity', 'position', 'perpetrator'] },
  WitnessDetected: { required: [], optional: ['witness', 'crimeType', 'position'] },
  WITNESS_DETECTED: { required: [], optional: ['witness', 'crimeType', 'position'] },
  CCTVRecorded: { required: [], optional: ['cameraId', 'position', 'targetEntity', 'timestamp'] },
  EvidenceCreated: { required: [], optional: ['type', 'position', 'confidence'] },
  EVIDENCE_CREATED: { required: [], optional: ['type', 'position', 'confidence'] },
  PoliceDispatched: { required: [], optional: ['position', 'priority', 'unitCount'] },
  POLICE_DISPATCHED: { required: [], optional: ['position', 'priority', 'unitCount'] },
  VehiclePursuitStarted: { required: [], optional: ['targetVehicle', 'pursuitUnits', 'wantedLevel'] },
  PoliceVehicleStopped: { required: [], optional: ['unitId', 'position', 'reason'] },
  OfficerExitedVehicle: { required: [], optional: ['officerId', 'unitId', 'position'] },
  ArrestCommandIssued: { required: [], optional: ['targetPlayer', 'officerId'] },
  PlayerSurrendered: { required: [], optional: ['position'] },
  ArrestCompleted: { required: [], optional: ['location', 'fineAmount'] },
  ARREST_COMPLETED: { required: [], optional: ['location', 'fineAmount'] },
  WANTED_LEVEL_CHANGED: { required: ['level'], optional: ['lastKnownPos'] },

  // 2. Vehicle Systems Chain
  VehicleHit: { required: [], optional: ['vehicle', 'impulse', 'hitZone', 'attacker'] },
  VEHICLE_HIT: { required: [], optional: ['vehicle', 'impulse', 'hitZone', 'attacker'] },
  VehicleDamaged: { required: [], optional: ['vehicle', 'damageAmount', 'part'] },
  FuelLeaking: { required: [], optional: ['vehicle', 'rate', 'position'] },
  VEHICLE_FUEL_LEAK: { required: [], optional: ['vehicle', 'position', 'rate'] },
  VehicleIgnited: { required: [], optional: ['vehicle', 'temperature'] },
  VEHICLE_IGNITED: { required: [], optional: ['vehicle', 'temperature'] },
  VehicleBurning: { required: [], optional: ['vehicle', 'temperature'] },
  VEHICLE_BURNING: { required: [], optional: ['vehicle', 'temperature'] },
  VehicleExploded: { required: [], optional: ['vehicle', 'position', 'blastRadius'] },
  VEHICLE_EXPLODED: { required: [], optional: ['vehicle', 'position', 'blastRadius'] },
  ExplosionOccurred: { required: [], optional: ['position', 'radius', 'damage', 'source'] },

  // 3. Apocalypse & Outbreak Chain
  InfectionDetected: { required: [], optional: ['entityId', 'location', 'strain'] },
  NPCInfected: { required: [], optional: ['npcId', 'position', 'source'] },
  InfectionProgressed: { required: [], optional: ['npcId', 'stage', 'symptoms'] },
  NPCTransformed: { required: [], optional: ['npcId', 'zombieType', 'position'] },
  ZombieSpawned: { required: [], optional: ['zombieId', 'type', 'position'] },
  ZombieDetectedPlayer: { required: [], optional: ['zombieId', 'distance', 'sightCone'] },
  ZombieHeardNoise: { required: [], optional: ['zombieId', 'soundPosition', 'volume'] },
  ZombieAttackStarted: { required: [], optional: ['zombieId', 'targetEntity'] },
  ZombieAttackHit: { required: [], optional: ['zombieId', 'targetEntity', 'damage'] },
  ZombieKilled: { required: [], optional: ['zombieId', 'killer', 'weapon'] },
  ZOMBIE_KILLED: { required: [], optional: ['zombieId', 'killer', 'weapon'] },
  HordeFormed: { required: [], optional: ['hordeId', 'count', 'origin', 'destination'] },
  ZOMBIE_HORDE_FORMED: { required: ['hordeId', 'count'], optional: ['origin', 'destination'] },
  HordeDispersed: { required: [], optional: ['hordeId', 'reason'] },
  OutbreakEscalated: { required: [], optional: ['stage', 'stageName', 'description'] },
  OUTBREAK_STAGE_CHANGED: { required: ['stage'], optional: ['stageName', 'description'] },

  // 4. Buildings & Infrastructure Chain
  BuildingEntered: { required: [], optional: ['buildingId', 'interiorId'] },
  BuildingExited: { required: [], optional: ['buildingId'] },
  PowerChanged: { required: [], optional: ['district', 'isPowered', 'cause'] },
  POWER_GRID_STATE_CHANGED: { required: ['district', 'isPowered'], optional: ['cause'] },
  BuildingBlackout: { required: [], optional: ['buildingId', 'district'] },
  EmergencyLightsActivated: { required: [], optional: ['buildingId'] },
  BuildingDamaged: { required: [], optional: ['buildingId', 'damageAmount'] },
  BuildingLocked: { required: [], optional: ['buildingId', 'lockLevel'] },
  BuildingInfested: { required: [], optional: ['buildingId', 'zombieCount'] },
  BuildingOverrun: { required: [], optional: ['buildingId'] },
  SafehouseActivated: { required: [], optional: ['safehouseId', 'location'] },

  // 5. Story, Narrative & Investigation Chain
  ClueDiscovered: { required: [], optional: ['clueId', 'title', 'location'] },
  InvestigationUpdated: { required: [], optional: ['caseId', 'status', 'newClueId'] },
  FlashbackUnlocked: { required: [], optional: ['flashbackId', 'title'] },
  FlashbackStarted: { required: [], optional: ['flashbackId'] },
  FlashbackCompleted: { required: [], optional: ['flashbackId'] },
  CharacterDiscovered: { required: [], optional: ['characterId', 'name', 'faction'] },
  RelationshipChanged: { required: [], optional: ['faction', 'delta', 'newLevel'] },
  DecisionMade: { required: [], optional: ['decisionId', 'choice', 'impact'] },
  MissionStarted: { required: [], optional: ['missionId', 'title'] },
  ObjectiveCompleted: { required: [], optional: ['missionId', 'objectiveIndex'] },
  MissionCompleted: { required: [], optional: ['missionId', 'reward'] },
  ChapterStarted: { required: [], optional: ['chapterId', 'title'] },
  STORY_CHAPTER_STARTED: { required: ['chapterId'], optional: ['title', 'objectives'] },
  ChapterCompleted: { required: [], optional: ['chapterId'] },
  WorldConsequenceTriggered: { required: [], optional: ['consequenceId', 'description'] },
  EndingFlagChanged: { required: [], optional: ['flag', 'value'] },

  // Legacy & UI Utilities
  PLAYER_ENTERED_VEHICLE: { required: [], optional: ['vehicle'] },
  PLAYER_EXITED_VEHICLE: { required: [], optional: [] },
  EMERGENCY_DISPATCH_CALLED: { required: ['type'], optional: ['position', 'targetEntity'] },
  PLAYER_SECTOR_CHANGED: { required: ['newSector'], optional: ['oldSector', 'coords'] },
  SECTOR_LOD_CHANGED: { required: ['sectorId', 'newTier'], optional: ['oldTier'] },
  SECTOR_ENTITY_TRANSITION: { required: ['entityId', 'newSector'], optional: ['oldSector', 'lodTier'] },
  METRO_STATUS_UPDATE: { required: ['lineId', 'status'], optional: ['currentStation'] },
  NIGHT_STATE_CHANGED: { required: [], optional: ['isNight'] },
  BUCKET_LIST_ITEM_COMPLETED: { required: ['itemId'], optional: ['title', 'category'] },
  HUD_NOTIFICATION: { required: ['title'], optional: ['message'] },
  SHOW_SUBTITLE: { required: ['text'], optional: ['speaker'] }
};

export class EventValidator {
  constructor(maxHistory = 100) {
    this.maxHistory = maxHistory;
    this.history = [];
    this.validationErrors = 0;
  }

  validate(eventName, payload) {
    const schema = EVENT_SCHEMAS[eventName];
    // If no schema registered yet for rare/internal events, log telemetry and allow
    if (!schema) {
      this.recordHistory(eventName, payload, true);
      return { valid: true };
    }

    if (payload !== undefined && typeof payload !== 'object' && payload !== null) {
      console.warn(`[EventValidator] Event "${eventName}" payload is not an object:`, payload);
      this.validationErrors++;
      this.recordHistory(eventName, payload, false);
      return { valid: false, error: 'Payload must be an object' };
    }

    if (payload && schema.required) {
      for (const reqKey of schema.required) {
        if (payload[reqKey] === undefined) {
          console.warn(`[EventValidator] Event "${eventName}" missing required payload field "${reqKey}"`, payload);
          this.validationErrors++;
          this.recordHistory(eventName, payload, false);
          return { valid: false, error: `Missing required field: ${reqKey}` };
        }
      }
    }

    this.recordHistory(eventName, payload, true);
    return { valid: true };
  }

  recordHistory(eventName, payload, valid) {
    this.history.push({
      timestamp: performance.now(),
      eventName,
      valid,
      payloadSummary: payload && typeof payload === 'object' ? Object.keys(payload) : []
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getTelemetry() {
    return {
      totalEmitted: this.history.length,
      validationErrors: this.validationErrors,
      recentEvents: this.history.slice(-10)
    };
  }
}

export const eventValidator = new EventValidator();

