/**
 * Game FreeWorld - NPCMemory (v3.0)
 * Systemic NPC Memory: Retains suspect profiles, vehicle descriptions, witnessed crimes,
 * emotional trauma levels, and persistent recognition parameters.
 */
import * as THREE from 'three';

export class NPCMemory {
  constructor() {
    this.threatPosition = new THREE.Vector3();
    this.lastWitnessedCrime = null;
    this.hasReportedToPolice = false;
    this.memoryDuration = 45.0; // 45 seconds of active memory
    this.memoryTimer = 0;

    // Persistent Suspect Recognition
    this.suspectProfile = {
      hasSuspect: false,
      lastSeenPos: new THREE.Vector3(),
      vehicleName: null,
      crimeType: null
    };

    this.traumaScore = 0; // 0 (Calm) to 100 (Terrified)
  }

  recordCrime(type, pos, suspectVehicle = null) {
    this.lastWitnessedCrime = type;
    this.threatPosition.copy(pos);
    this.memoryTimer = this.memoryDuration;
    this.hasReportedToPolice = false;
    this.traumaScore = Math.min(100, this.traumaScore + 40);

    this.suspectProfile = {
      hasSuspect: true,
      lastSeenPos: pos.clone(),
      vehicleName: suspectVehicle ? suspectVehicle.displayName : null,
      crimeType: type
    };
  }

  checkRecognition(playerPos, currentVehicle = null) {
    if (!this.suspectProfile.hasSuspect || !playerPos) return false;

    const dist = playerPos.distanceTo(this.threatPosition);
    if (dist < 25) {
      // High recognition probability if player returns to crime scene or drives same car
      if (currentVehicle && currentVehicle.displayName === this.suspectProfile.vehicleName) {
        return true;
      }
      return dist < 12; // Visual recognition distance on foot
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
  }

  hasThreat() {
    return this.memoryTimer > 0 && this.lastWitnessedCrime !== null;
  }
}
