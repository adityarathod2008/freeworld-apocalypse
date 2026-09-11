/**
 * FreeWorld Engine - Zombie Perception System (Phase 9)
 * Multi-sensory perception engine: Sight (FOV cone, distance, darkness lighting, raycast LOS),
 * Sound (gunshots, explosions, sirens, vehicles, footsteps, shouting with obstacle dampening),
 * and Smell Abstraction (scent node tracking).
 */

import * as THREE from 'three';
import { collision } from '../Core/CollisionSystem.js';
import { events } from '../Core/EventBus.js';

export const SOUND_TYPES = {
  GUNSHOT: { radius: 65, priority: 1.0 },
  EXPLOSION: { radius: 110, priority: 1.0 },
  SIREN: { radius: 85, priority: 0.9 },
  VEHICLE: { radius: 40, priority: 0.7 },
  SHOUT: { radius: 28, priority: 0.8 },
  DOOR: { radius: 10, priority: 0.5 },
  FOOTSTEP: { radius: 12, priority: 0.4 } // Sprint = 12m, Walk = 4m, Crouch = 1m
};

export class ZombiePerception {
  /**
   * @param {Object} zombieInstance Parent ZombieBase instance
   */
  constructor(zombieInstance) {
    this.zombie = zombieInstance;

    // Sight configuration
    this.baseSightDistance = 25.0; // meters in broad daylight
    this.fovAngle = Math.PI * (120 / 180); // 120 degree cone
    this.perceivedTargets = new Map(); // targetId -> { target, distance, confidence, lastKnownPos, type: 'SIGHT'|'SOUND'|'SMELL' }

    // Sound memory
    this.recentSounds = []; // { position, volume, radius, soundType, timestamp }

    // Scent tracking memory
    this.scentTrail = []; // { position, intensity, timestamp }

    this.bindSoundEvents();
  }

  bindSoundEvents() {
    this.soundListener = (soundData) => {
      this.registerSoundEvent(soundData);
    };
    events.on('SOUND_EMITTED', this.soundListener);
  }

  destroy() {
    if (this.soundListener) {
      events.off('SOUND_EMITTED', this.soundListener);
    }
  }

  /**
   * Registers a emitted sound event into zombie auditory sensory memory.
   * @param {Object} sound { position, soundType, volumeMultiplier, sourceId }
   */
  registerSoundEvent(sound) {
    if (!sound || !sound.position || !this.zombie || this.zombie.isDead) return;

    const config = SOUND_TYPES[sound.soundType] || SOUND_TYPES.FOOTSTEP;
    const pos = new THREE.Vector3(sound.position.x, sound.position.y, sound.position.z);
    const zPos = this.zombie.position;

    const dist = zPos.distanceTo(pos);
    let effectiveRadius = config.radius * (sound.volumeMultiplier || 1.0);

    // Occlusion check through physical colliders
    if (collision && collision.raycast) {
      const dir = new THREE.Vector3().subVectors(pos, zPos).normalize();
      const hit = collision.raycast(zPos, dir, dist);
      if (hit && hit.distance < dist - 0.5) {
        effectiveRadius *= 0.45; // Wall dampening reduces sound range by 55%
      }
    }

    if (dist <= effectiveRadius) {
      const loudness = 1.0 - (dist / effectiveRadius);
      this.recentSounds.push({
        position: pos,
        soundType: sound.soundType || 'UNKNOWN',
        loudness,
        timestamp: Date.now(),
        sourceId: sound.sourceId || null
      });

      // Keep recent sound list manageable
      if (this.recentSounds.length > 10) this.recentSounds.shift();
    }
  }

