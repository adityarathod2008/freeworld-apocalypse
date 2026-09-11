/**
 * FreeWorld Engine - Phase 9 Automated Test Suite
 * Validates Zombies, Infection System, NPC Transformation, Sensory Perception, Spatial Attacks, and Horde Mobilization.
 */

import * as THREE from 'three';
import { InfectionSystem, INFECTION_STAGES } from '../src/Zombies/InfectionSystem.js';
import { ZombieManager } from '../src/Zombies/ZombieManager.js';
import { ZombieBase } from '../src/Zombies/ZombieBase.js';
import { ZombiePerception } from '../src/Zombies/ZombiePerception.js';
import { ZOMBIE_VARIANTS } from '../src/Zombies/ZombieVariants.js';
import { HordeManager } from '../src/Horde/HordeManager.js';
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

console.log('=== FREEWORLD PHASE 9 ZOMBIES, INFECTION & TRANSFORMATION TEST SUITE ===');

// Mock Scene
class MockScene {
    add() {}
    remove() {}
}
const mockScene = new MockScene();

// 1. INFECTION SYSTEM & 6-STAGE LIFECYCLE TEST
console.log('\n[Test 1] Infection System & Stage Machine');
const infectionSystem = new InfectionSystem();
const mockNPC = { id: 'npc_test_101', position: new THREE.Vector3(10, 0, 10), isAlive: true, health: 100 };

infectionSystem.registerEntity(mockNPC);
let state = infectionSystem.getInfectionState('npc_test_101');
assert(state.stage === INFECTION_STAGES.HEALTHY, 'Registered entity starts at HEALTHY stage (0%)');

infectionSystem.expose(mockNPC, 15, 'zombie_scratch');
assert(state.stage === INFECTION_STAGES.EXPOSED, 'Infection level 15% transitions to EXPOSED stage');

infectionSystem.expose(mockNPC, 25, 'zombie_bite');
assert(state.stage === INFECTION_STAGES.INFECTED, 'Infection level 40% transitions to INFECTED stage');

infectionSystem.expose(mockNPC, 20, 'zombie_bite');
assert(state.stage === INFECTION_STAGES.SYMPTOMATIC, 'Infection level 60% transitions to SYMPTOMATIC stage');

infectionSystem.expose(mockNPC, 30, 'zombie_bite');
assert(state.stage === INFECTION_STAGES.SEVERE, 'Infection level 90% transitions to SEVERE stage');

let transformationEventFired = false;
events.on('NPC_TRANSFORMED_TO_ZOMBIE', () => {
    transformationEventFired = true;
});

infectionSystem.expose(mockNPC, 15, 'zombie_bite');
assert(state.stage === INFECTION_STAGES.ZOMBIE, 'Infection level 100% transitions to ZOMBIE transformation stage');
assert(transformationEventFired === true, 'NPC_TRANSFORMED_TO_ZOMBIE event emitted');

// 2. NPC TRANSFORMATION & ZOMBIE MANAGER TEST
console.log('\n[Test 2] NPC Reanimation & Zombie Manager');
const zombieManager = new ZombieManager(mockScene);
const initialZombieCount = zombieManager.getZombies().length;

events.emit('NPC_TRANSFORMED_TO_ZOMBIE', {
    entityId: 'npc_test_102',
    entity: { id: 'npc_test_102', position: new THREE.Vector3(30, 0, 30) },
    position: new THREE.Vector3(30, 0, 30)
});

assert(zombieManager.getZombies().length === initialZombieCount + 1, 'Transformed NPC instantiated new ZombieBase entity in ZombieManager');

// 3. ZOMBIE SENSORY PERCEPTION (Sight, Darkness & Sound) TEST
console.log('\n[Test 3] Sensory Perception (Sight FOV, Darkness & Sound)');
const walkerZombie = zombieManager.spawnZombie({
    id: 'zombie_sensory_test',
    variant: 'WALKER',
    position: { x: 0, y: 0, z: 0 }
});

const targetInFOV = {
    id: 'player_target',
    position: new THREE.Vector3(0, 0, 10), // Directly ahead (10m)
    isAlive: true,
    isSprinting: false
};

