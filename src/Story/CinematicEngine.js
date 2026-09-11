/**
 * FreeWorld Engine - Live World Cinematic Engine (Phase 12)
 * Manages dynamic camera paths, character focus, subtitles, music transitions, and cinematic letterboxing overlays.
 * PRESERVATION RULE: World simulation CONTINUES running in background while camera path sweeps.
 */

import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class CinematicEngine {
  /**
   * @param {THREE.Camera} camera 
   */
  constructor(camera = null) {
    this.camera = camera;
    this.isPlaying = false;
    this.currentPath = null;
    this.pathTimer = 0;
    this.pathDuration = 5.0;
    this.focusTarget = null;
  }

  /**
   * Starts a dynamic live-world cinematic cutscene.
   * @param {Array<THREE.Vector3>} keyframePositions Array of camera position keyframes
   * @param {THREE.Vector3|Object} focusTarget Target focus position or object
   * @param {number} duration Cutscene duration in seconds
   * @param {Object} subtitleData { speaker, text }
   */
  playCinematicCutscene(keyframePositions = [], focusTarget = null, duration = 5.0, subtitleData = null) {
    if (!keyframePositions || keyframePositions.length < 2) return;

    this.isPlaying = true;
    this.pathTimer = 0;
    this.pathDuration = duration;

    // Create smooth Catmull-Rom spline camera path
    this.currentCurve = new THREE.CatmullRomCurve3(
      keyframePositions.map(p => new THREE.Vector3(p.x, p.y, p.z))
    );

    this.focusTarget = focusTarget ? new THREE.Vector3(focusTarget.x, focusTarget.y, focusTarget.z) : null;

    events.emit('CINEMATIC_CUTSCENE_STARTED', { duration, focusTarget });

    if (subtitleData) {
      events.emit('SHOW_SUBTITLE', subtitleData);
    }
  }

  /**
   * Updates camera position along cinematic path. World simulation continues running natively.
   * @param {number} delta 
   */
  update(delta) {
    if (!this.isPlaying || !this.camera || !this.currentCurve) return;

    this.pathTimer += delta;
    const progress = Math.min(1.0, this.pathTimer / this.pathDuration);

    // Interpolate position along Catmull-Rom curve
    const camPos = this.currentCurve.getPoint(progress);
    this.camera.position.copy(camPos);

    // Look at focus target if specified
    if (this.focusTarget) {
      this.camera.lookAt(this.focusTarget);
    }

    if (progress >= 1.0) {
      this.stopCinematic();
    }
  }

  stopCinematic() {
    this.isPlaying = false;
    this.currentCurve = null;
    this.focusTarget = null;
    events.emit('CINEMATIC_CUTSCENE_FINISHED');
  }
}
