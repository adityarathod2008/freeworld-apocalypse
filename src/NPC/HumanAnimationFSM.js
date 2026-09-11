/**
 * Game FreeWorld - HumanAnimationFSM (Phase 6)
 * Multi-state animation state machine supporting 14 authoritative movement & interaction states,
 * procedural breathing dynamics, turning balance lean, momentum deceleration, and smooth state blending.
 */
import * as THREE from 'three';

export const ANIM_STATES = {
  IDLE: 'IDLE',
  WALK: 'WALK',
  JOG: 'JOG',
  SPRINT: 'SPRINT',
  TURN: 'TURN',
  STOP: 'STOP',
  STUMBLE: 'STUMBLE',
  FALL: 'FALL',
  RECOVER: 'RECOVER',
  CLIMB: 'CLIMB',
  CROUCH: 'CROUCH',
  INTERACT: 'INTERACT',
  VEHICLE_ENTRY: 'VEHICLE_ENTRY',
  VEHICLE_EXIT: 'VEHICLE_EXIT'
};

export class HumanAnimationFSM {
  constructor(humanMesh) {
    this.mesh = humanMesh;
    this.state = ANIM_STATES.IDLE;
    this.previousState = ANIM_STATES.IDLE;
    this.stateTimer = 0;
    this.blendFactor = 1.0; // 0 (previous) to 1 (current)

    this.animTime = Math.random() * 10;
    this.turningAngle = 0;
    this.momentumSpeed = 0;
    this.stamina = 100;
  }

  setState(newState, force = false) {
    if (this.state === newState && !force) return;
    this.previousState = this.state;
    this.state = newState;
    this.stateTimer = 0;
    this.blendFactor = 0; // Trigger smooth state transition blending
  }

  update(delta, currentSpeed = 0, turningRate = 0, isAiming = false) {
    if (!this.mesh) return;

    this.stateTimer += delta;
    this.blendFactor = Math.min(1.0, this.blendFactor + delta * 5.0); // 0.2s smooth blend transition
    this.momentumSpeed = THREE.MathUtils.lerp(this.momentumSpeed, currentSpeed, delta * 4.0);
    this.turningAngle = THREE.MathUtils.lerp(this.turningAngle, turningRate, delta * 6.0);

    // Auto-state transition based on movement parameters
    if (this.state !== ANIM_STATES.STUMBLE &&
        this.state !== ANIM_STATES.FALL &&
        this.state !== ANIM_STATES.RECOVER &&
        this.state !== ANIM_STATES.CLIMB &&
        this.state !== ANIM_STATES.INTERACT &&
        this.state !== ANIM_STATES.VEHICLE_ENTRY &&
        this.state !== ANIM_STATES.VEHICLE_EXIT &&
        this.state !== ANIM_STATES.CROUCH) {

      if (Math.abs(turningRate) > 1.2 && currentSpeed < 1.0) {
        this.setState(ANIM_STATES.TURN);
      } else if (currentSpeed > 5.5) {
        this.setState(ANIM_STATES.SPRINT);
      } else if (currentSpeed > 3.0) {
        this.setState(ANIM_STATES.JOG);
      } else if (currentSpeed > 0.2) {
        this.setState(ANIM_STATES.WALK);
      } else if (this.momentumSpeed > 1.5 && currentSpeed <= 0.2) {
        this.setState(ANIM_STATES.STOP);
      } else if (this.stateTimer > 0.5) {
        this.setState(ANIM_STATES.IDLE);
      }
    }

    // Advance Animation Time
    let rateMult = 1.8;
    if (this.state === ANIM_STATES.JOG) rateMult = 3.2;
    if (this.state === ANIM_STATES.SPRINT) rateMult = 4.8;
    if (this.state === ANIM_STATES.IDLE) rateMult = 1.0;

    this.animTime += delta * rateMult;

    // Apply Procedural Body Dynamics (Breathing & Weight Transfer)
    this.applyBodyDynamics(delta);

    // Apply Skeletal Bone Rotation Morphs for Active State
    this.applyStatePose(delta, isAiming);
  }

