/**
 * Game FreeWorld - PlayerModel (v6.0 Phase 6)
 * Articulated protagonist character model integrating HumanMesh, FacialAnimation,
 * HumanIKController, and HumanAnimationFSM.
 */
import * as THREE from 'three';
import { HumanMesh } from '../NPC/HumanMesh.js';
import { FacialAnimation } from '../NPC/FacialAnimation.js';
import { HumanIKController } from '../NPC/HumanIKController.js';
import { HumanAnimationFSM, ANIM_STATES } from '../NPC/HumanAnimationFSM.js';

export class PlayerModel {
  constructor() {
    this.humanMesh = new HumanMesh({
      height: 1.05,
      mass: 1.05,
      physicalCondition: 'athletic',
      skinColor: 0xd4a373,
      shirtColor: 0x1e2638,
      pantsColor: 0x0f172a
    });
    this.root = this.humanMesh.root;

    // Attach Phase 6 Subsystems
    this.facial = new FacialAnimation(this.humanMesh);
    this.ik = new HumanIKController(this.humanMesh);
    this.fsm = new HumanAnimationFSM(this.humanMesh);

    // Direct Joint References for backward compatibility
    this.pelvis = this.humanMesh.pelvis;
    this.torso = this.humanMesh.torso;
    this.head = this.humanMesh.head;
    this.leftArmPivot = this.humanMesh.leftArmPivot;
    this.rightArmPivot = this.humanMesh.rightArmPivot;
    this.leftLegPivot = this.humanMesh.leftLegPivot;
    this.rightLegPivot = this.humanMesh.rightLegPivot;

    // Weapon Socket at Right Hand
    this.weaponSocket = new THREE.Group();
    this.weaponSocket.position.set(0, -0.58, 0.18);
    this.rightArmPivot.add(this.weaponSocket);

    this.animTime = 0;
  }

  setEnvironmentalConditions(dirtPct, wetnessPct) {
    this.humanMesh.setEnvironmentalConditions(dirtPct, wetnessPct);
  }

  setGazeTarget(targetPos, weight = 1.0) {
    this.facial.setGazeTarget(targetPos, weight);
  }

  animate(state, speed, delta, isAiming) {
    if (state === 'IN_VEHICLE') {
      this.fsm.setState(ANIM_STATES.IDLE);
      this.pelvis.position.y = 0.52;
      this.leftLegPivot.rotation.x = -Math.PI / 2.6;
      this.rightLegPivot.rotation.x = -Math.PI / 2.6;
      this.leftArmPivot.rotation.x = -Math.PI / 4;
      this.rightArmPivot.rotation.x = -Math.PI / 4;
      return;
    }

    if (state === 'CROUCH') {
      this.fsm.setState(ANIM_STATES.CROUCH);
    } else {
      this.fsm.update(delta, speed, 0, isAiming);
    }

    // Facial Blinking & Eye Gaze Tracking
    const headWorldPos = new THREE.Vector3();
    if (this.head) this.head.getWorldPosition(headWorldPos);
    this.facial.update(delta, headWorldPos);

    // Foot & Hand IK
    const rootWorldPos = new THREE.Vector3();
    this.root.getWorldPosition(rootWorldPos);
    this.ik.update(delta, rootWorldPos, null);

    // Aiming pose overrides right arm
    if (isAiming) {
      this.rightArmPivot.rotation.x = -Math.PI / 2;
      this.rightArmPivot.rotation.z = 0.1;
      this.leftArmPivot.rotation.x = -Math.PI / 2.2;
      this.leftArmPivot.rotation.z = 0.4;
    }
  }
}
