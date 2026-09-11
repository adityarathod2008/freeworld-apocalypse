/**
 * FreeWorld Engine - Phase 8 Automated Test Suite
 * Validates Clue System (11 clue types), Clue Graph, Character Registry, and Investigation Manager.
 */

import { ClueSystem, CLUE_TYPES } from '../src/Investigation/ClueSystem.js';
import { ClueGraph } from '../src/Investigation/ClueGraph.js';
import { CharacterRegistry } from '../src/Investigation/CharacterRegistry.js';
import { InvestigationManager } from '../src/Investigation/InvestigationManager.js';
import { GameState } from '../src/Core/GameState.js';

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

console.log('--- FREEWORLD PHASE 8 TEST SUITE: INVESTIGATION & CLUES ---');

// Mock THREE.Scene if not running in full Browser DOM context
class MockScene {
    add() {}
    remove() {}
}

// 1. CLUE SYSTEM TEST (11 Clue Types)
console.log('\n1. Testing Clue System & 11 Clue Types...');
const mockScene = new MockScene();
const clueSystem = new ClueSystem(mockScene);

assert(Object.keys(CLUE_TYPES).length === 11, 'Supports exactly 11 distinct clue types');

const testClues = [
    { id: 'clue_blood_1', type: CLUE_TYPES.BLOOD_TRAILS, title: 'Blood Trail', position: { x: 10, y: 0, z: 10 } },
    { id: 'clue_phone_1', type: CLUE_TYPES.PHONES, title: 'Burner Phone', position: { x: 20, y: 0, z: 20 } },
    { id: 'clue_cctv_1', type: CLUE_TYPES.CCTV, title: 'Security Camera Footage', position: { x: 30, y: 0, z: 30 } },
    { id: 'clue_note_1', type: CLUE_TYPES.NOTES, title: 'Encrypted Note', position: { x: 40, y: 0, z: 40 } },
    { id: 'clue_photo_1', type: CLUE_TYPES.PHOTOS, title: 'Surveillance Photo', position: { x: 50, y: 0, z: 50 } },
    { id: 'clue_radio_1', type: CLUE_TYPES.RADIO_BROADCASTS, title: 'Emergency Broadcast Tape', position: { x: 60, y: 0, z: 60 } },
    { id: 'clue_door_1', type: CLUE_TYPES.BROKEN_DOORS, title: 'Forced Entry Markings', position: { x: 70, y: 0, z: 70 } },
    { id: 'clue_bldg_1', type: CLUE_TYPES.DAMAGED_BUILDINGS, title: 'Explosive Damage Pattern', position: { x: 80, y: 0, z: 80 } },
    { id: 'clue_med_1', type: CLUE_TYPES.MEDICAL_RECORDS, title: 'Patient Quarantine Log', position: { x: 90, y: 0, z: 90 } },
    { id: 'clue_witness_1', type: CLUE_TYPES.SURVIVOR_TESTIMONY, title: 'Dockworker Statement', position: { x: 100, y: 0, z: 100 } },
    { id: 'clue_veh_1', type: CLUE_TYPES.ABANDONED_VEHICLES, title: 'Stolen Getaway Sedan', position: { x: 110, y: 0, z: 110 } }
];

testClues.forEach(c => clueSystem.registerClue(c));
assert(clueSystem.clues.size >= 11, 'All 11 clue types registered successfully');

// Discovery distance check
clueSystem.update({ x: 10, y: 0, z: 10 }, 0.016);
const bloodClue = clueSystem.getClue('clue_blood_1');
assert(bloodClue.discovered === true, 'Clue discovered when player enters proximity (8m radius)');

const inspected = clueSystem.inspectClue('clue_blood_1');
assert(inspected.inspected === true, 'Clue marked as inspected');
assert(clueSystem.evidenceStore.includes(bloodClue), 'Inspected clue stored in evidence inventory');

// 2. CLUE GRAPH TEST (Non-decorative progression engine)
console.log('\n2. Testing Clue Graph & Narrative Objective Unlocks...');
const clueGraph = new ClueGraph();

