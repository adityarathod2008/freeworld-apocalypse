/**
 * Game FreeWorld - TransitImporter (v5.0)
 * Processes, structures, and imports public transportation infrastructure: transit stations
 * (subway, train, bus terminals) and transit route networks (tracks, paths, lines) from GIS data.
 */

import * as THREE from 'three';

export class TransitImporter {
  constructor(coordinateTransformer) {
    this.transformer = coordinateTransformer;
  }

  /**
   * Process GIS transit elements (stations and routes)
   */
  processTransitData(rawStations, rawRoutes) {
    const stations = [];
    const routes = [];

    // 1. Process Stations
    if (Array.isArray(rawStations)) {
      rawStations.forEach((st, idx) => {
        const type = st.type || st.tags?.transit || st.tags?.railway || 'subway_station';
        stations.push({
          id: st.id || `station_${idx}`,
          name: st.name || st.tags?.name || `Transit Station ${idx + 1}`,
          type,
          position: st.position ? st.position.clone() : new THREE.Vector3(0, 0, 0),
          isUnderground: type.includes('subway') || st.tags?.tunnel === 'yes',
          connectedRoutes: [],
          tags: st.tags || {}
        });
      });
    }

    // 2. Process Routes
    if (Array.isArray(rawRoutes)) {
      rawRoutes.forEach((rt, idx) => {
        const path = Array.isArray(rt.path) ? rt.path.map(p => p.clone()) : [];
        const type = rt.type || rt.tags?.route || 'subway_line';

        const route = {
          id: rt.id || `route_${idx}`,
          name: rt.name || rt.tags?.name || `Route ${idx + 1}`,
          type,
          color: rt.color || rt.tags?.colour || '#3498db',
          path,
          stationIds: [],
          isUnderground: rt.isUnderground || rt.tags?.tunnel === 'yes',
          totalLengthMeters: this._calculatePathLength(path)
        };

        // Associate stations along route path
        stations.forEach(st => {
          path.forEach(pt => {
            if (st.position.distanceTo(pt) < 30) {
              if (!route.stationIds.includes(st.id)) {
                route.stationIds.push(st.id);
              }
              if (!st.connectedRoutes.includes(route.id)) {
                st.connectedRoutes.push(route.id);
              }
            }
          });
        });

        routes.push(route);
      });
    }

    return {
      stations,
      routes,
      stationCount: stations.length,
      routeCount: routes.length
    };
  }

  _calculatePathLength(path) {
    let len = 0;
    for (let i = 0; i < path.length - 1; i++) {
      len += path[i].distanceTo(path[i + 1]);
    }
    return len;
  }
}
