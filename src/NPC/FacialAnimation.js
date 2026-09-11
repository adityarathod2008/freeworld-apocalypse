/**
 * Game FreeWorld - FacialAnimation (Phase 6)
 * Real-time facial animation system supporting procedural eyelid blinking,
 * eye gaze tracking, emotional expression morphs, and lip-sync phoneme hooks.
 */
import * as THREE from 'three';

export class FacialAnimation {
  constructor(humanMesh) {
    this.mesh = humanMesh;

    this.blinkTimer = Math.random() * 3.0;
    this.blinkDuration = 0.16;
    this.isBlinking = false;

    this.currentExpression = 'NEUTRAL';
    this.gazeTarget = null;
    this.gazeWeight = 0;

    // Lip Sync state
    this.currentPhoneme = 'OFF';
    this.phonemeTimer = 0;
  }

  setExpression(expressionName) {
    const valid = ['NEUTRAL', 'HAPPY', 'SAD', 'ANGRY', 'SURPRISED', 'SCARED', 'PAIN'];
    if (valid.includes(expressionName)) {
      this.currentExpression = expressionName;
    }
  }

  setGazeTarget(targetPos, weight = 1.0) {
    this.gazeTarget = targetPos;
    this.gazeWeight = Math.max(0, Math.min(1, weight));
  }

  setPhoneme(phoneme, duration = 0.2) {
    this.currentPhoneme = phoneme; // 'A' | 'E' | 'O' | 'M' | 'OFF'
    this.phonemeTimer = duration;
  }

  update(delta, headWorldPos) {
    if (!this.mesh) return;

    // 1. Procedural Blinking
    this.blinkTimer -= delta;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer <= -this.blinkDuration) {
        this.isBlinking = false;
        this.blinkTimer = 2.5 + Math.random() * 3.0; // Next blink in 2.5-5.5s
      }
    }

    // Apply Eyelid Blink Morph
    const blinkFactor = this.isBlinking ? 1.0 : 0;
    if (this.mesh.leftEyelid && this.mesh.rightEyelid) {
      this.mesh.leftEyelid.scale.y = 1.0 + blinkFactor * 1.8;
      this.mesh.rightEyelid.scale.y = 1.0 + blinkFactor * 1.8;
    }

    // 2. Eye Gaze Tracking
    if (this.gazeTarget && this.gazeWeight > 0 && headWorldPos) {
      const dir = new THREE.Vector3().subVectors(this.gazeTarget, headWorldPos).normalize();
      const pitch = Math.asin(dir.y);
      const yaw = Math.atan2(-dir.x, -dir.z);

      if (this.mesh.eyesGroup) {
        this.mesh.eyesGroup.rotation.x = THREE.MathUtils.lerp(this.mesh.eyesGroup.rotation.x, pitch * 0.4 * this.gazeWeight, delta * 6.0);
        this.mesh.eyesGroup.rotation.y = THREE.MathUtils.lerp(this.mesh.eyesGroup.rotation.y, yaw * 0.3 * this.gazeWeight, delta * 6.0);
      }
    }

    // 3. Emotional Expressions Morphs
    this.applyExpressionMorphs(delta);

    // 4. Lip Sync Phoneme Hooks
    if (this.phonemeTimer > 0) {
      this.phonemeTimer -= delta;
      if (this.phonemeTimer <= 0) this.currentPhoneme = 'OFF';
    }
    this.applyPhonemeMorphs();
  }

  applyExpressionMorphs(delta) {
    if (!this.mesh.mouth || !this.mesh.head) return;

    switch (this.currentExpression) {
      case 'HAPPY':
        this.mesh.mouth.scale.set(1.2, 0.6, 1.0);
        break;
      case 'SAD':
        this.mesh.mouth.scale.set(0.8, 0.4, 1.0);
        break;
      case 'ANGRY':
        this.mesh.mouth.scale.set(0.9, 0.3, 1.0);
        if (this.mesh.leftEyelid && this.mesh.rightEyelid) {
          this.mesh.leftEyelid.rotation.z = -0.15;
          this.mesh.rightEyelid.rotation.z = 0.15;
        }
        break;
      case 'SURPRISED':
      case 'SCARED':
        this.mesh.mouth.scale.set(0.7, 1.8, 1.0); // O-shaped wide mouth
        break;
      case 'PAIN':
        this.mesh.mouth.scale.set(1.4, 0.4, 1.0);
        break;
      case 'NEUTRAL':
      default:
        this.mesh.mouth.scale.set(1.0, 1.0, 1.0);
        if (this.mesh.leftEyelid && this.mesh.rightEyelid) {
          this.mesh.leftEyelid.rotation.z = 0;
          this.mesh.rightEyelid.rotation.z = 0;
        }
        break;
    }
  }

  applyPhonemeMorphs() {
    if (!this.mesh.mouth || this.currentPhoneme === 'OFF') return;

    switch (this.currentPhoneme) {
      case 'A':
        this.mesh.mouth.scale.set(1.3, 1.6, 1.0);
        break;
      case 'E':
        this.mesh.mouth.scale.set(1.5, 0.8, 1.0);
        break;
      case 'O':
        this.mesh.mouth.scale.set(0.8, 1.4, 1.0);
        break;
      case 'M':
      case 'P':
        this.mesh.mouth.scale.set(0.9, 0.2, 1.0);
        break;
    }
  }
}
