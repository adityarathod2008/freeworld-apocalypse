/**
 * FreeWorld Engine - City Collapse Engine (Phase 11)
 * Manages 7 District Safety States across all city sectors:
 * NORMAL -> WARNING -> PANIC -> EVACUATION -> QUARANTINE -> COLLAPSE -> OVERRUN.
 */

import { events } from '../Core/EventBus.js';

export const DISTRICT_SAFETY_STATES = {
  NORMAL: 'NORMAL',          // Safe, full power, low response time
  WARNING: 'WARNING',        // Elevated threat, active patrols
  PANIC: 'PANIC',            // Fleeing civilians, vehicle crashes
  EVACUATION: 'EVACUATION',  // Military corridors, emergency exits
  QUARANTINE: 'QUARANTINE',  // Barricades, lockdowns
  COLLAPSE: 'COLLAPSE',      // Power grid failure, 0 police
  OVERRUN: 'OVERRUN'         // Swarm saturation, full zombie control
};

export class CityCollapseEngine {
  constructor() {
    this.districts = new Map([
      ['downtown', { id: 'downtown', name: 'Downtown Financial', state: DISTRICT_SAFETY_STATES.NORMAL, safetyScore: 90 }],
      ['harbor', { id: 'harbor', name: 'Marina Harbor Pier', state: DISTRICT_SAFETY_STATES.WARNING, safetyScore: 75 }],
      ['industrial', { id: 'industrial', name: 'Industrial Sector 4', state: DISTRICT_SAFETY_STATES.PANIC, safetyScore: 50 }],
      ['suburbs', { id: 'suburbs', name: 'Westside Suburbs', state: DISTRICT_SAFETY_STATES.NORMAL, safetyScore: 95 }],
      ['commercial', { id: 'commercial', name: 'Apex Commercial Plaza', state: DISTRICT_SAFETY_STATES.WARNING, safetyScore: 70 }]
    ]);

    this.bindEvents();
  }

  bindEvents() {
    events.on('SYSTEMIC_EMERGENCY_EVENT', ({ type, origin }) => {
      this.evaluateEventImpact(type, origin);
    });
  }

  /**
   * Adjusts district safety score and updates safety state.
   * @param {string} districtId 
   * @param {number} deltaScore 
   */
  adjustDistrictSafety(districtId, deltaScore) {
    const d = this.districts.get(districtId);
    if (!d) return;

    d.safetyScore = Math.min(100, Math.max(0, d.safetyScore + deltaScore));
    this.updateDistrictState(d);
  }

  updateDistrictState(district) {
    const prevState = district.state;
    const score = district.safetyScore;

    if (score >= 85) district.state = DISTRICT_SAFETY_STATES.NORMAL;
    else if (score >= 70) district.state = DISTRICT_SAFETY_STATES.WARNING;
    else if (score >= 50) district.state = DISTRICT_SAFETY_STATES.PANIC;
    else if (score >= 35) district.state = DISTRICT_SAFETY_STATES.EVACUATION;
    else if (score >= 20) district.state = DISTRICT_SAFETY_STATES.QUARANTINE;
    else if (score >= 10) district.state = DISTRICT_SAFETY_STATES.COLLAPSE;
    else district.state = DISTRICT_SAFETY_STATES.OVERRUN;

    if (prevState !== district.state) {
      events.emit('DISTRICT_STATE_CHANGED', {
        districtId: district.id,
        prevState,
        newState: district.state,
        safetyScore: district.safetyScore
      });

      events.emit('HUD_NOTIFICATION', {
        title: `SECTOR ${district.name.toUpperCase()}`,
        message: `Status updated to ${district.state}!`
      });
    }
  }

  evaluateEventImpact(type, origin) {
    // Reduce safety score of impacted district
    this.districts.forEach(d => {
      if (type === 'POWER_FAILURE' || type === 'ZOMBIE_OUTBREAK') {
        this.adjustDistrictSafety(d.id, -12);
      } else if (type === 'TRAFFIC_COLLAPSE' || type === 'FIRE_HAZARD') {
        this.adjustDistrictSafety(d.id, -8);
      }
    });
  }

  /**
   * Updates collapse state machine based on Outbreak Director telemetry.
   * @param {number} delta 
   * @param {number} outbreakLevel 
   */
  update(delta, outbreakLevel = 15) {
    if (outbreakLevel > 60) {
      this.districts.forEach(d => {
        this.adjustDistrictSafety(d.id, -0.2 * delta);
      });
    }
  }

  getDistrictState(districtId) {
    return this.districts.get(districtId) || null;
  }

  getAllDistricts() {
    return Array.from(this.districts.values());
  }

  toJSON() {
    const obj = {};
    for (const [id, d] of this.districts.entries()) {
      obj[id] = { state: d.state, safetyScore: d.safetyScore };
    }
    return obj;
  }

  fromJSON(obj) {
    if (!obj) return;
    for (const id in obj) {
      if (this.districts.has(id)) {
        const d = this.districts.get(id);
        d.state = obj[id].state;
        d.safetyScore = obj[id].safetyScore;
      }
    }
  }
}
