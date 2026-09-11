/**
 * FreeWorld Engine - Phase 11 Automated Test Suite
 * Validates Outbreak Director Telemetry, District State Machine, 10 Emergency Event Types,
 * Unscripted Emergent Event Chains, Autonomous World Evolution, and Save/Load Persistence.
 */

import { OutbreakDirector } from '../src/WorldSystems/OutbreakDirector.js';
import { CityCollapseEngine, DISTRICT_SAFETY_STATES } from '../src/WorldSystems/CityCollapseEngine.js';
import { SystemicChainEngine, SYSTEMIC_EVENT_TYPES } from '../src/WorldSystems/SystemicChainEngine.js';
import { events } from '../src/Core/EventBus.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
    total++;
    if (condition) {
        passed++;
        console.log(`  ✓ PASS: ${message}`);
    } else {
        console.error(`  ✕ FAIL: ${message}`);
    }
}

console.log('=== FREEWORLD PHASE 11 OUTBREAK DIRECTOR & CITY COLLAPSE TEST SUITE ===');

// 1. OUTBREAK DIRECTOR TELEMETRY TEST
console.log('\n[Test 1] Outbreak Director Apocalypse Telemetry Tracking');
const director = new OutbreakDirector();
const initialTelemetry = director.getTelemetry();

assert(typeof initialTelemetry.outbreakLevel === 'number', 'OutbreakDirector tracks outbreakLevel (0-100%)');
assert(typeof initialTelemetry.infectedPopulation === 'number', 'OutbreakDirector tracks infectedPopulation');
assert(typeof initialTelemetry.zombiePopulation === 'number', 'OutbreakDirector tracks zombiePopulation');
assert(typeof initialTelemetry.survivorPopulation === 'number', 'OutbreakDirector tracks survivorPopulation');
assert(typeof initialTelemetry.policeCapacity === 'number', 'OutbreakDirector tracks policeCapacity');
assert(typeof initialTelemetry.hospitalCapacity === 'number', 'OutbreakDirector tracks hospitalCapacity');
assert(typeof initialTelemetry.infrastructureDamage === 'number', 'OutbreakDirector tracks infrastructureDamage');

// Test event updates to telemetry
events.emit('ENTITY_INFECTED', { entityId: 'test_1' });
assert(director.infectedPopulation === initialTelemetry.infectedPopulation + 1, 'ENTITY_INFECTED event updates infectedPopulation');

events.emit('NPC_TRANSFORMED_TO_ZOMBIE', { entityId: 'test_1' });
assert(director.zombiePopulation === initialTelemetry.zombiePopulation + 1, 'NPC_TRANSFORMED_TO_ZOMBIE event updates zombiePopulation');

// 2. 7-STAGE DISTRICT SAFETY STATE MACHINE TEST
console.log('\n[Test 2] 7-Stage District Safety State Machine');
const collapseEngine = new CityCollapseEngine();

const downtown = collapseEngine.getDistrictState('downtown');
assert(downtown !== null, 'Downtown district registered in collapse engine');

collapseEngine.adjustDistrictSafety('downtown', -25);
assert(downtown.state === DISTRICT_SAFETY_STATES.PANIC || downtown.state === DISTRICT_SAFETY_STATES.WARNING, 'Reducing district safety score transitions district to WARNING / PANIC state');

collapseEngine.adjustDistrictSafety('downtown', -40);
assert(downtown.state === DISTRICT_SAFETY_STATES.QUARANTINE || downtown.state === DISTRICT_SAFETY_STATES.COLLAPSE, 'Further safety reduction transitions district to QUARANTINE / COLLAPSE state');

collapseEngine.adjustDistrictSafety('downtown', -30);
assert(downtown.state === DISTRICT_SAFETY_STATES.OVERRUN, 'Safety score 0 transitions district to OVERRUN state');

// 3. 10 EMERGENCY EVENT TYPES TEST
console.log('\n[Test 3] 10 Emergency Event Types');
assert(Object.keys(SYSTEMIC_EVENT_TYPES).length === 10, 'Supports exactly 10 distinct emergency event types');

// 4. UNSCRIPTED EMERGENT EVENT CHAIN ENGINE TEST
console.log('\n[Test 4] Unscripted Emergent Domino Chain Engine');
const chainEngine = new SystemicChainEngine();

let dominoStepFired = false;
let firedEventNode = null;

events.on('SYSTEMIC_EMERGENT_STEP_FIRED', (node) => {
    dominoStepFired = true;
    firedEventNode = node;
});

// Trigger initial vehicle theft crime
events.emit('CRIME_COMMITTED', { type: 'VEHICLE_THEFT', position: { x: 10, y: 0, z: 10 } });
assert(dominoStepFired === true, 'Vehicle theft crime automatically triggered systemic POLICE_INCIDENT emergent step');
assert(firedEventNode.eventType === SYSTEMIC_EVENT_TYPES.POLICE_INCIDENT, 'Emergent step event type is POLICE_INCIDENT');

// Trigger crash step
events.emit('VEHICLE_CRASHED', { position: { x: 20, y: 0, z: 20 } });
const history = chainEngine.getChainHistory();
assert(history.some(h => h.eventType === SYSTEMIC_EVENT_TYPES.AMBULANCE), 'Crash automatically triggered unscripted AMBULANCE emergent step');
assert(history.some(h => h.eventType === SYSTEMIC_EVENT_TYPES.SURVIVOR_ENCOUNTER), 'Crash automatically triggered SURVIVOR_ENCOUNTER emergent step');

// Trigger building lockdown
events.emit('BUILDING_LOCKDOWN_TRIGGERED', { position: { x: 30, y: 0, z: 30 } });
assert(history.some(h => h.eventType === SYSTEMIC_EVENT_TYPES.POWER_FAILURE), 'Building lockdown automatically triggered POWER_FAILURE grid blackout step');

// 5. AUTONOMOUS WORLD EVOLUTION TEST
console.log('\n[Test 5] Autonomous World Evolution (Independent of Player Input)');
const initialLevel = director.outbreakLevel;
director.update(30.0); // Advance simulation by 30 seconds

assert(director.outbreakLevel > initialLevel, 'Outbreak Director autonomously advances outbreak level over time');

// 6. SAVE / LOAD PERSISTENCE TEST
console.log('\n[Test 6] Outbreak Telemetry & Collapse Serialization');
const directorJSON = director.toJSON();
const collapseJSON = collapseEngine.toJSON();

assert(typeof directorJSON.outbreakLevel === 'number', 'Outbreak Director telemetry serializes to JSON');
assert(typeof collapseJSON.downtown === 'object', 'District collapse states serialize to JSON');

const restoredDirector = new OutbreakDirector();
restoredDirector.fromJSON(directorJSON);
assert(restoredDirector.outbreakLevel === directorJSON.outbreakLevel, 'Outbreak Director restores exact outbreakLevel from JSON payload');

// SUMMARY
console.log(`\n==================================================`);
console.log(`PHASE 11 OUTBREAK DIRECTOR & COLLAPSE TEST SUMMARY: ${passed} / ${total} ASSERIONS PASSED`);
console.log(`==================================================`);

if (passed === total) {
    console.log('✓ ALL PHASE 11 OUTBREAK DIRECTOR & COLLAPSE TESTS PASSED!');
    process.exit(0);
} else {
    console.error('✕ SOME TESTS FAILED.');
    process.exit(1);
}
