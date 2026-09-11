/**
 * FreeWorld Engine - Zombie Locomotion System (Phase 9)
 * Multi-gait physical locomotion: walk, fast walk, run, stumble, fall, crawl, climb, grab, recover, obstacle interaction.
 */

import * as THREE from 'three';

export const LOCOMOTION_GAITS = {
  WALK: 'WALK',            // 1.2 m/s
  FAST_WALK: 'FAST_WALK',  // 2.2 m/s
  RUN: 'RUN',              // 4.5 m/s
  STUMBLE: 'STUMBLE',      // 0.8 m/s forward stumble
  FALL: 'FALL',            // 0 m/s grounded fall
  CRAWL: 'CRAWL',          // 0.6 m/s low profile crawl
  CLIMB: 'CLIMB',          // 1.0 m/s vertical obstacle climb
  GRAB: 'GRAB',            // Locked onto victim target
  RECOVERY: 'RECOVERY',    // Recovering from stumble/fall
  OBSTACLE_INTERACT: 'OBSTACLE_INTERACT' // Vaulting or breaking fence
};

export class ZombieLocomotion {
  constructor(zombieInstance) {
    this.zombie = zombieInstance;
    this.currentGait = LOCOMOTION_GAITS.WALK;
    this.gaitSpeeds = {
      [LOCOMOTION_GAITS.WALK]: 1.2,
      [LOCOMOTION_GAITS.FAST_WALK]: 2.2,
      [LOCOMOTION_GAITS.RUN]: 4.5,
      [LOCOMOTION_GAITS.STUMBLE]: 0.8,
      [LOCOMOTION_GAITS.FALL]: 0.0,
      [LOCOMOTION_GAITS.CRAWL]: 0.6,
      [LOCOMOTION_GAITS.CLIMB]: 1.0,
      [LOCOMOTION_GAITS.GRAB]: 0.0,
      [LOCOMOTION_GAITS.RECOVERY]: 0.3,
      [LOCOMOTION_GAITS.OBSTACLE_INTERACT]: 0.5
    };
    this.stumbleTimer = 0;
  }

  setGait(gait) {
    if (this.currentGait !== gait && this.gaitSpeeds[gait] !== undefined) {
      this.currentGait = gait;
    }
  }

  /**
   * Applies locomotion movement towards target position.
   * @param {THREE.Vector3} targetPos 
   * @param {number} delta 
   * @param {number} baseSpeedMultiplier Variant speed multiplier
   */
  moveTo(targetPos, delta, baseSpeedMultiplier = 1.0) {
    if (!this.zombie || !targetPos) return;

    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= delta;
      if (this.stumbleTimer <= 0) {
        this.setGait(LOCOMOTION_GAITS.WALK);
      }
    }

    const currentSpeed = (this.gaitSpeeds[this.currentGait] || 1.2) * baseSpeedMultiplier;
    if (currentSpeed <= 0) return;

    const zPos = this.zombie.position;
    const dir = new THREE.Vector3().subVectors(targetPos, zPos);
    dir.y = 0; // Lock to ground plane

    const dist = dir.length();
    if (dist > 0.3) {
      dir.normalize();
      const step = Math.min(dist, currentSpeed * delta);
      zPos.addScaledVector(dir, step);

      // Rotate zombie model toward movement direction
      const targetRotationY = Math.atan2(dir.x, dir.z);
      this.zombie.rotationY = THREE.MathUtils.lerp(this.zombie.rotationY || 0, targetRotationY, delta * 8.0);
    }
  }

  /**
   * Triggers physical stumble state (e.g. from leg shots or obstacles).
   */
  triggerStumble(duration = 1.5) {
    this.setGait(LOCOMOTION_GAITS.STUMBLE);
    this.stumbleTimer = duration;
  }

  /**
   * Triggers physical fall state.
   */
  triggerFall() {
    this.setGait(LOCOMOTION_GAITS.FALL);
    this.stumbleTimer = 2.0;
  }

  /**
   * Converts zombie to crawl gait (e.g. lost legs).
   */
  convertToCrawler() {
    this.setGait(LOCOMOTION_GAITS.CRAWL);
  }
}
