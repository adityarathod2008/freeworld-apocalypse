/**
 * Game FreeWorld - TrafficManager
 * Spawns and manages dynamic civilian traffic throughout the city district
 */
import { TrafficCar } from './TrafficCar.js';

export class TrafficManager {
  constructor(scene, navGraph) {
    this.scene = scene;
    this.navGraph = navGraph;
    this.trafficCars = [];
  }

  spawnTraffic(count = 12) {
    const nodes = this.navGraph.roadNodes;
    if (!nodes || nodes.length === 0) return;

    for (let i = 0; i < count; i++) {
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      const car = new TrafficCar(this.scene, this.navGraph, randomNode);
      this.trafficCars.push(car);
    }
  }

  update(delta, playerPos) {
    for (const car of this.trafficCars) {
      car.update(delta, playerPos, this.trafficCars);
    }
  }

  getTrafficCars() {
    return this.trafficCars;
  }
}
