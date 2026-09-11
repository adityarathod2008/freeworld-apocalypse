/**
 * Game FreeWorld - Sectors
 * Spatial partitioning grid for fast range queries, visibility, and distance culling
 */
export class SpatialGrid {
  constructor(cellSize = 40) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  getKey(x, z) {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cz}`;
  }

  insert(entity) {
    const pos = entity.position || (entity.mesh && entity.mesh.position);
    if (!pos) return;
    const key = this.getKey(pos.x, pos.z);
    if (!this.cells.has(key)) {
      this.cells.set(key, new Set());
    }
    this.cells.get(key).add(entity);
    entity._spatialKey = key;
  }

  remove(entity) {
    if (entity._spatialKey && this.cells.has(entity._spatialKey)) {
      this.cells.get(entity._spatialKey).delete(entity);
    }
  }

  update(entity) {
    const pos = entity.position || (entity.mesh && entity.mesh.position);
    if (!pos) return;
    const newKey = this.getKey(pos.x, pos.z);
    if (newKey !== entity._spatialKey) {
      this.remove(entity);
      this.insert(entity);
    }
  }

  queryRadius(x, z, radius) {
    const results = [];
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minZ = Math.floor((z - radius) / this.cellSize);
    const maxZ = Math.floor((z + radius) / this.cellSize);

    const radSq = radius * radius;

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cz = minZ; cz <= maxZ; cz++) {
        const key = `${cx},${cz}`;
        if (this.cells.has(key)) {
          for (const item of this.cells.get(key)) {
            const pos = item.position || (item.mesh && item.mesh.position);
            if (pos) {
              const dx = pos.x - x;
              const dz = pos.z - z;
              if (dx * dx + dz * dz <= radSq) {
                results.push(item);
              }
            }
          }
        }
      }
    }
    return results;
  }
}
