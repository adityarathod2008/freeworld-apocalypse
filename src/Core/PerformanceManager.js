/**
 * Game FreeWorld - PerformanceManager
 * Dynamic performance adaptation, graphic quality presets (LOW, MEDIUM, HIGH, ULTRA),
 * shadow map resolution toggles, and simulation distance scaling.
 */
import { events } from './EventBus.js';

export const QUALITY_PRESETS = {
  LOW: {
    name: 'LOW',
    shadows: false,
    pixelRatio: 1,
    maxSimDistance: 80,
    npcCount: 16,
    trafficCount: 8,
    drawDistance: 350
  },
  MEDIUM: {
    name: 'MEDIUM',
    shadows: true,
    shadowMapSize: 1024,
    pixelRatio: 1,
    maxSimDistance: 130,
    npcCount: 26,
    trafficCount: 12,
    drawDistance: 600
  },
  HIGH: {
    name: 'HIGH',
    shadows: true,
    shadowMapSize: 2048,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
    maxSimDistance: 180,
    npcCount: 36,
    trafficCount: 18,
    drawDistance: 900
  },
  ULTRA: {
    name: 'ULTRA',
    shadows: true,
    shadowMapSize: 2048,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    maxSimDistance: 240,
    npcCount: 48,
    trafficCount: 24,
    drawDistance: 1200
  }
};

export class PerformanceManager {
  constructor(engine) {
    this.engine = engine;
    this.currentPreset = 'HIGH';
    this.fpsHistory = [];
    this.autoAdjustEnabled = true;

    this.setupListeners();
  }

  setupListeners() {
    events.on('SET_QUALITY_PRESET', (presetName) => {
      this.applyPreset(presetName);
    });

    events.on('TELEMETRY_UPDATE', ({ fps }) => {
      if (!this.autoAdjustEnabled) return;
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > 20) this.fpsHistory.shift();

      // If consistently under 25 FPS, degrade quality gracefully
      if (this.fpsHistory.length === 20) {
        const avg = this.fpsHistory.reduce((a, b) => a + b, 0) / 20;
        if (avg < 24 && this.currentPreset !== 'LOW') {
          console.warn('[PerformanceManager] Low FPS detected (' + Math.round(avg) + '), degrading quality to optimize.');
          const order = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW'];
          const next = order[order.indexOf(this.currentPreset) + 1];
          if (next) this.applyPreset(next);
        }
      }
    });
  }

  applyPreset(presetName) {
    const config = QUALITY_PRESETS[presetName] || QUALITY_PRESETS.HIGH;
    this.currentPreset = presetName;

    if (this.engine && this.engine.renderer) {
      this.engine.renderer.shadowMap.enabled = config.shadows;
      this.engine.renderer.setPixelRatio(config.pixelRatio);
      if (this.engine.camera) {
        this.engine.camera.far = config.drawDistance;
        this.engine.camera.updateProjectionMatrix();
      }
    }

    events.emit('QUALITY_CHANGED', { preset: presetName, config });
    events.emit('HUD_NOTIFICATION', {
      title: 'GRAPHICS PRESET',
      message: `Quality set to ${presetName}`
    });
  }
}
