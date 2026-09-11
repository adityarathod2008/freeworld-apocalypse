/**
 * Game FreeWorld - GIS Pipeline Comprehensive Verification Suite
 * Tests CoordinateTransformer, GISDataValidator, GISDataParser, CityImporter,
 * RoadImporter, BuildingImporter, POIImporter, TransitImporter, DistrictImporter,
 * and SectorManager spatial partitioning.
 */

import { CoordinateTransformer } from '../src/World/CoordinateTransformer.js';
import { GISDataValidator } from '../src/World/GISDataValidator.js';
import { GISDataParser } from '../src/World/GISDataParser.js';
import { CityImporter } from '../src/World/CityImporter.js';
import { RoadImporter } from '../src/World/RoadImporter.js';
import { BuildingImporter } from '../src/World/BuildingImporter.js';
import { POIImporter } from '../src/World/POIImporter.js';
import { TransitImporter } from '../src/World/TransitImporter.js';
import { DistrictImporter } from '../src/World/DistrictImporter.js';
import { SectorManager } from '../src/World/SectorManager.js';
import { NavigationGraph } from '../src/World/NavigationGraph.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Test Assertion Failed: ${message}`);
  }
}

console.log('=== FREEWORLD PHASE 2 GIS CITY PIPELINE TEST SUITE ===\n');

// ----------------------------------------------------
// TEST 1: CoordinateTransformer
// ----------------------------------------------------
console.log('[Test 1] CoordinateTransformer');
const transformer = new CoordinateTransformer({ lat: 37.7749, lon: -122.4194, alt: 10 });
const localPos = transformer.geoToLocal(37.7750, -122.4190, 15);
assert(typeof localPos.x === 'number' && typeof localPos.z === 'number', 'geoToLocal returns valid 3D coordinates');

const reverseGeo = transformer.localToGeo(localPos.x, localPos.z, localPos.y);
assert(Math.abs(reverseGeo.lat - 37.7750) < 0.0001, 'Latitude round-trip conversion accurate');
assert(Math.abs(reverseGeo.lon - (-122.4190)) < 0.0001, 'Longitude round-trip conversion accurate');
assert(Math.abs(reverseGeo.alt - 15) < 0.001, 'Altitude conversion accurate');

const dist = transformer.haversineDistance(37.7749, -122.4194, 37.7759, -122.4194);
assert(dist > 100 && dist < 120, 'Haversine distance calculation within expected bounds');

// ----------------------------------------------------
// TEST 2: GISDataValidator
// ----------------------------------------------------
console.log('\n[Test 2] GISDataValidator');
const sampleGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { building: 'commercial', levels: 12, name: 'Apex Tower' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.4194, 37.7749],
          [-122.4190, 37.7749],
          [-122.4190, 37.7753],
          [-122.4194, 37.7753],
          [-122.4194, 37.7749]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { highway: 'primary', lanes: 4 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-122.4200, 37.7749],
          [-122.4180, 37.7749]
        ]
      }
    },
    {
      type: 'Feature',
      properties: { amenity: 'bank', name: 'Fleeca Central Bank' },
      geometry: {
        type: 'Point',
        coordinates: [-122.4192, 37.7751]
      }
    },
    {
      type: 'Feature',
      properties: { boundary: 'administrative', name: 'Downtown District' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.4210, 37.7730],
          [-122.4170, 37.7730],
          [-122.4170, 37.7770],
          [-122.4210, 37.7770],
          [-122.4210, 37.7730]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { transit: 'station', name: 'Union Square Metro', railway: 'station' },
      geometry: {
        type: 'Point',
        coordinates: [-122.4195, 37.7752]
      }
    }
  ]
};

const geoVal = GISDataValidator.validateGeoJSON(sampleGeoJSON);
assert(geoVal.valid === true, 'Sample GeoJSON validation passes');

const invalidVal = GISDataValidator.validateGeoJSON({ type: 'InvalidType' });
assert(invalidVal.valid === false, 'Invalid GeoJSON caught by validator');

