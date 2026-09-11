/**
 * Game FreeWorld - Phase 4 Verification Test Suite
 * Tests VehicleRegistry, VehicleBase tracking attributes (plate, fuel, condition, location),
 * VehiclePhysics metrics, VehicleAI navigation & emergency siren yielding,
 * TrafficSignals state machine, and persistence.
 */

import { VehicleRegistry } from '../src/Vehicles/VehicleRegistry.js';
import { VehicleBase } from '../src/Vehicles/VehicleBase.js';
import { VehicleFactory } from '../src/Vehicles/VehicleTypes.js';
import { VehicleAI } from '../src/Vehicles/VehicleAI.js';
import { TrafficSignals, SIGNAL_STATES } from '../src/Traffic/TrafficSignals.js';
import { NavigationGraph } from '../src/World/NavigationGraph.js';
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

console.log('=== FREEWORLD PHASE 4 ROAD NETWORK, TRAFFIC & VEHICLES TEST SUITE ===\n');

// Mock Three.js Scene
const mockScene = { add: () => {}, remove: () => {} };

// ----------------------------------------------------
// TEST 1: VehicleRegistry & Tracking Attributes
// ----------------------------------------------------
console.log('[Test 1] VehicleRegistry & Authoritative Tracking Attributes');
const registry = VehicleRegistry.get();
const plate = registry.generateLicensePlate();
assert(typeof plate === 'string' && plate.startsWith('FW-'), 'Generated valid license plate format (FW-xxxx-xx)');

const testCar = VehicleFactory.createKestrelSedan(mockScene);
assert(testCar.vehicleId !== undefined, 'Vehicle assigned unique vehicleId');
assert(testCar.plate !== undefined && testCar.plate.length > 5, 'Vehicle assigned license plate');
assert(testCar.fuel === 100, 'Vehicle initial fuel level is 100%');
assert(testCar.condition === 100, 'Vehicle initial condition is 100%');

const regRecord = registry.getVehicle(testCar.vehicleId);
assert(regRecord !== undefined, 'Vehicle successfully registered in global VehicleRegistry');
assert(regRecord.type === 'car', 'Registered vehicle type is car');

// ----------------------------------------------------
// TEST 2: Physics Metrics across Vehicle Classes
// ----------------------------------------------------
console.log('\n[Test 2] Physics Metrics across Vehicle Classes');
const supercar = VehicleFactory.createApexGTX(mockScene);
const truck = VehicleFactory.createGoliathTruck(mockScene);
const bike = VehicleFactory.createPhantomBike(mockScene);

assert(supercar.maxSpeed > truck.maxSpeed, 'Supercar max speed (52m/s) exceeds heavy truck (34m/s)');
assert(bike.steeringSensitivity > truck.steeringSensitivity, 'Motorcycle steering sensitivity exceeds heavy truck');
assert(truck.physics.mass > supercar.physics.mass, 'Truck mass (4200kg) exceeds supercar mass (1300kg)');

// Fuel Depletion & Engine Stall
supercar.driver = { id: 'player' };
supercar.speed = 15;
supercar.updatePhysics(0.5, { isKeyDown: () => false });
assert(supercar.fuel < 100, 'Driving depletes vehicle fuel level');

supercar.fuel = 0;
supercar.updatePhysics(0.5, { isKeyDown: () => false });
assert(supercar.speed < 15, 'Empty fuel tank stalls vehicle and reduces speed');

// ----------------------------------------------------
// TEST 3: TrafficSignals & Emergency Override
// ----------------------------------------------------
console.log('\n[Test 3] TrafficSignals State Machine');
const signals = new TrafficSignals();
assert(signals.getSignalState('EW') === SIGNAL_STATES.GREEN, 'Initial EW traffic light phase is GREEN');

signals.update(12.5); // Advance past EW green time (12s)
assert(signals.getSignalState('EW') === SIGNAL_STATES.AMBER, 'Traffic light transitions to AMBER');

// Test Emergency Priority Override
signals.setEmergencyOverride(true);
assert(signals.getSignalState('EW') === SIGNAL_STATES.EMERGENCY_OVERRIDE, 'Emergency priority override overrides light phase to EMERGENCY_OVERRIDE');
assert(signals.isGreenForDirection('EW') === true, 'Emergency override grants green corridor to all directions');

signals.setEmergencyOverride(false);

// ----------------------------------------------------
// TEST 4: Vehicle AI Navigation & Emergency Yielding
// ----------------------------------------------------
console.log('\n[Test 4] Vehicle AI Navigation & Emergency Yielding');
const navGraph = new NavigationGraph();
const nodeA = { id: 0, position: new THREE.Vector3(0, 0, 0), connections: [] };
const nodeB = { id: 1, position: new THREE.Vector3(20, 0, 0), connections: [] };
nodeA.connections.push(nodeB);

const npcCar = VehicleFactory.createKestrelSedan(mockScene);
const ai = new VehicleAI(npcCar, navGraph, nodeA);

assert(ai.mode === 'CRUISE', 'VehicleAI initialized in CRUISE mode');

// Test Emergency Vehicle Yielding
const policeCar = VehicleFactory.createPoliceCruiser(mockScene);
policeCar.isEmergencyVehicle = true;
policeCar.mesh.position.set(0, 0, 5); // Position near NPC car

ai.update(0.1, null, [policeCar]);
assert(ai.isYieldingToEmergency === true, 'NPC VehicleAI detects approaching emergency vehicle and yields right of way');

// ----------------------------------------------------
// TEST 5: Save / Load Persistence
// ----------------------------------------------------
console.log('\n[Test 5] VehicleRegistry Save / Load Persistence');
const serializedRegistry = registry.toJSON();
assert(serializedRegistry.vehicles.length >= 4, 'Serialized registry contains registered vehicles');

const newRegistry = new VehicleRegistry();
newRegistry.fromJSON(serializedRegistry);
const restoredCar = newRegistry.getVehicle(testCar.vehicleId);
assert(restoredCar !== undefined, 'Restored vehicle from JSON payload');
assert(restoredCar.plate === testCar.plate, 'Restored vehicle license plate matches original');

console.log(`\n====================================================`);
console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log(`====================================================\n`);
