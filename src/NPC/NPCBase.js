/**
 * Game FreeWorld - NPCBase
 * Unified base entity connecting Model, Perception, Memory, Schedule, and Brain
 */
import * as THREE from 'three';
import { NPCModel } from './NPCModel.js';
import { NPCBrain } from './NPCBrain.js';
import { NPCPerception } from './NPCPerception.js';
import { NPCMemory } from './NPCMemory.js';
import { NPCSchedule } from './NPCSchedule.js';
import { NPCPersonality } from './NPCPersonality.js';
import { DarknessBehavior } from './DarknessBehavior.js';
import { events } from '../Core/EventBus.js';

export class NPCBase {
  constructor(scene, navGraph, initialNode, personalityConfig = {}) {
    this.id = personalityConfig.id || `npc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.scene = scene;
    this.navGraph = navGraph;
    this.currentNode = initialNode;
    this.targetNode = this.pickNextNode(initialNode);

    this.personality = new NPCPersonality(personalityConfig);
    this.model = new NPCModel();
    this.position = initialNode ? initialNode.position.clone() : new THREE.Vector3();
    this.model.root.position.copy(this.position);
    if (this.scene) this.scene.add(this.model.root);

    this.perception = new NPCPerception(this);
    this.memory = new NPCMemory();
    this.schedule = new NPCSchedule();
    this.darknessBehavior = new DarknessBehavior(this);
    this.brain = new NPCBrain(this);

    this.health = 100;
    this.isDead = false;
    this.isAlive = true;
    this.walkSpeed = this.schedule.occupation.walkSpeed || 1.8;
    this.fleeSpeed = 6.4;

    // Night & Dark Space Properties
    this.hasFlashlight = Math.random() < 0.7;
    this.isFlashlightActive = false;
    this.isPhoneLightActive = false;
    this.inDarkSpace = false;

    this.setupListeners();
  }

  setupListeners() {
    this.gunshotListener = ({ origin }) => {
      if (this.isDead) return;
      if (this.perception.canHear(origin, 45)) {
        this.memory.recordCrime('GUNFIRE', origin);
      }
    };
    events.on('WEAPON_FIRED', this.gunshotListener);

    events.on('MASTER_POWER_GRID_CHANGED', ({ isOnline }) => {
      if (!isOnline && !this.isDead) {
        this.inDarkSpace = true;
      }
    });
  }

  pickNextNode(node) {
    if (!node || !node.connections || node.connections.length === 0) return null;
    const idx = Math.floor(Math.random() * node.connections.length);
    return node.connections[idx];
  }

  takeDamage(amount, attacker) {
    if (this.isDead) return;
    this.health -= amount;

    if (this.health <= 0) {
      this.die();
      events.emit('CRIME_COMMITTED', {
        type: 'HOMICIDE',
        severity: 2,
        position: this.position.clone()
      });
    } else {
      if (attacker && attacker.position) {
        this.memory.recordCrime('ASSAULT', attacker.position);
      }
    }
  }

  die() {
    this.isDead = true;
    this.isAlive = false;
    this.brain.state = 'DEAD';
    // Fall back death pose
    this.model.root.rotation.x = -Math.PI / 2;
    this.model.root.position.y = 0.2;
    events.removeListener('WEAPON_FIRED', this.gunshotListener);
  }

  update(delta, lod = 'NEAR') {
    if (this.isDead) return;

    this.memory.update(delta);
    this.schedule.update(delta);
    this.brain.evaluateDecision(delta);
    this.brain.execute(delta, lod);

    this.model.root.position.copy(this.position);
  }

  destroy() {
    events.removeListener('WEAPON_FIRED', this.gunshotListener);
    this.scene.remove(this.model.root);
  }
}
