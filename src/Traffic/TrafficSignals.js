/**
 * Game FreeWorld - TrafficSignals (v5.0)
 * 4-phase intersection traffic light controller (GREEN -> AMBER -> RED -> EMERGENCY_OVERRIDE)
 * with emergency vehicle priority override and blackout fallback modes.
 */

import { events } from '../Core/EventBus.js';

export const SIGNAL_STATES = {
  GREEN: 'GREEN',
  AMBER: 'AMBER',
  RED: 'RED',
  EMERGENCY_OVERRIDE: 'EMERGENCY_OVERRIDE'
};

export class TrafficSignals {
  constructor() {
    this.timer = 0;
    this.phase = 0; // 0: EW Green, 1: EW Amber, 2: NS Green, 3: NS Amber
    this.phaseTimes = [12.0, 3.0, 12.0, 3.0]; // Seconds per phase
    this.isEmergencyOverride = false;
    this.isBlackoutMode = false;

    this.setupListeners();
  }

  setupListeners() {
    events.on('EMERGENCY_SIREN_TOGGLED', ({ active }) => {
      this.setEmergencyOverride(active);
    });

    events.on('MASTER_POWER_GRID_CHANGED', ({ isOnline }) => {
      this.isBlackoutMode = !isOnline;
    });
  }

  setEmergencyOverride(active) {
    this.isEmergencyOverride = active;
    events.emit('TRAFFIC_LIGHT_CHANGE', {
      phase: this.phase,
      state: active ? SIGNAL_STATES.EMERGENCY_OVERRIDE : this.getSignalState('EW'),
      isEmergencyOverride: active
    });
  }

  update(delta) {
    if (this.isEmergencyOverride || this.isBlackoutMode) return;

    this.timer += delta;
    if (this.timer >= this.phaseTimes[this.phase]) {
      this.timer = 0;
      this.phase = (this.phase + 1) % 4;
      events.emit('TRAFFIC_LIGHT_CHANGE', {
        phase: this.phase,
        isEWGreen: this.phase === 0,
        isNSGreen: this.phase === 2,
        stateEW: this.getSignalState('EW'),
        stateNS: this.getSignalState('NS')
      });
    }
  }

  getSignalState(direction = 'EW') {
    if (this.isBlackoutMode) return SIGNAL_STATES.AMBER;
    if (this.isEmergencyOverride) return SIGNAL_STATES.EMERGENCY_OVERRIDE;

    if (direction === 'EW') {
      if (this.phase === 0) return SIGNAL_STATES.GREEN;
      if (this.phase === 1) return SIGNAL_STATES.AMBER;
      return SIGNAL_STATES.RED;
    } else {
      if (this.phase === 2) return SIGNAL_STATES.GREEN;
      if (this.phase === 3) return SIGNAL_STATES.AMBER;
      return SIGNAL_STATES.RED;
    }
  }

  isGreenForDirection(direction = 'EW') {
    if (this.isEmergencyOverride) return true;
    return this.getSignalState(direction) === SIGNAL_STATES.GREEN;
  }
}
