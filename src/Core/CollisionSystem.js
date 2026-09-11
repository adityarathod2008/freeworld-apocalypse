/**
 * Game FreeWorld - CollisionSystem
 * High-performance spatial hash grid with layer bitmasks, swept continuous collision
 * detection (CCD) against high-speed tunnelling, and spawn validation.
 */
import * as THREE from 'three';

export const COLLISION_LAYERS = {
  NONE: 0,
  WORLD: 1 << 0,       // 1: Curbs, roads, barriers
  BUILDING: 1 << 1,    // 2: Skyscrapers, building walls, structures
  VEHICLE: 1 << 2,     // 4: Player drivable vehicle
  TRAFFIC: 1 << 3,     // 8: Civilian AI traffic cars
  POLICE: 1 << 4,      // 16: Police cruisers
  NPC: 1 << 5,         // 32: Pedestrians
  PLAYER: 1 << 6,      // 64: Player on foot
  PROJECTILE: 1 << 7,  // 128: Bullets, rockets, projectiles
  ALL: 0xFFFF
};

export class CollisionSystem {
  static instance = null;

  constructor(cellSize = 20) {
    if (CollisionSystem.instance) return CollisionSystem.instance;
    CollisionSystem.instance = this;

    this.cellSize = cellSize;
    this.grid = new Map(); // key -> Set of collider objects
    this.colliders = new Map(); // id -> collider object
    this.nextId = 1;
  }

  static get() {
    if (!CollisionSystem.instance) new CollisionSystem();
    return CollisionSystem.instance;
  }

  _getCellKey(cx, cz) {
    return `${cx}_${cz}`;
  }

  _getCellsForBox(box) {
    const minCx = Math.floor(box.min.x / this.cellSize);
    const maxCx = Math.floor(box.max.x / this.cellSize);
    const minCz = Math.floor(box.min.z / this.cellSize);
    const maxCz = Math.floor(box.max.z / this.cellSize);

    const keys = [];
    for (let x = minCx; x <= maxCx; x++) {
      for (let z = minCz; z <= maxCz; z++) {
        keys.push(this._getCellKey(x, z));
      }
    }
    return keys;
  }

  registerCollider(config) {
    const id = config.id || this.nextId++;
    const collider = {
      id,
      box: config.box instanceof THREE.Box3 ? config.box.clone() : new THREE.Box3(),
      layer: config.layer !== undefined ? config.layer : COLLISION_LAYERS.BUILDING,
      type: config.type || 'static', // 'static' | 'dynamic'
      owner: config.owner || null,
      userData: config.userData || {},
      cells: []
    };

    if (config.min && config.max) {
      collider.box.set(config.min, config.max);
    } else if (config.center && config.size) {
      collider.box.setFromCenterAndSize(config.center, config.size);
    }

    collider.cells = this._getCellsForBox(collider.box);
    for (const key of collider.cells) {
      if (!this.grid.has(key)) {
        this.grid.set(key, new Set());
      }
      this.grid.get(key).add(collider);
    }

    this.colliders.set(id, collider);
    return collider;
  }

  unregisterCollider(id) {
    const collider = this.colliders.get(id);
    if (!collider) return;

    for (const key of collider.cells) {
      const cell = this.grid.get(key);
      if (cell) {
        cell.delete(collider);
        if (cell.size === 0) this.grid.delete(key);
      }
    }

    this.colliders.delete(id);
  }

  updateDynamicCollider(collider, newBox) {
    collider.box.copy(newBox);
    const newCells = this._getCellsForBox(collider.box);

    // Remove from old cells not in new cells
    for (const oldKey of collider.cells) {
      if (!newCells.includes(oldKey)) {
        const cell = this.grid.get(oldKey);
        if (cell) {
          cell.delete(collider);
          if (cell.size === 0) this.grid.delete(oldKey);
        }
      }
    }

    // Add to new cells not in old cells
    for (const newKey of newCells) {
      if (!collider.cells.includes(newKey)) {
        if (!this.grid.has(newKey)) {
          this.grid.set(newKey, new Set());
        }
        this.grid.get(newKey).add(collider);
      }
    }

    collider.cells = newCells;
  }

  queryBox(testBox, mask = COLLISION_LAYERS.ALL, ignoreOwner = null) {
    const candidates = new Set();
    const cells = this._getCellsForBox(testBox);

    for (const key of cells) {
      const cell = this.grid.get(key);
      if (cell) {
        for (const col of cell) {
          if (ignoreOwner && col.owner === ignoreOwner) continue;
          if ((col.layer & mask) !== 0) {
            candidates.add(col);
          }
        }
      }
    }

    const hits = [];
    for (const col of candidates) {
      if (testBox.intersectsBox(col.box)) {
        hits.push(col);
      }
    }
    return hits;
  }

