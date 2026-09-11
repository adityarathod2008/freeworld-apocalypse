/**
 * Game FreeWorld - VehicleRegistry (v5.0)
 * Authoritative global tracking registry managing unique vehicle IDs, license plate generation,
 * vehicle condition (0-100%), fuel levels (0-100%), district/sector location tracking,
 * and occupant registries.
 */

import { events } from '../Core/EventBus.js';

export class VehicleRegistry {
  static instance = null;

  constructor() {
    if (VehicleRegistry.instance) return VehicleRegistry.instance;
    VehicleRegistry.instance = this;

    this.vehicles = new Map();
    this.plateCounter = 1000;
  }

  static get() {
    if (!VehicleRegistry.instance) new VehicleRegistry();
    return VehicleRegistry.instance;
  }

  /**
   * Generate a unique license plate string
   */
  generateLicensePlate() {
    const states = ['CA', 'NY', 'TX', 'FL', 'WA', 'IL'];
    const state = states[Math.floor(Math.random() * states.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const alpha = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                  String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `FW-${num}-${alpha}`;
  }

  /**
   * Register a new vehicle instance in global registry
   */
  registerVehicle(vehicle, customPlate = null) {
    const id = vehicle.vehicleId || vehicle.id || `veh_${Math.random().toString(36).substring(2, 9)}`;
    const plate = customPlate || vehicle.plate || this.generateLicensePlate();

    vehicle.vehicleId = id;
    vehicle.plate = plate;
    if (vehicle.fuel === undefined) vehicle.fuel = 100;
    if (vehicle.condition === undefined) vehicle.condition = 100;
    if (!vehicle.occupants) vehicle.occupants = [];

    // Ownership & Security Properties
    const ownerId = vehicle.ownerId !== undefined ? vehicle.ownerId : (vehicle.isEmergencyVehicle ? 'city_dept' : 'civilian_npc');
    const vehicleType = vehicle.type || 'car';
    const keys = vehicle.keys !== undefined ? vehicle.keys : true;
    const alarm = vehicle.alarm !== undefined ? vehicle.alarm : Math.random() < 0.6;
    const security = vehicle.security || (vehicle.isEmergencyVehicle ? 'high' : (alarm ? 'basic' : 'none'));
    const reportedStolen = vehicle.reportedStolen !== undefined ? vehicle.reportedStolen : false;
    const stolenState = vehicle.stolenState || (reportedStolen ? 'reported' : 'clean');

    vehicle.ownerId = ownerId;
    vehicle.vehicleType = vehicleType;
    vehicle.keys = keys;
    vehicle.alarm = alarm;
    vehicle.security = security;
    vehicle.reportedStolen = reportedStolen;
    vehicle.stolenState = stolenState;

    const record = {
      vehicleId: id,
      ownerId,
      type: vehicleType,
      vehicleType,
      displayName: vehicle.displayName || 'Vehicle',
      plate,
      condition: vehicle.condition,
      fuel: vehicle.fuel,
      keys,
      alarm,
      security,
      location: {
        district: vehicle.district || 'Downtown Core',
        position: vehicle.position ? { x: vehicle.position.x, y: vehicle.position.y, z: vehicle.position.z } : { x: 0, y: 0, z: 0 }
      },
      occupants: vehicle.occupants,
      occupantsCount: vehicle.occupants ? vehicle.occupants.length : 0,
      reportedStolen,
      stolenState,
      isEmergencyVehicle: vehicle.displayName?.toLowerCase().includes('police') || vehicle.type === 'emergency',
      instance: vehicle
    };

    this.vehicles.set(id, record);

    events.emit('VEHICLE_REGISTERED', record);
    return record;
  }

  unregisterVehicle(vehicleId) {
    if (this.vehicles.has(vehicleId)) {
      this.vehicles.delete(vehicleId);
      events.emit('VEHICLE_UNREGISTERED', { vehicleId });
    }
  }

  getVehicle(vehicleId) {
    return this.vehicles.get(vehicleId);
  }

  setVehicleOwner(vehicleId, ownerId) {
    const record = this.vehicles.get(vehicleId);
    if (record) {
      record.ownerId = ownerId;
      if (record.instance) record.instance.ownerId = ownerId;
      events.emit('VEHICLE_OWNER_CHANGED', { vehicleId, ownerId });
    }
  }

  reportStolen(vehicleId, reporterId = null) {
    const record = this.vehicles.get(vehicleId);
    if (record) {
      record.reportedStolen = true;
      record.stolenState = 'reported';
      if (record.instance) {
        record.instance.reportedStolen = true;
        record.instance.stolenState = 'reported';
      }
      events.emit('VEHICLE_REPORTED_STOLEN', {
        vehicleId,
        plate: record.plate,
        displayName: record.displayName,
        reporterId,
        location: record.location
      });
      return true;
    }
    return false;
  }

  isPlateReported(plate) {
    for (const [, record] of this.vehicles) {
      if (record.plate === plate && record.reportedStolen) {
        return true;
      }
    }
    return false;
  }

  checkPlateANPR(plate) {
    for (const [, record] of this.vehicles) {
      if (record.plate === plate) {
        return {
          vehicleId: record.vehicleId,
          plate: record.plate,
          reportedStolen: record.reportedStolen,
          stolenState: record.stolenState,
          ownerId: record.ownerId,
          displayName: record.displayName,
          location: record.location
        };
      }
    }
    return null;
  }

  updateLocation(vehicleId, pos, district = 'Downtown Core') {
    const record = this.vehicles.get(vehicleId);
    if (record && pos) {
      record.location.district = district;
      record.location.position = { x: pos.x, y: pos.y, z: pos.z };
    }
  }

  updateCondition(vehicleId, healthPercent, fuelPercent) {
    const record = this.vehicles.get(vehicleId);
    if (record) {
      if (healthPercent !== undefined) record.condition = Math.max(0, Math.min(100, healthPercent));
      if (fuelPercent !== undefined) record.fuel = Math.max(0, Math.min(100, fuelPercent));
    }
  }

  toJSON() {
    const serialized = [];
    this.vehicles.forEach((rec, id) => {
      serialized.push({
        vehicleId: id,
        ownerId: rec.ownerId,
        vehicleType: rec.vehicleType,
        displayName: rec.displayName,
        plate: rec.plate,
        condition: rec.condition,
        fuel: rec.fuel,
        keys: rec.keys,
        alarm: rec.alarm,
        security: rec.security,
        location: rec.location,
        occupantsCount: rec.occupantsCount,
        reportedStolen: rec.reportedStolen,
        stolenState: rec.stolenState,
        isEmergencyVehicle: rec.isEmergencyVehicle
      });
    });
    return {
      vehicles: serialized
    };
  }

  fromJSON(data) {
    if (!data || !Array.isArray(data.vehicles)) return;
    data.vehicles.forEach(vData => {
      this.vehicles.set(vData.vehicleId, {
        ...vData,
        instance: null
      });
    });
  }
}
