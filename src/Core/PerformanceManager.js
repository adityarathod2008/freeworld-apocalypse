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
    pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1,
    maxSimDistance: 180,
    npcCount: 36,
    trafficCount: 18,
    drawDistance: 900
  },
  ULTRA: {
    name: 'ULTRA',
    shadows: true,
    shadowMapSize: 2048,
    pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
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
    this.consecutiveSpikes = 0;
    this.consecutiveNormalFrames = 0;
    this.throttleLevel = 0; // 0: Normal, 1: Light, 2: Medium, 3: Heavy

    this.setupListeners();
  }

  setupListeners() {
    events.on('SET_QUALITY_PRESET', (presetName) => {
      this.applyPreset(presetName);
    });

    events.on('TELEMETRY_UPDATE', ({ fps, drawCalls }) => {
      if (!this.autoAdjustEnabled) return;
      const frameTimeMs = fps > 0 ? (1000 / fps) : 16.7;
      this.recordFrameTime(frameTimeMs / 1000);
    });
  }

  recordFrameTime(deltaSeconds) {
    const frameTimeMs = deltaSeconds * 1000;

    if (frameTimeMs > 22.0) {
      this.consecutiveSpikes++;
      this.consecutiveNormalFrames = 0;

      if (this.consecutiveSpikes >= 3 && this.throttleLevel < 3) {
        this.throttleLevel++;
        this.consecutiveSpikes = 0;
        this.applyDynamicThrottling();
      }
    } else if (frameTimeMs < 18.0) {
      this.consecutiveNormalFrames++;
      this.consecutiveSpikes = 0;

      if (this.consecutiveNormalFrames >= 10 && this.throttleLevel > 0) {
        this.throttleLevel--;
        this.consecutiveNormalFrames = 0;
        this.applyDynamicThrottling();
      }
    } else {
      this.consecutiveSpikes = 0;
    }
  }

  applyDynamicThrottling() {
    events.emit('DYNAMIC_THROTTLE_CHANGED', {
      throttleLevel: this.throttleLevel,
      reduceShadows: this.throttleLevel >= 1,
      reduceParticles: this.throttleLevel >= 1,
      demoteAILOD: this.throttleLevel >= 2,
      reduceAudioVoices: this.throttleLevel >= 3
    });

    if (this.throttleLevel > 0) {
      console.warn(`[PerformanceManager] 3-frame >22ms spike detected. Dynamic throttle engaged: Level ${this.throttleLevel}`);
    } else {
      console.log('[PerformanceManager] Frame rate stabilized (<18ms). Restoring full visual quality.');
    }
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
