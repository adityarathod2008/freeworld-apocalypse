/**
 * Game FreeWorld - HitReaction
 * Visual impact spark particles, hit flinches, and camera trauma
 */
import * as THREE from 'three';

export class HitReaction {
  constructor(scene) {
    this.scene = scene;
    this.sparks = [];
    this.initPool();
  }

  initPool() {
    const geo = new THREE.SphereGeometry(0.08, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    for (let i = 0; i < 30; i++) {
      const spark = new THREE.Mesh(geo, mat);
      spark.visible = false;
      this.scene.add(spark);
      this.sparks.push({ mesh: spark, vel: new THREE.Vector3(), life: 0 });
    }
  }

  spawnSparks(position, normal) {
    for (let i = 0; i < 5; i++) {
      const sp = this.sparks.find(s => !s.mesh.visible);
      if (!sp) break;

      sp.mesh.visible = true;
      sp.mesh.position.copy(position);
      sp.life = 0.35;
      sp.vel.set(
        (Math.random() - 0.5) * 8 + (normal ? normal.x * 4 : 0),
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 8 + (normal ? normal.z * 4 : 0)
      );
    }
  }

  update(delta) {
    for (const sp of this.sparks) {
      if (sp.mesh.visible) {
        sp.life -= delta;
        sp.vel.y -= 18.0 * delta; // Gravity
        sp.mesh.position.addScaledVector(sp.vel, delta);
        if (sp.life <= 0) {
          sp.mesh.visible = false;
        }
      }
    }
  }
}
