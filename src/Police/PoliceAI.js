/**
 * Game FreeWorld - PoliceAI (v3.0)
 * Autonomous police cruiser pursuit AI utilizing VehicleAI pure pursuit,
 * continuous swept building collision, sirens, and tactical intercept gunfire.
 */
import * as THREE from 'three';
import { VehicleFactory } from '../Vehicles/VehicleTypes.js';
import { VehicleAI } from '../Vehicles/VehicleAI.js';
import { events } from '../Core/EventBus.js';

export class PoliceAI {
  constructor(scene, navGraph, spawnPos) {
    this.scene = scene;
    this.navGraph = navGraph;

    this.cruiser = VehicleFactory.createPoliceCruiser(this.scene);
    this.cruiser.mesh.position.copy(spawnPos);
    this.cruiser.policeLights.active = true;

    this.position = this.cruiser.mesh.position;
    this.ai = new VehicleAI(this.cruiser, this.navGraph);
    this.ai.setCruiseMode();

    this.shootTimer = 0;
    this.isDestroyed = false;
  }

  update(delta, playerPos, wantedLevel) {
    if (this.isDestroyed || !this.cruiser) return;

    if (wantedLevel === 0) {
      if (this.cruiser.policeLights) this.cruiser.policeLights.active = false;
      this.cruiser.speed = THREE.MathUtils.lerp(this.cruiser.speed, 0, delta * 3.0);
      return;
    }

    if (this.cruiser.policeLights) this.cruiser.policeLights.active = true;

    if (playerPos) {
      this.ai.setPursuitTarget(playerPos);
      this.ai.update(delta, playerPos);

      // Tactical officer gunfire when in range during high wanted levels
      const dist = this.position.distanceTo(playerPos);
      if (wantedLevel >= 3 && dist < 32) {
        this.shootTimer += delta;
        if (this.shootTimer >= 1.4) {
          this.shootTimer = 0;
          events.emit('POLICE_FIRED', { origin: this.position.clone() });
          if (Math.random() < 0.3) {
            events.emit('PLAYER_TAKE_DAMAGE', 15);
          }
        }
      }
    }
  }

  destroy() {
    this.isDestroyed = true;
    if (this.cruiser) {
      this.cruiser.destroy();
    }
  }
}
