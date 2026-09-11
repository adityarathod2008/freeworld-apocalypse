/**
 * Game FreeWorld - CameraController
 * Third-person spring-arm orbital camera with shoulder aim offset and vehicle chase dynamics
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.yaw = 0;
    this.pitch = 0.2;
    this.distance = 4.5;
    this.targetDistance = 4.5;
    this.heightOffset = 1.6;

    this.mode = 'ON_FOOT'; // 'ON_FOOT' | 'AIM' | 'VEHICLE'
    this.target = new THREE.Vector3(0, 1.5, 0);
    this.vehicleTarget = null;

    this.minPitch = -1.1;
    this.maxPitch = 1.1;

    // Procedural Camera Shake / Trauma
    this.trauma = 0; // 0 to 1
    this.shakeOffset = new THREE.Vector3();
    this.setupShakeListeners();
  }

  setupShakeListeners() {
    events.on('CAMERA_SHAKE', ({ intensity = 0.5 }) => {
      this.addTrauma(intensity);
    });

    events.on('VEHICLE_CRASH', ({ intensity = 5 }) => {
      this.addTrauma(Math.min(1.0, intensity / 25));
    });

    events.on('EXPLOSION_OCCURRED', () => {
      this.addTrauma(1.0);
    });
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  handleMouseDelta(delta) {
    this.yaw -= delta.x;
    this.pitch -= delta.y;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  }

  setMode(mode) {
    this.mode = mode;
  }

  setVehicleTarget(vehicle) {
    this.vehicleTarget = vehicle;
  }

  update(delta, playerPos, isAiming, colliders = []) {
    if (this.mode === 'VEHICLE' && this.vehicleTarget) {
      // Vehicle chase camera
      const carPos = this.vehicleTarget.mesh.position;
      const carRot = this.vehicleTarget.mesh.rotation.y;

      // Slowly pull camera yaw behind vehicle
      const targetYaw = carRot + Math.PI;
      let diff = (targetYaw - this.yaw) % (Math.PI * 2);
      if (diff < -Math.PI) diff += Math.PI * 2;
      if (diff > Math.PI) diff -= Math.PI * 2;
      this.yaw += diff * delta * 2.5;

      this.target.lerp(new THREE.Vector3(carPos.x, carPos.y + 1.8, carPos.z), 0.15);
      this.targetDistance = 7.5;
      this.heightOffset = 2.8;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 68, 0.1);
    } else if (isAiming) {
      // Shoulder-aim camera
      this.target.copy(playerPos).add(new THREE.Vector3(0, 1.65, 0));
      this.targetDistance = 2.2;
      this.heightOffset = 0.4;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 50, 0.15);
    } else {
      // Standard on-foot camera
      this.target.copy(playerPos).add(new THREE.Vector3(0, 1.5, 0));
      this.targetDistance = 4.5;
      this.heightOffset = 0.6;
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 65, 0.1);
    }
    this.camera.updateProjectionMatrix();

    this.distance = THREE.MathUtils.lerp(this.distance, this.targetDistance, 0.15);

    // Compute ideal camera position
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);

    let offset = new THREE.Vector3(
      sinYaw * cosPitch * this.distance,
      sinPitch * this.distance + this.heightOffset,
      cosYaw * cosPitch * this.distance
    );

    // Right-shoulder offset when aiming
    if (isAiming) {
      const rightVec = new THREE.Vector3(cosYaw, 0, -sinYaw).multiplyScalar(0.7);
      offset.add(rightVec);
    }

    const desiredCamPos = this.target.clone().add(offset);

    // Simple building occlusion detection
    let finalDist = this.distance;
    const rayDir = offset.clone().normalize();
    const ray = new THREE.Ray(this.target, rayDir);

    if (colliders && colliders.length > 0) {
      for (const col of colliders) {
        if (col.type === 'building') {
          const hitPoint = new THREE.Vector3();
          if (ray.intersectBox(col.box, hitPoint)) {
            const hitDist = this.target.distanceTo(hitPoint) - 0.5;
            if (hitDist > 1.0 && hitDist < finalDist) {
              finalDist = hitDist;
            }
          }
        }
      }
    }

    const actualCamPos = this.target.clone().add(rayDir.multiplyScalar(finalDist));
    this.camera.position.lerp(actualCamPos, 0.25);

    // Apply procedural trauma shake
    if (this.trauma > 0.001) {
      const shakePower = this.trauma * this.trauma; // Non-linear response
      const maxShakeOffset = 0.55;
      this.shakeOffset.set(
        (Math.random() - 0.5) * 2 * maxShakeOffset * shakePower,
        (Math.random() - 0.5) * 2 * maxShakeOffset * shakePower,
        (Math.random() - 0.5) * 2 * maxShakeOffset * shakePower
      );
      this.camera.position.add(this.shakeOffset);
      this.trauma = Math.max(0, this.trauma - delta * 1.8); // Decay over ~0.5s
    }

    this.camera.lookAt(this.target);
  }

  getYaw() {
    return this.yaw;
  }
}
