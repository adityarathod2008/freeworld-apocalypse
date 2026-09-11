/**
 * Game FreeWorld - TrafficSignals
 * 4-phase intersection traffic lights (Green -> Yellow -> Red) for realistic city traffic flow
 */
import { events } from '../Core/EventBus.js';

export class TrafficSignals {
  constructor() {
    this.timer = 0;
    this.phase = 0; // 0: EW Green, 1: EW Yellow, 2: NS Green, 3: NS Yellow
    this.phaseTimes = [12.0, 3.0, 12.0, 3.0]; // Seconds per phase
  }

  update(delta) {
    this.timer += delta;
    if (this.timer >= this.phaseTimes[this.phase]) {
      this.timer = 0;
      this.phase = (this.phase + 1) % 4;
      events.emit('TRAFFIC_LIGHT_CHANGE', {
        phase: this.phase,
        isEWGreen: this.phase === 0,
        isNSGreen: this.phase === 2
      });
    }
  }

  isGreenForDirection(direction = 'EW') {
    if (direction === 'EW') return this.phase === 0;
    if (direction === 'NS') return this.phase === 2;
    return false;
  }
}