// ----------------------------------------------------
// TEST 3: GISDataParser
// ----------------------------------------------------
console.log('\n[Test 3] GISDataParser');
const parser = new GISDataParser({ lat: 37.7749, lon: -122.4194 });
const parsedGraph = parser.parse(sampleGeoJSON);
assert(parsedGraph.footprints.length === 1, 'Extracted 1 building footprint from GeoJSON');
assert(parsedGraph.edges.length === 1, 'Extracted 1 road edge from GeoJSON');
assert(parsedGraph.districts.length === 1, 'Extracted 1 district boundary from GeoJSON');
assert(parsedGraph.transitStations.length === 1, 'Extracted 1 transit station from GeoJSON');
assert(Object.keys(parsedGraph.POIs).length === 1, 'Extracted 1 POI from GeoJSON');

// ----------------------------------------------------
// TEST 4: Specialized Importers
// ----------------------------------------------------
console.log('\n[Test 4] Specialized Importers (Road, Building, POI, Transit, District)');
const roadImporter = new RoadImporter(parser.transformer);
const roadNetwork = roadImporter.processRoadNetwork(parsedGraph.nodes, parsedGraph.edges);
assert(roadNetwork.edges.length === 1, 'RoadImporter processed road network edge');
assert(roadNetwork.edges[0].lanes === 4, 'RoadImporter extracted 4 lanes property');

const navGraph = new NavigationGraph();
roadImporter.populateNavigationGraph(navGraph, roadNetwork);
assert(navGraph.roadNodes.length >= 2, 'NavigationGraph successfully populated from GIS road network');

const bldgImporter = new BuildingImporter(parser.transformer);
const buildings = bldgImporter.processBuildingFootprints(parsedGraph.footprints);
assert(buildings.length === 1, 'BuildingImporter processed building footprint');
assert(buildings[0].levels === 12, 'BuildingImporter extracted building levels correctly');
assert(buildings[0].height > 40, 'BuildingImporter computed extruded height correctly');

const poiImporter = new POIImporter(parser.transformer);
const poiData = poiImporter.processPOIs(parsedGraph.POIs);
assert(poiData.count === 1, 'POIImporter processed POI list');
assert(poiData.poiList[0].type === 'bank', 'POIImporter categorized POI type as bank');

const transitImporter = new TransitImporter(parser.transformer);
const transitData = transitImporter.processTransitData(parsedGraph.transitStations, parsedGraph.transitRoutes);
assert(transitData.stationCount === 1, 'TransitImporter processed transit stations');
assert(transitData.stations[0].type === 'subway_station', 'TransitImporter recognized subway station');

const districtImporter = new DistrictImporter(parser.transformer);
const districts = districtImporter.processDistricts(parsedGraph.districts);
assert(districts.length === 1, 'DistrictImporter processed district polygon');
assert(districts[0].name === 'Downtown District', 'DistrictImporter extracted district name');
const ptInside = districts[0].containsPoint(districts[0].center);
assert(ptInside === true, 'DistrictImporter point-in-polygon containment test works');

// ----------------------------------------------------
// TEST 5: CityImporter & SectorManager Integration
// ----------------------------------------------------
console.log('\n[Test 5] CityImporter & SectorManager Integration');
const cityImporter = new CityImporter(37.7749, -122.4194);
const sectorManager = new SectorManager(60, 16);
const importedCity = cityImporter.importCity(sampleGeoJSON, sectorManager);

assert(importedCity.isProceduralFallback === false, 'Imported city correctly identified non-procedural source');
assert(importedCity.buildings.length === 1, 'Imported city contains parsed building');
assert(importedCity.roadNetwork.edges.length === 1, 'Imported city contains road network');

// Verify sector partitioning
let totalSectorEntities = 0;
for (const [key, sector] of sectorManager.sectors.entries()) {
  totalSectorEntities += sector.entities.size;
}
assert(totalSectorEntities > 0, 'CityImporter successfully partitioned GIS entities into SectorManager grid');

// ----------------------------------------------------
// TEST 6: Procedural Fallback Verification
// ----------------------------------------------------
console.log('\n[Test 6] Procedural Fallback Verification');
const fallbackCity = cityImporter.importCity(null, sectorManager);
assert(fallbackCity.isProceduralFallback === true, 'Procedural fallback activates seamlessly when gisData is null');
assert(fallbackCity.buildings.length > 0, 'Procedural fallback generates building footprints');
assert(fallbackCity.roadNetwork.edges.length > 0, 'Procedural fallback generates road network');
assert(Object.keys(fallbackCity.pois).length > 0, 'Procedural fallback generates default gameplay POIs');

console.log(`\n====================================================`);
console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log(`====================================================\n`);
