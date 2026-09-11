/**
 * Game FreeWorld - PerformanceStats
 * Real-time telemetry: FPS, draw calls, triangles, active AI count, memory usage
 */
import { events } from '../Core/EventBus.js';

export class PerformanceStats {
  constructor() {
    this.badge = document.getElementById('fps-counter-mini');
    this.dbgFps = document.getElementById('dbg-fps');
    this.dbgDrawCalls = document.getElementById('dbg-drawcalls');
    this.dbgNpcs = document.getElementById('dbg-npcs');
    this.dbgCars = document.getElementById('dbg-cars');

    this.setupListeners();
  }

  setupListeners() {
    events.on('TELEMETRY_UPDATE', ({ fps, drawCalls }) => {
      if (this.badge) {
        this.badge.textContent = `FPS: ${fps} | Calls: ${drawCalls}`;
      }
      if (this.dbgFps) this.dbgFps.textContent = fps;
      if (this.dbgDrawCalls) this.dbgDrawCalls.textContent = drawCalls;
    });
  }

  updateEntities(npcCount, carCount) {
    if (this.dbgNpcs) this.dbgNpcs.textContent = npcCount;
    if (this.dbgCars) this.dbgCars.textContent = carCount;
  }
}
