/**
 * Game FreeWorld - WantedSystem
 * Dynamic 1 to 5-star wanted levels with witness reporting, search radius, and line-of-sight evasion
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class WantedSystem {
  constructor() {
    this.wantedLevel = 0; // 0 to 5
    this.heat = 0; // Internal heat score
    this.lastKnownPos = new THREE.Vector3();
    this.inLineOfSight = false;
    this.cooldownTimer = 0;
    this.cooldownDuration = 18.0; // Seconds to escape line of sight to clear heat

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('CRIME_COMMITTED', ({ type, severity, position }) => {
      this.addCrime(severity || 1, position);
    });

    events.on('WITNESS_REPORT', ({ type, position }) => {
      // Witnesses report crime location
      this.lastKnownPos.copy(position);
      if (this.wantedLevel === 0) {
        this.setWantedLevel(1);
      }
    });

    events.on('DEBUG_WANTED_CLEAR', () => {
      this.clearWanted();
    });

    events.on('DEBUG_WANTED_MAX', () => {
      this.setWantedLevel(5);
    });
  }

  addCrime(severity, position) {
    if (position) this.lastKnownPos.copy(position);
    this.heat += severity * 30;

    const newLevel = Math.min(5, Math.floor(this.heat / 25) + 1);
    if (newLevel > this.wantedLevel) {
      this.setWantedLevel(newLevel);
    }
  }

  setWantedLevel(level) {
    const clamped = Math.max(0, Math.min(5, level));
    if (this.wantedLevel !== clamped) {
      this.wantedLevel = clamped;
      if (this.wantedLevel === 0) {
        this.heat = 0;
      }
      events.emit('WANTED_LEVEL_CHANGED', {
        level: this.wantedLevel,
        lastKnownPos: this.lastKnownPos
      });
      events.emit('HUD_NOTIFICATION', {
        title: this.wantedLevel > 0 ? `WANTED LEVEL ${'★'.repeat(this.wantedLevel)}` : 'WANTED LEVEL CLEARED',
        message: this.wantedLevel > 0 ? 'Evade police line of sight!' : 'The heat is off.'
      });
    }
  }

  clearWanted() {
    this.setWantedLevel(0);
  }

  update(delta, playerPos, activePolice) {
    if (this.wantedLevel === 0) return;

    // Check if any police cruiser has line of sight to player
    this.inLineOfSight = false;
    for (const cop of activePolice) {
      const dist = cop.position.distanceTo(playerPos);
      if (dist < 45) {
        this.inLineOfSight = true;
        this.lastKnownPos.copy(playerPos);
        break;
      }
    }

    if (this.inLineOfSight) {
      // Heat remains frozen / active
      this.cooldownTimer = this.cooldownDuration;
    } else {
      // Evading: countdown timer
      this.cooldownTimer -= delta;
      if (this.cooldownTimer <= 0) {
        this.clearWanted();
      }
    }

    events.emit('WANTED_STATUS_TICK', {
      wantedLevel: this.wantedLevel,
      inSight: this.inLineOfSight,
      cooldownPct: Math.max(0, this.cooldownTimer / this.cooldownDuration)
    });
  }
}