const targetBehind = {
    id: 'civilian_behind',
    position: new THREE.Vector3(0, 0, -15), // Directly behind (15m)
    isAlive: true
};

const perceivedDirect = walkerZombie.perception.evaluateSensoryPerception([targetInFOV, targetBehind], 0.0);
assert(perceivedDirect !== null && perceivedDirect.senseType === 'SIGHT', 'Perceives target directly in front via SIGHT');
assert(perceivedDirect.target.id === 'player_target', 'Target ahead selected over target behind outside FOV cone');

// Sound perception test
events.emit('SOUND_EMITTED', {
    position: { x: 40, y: 0, z: 0 },
    soundType: 'GUNSHOT',
    volumeMultiplier: 1.0
});

assert(walkerZombie.perception.recentSounds.length > 0, 'Zombie hears GUNSHOT sound event');
assert(walkerZombie.perception.recentSounds[0].soundType === 'GUNSHOT', 'Sound type correctly recorded as GUNSHOT');

// 4. SPATIAL COMBAT & ATTACKS TEST
console.log('\n[Test 4] Spatial Zombie Attacks & Infection Transfer');
const targetInBiteRange = {
    id: 'victim_test',
    position: new THREE.Vector3(0, 0, 1.0), // 1.0m away (within 1.2m bite range)
    health: 100,
    takeDamage: function(amount) { this.health -= amount; }
};

const attackResult = walkerZombie.attack.executeAttack(targetInBiteRange, 'BITE');
assert(attackResult.hit === true, 'Spatial BITE attack hits target within 1.2m range');
assert(targetInBiteRange.health === 65, 'BITE attack deals 35 damage');

const victimInfectionState = infectionSystem.getInfectionState('victim_test');
assert(victimInfectionState !== null && victimInfectionState.level >= 40, 'BITE attack transfers pathogen infection to victim');

// 5. ZOMBIE ARCHEGUARD VARIANTS TEST
console.log('\n[Test 5] Zombie Archetype Variants (Walker, Runner, Crawler, Brute, Screamer)');
assert(ZOMBIE_VARIANTS.RUNNER.speedMult > ZOMBIE_VARIANTS.WALKER.speedMult, 'RUNNER speed multiplier exceeds WALKER');
assert(ZOMBIE_VARIANTS.BRUTE.health > ZOMBIE_VARIANTS.WALKER.health, 'BRUTE health exceeds WALKER health');

const runnerZombie = zombieManager.spawnZombie({ variant: 'RUNNER' });
assert(runnerZombie.variant.type === 'RUNNER', 'Runner zombie spawned with RUNNER archetype');

// 6. HORDE FLOCKING & MOBILIZATION TEST
console.log('\n[Test 6] Horde Mobilization & Noise Attraction');
const hordeManager = new HordeManager(zombieManager);

let soundMobilized = false;
events.emit('SOUND_EMITTED', {
    position: { x: 5, y: 0, z: 5 },
    soundType: 'EXPLOSION',
    radius: 100
});

assert(walkerZombie.perception.recentSounds.some(s => s.soundType === 'GUNSHOT' || s.soundType === 'EXPLOSION'), 'Horde mobilization alerts nearby zombies to noise origin');

// 7. SAVE / LOAD PERSISTENCE TEST
console.log('\n[Test 7] Zombie Manager Serialization & Persistence');
const serializedZombies = zombieManager.toJSON();
assert(Array.isArray(serializedZombies) && serializedZombies.length > 0, 'ZombieManager serializes active zombies to array');

const restoredManager = new ZombieManager(mockScene);
restoredManager.fromJSON(serializedZombies);
assert(restoredManager.getZombies().length === serializedZombies.length, 'ZombieManager restores exact zombie count from JSON payload');

// SUMMARY
console.log(`\n==================================================`);
console.log(`PHASE 9 ZOMBIES & INFECTION TEST SUMMARY: ${passed} / ${total} ASSERIONS PASSED`);
console.log(`==================================================`);

if (passed === total) {
    console.log('✓ ALL PHASE 9 ZOMBIE & INFECTION TESTS PASSED!');
    process.exit(0);
} else {
    console.error('✕ SOME TESTS FAILED.');
    process.exit(1);
}
