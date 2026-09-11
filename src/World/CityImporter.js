/**
 * Game FreeWorld - CityImporter (v5.0)
 * Geographic data importer connecting GeoJSON parsing with procedural fallback synthesis.
 */

import * as THREE from 'three';
import { GISDataParser } from './GISDataParser.js';

export class CityImporter {
  constructor(originLat = 37.7749, originLon = -122.4194) {
    this.parser = new GISDataParser({ lat: originLat, lon: originLon });
  }

  /**
   * Primary entry point: parse supplied GeoJSON dataset or trigger procedural fallback
   */
  importCity(geoJsonData = null) {
    const startTime = performance.now();

    if (geoJsonData) {
      try {
        const graph = this.parser.parseGeoJSON(geoJsonData);
        if (this.parser.validateGraph(graph) && graph.footprints.length > 0) {
          console.log(`[CityImporter] GIS GeoJSON parsed successfully in ${(performance.now() - startTime).toFixed(1)}ms. (${graph.footprints.length} building footprints, ${graph.nodes.length} road nodes)`);
          return {
            ...graph,
            isProceduralFallback: false
          };
        }
      } catch (err) {
        console.warn('[CityImporter] GeoJSON parsing error. Falling back to procedural city graph:', err.message);
      }
    }

    // Procedural Fallback Synthesis
    console.log('[CityImporter] Activating Procedural 3D City Graph Synthesis fallback...');
    const fallbackGraph = this.synthesizeProceduralGraph();
    console.log(`[CityImporter] Procedural city graph synthesized in ${(performance.now() - startTime).toFixed(1)}ms.`);
    return fallbackGraph;
  }

