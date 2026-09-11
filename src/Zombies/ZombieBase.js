/**
 * FreeWorld Engine - Zombie Base Class (Phase 9)
 * Authoritative zombie entity integrating perception, locomotion, state machine, spatial attacks, and 3D visual mesh.
 */

import * as THREE from 'three';
import { ZombieStateFSM, ZOMBIE_STATES } from './ZombieState.js';
import { ZombiePerception } from './ZombiePerception.js';
import { ZombieLocomotion, LOCOMOTION_GAITS } from './ZombieLocomotion.js';
import { ZombieAttack } from './ZombieAttack.js';
import { ZOMBIE_VARIANTS } from './ZombieVariants.js';
import { ZombieBrain } from './ZombieBrain.js';
import { ZombiePhysics } from './ZombiePhysics.js';
import { events } from '../Core/EventBus.js';

export class ZombieBase {
  /**
   * @param {THREE.Scene} scene 
   * @param {Object} config { id, variant, position, health }
   */
  constructor(scene = null, config = {}) {
    this.id = config.id || `zombie_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.isZombie = true;
    this.isAlive = true;
    this.isDead = false;
    this.scene = scene;

    const variantKey = (config.variant || 'WALKER').toUpperCase();
    this.variant = ZOMBIE_VARIANTS[variantKey] || ZOMBIE_VARIANTS.WALKER;

    this.health = config.health !== undefined ? config.health : this.variant.health;
    this.maxHealth = this.variant.health;
    this.position = new THREE.Vector3(
      config.position?.x || 0,
      config.position?.y || 0.5,
      config.position?.z || 0
    );
    this.rotationY = config.rotationY || 0;

    // Core Modular Subsystems
    this.fsm = new ZombieStateFSM(ZOMBIE_STATES.IDLE);
    this.perception = new ZombiePerception(this);
    this.locomotion = new ZombieLocomotion(this);
    this.attack = new ZombieAttack(this);
    this.brain = new ZombieBrain(this);
    this.physics = new ZombiePhysics(this);

    this.target = null; // Currently tracked sensory target
    this.wanderTarget = null;
    this.wanderTimer = 0;

    this.createMesh();
  }

  createMesh() {
    if (!this.scene) return;

    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    const s = this.variant.scale;
    const geo = new THREE.BoxGeometry(0.7 * s.x, 1.7 * s.y, 0.5 * s.z);
    const mat = new THREE.MeshStandardMaterial({
      color: this.variant.color,
      roughness: 0.8,
      metalness: 0.1
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.position.y = (1.7 * s.y) / 2;

    // Glowing eyes indicator
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Red glow
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15 * s.x, (1.5 * s.y) / 2, 0.26 * s.z);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.15 * s.x, (1.5 * s.y) / 2, 0.26 * s.z);

    this.group.add(this.mesh, leftEye, rightEye);
    this.scene.add(this.group);
  }

  getForwardVector() {
    return new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
  }

  /**
   * Main Zombie AI Frame Loop.
   * @param {number} delta 
   * @param {Array} livingEntities Potential targets (Player, Civilians)
   * @param {number} isDarkness Light level (0.0 daylight to 1.0 darkness)
   * @param {Array} colliders Static geometry
   */
  update(delta, livingEntities = [], isDarkness = 0.0, colliders = []) {
    if (this.isDead) return;

    this.fsm.update(delta);
    this.attack.update(delta);

    // 1. Evaluate 8-Stage Brain Decision Pipeline
    if (this.brain) {
      this.brain.evaluate(delta, livingEntities, isDarkness, colliders);
    } else {
      const perceived = this.perception.evaluateSensoryPerception(livingEntities, isDarkness, colliders);
      if (perceived) {
        this.target = perceived;
        if (perceived.senseType === 'SIGHT') {
          this.fsm.setState(perceived.distance <= 1.5 ? ZOMBIE_STATES.ATTACK : ZOMBIE_STATES.CHASE);
        } else {
          this.fsm.setState(ZOMBIE_STATES.INVESTIGATE_SOUND);
        }
      }
    }

    // 2. Physics & Obstacle Collision Resolution
    if (this.physics) {
      this.physics.resolveObstacleCollision(colliders);
    }

    // 2. FSM Execution
    switch (this.fsm.currentState) {
      case ZOMBIE_STATES.IDLE:
        this.locomotion.setGait(LOCOMOTION_GAITS.WALK);
        this.wanderTimer -= delta;
        if (this.wanderTimer <= 0) {
          this.fsm.setState(ZOMBIE_STATES.WANDER);
          this.wanderTimer = 3 + Math.random() * 5;
          this.wanderTarget = this.position.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            0,
            (Math.random() - 0.5) * 20
          ));
        }
        break;

      case ZOMBIE_STATES.WANDER:
        this.locomotion.setGait(LOCOMOTION_GAITS.WALK);
        if (this.wanderTarget) {
          this.locomotion.moveTo(this.wanderTarget, delta, this.variant.speedMult);
          if (this.position.distanceTo(this.wanderTarget) < 1.0) {
            this.fsm.setState(ZOMBIE_STATES.IDLE);
          }
        }
        break;

      case ZOMBIE_STATES.INVESTIGATE_SOUND:
        this.locomotion.setGait(LOCOMOTION_GAITS.FAST_WALK);
        if (this.target && this.target.position) {
          this.locomotion.moveTo(this.target.position, delta, this.variant.speedMult);
          if (this.position.distanceTo(this.target.position) < 1.5) {
            this.fsm.setState(ZOMBIE_STATES.WANDER);
          }
        }
        break;

      case ZOMBIE_STATES.CHASE:
        this.locomotion.setGait(this.variant.type === 'RUNNER' ? LOCOMOTION_GAITS.RUN : LOCOMOTION_GAITS.FAST_WALK);
        if (this.target && this.target.position) {
          this.locomotion.moveTo(this.target.position, delta, this.variant.speedMult);
        }
        break;

      case ZOMBIE_STATES.ATTACK:
        this.locomotion.setGait(LOCOMOTION_GAITS.GRAB);
        if (this.target && this.target.target) {
          this.attack.executeAttack(this.target.target, 'BITE');
        }
        break;
    }

    // 3. Sync 3D Mesh position and orientation
    if (this.group) {
      this.group.position.copy(this.position);
      this.group.rotation.y = this.rotationY;
    }
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    } else {
      this.locomotion.triggerStumble(1.0);
    }
  }

  die() {
    this.isAlive = false;
    this.isDead = true;
    this.health = 0;
    this.fsm.setState(ZOMBIE_STATES.DEAD);

    if (this.mesh && this.mesh.material) {
      this.mesh.material.color.setHex(0x1e1e1e); // Dark grey corpse color
    }
    if (this.group) {
      this.group.rotation.z = Math.PI / 2; // Lie flat on ground
      this.group.position.y = 0.2;
    }

    events.emit('ZOMBIE_DIED', { zombieId: this.id, position: this.position.clone() });
  }

  destroy() {
    this.perception.destroy();
    if (this.group && this.scene) {
      this.scene.remove(this.group);
    }
  }

  toJSON() {
    return {
      id: this.id,
      variant: this.variant.type,
      health: this.health,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      rotationY: this.rotationY,
      state: this.fsm.currentState
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.id = data.id || this.id;
    this.health = data.health !== undefined ? data.health : this.health;
    if (data.position) {
      this.position.set(data.position.x, data.position.y, data.position.z);
    }
    this.rotationY = data.rotationY || 0;
    if (data.state) this.fsm.setState(data.state);
  }
}
