/**
 * Game FreeWorld - Phase 7 Verification Test Suite
 * Tests NPCPersonality 8-trait matrix & decision scoring, NPCMemory 10-event ledger,
 * NPCSchedule 24h routine states, DarknessBehavior night/blackout survival,
 * and the 8-step NPCBrain decision pipeline with personality differentiation.
 */

import { NPCPersonality } from '../src/NPC/NPCPersonality.js';
import { NPCMemory } from '../src/NPC/NPCMemory.js';
import { NPCSchedule, SCHEDULE_STATES } from '../src/NPC/NPCSchedule.js';
import { DarknessBehavior } from '../src/NPC/DarknessBehavior.js';
import { NPCBrain } from '../src/NPC/NPCBrain.js';
import { NPCBase } from '../src/NPC/NPCBase.js';
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

console.log('=== FREEWORLD PHASE 7 NPC BRAIN, MEMORY, PERSONALITY & NIGHT BEHAVIOR TEST SUITE ===\n');

// Mock Three.js Scene & NavGraph
const mockScene = { add: () => {}, remove: () => {} };

// ----------------------------------------------------
// TEST 1: NPCPersonality 8-Trait Matrix & Archetypes
// ----------------------------------------------------
console.log('[Test 1] NPCPersonality 8-Trait Matrix & Archetypes');
const pSec = new NPCPersonality({ archetype: 'SECURITY' });
const pFearful = new NPCPersonality({ archetype: 'CIVILIAN_FEARFUL' });
const pCurious = new NPCPersonality({ archetype: 'CIVILIAN_CURIOUS' });

assert(pSec.bravery > pFearful.bravery, 'Security archetype bravery (0.85) exceeds fearful civilian (0.15)');
assert(pFearful.fear > pSec.fear, 'Fearful civilian fear score (0.85) exceeds security archetype (0.15)');
assert(pCurious.curiosity === 0.90, 'Curious archetype curiosity trait is 0.90');

const fightScoreSec = pSec.evaluateFightScore(1.0, true);
const fightScoreFearful = pFearful.evaluateFightScore(1.0, false);
assert(fightScoreSec > fightScoreFearful, 'Security fight score exceeds fearful civilian fight score');

const fleeScoreFearful = pFearful.evaluateFleeScore(1.0, 50);
const fleeScoreSec = pSec.evaluateFleeScore(1.0, 0);
assert(fleeScoreFearful > fleeScoreSec, 'Fearful civilian flee score exceeds security flee score');

// ----------------------------------------------------
// TEST 2: NPCMemory 10-Event Ledger & Decay
// ----------------------------------------------------
console.log('\n[Test 2] NPCMemory 10-Event Ledger & Confidence Decay');
const memory = new NPCMemory();

memory.recordEvent('playerSeen', { position: new THREE.Vector3(10, 0, 10), impact: 10 });
memory.recordEvent('crimeWitnessed', { position: new THREE.Vector3(20, 0, 20), impact: 40 });
memory.recordEvent('friendLost', { position: new THREE.Vector3(25, 0, 25), impact: 60 });
memory.recordEvent('zombieEncounter', { position: new THREE.Vector3(30, 0, 30), impact: 50 });
memory.recordEvent('buildingDestroyed', { position: new THREE.Vector3(35, 0, 35), impact: 30 });
memory.recordEvent('policeEncounter', { position: new THREE.Vector3(40, 0, 40), impact: 20 });
memory.recordEvent('vehicleStolen', { position: new THREE.Vector3(45, 0, 45), impact: 35 });
memory.recordEvent('survivorSaved', { position: new THREE.Vector3(50, 0, 50), impact: 30 });
memory.recordEvent('betrayal', { position: new THREE.Vector3(55, 0, 55), impact: 70 });
memory.recordEvent('importantConversation', { position: new THREE.Vector3(60, 0, 60), impact: 15 });