  /**
   * Evaluates sensory perception against living potential targets.
   * @param {Array} potentialTargets Array of entities (player, civilians)
   * @param {number} isDarkness Light level (0.0 = total darkness, 1.0 = full daylight)
   * @param {Array} colliders Static world geometry for raycast line-of-sight
   * @returns {Object|null} Highest priority perceived target
   */
  evaluateSensoryPerception(potentialTargets, isDarkness = 0.0, colliders = []) {
    if (!this.zombie || this.zombie.isDead) return null;

    const zPos = this.zombie.position;
    const zForward = this.zombie.getForwardVector ? this.zombie.getForwardVector() : new THREE.Vector3(0, 0, 1);

    let bestTarget = null;
    let highestConfidence = 0.0;

    // 1. SIGHT EVALUATION
    if (Array.isArray(potentialTargets)) {
      for (const target of potentialTargets) {
        if (!target || target.isAlive === false || target.isZombie) continue;

        const tPos = target.position || target.mesh?.position;
        if (!tPos || typeof tPos.x !== 'number') continue;

        const toTarget = new THREE.Vector3().subVectors(tPos, zPos);
        const dist = toTarget.length();

        // Effective sight distance modified by lighting and flashlight/movement
        let sightDist = this.baseSightDistance * (1.0 - isDarkness * 0.65);
        
        // Target stance/movement speed multiplier
        let targetVisibilityMult = 1.0;
        if (target.isCrouching) targetVisibilityMult *= 0.5;
        if (target.isSprinting) targetVisibilityMult *= 1.6;
        if (target.hasFlashlightOn) targetVisibilityMult *= 2.0;

        sightDist *= targetVisibilityMult;

        if (dist <= sightDist) {
          // Angle/FOV Check
          toTarget.normalize();
          const angle = zForward.angleTo(toTarget);

          // Close range peripheral detection (within 3 meters, zombies sense behind them)
          const inFOV = angle <= (this.fovAngle / 2) || dist <= 3.0;

          if (inFOV) {
            // Line of Sight Raycast Check against physical colliders
            let hasLOS = true;
            if (collision && collision.raycast) {
              const hit = collision.raycast(zPos, toTarget, dist);
              if (hit && hit.distance < dist - 0.6) {
                hasLOS = false; // Blocked by wall/building obstacle
              }
            }

            if (hasLOS) {
              const confidence = Math.min(1.0, (1.0 - dist / sightDist) * 1.2 * targetVisibilityMult);
              if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestTarget = {
                  target,
                  position: tPos.clone(),
                  distance: dist,
                  confidence,
                  senseType: 'SIGHT'
                };
              }
            }
          }
        }
      }
    }

    // 2. SOUND EVALUATION (If no direct sight target or sound confidence is higher)
    const now = Date.now();
    this.recentSounds = this.recentSounds.filter(s => now - s.timestamp < 6000); // 6s sound memory limit

    if (this.recentSounds.length > 0) {
      // Pick loudest recent sound
      const loudestSound = this.recentSounds.reduce((max, s) => s.loudness > max.loudness ? s : max, this.recentSounds[0]);
      if (loudestSound && loudestSound.loudness * 0.85 > highestConfidence) {
        highestConfidence = loudestSound.loudness * 0.85;
        bestTarget = {
          target: null, // Sound position, entity not directly seen yet
          position: loudestSound.position.clone(),
          distance: zPos.distanceTo(loudestSound.position),
          confidence: highestConfidence,
          senseType: 'SOUND'
        };
      }
    }

    // 3. SMELL ABSTRACTION EVALUATION
    if (!bestTarget && this.scentTrail.length > 0) {
      const recentScent = this.scentTrail[this.scentTrail.length - 1];
      if (recentScent && zPos.distanceTo(recentScent.position) < 15.0) {
        bestTarget = {
          target: null,
          position: recentScent.position.clone(),
          distance: zPos.distanceTo(recentScent.position),
          confidence: 0.35,
          senseType: 'SMELL'
        };
      }
    }

    return bestTarget;
  }

  /**
   * Adds scent node from living entities in vicinity.
   */
  depositScent(position, intensity = 1.0) {
    this.scentTrail.push({
      position: position.clone(),
      intensity,
      timestamp: Date.now()
    });
    if (this.scentTrail.length > 12) this.scentTrail.shift();
  }
}
