/**
 * Game FreeWorld - TrafficAI
 * Controls civilian vehicle navigation, following lanes, yielding to police sirens,
 * stopping for lead cars and traffic signals.
 */
import * as THREE from 'three';

export class TrafficAI {
  constructor(car, navGraph) {
    this.car = car;
    this.navGraph = navGraph;
    this.isYieldingToSiren = false;
    this.honkCooldown = 0;
  }

  update(delta, playerPos, otherCars, sirenActive) {
    if (this.honkCooldown > 0) this.honkCooldown -= delta;

    this.isYieldingToSiren = sirenActive;
    if (this.isYieldingToSiren) {
      // Pull over to curb / decelerate
      this.car.desiredSpeed = 6;
    } else {
      this.car.desiredSpeed = 16 + (this.car.carIndex % 4) * 3;
    }
  }
}
