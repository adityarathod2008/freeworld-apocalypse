/**
 * Game FreeWorld - EntityManager
 * Central registry of all world entities for spatial queries, targeting, and simulation management
 */
import * as THREE from 'three';

export class EntityManager {
  static instance = null;

  constructor() {
    if (EntityManager.instance) return EntityManager.instance;
    EntityManager.instance = this;

    this.player = null;
    this.vehicles = [];
    this.pedestrians = [];
    this.trafficCars = [];
    this.policeUnits = [];
    this.props = [];
    this.interactiveTriggers = [];
  }

  static get() {
    if (!EntityManager.instance) new EntityManager();
    return EntityManager.instance;
  }

  registerPlayer(player) {
    this.player = player;
  }

  registerVehicle(veh) {
    if (!this.vehicles.includes(veh)) this.vehicles.push(veh);
  }

  unregisterVehicle(veh) {
    const idx = this.vehicles.indexOf(veh);
    if (idx !== -1) this.vehicles.splice(idx, 1);
  }

  registerPedestrian(ped) {
    if (!this.pedestrians.includes(ped)) this.pedestrians.push(ped);
  }

  unregisterPedestrian(ped) {
    const idx = this.pedestrians.indexOf(ped);
    if (idx !== -1) this.pedestrians.splice(idx, 1);
  }

  registerTraffic(car) {
    if (!this.trafficCars.includes(car)) this.trafficCars.push(car);
  }

  unregisterTraffic(car) {
    const idx = this.trafficCars.indexOf(car);
    if (idx !== -1) this.trafficCars.splice(idx, 1);
  }

  registerPolice(cop) {
    if (!this.policeUnits.includes(cop)) this.policeUnits.push(cop);
  }

  unregisterPolice(cop) {
    const idx = this.policeUnits.indexOf(cop);
    if (idx !== -1) this.policeUnits.splice(idx, 1);
  }

  registerTrigger(trigger) {
    this.interactiveTriggers.push(trigger);
  }

  /**
   * Spatial query to find nearby entities within a radius
   */
  getEntitiesInRadius(pos, radius, types = ['pedestrian', 'vehicle', 'police']) {
    const results = [];
    const rSq = radius * radius;

    if (types.includes('pedestrian')) {
      for (const ped of this.pedestrians) {
        if (!ped.isDead && ped.position.distanceToSquared(pos) <= rSq) {
          results.push({ entity: ped, type: 'pedestrian' });
        }
      }
    }

    if (types.includes('vehicle')) {
      for (const veh of this.vehicles) {
        if (veh.position.distanceToSquared(pos) <= rSq) {
          results.push({ entity: veh, type: 'vehicle' });
        }
      }
    }

    if (types.includes('police')) {
      for (const cop of this.policeUnits) {
        if (!cop.isDestroyed && cop.position.distanceToSquared(pos) <= rSq) {
          results.push({ entity: cop, type: 'police' });
        }
      }
    }

    return results;
  }
}
