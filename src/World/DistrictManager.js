/**
 * Game FreeWorld - DistrictManager
 * Defines the distinct neighborhood zones of Downtown Bay City:
 * Financial District, Marina Harbor, Commercial Neon Strip, and Residential Safehouse Quarter.
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export const DISTRICTS = [
  {
    id: 'financial',
    name: 'Downtown Financial Center',
    bounds: { minX: -180, maxX: 0, minZ: -180, maxZ: 0 },
    trafficDensity: 1.2,
    policePresence: 1.4,
    ambientColor: 0x1a2638,
    description: 'High-rise glass monoliths, Central Bank, executive luxury cars.'
  },
  {
    id: 'commercial',
    name: 'Apex Commercial Boulevard',
    bounds: { minX: 0, maxX: 180, minZ: -180, maxZ: 0 },
    trafficDensity: 1.0,
    policePresence: 0.9,
    ambientColor: 0x241d2e,
    description: 'Vibrant neon street, Apex Armory gun store, car dealerships, diners.'
  },
  {
    id: 'marina',
    name: 'Bay City Marina & Harbor',
    bounds: { minX: -180, maxX: 0, minZ: 0, maxZ: 180 },
    trafficDensity: 0.7,
    policePresence: 0.6,
    ambientColor: 0x0f232b,
    description: 'Cargo shipping containers, industrial cranes, dark alleyways, docks.'
  },
  {
    id: 'residential',
    name: 'Bayside Heights & Safehouse',
    bounds: { minX: 0, maxX: 180, minZ: 0, maxZ: 180 },
    trafficDensity: 0.8,
    policePresence: 0.8,
    ambientColor: 0x1d222a,
    description: 'Luxury residential penthouses, safehouse garages, underground parking.'
  }
];

export class DistrictManager {
  constructor() {
    this.currentDistrict = DISTRICTS[0];
  }

  getDistrictAtPosition(pos) {
    for (const d of DISTRICTS) {
      if (
        pos.x >= d.bounds.minX && pos.x <= d.bounds.maxX &&
        pos.z >= d.bounds.minZ && pos.z <= d.bounds.maxZ
      ) {
        return d;
      }
    }
    return DISTRICTS[0];
  }

  update(playerPos) {
    if (!playerPos) return;
    const current = this.getDistrictAtPosition(playerPos);
    if (current.id !== this.currentDistrict.id) {
      this.currentDistrict = current;
      events.emit('DISTRICT_CHANGED', current);
      events.emit('HUD_NOTIFICATION', {
        title: 'ENTERING DISTRICT',
        message: current.name
      });
    }
  }
}
