/**
 * FreeWorld Engine - Phase 10 Automated Test Suite
 * Validates Advanced 8-Stage Zombie Brain, Perception Memory, Flocking System Boids Steering,
 * 8 Horde Mobilization Triggers, Physical Impact Reactions, and Simulation LOD Throttling.
 */

import * as THREE from 'three';
import { ZombieBrain, ZOMBIE_BRAIN_STAGES } from '../src/Zombies/ZombieBrain.js';
import { PerceptionMemory } from '../src/Zombies/PerceptionMemory.js';
import { ZombiePhysics } from '../src/Zombies/ZombiePhysics.js';
import { ZombieLODController, ZOMBIE_LOD_TIERS } from '../src/Zombies/ZombieLODController.js';
import { FlockingSystem, HORDE_TRIGGER_SOURCES } from '../src/Horde/FlockingSystem.js';
import { HordeManager } from '../src/Horde/HordeManager.js';
import { ZombieManager } from '../src/Zombies/ZombieManager.js';
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

console.log('=== FREEWORLD PHASE 10 ADVANCED ZOMBIE AI & HORDE TEST SUITE ===');

// Mock Scene
class MockScene {
    add() {}
    remove() {}
}
const mockScene = new MockScene();
const zombieManager = new ZombieManager(mockScene);

// 1. 8-STAGE ZOMBIE BRAIN PIPELINE TEST
console.log('\n[Test 1] 8-Stage Zombie Brain Decision Pipeline');
const brainZombie = zombieManager.spawnZombie({
    id: 'zombie_brain_test',
    variant: 'WALKER',
    position: { x: 0, y: 0, z: 0 }
});

assert(brainZombie.brain.stage === ZOMBIE_BRAIN_STAGES.WANDER, 'Initial brain state is WANDER');

const playerTarget = { id: 'player_1', position: new THREE.Vector3(0, 0, 8), isAlive: true };

// Evaluate PERCEIVE -> TARGET -> CHASE
brainZombie.brain.evaluate(0.016, [playerTarget], 0.0, []);
assert(brainZombie.brain.stage === ZOMBIE_BRAIN_STAGES.CHASE, 'Visual target acquisition transitions brain to CHASE stage');

// Move player closer to trigger ATTACK
playerTarget.position.set(0, 0, 1.2);
brainZombie.brain.evaluate(0.016, [playerTarget], 0.0, []);
assert(brainZombie.brain.stage === ZOMBIE_BRAIN_STAGES.ATTACK, 'Target within 1.5m range transitions brain to ATTACK stage');

// 2. PERCEPTION MEMORY & TARGET LOSS TEST
console.log('\n[Test 2] Perception Memory & Target Loss');
const memory = brainZombie.brain.memory;
memory.rememberTarget(playerTarget, playerTarget.position, 1.0);

assert(memory.hasActiveMemory() === true, 'Target last known position recorded in PerceptionMemory');
assert(memory.lastKnownPosition.z === 1.2, 'Last known position coordinates saved accurately');

// Break line-of-sight and simulate target loss search
playerTarget.position.set(200, 0, 200); // Move out of visual range
brainZombie.brain.evaluate(0.016, [playerTarget], 0.0, []);
assert(brainZombie.brain.stage === ZOMBIE_BRAIN_STAGES.SEARCH, 'Broken LOS with active memory transitions brain to SEARCH stage');

// Advance search timer past expiration
brainZombie.brain.memory.update(12.0);
brainZombie.brain.evaluate(0.016, [playerTarget], 0.0, []);
assert(brainZombie.brain.stage === ZOMBIE_BRAIN_STAGES.LOSE_TARGET || brainZombie.brain.stage === ZOMBIE_BRAIN_STAGES.WANDER, 'Memory expiration transitions brain to LOSE_TARGET / WANDER stage');

// 3. FLOCKING SYSTEM BOIDS STEERING TEST
console.log('\n[Test 3] Flocking System (Separation, Alignment, Cohesion & Obstacle Avoidance)');
const flocking = new FlockingSystem();

const z1 = zombieManager.spawnZombie({ id: 'flock_1', position: { x: 0, y: 0, z: 0 } });
const z2 = zombieManager.spawnZombie({ id: 'flock_2', position: { x: 1.0, y: 0, z: 0 } }); // Close within separation radius (1.8m)
const z3 = zombieManager.spawnZombie({ id: 'flock_3', position: { x: -1.0, y: 0, z: 0 } });

const steering = flocking.calculateSteeringVector(z1, [z2, z3], new THREE.Vector3(10, 0, 10));
assert(steering.lengthSq() > 0, 'Flocking system calculates composite steering vector');
assert(typeof steering.x === 'number' && typeof steering.z === 'number', 'Steering vector contains valid 3D directional coordinates');

