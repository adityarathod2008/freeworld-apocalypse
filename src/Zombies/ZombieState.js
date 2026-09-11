/**
 * FreeWorld Engine - Zombie Behavior FSM (Phase 9)
 * Manages high-level AI behavioral states for zombie entities.
 */

export const ZOMBIE_STATES = {
  IDLE: 'IDLE',
  WANDER: 'WANDER',
  INVESTIGATE_SOUND: 'INVESTIGATE_SOUND',
  CHASE: 'CHASE',
  ATTACK: 'ATTACK',
  STAGGERED: 'STAGGERED',
  DEAD: 'DEAD'
};

export class ZombieStateFSM {
  constructor(initialState = ZOMBIE_STATES.IDLE) {
    this.currentState = initialState;
    this.previousState = null;
    this.stateTime = 0;
  }

  setState(newState) {
    if (this.currentState === newState || this.currentState === ZOMBIE_STATES.DEAD) return;
    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateTime = 0;
  }

  update(delta) {
    this.stateTime += delta;
  }
}
