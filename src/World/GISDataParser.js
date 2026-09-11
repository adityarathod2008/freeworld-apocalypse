/**
 * Game FreeWorld - GISDataParser (v5.0)
 * Master parser converting GeoJSON (RFC 7946) and OpenStreetMap (OSM Overpass API format)
 * geographic datasets into a normalized city graph using CoordinateTransformer and GISDataValidator.
 */

import * as THREE from 'three';
import { CoordinateTransformer } from './CoordinateTransformer.js';
import { GISDataValidator } from './GISDataValidator.js';

export class GISDataParser {
  constructor(origin = { lat: 37.7749, lon: -122.4194, alt: 0 }, metersPerDegreeLat = 111320) {
    this.transformer = new CoordinateTransformer(origin, metersPerDegreeLat);
    this.validator = GISDataValidator;
  }

  setOrigin(lat, lon, alt = 0) {
    this.transformer.setOrigin(lat, lon, alt);
  }

  geoToLocal(lat, lon, alt = 0) {
    return this.transformer.geoToLocal(lat, lon, alt);
  }

  localToGeo(x, z, alt = 0) {
    return this.transformer.localToGeo(x, z, alt);
  }

  /**
   * Primary entry point: parse either GeoJSON or OSM JSON data
   */
  parse(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('[GISDataParser] Invalid GIS dataset provided');
    }

