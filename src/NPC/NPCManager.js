/**
 * Game FreeWorld - NPCManager
 * Spawns and simulates the city pedestrian population with distance-based LOD
 */
import { NPCBase } from './NPCBase.js';
import { LODManager } from '../World/LODManager.js';
import { events } from '../Core/EventBus.js';

export class NPCManager {
  constructor(scene, navGraph) {
    this.scene = scene;
    this.navGraph = navGraph;
    this.pedestrians = [];

    events.on('NPC_TRANSFORMED_TO_ZOMBIE', ({ entityId, entity }) => {
      this.removePedestrian(entityId || entity?.id);
    });
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

  removePedestrian(id) {
    if (!id) return;
    const idx = this.pedestrians.findIndex(p => p.id === id);
    if (idx !== -1) {
      const p = this.pedestrians[idx];
      p.destroy();
      this.pedestrians.splice(idx, 1);
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
