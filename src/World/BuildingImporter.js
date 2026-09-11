/**
 * Game FreeWorld - BuildingImporter (v5.0)
 * Imports, classifies, extrudes, and manages 3D building geometry, heights, levels,
 * landmarks, and state hooks from GIS footprint polygons.
 */

import * as THREE from 'three';
import { BuildingStateEngine, BUILDING_STATES } from './BuildingStateEngine.js';
import { InteriorGenerator } from './InteriorGenerator.js';

export class BuildingImporter {
  constructor(coordinateTransformer, scene = null) {
    this.transformer = coordinateTransformer;
    this.scene = scene;
    this.interiorGenerator = new InteriorGenerator(scene);
  }

  /**
   * Process raw GIS footprints into rich 3D building instances
   */
  processBuildingFootprints(rawFootprints) {
    const buildings = [];

    rawFootprints.forEach((footprint, idx) => {
      const polygon = footprint.polygon;
      if (!polygon || polygon.length < 3) return;

      // 1. Calculate Center and Bounding Box
      const center = new THREE.Vector3();
      const minPoint = new THREE.Vector3(Infinity, Infinity, Infinity);
      const maxPoint = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

      polygon.forEach(pt => {
        center.add(pt);
        minPoint.min(pt);
        maxPoint.max(pt);
      });
      center.divideScalar(polygon.length);

      const sizeX = maxPoint.x - minPoint.x;
      const sizeZ = maxPoint.z - minPoint.z;

      // 2. Determine Building Properties
      const tags = footprint.tags || {};
      const levels = footprint.levels || this._inferLevels(footprint.type, sizeX * sizeZ);
      const height = footprint.height || levels * 3.8;

      const isLandmark = this._isLandmarkBuilding(footprint.type, tags);
      const buildingType = footprint.type || 'commercial';
      const buildingId = footprint.id || `bldg_gis_${idx}`;

      const initialState = isLandmark ? BUILDING_STATES.SAFEHOUSE : BUILDING_STATES.NORMAL;
      const stateEngine = new BuildingStateEngine(buildingId, initialState);

      const building = {
        id: buildingId,
        type: buildingType,
        isLandmark,
        center: center.clone(),
        height,
        levels,
        sizeX,
        sizeZ,
        boundingBox: new THREE.Box3(minPoint, new THREE.Vector3(maxPoint.x, height, maxPoint.z)),
        polygon: polygon.map(p => p.clone()),
        tags,

        // Authoritative State Engine and Interior Generator
        stateEngine,
        state: initialState,
        health: stateEngine.health,
        powerGridConnected: stateEngine.powerConnected
      };

      // Generate Interior Hierarchy
      building.interior = this.interiorGenerator.generateInterior(building);

      buildings.push(building);
    });

    return buildings;
  }

  /**
   * Extrude Three.js Mesh for a building footprint
   */
  createBuildingMesh(building, material) {
    const shape = new THREE.Shape();
    const poly = building.polygon;

    if (poly.length < 3) return null;

    shape.moveTo(poly[0].x - building.center.x, poly[0].z - building.center.z);
    for (let i = 1; i < poly.length; i++) {
      shape.lineTo(poly[i].x - building.center.x, poly[i].z - building.center.z);
    }

    const extrudeSettings = {
      steps: 1,
      depth: building.height,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.2,
      bevelSegments: 1
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(-Math.PI / 2); // Orient upright along Y axis

    const meshMaterial = material || new THREE.MeshLambertMaterial({
      color: building.isLandmark ? 0xd4af37 : (building.type === 'commercial' ? 0x4a6572 : 0x34495e)
    });

    const mesh = new THREE.Mesh(geometry, meshMaterial);
    mesh.position.set(building.center.x, 0, building.center.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = building.id;
    mesh.userData = { buildingId: building.id, building };

    return mesh;
  }

  _inferLevels(type, areaSquareMeters) {
    if (type === 'skyscraper' || type === 'office') return Math.floor(Math.random() * 15) + 10;
    if (type === 'residential' || type === 'apartments') return Math.floor(Math.random() * 5) + 2;
    if (type === 'industrial' || type === 'warehouse') return Math.floor(Math.random() * 2) + 1;
    return Math.floor(Math.random() * 6) + 3;
  }

  _isLandmarkBuilding(type, tags) {
    if (type === 'landmark' || type === 'monument' || type === 'cathedral' || type === 'stadium' || type === 'cityhall') {
      return true;
    }
    if (tags && (tags.historic || tags.tourism === 'attraction' || tags.landmark === 'yes')) {
      return true;
    }
    return false;
  }
}
