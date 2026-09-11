/**
 * Game FreeWorld - Phase 3 Verification Test Suite
 * Tests BuildingStateEngine (9 States), InteriorGenerator, PowerManager,
 * NPC Night/Dark Space Behavior, and Save/Load Persistence.
 */

import { BuildingStateEngine, BUILDING_STATES } from '../src/World/BuildingStateEngine.js';
import { InteriorGenerator, ROOM_TYPES } from '../src/World/InteriorGenerator.js';
import { PowerManager } from '../src/World/PowerManager.js';
import { NPCBase } from '../src/NPC/NPCBase.js';
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

console.log('=== FREEWORLD PHASE 3 BUILDINGS, INTERIORS & POWER GRID TEST SUITE ===\n');

// ----------------------------------------------------
// TEST 1: BuildingStateEngine 9 States
// ----------------------------------------------------
console.log('[Test 1] BuildingStateEngine (9 Authoritative States)');
const bldgEngine = new BuildingStateEngine('bldg_test_01', BUILDING_STATES.NORMAL);
assert(bldgEngine.currentState === BUILDING_STATES.NORMAL, 'Initial state is NORMAL');
assert(bldgEngine.powerConnected === true, 'NORMAL state power is connected');

// Cycle through all 9 states
const statesToTest = Object.values(BUILDING_STATES);
statesToTest.forEach(state => {
  bldgEngine.setState(state);
  const cfg = bldgEngine.getStateConfig();
  assert(cfg.state === state, `Building state set to ${state}`);

  if (state === BUILDING_STATES.LOCKDOWN) {
    assert(cfg.doorsLocked === true && cfg.shuttersClosed === true, 'LOCKDOWN engages doors and security shutters');
  } else if (state === BUILDING_STATES.SAFEHOUSE) {
    assert(cfg.zombieAccessAllowed === false && cfg.hasBackupGenerator === true, 'SAFEHOUSE blocks zombies and enables generator');
  } else if (state === BUILDING_STATES.ABANDONED) {
    assert(cfg.powerConnected === false && cfg.npcOccupancyCount === 0, 'ABANDONED disconnects power and has 0 NPCs');
  }
});

// Damage testing
bldgEngine.setState(BUILDING_STATES.NORMAL);
bldgEngine.applyDamage(60);
assert(bldgEngine.currentState === BUILDING_STATES.DAMAGED, 'Applying 60 damage transitions building to DAMAGED state');

// ----------------------------------------------------
// TEST 2: InteriorGenerator Hierarchy
// ----------------------------------------------------
console.log('\n[Test 2] InteriorGenerator Building Hierarchy');
const mockScene = { add: () => {}, remove: () => {} };
const interiorGen = new InteriorGenerator(mockScene);
const mockBuilding = {
  id: 'bldg_test_01',
  center: new THREE.Vector3(0, 0, 0),
  sizeX: 30,
  sizeZ: 30,
  levels: 3,
  doorsLocked: false
};

const interior = interiorGen.generateInterior(mockBuilding);
assert(interior.floors.length === 3, 'Interior hierarchy generated 3 playable floors');
assert(interior.rooms.length > 0, 'Interior hierarchy contains generated rooms');
assert(interior.doors.length > 0, 'Interior hierarchy contains entrance & room doors');
assert(interior.windows.length > 0, 'Interior hierarchy contains window access points');
assert(interior.furniture.length > 0, 'Interior hierarchy contains furniture props');
assert(interior.lighting.mainLights.length > 0, 'Interior hierarchy contains main ceiling lights');
assert(interior.lighting.emergencyLights.length > 0, 'Interior hierarchy contains emergency lights');
assert(interior.zombieAccessPoints.length > 0, 'Interior hierarchy contains zombie access points');

// Power response
interior.setPower(false, true); // Main power off, emergency power on
assert(interior.powerStatus.mainPower === false, 'Interior main power set to off');
assert(interior.powerStatus.emergencyPower === true, 'Interior emergency power set to on');

// ----------------------------------------------------
// TEST 3: PowerManager Infrastructure & Cascading Blackout
// ----------------------------------------------------
console.log('\n[Test 3] PowerManager Infrastructure');
const powerManager = new PowerManager();
powerManager.registerBuilding('bldg_test_01', bldgEngine, 'Downtown Core');

assert(powerManager.isMasterGridOnline === true, 'Master power grid initially online');
assert(powerManager.getTrafficSignalMode('Downtown Core') === 'NORMAL_CYCLED', 'Traffic signals normal when powered');

// Trigger District Blackout
powerManager.setDistrictPower('Downtown Core', false);
assert(bldgEngine.powerConnected === false, 'District blackout cuts power to building state engine');
assert(powerManager.getTrafficSignalMode('Downtown Core') === 'FLASHING_AMBER', 'Traffic signals switch to FLASHING_AMBER during blackout');

// Restore Power
powerManager.setDistrictPower('Downtown Core', true);
assert(bldgEngine.powerConnected === true, 'Restoring district power restores building power');

// Trip individual building breaker
powerManager.setBuildingBreaker('bldg_test_01', false); // Engaged = false -> tripped
assert(bldgEngine.powerConnected === false, 'Tripping building circuit breaker cuts local building power');

// ----------------------------------------------------
// TEST 4: NPC Night & Dark Space Behavior
// ----------------------------------------------------
console.log('\n[Test 4] NPC Night & Dark Space Behavior');
const navGraph = new NavigationGraph();
const initialNode = { id: 0, position: new THREE.Vector3(0, 0, 0), connections: [] };
const npc = new NPCBase(mockScene, navGraph, initialNode);

assert(npc.isFlashlightActive === false, 'NPC flashlight initially off in lit area');

// Simulate entering dark space / blackout
npc.inDarkSpace = true;
npc.update(0.1);

if (npc.hasFlashlight) {
  assert(npc.isFlashlightActive === true, 'NPC with flashlight activates flashlight in dark space');
} else {
  assert(npc.isPhoneLightActive === true, 'NPC without flashlight activates phone light screen in dark space');
}

// ----------------------------------------------------
// TEST 5: Save / Load Persistence
// ----------------------------------------------------
console.log('\n[Test 5] Save / Load Persistence');
bldgEngine.setState(BUILDING_STATES.SAFEHOUSE);
bldgEngine.generatorFuel = 85;

const bldgStateJSON = bldgEngine.toJSON();
const powerJSON = powerManager.toJSON();

// Restore into new instances
const restoredBldgEngine = new BuildingStateEngine('bldg_test_01');
restoredBldgEngine.fromJSON(bldgStateJSON);

assert(restoredBldgEngine.currentState === BUILDING_STATES.SAFEHOUSE, 'Restored building state is SAFEHOUSE');
assert(restoredBldgEngine.generatorFuel === 85, 'Restored generator fuel is 85%');
assert(restoredBldgEngine.zombieAccessAllowed === false, 'Restored zombie access is blocked');

const restoredPowerManager = new PowerManager();
restoredPowerManager.fromJSON(powerJSON);
assert(restoredPowerManager.isMasterGridOnline === powerManager.isMasterGridOnline, 'Restored master power grid status matches');

console.log(`\n====================================================`);
console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log(`====================================================\n`);
