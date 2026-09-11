/**
 * Game FreeWorld - NPCMemory (v7.0 Phase 7)
 * Authoritative event memory ledger tracking 10 key gameplay events:
 * playerSeen, crimeWitnessed, friendLost, zombieEncounter, buildingDestroyed,
 * policeEncounter, vehicleStolen, survivorSaved, betrayal, importantConversation.
 */
import * as THREE from 'three';

export class NPCMemory {
  constructor() {
    this.threatPosition = new THREE.Vector3();
    this.lastWitnessedCrime = null;
    this.hasReportedToPolice = false;
    this.memoryDuration = 45.0; // 45 seconds of active threat memory
    this.memoryTimer = 0;

    // Persistent Suspect Recognition
    this.suspectProfile = {
      hasSuspect: false,
      lastSeenPos: new THREE.Vector3(),
      vehicleName: null,
      crimeType: null
    };

    this.traumaScore = 0; // 0 (Calm) to 100 (Terrified)

    // Phase 7 Event Ledger
    this.eventLedger = [];
  }

  recordEvent(eventType, data = {}) {
    const record = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: eventType, // 'playerSeen'|'crimeWitnessed'|'friendLost'|'zombieEncounter'|'buildingDestroyed'|'policeEncounter'|'vehicleStolen'|'survivorSaved'|'betrayal'|'importantConversation'
      position: data.position ? data.position.clone() : new THREE.Vector3(),
      subjectId: data.subjectId || null,
      description: data.description || eventType,
      impact: data.impact !== undefined ? data.impact : 30, // Emotional impact (0-100)
      confidence: 1.0, // Decays over time
      timestamp: performance.now()
    };

    this.eventLedger.unshift(record);
    if (this.eventLedger.length > 25) this.eventLedger.pop();

    // Trauma adjustment
    this.traumaScore = Math.min(100, this.traumaScore + (data.impact || 20));

    // Handle threat specific events
    if (eventType === 'crimeWitnessed' || eventType === 'vehicleStolen' || eventType === 'zombieEncounter' || eventType === 'friendLost') {
      this.lastWitnessedCrime = data.crimeType || eventType;
      this.threatPosition.copy(record.position);
      this.memoryTimer = this.memoryDuration;
      this.hasReportedToPolice = false;

      this.suspectProfile = {
        hasSuspect: true,
        lastSeenPos: record.position.clone(),
        vehicleName: data.vehicleName || null,
        crimeType: eventType
      };
    }

    return record;
  }

  recordCrime(type, pos, suspectVehicle = null) {
    return this.recordEvent('crimeWitnessed', {
      crimeType: type,
      position: pos,
      vehicleName: suspectVehicle ? suspectVehicle.displayName : null,
      impact: 40
    });
  }

  hasMemoryOf(eventType) {
    return this.eventLedger.some(e => e.type === eventType && e.confidence > 0.2);
  }

  getRecentMemories(limit = 5) {
    return this.eventLedger.slice(0, limit);
  }

  checkRecognition(playerPos, currentVehicle = null) {
    if (!this.suspectProfile.hasSuspect || !playerPos) return false;

    const dist = playerPos.distanceTo(this.threatPosition);
    if (dist < 25) {
      if (currentVehicle && currentVehicle.displayName === this.suspectProfile.vehicleName) {
        return true;
      }
      return dist < 12;
    }
    return false;
  }

  update(delta) {
    if (this.memoryTimer > 0) {
      this.memoryTimer -= delta;
      if (this.memoryTimer <= 0) {
        this.lastWitnessedCrime = null;
      }
    }

    if (this.traumaScore > 0) {
      this.traumaScore = Math.max(0, this.traumaScore - delta * 2.0);
    }

    // Decay memory confidence over time
    for (const ev of this.eventLedger) {
      ev.confidence = Math.max(0, ev.confidence - delta * 0.015);
    }
  }

  hasThreat() {
    return this.memoryTimer > 0 && this.lastWitnessedCrime !== null;
  }
}