  /**
   * Synthesize a high-density 3D city graph fallback
   */
  synthesizeProceduralGraph(districtSize = 360, blockCount = 4) {
    const half = districtSize / 2;
    const blockSize = districtSize / blockCount;

    const graph = {
      nodes: [],
      edges: [],
      footprints: [],
      POIs: {
        bank_vault_alley: { id: 'poi_bank', type: 'bank', position: new THREE.Vector3(38, 0.5, 38) },
        armory_entrance: { id: 'poi_armory', type: 'armory', position: new THREE.Vector3(-42, 0.5, -42) },
        dealership_lot: { id: 'poi_dealership', type: 'dealership', position: new THREE.Vector3(42, 0.5, -42) },
        gas_station: { id: 'poi_gas', type: 'gas_station', position: new THREE.Vector3(-42, 0.5, 42) },
        safehouse_penthouse: { id: 'poi_safehouse', type: 'safehouse', position: new THREE.Vector3(0, 48, 0) },
        harbor_marina: { id: 'poi_harbor', type: 'harbor', position: new THREE.Vector3(-120, 0.5, 120) }
      },
      districts: [
        { name: 'Downtown Core', center: new THREE.Vector3(0, 0, 0) },
        { name: 'Financial District', center: new THREE.Vector3(90, 0, 90) },
        { name: 'Harbor District', center: new THREE.Vector3(-90, 0, 90) },
        { name: 'Heights Residential', center: new THREE.Vector3(-90, 0, -90) }
      ],
      isProceduralFallback: true
    };

    // 1. Generate Grid Nodes & Edges
    const gridMap = new Map();
    let nodeIdCounter = 0;

    for (let x = 0; x <= blockCount; x++) {
      for (let z = 0; z <= blockCount; z++) {
        const posX = -half + x * blockSize;
        const posZ = -half + z * blockSize;
        const nodeId = `node_${x}_${z}`;
        const node = {
          id: nodeId,
          position: new THREE.Vector3(posX, 0, posZ),
          gridX: x,
          gridZ: z
        };
        graph.nodes.push(node);
        gridMap.set(`${x}_${z}`, node);
      }
    }

    // Connect edges
    for (let x = 0; x <= blockCount; x++) {
      for (let z = 0; z <= blockCount; z++) {
        const curr = gridMap.get(`${x}_${z}`);
        if (x < blockCount) {
          const nextX = gridMap.get(`${x + 1}_${z}`);
          graph.edges.push({
            id: `edge_${curr.id}_${nextX.id}`,
            from: curr.id,
            to: nextX.id,
            fromPos: curr.position.clone(),
            toPos: nextX.position.clone(),
            highway: 'primary',
            lanes: 4
          });
        }
        if (z < blockCount) {
          const nextZ = gridMap.get(`${x}_${z + 1}`);
          graph.edges.push({
            id: `edge_${curr.id}_${nextZ.id}`,
            from: curr.id,
            to: nextZ.id,
            fromPos: curr.position.clone(),
            toPos: nextZ.position.clone(),
            highway: 'primary',
            lanes: 4
          });
        }
      }
    }

    // 2. Generate Building Footprints per City Block
    let bldgCounter = 0;
    for (let bx = 0; bx < blockCount; bx++) {
      for (let bz = 0; bz < blockCount; bz++) {
        const minX = -half + bx * blockSize + 12;
        const maxX = -half + (bx + 1) * blockSize - 12;
        const minZ = -half + bz * blockSize + 12;
        const maxZ = -half + (bz + 1) * blockSize - 12;

        const subDivs = 2;
        const w = (maxX - minX) / subDivs;
        const h = (maxZ - minZ) / subDivs;

        for (let sx = 0; sx < subDivs; sx++) {
          for (let sz = 0; sz < subDivs; sz++) {
            const centerX = minX + sx * w + w / 2;
            const centerZ = minZ + sz * h + h / 2;
            const center = new THREE.Vector3(centerX, 0, centerZ);

            const isDowntown = Math.abs(centerX) < 90 && Math.abs(centerZ) < 90;
            const levels = isDowntown ? Math.floor(Math.random() * 12) + 8 : Math.floor(Math.random() * 5) + 3;
            const height = levels * 4.0;

            const halfW = (w - 4) / 2;
            const halfH = (h - 4) / 2;
            const polygon = [
              new THREE.Vector3(centerX - halfW, 0, centerZ - halfH),
              new THREE.Vector3(centerX + halfW, 0, centerZ - halfH),
              new THREE.Vector3(centerX + halfW, 0, centerZ + halfH),
              new THREE.Vector3(centerX - halfW, 0, centerZ + halfH)
            ];

            graph.footprints.push({
              id: `bldg_proc_${bldgCounter++}`,
              type: isDowntown ? 'commercial' : 'residential',
              center,
              height,
              levels,
              polygon,
              tags: { district: isDowntown ? 'Downtown' : 'Suburbs' }
            });
          }
        }
      }
    }

    return graph;
  }

  /**
   * Export internal graph into valid GeoJSON FeatureCollection
   */
  exportToGeoJSON(graph) {
    const features = [];

    // Footprints -> Polygon features
    for (const f of graph.footprints) {
      const coords = f.polygon.map((p) => {
        const geo = this.parser.localToGeo(p.x, p.z);
        return [geo.lon, geo.lat];
      });
      if (coords.length > 0) {
        coords.push(coords[0]); // Close polygon loop
        features.push({
          type: 'Feature',
          properties: {
            id: f.id,
            building: f.type,
            height: f.height,
            levels: f.levels,
            ...f.tags
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coords]
          }
        });
      }
    }

    // Edges -> LineString features
    for (const e of graph.edges) {
      const gFrom = this.parser.localToGeo(e.fromPos.x, e.fromPos.z);
      const gTo = this.parser.localToGeo(e.toPos.x, e.toPos.z);
      features.push({
        type: 'Feature',
        properties: {
          id: e.id,
          highway: e.highway,
          lanes: e.lanes
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [gFrom.lon, gFrom.lat],
            [gTo.lon, gTo.lat]
          ]
        }
      });
    }

    return {
      type: 'FeatureCollection',
      features
    };
  }
}
