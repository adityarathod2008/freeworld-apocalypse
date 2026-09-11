/**
 * FreeWorld Engine - Perception Memory (Phase 10)
 * Remembers target last known positions, manages search duration, and realistic target loss.
 */

import * as THREE from 'three';

export class PerceptionMemory {
  constructor(searchDuration = 10.0) {
    this.lastKnownPosition = null;
    this.lastSeenTimestamp = 0;
    this.searchTimer = 0;
    this.maxSearchDuration = searchDuration;
    this.confidence = 0.0;
    this.targetId = null;
  }

  /**
   * Records or updates target last known position in memory.
   * @param {Object} target 
   * @param {THREE.Vector3|Object} position 
   * @param {number} confidence 
   */
  rememberTarget(target, position, confidence = 1.0) {
    if (!position) return;
    this.targetId = target?.id || target?.name || 'unknown_target';
    this.lastKnownPosition = new THREE.Vector3(position.x, position.y, position.z);
    this.lastSeenTimestamp = Date.now();
    this.searchTimer = this.maxSearchDuration;
    this.confidence = Math.min(1.0, confidence);
  }

  /**
   * Advances search duration timer and decays memory confidence.
   * @param {number} delta 
   */
  update(delta) {
    if (this.searchTimer > 0) {
      this.searchTimer -= delta;
      this.confidence = Math.max(0.0, this.searchTimer / this.maxSearchDuration);
      if (this.searchTimer <= 0) {
        this.clearMemory();
      }
    }
  }

  clearMemory() {
    this.lastKnownPosition = null;
    this.lastSeenTimestamp = 0;
    this.searchTimer = 0;
    this.confidence = 0.0;
    this.targetId = null;
  }

  hasActiveMemory() {
    return this.lastKnownPosition !== null && this.searchTimer > 0;
  }
}
