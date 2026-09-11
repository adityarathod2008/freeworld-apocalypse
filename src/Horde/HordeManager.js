/**
 * FreeWorld Engine - Horde Manager (Phase 10)
 * Manages high-density horde formation, flocking steering vectors, and 8 mobilization triggers.
 */

import * as THREE from 'three';
import { FlockingSystem, HORDE_TRIGGER_SOURCES } from './FlockingSystem.js';
import { events } from '../Core/EventBus.js';

export class HordeManager {
  /**
   * @param {ZombieManager} zombieManager 
   */
  constructor(zombieManager) {
    this.zombieManager = zombieManager;
    this.flockingSystem = new FlockingSystem();
    this.activeFormations = []; // { id, origin, triggerType, radius, timestamp }

    this.bindHordeTriggers();
  }

  bindHordeTriggers() {
    // 1. Sound Events (Gunshots, Explosions, Sirens, Generators)
    events.on('SOUND_EMITTED', (sound) => {
      if (!sound || !sound.position) return;

      const triggerType = (sound.soundType || 'GUNSHOT').toUpperCase();
      const config = HORDE_TRIGGER_SOURCES[triggerType] || HORDE_TRIGGER_SOURCES.GUNSHOT;
      const radius = config.radius * (sound.volumeMultiplier || 1.0);

      this.triggerHordeFormation(sound.position, triggerType, radius);
    });

    // 2. City Infrastructure & Outbreak Events (Fires, Crowds, Player Activity, Infected Concentrations)
    events.on('HORDE_MOBILIZATION_TRIGGER', ({ position, triggerType, radius }) => {
      this.triggerHordeFormation(position, triggerType || 'PLAYER_ACTIVITY', radius || 50);
    });
  }

  /**
   * Mobilizes nearby zombies into a coherent horde targeting the noise/event origin.
   * @param {THREE.Vector3|Object} position 
   * @param {string} triggerType 
   * @param {number} radius 
   */
  triggerHordeFormation(position, triggerType = 'GUNSHOT', radius = 60) {
    if (!position) return;
    const pos = new THREE.Vector3(position.x, position.y, position.z);

    this.activeFormations.push({
      id: `horde_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      origin: pos,
      triggerType,
      radius,
      timestamp: Date.now()
    });

    if (this.activeFormations.length > 8) this.activeFormations.shift();

    const zombies = this.zombieManager ? this.zombieManager.getActiveZombies() : [];
    for (const z of zombies) {
      if (z.position.distanceTo(pos) <= radius) {
        z.perception.registerSoundEvent({
          position: pos,
          soundType: triggerType,
          volumeMultiplier: 1.5
        });
      }
    }
  }

  /**
   * Applies flocking Boids steering forces to all active zombies.
   * @param {number} delta 
   */
  update(delta) {
    const zombies = this.zombieManager ? this.zombieManager.getActiveZombies() : [];
    if (zombies.length < 2) return;

    for (let i = 0; i < zombies.length; i++) {
      const z1 = zombies[i];
      if (z1.isDead) continue;

      const targetPos = z1.target?.position || (this.activeFormations.length > 0 ? this.activeFormations[this.activeFormations.length - 1].origin : null);
      const steering = this.flockingSystem.calculateSteeringVector(z1, zombies, targetPos);

      if (steering.lengthSq() > 0) {
        const speed = (z1.variant?.speedMult || 1.0) * 1.2 * delta;
        z1.position.addScaledVector(steering, speed);
      }
    }

    // Clean up expired horde formation memory (>15s)
    const now = Date.now();
    this.activeFormations = this.activeFormations.filter(f => now - f.timestamp < 15000);
  }
}
