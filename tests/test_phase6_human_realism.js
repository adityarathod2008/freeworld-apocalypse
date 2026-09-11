/**
 * Game FreeWorld - Phase 6 Verification Test Suite
 * Tests HumanMesh physical proportions, height/mass scaling, PBR skin materials, dirt/wetness,
 * FacialAnimation blinking, eye gaze tracking, expressions, lip-sync phonemes,
 * HumanAnimationFSM state transitions, HumanIKController foot/hand placement,
 * and HumanLODController multi-tier animation throttling.
 */

import { HumanMesh } from '../src/NPC/HumanMesh.js';
import { FacialAnimation } from '../src/NPC/FacialAnimation.js';
import { HumanIKController } from '../src/NPC/HumanIKController.js';
import { HumanAnimationFSM, ANIM_STATES } from '../src/NPC/HumanAnimationFSM.js';
import { HumanLODController } from '../src/NPC/HumanLODController.js';
import { NPCModel } from '../src/NPC/NPCModel.js';
import { PlayerModel } from '../src/Player/PlayerModel.js';
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

console.log('=== FREEWORLD PHASE 6 HUMAN CHARACTER REALISM & ANIMATION TEST SUITE ===\n');

// ----------------------------------------------------
// TEST 1: HumanMesh Proportions, Mass, Height & Environmental Sheen
// ----------------------------------------------------
console.log('[Test 1] HumanMesh Physical Proportions & Environmental Parameters');
const mesh = new HumanMesh({ height: 1.1, mass: 1.05, age: 42, physicalCondition: 'athletic' });

assert(mesh.height === 1.1, 'HumanMesh respects custom height scale (1.1x)');
assert(mesh.mass === 1.05, 'HumanMesh respects custom mass scale (1.05x)');
assert(mesh.skinMat !== undefined, 'PBR skin material initialized');
assert(mesh.leftEye !== undefined && mesh.rightEye !== undefined, 'Specular eye iris mesh nodes initialized');

mesh.setEnvironmentalConditions(50, 80);
assert(mesh.dirt === 50, 'Dirt parameter updated to 50%');
assert(mesh.wetness === 80, 'Wetness parameter updated to 80%');
assert(mesh.skinMat.roughness < 0.6, 'Wetness sheen reduces skin material roughness');

// ----------------------------------------------------
// TEST 2: Facial Animation, Blinking, Eye Gaze & Lip-Sync
// ----------------------------------------------------
console.log('\n[Test 2] Facial Animation, Blinking, Eye Gaze Tracking & Phonemes');
const facial = new FacialAnimation(mesh);

facial.setExpression('HAPPY');
facial.update(0.1, new THREE.Vector3(0, 1.5, 0));
assert(facial.currentExpression === 'HAPPY', 'Facial expression set to HAPPY');

facial.setGazeTarget(new THREE.Vector3(10, 2, 5), 1.0);
facial.update(0.1, new THREE.Vector3(0, 1.5, 0));
assert(facial.gazeTarget !== null, 'Eye gaze tracking target registered');

facial.setPhoneme('O', 0.5);
assert(facial.currentPhoneme === 'O', 'Lip-sync phoneme hook set to O');

// ----------------------------------------------------
// TEST 3: HumanAnimationFSM Movement & Body Dynamics
// ----------------------------------------------------
console.log('\n[Test 3] HumanAnimationFSM Multi-State Transitions & Body Dynamics');
const fsm = new HumanAnimationFSM(mesh);

assert(fsm.state === ANIM_STATES.IDLE, 'Initial FSM state is IDLE');

fsm.update(0.1, 1.8, 0, false);
assert(fsm.state === ANIM_STATES.WALK, 'Moving at 1.8m/s transitions FSM to WALK state');

fsm.update(0.1, 4.0, 0, false);
assert(fsm.state === ANIM_STATES.JOG, 'Moving at 4.0m/s transitions FSM to JOG state');

fsm.update(0.1, 7.0, 0, false);
assert(fsm.state === ANIM_STATES.SPRINT, 'Moving at 7.0m/s transitions FSM to SPRINT state');

fsm.setState(ANIM_STATES.STUMBLE);
assert(fsm.state === ANIM_STATES.STUMBLE, 'FSM supports STUMBLE state');

fsm.setState(ANIM_STATES.CROUCH);
assert(fsm.state === ANIM_STATES.CROUCH, 'FSM supports CROUCH state');

// ----------------------------------------------------
// TEST 4: Inverse Kinematics (IK) Foot & Hand Solvers
// ----------------------------------------------------
console.log('\n[Test 4] Inverse Kinematics (IK) Foot & Hand Placement');
const ik = new HumanIKController(mesh);

ik.setFootIKTargets(new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(0, 0.0, 0), 1.0);
ik.update(0.1, new THREE.Vector3(0, 0, 0), (pos) => pos.x > 0 ? 0.3 : 0.1);
assert(mesh.leftFoot.position.y !== -0.62 || mesh.rightFoot.position.y !== -0.62, 'Foot IK adjusts foot height to align on uneven terrain');

ik.setHandIKTargets(new THREE.Vector3(1, 1.2, 1), null, 1.0, 0);
ik.update(0.1, new THREE.Vector3(0, 0, 0), null);
assert(mesh.leftArmPivot.rotation.x !== 0, 'Hand IK rotates arm joint toward interaction target');

// ----------------------------------------------------
// TEST 5: HumanLODController & Performance Throttling
// ----------------------------------------------------
console.log('\n[Test 5] HumanLODController Multi-Tier Animation Throttling');
const lod = new HumanLODController();

assert(lod.evaluateLOD(10) === 'NEAR', 'Camera distance 10m evaluates to NEAR LOD tier (<30m)');
assert(lod.evaluateLOD(50) === 'MID', 'Camera distance 50m evaluates to MID LOD tier (30-90m)');
assert(lod.evaluateLOD(120) === 'FAR', 'Camera distance 120m evaluates to FAR LOD tier (90-200m)');
assert(lod.evaluateLOD(250) === 'UNLOADED', 'Camera distance 250m evaluates to UNLOADED LOD tier (>200m)');

assert(lod.shouldUpdate('NEAR', 0.016) === true, 'NEAR tier updates every 60 Hz frame');
assert(lod.shouldUpdate('UNLOADED', 0.016) === false, 'UNLOADED tier skips animation updates');

// ----------------------------------------------------
// TEST 6: NPCModel & PlayerModel Character Integration
// ----------------------------------------------------
console.log('\n[Test 6] NPCModel & PlayerModel Integration');
const npcModel = new NPCModel();
assert(npcModel.humanMesh !== undefined, 'NPCModel integrates HumanMesh');
npcModel.animate(true, false, 0.016, false, 'NEAR');

const playerModel = new PlayerModel();
assert(playerModel.humanMesh !== undefined, 'PlayerModel integrates HumanMesh');
playerModel.animate('IDLE', 0, 0.016, false);

console.log(`\n====================================================`);
console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log(`====================================================\n`);
