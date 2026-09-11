/**
 * FreeWorld Engine - Zombie Manager (Phase 9)
 * Manages zombie spawning, transformed NPC conversion, update loop, spatial partitioning, and persistence.
 */

import { ZombieBase } from './ZombieBase.js';
import { InfectionSystem } from './InfectionSystem.js';
import { ZombieLODController } from './ZombieLODController.js';
import { events } from '../Core/EventBus.js';

export class ZombieManager {
  static instance = null;

  /**
   * @param {THREE.Scene} scene 
   */
  constructor(scene = null) {
    if (ZombieManager.instance) return ZombieManager.instance;
    ZombieManager.instance = this;

    this.scene = scene;
    this.zombies = new Map();
    this.infectionSystem = InfectionSystem.get();
    this.frameCount = 0;

    this.bindEvents();
  }

  static get() {
    if (!ZombieManager.instance) new ZombieManager();
    return ZombieManager.instance;
  }

  bindEvents() {
    // Listen for transformed NPCs and instantiate zombie replacements
    events.on('NPC_TRANSFORMED_TO_ZOMBIE', (data) => {
      this.handleNPCTransformation(data);
    });
  }

  /**
   * Spawns a new Zombie in the world scene.
   * @param {Object} config { id, variant, position, health }
   * @returns {ZombieBase} Spawened zombie instance
   */
  spawnZombie(config = {}) {
    const zombie = new ZombieBase(this.scene, config);
    this.zombies.set(zombie.id, zombie);
    return zombie;
  }

  /**
   * Handles reanimation of an infected NPC into a zombie entity.
   */
  handleNPCTransformation(data) {
    if (!data || !data.position) return;

    // Pick random variant or default walker
    const variants = ['WALKER', 'WALKER', 'RUNNER', 'CRAWLER'];
    const variant = variants[Math.floor(Math.random() * variants.length)];

    const zombie = this.spawnZombie({
      id: `zombie_transformed_${data.entityId || Date.now()}`,
      variant,
      position: data.position
    });

    events.emit('HUD_NOTIFICATION', {
      title: 'OUTBREAK TRANSFORMATION',
      message: `An infected civilian has reanimated into a ${variant}!`
    });

    return zombie;
  }

  /**
   * Main Zombie Manager Frame Loop.
   * @param {number} delta 
   * @param {Array} livingEntities Player and living NPCs
   * @param {number} isDarkness 0.0 (daylight) to 1.0 (blackout)
   * @param {Array} colliders Static geometry
   */
  update(delta, livingEntities = [], isDarkness = 0.0, colliders = []) {
    this.frameCount++;
    // Update infection progression engine
    this.infectionSystem.update(delta);

    // Identify player position for distance LOD calculation
    const playerTarget = livingEntities.find(e => e && e.isPlayer) || livingEntities[0];
    const playerPos = playerTarget ? (playerTarget.position || playerTarget.mesh?.position) : null;

    // Update active zombie instances with simulation LOD throttling
    for (const zombie of this.zombies.values()) {
      const tier = ZombieLODController.getLODTier(zombie.position, playerPos);
      if (ZombieLODController.shouldUpdateFrame(tier, this.frameCount)) {
        zombie.update(delta, livingEntities, isDarkness, colliders);
      }
    }
  }

  getZombies() {
    return Array.from(this.zombies.values());
  }

  getActiveZombies() {
    return Array.from(this.zombies.values()).filter(z => !z.isDead);
  }

  clear() {
    for (const z of this.zombies.values()) {
      z.destroy();
    }
    this.zombies.clear();
  }

  toJSON() {
    const list = [];
    for (const z of this.zombies.values()) {
      list.push(z.toJSON());
    }
    return list;
  }

  fromJSON(list) {
    if (!Array.isArray(list)) return;
    this.clear();
    for (const item of list) {
      const z = this.spawnZombie(item);
      z.fromJSON(item);
    }
  }
}
