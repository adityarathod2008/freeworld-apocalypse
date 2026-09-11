/**
 * Game FreeWorld - CivilianAI
 * State machine for pedestrians: strolling sidewalks, fleeing threats, and reacting to crimes
 */
import * as THREE from 'three';
import { NPCModel } from './NPCModel.js';
import { events } from '../Core/EventBus.js';

export class CivilianAI {
  constructor(scene, navGraph, initialNode) {
    this.scene = scene;
    this.navGraph = navGraph;
    this.currentNode = initialNode;
    this.targetNode = this.pickNextNode(initialNode);

    this.model = new NPCModel();
    this.position = initialNode ? initialNode.position.clone() : new THREE.Vector3();
    this.model.root.position.copy(this.position);
    this.scene.add(this.model.root);

    this.state = 'WALKING'; // 'WALKING' | 'IDLE' | 'FLEEING' | 'DEAD'
    this.health = 100;
    this.walkSpeed = 1.8;
    this.fleeSpeed = 6.2;
    this.fleeTimer = 0;
    this.threatSource = null;

    this.isDead = false;
  }

  pickNextNode(node) {
    if (!node || !node.connections || node.connections.length === 0) return null;
    const idx = Math.floor(Math.random() * node.connections.length);
    return node.connections[idx];
  }

  onHearGunshot(sourcePos) {
    if (this.isDead) return;
    const dist = this.position.distanceTo(sourcePos);
    if (dist < 35) {
      this.triggerPanic(sourcePos);
    }
  }

  triggerPanic(sourcePos) {
    if (this.isDead) return;
    this.state = 'FLEEING';
    this.fleeTimer = 8.0; // Flee for 8 seconds
    this.threatSource = sourcePos.clone();

    // Notify police system as a witness!
    events.emit('WITNESS_REPORT', {
      type: 'GUNFIRE_OR_VIOLENCE',
      position: this.position.clone()
    });
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
        this.triggerPanic(attacker.position);
      }
    }
  }

  die() {
    this.isDead = true;
    this.state = 'DEAD';
    // Fall over
    this.model.root.rotation.x = -Math.PI / 2;
    this.model.root.position.y = 0.2;
  }

  update(delta) {
    if (this.isDead) return;

    if (this.state === 'FLEEING') {
      this.fleeTimer -= delta;
      if (this.fleeTimer <= 0) {
        this.state = 'WALKING';
        this.targetNode = this.navGraph.getNearestSidewalkNode(this.position);
      } else if (this.threatSource) {
        // Run directly away from threat
        const awayDir = new THREE.Vector3().subVectors(this.position, this.threatSource).normalize();
        awayDir.y = 0;
        this.position.addScaledVector(awayDir, this.fleeSpeed * delta);
        this.model.root.rotation.y = Math.atan2(-awayDir.x, -awayDir.z);
        this.model.animate(true, true, delta);
      }
    } else if (this.state === 'WALKING' && this.targetNode) {
      const dir = new THREE.Vector3().subVectors(this.targetNode.position, this.position);
      dir.y = 0;
      const dist = dir.length();

      if (dist < 1.0) {
        this.currentNode = this.targetNode;
        this.targetNode = this.pickNextNode(this.currentNode);
      } else {
        dir.normalize();
        this.position.addScaledVector(dir, this.walkSpeed * delta);
        this.model.root.rotation.y = Math.atan2(-dir.x, -dir.z);
        this.model.animate(true, false, delta);
      }
    }

    this.model.root.position.copy(this.position);
  }

  destroy() {
    this.scene.remove(this.model.root);
  }
}
