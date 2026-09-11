/**
 * Game FreeWorld - DarknessBehavior (Phase 7)
 * Night & Blackout survival behavior: flashlight/phone usage,
 * light-seeking vector navigation toward streetlamps/emergency lights,
 * pitch-black alley avoidance, emergency exit door navigation, and shelter seeking.
 */
import * as THREE from 'three';

export class DarknessBehavior {
  constructor(npc) {
    this.npc = npc;
    this.isLightSeeking = false;
    this.targetLightSource = null;
    this.emergencyExitTarget = null;
  }

  evaluateDarkness(delta, isBlackout = false, timeOfDay = 12) {
    if (!this.npc || this.npc.isDead) return;

    const isNight = timeOfDay < 6 || timeOfDay > 20;
    const inDark = isBlackout || isNight || this.npc.inDarkSpace;

    if (!inDark) {
      this.npc.isFlashlightActive = false;
      this.npc.isPhoneLightActive = false;
      this.isLightSeeking = false;
      return;
    }

    // Flashlight vs Phone Light activation
    if (this.npc.hasFlashlight) {
      this.npc.isFlashlightActive = true;
      this.npc.isPhoneLightActive = false;
    } else {
      this.npc.isFlashlightActive = false;
      this.npc.isPhoneLightActive = true;
    }

    // Light Seeking & Shelter Navigation
    this.isLightSeeking = true;
  }

  findLightSeekingVector(nearbyLightSources = []) {
    if (!this.npc || !this.npc.position || nearbyLightSources.length === 0) return null;

    let nearestLight = null;
    let minDist = 40.0;

    for (const light of nearbyLightSources) {
      if (!light || !light.position) continue;
      const d = this.npc.position.distanceTo(light.position);
      if (d < minDist) {
        minDist = d;
        nearestLight = light.position;
      }
    }

    if (nearestLight) {
      const seekDir = new THREE.Vector3().subVectors(nearestLight, this.npc.position).normalize();
      seekDir.y = 0;
      return seekDir;
    }

    return null;
  }
}
