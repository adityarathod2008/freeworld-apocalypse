/**
 * Game FreeWorld - SectorManager (v5.0)
 * Spatial partition grid (60m x 60m sectors) managing sector streaming, LOD hierarchy, entity culling, and simulation bounds.
 */
import * as THREE from 'three';
import { LODManager } from './LODManager.js';
import { events } from '../Core/EventBus.js';

export class SectorManager {
  constructor(sectorSpan = 60, gridSize = 16) {
    this.sectorSpan = sectorSpan; // 60m x 60m sectors per spec
    this.gridSize = gridSize;     // 16x16 grid = 960m x 960m default coverage
    this.sectors = new Map();
    this.entitySectorMap = new Map();
    this.activePlayerSector = null;

    this.initSectors();
  }

  initSectors() {
    const minGrid = -Math.floor(this.gridSize / 2);
    const maxGrid = Math.floor(this.gridSize / 2);

    for (let x = minGrid; x < maxGrid; x++) {
      for (let z = minGrid; z < maxGrid; z++) {
        this.getSector(x, z);
      }
    }
  }

  getSectorCoords(pos) {
    if (!pos) return { sectorX: 0, sectorZ: 0 };
    const x = Math.floor(pos.x / this.sectorSpan);
    const z = Math.floor(pos.z / this.sectorSpan);
    return { sectorX: x, sectorZ: z };
  }

  getSectorKey(sectorX, sectorZ) {
    return `${sectorX}_${sectorZ}`;
  }

  getSector(sectorX, sectorZ) {
    const key = typeof sectorX === 'string' ? sectorX : this.getSectorKey(sectorX, sectorZ);
    if (!this.sectors.has(key)) {
      const sx = typeof sectorX === 'number' ? sectorX : parseInt(key.split('_')[0], 10);
      const sz = typeof sectorZ === 'number' ? sectorZ : parseInt(key.split('_')[1], 10);
      const minX = sx * this.sectorSpan;
      const minZ = sz * this.sectorSpan;
      this.sectors.set(key, {
        id: key,
        sectorX: sx,
        sectorZ: sz,
        bounds: new THREE.Box2(
          new THREE.Vector2(minX, minZ),
          new THREE.Vector2(minX + this.sectorSpan, minZ + this.sectorSpan)
        ),
        center: new THREE.Vector3(minX + this.sectorSpan / 2, 0, minZ + this.sectorSpan / 2),
        entities: new Set(),
        lodTier: 'UNLOADED'
      });
    }
    return this.sectors.get(key);
  }

  getSectorForPosition(pos) {
    const { sectorX, sectorZ } = this.getSectorCoords(pos);
    return this.getSector(sectorX, sectorZ);
  }

  registerEntity(entity, id) {
    const entityId = id || entity.id || entity._id || Math.random().toString(36).substring(2, 9);
    entity._sectorEntityId = entityId;
    this.updateEntitySector(entity);
  }

  unregisterEntity(entity) {
    const entityId = entity._sectorEntityId;
    if (!entityId) return;

    const currentKey = this.entitySectorMap.get(entityId);
    if (currentKey && this.sectors.has(currentKey)) {
      this.sectors.get(currentKey).entities.delete(entity);
    }
    this.entitySectorMap.delete(entityId);
  }

  updateEntitySector(entity) {
    const pos = entity.position || (entity.mesh && entity.mesh.position);
    if (!pos) return;

    const entityId = entity._sectorEntityId || Math.random().toString(36).substring(2, 9);
    entity._sectorEntityId = entityId;

    const newSector = this.getSectorForPosition(pos);
    const oldKey = this.entitySectorMap.get(entityId);

    if (oldKey !== newSector.id) {
      if (oldKey && this.sectors.has(oldKey)) {
        this.sectors.get(oldKey).entities.delete(entity);
      }
      newSector.entities.add(entity);
      this.entitySectorMap.set(entityId, newSector.id);

      events.emit('SECTOR_ENTITY_TRANSITION', {
        entityId,
        oldSector: oldKey,
        newSector: newSector.id,
        lodTier: newSector.lodTier
      });
    }
  }

  update(playerPosition) {
    if (!playerPosition) return;

    const playerSec = this.getSectorForPosition(playerPosition);
    const playerSecKey = playerSec.id;

    if (this.activePlayerSector !== playerSecKey) {
      const oldPlayerSec = this.activePlayerSector;
      this.activePlayerSector = playerSecKey;
      events.emit('PLAYER_SECTOR_CHANGED', {
        oldSector: oldPlayerSec,
        newSector: playerSecKey,
        coords: { sectorX: playerSec.sectorX, sectorZ: playerSec.sectorZ }
      });
    }

    for (const [key, sector] of this.sectors.entries()) {
      const dist = sector.center.distanceTo(playerPosition);
      const oldTier = sector.lodTier;

      if (dist < LODManager.NEAR_DIST) {
        sector.lodTier = 'NEAR';
      } else if (dist < LODManager.MID_DIST) {
        sector.lodTier = 'MID';
      } else if (dist < LODManager.FAR_DIST) {
        sector.lodTier = 'FAR';
      } else {
        sector.lodTier = 'UNLOADED';
      }

      if (oldTier !== sector.lodTier) {
        events.emit('SECTOR_LOD_CHANGED', {
          sectorId: key,
          oldTier,
          newTier: sector.lodTier
        });
      }

      const isVisible = sector.lodTier !== 'UNLOADED';
      for (const entity of sector.entities) {
        if (entity.mesh) {
          entity.mesh.visible = isVisible;
        } else if (entity.model && entity.model.root) {
          entity.model.root.visible = isVisible;
        }
      }
    }
  }

  getEntitiesInRadius(pos, radius) {
    const results = [];
    const radSq = radius * radius;
    const minCoords = this.getSectorCoords({ x: pos.x - radius, z: pos.z - radius });
    const maxCoords = this.getSectorCoords({ x: pos.x + radius, z: pos.z + radius });

    for (let sx = minCoords.sectorX; sx <= maxCoords.sectorX; sx++) {
      for (let sz = minCoords.sectorZ; sz <= maxCoords.sectorZ; sz++) {
        const sector = this.getSector(sx, sz);
        for (const entity of sector.entities) {
          const ePos = entity.position || (entity.mesh && entity.mesh.position);
          if (ePos && pos.distanceToSquared(ePos) <= radSq) {
            results.push(entity);
          }
        }
      }
    }
    return results;
  }

  toJSON() {
    const sectorsState = [];
    for (const [key, sector] of this.sectors.entries()) {
      if (sector.entities.size > 0 || sector.lodTier !== 'UNLOADED') {
        sectorsState.push({
          sectorX: sector.sectorX,
          sectorZ: sector.sectorZ,
          lodTier: sector.lodTier,
          entityCount: sector.entities.size
        });
      }
    }
    return {
      sectorSpan: this.sectorSpan,
      activePlayerSector: this.activePlayerSector,
      sectors: sectorsState
    };
  }

  fromJSON(data) {
    if (!data) return;
    if (data.sectorSpan) this.sectorSpan = data.sectorSpan;
    if (data.activePlayerSector) this.activePlayerSector = data.activePlayerSector;
    if (Array.isArray(data.sectors)) {
      for (const s of data.sectors) {
        const sector = this.getSector(s.sectorX, s.sectorZ);
        if (sector) {
          sector.lodTier = s.lodTier || 'UNLOADED';
        }
      }
    }
  }
}

