/**
 * FreeWorld Engine - Flocking System (Phase 10)
 * Implements high-density Boids flocking steering: Separation, Alignment, Cohesion, Target Attraction, and Obstacle Avoidance.
 * Supports 8 horde mobilization formation sources: gunshots, explosions, sirens, fires, crowds, generators, player activity, infected concentrations.
 */

import * as THREE from 'three';
import { collision } from '../Core/CollisionSystem.js';

export const HORDE_TRIGGER_SOURCES = {
  GUNSHOT: { radius: 70, weight: 1.0 },
  EXPLOSION: { radius: 120, weight: 1.5 },
  SIREN: { radius: 90, weight: 0.9 },
  FIRE: { radius: 45, weight: 0.6 },
  CROWD: { radius: 35, weight: 0.7 },
  GENERATOR: { radius: 50, weight: 0.8 },
  PLAYER_ACTIVITY: { radius: 40, weight: 1.0 },
  INFECTED_CONCENTRATION: { radius: 30, weight: 1.2 }
};

export class FlockingSystem {
  constructor() {
    this.separationRadius = 1.8; // meters
    this.neighborRadius = 12.0;   // meters

    this.weights = {
      separation: 1.6,
      alignment: 0.8,
      cohesion: 0.7,
      targetAttraction: 1.4,
      obstacleAvoidance: 2.2
    };
  }

  /**
   * Calculates composite flocking steering vector for a zombie.
   * @param {ZombieBase} zombie 
   * @param {Array<ZombieBase>} neighbors 
   * @param {THREE.Vector3} targetPos 
   * @returns {THREE.Vector3} Steering vector
   */
  calculateSteeringVector(zombie, neighbors = [], targetPos = null) {
    if (!zombie || zombie.isDead) return new THREE.Vector3();

    const zPos = zombie.position;
    const steering = new THREE.Vector3();

    if (neighbors.length > 0) {
      const separation = new THREE.Vector3();
      const alignment = new THREE.Vector3();
      const cohesion = new THREE.Vector3();

      let neighborCount = 0;

      for (const other of neighbors) {
        if (!other || other.id === zombie.id || other.isDead) continue;

        const oPos = other.position;
        const dist = zPos.distanceTo(oPos);

        if (dist > 0 && dist <= this.neighborRadius) {
          neighborCount++;

          // 1. Separation Vector
          if (dist <= this.separationRadius) {
            const diff = new THREE.Vector3().subVectors(zPos, oPos).normalize();
            separation.add(diff.divideScalar(dist));
          }

          // 2. Alignment Vector
          const otherForward = other.getForwardVector ? other.getForwardVector() : new THREE.Vector3(0, 0, 1);
          alignment.add(otherForward);

          // 3. Cohesion Vector
          cohesion.add(oPos);
        }
      }

      if (neighborCount > 0) {
        // Normalize & scale Separation
        if (separation.lengthSq() > 0) {
          separation.normalize().multiplyScalar(this.weights.separation);
          steering.add(separation);
        }

        // Normalize & scale Alignment
        alignment.divideScalar(neighborCount).normalize().multiplyScalar(this.weights.alignment);
        steering.add(alignment);

        // Normalize & scale Cohesion
        cohesion.divideScalar(neighborCount);
        const cohesionDir = new THREE.Vector3().subVectors(cohesion, zPos).normalize().multiplyScalar(this.weights.cohesion);
        steering.add(cohesionDir);
      }
    }

    // 4. Target Attraction
    if (targetPos) {
      const targetDir = new THREE.Vector3().subVectors(targetPos, zPos).normalize().multiplyScalar(this.weights.targetAttraction);
      steering.add(targetDir);
    }

    // 5. Raycast Obstacle Avoidance
    const forward = zombie.getForwardVector ? zombie.getForwardVector() : new THREE.Vector3(0, 0, 1);
    if (collision && collision.raycast) {
      const hit = collision.raycast(zPos, forward, 3.5);
      if (hit) {
        // Calculate reflect vector away from obstacle normal
        const avoidVector = forward.clone().reflect(hit.normal || new THREE.Vector3(1, 0, 0)).multiplyScalar(this.weights.obstacleAvoidance);
        steering.add(avoidVector);
      }
    }

    if (steering.lengthSq() > 0) {
      steering.y = 0; // Lock to ground plane
      steering.normalize();
    }

    return steering;
  }
}
