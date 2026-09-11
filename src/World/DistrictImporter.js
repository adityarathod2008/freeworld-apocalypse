/**
 * Game FreeWorld - DistrictImporter (v5.0)
 * Processes, structures, and imports neighborhood polygons, administrative boundaries,
 * district centroids, and spatial containment tests from GIS data.
 */

import * as THREE from 'three';

export class DistrictImporter {
  constructor(coordinateTransformer) {
    this.transformer = coordinateTransformer;
  }

  /**
   * Process raw GIS district polygon boundaries
   */
  processDistricts(rawDistricts) {
    const districts = [];

    if (!Array.isArray(rawDistricts)) return districts;

    rawDistricts.forEach((d, idx) => {
      const polygon = d.polygon || [];
      if (polygon.length < 3) return;

      const center = d.center ? d.center.clone() : this._calculatePolygonCentroid(polygon);
      const minPoint = new THREE.Vector2(Infinity, Infinity);
      const maxPoint = new THREE.Vector2(-Infinity, -Infinity);

      polygon.forEach(pt => {
        minPoint.x = Math.min(minPoint.x, pt.x);
        minPoint.y = Math.min(minPoint.y, pt.z);
        maxPoint.x = Math.max(maxPoint.x, pt.x);
        maxPoint.y = Math.max(maxPoint.y, pt.z);
      });

      const district = {
        id: d.id || `district_${idx}`,
        name: d.name || `District ${idx + 1}`,
        center,
        bounds: new THREE.Box2(minPoint, maxPoint),
        polygon: polygon.map(p => p.clone()),
        tags: d.tags || {},

        /**
         * Check if a 2D/3D point lies inside this district polygon (Ray-casting point-in-polygon algorithm)
         */
        containsPoint: (pos) => {
          const x = pos.x;
          const z = pos.z !== undefined ? pos.z : pos.y;
          let inside = false;
          for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, zi = polygon[i].z;
            const xj = polygon[j].x, zj = polygon[j].z;
            const intersect = ((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
            if (intersect) inside = !inside;
          }
          return inside;
        }
      };

      districts.push(district);
    });

    return districts;
  }

  _calculatePolygonCentroid(polygon) {
    const center = new THREE.Vector3();
    polygon.forEach(pt => center.add(pt));
    return center.divideScalar(polygon.length);
  }
}
