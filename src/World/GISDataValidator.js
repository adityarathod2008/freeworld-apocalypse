/**
 * Game FreeWorld - GISDataValidator (v5.0)
 * Validates GeoJSON and OpenStreetMap (OSM) geographic datasets for structural integrity,
 * coordinate bounds, topology correctness, and attribute specifications before ingestion.
 */

export class GISDataValidator {
  /**
   * Validate GeoJSON input structure and coordinate sanity
   */
  static validateGeoJSON(geoJson) {
    const result = { valid: true, errors: [], warnings: [], featureCount: 0 };

    if (!geoJson || typeof geoJson !== 'object') {
      result.valid = false;
      result.errors.push('Input is not a valid JSON object');
      return result;
    }

    if (geoJson.type !== 'FeatureCollection') {
      result.valid = false;
      result.errors.push(`Expected GeoJSON type 'FeatureCollection', got '${geoJson.type}'`);
      return result;
    }

    if (!Array.isArray(geoJson.features)) {
      result.valid = false;
      result.errors.push('FeatureCollection must contain a "features" array');
      return result;
    }

    result.featureCount = geoJson.features.length;

    geoJson.features.forEach((feature, idx) => {
      if (!feature || typeof feature !== 'object') {
        result.warnings.push(`Feature at index ${idx} is null or invalid object`);
        return;
      }

      if (!feature.geometry) {
        result.warnings.push(`Feature at index ${idx} missing geometry`);
        return;
      }

      const geom = feature.geometry;
      const type = geom.type;

      if (!['Point', 'LineString', 'Polygon', 'MultiPolygon', 'MultiLineString'].includes(type)) {
        result.warnings.push(`Feature index ${idx} has unsupported geometry type '${type}'`);
        return;
      }

      // Check coordinates
      this._validateCoordinates(geom, idx, result);
    });

    if (result.errors.length > 0) {
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate OpenStreetMap JSON (Overpass API format)
   */
  static validateOSMJSON(osmJson) {
    const result = { valid: true, errors: [], warnings: [], elementCount: 0 };

    if (!osmJson || typeof osmJson !== 'object') {
      result.valid = false;
      result.errors.push('OSM data is not a valid JSON object');
      return result;
    }

    if (!Array.isArray(osmJson.elements)) {
      result.valid = false;
      result.errors.push('OSM JSON must contain an "elements" array');
      return result;
    }

    result.elementCount = osmJson.elements.length;

    osmJson.elements.forEach((elem, idx) => {
      if (!elem || !elem.type) {
        result.warnings.push(`Element index ${idx} missing type`);
        return;
      }

      if (elem.type === 'node') {
        if (typeof elem.lat !== 'number' || typeof elem.lon !== 'number') {
          result.errors.push(`OSM Node ID ${elem.id || idx} has invalid lat/lon coordinates`);
        } else if (elem.lat < -90 || elem.lat > 90 || elem.lon < -180 || elem.lon > 180) {
          result.errors.push(`OSM Node ID ${elem.id || idx} coordinates out of WGS84 bounds (${elem.lat}, ${elem.lon})`);
        }
      } else if (elem.type === 'way') {
        if (!Array.isArray(elem.nodes) || elem.nodes.length === 0) {
          result.warnings.push(`OSM Way ID ${elem.id || idx} has no nodes`);
        }
      }
    });

    if (result.errors.length > 0) {
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate internal normalized city graph
   */
  static validateGraph(graph) {
    if (!graph || typeof graph !== 'object') return false;
    if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return false;
    if (!Array.isArray(graph.footprints)) return false;
    if (!graph.POIs || typeof graph.POIs !== 'object') return false;
    if (!Array.isArray(graph.districts)) return false;
    return true;
  }

  static _validateCoordinates(geom, featureIdx, result) {
    const checkPt = (pt) => {
      if (!Array.isArray(pt) || pt.length < 2) return false;
      const lon = pt[0];
      const lat = pt[1];
      if (typeof lon !== 'number' || typeof lat !== 'number') return false;
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
      return true;
    };

    if (geom.type === 'Point') {
      if (!checkPt(geom.coordinates)) {
        result.warnings.push(`Feature ${featureIdx} Point coordinates invalid: ${JSON.stringify(geom.coordinates)}`);
      }
    } else if (geom.type === 'LineString') {
      if (!Array.isArray(geom.coordinates) || geom.coordinates.length < 2) {
        result.warnings.push(`Feature ${featureIdx} LineString has < 2 coordinates`);
      } else {
        geom.coordinates.forEach(pt => {
          if (!checkPt(pt)) result.warnings.push(`Feature ${featureIdx} contains invalid coordinate ${JSON.stringify(pt)}`);
        });
      }
    } else if (geom.type === 'Polygon') {
      if (!Array.isArray(geom.coordinates) || geom.coordinates.length === 0) {
        result.warnings.push(`Feature ${featureIdx} Polygon has empty rings`);
      } else {
        const exteriorRing = geom.coordinates[0];
        if (!Array.isArray(exteriorRing) || exteriorRing.length < 3) {
          result.warnings.push(`Feature ${featureIdx} Polygon exterior ring has < 3 points`);
        }
      }
    }
  }
}
