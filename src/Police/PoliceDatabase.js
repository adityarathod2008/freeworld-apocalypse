/**
 * Game FreeWorld - PoliceDatabase (Phase 5)
 * Central Police Database tracking stolen vehicle reports, wanted plates,
 * vehicle descriptions (make, model, color), and active stolen vehicle lookouts (BOLO).
 */
import { events } from '../Core/EventBus.js';
import { VehicleRegistry } from '../Vehicles/VehicleRegistry.js';

export class PoliceDatabase {
  static instance = null;

  constructor() {
    if (PoliceDatabase.instance) return PoliceDatabase.instance;
    PoliceDatabase.instance = this;

    this.stolenReports = new Map(); // plate -> report object
    this.activeBOLOs = [];

    this.setupEventListeners();
  }

  static get() {
    if (!PoliceDatabase.instance) new PoliceDatabase();
    return PoliceDatabase.instance;
  }

  setupEventListeners() {
    events.on('VEHICLE_REPORTED_STOLEN', (data) => {
      this.registerStolenReport(data);
    });

    events.on('DEBUG_WANTED_CLEAR', () => {
      this.clearAllReports();
    });
  }

  registerStolenReport(data) {
    if (!data || !data.plate) return;

    const report = {
      id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      vehicleId: data.vehicleId,
      plate: data.plate,
      displayName: data.displayName || 'Vehicle',
      vehicleType: data.vehicleType || 'car',
      reporterId: data.reporterId || 'civilian_owner',
      location: data.location || { district: 'Downtown Core', position: { x: 0, y: 0, z: 0 } },
      timestamp: performance.now(),
      status: 'ACTIVE' // 'ACTIVE' | 'RECOVERED' | 'DISPATCHED'
    };

    this.stolenReports.set(data.plate, report);

    // Create BOLO (Be On the Lookout) entry
    const bolo = {
      id: `bolo_${report.id}`,
      description: `STOLEN ${report.displayName.toUpperCase()} [PLATE: ${report.plate}]`,
      plate: report.plate,
      vehicleId: report.vehicleId,
      lastKnownDistrict: report.location.district,
      timestamp: report.timestamp
    };
    this.activeBOLOs.unshift(bolo);
    if (this.activeBOLOs.length > 20) this.activeBOLOs.pop();

    events.emit('POLICE_DATABASE_REPORT_ADDED', report);

    // Broadcast to radio scanner
    events.emit('SHOW_SUBTITLE', {
      speaker: 'POLICE DISPATCH',
      text: `"All units, BOLO issued for stolen ${report.displayName} [${report.plate}]. Check plates."`
    });

    return report;
  }

  scanPlateANPR(plate) {
    if (!plate) return null;
    const report = this.stolenReports.get(plate);
    if (report && report.status === 'ACTIVE') {
      return {
        matched: true,
        report,
        reason: 'REPORTED_STOLEN'
      };
    }
    // Also check VehicleRegistry for authoritative record
    const reg = VehicleRegistry.get().checkPlateANPR(plate);
    if (reg && reg.reportedStolen) {
      return {
        matched: true,
        report: reg,
        reason: 'REGISTRY_STOLEN'
      };
    }
    return { matched: false };
  }

  getStolenReport(plate) {
    return this.stolenReports.get(plate);
  }

  clearReport(plate) {
    if (this.stolenReports.has(plate)) {
      const report = this.stolenReports.get(plate);
      report.status = 'RECOVERED';
      this.stolenReports.delete(plate);
      this.activeBOLOs = this.activeBOLOs.filter(b => b.plate !== plate);
      events.emit('POLICE_DATABASE_REPORT_CLEARED', { plate });
    }
  }

  clearAllReports() {
    this.stolenReports.clear();
    this.activeBOLOs = [];
  }

  getActiveBOLOs() {
    return this.activeBOLOs;
  }
}

export const policeDatabase = new PoliceDatabase();
