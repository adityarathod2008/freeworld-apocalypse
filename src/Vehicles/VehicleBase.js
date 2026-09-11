/**
 * Game FreeWorld - VehicleBase
 * Core physics simulation for drivable vehicles: acceleration, drift slip, steering, damage, headlights,
 * suspension pitch/roll weight transfer, tire smoke, and backfire dynamics.
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';
import { collision, COLLISION_LAYERS } from '../Core/CollisionSystem.js';
import { VehiclePhysics } from './VehiclePhysics.js';
import { VehicleRegistry } from './VehicleRegistry.js';

export class VehicleBase {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.displayName = config.displayName || 'Vehicle';
    this.type = config.type || 'car'; // 'car' | 'truck' | 'bike'

    // Authoritative Vehicle Tracking & Theft Properties
    this.vehicleId = config.vehicleId || `veh_${Math.random().toString(36).substring(2, 9)}`;
    this.plate = config.plate || VehicleRegistry.get().generateLicensePlate();
    this.fuel = config.fuel !== undefined ? config.fuel : 100; // 0 - 100%
    this.condition = config.condition !== undefined ? config.condition : 100; // 0 - 100%
    this.occupants = config.occupants || [];

    this.ownerId = config.ownerId !== undefined ? config.ownerId : null;
    this.keys = config.keys !== undefined ? config.keys : true;
    this.alarm = config.alarm !== undefined ? config.alarm : Math.random() < 0.6;
    this.security = config.security || (this.alarm ? 'basic' : 'none');
    this.isLocked = config.isLocked !== undefined ? config.isLocked : (this.ownerId && this.ownerId !== 'player');
    this.reportedStolen = config.reportedStolen !== undefined ? config.reportedStolen : false;
    this.stolenState = config.stolenState || 'clean';

    this.alarmActive = false;
    this.alarmTimer = 0;
    this.alarmPulseTimer = 0;

    // Real Physics Subsystem
    this.physics = new VehiclePhysics(config);
    this.maxSpeed = this.physics.maxSpeed;
    this.acceleration = this.physics.accelRate;
    this.brakingForce = this.physics.brakeRate;
    this.reverseSpeed = this.physics.reverseSpeed;
    this.steeringSensitivity = this.physics.steerSensitivity;

    this.speed = 0; // Forward speed (m/s)
    this.steerAngle = 0;
    this.lateralVelocity = 0;
    this.driver = null;

    // Vehicle Health & Damage
    this.health = config.maxHealth || 1000;
    this.maxHealth = this.health;
    // 3D Visual Mesh Hierarchy
    this.mesh = new THREE.Group();
    this.wheels = [];
    this.frontWheels = [];
    this.headlights = [];
    this.taillights = [];

    this.halfExtents = this.type === 'bike' 
      ? new THREE.Vector3(0.6, 0.8, 1.4)
      : this.type === 'truck'
      ? new THREE.Vector3(1.8, 1.6, 4.2)
      : new THREE.Vector3(1.3, 0.9, 2.5);

    // Register Dynamic Spatial Collider
    this.collider = collision.registerCollider({
      box: new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(0, 0.8, 0),
        new THREE.Vector3(this.halfExtents.x * 2, this.halfExtents.y * 2, this.halfExtents.z * 2)
      ),
      layer: COLLISION_LAYERS.VEHICLE,
      type: 'dynamic',
      owner: this,
      userData: { vehicle: this, displayName: this.displayName }
    });

    // Exhaust Backfire Point Light
    this.backfireLight = new THREE.PointLight(0xff6600, 0, 8, 2.0);
    this.backfireLight.position.set(0, 0.45, -this.halfExtents.z);
    this.mesh.add(this.backfireLight);

    // Tire Smoke Particle Pool
    this.tireSmokePool = [];
    this.initTireSmokePool();

    this.scene.add(this.mesh);

    // Register with global VehicleRegistry
    VehicleRegistry.get().registerVehicle(this, this.plate);
  }

  triggerAlarm(duration = 12.0) {
    if (!this.alarm) return;
    this.alarmActive = true;
    this.alarmTimer = duration;
    events.emit('VEHICLE_ALARM_TRIGGERED', {
      vehicle: this,
      vehicleId: this.vehicleId,
      plate: this.plate,
      displayName: this.displayName,
      position: this.position.clone()
    });
    events.emit('HUD_NOTIFICATION', {
      title: 'VEHICLE ALARM',
      message: `Car Alarm Triggered on ${this.displayName}!`
    });
  }

  stopAlarm() {
    this.alarmActive = false;
    this.alarmTimer = 0;
  }

  initTireSmokePool() {
    const smokeGeo = new THREE.SphereGeometry(0.25, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xdddddd,
      transparent: true,
      opacity: 0.5
    });

    for (let i = 0; i < 18; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
      p.visible = false;
      this.scene.add(p);
      this.tireSmokePool.push({ mesh: p, life: 0, maxLife: 0.75, velY: 1.2 });
    }
  }

  get position() {
    return this.mesh.position;
  }

  setupLights(frontOffset = 2.4, backOffset = -2.4, widthOffset = 0.85, heightOffset = 0.6) {
    // Front Headlights
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
    const hL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), headMat);
    hL.position.set(-widthOffset, heightOffset, frontOffset);
    this.mesh.add(hL);

    const hR = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), headMat);
    hR.position.set(widthOffset, heightOffset, frontOffset);
    this.mesh.add(hR);

    // Front Spotlights (cast real beams onto road ahead)
    const spotL = new THREE.SpotLight(0xffeedd, 3.5, 45, Math.PI / 6, 0.4);
    spotL.position.set(-widthOffset, heightOffset, frontOffset);
    spotL.target.position.set(-widthOffset, 0, frontOffset + 20);
    this.mesh.add(spotL);
    this.mesh.add(spotL.target);

    const spotR = new THREE.SpotLight(0xffeedd, 3.5, 45, Math.PI / 6, 0.4);
    spotR.position.set(widthOffset, heightOffset, frontOffset);
    spotR.target.position.set(widthOffset, 0, frontOffset + 20);
    this.mesh.add(spotR);
    this.mesh.add(spotR.target);

    this.headlights.push(spotL, spotR);

    // Taillights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0x880011 });
    const tL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.08), tailMat);
    tL.position.set(-widthOffset, heightOffset, backOffset);
    this.mesh.add(tL);

    const tR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.08), tailMat.clone());
    tR.position.set(widthOffset, heightOffset, backOffset);
    this.mesh.add(tR);

    this.taillights.push(tL, tR);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health < this.maxHealth * 0.35 && !this.isSmoking) {
      this.isSmoking = true;
      events.emit('VEHICLE_SMOKING', this);
    }
  }

  updatePhysics(delta, input, colliders = []) {
    this.condition = Math.round((this.health / this.maxHealth) * 100);
    VehicleRegistry.get().updateLocation(this.vehicleId, this.position);
    VehicleRegistry.get().updateCondition(this.vehicleId, this.condition, this.fuel);

    // Alarm countdown & light flashing
    if (this.alarmActive) {
      this.alarmTimer -= delta;
      this.alarmPulseTimer += delta * 12;
      const flash = Math.sin(this.alarmPulseTimer) > 0;
      for (const hl of this.headlights) {
        if (hl.intensity !== undefined) hl.intensity = flash ? 5.0 : 0.2;
      }
      if (this.alarmTimer <= 0) {
        this.stopAlarm();
      }
    }

    if (this.fuel <= 0 && this.driver) {
      // Engine stalled due to empty fuel tank
      this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 3.0);
      this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0, delta * 4.0);
      return;
    }

    if (this.driver && Math.abs(this.speed) > 0.5) {
      // Fuel consumption rate scales with speed
      this.fuel = Math.max(0, this.fuel - delta * 0.04 * (Math.abs(this.speed) / 12));
    }

    if (!this.driver) {
      // Natural deceleration when empty
      this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 2.5);
      this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0, delta * 4.0);
      this.physics.pitch = THREE.MathUtils.lerp(this.physics.pitch, 0, delta * 6.0);
      this.physics.roll = THREE.MathUtils.lerp(this.physics.roll, 0, delta * 6.0);
    } else {
      // Full physics simulation with weight transfer & Pacejka slip
      this.physics.updatePhysics(this, input, delta, collision);

      // Visual taillight brake & reverse states
      const isBraking = (input.isKeyDown('KeyS') && this.speed > 1.0) || input.isKeyDown('Space');
      const isReversing = this.speed < -0.5;
      for (const tl of this.taillights) {
        if (isBraking) {
          tl.material.color.setHex(0xff0022); // Bright brake red
        } else if (isReversing) {
          tl.material.color.setHex(0xffffff); // White reverse lights
        } else {
          tl.material.color.setHex(0x660005); // Dim tail red
        }
      }

      // Backfire visual pulse
      this.backfireLight.intensity = this.physics.isBackfiring ? 4.0 : 0;

      // Telemetry emit for HUD speedometer & Web Audio engine
      const kmh = Math.round(Math.abs(this.speed) * 3.6);
      events.emit('VEHICLE_TELEMETRY', {
        speedKmh: kmh,
        rpm: this.physics.rpm / this.physics.maxRpm,
        gear: this.physics.currentGear === 0 ? 'R' : kmh < 1 ? 'N' : `${this.physics.currentGear}`,
        name: this.displayName
      });
    }

    // Apply pitch (suspension dip/lift) and roll (cornering lean / bike bank) to vehicle body
    this.mesh.rotation.x = this.physics.pitch;
    this.mesh.rotation.z = this.physics.roll;

    // Apply movement along vehicle forward heading with swept continuous collision
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
    const nextPos = this.mesh.position.clone().addScaledVector(forward, this.speed * delta);

    // Continuous Swept Box Collision against Buildings & World Props
    const sweep = collision.sweptBoxTest(
      this.mesh.position,
      nextPos,
      this.halfExtents,
      COLLISION_LAYERS.BUILDING | COLLISION_LAYERS.WORLD,
      this
    );

    if (sweep.hasHit) {
      // Position vehicle cleanly at contact point without penetrating
      this.mesh.position.copy(sweep.hitPoint).addScaledVector(sweep.normal, 0.08);

      const impactSpeed = Math.abs(this.speed);
      if (impactSpeed > 2.0) {
        // Rebound impulse
        this.speed = -this.speed * 0.35;
        this.takeDamage(impactSpeed * 8);
        events.emit('VEHICLE_CRASH', { vehicle: this, intensity: impactSpeed, normal: sweep.normal });
      } else {
        this.speed = 0;
      }
    } else {
      this.mesh.position.copy(nextPos);
    }

    // Keep on ground plane
    this.mesh.position.y = 0.45;

    // Update dynamic spatial collider
    if (this.collider) {
      const currentBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(this.mesh.position.x, this.mesh.position.y + this.halfExtents.y, this.mesh.position.z),
        new THREE.Vector3(this.halfExtents.x * 2, this.halfExtents.y * 2, this.halfExtents.z * 2)
      );
      collision.updateDynamicCollider(this.collider, currentBox);
    }

    // Rotate Wheels
    const wheelRotDelta = (this.speed / 0.4) * delta;
    for (const w of this.wheels) {
      w.rotation.x += wheelRotDelta;
    }
    // Pivot Front Wheels for steering
    for (const fw of this.frontWheels) {
      fw.rotation.y = this.steerAngle;
    }

    // Dynamic Tire Smoke emission during burnouts and high-angle drift slides
    if (this.physics.isSkidding && Math.abs(this.speed) > 3.0) {
      const p = this.tireSmokePool.find(item => !item.mesh.visible);
      if (p) {
        p.mesh.visible = true;
        p.life = 0;
        p.mesh.scale.set(1, 1, 1);
        const sideOffset = Math.random() > 0.5 ? 0.95 : -0.95;
        const rearPos = new THREE.Vector3(
          sideOffset,
          0.15,
          -this.halfExtents.z * 0.75
        ).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
        p.mesh.position.copy(this.mesh.position).add(rearPos);
      }
    }

    // Update active tire smoke puffs
    for (const p of this.tireSmokePool) {
      if (p.mesh.visible) {
        p.life += delta;
        p.mesh.position.y += p.velY * delta;
        p.mesh.scale.addScalar(delta * 2.2);
        p.mesh.material.opacity = (1 - p.life / p.maxLife) * 0.45;
        if (p.life >= p.maxLife) {
          p.mesh.visible = false;
        }
      }
    }
  }

  destroy() {
    if (this.collider) {
      collision.unregisterCollider(this.collider.id);
      this.collider = null;
    }
    for (const p of this.tireSmokePool) {
      this.scene.remove(p.mesh);
    }
    this.scene.remove(this.mesh);
  }
}
