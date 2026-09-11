/**
 * Game FreeWorld - TrafficCar (v3.0)
 * Autonomous civilian car following road lanes via VehicleAI pure pursuit navigation
 */
import * as THREE from 'three';
import { VehicleFactory } from '../Vehicles/VehicleTypes.js';
import { VehicleAI } from '../Vehicles/VehicleAI.js';

export class TrafficCar {
  constructor(scene, navGraph, initialNode) {
    this.scene = scene;
    this.navGraph = navGraph;

    // Random civilian car type (Sedan or V8)
    if (Math.random() > 0.4) {
      this.vehicle = VehicleFactory.createKestrelSedan(scene);
    } else {
      this.vehicle = VehicleFactory.createVindicatorV8(scene);
    }

    this.position = this.vehicle.mesh.position;
    if (initialNode) {
      this.position.copy(initialNode.position);
      // Align car rotation with node lane direction
      if (initialNode.direction) {
        const heading = Math.atan2(initialNode.direction.x, initialNode.direction.z);
        this.vehicle.mesh.rotation.y = heading;
      }
    }

    // Initialize authoritative VehicleAI brain
    this.ai = new VehicleAI(this.vehicle, this.navGraph, initialNode);
  }

  update(delta, playerPos, otherTraffic) {
    if (!this.vehicle || this.vehicle.driver) return; // If player entered/carjacked, let player drive

    this.ai.update(delta, playerPos, otherTraffic);
  }

  destroy() {
    if (this.vehicle) {
      this.vehicle.destroy();
    }
  }
}
