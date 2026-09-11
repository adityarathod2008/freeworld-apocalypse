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
import { events } from '../Core/EventBus.js';

export class NPCBase {
  constructor(scene, navGraph, initialNode) {
    this.scene = scene;
    this.navGraph = navGraph;
    this.currentNode = initialNode;
    this.targetNode = this.pickNextNode(initialNode);

    this.model = new NPCModel();
    this.position = initialNode ? initialNode.position.clone() : new THREE.Vector3();
    this.model.root.position.copy(this.position);
    this.scene.add(this.model.root);

    this.perception = new NPCPerception(this);
    this.memory = new NPCMemory();
    this.schedule = new NPCSchedule();
    this.brain = new NPCBrain(this);

    this.health = 100;
    this.isDead = false;
    this.walkSpeed = this.schedule.occupation.walkSpeed || 1.8;
    this.fleeSpeed = 6.4;

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
    this.brain.state = 'DEAD';
    // Fall back death pose
    this.model.root.rotation.x = -Math.PI / 2;
    this.model.root.position.y = 0.2;
    events.removeListener('WEAPON_FIRED', this.gunshotListener);
  }

  update(delta, lod = 'NEAR') {
    if (this.isDead) return;

    // Simulation LOD: if far away, skip visual skeletal animations
    this.memory.update(delta);
    this.schedule.update(delta);
    this.brain.evaluateDecision(delta);
    this.brain.execute(delta);

    this.model.root.position.copy(this.position);
  }

  destroy() {
    events.removeListener('WEAPON_FIRED', this.gunshotListener);
    this.scene.remove(this.model.root);
  }
}
