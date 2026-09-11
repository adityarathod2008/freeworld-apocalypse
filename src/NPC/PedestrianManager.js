/**
 * Game FreeWorld - PedestrianManager
 * Manages 25+ active civilians, car collisions, and gunshot sound reactions
 */
import * as THREE from 'three';
import { CivilianAI } from './CivilianAI.js';
import { events } from '../Core/EventBus.js';

export class PedestrianManager {
  constructor(scene, navGraph) {
    this.scene = scene;
    this.navGraph = navGraph;
    this.pedestrians = [];

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('WEAPON_FIRED', ({ origin }) => {
      for (const ped of this.pedestrians) {
        ped.onHearGunshot(origin);
      }
    });
  }

  spawnCivilians(count = 28) {
    const nodes = this.navGraph.sidewalkNodes;
    if (!nodes || nodes.length === 0) return;

    for (let i = 0; i < count; i++) {
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      const ped = new CivilianAI(this.scene, this.navGraph, randomNode);
      this.pedestrians.push(ped);
    }
  }

  update(delta, vehicles = []) {
    for (const ped of this.pedestrians) {
      ped.update(delta);

      // Check car collision
      if (!ped.isDead) {
        for (const car of vehicles) {
          if (Math.abs(car.speed) > 4) {
            const dist = ped.position.distanceTo(car.mesh.position);
            if (dist < 2.4) {
              ped.takeDamage(100, car.driver);
              events.emit('HUD_NOTIFICATION', {
                title: 'VEHICULAR HIT & RUN',
                message: 'A pedestrian was struck!'
              });
              events.emit('CRIME_COMMITTED', {
                type: 'HIT_AND_RUN',
                severity: 2,
                position: ped.position.clone()
              });
            }
          }
        }
      }
    }
  }

  getPedestrians() {
    return this.pedestrians;
  }
}
