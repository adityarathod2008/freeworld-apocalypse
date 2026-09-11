/**
 * Game FreeWorld - HumanIKController (Phase 6)
 * Practical 2-bone Inverse Kinematics (IK) for dynamic foot placement
 * on uneven terrain/stairs and hand interaction targeting (doors, vehicles, weapons).
 */
import * as THREE from 'three';

export class HumanIKController {
  constructor(humanMesh) {
    this.mesh = humanMesh;
    this.enabled = true;

    this.leftFootTarget = new THREE.Vector3();
    this.rightFootTarget = new THREE.Vector3();
    this.leftFootWeight = 0;
    this.rightFootWeight = 0;

    this.leftHandTarget = null;
    this.rightHandTarget = null;
    this.leftHandWeight = 0;
    this.rightHandWeight = 0;
  }

  setFootIKTargets(leftPos, rightPos, weight = 1.0) {
    if (leftPos) this.leftFootTarget.copy(leftPos);
    if (rightPos) this.rightFootTarget.copy(rightPos);
    this.leftFootWeight = weight;
    this.rightFootWeight = weight;
  }

  setHandIKTargets(leftTarget, rightTarget, leftWeight = 1.0, rightWeight = 1.0) {
    this.leftHandTarget = leftTarget ? leftTarget.clone() : null;
    this.rightHandTarget = rightTarget ? rightTarget.clone() : null;
    this.leftHandWeight = leftWeight;
    this.rightHandWeight = rightWeight;
  }

  solveFootIK(delta, worldPos, raycastTerrainFn) {
    if (!this.enabled || !this.mesh || !worldPos) return;

    // Ground raycast check for left & right foot
    const rayOriginL = worldPos.clone().add(new THREE.Vector3(-0.14, 1.0, 0));
    const rayOriginR = worldPos.clone().add(new THREE.Vector3(0.14, 1.0, 0));

    const groundL = raycastTerrainFn ? raycastTerrainFn(rayOriginL) : 0.0;
    const groundR = raycastTerrainFn ? raycastTerrainFn(rayOriginR) : 0.0;

    // Adjust Leg Pivot Y height to prevent foot clipping
    const offsetL = Math.max(0, groundL - worldPos.y);
    const offsetR = Math.max(0, groundR - worldPos.y);

    if (this.mesh.leftFoot) {
      this.mesh.leftFoot.position.y = THREE.MathUtils.lerp(
        this.mesh.leftFoot.position.y,
        -0.62 + offsetL * 0.8,
        delta * 10.0
      );
    }
    if (this.mesh.rightFoot) {
      this.mesh.rightFoot.position.y = THREE.MathUtils.lerp(
        this.mesh.rightFoot.position.y,
        -0.62 + offsetR * 0.8,
        delta * 10.0
      );
    }
  }

  solveHandIK(delta) {
    if (!this.enabled || !this.mesh) return;

    // Left Hand Reach IK
    if (this.leftHandTarget && this.leftHandWeight > 0 && this.mesh.leftArmPivot) {
      const shoulderPos = new THREE.Vector3();
      this.mesh.leftArmPivot.getWorldPosition(shoulderPos);
      const dir = new THREE.Vector3().subVectors(this.leftHandTarget, shoulderPos).normalize();
      const pitch = Math.asin(-dir.y);
      const yaw = Math.atan2(-dir.x, -dir.z);

      this.mesh.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.mesh.leftArmPivot.rotation.x, pitch * this.leftHandWeight, delta * 8.0);
      this.mesh.leftArmPivot.rotation.z = THREE.MathUtils.lerp(this.mesh.leftArmPivot.rotation.z, yaw * 0.4 * this.leftHandWeight, delta * 8.0);
    }

    // Right Hand Reach IK
    if (this.rightHandTarget && this.rightHandWeight > 0 && this.mesh.rightArmPivot) {
      const shoulderPos = new THREE.Vector3();
      this.mesh.rightArmPivot.getWorldPosition(shoulderPos);
      const dir = new THREE.Vector3().subVectors(this.rightHandTarget, shoulderPos).normalize();
      const pitch = Math.asin(-dir.y);
      const yaw = Math.atan2(-dir.x, -dir.z);

      this.mesh.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.mesh.rightArmPivot.rotation.x, pitch * this.rightHandWeight, delta * 8.0);
      this.mesh.rightArmPivot.rotation.z = THREE.MathUtils.lerp(this.mesh.rightArmPivot.rotation.z, yaw * 0.4 * this.rightHandWeight, delta * 8.0);
    }
  }

  update(delta, worldPos, raycastTerrainFn) {
    this.solveFootIK(delta, worldPos, raycastTerrainFn);
    this.solveHandIK(delta);
  }
}
