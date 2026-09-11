/**
 * Game FreeWorld - NPCManager
 * Spawns and simulates the city pedestrian population with distance-based LOD
 */
import { NPCBase } from './NPCBase.js';
import { LODManager } from '../World/LODManager.js';

export class NPCManager {
  constructor(scene, navGraph) {
    this.scene = scene;
    this.navGraph = navGraph;
    this.pedestrians = [];
  }

  spawnCivilians(count = 32) {
    const nodes = this.navGraph.sidewalkNodes;
    if (!nodes || nodes.length === 0) return;

    for (let i = 0; i < count; i++) {
      const node = nodes[Math.floor(Math.random() * nodes.length)];
      const npc = new NPCBase(this.scene, this.navGraph, node);
      this.pedestrians.push(npc);
    }
  }

  update(delta, playerPos) {
    for (const npc of this.pedestrians) {
      const lod = LODManager.getLODLevel(npc.position, playerPos);
      npc.update(delta, lod);
    }
  }

  getPedestrians() {
    return this.pedestrians;
  }
}

// Backward-compatible alias
export { NPCManager as PedestrianManager };
