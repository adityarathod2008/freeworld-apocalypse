/**
 * FreeWorld Engine - Phase 12 Automated Test Suite
 * Validates 6-Chapter Story Engine, Branching Decisions, Triggered Flashbacks,
 * Live World Cinematic Camera Path, and Save/Load Persistence.
 */

import * as THREE from 'three';
import { StoryState, CHAPTER_DEFINITIONS } from '../src/Story/StoryState.js';
import { StoryEngine } from '../src/Story/StoryEngine.js';
import { BranchingSystem, MAJOR_STORY_CHOICES } from '../src/Story/BranchingSystem.js';
import { FlashbackSystem, FLASHBACK_TYPES } from '../src/Story/FlashbackSystem.js';
import { CinematicEngine } from '../src/Story/CinematicEngine.js';
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

console.log('=== FREEWORLD PHASE 12 STORY ENGINE, MISSIONS & CINEMATICS TEST SUITE ===');

// Mock THREE.Camera
class MockCamera {
    constructor() {
        this.position = new THREE.Vector3();
    }
    lookAt() {}
}
const mockCamera = new MockCamera();

// 1. STORY STATE SCHEMATICS TEST
console.log('\n[Test 1] Authoritative Story State Schematics');
const storyState = StoryState.get();
const stateData = storyState.getState();

assert(stateData.chapterId === 1, 'Initial narrative chapter starts at Chapter 1');
assert(stateData.missionStatus === 'IN_PROGRESS', 'Initial mission status is IN_PROGRESS');
assert(Array.isArray(stateData.cluesFound), 'StoryState tracks cluesFound array');
assert(Array.isArray(stateData.flashbacksUnlocked), 'StoryState tracks flashbacksUnlocked array');
assert(Array.isArray(stateData.charactersDiscovered), 'StoryState tracks charactersDiscovered array');
assert(typeof stateData.relationships === 'object', 'StoryState tracks character relationships map');
assert(Array.isArray(stateData.majorDecisions), 'StoryState tracks majorDecisions log');
assert(Array.isArray(stateData.worldConsequences), 'StoryState tracks worldConsequences flags');
assert(Array.isArray(stateData.endingFlags), 'StoryState tracks endingFlags array');
assert(typeof stateData.storyCompletionPercentage === 'number', 'StoryState calculates storyCompletionPercentage');

// 2. 6-CHAPTER NARRATIVE STRUCTURE TEST
console.log('\n[Test 2] 6-Chapter Narrative Structure');
assert(CHAPTER_DEFINITIONS.length === 6, 'Supports exactly 6 story chapters');

const storyEngine = new StoryEngine(mockCamera);
storyEngine.advanceChapter(2);
assert(storyState.chapterId === 2, 'Advanced story state to Chapter 2');

storyEngine.advanceChapter(3);
storyEngine.advanceChapter(4);
storyEngine.advanceChapter(5);
storyEngine.advanceChapter(6);
assert(storyState.chapterId === 6, 'Successfully advanced to Chapter 6: City Collapse');

// 3. BRANCHING DECISIONS & CHOICE CONSEQUENCES TEST
console.log('\n[Test 3] Branching Choice Consequences & Ending Flags');
const branching = new BranchingSystem();

const initialMarcoTrust = storyState.relationships['char_marco'] || 30;
branching.makeDecision('CHOICE_TRUST_MARCO', 'optionA');

assert(storyState.relationships['char_marco'] > initialMarcoTrust, 'Trusting Marco increases Marco relationship trust score (+30)');
assert(storyState.worldConsequences.includes('CONSEQUENCE_MARCO_ALLIED'), 'Decision adds CONSEQUENCE_MARCO_ALLIED to world consequences');

// Final Destiny Choice -> Ending Flag
branching.makeDecision('CHOICE_FINAL_DESTINY', 'optionA');
assert(storyState.endingFlags.includes('ENDING_EXPOSE_NEXUS'), 'Choice A sets ENDING_EXPOSE_NEXUS ending flag');

branching.makeDecision('CHOICE_FINAL_DESTINY', 'optionB');
assert(storyState.endingFlags.includes('ENDING_EVACUATE_SURVIVORS'), 'Choice B sets ENDING_EVACUATE_SURVIVORS ending flag');

// 4. FLASHBACK SYSTEM (6 Flashback Modes) TEST
console.log('\n[Test 4] Flashback System & Triggers');
const flashbackSystem = new FlashbackSystem();

let flashbackEventFired = false;
events.on('FLASHBACK_STARTED', () => {
    flashbackEventFired = true;
});

// Trigger Clue-based Flashback
events.emit('CLUE_INSPECTED', { id: 'clue_cctv_biolabs' });
assert(flashbackEventFired === true, 'Inspecting clue_cctv_biolabs triggered clue-based flashback');
assert(storyState.flashbacksUnlocked.includes('fb_biolabs_spill'), 'Flashback ID fb_biolabs_spill recorded in storyState');

// 5. LIVE WORLD CINEMATIC CAMERA TEST
console.log('\n[Test 5] Live World Cinematic Camera Path');
const cinematicEngine = new CinematicEngine(mockCamera);

const keyframes = [
    new THREE.Vector3(0, 5, 0),
    new THREE.Vector3(10, 8, 10),
    new THREE.Vector3(20, 5, 20)
];
const focusTarget = new THREE.Vector3(15, 0, 15);

let cinematicStarted = false;
events.on('CINEMATIC_CUTSCENE_STARTED', () => {
    cinematicStarted = true;
});

cinematicEngine.playCinematicCutscene(keyframes, focusTarget, 4.0, { speaker: 'NARRATOR', text: 'Bay City falls...' });
assert(cinematicStarted === true, 'Cinematic engine started live-world cutscene');
assert(cinematicEngine.isPlaying === true, 'Cinematic camera path active');

cinematicEngine.update(2.0); // Advance camera path 2s
assert(mockCamera.position.x > 0, 'Camera position smoothly interpolated along Catmull-Rom spline path');

cinematicEngine.update(3.0); // Complete cutscene
assert(cinematicEngine.isPlaying === false, 'Cinematic camera path cleanly finished');

// 6. SAVE / LOAD PERSISTENCE TEST
console.log('\n[Test 6] Story Engine Serialization & Persistence');
const storyJSON = storyEngine.toJSON();
assert(typeof storyJSON.chapterId === 'number', 'Story state serializes chapterId to JSON');
assert(Array.isArray(storyJSON.endingFlags), 'Story state serializes endingFlags array to JSON');

const restoredState = new StoryState();
restoredState.fromJSON(storyJSON);
assert(restoredState.chapterId === storyJSON.chapterId, 'Story state restores exact chapterId from JSON payload');

// SUMMARY
console.log(`\n==================================================`);
console.log(`PHASE 12 STORY ENGINE & CINEMATICS TEST SUMMARY: ${passed} / ${total} ASSERIONS PASSED`);
console.log(`==================================================`);

if (passed === total) {
    console.log('✓ ALL PHASE 12 STORY & CINEMATIC TESTS PASSED!');
    process.exit(0);
} else {
    console.error('✕ SOME TESTS FAILED.');
    process.exit(1);
}
