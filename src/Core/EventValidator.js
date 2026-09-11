/**
 * Game FreeWorld - EventValidator (v5.0)
 * Authoritative schema validator and telemetry history buffer for EventBus
 */

export const EVENT_SCHEMAS = {
  // 1. Crime & Law Enforcement
  CRIME_COMMITTED: {
    required: ['type'],
    optional: ['severity', 'position', 'perpetrator']
  },
  WITNESS_DETECTED: {
    required: ['witness', 'crimeType'],
    optional: ['position']
  },
  EVIDENCE_CREATED: {
    required: ['type'],
    optional: ['position', 'confidence']
  },
  POLICE_DISPATCHED: {
    required: [],
    optional: ['position', 'priority', 'unitCount']
  },
  WANTED_LEVEL_CHANGED: {
    required: ['level'],
    optional: ['lastKnownPos']
  },
  ARREST_COMPLETED: {
    required: [],
    optional: ['location', 'fineAmount']
  },

  // 2. Vehicles & Emergency Systems
  PLAYER_ENTERED_VEHICLE: {
    required: [],
    optional: ['vehicle']
  },
  PLAYER_EXITED_VEHICLE: {
    required: [],
    optional: []
  },
  VEHICLE_HIT: {
    required: [],
    optional: ['vehicle', 'impulse', 'hitZone']
  },
  VEHICLE_FUEL_LEAK: {
    required: [],
    optional: ['vehicle', 'position', 'rate']
  },
  VEHICLE_IGNITED: {
    required: [],
    optional: ['vehicle', 'temperature']
  },
  VEHICLE_BURNING: {
    required: [],
    optional: ['vehicle', 'temperature']
  },
  VEHICLE_EXPLODED: {
    required: [],
    optional: ['vehicle', 'position', 'blastRadius']
  },
  EMERGENCY_DISPATCH_CALLED: {
    required: ['type'],
    optional: ['position', 'targetEntity']
  },

  // 3. Infrastructure & World Reaction
  PLAYER_SECTOR_CHANGED: {
    required: ['newSector'],
    optional: ['oldSector', 'coords']
  },
  SECTOR_LOD_CHANGED: {
    required: ['sectorId', 'newTier'],
    optional: ['oldTier']
  },
  SECTOR_ENTITY_TRANSITION: {
    required: ['entityId', 'newSector'],
    optional: ['oldSector', 'lodTier']
  },
  POWER_GRID_STATE_CHANGED: {
    required: ['district', 'isPowered'],
    optional: ['cause']
  },
  METRO_STATUS_UPDATE: {
    required: ['lineId', 'status'],
    optional: ['currentStation']
  },
  NIGHT_STATE_CHANGED: {
    required: [],
    optional: ['isNight']
  },

  // 4. Zombie & Outbreak Systems
  OUTBREAK_STAGE_CHANGED: {
    required: ['stage'],
    optional: ['stageName', 'description']
  },
  ZOMBIE_HORDE_FORMED: {
    required: ['hordeId', 'count'],
    optional: ['origin', 'destination']
  },

  // 5. Story & Presentation
  STORY_CHAPTER_STARTED: {
    required: ['chapterId'],
    optional: ['title', 'objectives']
  },
  BUCKET_LIST_ITEM_COMPLETED: {
    required: ['itemId'],
    optional: ['title', 'category']
  },
  HUD_NOTIFICATION: {
    required: ['title'],
    optional: ['message']
  },
  SHOW_SUBTITLE: {
    required: ['text'],
    optional: ['speaker']
  }
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

    if (payload !== undefined && typeof payload !== 'object') {
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
      payloadSummary: payload ? Object.keys(payload) : []
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
