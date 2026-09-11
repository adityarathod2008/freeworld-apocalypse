/**
 * Game FreeWorld - TrafficIncidents
 * Manages traffic incidents: pileups, breakdowns, and pulling over for police sirens
 */
import { events } from '../Core/EventBus.js';

export class TrafficIncidents {
  constructor() {
    this.sirenActive = false;
    this.setupListeners();
  }

  setupListeners() {
    events.on('WANTED_LEVEL_CHANGED', ({ level }) => {
      this.sirenActive = level > 0;
    });
  }

  shouldYieldToEmergency() {
    return this.sirenActive;
  }
}
