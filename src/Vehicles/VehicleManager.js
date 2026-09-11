/**
 * Game FreeWorld - VehicleManager
 * Spawns and manages driveable vehicles and updates their physics
 */
import * as THREE from 'three';
import { VehicleFactory } from './VehicleTypes.js';
import { events } from '../Core/EventBus.js';

export class VehicleManager {
  constructor(scene) {
    this.scene = scene;
    this.vehicles = [];

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('SPAWN_VEHICLE', ({ type, position }) => {
      this.spawnVehicle(type, position);
    });
  }

  spawnInitialVehicles(landmarks) {
    // 1. Apex GT-X parked at curb beside player spawn
    const apex = VehicleFactory.createApexGTX(this.scene);
    apex.mesh.position.set(4.5, 0.45, 20);
    apex.mesh.rotation.y = 0;
    this.vehicles.push(apex);

    // 2. Vindicator V8 parked near Armory
    const v8 = VehicleFactory.createVindicatorV8(this.scene);
    v8.mesh.position.set(landmarks.armory.x - 14, 0.45, landmarks.armory.z - 5);
    this.vehicles.push(v8);

    // 3. Kestrel Sedan parked near Bank
    const sedan = VehicleFactory.createKestrelSedan(this.scene);
    sedan.mesh.position.set(landmarks.bank.x + 20, 0.45, landmarks.bank.z);
    this.vehicles.push(sedan);

    // 4. Goliath Heavy 6x6 at Safehouse Garage
    const truck = VehicleFactory.createGoliathTruck(this.scene);
    truck.mesh.position.set(landmarks.safehouse.x - 12, 0.45, landmarks.safehouse.z + 5);
    this.vehicles.push(truck);

    // 5. Phantom Shadow motorcycle at Harbor
    const bike = VehicleFactory.createPhantomBike(this.scene);
    bike.mesh.position.set(landmarks.harbor.x + 8, 0.45, landmarks.harbor.z - 10);
    this.vehicles.push(bike);
  }

  spawnVehicle(type, position) {
    let car = null;
    switch (type) {
      case 'apex': car = VehicleFactory.createApexGTX(this.scene); break;
      case 'v8': car = VehicleFactory.createVindicatorV8(this.scene); break;
      case 'sedan': car = VehicleFactory.createKestrelSedan(this.scene); break;
      case 'truck': car = VehicleFactory.createGoliathTruck(this.scene); break;
      case 'bike': car = VehicleFactory.createPhantomBike(this.scene); break;
      case 'police': car = VehicleFactory.createPoliceCruiser(this.scene); break;
      default: car = VehicleFactory.createApexGTX(this.scene);
    }

    if (position) {
      car.mesh.position.copy(position);
    }
    this.vehicles.push(car);
    events.emit('HUD_NOTIFICATION', {
      title: 'VEHICLE DELIVERED',
      message: `${car.displayName} has arrived`
    });
    return car;
  }

  update(delta, input, colliders) {
    for (const car of this.vehicles) {
      car.updatePhysics(delta, input, colliders);

      // Flash police strobe lights if active
      if (car.policeLights && car.policeLights.active) {
        car.policeLights.timer += delta * 12;
        const toggle = Math.sin(car.policeLights.timer) > 0;
        car.policeLights.blue.material.color.setHex(toggle ? 0x0088ff : 0x001133);
        car.policeLights.red.material.color.setHex(!toggle ? 0xff0022 : 0x330005);
      }
    }
  }

  getVehicles() {
    return this.vehicles;
  }
}
