/**
 * Game FreeWorld - POIImporter (v5.0)
 * Processes, classifies, and manages Points of Interest (POIs) and geographic landmarks
 * (banks, armories, dealerships, gas stations, police stations, safehouses, monuments) from GIS data.
 */

import * as THREE from 'three';

export class POIImporter {
  constructor(coordinateTransformer) {
    this.transformer = coordinateTransformer;
  }

  /**
   * Process raw GIS POIs into gameplay interaction locations
   */
  processPOIs(rawPOIs) {
    const poiMap = {};
    const poiList = [];
    const landmarks = [];

    Object.entries(rawPOIs).forEach(([key, raw]) => {
      const type = this._normalizePOIType(raw.type || raw.tags?.amenity || raw.tags?.shop || key);
      const isLandmark = raw.tags?.tourism === 'attraction' || raw.tags?.historic === 'monument' || raw.type === 'landmark';

      const poi = {
        id: raw.id || `poi_${key}`,
        type,
        name: raw.name || raw.tags?.name || this._formatPOIName(type),
        position: raw.position.clone(),
        isLandmark,
        interactive: this._isInteractivePOI(type),
        icon: this._getPOIIcon(type),
        color: this._getPOIColor(type),
        tags: raw.tags || {}
      };

      poiMap[poi.id] = poi;
      poiList.push(poi);

      if (isLandmark) {
        landmarks.push(poi);
      }
    });

    return {
      poiMap,
      poiList,
      landmarks,
      count: poiList.length
    };
  }

  _normalizePOIType(type) {
    const t = String(type).toLowerCase();
    if (t.includes('bank')) return 'bank';
    if (t.includes('armory') || t.includes('gun') || t.includes('weapon')) return 'armory';
    if (t.includes('dealer') || t.includes('car')) return 'dealership';
    if (t.includes('gas') || t.includes('fuel')) return 'gas_station';
    if (t.includes('hospital') || t.includes('clinic')) return 'hospital';
    if (t.includes('police')) return 'police';
    if (t.includes('safehouse') || t.includes('shelter')) return 'safehouse';
    if (t.includes('harbor') || t.includes('marina')) return 'harbor';
    return 'generic';
  }

  _formatPOIName(type) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  _isInteractivePOI(type) {
    return ['bank', 'armory', 'dealership', 'gas_station', 'hospital', 'police', 'safehouse', 'harbor'].includes(type);
  }

  _getPOIIcon(type) {
    switch (type) {
      case 'bank': return '🏦';
      case 'armory': return '🔫';
      case 'dealership': return '🚗';
      case 'gas_station': return '⛽';
      case 'hospital': return '🏥';
      case 'police': return '🚔';
      case 'safehouse': return '🏠';
      case 'harbor': return '⚓';
      default: return '📍';
    }
  }

  _getPOIColor(type) {
    switch (type) {
      case 'bank': return 0x2ecc71; // Green
      case 'armory': return 0xe74c3c; // Red
      case 'dealership': return 0x3498db; // Blue
      case 'gas_station': return 0xf39c12; // Orange
      case 'hospital': return 0x9b59b6; // Purple
      case 'police': return 0x2980b9; // Dark Blue
      case 'safehouse': return 0xf1c40f; // Gold
      default: return 0x95a5a6;
    }
  }
}
