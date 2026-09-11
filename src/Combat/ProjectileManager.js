/**
 * Game FreeWorld - ProjectileManager
 * Visual impact sparks, bullet tracers, and reticle hit confirms
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class ProjectileManager {
  constructor(scene) {
    this.scene = scene;
    this.sparks = [];

    // Particle spark geometry
    this.sparkGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(30 * 3);
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.sparkMat = new THREE.PointsMaterial({
      color: 0xffcc33,
      size: 0.18,
      transparent: true,
      opacity: 1.0
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('COMBAT_HIT', ({ point }) => {
      this.spawnSparks(point);
      this.showHitMarker();
    });
  }

  spawnSparks(hitPoint) {
    const pCount = 14;
    const geo = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < pCount; i++) {
      positions.push(hitPoint.x, hitPoint.y, hitPoint.z);
      velocities.push(
        (Math.random() - 0.5) * 8,
        Math.random() * 6 + 1,
        (Math.random() - 0.5) * 8
      );
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.22,
      transparent: true,
      opacity: 1.0
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    this.sparks.push({ points, geo, velocities, lifetime: 0.35, age: 0 });
  }

  showHitMarker() {
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      crosshair.classList.add('hit');
      setTimeout(() => crosshair.classList.remove('hit'), 120);
    }
  }

  update(delta) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.age += delta;
      const progress = sp.age / sp.lifetime;

      if (progress >= 1.0) {
        this.scene.remove(sp.points);
        sp.geo.dispose();
        this.sparks.splice(i, 1);
        continue;
      }

      sp.points.material.opacity = 1.0 - progress;
      const posAttr = sp.geo.attributes.position;
      const arr = posAttr.array;

      for (let p = 0; p < sp.velocities.length / 3; p++) {
        arr[p * 3] += sp.velocities[p * 3] * delta;
        arr[p * 3 + 1] += sp.velocities[p * 3 + 1] * delta;
        arr[p * 3 + 2] += sp.velocities[p * 3 + 2] * delta;
        sp.velocities[p * 3 + 1] -= 18 * delta; // Gravity
      }
      posAttr.needsUpdate = true;
    }
  }
}
