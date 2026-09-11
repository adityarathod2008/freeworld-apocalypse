/**
 * FreeWorld Engine - Zombie Physics & Impact Reactions (Phase 10)
 * Handles physical reactions to vehicles, explosions, doors, walls, and zombie crowd collision forces.
 */

import * as THREE from 'three';

export class ZombiePhysics {
  /**
   * @param {ZombieBase} zombieInstance 
   */
  constructor(zombieInstance) {
    this.zombie = zombieInstance;
    this.velocity = new THREE.Vector3();
    this.knockbackDuration = 0;
  }

  /**
   * Applies vehicle collision impact force to zombie.
   * @param {THREE.Vector3|Object} impactVector 
   * @param {number} speed Impact vehicle speed
   */
  applyVehicleImpact(impactVector, speed = 10.0) {
    if (!this.zombie || this.zombie.isDead) return;

    const damage = Math.round(speed * 4.5);
    this.zombie.takeDamage(damage);

    if (this.zombie.isAlive) {
      this.zombie.locomotion.triggerFall();
      const knockbackDir = new THREE.Vector3(impactVector.x, 0.2, impactVector.z).normalize().multiplyScalar(speed * 0.8);
      this.zombie.position.add(knockbackDir);
    }
  }

  /**
   * Applies blast impulse force from explosions.
   * @param {THREE.Vector3|Object} explosionOrigin 
   * @param {number} force Blast force multiplier
   */
  applyExplosionImpulse(explosionOrigin, force = 15.0) {
    if (!this.zombie) return;

    const zPos = this.zombie.position;
    const origin = new THREE.Vector3(explosionOrigin.x, explosionOrigin.y, explosionOrigin.z);
    const dist = zPos.distanceTo(origin);

    if (dist < 15.0) {
      const knockbackDir = new THREE.Vector3().subVectors(zPos, origin).normalize().multiplyScalar((1.0 - dist / 15.0) * force);
      this.zombie.position.add(knockbackDir);

      const damage = Math.round((1.0 - dist / 15.0) * 120);
      this.zombie.takeDamage(damage);

      if (this.zombie.isAlive) {
        this.zombie.locomotion.triggerStumble(2.0);
      }
    }
  }

  /**
   * Resolves obstacle collision against walls/doors.
   */
  resolveObstacleCollision(colliders = []) {
    if (!this.zombie || !colliders.length) return;
    const zPos = this.zombie.position;

    for (const c of colliders) {
      if (c.box && c.box.containsPoint(zPos)) {
        // Push zombie outside bounding box edge
        const center = c.box.getCenter(new THREE.Vector3());
        const pushDir = new THREE.Vector3().subVectors(zPos, center).normalize().multiplyScalar(0.4);
        zPos.add(pushDir);
      }
    }
  }
}
