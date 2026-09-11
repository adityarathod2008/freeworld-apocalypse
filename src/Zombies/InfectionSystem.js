/**
 * FreeWorld Engine - Infection System (Phase 9)
 * Manages 6-stage dynamic pathogen infection & transformation lifecycle:
 * HEALTHY -> EXPOSED -> INFECTED -> SYMPTOMATIC -> SEVERE -> TRANSFORMATION -> ZOMBIE.
 */

import { events } from '../Core/EventBus.js';

export const INFECTION_STAGES = {
  HEALTHY: 'HEALTHY',           // 0%
  EXPOSED: 'EXPOSED',           // 1-20%
  INFECTED: 'INFECTED',         // 21-50%
  SYMPTOMATIC: 'SYMPTOMATIC',   // 51-80% (coughing, speed reduced by 25%)
  SEVERE: 'SEVERE',             // 81-99% (staggering, fever, health drain)
  TRANSFORMATION: 'TRANSFORMATION', // 100% (death & reanimation trigger)
  ZOMBIE: 'ZOMBIE'              // Fully reanimated zombie entity
};

export class InfectionSystem {
  static instance = null;

  constructor() {
    if (InfectionSystem.instance) return InfectionSystem.instance;
    InfectionSystem.instance = this;

    // Track entity infection states: entityId -> { stage, level (0-100), virulence, source, entityRef }
    this.trackedEntities = new Map();
  }

  static get() {
    if (!InfectionSystem.instance) new InfectionSystem();
    return InfectionSystem.instance;
  }

  /**
   * Registers an entity into the infection tracking system.
   * @param {Object} entity NPC or Player instance
   */
  registerEntity(entity) {
    if (!entity || !entity.id) return;
    if (!this.trackedEntities.has(entity.id)) {
      this.trackedEntities.set(entity.id, {
        id: entity.id,
        stage: INFECTION_STAGES.HEALTHY,
        level: 0,
        virulence: 1.0, // multiplier on infection progression rate
        source: null,
        entityRef: entity
      });
    }
  }

  /**
   * Exposes an entity to infection source.
   * @param {string|Object} entityOrId 
   * @param {number} amount Base infection level increase (e.g. bite = 35%, scratch = 10%)
   * @param {string} source Source entity ID or type
   */
  expose(entityOrId, amount = 15, source = 'zombie_bite') {
    const id = typeof entityOrId === 'string' ? entityOrId : entityOrId?.id;
    if (!id) return null;

    if (!this.trackedEntities.has(id) && typeof entityOrId === 'object') {
      this.registerEntity(entityOrId);
    }

    const data = this.trackedEntities.get(id);
    if (!data || data.stage === INFECTION_STAGES.ZOMBIE) return data;

    data.level = Math.min(100, Math.max(0, data.level + amount * data.virulence));
    data.source = source;
    this.updateStage(data);

    events.emit('ENTITY_INFECTED', {
      entityId: id,
      stage: data.stage,
      level: data.level,
      source
    });

    return data;
  }

  /**
   * Cures or reduces infection level of an entity.
   */
  cure(entityOrId, amount = 50) {
    const id = typeof entityOrId === 'string' ? entityOrId : entityOrId?.id;
    const data = this.trackedEntities.get(id);
    if (!data || data.stage === INFECTION_STAGES.ZOMBIE) return;

    data.level = Math.max(0, data.level - amount);
    this.updateStage(data);
    events.emit('ENTITY_INFECTION_CURED', { entityId: id, level: data.level, stage: data.stage });
  }

  /**
   * Updates stage string based on level percentage.
   */
  updateStage(data) {
    const prevStage = data.stage;
    if (data.level <= 0) {
      data.stage = INFECTION_STAGES.HEALTHY;
    } else if (data.level < 21) {
      data.stage = INFECTION_STAGES.EXPOSED;
    } else if (data.level < 51) {
      data.stage = INFECTION_STAGES.INFECTED;
    } else if (data.level < 81) {
      data.stage = INFECTION_STAGES.SYMPTOMATIC;
    } else if (data.level < 100) {
      data.stage = INFECTION_STAGES.SEVERE;
    } else {
      data.stage = INFECTION_STAGES.TRANSFORMATION;
    }

    if (prevStage !== data.stage) {
      events.emit('INFECTION_STAGE_CHANGED', {
        entityId: data.id,
        prevStage,
        newStage: data.stage,
        level: data.level
      });
      if (data.stage === INFECTION_STAGES.TRANSFORMATION) {
        this.triggerTransformation(data);
      }
    }
  }

  /**
   * Advances infection progression over time.
   * @param {number} delta 
   */
  update(delta) {
    for (const data of this.trackedEntities.values()) {
      if (data.stage === INFECTION_STAGES.HEALTHY || data.stage === INFECTION_STAGES.ZOMBIE) continue;

      // Natural infection progression rate (0.5% to 1.5% per second depending on severity)
      const growthRate = (data.level > 50 ? 1.2 : 0.6) * data.virulence;
      data.level = Math.min(100, data.level + growthRate * delta);
      this.updateStage(data);

      // Handle severe / symptomatic effects on host entity
      const entity = data.entityRef;
      if (entity && entity.isAlive !== false) {
        if (data.stage === INFECTION_STAGES.SYMPTOMATIC) {
          if (entity.speedMultiplier) entity.speedMultiplier = 0.75;
        } else if (data.stage === INFECTION_STAGES.SEVERE) {
          if (entity.speedMultiplier) entity.speedMultiplier = 0.5;
          // Severe health drain
          if (typeof entity.takeDamage === 'function') {
            entity.takeDamage(2.0 * delta);
          }
        } else if (data.stage === INFECTION_STAGES.TRANSFORMATION) {
          this.triggerTransformation(data);
        }
      }
    }
  }

  /**
   * Triggers reanimation transformation from NPC to Zombie.
   */
  triggerTransformation(data) {
    if (data.stage === INFECTION_STAGES.ZOMBIE) return;

    data.stage = INFECTION_STAGES.ZOMBIE;
    data.level = 100;

    events.emit('NPC_TRANSFORMED_TO_ZOMBIE', {
      entityId: data.id,
      entity: data.entityRef,
      position: data.entityRef?.position ? { ...data.entityRef.position } : { x: 0, y: 0, z: 0 }
    });
  }

  getInfectionState(entityId) {
    return this.trackedEntities.get(entityId) || null;
  }

  toJSON() {
    const list = [];
    for (const [id, data] of this.trackedEntities.entries()) {
      list.push({ id, stage: data.stage, level: data.level, virulence: data.virulence, source: data.source });
    }
    return list;
  }

  fromJSON(list) {
    if (!Array.isArray(list)) return;
    this.trackedEntities.clear();
    for (const item of list) {
      this.trackedEntities.set(item.id, {
        id: item.id,
        stage: item.stage,
        level: item.level,
        virulence: item.virulence || 1.0,
        source: item.source || null,
        entityRef: null
      });
    }
  }
}
