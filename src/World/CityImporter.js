/**
 * Game FreeWorld - CityImporter (v5.0)
 * Master orchestrator synthesizing geographic data (GeoJSON, OSM JSON) into production
 * 3D city graphs, connecting specialized importers (Road, Building, POI, Transit, District),
 * spatial sector streaming (SectorManager), and procedural fallback synthesis.
 */

import * as THREE from 'three';
import { GISDataParser } from './GISDataParser.js';
import { RoadImporter } from './RoadImporter.js';
import { BuildingImporter } from './BuildingImporter.js';
import { POIImporter } from './POIImporter.js';
import { TransitImporter } from './TransitImporter.js';
import { DistrictImporter } from './DistrictImporter.js';

export class CityImporter {
  constructor(originLat = 37.7749, originLon = -122.4194) {
    this.parser = new GISDataParser({ lat: originLat, lon: originLon });
    this.transformer = this.parser.transformer;

    this.roadImporter = new RoadImporter(this.transformer);
    this.buildingImporter = new BuildingImporter(this.transformer);
    this.poiImporter = new POIImporter(this.transformer);
    this.transitImporter = new TransitImporter(this.transformer);
    this.districtImporter = new DistrictImporter(this.transformer);
  }

  /**
   * Primary import pipeline: parse input GIS dataset or generate high-fidelity procedural fallback
   * @param {Object} [gisData=null] - GeoJSON or OSM JSON dataset
   * @param {Object} [sectorManager=null] - SectorManager instance for spatial streaming partitioning
   * @returns {Object} Complete imported city dataset
   */
  importCity(gisData = null, sectorManager = null) {
    const startTime = performance.now();
    let rawGraph = null;
    let isProceduralFallback = false;

    if (gisData) {
      try {
        rawGraph = this.parser.parse(gisData);
        if (this.parser.validateGraph(rawGraph) && (rawGraph.footprints.length > 0 || rawGraph.edges.length > 0)) {
          console.log(`[CityImporter] GIS dataset parsed successfully in ${(performance.now() - startTime).toFixed(1)}ms. (${rawGraph.footprints.length} building footprints, ${rawGraph.nodes.length} road nodes)`);
        } else {
          console.warn('[CityImporter] GIS graph validation incomplete. Activating procedural fallback...');
          isProceduralFallback = true;
        }
      } catch (err) {
        console.warn('[CityImporter] GIS parsing error. Activating procedural city fallback:', err.message);
        isProceduralFallback = true;
      }
    } else {
      isProceduralFallback = true;
    }

    if (isProceduralFallback) {
      console.log('[CityImporter] Generating high-density procedural city fallback graph...');
      rawGraph = this.synthesizeProceduralGraph();
    }

    // Process through specialized importers
    const roadNetwork = this.roadImporter.processRoadNetwork(rawGraph.nodes, rawGraph.edges);
    const buildings = this.buildingImporter.processBuildingFootprints(rawGraph.footprints);
    const poiData = this.poiImporter.processPOIs(rawGraph.POIs);
    const transitData = this.transitImporter.processTransitData(rawGraph.transitStations, rawGraph.transitRoutes);
    const districts = this.districtImporter.processDistricts(rawGraph.districts);

    const importedCity = {
      rawGraph,
      roadNetwork,
      buildings,
      pois: poiData.poiMap,
      poiList: poiData.poiList,
      landmarks: poiData.landmarks,
      transitStations: transitData.stations,
      transitRoutes: transitData.routes,
      districts,
      isProceduralFallback,
      elapsedMs: performance.now() - startTime
    };

    // Partition into SectorManager if available
    if (sectorManager) {
      this.partitionIntoSectors(importedCity, sectorManager);
    }

    return importedCity;
  }

  /**
   * Partition imported city elements into SectorManager 60m x 60m sectors
   */
  partitionIntoSectors(cityData, sectorManager) {
    let count = 0;

    // Register buildings
    cityData.buildings.forEach(bldg => {
      const entity = {
        id: bldg.id,
        position: bldg.center,
        type: 'BUILDING',
        building: bldg
      };
      sectorManager.registerEntity(entity, bldg.id);
      count++;
    });

    // Register POIs
    cityData.poiList.forEach(poi => {
      const entity = {
        id: poi.id,
        position: poi.position,
        type: 'POI',
        poi
      };
      sectorManager.registerEntity(entity, poi.id);
      count++;
    });

    // Register Transit Stations
    cityData.transitStations.forEach(st => {
      const entity = {
        id: st.id,
        position: st.position,
        type: 'TRANSIT_STATION',
        station: st
      };
      sectorManager.registerEntity(entity, st.id);
      count++;
    });

    console.log(`[CityImporter] Partitioned ${count} GIS entities into SectorManager grid.`);
  }

  /**
   * Synthesize a high-density procedural fallback city graph
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
        { id: 'dist_downtown', name: 'Downtown Core', center: new THREE.Vector3(0, 0, 0), polygon: [new THREE.Vector3(-180,0,-180), new THREE.Vector3(180,0,-180), new THREE.Vector3(180,0,180), new THREE.Vector3(-180,0,180)] },
        { id: 'dist_financial', name: 'Financial District', center: new THREE.Vector3(90, 0, 90), polygon: [new THREE.Vector3(0,0,0), new THREE.Vector3(180,0,0), new THREE.Vector3(180,0,180), new THREE.Vector3(0,0,180)] }
      ],
      transitStations: [
        { id: 'st_central', name: 'Central Terminal', type: 'subway_station', position: new THREE.Vector3(0, 0, 0) },
        { id: 'st_harbor', name: 'Harbor Station', type: 'bus_station', position: new THREE.Vector3(-120, 0, 120) }
      ],
      transitRoutes: [
        { id: 'rt_line1', name: 'Metro Line 1', type: 'subway_line', path: [new THREE.Vector3(-120, -5, 120), new THREE.Vector3(0, -5, 0), new THREE.Vector3(120, -5, -120)] }
      ],
      isProceduralFallback: true
    };

    // 1. Grid Nodes & Edges
    const gridMap = new Map();
    for (let x = 0; x <= blockCount; x++) {
      for (let z = 0; z <= blockCount; z++) {
        const posX = -half + x * blockSize;
        const posZ = -half + z * blockSize;
        const nodeId = `node_${x}_${z}`;
        const node = { id: nodeId, position: new THREE.Vector3(posX, 0, posZ), gridX: x, gridZ: z };
        graph.nodes.push(node);
        gridMap.set(`${x}_${z}`, node);
      }
    }

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

    // 2. Building Footprints
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
}
