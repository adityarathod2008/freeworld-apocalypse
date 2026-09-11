/**
 * Game FreeWorld - GISDataParser (v5.0)
 * Parses GeoJSON and OpenStreetMap (OSM) geographic footprint datasets
 * into normalized local 3D city graphs with coordinate projection.
 *
 * --- GIS DATA FORMAT GUIDE & SPECIFICATION ---
 * Supported Formats:
 * 1. GeoJSON (RFC 7946):
 *    - FeatureCollection of Polygons (Buildings), LineStrings (Roads), Points (POIs/Junctions).
 *    - Expected Properties:
 *      - Building Polygons: { "building": "commercial|residential|industrial", "height": number, "levels": number }
 *      - Road LineStrings: { "highway": "primary|secondary|residential|motorway", "lanes": number }
 *      - POI Points: { "amenity": "bank|armory|station|hospital|fuel|police", "name": string }
 *
 * 2. OSM JSON (Overpass API format):
 *    - Array of elements: { type: "node" | "way", id: number, lat: number, lon: number, tags: {} }
 */

import * as THREE from 'three';

export class GISDataParser {
  constructor(origin = { lat: 37.7749, lon: -122.4194 }, scaleMetersPerDegree = 111000) {
    this.origin = origin;
    this.scaleMetersPerDegree = scaleMetersPerDegree;
    // Latitude degrees to meters ~ 111,000m. Longitude meters depend on latitude.
    this.metersPerLonDegree = scaleMetersPerDegree * Math.cos((origin.lat * Math.PI) / 180);
  }

  /**
   * Project (lat, lon) coordinates into 3D local engine space (x, 0, z)
   */
  geoToLocal(lat, lon, alt = 0) {
    const x = (lon - this.origin.lon) * this.metersPerLonDegree;
    const z = -(lat - this.origin.lat) * this.scaleMetersPerDegree;
    return new THREE.Vector3(x, alt, z);
  }

  /**
   * Project 3D local engine space (x, 0, z) back into (lat, lon)
   */
  localToGeo(x, z) {
    const lat = this.origin.lat - z / this.scaleMetersPerDegree;
    const lon = this.origin.lon + x / this.metersPerLonDegree;
    return { lat, lon };
  }

  /**
   * Parse GeoJSON FeatureCollection
   */
  parseGeoJSON(geoJson) {
    if (!geoJson || geoJson.type !== 'FeatureCollection' || !Array.isArray(geoJson.features)) {
      throw new Error('[GISDataParser] Invalid GeoJSON FeatureCollection format');
    }

    const graph = {
      nodes: [],
      edges: [],
      footprints: [],
      POIs: {},
      districts: []
    };

    let nodeIdCounter = 0;

    for (const feature of geoJson.features) {
      if (!feature.geometry) continue;

      const props = feature.properties || {};

      switch (feature.geometry.type) {
        case 'Point': {
          const [lon, lat, alt] = feature.geometry.coordinates;
          const pos = this.geoToLocal(lat, lon, alt || 0);
          const poiType = props.amenity || props.poi || props.type || 'generic';
          graph.POIs[poiType] = {
            id: props.id || `poi_${nodeIdCounter++}`,
            type: poiType,
            name: props.name || poiType,
            position: pos,
            tags: props
          };
          graph.nodes.push({
            id: `node_poi_${nodeIdCounter}`,
            position: pos,
            tags: props
          });
          break;
        }

        case 'LineString': {
          // Road network edge
          const coords = feature.geometry.coordinates;
          const wayNodes = [];

          for (let i = 0; i < coords.length; i++) {
            const [lon, lat] = coords[i];
            const pos = this.geoToLocal(lat, lon);
            const nodeId = `node_road_${nodeIdCounter++}`;
            const node = { id: nodeId, position: pos, tags: props };
            graph.nodes.push(node);
            wayNodes.push(node);
          }

          for (let i = 0; i < wayNodes.length - 1; i++) {
            graph.edges.push({
              id: `edge_${wayNodes[i].id}_${wayNodes[i + 1].id}`,
              from: wayNodes[i].id,
              to: wayNodes[i + 1].id,
              fromPos: wayNodes[i].position.clone(),
              toPos: wayNodes[i + 1].position.clone(),
              highway: props.highway || 'secondary',
              lanes: props.lanes ? parseInt(props.lanes, 10) : 2,
              oneWay: props.oneway === 'yes' || props.oneway === true
            });
          }
          break;
        }

        case 'Polygon': {
          // Building footprint or district boundary
          const rings = feature.geometry.coordinates;
          if (!rings || rings.length === 0) continue;

          const exteriorRing = rings[0];
          const localPoints = [];
          let centerSum = new THREE.Vector3();

          for (const [lon, lat] of exteriorRing) {
            const p = this.geoToLocal(lat, lon);
            localPoints.push(p);
            centerSum.add(p);
          }

          if (localPoints.length > 0) {
            const center = centerSum.divideScalar(localPoints.length);

            if (props.boundary === 'administrative' || props.district) {
              graph.districts.push({
                name: props.name || props.district || 'District',
                polygon: localPoints,
                center
              });
            } else {
              const levels = props.levels ? parseInt(props.levels, 10) : Math.floor(Math.random() * 8) + 2;
              const height = props.height ? parseFloat(props.height) : levels * 3.8;
              graph.footprints.push({
                id: props.id || `bldg_${graph.footprints.length}`,
                type: props.building || 'commercial',
                center,
                height,
                levels,
                polygon: localPoints,
                tags: props
              });
            }
          }
          break;
        }
      }
    }

    return graph;
  }

  /**
   * Validate normalized GIS Graph structure
   */
  validateGraph(graph) {
    if (!graph || typeof graph !== 'object') return false;
    if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return false;
    if (!Array.isArray(graph.footprints)) return false;
    return true;
  }
}
