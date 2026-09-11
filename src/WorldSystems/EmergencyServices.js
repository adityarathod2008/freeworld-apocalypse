/**
 * Game FreeWorld - EmergencyServices (v3.0)
 * Autonomous emergency ecosystem:
 * - Ambulance & Paramedics for injured/wounded civilians
 * - Fire Department Engines with water spray for burning vehicles
 * - Traffic incident rerouting & police scene containment
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';
import { VehicleFactory } from '../Vehicles/VehicleTypes.js';
import { VehicleAI } from '../Vehicles/VehicleAI.js';
import { collision, COLLISION_LAYERS } from '../Core/CollisionSystem.js';

export class EmergencyServices {
  constructor(scene, navGraph) {
    this.scene = scene;
    this.navGraph = navGraph;
    this.activeUnits = [];
    this.waterParticles = [];

    this.initWaterPool();
    this.setupEventListeners();
  }

  initWaterPool() {
    const geo = new THREE.SphereGeometry(0.18, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0x77ccff, transparent: true, opacity: 0.75 });
    for (let i = 0; i < 24; i++) {
      const p = new THREE.Mesh(geo, mat.clone());
      p.visible = false;
      this.scene.add(p);
      this.waterParticles.push({ mesh: p, life: 0, maxLife: 0.6, vel: new THREE.Vector3() });
    }
  }

  setupEventListeners() {
    events.on('EMERGENCY_DISPATCH_CALLED', ({ type, position }) => {
      this.dispatchUnit(type, position);
    });

    events.on('VEHICLE_IGNITED', ({ vehicle }) => {
      this.dispatchUnit('fire', vehicle.mesh.position.clone(), vehicle);
    });

    events.on('PEDESTRIAN_INJURED', ({ pedestrian }) => {
      this.dispatchUnit('ambulance', pedestrian.position.clone(), pedestrian);
    });
  }

  dispatchUnit(type, targetPos, targetEntity = null) {
    if (!targetPos) return;

    // Limit active emergency units to 3 concurrently to preserve performance budget
    if (this.activeUnits.length >= 3) return;

    // Find spawn position on road network 80m away from target
    const angle = Math.random() * Math.PI * 2;
    const spawnRough = new THREE.Vector3(
      targetPos.x + Math.cos(angle) * 80,
      0.45,
      targetPos.z + Math.sin(angle) * 80
    );

    const roadNode = this.navGraph ? this.navGraph.getNearestRoadNode(spawnRough) : null;
    const spawnPos = roadNode ? roadNode.position.clone() : spawnRough;
    const validated = collision.validateSpawn(spawnPos, 3.0, COLLISION_LAYERS.BUILDING);

    let vehicle = null;
    if (type === 'fire') {
      vehicle = VehicleFactory.createGoliathTruck(this.scene);
    } else {
      vehicle = VehicleFactory.createKestrelSedan(this.scene);
    }

    vehicle.mesh.position.copy(validated.position);
    const ai = new VehicleAI(vehicle, this.navGraph);
    ai.setPursuitTarget(targetPos);

    const unit = {
      type,
      vehicle,
      ai,
      targetPos,
      targetEntity,
      state: 'EN_ROUTE', // 'EN_ROUTE' | 'ON_SCENE' | 'RETURNING'
      sceneTimer: 0
    };

    this.activeUnits.push(unit);

    events.emit('HUD_NOTIFICATION', {
      title: '911 DISPATCH',
      message: `${type.toUpperCase()} unit responding to incident`
    });
  }

  update(delta) {
    for (let i = this.activeUnits.length - 1; i >= 0; i--) {
      const unit = this.activeUnits[i];
      if (!unit.vehicle) continue;

      if (unit.state === 'EN_ROUTE') {
        unit.ai.setPursuitTarget(unit.targetPos);
        unit.ai.update(delta);

        const dist = unit.vehicle.mesh.position.distanceTo(unit.targetPos);
        if (dist < 12) {
          unit.state = 'ON_SCENE';
          unit.sceneTimer = 0;
          unit.vehicle.speed = 0;
        }
      } else if (unit.state === 'ON_SCENE') {
        unit.sceneTimer += delta;
        unit.vehicle.speed = 0;

        if (unit.type === 'fire') {
          // Spray water hose at burning target vehicle
          this.emitWaterSpray(unit.vehicle.mesh.position, unit.targetPos);
          if (unit.targetEntity && unit.targetEntity.extinguish) {
            unit.targetEntity.extinguish();
          }
        } else if (unit.type === 'ambulance') {
          // Heal injured victim
          if (unit.targetEntity && unit.targetEntity.heal) {
            unit.targetEntity.heal(50);
          }
        }

        if (unit.sceneTimer > 8.0) {
          unit.state = 'RETURNING';
        }
      } else if (unit.state === 'RETURNING') {
        unit.vehicle.destroy();
        this.activeUnits.splice(i, 1);
      }
    }

    // Update active water spray particles
    for (const p of this.waterParticles) {
      if (p.mesh.visible) {
        p.life += delta;
        p.vel.y -= 9.8 * delta; // Gravity
        p.mesh.position.addScaledVector(p.vel, delta);
        if (p.life >= p.maxLife) {
          p.mesh.visible = false;
        }
      }
    }
  }

  emitWaterSpray(origin, target) {
    const p = this.waterParticles.find(item => !item.mesh.visible);
    if (p) {
      p.mesh.visible = true;
      p.life = 0;
      p.mesh.position.copy(origin).add(new THREE.Vector3(0, 1.8, 0));

      const dir = new THREE.Vector3().subVectors(target, origin).normalize();
      p.vel.copy(dir).multiplyScalar(18).add(new THREE.Vector3(0, 4, 0));
    }
  }
}
