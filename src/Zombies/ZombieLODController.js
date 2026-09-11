/**
 * FreeWorld Engine - Zombie LOD Controller (Phase 10)
 * Multi-tier distance LOD throttling for high-density zombie simulation without frame rate drops.
 */

import * as THREE from 'three';

export const ZOMBIE_LOD_TIERS = {
  NEAR: 'NEAR',       // < 30m: 60 Hz full update
  MID: 'MID',         // 30-90m: 30 Hz update
  FAR: 'FAR',         // 90-200m: 10 Hz update
  UNLOADED: 'UNLOADED'// > 200m: 0 Hz paused
};

export class ZombieLODController {
  /**
   * Evaluates LOD tier for zombie based on camera/player position.
   * @param {THREE.Vector3|Object} zombiePos 
   * @param {THREE.Vector3|Object} playerPos 
   * @returns {string} ZOMBIE_LOD_TIERS
   */
  static getLODTier(zombiePos, playerPos) {
    if (!zombiePos || !playerPos) return ZOMBIE_LOD_TIERS.NEAR;

    const zVector = new THREE.Vector3(zombiePos.x, zombiePos.y, zombiePos.z);
    const pVector = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
    const dist = zVector.distanceTo(pVector);

    if (dist < 30.0) return ZOMBIE_LOD_TIERS.NEAR;
    if (dist < 90.0) return ZOMBIE_LOD_TIERS.MID;
    if (dist < 200.0) return ZOMBIE_LOD_TIERS.FAR;
    return ZOMBIE_LOD_TIERS.UNLOADED;
  }

  /**
   * Determines if zombie update frame should execute based on LOD tier and frame counter.
   * @param {string} tier 
   * @param {number} frameCount 
   * @returns {boolean} Should update this frame
   */
  static shouldUpdateFrame(tier, frameCount) {
    if (tier === ZOMBIE_LOD_TIERS.NEAR) return true;
    if (tier === ZOMBIE_LOD_TIERS.MID) return frameCount % 2 === 0;
    if (tier === ZOMBIE_LOD_TIERS.FAR) return frameCount % 6 === 0;
    return false; // UNLOADED tier skips update
  }
}
