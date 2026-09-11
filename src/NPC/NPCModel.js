/**
 * Game FreeWorld - NPCModel (v6.0 Phase 6)
 * Articulated human NPC model wrapping HumanMesh, FacialAnimation, HumanIKController,
 * HumanAnimationFSM, and HumanLODController for realistic presentation.
 */
import * as THREE from 'three';
import { HumanMesh } from './HumanMesh.js';
import { FacialAnimation } from './FacialAnimation.js';
import { HumanIKController } from './HumanIKController.js';
import { HumanAnimationFSM, ANIM_STATES } from './HumanAnimationFSM.js';
import { HumanLODController } from './HumanLODController.js';

export class NPCModel {
  constructor(config = {}) {
    this.humanMesh = new HumanMesh(config);
    this.root = this.humanMesh.root;

    // Attach Subsystems
    this.facial = new FacialAnimation(this.humanMesh);
    this.ik = new HumanIKController(this.humanMesh);
    this.fsm = new HumanAnimationFSM(this.humanMesh);
    this.lodCtrl = new HumanLODController();

    // Direct joint references for backward compatibility
    this.pelvis = this.humanMesh.pelvis;
    this.torso = this.humanMesh.torso;
    this.head = this.humanMesh.head;
    this.leftArm = this.humanMesh.leftArmPivot;
    this.rightArm = this.humanMesh.rightArmPivot;
    this.leftLeg = this.humanMesh.leftLegPivot;
    this.rightLeg = this.humanMesh.rightLegPivot;

    this.animTime = 0;
  }

  setGazeTarget(targetPos, weight = 1.0) {
    this.facial.setGazeTarget(targetPos, weight);
  }

  setExpression(expressionName) {
    this.facial.setExpression(expressionName);
  }

  setEnvironmentalConditions(dirtPct, wetnessPct) {
    this.humanMesh.setEnvironmentalConditions(dirtPct, wetnessPct);
  }

  animate(isMoving, isFleeing, delta, isPhoneCall = false, lodTier = 'NEAR') {
    if (!this.lodCtrl.shouldUpdate(lodTier, delta)) return;

    const speed = isFleeing ? 6.0 : (isMoving ? 1.8 : 0);
    this.fsm.update(delta, speed, 0, false);

    // Facial Blinking & Gaze Tracking
    if (lodTier === 'NEAR') {
      const headWorldPos = new THREE.Vector3();
      if (this.head) this.head.getWorldPosition(headWorldPos);
      this.facial.update(delta, headWorldPos);

      // Foot IK solve
      const rootWorldPos = new THREE.Vector3();
      this.root.getWorldPosition(rootWorldPos);
      this.ik.update(delta, rootWorldPos, null);
    }

    if (isPhoneCall) {
      this.facial.setPhoneme('E', 0.2);
      if (this.rightArm) {
        this.rightArm.rotation.x = -Math.PI / 2.2;
        this.rightArm.rotation.z = -0.4;
      }
    }
  }
}
