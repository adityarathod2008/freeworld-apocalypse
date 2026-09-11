/**
 * Game FreeWorld - NPCBrain (v7.0 Phase 7)
 * Authoritative 8-Step Human Decision Pipeline:
 * PERCEIVE -> INTERPRET -> REMEMBER -> EVALUATE -> SELECT GOAL -> SELECT ACTION -> EXECUTE -> UPDATE MEMORY.
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class NPCBrain {
  constructor(npc) {
    this.npc = npc;
    this.state = 'WALKING'; // 'WALKING' | 'IDLE' | 'PHONE' | 'FLEEING' | 'CALLING_POLICE' | 'RESISTING' | 'SURRENDER' | 'INVESTIGATING' | 'DEAD'
    this.goal = 'COMMUTE_WORK'; // 'SURVIVE' | 'DEFEND_FRIEND' | 'INVESTIGATE' | 'COMMUTE_WORK' | 'SLEEP_HOME' | 'EVACUATE_CITY' | 'SEEK_LIGHT'
    this.stateTimer = 0;
    this.callPoliceProgress = 0;
    this.targetVehicle = null;
    this.investigatePos = null;

    this.setupListeners();
  }

  setupListeners() {
    events.on('NPC_EJECTED_FROM_VEHICLE', ({ npc, vehicle, position }) => {
      if (npc === this.npc) {
        this.targetVehicle = vehicle;
        this.triggerOwnerReaction(position);
      }
    });

    events.on('VEHICLE_ALARM_TRIGGERED', ({ vehicle, position }) => {
      if (this.npc && this.npc.position && this.npc.position.distanceTo(position) < 25) {
        if (vehicle.ownerId === this.npc.id || Math.random() < 0.5) {
          this.npc.memory.recordEvent('vehicleStolen', {
            crimeType: 'VEHICLE_ALARM',
            position,
            vehicleName: vehicle.displayName
          });
        }
      }
    });
  }

  triggerOwnerReaction(pos) {
    const p = this.npc.personality;
    const fightScore = p ? p.evaluateFightScore(0.5, true) : 0.3;
    const fleeScore = p ? p.evaluateFleeScore(1.0, this.npc.memory.traumaScore) : 0.6;
    const coopScore = p ? p.evaluateCooperationScore(false) : 0.4;

    if (fightScore > 0.5) {
      this.state = 'RESISTING';
      this.stateTimer = 4.0;
    } else if (coopScore > 0.5 && Math.random() < 0.7) {
      this.state = 'CALLING_POLICE';
      this.callPoliceProgress = 0;
    } else if (fleeScore > 0.4) {
      this.state = 'FLEEING';
      this.npc.memory.recordEvent('vehicleStolen', { crimeType: 'CARJACKING', position: pos });
    } else {
      this.state = 'SURRENDER';
      this.stateTimer = 5.0;
    }

    events.emit('HUD_NOTIFICATION', {
      title: 'NPC BRAIN REACTION',
      message: `NPC Personality Choice: ${this.state} (Fight: ${(fightScore * 100).toFixed(0)}%, Flee: ${(fleeScore * 100).toFixed(0)}%)`
    });
  }

  // ----------------------------------------------------
  // 8-STEP DECISION PIPELINE
  // ----------------------------------------------------
  perceive(delta) {
    // 1. Sensory Perception (Vision Cone & Hearing Radius)
    return {
      hasThreat: this.npc.memory.hasThreat(),
      trauma: this.npc.memory.traumaScore,
      inDark: this.npc.inDarkSpace,
      hasFlashlight: this.npc.hasFlashlight
    };
  }

  interpret(perceptionData) {
    // 2. Classify Threat Level & Novelty
    let threatLevel = 0;
    if (perceptionData.hasThreat) threatLevel = 2;
    if (perceptionData.trauma > 60) threatLevel = 3;
    return { threatLevel };
  }

  remember() {
    // 3. Query Memory Ledger
    return {
      recentMemories: this.npc.memory.getRecentMemories(3),
      hasCrimeMemory: this.npc.memory.hasMemoryOf('crimeWitnessed'),
      hasZombieMemory: this.npc.memory.hasMemoryOf('zombieEncounter')
    };
  }

  evaluate(interpretation, memoryData) {
    // 4. Evaluate Personality & Utility Scores
    const p = this.npc.personality;
    if (!p) return { fight: 0.2, flee: 0.8, investigate: 0.1 };

    return {
      fight: p.evaluateFightScore(interpretation.threatLevel),
      flee: p.evaluateFleeScore(interpretation.threatLevel, this.npc.memory.traumaScore),
      investigate: p.evaluateInvestigateScore(15)
    };
  }

  selectGoal(scores, interpretation) {
    // 5. Select Goal based on Highest Utility
    if (interpretation.threatLevel >= 2) {
      if (scores.fight > 0.6) {
        this.goal = 'DEFEND_FRIEND';
      } else {
        this.goal = 'SURVIVE';
      }
    } else if (scores.investigate > 0.65) {
      this.goal = 'INVESTIGATE';
    } else if (this.npc.darknessBehavior && this.npc.darknessBehavior.isLightSeeking) {
      this.goal = 'SEEK_LIGHT';
    } else {
      this.goal = 'COMMUTE_WORK';
    }
  }

  selectAction(scores) {
    // 6. Select Action
    if (this.goal === 'SURVIVE') {
      if (scores.flee > 0.5) {
        this.state = 'FLEEING';
      } else {
        this.state = 'SURRENDER';
      }
    } else if (this.goal === 'DEFEND_FRIEND') {
      this.state = 'RESISTING';
    } else if (this.goal === 'INVESTIGATE') {
      this.state = 'INVESTIGATING';
    }
  }

  execute(delta, lod = 'NEAR') {
    // 7. Execute Action & Physical Locomotion
    if (this.npc.isDead) {
      this.state = 'DEAD';
      return;
    }

    // Step 1 to 6 Pipeline Evaluation
    const perception = this.perceive(delta);
    const interpretation = this.interpret(perception);
    const memory = this.remember();
    const scores = this.evaluate(interpretation, memory);

    if (this.state !== 'RESISTING' && this.state !== 'SURRENDER' && this.state !== 'CALLING_POLICE') {
      this.selectGoal(scores, interpretation);
      this.selectAction(scores);
    }

    // Darkness & Light Seeking Behavior
    if (this.npc.darknessBehavior) {
      this.npc.darknessBehavior.evaluateDarkness(delta, false, 22);
    }

    if (this.state === 'CALLING_POLICE') {
      this.callPoliceProgress += delta;
      if (this.callPoliceProgress >= 2.5 && !this.npc.memory.hasReportedToPolice) {
        this.npc.memory.hasReportedToPolice = true;

        if (this.targetVehicle) {
          events.emit('VEHICLE_REPORTED_STOLEN', {
            vehicleId: this.targetVehicle.vehicleId,
            plate: this.targetVehicle.plate,
            displayName: this.targetVehicle.displayName,
            reporterId: this.npc.id || 'civilian_owner',
            location: { district: 'Downtown Core', position: this.npc.position ? { x: this.npc.position.x, y: this.npc.position.y, z: this.npc.position.z } : { x: 0, y: 0, z: 0 } }
          });
        }

        events.emit('WITNESS_REPORT', {
          type: 'VEHICLE_THEFT',
          position: this.npc.position.clone()
        });

        this.updateMemory('CALL_POLICE_COMPLETED', 20);
        this.state = 'FLEEING';
      }
      this.npc.model.animate(false, false, delta, true, lod);
      return;
    }

    if (this.state === 'RESISTING') {
      if (this.targetVehicle && this.targetVehicle.position) {
        const dir = new THREE.Vector3().subVectors(this.targetVehicle.position, this.npc.position).normalize();
        dir.y = 0;
        this.npc.position.addScaledVector(dir, 3.5 * delta);
        this.npc.model.root.rotation.y = Math.atan2(-dir.x, -dir.z);
        this.npc.model.animate(true, false, delta, false, lod);
      }
      return;
    }

    if (this.state === 'SURRENDER') {
      this.npc.model.animate(false, false, delta, false, lod);
      if (this.npc.model.leftArm && this.npc.model.rightArm) {
        this.npc.model.leftArm.rotation.x = -2.2;
        this.npc.model.rightArm.rotation.x = -2.2;
      }
      return;
    }

    if (this.state === 'FLEEING') {
      const threat = this.npc.memory.threatPosition || this.targetVehicle?.position || new THREE.Vector3();
      const awayDir = new THREE.Vector3().subVectors(this.npc.position, threat).normalize();
      awayDir.y = 0;
      this.npc.position.addScaledVector(awayDir, this.npc.fleeSpeed * delta);
      this.npc.model.root.rotation.y = Math.atan2(-awayDir.x, -awayDir.z);
      this.npc.model.animate(true, true, delta, false, lod);
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
        this.npc.model.animate(true, false, delta, false, lod);
      }
    } else {
      this.npc.model.animate(false, false, delta, false, lod);
    }
  }

  updateMemory(eventType, impact = 20) {
    // 8. Update Memory Ledger
    if (this.npc && this.npc.memory) {
      this.npc.memory.recordEvent(eventType, { position: this.npc.position, impact });
    }
  }

  evaluateDecision(delta) {
    // Retained for backward compatibility
  }
}
