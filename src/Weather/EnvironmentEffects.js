/**
 * Game FreeWorld - EnvironmentEffects
 * Storm rain particle streaks, sky lightning flashes, and wet road surface effects
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class EnvironmentEffects {
  constructor(scene) {
    this.scene = scene;
    this.isRaining = false;
    this.rainCount = 1200;
    this.lightningTimer = 0;

    this.createRainSystem();
    this.createLightningFlash();
    this.setupListeners();
  }

  createRainSystem() {
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.35,
      transparent: true,
      opacity: 0.65
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  createLightningFlash() {
    this.lightningLight = new THREE.DirectionalLight(0xddeeff, 0);
    this.lightningLight.position.set(20, 100, 20);
    this.scene.add(this.lightningLight);
  }

  setupListeners() {
    events.on('WEATHER_CHANGED', ({ weather }) => {
      this.isRaining = weather === 'RAIN' || weather === 'STORM';
      this.rainParticles.visible = this.isRaining;
    });
  }

  update(delta, playerPos) {
    if (this.isRaining && playerPos) {
      this.rainParticles.position.x = playerPos.x;
      this.rainParticles.position.z = playerPos.z;

      const pos = this.rainParticles.geometry.attributes.position.array;
      for (let i = 0; i < this.rainCount; i++) {
        pos[i * 3 + 1] -= 65.0 * delta; // Fall downward
        if (pos[i * 3 + 1] < 0) {
          pos[i * 3 + 1] = 45;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;

      // Random lightning flash during storms
      this.lightningTimer += delta;
      if (this.lightningTimer > 10.0 + Math.random() * 15.0) {
        this.lightningTimer = 0;
        this.flashLightning();
      }
    }

    if (this.lightningLight.intensity > 0) {
      this.lightningLight.intensity = Math.max(0, this.lightningLight.intensity - delta * 12.0);
    }
  }

  flashLightning() {
    this.lightningLight.intensity = 4.5;
    events.emit('LIGHTNING_FLASH');
  }
}
