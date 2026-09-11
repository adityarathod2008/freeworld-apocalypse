/**
 * Game FreeWorld - PoliceManager
 * Coordinates police cruisers, dispatch units, and siren sound states
 */
import * as THREE from 'three';
import { PoliceAI } from './PoliceAI.js';
import { events } from '../Core/EventBus.js';
import { collision, COLLISION_LAYERS } from '../Core/CollisionSystem.js';

export class PoliceManager {
  constructor(scene, navGraph) {
    this.scene = scene;
    this.navGraph = navGraph;
    this.cruisers = [];
    this.currentWanted = 0;

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('WANTED_LEVEL_CHANGED', ({ level, lastKnownPos }) => {
      this.currentWanted = level;
      this.adjustCruiserCount(level, lastKnownPos);
    });
  }

  adjustCruiserCount(level, targetPos) {
    const desiredCounts = [0, 1, 2, 3, 4, 5];
    const targetCount = desiredCounts[level] || 0;

    // Spawn new cruisers if needed
    while (this.cruisers.length < targetCount) {
      const spawnPos = this.getDispatchSpawnPos(targetPos);
      const cruiser = new PoliceAI(this.scene, this.navGraph, spawnPos);
      this.cruisers.push(cruiser);
    }

    // Despawn excess cruisers if wanted reduced
    while (this.cruisers.length > targetCount) {
      const c = this.cruisers.pop();
      c.destroy();
    }
  }

  getDispatchSpawnPos(targetPos) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 30;
    const x = (targetPos ? targetPos.x : 0) + Math.cos(angle) * dist;
    const z = (targetPos ? targetPos.z : 0) + Math.sin(angle) * dist;
    const roughPos = new THREE.Vector3(x, 0.45, z);

    // Snap to nearest road lane node in the navigation graph
    const roadNode = this.navGraph ? this.navGraph.getNearestRoadNode(roughPos) : null;
    const spawnCandidate = roadNode ? roadNode.position.clone() : roughPos;
    spawnCandidate.y = 0.45;

    // Validate collision clearance
    const validated = collision.validateSpawn(spawnCandidate, 3.0, COLLISION_LAYERS.BUILDING);
    return validated.position;
  }

  update(delta, player) {
    for (const c of this.cruisers) {
      c.update(delta, player, this.currentWanted);
    }
  }

  getActivePolice() {
    return this.cruisers;
  }
}
