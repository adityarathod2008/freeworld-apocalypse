/**
 * Game FreeWorld - NPCBrain
 * Systematic Decision Pipeline: Perceive -> Interpret -> Remember -> Select Goal -> Choose Action -> Execute
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class NPCBrain {
  constructor(npc) {
    this.npc = npc;
    this.state = 'WALKING'; // 'WALKING' | 'IDLE' | 'PHONE' | 'FLEEING' | 'CALLING_POLICE' | 'SURRENDER' | 'DEAD'
    this.stateTimer = 0;
    this.callPoliceProgress = 0;
  }

  evaluateDecision(delta) {
    if (this.npc.isDead) {
      this.state = 'DEAD';
      return;
    }

    // 1. If memory has active threat and not dead
    if (this.npc.memory.hasThreat()) {
      // If brave & armed, fight; if citizen, flee or call 911
      if (!this.npc.memory.hasReportedToPolice && Math.random() < 0.6) {
        this.state = 'CALLING_POLICE';
      } else {
        this.state = 'FLEEING';
      }
      return;
    }

    // 2. Normal Routine Behaviors
    if (this.state === 'FLEEING' || this.state === 'CALLING_POLICE') {
      // Threat expired -> return to routine
      this.state = 'WALKING';
    }
  }

  execute(delta) {
    if (this.state === 'DEAD') return;

    if (this.state === 'CALLING_POLICE') {
      this.callPoliceProgress += delta;
      // Phone call takes 3.0s to connect to dispatch
      if (this.callPoliceProgress >= 3.0 && !this.npc.memory.hasReportedToPolice) {
        this.npc.memory.hasReportedToPolice = true;
        this.state = 'FLEEING';
        events.emit('WITNESS_REPORT', {
          type: this.npc.memory.lastWitnessedCrime || 'CRIME_WITNESSED',
          position: this.npc.position.clone()
        });
        events.emit('HUD_NOTIFICATION', {
          title: 'WITNESS REPORT',
          message: 'A civilian dialed 911! Police are responding!'
        });
      }
      this.npc.model.animate(false, false, delta, true); // True for phone animation
      return;
    }

    if (this.state === 'FLEEING') {
      const threat = this.npc.memory.threatPosition;
      const awayDir = new THREE.Vector3().subVectors(this.npc.position, threat).normalize();
      awayDir.y = 0;
      this.npc.position.addScaledVector(awayDir, this.npc.fleeSpeed * delta);
      this.npc.model.root.rotation.y = Math.atan2(-awayDir.x, -awayDir.z);
      this.npc.model.animate(true, true, delta);
      return;
    }

    if (this.state === 'WALKING' && this.npc.targetNode) {
      const dir = new THREE.Vector3().subVectors(this.npc.targetNode.position, this.npc.position);
      dir.y = 0;
      const dist = dir.length();

      if (dist < 1.0) {
        this.npc.currentNode = this.npc.targetNode;
        this.npc.targetNode = this.npc.pickNextNode(this.npc.currentNode);
      } else {
        dir.normalize();
        this.npc.position.addScaledVector(dir, this.npc.walkSpeed * delta);
        this.npc.model.root.rotation.y = Math.atan2(-dir.x, -dir.z);
        this.npc.model.animate(true, false, delta);
      }
    } else {
      this.npc.model.animate(false, false, delta);
    }
  }
}