  applyBodyDynamics(delta) {
    // Breathing Chest Cycle
    const breathRate = this.state === ANIM_STATES.SPRINT ? 5.0 : 1.8;
    const breathAmount = this.state === ANIM_STATES.SPRINT ? 0.04 : 0.015;
    const breath = Math.sin(this.animTime * breathRate) * breathAmount;

    if (this.mesh.chest) {
      this.mesh.chest.scale.set(1.0 + breath, 1.0 + breath * 0.5, 1.0 + breath);
    }

    // Weight Transfer & Balance Lean on Turns
    if (this.mesh.pelvis) {
      const lean = THREE.MathUtils.clamp(-this.turningAngle * 0.12, -0.25, 0.25);
      this.mesh.pelvis.rotation.z = THREE.MathUtils.lerp(this.mesh.pelvis.rotation.z, lean, delta * 8.0);
    }
  }

  applyStatePose(delta, isAiming) {
    const swing = Math.sin(this.animTime * 3.5);

    switch (this.state) {
      case ANIM_STATES.IDLE:
        this.mesh.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.mesh.leftLegPivot.rotation.x, 0, delta * 6.0);
        this.mesh.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.mesh.rightLegPivot.rotation.x, 0, delta * 6.0);
        if (!isAiming) {
          this.mesh.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.mesh.leftArmPivot.rotation.x, 0, delta * 6.0);
          this.mesh.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.mesh.rightArmPivot.rotation.x, 0, delta * 6.0);
        }
        break;

      case ANIM_STATES.WALK:
        this.mesh.leftLegPivot.rotation.x = swing * 0.55;
        this.mesh.rightLegPivot.rotation.x = -swing * 0.55;
        if (!isAiming) {
          this.mesh.leftArmPivot.rotation.x = -swing * 0.5;
          this.mesh.rightArmPivot.rotation.x = swing * 0.5;
        }
        break;

      case ANIM_STATES.JOG:
        this.mesh.leftLegPivot.rotation.x = swing * 0.85;
        this.mesh.rightLegPivot.rotation.x = -swing * 0.85;
        if (!isAiming) {
          this.mesh.leftArmPivot.rotation.x = -swing * 0.75;
          this.mesh.rightArmPivot.rotation.x = swing * 0.75;
        }
        break;

      case ANIM_STATES.SPRINT:
        this.mesh.leftLegPivot.rotation.x = swing * 1.15;
        this.mesh.rightLegPivot.rotation.x = -swing * 1.15;
        if (!isAiming) {
          this.mesh.leftArmPivot.rotation.x = -swing * 0.95;
          this.mesh.rightArmPivot.rotation.x = swing * 0.95;
        }
        break;

      case ANIM_STATES.TURN:
        this.mesh.leftLegPivot.rotation.x = Math.sin(this.animTime * 6) * 0.3;
        this.mesh.rightLegPivot.rotation.x = -Math.sin(this.animTime * 6) * 0.3;
        break;

      case ANIM_STATES.STOP:
        this.mesh.pelvis.position.y = 0.9;
        this.mesh.torso.rotation.x = 0.1; // Forward inertia lean
        if (this.stateTimer > 0.4) this.setState(ANIM_STATES.IDLE);
        break;

      case ANIM_STATES.STUMBLE:
        this.mesh.torso.rotation.x = 0.45;
        this.mesh.leftArmPivot.rotation.x = -1.2;
        this.mesh.rightArmPivot.rotation.x = -1.2;
        if (this.stateTimer > 0.8) this.setState(ANIM_STATES.RECOVER);
        break;

      case ANIM_STATES.FALL:
        this.mesh.root.rotation.x = -Math.PI / 2;
        if (this.stateTimer > 1.2) this.setState(ANIM_STATES.RECOVER);
        break;

      case ANIM_STATES.RECOVER:
        this.mesh.root.rotation.x = THREE.MathUtils.lerp(this.mesh.root.rotation.x, 0, delta * 6.0);
        this.mesh.torso.rotation.x = THREE.MathUtils.lerp(this.mesh.torso.rotation.x, 0, delta * 6.0);
        if (this.stateTimer > 0.6) this.setState(ANIM_STATES.IDLE);
        break;

      case ANIM_STATES.CROUCH:
        this.mesh.pelvis.position.y = 0.62;
        this.mesh.leftLegPivot.rotation.x = -0.8;
        this.mesh.rightLegPivot.rotation.x = -0.8;
        break;

      case ANIM_STATES.VEHICLE_ENTRY:
      case ANIM_STATES.VEHICLE_EXIT:
        this.mesh.leftArmPivot.rotation.x = -Math.PI / 3;
        this.mesh.leftArmPivot.rotation.z = 0.3;
        if (this.stateTimer > 1.2) this.setState(ANIM_STATES.IDLE);
        break;
    }
  }
}
