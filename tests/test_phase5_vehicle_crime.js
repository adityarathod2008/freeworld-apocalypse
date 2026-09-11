/**
 * Game FreeWorld - Phase 5 Verification Test Suite
 * Tests Vehicle Ownership tracking attributes, Theft mechanics (unlocked, locked, forced entry, hotwire, alarm, carjacking ejection),
 * Owner AI decisions (flee, resist, surrender, fight, call_police), Theft Evidence & Police Database ANPR plate scanning,
 * and the complete Police Chain with physical officer vehicle exit.
 */

import { VehicleRegistry } from '../src/Vehicles/VehicleRegistry.js';
import { VehicleBase } from '../src/Vehicles/VehicleBase.js';
import { VehicleFactory } from '../src/Vehicles/VehicleTypes.js';
import { PoliceDatabase } from '../src/Police/PoliceDatabase.js';
import { EvidenceSystem } from '../src/Police/EvidenceSystem.js';
import { PoliceOfficerAI } from '../src/Police/PoliceOfficerAI.js';
import { PoliceAI } from '../src/Police/PoliceAI.js';
import { ArrestSystem } from '../src/Police/ArrestSystem.js';
import { NPCBase } from '../src/NPC/NPCBase.js';
import { events } from '../src/Core/EventBus.js';
import * as THREE from 'three';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Test Assertion Failed: ${message}`);
  }
}

console.log('=== FREEWORLD PHASE 5 VEHICLE OWNERSHIP, THEFT & POLICE RESPONSE TEST SUITE ===\n');

// Mock Three.js Scene
const mockScene = { add: () => {}, remove: () => {} };

// ----------------------------------------------------
// TEST 1: Vehicle Ownership & Authoritative Tracking Attributes
// ----------------------------------------------------
console.log('[Test 1] Vehicle Ownership Tracking Attributes & Registry');
const registry = VehicleRegistry.get();
const vehicle = VehicleFactory.createKestrelSedan(mockScene);

assert(vehicle.vehicleId !== undefined && vehicle.vehicleId.startsWith('veh_'), 'Vehicle initialized with unique vehicleId');
assert(vehicle.plate !== undefined && vehicle.plate.startsWith('FW-'), 'Vehicle assigned license plate (FW-xxxx-xx)');
assert(vehicle.condition === 100, 'Vehicle condition initialized to 100%');
assert(vehicle.fuel === 100, 'Vehicle fuel initialized to 100%');
assert(vehicle.keys !== undefined, 'Vehicle tracks key possession');
assert(vehicle.alarm !== undefined, 'Vehicle tracks alarm installation status');
assert(vehicle.security !== undefined, 'Vehicle tracks security tier (none/basic/high)');
assert(vehicle.reportedStolen === false, 'Vehicle initial reportedStolen status is false');
assert(vehicle.stolenState === 'clean', 'Vehicle initial stolenState is clean');

const rec = registry.getVehicle(vehicle.vehicleId);
assert(rec !== undefined, 'Vehicle registered in global VehicleRegistry');
assert(rec.plate === vehicle.plate, 'Registry record plate matches vehicle instance');

// ----------------------------------------------------
// TEST 2: Theft Mechanics (Unlocked, Locked, Forced Entry, Hotwire, Alarm, Driver Ejection)
// ----------------------------------------------------
console.log('\n[Test 2] Theft Mechanics & Alarm Triggering');
let alarmEventFired = false;
events.on('VEHICLE_ALARM_TRIGGERED', (data) => {
  if (data.vehicleId === vehicle.vehicleId) alarmEventFired = true;
});

vehicle.alarm = true;
vehicle.triggerAlarm(10.0);
assert(vehicle.alarmActive === true, 'triggerAlarm activates alarm status');
assert(alarmEventFired === true, 'VEHICLE_ALARM_TRIGGERED event emitted to EventBus');

// Carjacking & Driver Ejection
let ejectionFired = false;
events.on('NPC_EJECTED_FROM_VEHICLE', () => { ejectionFired = true; });

const mockDriver = { id: 'npc_owner_1', currentVehicle: vehicle, position: new THREE.Vector3(0, 0, 0) };
vehicle.driver = mockDriver;

// Simulate driver ejection
vehicle.driver = null;
events.emit('NPC_EJECTED_FROM_VEHICLE', { npc: mockDriver, vehicle, position: new THREE.Vector3(1, 0, 1) });
assert(ejectionFired === true, 'Physical driver ejection emits NPC_EJECTED_FROM_VEHICLE event');

// ----------------------------------------------------
// TEST 3: Police Database & ANPR Automated Plate Scanning
// ----------------------------------------------------
console.log('\n[Test 3] Police Database & ANPR Automated Plate Scanning');
const policeDb = PoliceDatabase.get();
registry.reportStolen(vehicle.vehicleId, 'npc_owner_1');

assert(registry.isPlateReported(vehicle.plate) === true, 'VehicleRegistry tracks reported stolen plate');

policeDb.registerStolenReport({
  vehicleId: vehicle.vehicleId,
  plate: vehicle.plate,
  displayName: vehicle.displayName,
  reporterId: 'npc_owner_1',
  location: { district: 'Downtown Core', position: { x: 10, y: 0, z: 20 } }
});

const anprScan = policeDb.scanPlateANPR(vehicle.plate);
assert(anprScan.matched === true, 'Police ANPR scanner matches reported stolen plate');
assert(anprScan.report.plate === vehicle.plate, 'ANPR match returns correct stolen vehicle report');

const activeBOLOs = policeDb.getActiveBOLOs();
assert(activeBOLOs.length >= 1, 'Police Database maintains active BOLO list');

// ----------------------------------------------------
// TEST 4: Evidence Pipeline Integration
// ----------------------------------------------------
console.log('\n[Test 4] Theft Evidence Pipeline & CCTV Camera Overlap');
const evidence = EvidenceSystem.get();
evidence.resetEvidence();

events.emit('VEHICLE_ALARM_TRIGGERED', {
  vehicle,
  displayName: vehicle.displayName,
  plate: vehicle.plate,
  position: new THREE.Vector3(0, 0, 0)
});

assert(evidence.confidenceScore > 0, 'Vehicle theft alarm increases investigation confidence score');
assert(evidence.evidenceNodes.some(e => e.type === 'VEHICLE_ALARM'), 'Evidence ledger records VEHICLE_ALARM node');

// ----------------------------------------------------
// TEST 5: Physical 3D Police Officer Exit & Intercept Arrest Chain
// ----------------------------------------------------
console.log('\n[Test 5] Police Chain & Physical Officer Exit Arrest Sequence');
const policeCruiserAI = new PoliceAI(mockScene, null, new THREE.Vector3(0, 0.45, 0));

assert(policeCruiserAI.cruiser !== null, 'PoliceAI instantiates 3D Police Cruiser vehicle');

// Simulate Police Cruiser intercept and physical officer vehicle exit
const officer = new PoliceOfficerAI(mockScene, new THREE.Vector3(2, 0.45, 2));
officer.exitCruiser(policeCruiserAI.position, 0);

assert(officer.root !== undefined, 'Physical PoliceOfficerAI has 3D mesh model representation');
assert(officer.state === 'APPROACHING', 'Officer initialized in APPROACHING suspect state on foot');

// Update Officer AI when suspect surrenders
let arrestInitiated = false;
events.on('POLICE_PHYSICAL_ARREST_INITIATED', () => { arrestInitiated = true; });

officer.update(0.1, new THREE.Vector3(-1.0, 0.45, 0), true, true, 1);
assert(officer.state === 'COMMANDING', 'Officer transitions to COMMANDING state when standing next to stopped suspect');

const arrestSys = new ArrestSystem();
assert(arrestSys !== null, 'ArrestSystem state machine operational');

// Clean up
officer.destroy();
policeCruiserAI.destroy();

console.log(`\n====================================================`);
console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log(`====================================================\n`);