// 4. 8 HORDE MOBILIZATION FORMATION TRIGGERS TEST
console.log('\n[Test 4] 8 Horde Mobilization Formation Triggers');
const hordeManager = new HordeManager(zombieManager);

const triggers = [
    'GUNSHOT', 'EXPLOSION', 'SIREN', 'FIRE',
    'CROWD', 'GENERATOR', 'PLAYER_ACTIVITY', 'INFECTED_CONCENTRATION'
];

assert(Object.keys(HORDE_TRIGGER_SOURCES).length === 8, 'Engine supports exactly 8 distinct horde formation triggers');

triggers.forEach(trig => {
    hordeManager.triggerHordeFormation({ x: 50, y: 0, z: 50 }, trig, 60);
});

assert(hordeManager.activeFormations.length >= 8, 'HordeManager successfully recorded all 8 formation mobilization events');

// 5. PHYSICAL IMPACT REACTIONS TEST
console.log('\n[Test 5] Physical Reactions (Vehicle Impact & Explosion Impulse)');
const physicsZombie = zombieManager.spawnZombie({ id: 'zombie_phys_test', health: 100, position: { x: 0, y: 0, z: 0 } });

physicsZombie.physics.applyVehicleImpact(new THREE.Vector3(1, 0, 0), 12.0);
assert(physicsZombie.health < 100, 'Vehicle collision impact reduces zombie health');
assert(physicsZombie.locomotion.currentGait === 'FALL' || physicsZombie.locomotion.currentGait === 'STUMBLE', 'Vehicle collision triggers fall / stumble locomotion gait');

physicsZombie.position.set(0, 0, 0);
const explosionOrigin = { x: 2.0, y: 0, z: 0 };
physicsZombie.physics.applyExplosionImpulse(explosionOrigin, 20.0);
assert(physicsZombie.position.x < 0, 'Explosion blast impulse applies radial knockback away from blast origin');

// 6. SIMULATION LOD THROTTLING TEST
console.log('\n[Test 6] Simulation LOD Throttling Tiers');
const playerPos = new THREE.Vector3(0, 0, 0);

assert(ZombieLODController.getLODTier({ x: 10, y: 0, z: 0 }, playerPos) === ZOMBIE_LOD_TIERS.NEAR, 'Distance 10m evaluates to NEAR tier (<30m)');
assert(ZombieLODController.getLODTier({ x: 50, y: 0, z: 0 }, playerPos) === ZOMBIE_LOD_TIERS.MID, 'Distance 50m evaluates to MID tier (30-90m)');
assert(ZombieLODController.getLODTier({ x: 120, y: 0, z: 0 }, playerPos) === ZOMBIE_LOD_TIERS.FAR, 'Distance 120m evaluates to FAR tier (90-200m)');
assert(ZombieLODController.getLODTier({ x: 250, y: 0, z: 0 }, playerPos) === ZOMBIE_LOD_TIERS.UNLOADED, 'Distance 250m evaluates to UNLOADED tier (>200m)');

assert(ZombieLODController.shouldUpdateFrame(ZOMBIE_LOD_TIERS.NEAR, 1) === true, 'NEAR tier updates every frame');
assert(ZombieLODController.shouldUpdateFrame(ZOMBIE_LOD_TIERS.MID, 1) === false, 'MID tier skips odd frame count (30 Hz)');
assert(ZombieLODController.shouldUpdateFrame(ZOMBIE_LOD_TIERS.MID, 2) === true, 'MID tier updates even frame count (30 Hz)');
assert(ZombieLODController.shouldUpdateFrame(ZOMBIE_LOD_TIERS.UNLOADED, 1) === false, 'UNLOADED tier skips update entirely');

// 7. LARGE SCALE HORDE STRESS & DISPERSAL TEST
console.log('\n[Test 7] Large Scale Stress & Horde Dispersal');
for (let i = 0; i < 30; i++) {
    zombieManager.spawnZombie({
        position: { x: (Math.random() - 0.5) * 40, y: 0, z: (Math.random() - 0.5) * 40 }
    });
}

const totalZombies = zombieManager.getZombies().length;
assert(totalZombies >= 35, 'Spawned 35+ zombie horde entities');

// Run manager update for stress test
const startTime = Date.now();
zombieManager.update(0.016, [playerTarget], 0.0, []);
hordeManager.update(0.016);
const duration = Date.now() - startTime;

assert(duration < 50, '35+ Zombie Horde update loop executed under 50ms (High FPS performance baseline)');

// SUMMARY
console.log(`\n==================================================`);
console.log(`PHASE 10 ADVANCED ZOMBIE AI TEST SUMMARY: ${passed} / ${total} ASSERIONS PASSED`);
console.log(`==================================================`);

if (passed === total) {
    console.log('✓ ALL PHASE 10 ADVANCED ZOMBIE & HORDE TESTS PASSED!');
    process.exit(0);
} else {
    console.error('✕ SOME TESTS FAILED.');
    process.exit(1);
}
