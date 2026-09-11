/**
 * Game FreeWorld - NPCPerception
 * Vision cones, hearing radii, and sensory evaluation of threats (gunfire, crimes, speeding cars)
 */
import * as THREE from 'three';

export class NPCPerception {
  constructor(owner) {
    this.owner = owner;
    this.visionRange = 28.0; // meters
    this.visionAngle = Math.PI * 0.7; // ~126 degrees FOV
    this.hearingRange = 40.0;
  }

  canSee(targetPos) {
    const toTarget = new THREE.Vector3().subVectors(targetPos, this.owner.position);
    toTarget.y = 0;
    const dist = toTarget.length();
    if (dist > this.visionRange) return false;

    toTarget.normalize();
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.owner.model.root.rotation.y);
    const angle = forward.angleTo(toTarget);
    return angle <= this.visionAngle / 2;
  }

  canHear(soundPos, soundRadius = 35.0) {
    const dist = this.owner.position.distanceTo(soundPos);
    return dist <= Math.min(this.hearingRange, soundRadius);
  }
}