  /**
   * Continuous Swept Box Test for fast vehicles & projectiles
   * Checks motion from startPos to endPos with box dimensions
   */
  sweptBoxTest(startPos, endPos, halfExtents, mask = COLLISION_LAYERS.BUILDING, ignoreOwner = null) {
    const sweepMin = new THREE.Vector3(
      Math.min(startPos.x, endPos.x) - halfExtents.x,
      Math.min(startPos.y, endPos.y) - halfExtents.y,
      Math.min(startPos.z, endPos.z) - halfExtents.z
    );
    const sweepMax = new THREE.Vector3(
      Math.max(startPos.x, endPos.x) + halfExtents.x,
      Math.max(startPos.y, endPos.y) + halfExtents.y,
      Math.max(startPos.z, endPos.z) + halfExtents.z
    );
    const sweepBroadBox = new THREE.Box3(sweepMin, sweepMax);

    const candidates = this.queryBox(sweepBroadBox, mask, ignoreOwner);
    if (candidates.length === 0) {
      return { hasHit: false, fraction: 1.0, hitPoint: endPos.clone(), normal: new THREE.Vector3() };
    }

    // Perform fine swept test using ray along motion vector with expanded target boxes (Minkowski sum)
    const moveVec = new THREE.Vector3().subVectors(endPos, startPos);
    const totalDist = moveVec.length();
    if (totalDist < 0.0001) {
      return { hasHit: false, fraction: 1.0, hitPoint: endPos.clone(), normal: new THREE.Vector3() };
    }

    const dir = moveVec.clone().normalize();
    const ray = new THREE.Ray(startPos, dir);

    let earliestFraction = 1.0;
    let hitCollider = null;
    let hitNormal = new THREE.Vector3(0, 1, 0);
    let hitPoint = endPos.clone();

    for (const col of candidates) {
      // Expand obstacle box by halfExtents
      const expandedBox = new THREE.Box3(
        new THREE.Vector3().subVectors(col.box.min, halfExtents),
        new THREE.Vector3().addVectors(col.box.max, halfExtents)
      );

      const intersectionPoint = new THREE.Vector3();
      if (ray.intersectBox(expandedBox, intersectionPoint)) {
        const dist = startPos.distanceTo(intersectionPoint);
        const fraction = dist / totalDist;

        if (fraction >= 0 && fraction < earliestFraction) {
          earliestFraction = fraction;
          hitCollider = col;
          hitPoint.copy(intersectionPoint);

          // Calculate approximate contact surface normal
          const center = new THREE.Vector3();
          expandedBox.getCenter(center);
          const offset = new THREE.Vector3().subVectors(intersectionPoint, center);
          const size = new THREE.Vector3();
          expandedBox.getSize(size);

          const nx = Math.abs(offset.x) / (size.x * 0.5);
          const ny = Math.abs(offset.y) / (size.y * 0.5);
          const nz = Math.abs(offset.z) / (size.z * 0.5);

          if (nx > ny && nx > nz) {
            hitNormal.set(Math.sign(offset.x), 0, 0);
          } else if (nz > nx && nz > ny) {
            hitNormal.set(0, 0, Math.sign(offset.z));
          } else {
            hitNormal.set(0, Math.sign(offset.y), 0);
          }
        }
      }
    }

    return {
      hasHit: earliestFraction < 1.0,
      fraction: earliestFraction,
      hitPoint,
      normal: hitNormal,
      collider: hitCollider
    };
  }

  /**
   * Validate spawn position ensuring clearance from buildings & obstacles
   */
  validateSpawn(position, radius = 2.5, mask = COLLISION_LAYERS.BUILDING | COLLISION_LAYERS.WORLD) {
    const testBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(position.x, position.y + 1.0, position.z),
      new THREE.Vector3(radius * 2, 2.0, radius * 2)
    );

    const hits = this.queryBox(testBox, mask);
    if (hits.length === 0) {
      return { valid: true, position: position.clone() };
    }

    // If obstructed, search radial offsets in 8 directions to find clear road spot
    for (let dist = 4; dist <= 24; dist += 4) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const candidate = new THREE.Vector3(
          position.x + Math.cos(angle) * dist,
          position.y,
          position.z + Math.sin(angle) * dist
        );
        const candBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(candidate.x, candidate.y + 1.0, candidate.z),
          new THREE.Vector3(radius * 2, 2.0, radius * 2)
        );
        if (this.queryBox(candBox, mask).length === 0) {
          return { valid: true, position: candidate };
        }
      }
    }

    return { valid: false, position: position.clone() };
  }

  getAllColliders() {
    return Array.from(this.colliders.values());
  }
}

export const collision = new CollisionSystem();