assert(memory.hasMemoryOf('playerSeen') === true, 'Memory tracks playerSeen event');
assert(memory.hasMemoryOf('crimeWitnessed') === true, 'Memory tracks crimeWitnessed event');
assert(memory.hasMemoryOf('friendLost') === true, 'Memory tracks friendLost event');
assert(memory.hasMemoryOf('zombieEncounter') === true, 'Memory tracks zombieEncounter event');
assert(memory.hasMemoryOf('vehicleStolen') === true, 'Memory tracks vehicleStolen event');

const recent = memory.getRecentMemories(5);
assert(recent.length === 5, 'getRecentMemories returns requested memory limit');

// Memory decay check
memory.update(10.0);
assert(recent[0].confidence < 1.0, 'Memory confidence decays over time');

// ----------------------------------------------------
// TEST 3: NPCSchedule 24h Daily Routine State Machine
// ----------------------------------------------------
console.log('\n[Test 3] NPCSchedule 24h Daily Routine State Machine');
const schedule = new NPCSchedule();
schedule.occupation = { title: 'Executive Banker', workHour: 9, homeHour: 17 };

schedule.evaluateSchedule(14, false, false); // 2 PM workday
assert(schedule.state === SCHEDULE_STATES.WORK, '2 PM solar hour transitions schedule to WORK state');

schedule.evaluateSchedule(23, false, false); // 11 PM nighttime
assert(schedule.state === SCHEDULE_STATES.SLEEP, '11 PM solar hour transitions schedule to SLEEP state');

schedule.evaluateSchedule(12, true, false); // Emergency override
assert(schedule.state === SCHEDULE_STATES.EMERGENCY, 'Emergency condition overrides schedule to EMERGENCY state');

schedule.evaluateSchedule(12, false, true); // Evacuation override
assert(schedule.state === SCHEDULE_STATES.EVACUATION, 'Evacuation condition overrides schedule to EVACUATION state');

// ----------------------------------------------------
// TEST 4: DarknessBehavior & Light Seeking Vector Navigation
// ----------------------------------------------------
console.log('\n[Test 4] DarknessBehavior & Light Seeking Navigation');
const npcDark = new NPCBase(mockScene, null, null);
npcDark.hasFlashlight = true;

const darkness = new DarknessBehavior(npcDark);
darkness.evaluateDarkness(0.1, true, 23); // Blackout at night
assert(npcDark.isFlashlightActive === true, 'NPC with flashlight activates flashlight in blackout');

const npcNoLight = new NPCBase(mockScene, null, null);
npcNoLight.hasFlashlight = false;
const darknessNoLight = new DarknessBehavior(npcNoLight);
darknessNoLight.evaluateDarkness(0.1, true, 23);
assert(npcNoLight.isPhoneLightActive === true, 'NPC without flashlight uses phone light in blackout');

// Light Seeking Vector
const streetlamp = { position: new THREE.Vector3(15, 0, 15) };
const seekVector = darkness.findLightSeekingVector([streetlamp]);
assert(seekVector !== null && seekVector.x > 0, 'Calculated light-seeking vector heading toward nearest streetlamp');

// ----------------------------------------------------
// TEST 5: 8-Step Brain Pipeline & Personality Differentiation
// ----------------------------------------------------
console.log('\n[Test 5] 8-Step Brain Pipeline & Personality Differentiation');
const braveNPC = new NPCBase(mockScene, null, null, { archetype: 'SECURITY' });
const fearfulNPC = new NPCBase(mockScene, null, null, { archetype: 'CIVILIAN_FEARFUL' });

const threatPos = new THREE.Vector3(5, 0, 5);

// Expose same threat event to both NPCs
braveNPC.brain.triggerOwnerReaction(threatPos);
fearfulNPC.brain.triggerOwnerReaction(threatPos);

assert(braveNPC.brain.state === 'RESISTING', 'High-bravery security NPC chooses RESISTING state in threat situation');
assert(fearfulNPC.brain.state === 'FLEEING' || fearfulNPC.brain.state === 'SURRENDER', 'High-fear civilian NPC chooses FLEEING/SURRENDER state in threat situation');
assert(braveNPC.brain.state !== fearfulNPC.brain.state, 'NPCs with different personalities make distinctly different decisions');

console.log(`\n====================================================`);
console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log(`====================================================\n`);
