/**
 * FreeWorld Engine - Zombie Attack System (Phase 9)
 * Spatial physical combat engine supporting strike, grab, bite, miss, stagger, knockback, collision.
 */

import * as THREE from 'three';
import { InfectionSystem } from './InfectionSystem.js';
import { events } from '../Core/EventBus.js';

export const ATTACK_TYPES = {
  STRIKE: { range: 1.8, damage: 15, infection: 5, cooldown: 1.2 },
  GRAB: { range: 1.4, damage: 8, infection: 15, cooldown: 2.0 },
  BITE: { range: 1.2, damage: 35, infection: 40, cooldown: 2.5 }
};

export class ZombieAttack {
  constructor(zombieInstance) {
    this.zombie = zombieInstance;
    this.cooldownTimer = 0;
    this.infectionSystem = InfectionSystem.get();
  }

  update(delta) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= delta;
    }
  }

  /**
   * Executes a spatial attack against a living target based on spatial distance and angle.
   * @param {Object} target Player or NPC instance
   * @param {string} attackType 'STRIKE' | 'GRAB' | 'BITE'
   * @returns {Object} Result of attack { hit, attackType, damage, infectionAdded, result: 'HIT'|'MISS'|'PARRIED' }
   */
  executeAttack(target, attackType = 'STRIKE') {
    if (!this.zombie || !target || this.cooldownTimer > 0 || this.zombie.isDead) {
      return { hit: false, result: 'COOLDOWN' };
    }

    const config = ATTACK_TYPES[attackType] || ATTACK_TYPES.STRIKE;
    this.cooldownTimer = config.cooldown;

    const zPos = this.zombie.position;
    const tPos = target.position || target.mesh?.position;
    if (!tPos) return { hit: false, result: 'MISS' };

    const dist = zPos.distanceTo(tPos);

    // Evade/Miss Check: If target is sprinting away at high speed, attack may miss
    const targetSpeed = target.velocity ? target.velocity.length() : 0;
    const isEvading = targetSpeed > 4.0 && dist > (config.range * 0.7);

    if (dist > config.range || isEvading) {
      events.emit('ZOMBIE_ATTACK_MISSED', { zombie: this.zombie, target });
      return { hit: false, attackType, damage: 0, infectionAdded: 0, result: 'MISS' };
    }

    // HIT CONFIRMED! Apply Damage
    if (typeof target.takeDamage === 'function') {
      target.takeDamage(config.damage);
    } else if (target.health !== undefined) {
      target.health = Math.max(0, target.health - config.damage);
    }

    // Apply Knockback & Stagger to target
    const knockbackVector = new THREE.Vector3().subVectors(tPos, zPos).normalize().multiplyScalar(1.5);
    if (target.applyKnockback) {
      target.applyKnockback(knockbackVector);
    }

    // Transfer Infection via InfectionSystem
    this.infectionSystem.expose(target, config.infection, `zombie_${attackType.toLowerCase()}`);

    events.emit('ZOMBIE_ATTACK_HIT', {
      zombie: this.zombie,
      target,
      attackType,
      damage: config.damage,
      infectionAdded: config.infection
    });

    return {
      hit: true,
      attackType,
      damage: config.damage,
      infectionAdded: config.infection,
      result: 'HIT'
    };
  }
}