    if (data.type === 'FeatureCollection') {
      const val = this.validator.validateGeoJSON(data);
      if (!val.valid) {
        throw new Error(`[GISDataParser] GeoJSON validation failed: ${val.errors.join(', ')}`);
      }
      return this.parseGeoJSON(data);
    } else if (Array.isArray(data.elements)) {
      const val = this.validator.validateOSMJSON(data);
      if (!val.valid) {
        throw new Error(`[GISDataParser] OSM JSON validation failed: ${val.errors.join(', ')}`);
      }
      return this.parseOSMJSON(data);
    } else {
      throw new Error('[GISDataParser] Unrecognized GIS data format. Expected GeoJSON FeatureCollection or OSM JSON elements.');
    }
  }

  /**
   * Parse GeoJSON FeatureCollection into normalized city graph
   */
  parseGeoJSON(geoJson) {
    const graph = {
      nodes: [],
      edges: [],
      footprints: [],
      POIs: {},
      districts: [],
      transitStations: [],
      transitRoutes: [],
      metadata: { format: 'GeoJSON', featureCount: geoJson.features.length }
    };

    let nodeIdCounter = 0;

    for (const feature of geoJson.features) {
      if (!feature.geometry) continue;

      const props = feature.properties || {};
      const type = feature.geometry.type;

      switch (type) {
        case 'Point': {
          const [lon, lat, alt] = feature.geometry.coordinates;
          const pos = this.transformer.geoToLocal(lat, lon, alt || 0);

          if (props.railway || props.transit === 'station' || props.subway) {
            graph.transitStations.push({
              id: props.id || `station_${graph.transitStations.length}`,
              name: props.name || 'Station',
              type: props.railway || props.subway ? 'subway_station' : 'bus_station',
              position: pos,
              tags: props
            });
          } else {
            const poiType = props.amenity || props.shop || props.poi || props.type || 'generic';
            graph.POIs[props.id || `poi_${nodeIdCounter++}`] = {
              id: props.id || `poi_${nodeIdCounter}`,
              type: poiType,
              name: props.name || poiType,
              position: pos,
              tags: props
            };
          }

          graph.nodes.push({
            id: `node_poi_${nodeIdCounter}`,
            position: pos,
            tags: props
          });
          break;
        }

        case 'LineString': {
          const coords = feature.geometry.coordinates;
          const wayNodes = [];

          for (let i = 0; i < coords.length; i++) {
            const [lon, lat, alt] = coords[i];
            const pos = this.transformer.geoToLocal(lat, lon, alt || 0);
            const nodeId = `node_road_${nodeIdCounter++}`;
            const node = { id: nodeId, position: pos, tags: props };
            graph.nodes.push(node);
            wayNodes.push(node);
          }

          if (props.route || props.railway || props.transit) {
            graph.transitRoutes.push({
              id: props.id || `route_${graph.transitRoutes.length}`,
              name: props.name || 'Transit Route',
              type: props.route || props.railway || 'transit',
              path: wayNodes.map(n => n.position.clone()),
              tags: props
            });
          } else {
            for (let i = 0; i < wayNodes.length - 1; i++) {
              graph.edges.push({
                id: `edge_${wayNodes[i].id}_${wayNodes[i + 1].id}`,
                from: wayNodes[i].id,
                to: wayNodes[i + 1].id,
                fromPos: wayNodes[i].position.clone(),
                toPos: wayNodes[i + 1].position.clone(),
                highway: props.highway || 'secondary',
                lanes: props.lanes ? parseInt(props.lanes, 10) : 2,
                oneWay: props.oneway === 'yes' || props.oneway === true,
                tags: props
              });
            }
          }
          break;
        }

        case 'Polygon': {
          const rings = feature.geometry.coordinates;
          if (!rings || rings.length === 0) continue;

          const exteriorRing = rings[0];
          const localPoints = [];
          let centerSum = new THREE.Vector3();

          for (const [lon, lat] of exteriorRing) {
            const p = this.transformer.geoToLocal(lat, lon);
            localPoints.push(p);
            centerSum.add(p);
          }

          if (localPoints.length > 0) {
            const center = centerSum.divideScalar(localPoints.length);

            if (props.boundary === 'administrative' || props.district || props.boundary === 'neighborhood') {
              graph.districts.push({
                id: props.id || `district_${graph.districts.length}`,
                name: props.name || props.district || 'District',
                polygon: localPoints,
                center,
                tags: props
              });
            } else {
              const levels = props.levels ? parseInt(props.levels, 10) : Math.floor(Math.random() * 8) + 2;
              const height = props.height ? parseFloat(props.height) : levels * 3.8;
              graph.footprints.push({
                id: props.id || `bldg_${graph.footprints.length}`,
                type: props.building || props.amenity || 'commercial',
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
   * Parse OpenStreetMap (OSM) Overpass API JSON format
   */
  parseOSMJSON(osmJson) {
    const nodeMap = new Map();
    const graph = {
      nodes: [],
      edges: [],
      footprints: [],
      POIs: {},
      districts: [],
      transitStations: [],
      transitRoutes: [],
      metadata: { format: 'OSM_JSON', elementCount: osmJson.elements.length }
    };

    // 1. Process OSM Nodes
    osmJson.elements.forEach(elem => {
      if (elem.type === 'node') {
        const pos = this.transformer.geoToLocal(elem.lat, elem.lon);
        const node = { id: `osm_node_${elem.id}`, position: pos, tags: elem.tags || {} };
        nodeMap.set(elem.id, node);
        graph.nodes.push(node);

        if (elem.tags) {
          if (elem.tags.amenity || elem.tags.shop || elem.tags.tourism) {
            const poiType = elem.tags.amenity || elem.tags.shop || elem.tags.tourism;
            graph.POIs[`osm_poi_${elem.id}`] = {
              id: `osm_poi_${elem.id}`,
              type: poiType,
              name: elem.tags.name || poiType,
              position: pos,
              tags: elem.tags
            };
          }
          if (elem.tags.railway === 'station' || elem.tags.highway === 'bus_stop') {
            graph.transitStations.push({
              id: `osm_station_${elem.id}`,
              name: elem.tags.name || 'Transit Stop',
              type: elem.tags.railway ? 'subway_station' : 'bus_stop',
              position: pos,
              tags: elem.tags
            });
          }
        }
      }
    });

    // 2. Process OSM Ways
    osmJson.elements.forEach(elem => {
      if (elem.type === 'way' && Array.isArray(elem.nodes)) {
        const tags = elem.tags || {};
        const wayNodes = elem.nodes.map(nId => nodeMap.get(nId)).filter(Boolean);

        if (wayNodes.length < 2) return;

        if (tags.highway) {
          for (let i = 0; i < wayNodes.length - 1; i++) {
            graph.edges.push({
              id: `osm_edge_${elem.id}_${i}`,
              from: wayNodes[i].id,
              to: wayNodes[i + 1].id,
              fromPos: wayNodes[i].position.clone(),
              toPos: wayNodes[i + 1].position.clone(),
              highway: tags.highway,
              lanes: tags.lanes ? parseInt(tags.lanes, 10) : 2,
              oneWay: tags.oneway === 'yes',
              tags
            });
          }
        } else if (tags.building) {
          const poly = wayNodes.map(n => n.position.clone());
          const center = new THREE.Vector3();
          poly.forEach(p => center.add(p));
          center.divideScalar(poly.length);

          const levels = tags['building:levels'] ? parseInt(tags['building:levels'], 10) : 4;
          const height = tags.height ? parseFloat(tags.height) : levels * 3.8;

          graph.footprints.push({
            id: `osm_bldg_${elem.id}`,
            type: tags.building === 'yes' ? 'residential' : tags.building,
            center,
            height,
            levels,
            polygon: poly,
            tags
          });
        }
      }
    });

    return graph;
  }

  validateGraph(graph) {
    return this.validator.validateGraph(graph);
  }
}
