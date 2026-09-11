/**
 * Game FreeWorld - CoordinateTransformer (v5.0)
 * Handles geographic normalization and conversion between source WGS84 coordinates (lat, lon, alt)
 * and local 3D game coordinates (x, y, z) in Three.js space.
 * 
 * Rules:
 * - Never use raw latitude/longitude directly as Three.js world coordinates.
 * - Geographic Normalization: (source coordinates) -> (geographic normalization) -> (local game coordinates).
 * - Local X = East/West distance (meters)
 * - Local Y = Altitude/Height (meters)
 * - Local Z = North/South distance (meters, North is -Z, South is +Z)
 */

import * as THREE from 'three';

export class CoordinateTransformer {
  constructor(origin = { lat: 37.7749, lon: -122.4194, alt: 0 }, metersPerDegreeLat = 111320) {
    this.origin = {
      lat: origin.lat || 37.7749,
      lon: origin.lon || -122.4194,
      alt: origin.alt || 0
    };
    this.metersPerDegreeLat = metersPerDegreeLat;
    this.recalculateScaling();
  }

  setOrigin(lat, lon, alt = 0) {
    this.origin.lat = lat;
    this.origin.lon = lon;
    this.origin.alt = alt;
    this.recalculateScaling();
  }

  getOrigin() {
    return { ...this.origin };
  }

  recalculateScaling() {
    const latRad = (this.origin.lat * Math.PI) / 180;
    // Longitude meters per degree varies with latitude
    this.metersPerDegreeLon = this.metersPerDegreeLat * Math.cos(latRad);
  }

  /**
   * Convert geographic coordinates (lat, lon, alt) to local Three.js 3D space
   * @param {number} lat - Latitude in degrees
   * @param {number} lon - Longitude in degrees
   * @param {number} [alt=0] - Altitude in meters
   * @returns {THREE.Vector3}
   */
  geoToLocal(lat, lon, alt = 0) {
    const dLat = lat - this.origin.lat;
    const dLon = lon - this.origin.lon;

    const x = dLon * this.metersPerDegreeLon;
    const z = -(dLat * this.metersPerDegreeLat); // North is -Z
    const y = alt - this.origin.alt;

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Convert local Three.js 3D space (x, y, z) back to geographic (lat, lon, alt)
   * @param {number} x - Local X coordinate
   * @param {number} z - Local Z coordinate
   * @param {number} [y=0] - Local Y coordinate
   * @returns {{ lat: number, lon: number, alt: number }}
   */
  localToGeo(x, z, y = 0) {
    const dLon = x / this.metersPerDegreeLon;
    const dLat = -z / this.metersPerDegreeLat;

    const lat = this.origin.lat + dLat;
    const lon = this.origin.lon + dLon;
    const alt = this.origin.alt + y;

    return { lat, lon, alt };
  }

  /**
   * Convert an array of [lon, lat, alt?] coordinate pairs to local THREE.Vector3 array
   */
  geoPathToLocal(coordsArray) {
    if (!Array.isArray(coordsArray)) return [];
    return coordsArray.map(pt => {
      const lon = pt[0];
      const lat = pt[1];
      const alt = pt[2] || 0;
      return this.geoToLocal(lat, lon, alt);
    });
  }

  /**
   * Calculate Haversine distance in meters between two lat/lon points
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
