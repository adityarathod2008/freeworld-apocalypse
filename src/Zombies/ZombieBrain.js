/**
 * FreeWorld Engine - Zombie Brain (Phase 10)
 * Authoritative 8-stage biological decision pipeline:
 * PERCEIVE -> INVESTIGATE -> TARGET -> CHASE -> ATTACK -> SEARCH -> LOSE_TARGET -> WANDER.
 */

import { PerceptionMemory } from './PerceptionMemory.js';

export const ZOMBIE_BRAIN_STAGES = {
  PERCEIVE: 'PERCEIVE',
  INVESTIGATE: 'INVESTIGATE',
  TARGET: 'TARGET',
  CHASE: 'CHASE',
  ATTACK: 'ATTACK',
  SEARCH: 'SEARCH',
  LOSE_TARGET: 'LOSE_TARGET',
  WANDER: 'WANDER'
};

export class ZombieBrain {
  /**
   * @param {ZombieBase} zombieInstance 
   */
  constructor(zombieInstance) {
    this.zombie = zombieInstance;
    this.stage = ZOMBIE_BRAIN_STAGES.WANDER;
    this.memory = new PerceptionMemory(10.0); // 10s search duration
    this.searchTimer = 0;
    this.loseTargetTimer = 0;
  }

  /**
   * Main 8-stage decision pipeline frame loop.
   * @param {number} delta 
   * @param {Array} livingEntities 
   * @param {number} isDarkness 
   * @param {Array} colliders 
   */
  evaluate(delta, livingEntities = [], isDarkness = 0.0, colliders = []) {
    if (!this.zombie || this.zombie.isDead) return;

    this.memory.update(delta);

    // Stage 1: PERCEIVE - Evaluate sensory inputs (Sight FOV, Sound, Smell)
    const perceived = this.zombie.perception.evaluateSensoryPerception(livingEntities, isDarkness, colliders);

    if (perceived) {
      if (perceived.senseType === 'SIGHT') {
        // Stage 3: TARGET - Living target visually acquired
        this.zombie.target = perceived;
        this.memory.rememberTarget(perceived.target, perceived.position, perceived.confidence);

        if (perceived.distance <= 1.5) {
          // Stage 5: ATTACK
          this.stage = ZOMBIE_BRAIN_STAGES.ATTACK;
          this.zombie.fsm.setState('ATTACK');
        } else {
          // Stage 4: CHASE
          this.stage = ZOMBIE_BRAIN_STAGES.CHASE;
          this.zombie.fsm.setState('CHASE');
        }
      } else if (perceived.senseType === 'SOUND' || perceived.senseType === 'SMELL') {
        // Stage 2: INVESTIGATE - Sound or scent detected without direct line-of-sight
        if (this.stage !== ZOMBIE_BRAIN_STAGES.CHASE && this.stage !== ZOMBIE_BRAIN_STAGES.ATTACK) {
          this.stage = ZOMBIE_BRAIN_STAGES.INVESTIGATE;
          this.zombie.target = perceived;
          this.zombie.fsm.setState('INVESTIGATE_SOUND');
        }
      }
    } else {
      // Line of sight lost or target vanished
      if (this.stage === ZOMBIE_BRAIN_STAGES.CHASE || this.stage === ZOMBIE_BRAIN_STAGES.ATTACK) {
        if (this.memory.hasActiveMemory()) {
          // Stage 6: SEARCH - Search last known position
          this.stage = ZOMBIE_BRAIN_STAGES.SEARCH;
          this.zombie.fsm.setState('INVESTIGATE_SOUND');
        } else {
          // Stage 7: LOSE_TARGET
          this.stage = ZOMBIE_BRAIN_STAGES.LOSE_TARGET;
          this.loseTargetTimer = 2.0;
        }
      } else if (this.stage === ZOMBIE_BRAIN_STAGES.SEARCH) {
        if (!this.memory.hasActiveMemory()) {
          this.stage = ZOMBIE_BRAIN_STAGES.LOSE_TARGET;
          this.loseTargetTimer = 2.0;
        }
      } else if (this.stage === ZOMBIE_BRAIN_STAGES.LOSE_TARGET) {
        this.loseTargetTimer -= delta;
        if (this.loseTargetTimer <= 0) {
          // Stage 8: WANDER
          this.stage = ZOMBIE_BRAIN_STAGES.WANDER;
          this.zombie.target = null;
          this.zombie.fsm.setState('WANDER');
        }
      }
    }
  }
}
