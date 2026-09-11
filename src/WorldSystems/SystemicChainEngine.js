/**
 * FreeWorld Engine - Systemic Emergent Chain Engine (Phase 11)
 * Evaluates unscripted domino chain propagation across 10 emergency event types:
 * FIRES, CRASHES, EVACUATIONS, POLICE_INCIDENTS, AMBULANCES, POWER_FAILURES,
 * TRAFFIC_COLLAPSE, SURVIVOR_ENCOUNTERS, ZOMBIE_OUTBREAKS, BUILDING_LOCKDOWNS.
 */

import { events } from '../Core/EventBus.js';

export const SYSTEMIC_EVENT_TYPES = {
  FIRE: 'FIRE',
  CRASH: 'CRASH',
  EVACUATION: 'EVACUATION',
  POLICE_INCIDENT: 'POLICE_INCIDENT',
  AMBULANCE: 'AMBULANCE',
  POWER_FAILURE: 'POWER_FAILURE',
  TRAFFIC_COLLAPSE: 'TRAFFIC_COLLAPSE',
  SURVIVOR_ENCOUNTER: 'SURVIVOR_ENCOUNTER',
  ZOMBIE_OUTBREAK: 'ZOMBIE_OUTBREAK',
  BUILDING_LOCKDOWN: 'BUILDING_LOCKDOWN'
};

export class SystemicChainEngine {
  constructor() {
    this.activeChainHistory = []; // { eventType, origin, timestamp, triggeredSubEvents }
    this.bindChainListeners();
  }

  bindChainListeners() {
    // 1. Vehicle Theft / Crime -> Police Incident
    events.on('CRIME_COMMITTED', ({ type, position }) => {
      this.triggerEmergentStep(SYSTEMIC_EVENT_TYPES.POLICE_INCIDENT, position, { source: type });
    });

    // 2. High Speed Pursuit -> Traffic Crash
    events.on('POLICE_PURSUIT_STARTED', ({ position }) => {
      setTimeout(() => {
        this.triggerEmergentStep(SYSTEMIC_EVENT_TYPES.CRASH, position, { source: 'pursuit_crash' });
      }, 2000);
    });

    // 3. Crash -> Ambulance Request & Crowd Gathering
    events.on('VEHICLE_CRASHED', ({ position }) => {
      this.triggerEmergentStep(SYSTEMIC_EVENT_TYPES.AMBULANCE, position, { source: 'vehicle_collision' });
      this.triggerEmergentStep(SYSTEMIC_EVENT_TYPES.SURVIVOR_ENCOUNTER, position, { source: 'bystanders' });
    });

    // 4. Loud Noise / Crowd -> Zombie Outbreak Horde Mobilization
    events.on('SOUND_EMITTED', ({ position, soundType }) => {
      if (soundType === 'EXPLOSION' || soundType === 'GUNSHOT') {
        this.triggerEmergentStep(SYSTEMIC_EVENT_TYPES.ZOMBIE_OUTBREAK, position, { source: soundType });
      }
    });

    // 5. Zombie Outbreak -> District Panic & Building Lockdown
    events.on('NPC_TRANSFORMED_TO_ZOMBIE', ({ position }) => {
      this.triggerEmergentStep(SYSTEMIC_EVENT_TYPES.BUILDING_LOCKDOWN, position, { source: 'reanimation' });
    });

    // 6. Lockdown / Outbreak -> Power Grid Failure & Clue Discovery
    events.on('BUILDING_LOCKDOWN_TRIGGERED', ({ position }) => {
      events.emit('MASTER_POWER_GRID_CHANGED', { isOnline: false });
      this.triggerEmergentStep(SYSTEMIC_EVENT_TYPES.POWER_FAILURE, position, { source: 'overload' });
    });
  }

  /**
   * Triggers an emergent domino step and broadcasts across the system.
   * @param {string} eventType 
   * @param {Object} position 
   * @param {Object} extraData 
   */
  triggerEmergentStep(eventType, position, extraData = {}) {
    const chainNode = {
      eventType,
      position: position ? { x: position.x, y: position.y || 0.5, z: position.z } : { x: 0, y: 0, z: 0 },
      timestamp: Date.now(),
      extraData
    };

    this.activeChainHistory.push(chainNode);
    if (this.activeChainHistory.length > 25) this.activeChainHistory.shift();

    events.emit('SYSTEMIC_EMERGENT_STEP_FIRED', chainNode);

    // Broadcast specific secondary event listeners
    if (eventType === SYSTEMIC_EVENT_TYPES.BUILDING_LOCKDOWN) {
      events.emit('BUILDING_LOCKDOWN_TRIGGERED', chainNode);
    } else if (eventType === SYSTEMIC_EVENT_TYPES.POWER_FAILURE) {
      events.emit('SYSTEMIC_POWER_FAILURE', chainNode);
    } else if (eventType === SYSTEMIC_EVENT_TYPES.ZOMBIE_OUTBREAK) {
      events.emit('HORDE_MOBILIZATION_TRIGGER', {
        position: chainNode.position,
        triggerType: 'INFECTED_CONCENTRATION',
        radius: 60
      });
    }

    return chainNode;
  }

  getChainHistory() {
    return this.activeChainHistory;
  }
}