clueGraph.connect('clue_blood_1', 'loc_pier4', 'location');
clueGraph.connect('clue_blood_1', 'char_marco', 'character');
clueGraph.connect('clue_blood_1', 'obj_warehouse_breach', 'objective');

const graphLinks = clueGraph.getConnections('clue_blood_1');
assert(graphLinks.locations.includes('loc_pier4'), 'Clue graph connects to Location node');
assert(graphLinks.characters.includes('char_marco'), 'Clue graph connects to Character node');
assert(graphLinks.objectives.includes('obj_warehouse_breach'), 'Clue graph connects to Story Objective node');

// 3. CHARACTER REGISTRY TEST
console.log('\n3. Testing Character Registry (Trust, Relationships, Memory, Dialogue)...');
const charRegistry = new CharacterRegistry();

const marco = charRegistry.getCharacter('char_marco');
assert(marco !== null, 'Default character Marco Vance initialized');
assert(marco.trust === 30, 'Initial character trust level recorded');

const newTrust = charRegistry.updateTrust('char_marco', 25);
assert(newTrust === 55, 'Character trust increased by +25 to 55');

charRegistry.setRelationship('char_marco', 'char_dr_vance', 'allied');
assert(marco.relationships['char_dr_vance'] === 'allied', 'Character relationship updated');

charRegistry.recordMemory('char_marco', 'Player recovered stolen ledger');
assert(marco.memory.some(m => m.event === 'Player recovered stolen ledger'), 'Event added to character memory ledger');

const dialogueOptions = charRegistry.getAvailableDialogue('char_marco');
assert(dialogueOptions.length === 2, 'Available dialogue filtered by trust level (requiresTrust <= 55)');

// 4. INVESTIGATION MANAGER INTEGRATION TEST
console.log('\n4. Testing Full Investigation Manager Integration...');
const gameState = GameState.get();
const investigationManager = new InvestigationManager(mockScene, gameState);

// Register clue in manager's clue system
investigationManager.clueSystem.registerClue({
    id: 'clue_cctv_biolabs',
    type: CLUE_TYPES.CCTV,
    title: 'BioLabs Sublevel Tape',
    position: { x: 310, y: 12, z: -80 }
});

let objectiveUnlockedEventFired = false;
let unlockedObjectiveData = null;

investigationManager.onObjectiveUnlocked((obj) => {
    objectiveUnlockedEventFired = true;
    unlockedObjectiveData = obj;
});

// Inspect clue through manager
const result = investigationManager.inspectClue('clue_cctv_biolabs');
assert(result !== null, 'InvestigationManager successfully inspected clue');
assert(result.connections.objectives.includes('obj_recover_patient_logs'), 'Clue graph retrieved objective connection');
assert(objectiveUnlockedEventFired === true, 'Objective unlocked notification callback fired');
assert(unlockedObjectiveData.id === 'obj_recover_patient_logs', 'Unlocked objective ID matches graph connection');

// Verify GameState updated with unlocked objectives and clues
assert(gameState.investigationState.discoveredClues.includes('clue_cctv_biolabs'), 'GameState.investigationState updated with discovered clue');
assert(gameState.storyState.activeObjectives.some(o => o.id === 'obj_recover_patient_logs'), 'GameState.storyState updated with active narrative objective');

// Verify character trust boosted via graph connection
const drVance = investigationManager.characterRegistry.getCharacter('char_dr_vance');
assert(drVance.trust === 35, 'Linked character Dr. Vance trust boosted by +15 on inspecting relevant clue');

// SUMMARY
console.log(`\n==================================================`);
console.log(`PHASE 8 INVESTIGATION & CLUES TEST SUMMARY: ${passed} / ${total} ASSERIONS PASSED`);
console.log(`==================================================`);

if (passed === total) {
    console.log('✓ ALL PHASE 8 INVESTIGATION TESTS PASSED!');
    process.exit(0);
} else {
    console.error('✕ SOME TESTS FAILED.');
    process.exit(1);
}
