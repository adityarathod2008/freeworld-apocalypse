/**
 * FreeWorld Engine - Phase 13 Automated Test Suite
 * Validates 100-Item Bucket List, Category Filtering, Reward Payouts, AAA Main Menu,
 * Story Dashboard Telemetry, Opening Boot Sequence Pipeline, and Save/Load Persistence.
 */

import { BUCKET_LIST_ITEMS, BUCKET_LIST_CATEGORIES } from '../src/BucketList/BucketListData.js';
import { BucketListEngine } from '../src/BucketList/BucketListEngine.js';
import { MainMenu } from '../src/UI/MainMenu.js';
import { StoryDashboard } from '../src/UI/StoryDashboard.js';
import { OpeningBootSequence } from '../src/Story/OpeningBootSequence.js';
import { SaveManager } from '../src/SaveSystem/SaveManager.js';
import { StoryState } from '../src/Story/StoryState.js';
import { EconomyManager } from '../src/WorldSystems/EconomyManager.js';
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

console.log('=== FREEWORLD PHASE 13 BUCKET LIST, MENU & AAA OPENING TEST SUITE ===');

// Mock DOM elements & localStorage for Node test environment if not present
if (typeof document === 'undefined') {
    const storageMap = new Map();
    global.localStorage = {
        getItem: (key) => storageMap.get(key) || null,
        setItem: (key, val) => storageMap.set(key, String(val)),
        removeItem: (key) => storageMap.delete(key),
        clear: () => storageMap.clear()
    };
    global.document = {
        createElement: () => ({
            id: '',
            className: '',
            style: {},
            appendChild: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
            addEventListener: () => {},
            remove: () => {}
        }),
        getElementById: () => null,
        body: {
            appendChild: () => {},
            removeChild: () => {}
        }
    };
}

// 1. 100-ITEM BUCKET LIST DATA INTEGRITY TEST
console.log('\n[Test 1] 100-Item Bucket List Data Integrity');
assert(Array.isArray(BUCKET_LIST_ITEMS), 'BUCKET_LIST_ITEMS is defined as an array');
assert(BUCKET_LIST_ITEMS.length === 100, `BUCKET_LIST_ITEMS contains exactly 100 activities (Found: ${BUCKET_LIST_ITEMS.length})`);

const categoryCounts = {};
const uniqueIds = new Set();

for (const item of BUCKET_LIST_ITEMS) {
    uniqueIds.add(item.id);
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
}

assert(uniqueIds.size === 100, 'All 100 bucket list activity IDs are unique');
assert(Object.keys(BUCKET_LIST_CATEGORIES).length === 12, '12 distinct Bucket List categories defined');

let allCategoriesPresent = true;
for (const catName of Object.values(BUCKET_LIST_CATEGORIES)) {
    if (!categoryCounts[catName] || categoryCounts[catName] <= 0) {
        allCategoriesPresent = false;
    }
}
assert(allCategoriesPresent, 'All 12 categories are represented with at least 1 activity in BUCKET_LIST_ITEMS');

// 2. BUCKET LIST ENGINE REWARDS & COMPLETION TEST
console.log('\n[Test 2] BucketListEngine Rewards & Completion');
const bucketEngine = BucketListEngine.get();
bucketEngine.reset();

const mockEconomy = new EconomyManager(1000, 5000);
let rewardReceivedEvent = false;

events.on('BUCKET_LIST_ITEM_COMPLETED', (data) => {
    rewardReceivedEvent = true;
    if (data.reward && data.reward.cash) mockEconomy.addCash(data.reward.cash);
});

assert(bucketEngine.getCompletedItems().length === 0, 'BucketListEngine starts with 0 completed items');
assert(bucketEngine.getCompletionPercentage() === 0, 'Initial completion percentage is 0%');

const completedItem = bucketEngine.completeItem('bl_adv_01');
assert(completedItem !== null, 'Completing bl_adv_01 succeeds and returns item data');
assert(completedItem.completed === true, 'Item state marks completed=true');
assert(bucketEngine.isCompleted('bl_adv_01') === true, 'bucketEngine.isCompleted("bl_adv_01") returns true');
assert(rewardReceivedEvent === true, 'BUCKET_LIST_ITEM_COMPLETED event emitted');
assert(mockEconomy.cash === 1500, 'Reward cash ($500) successfully credited to economy');
assert(bucketEngine.getCompletedCount() === 1, 'Completed count incremented to 1');
assert(bucketEngine.getCompletionPercentage() === 1, 'Completion percentage is 1%');

// Test duplicate completion prevention
const duplicateResult = bucketEngine.completeItem('bl_adv_01');
assert(duplicateResult === null, 'Completing an already completed item returns null and prevents duplicate rewards');

// 3. MAIN MENU SYSTEM TEST
console.log('\n[Test 3] AAA Main Menu Navigation & Actions');
const mainMenu = new MainMenu();
assert(mainMenu.container !== null, 'MainMenu element successfully instantiated');

let menuOptionTriggered = null;
events.on('MAIN_MENU_OPTION_SELECTED', (data) => {
    menuOptionTriggered = data.optionKey;
});

mainMenu.selectOption('NEW_GAME');
assert(menuOptionTriggered === 'NEW_GAME', 'Selecting NEW_GAME option emits MAIN_MENU_OPTION_SELECTED event');

mainMenu.selectOption('CONTINUE');
assert(menuOptionTriggered === 'CONTINUE', 'Selecting CONTINUE option emits MAIN_MENU_OPTION_SELECTED event');

mainMenu.selectOption('EXIT');
assert(menuOptionTriggered === 'EXIT', 'Selecting EXIT option emits MAIN_MENU_OPTION_SELECTED event');

mainMenu.hide();
assert(mainMenu.isVisible === false, 'MainMenu.hide() sets active state to false');

// 4. STORY DASHBOARD TELEMETRY TEST
console.log('\n[Test 4] Story Dashboard Telemetry & State Integration');
const storyState = StoryState.get();
storyState.cluesFound.push('CLUE_CRIME_SCENE_NOTE');
storyState.relationships['SAM_REED'] = 75;

const dashboard = new StoryDashboard();
const summaryData = dashboard.renderTelemetry();

assert(summaryData.storyCompletionPercentage >= 0, 'Dashboard tracks valid story completion percentage');
assert(summaryData.chapterId === 1, 'Dashboard tracks current narrative chapter');
assert(summaryData.cluesCount === 1, 'Dashboard tracks discovered clues count');
assert(summaryData.bucketListPercentage === 1, 'Dashboard integrates BucketListEngine completion percentage');
assert(summaryData.relationships['SAM_REED'] === 75, 'Dashboard tracks character relationship trust level');

dashboard.show();
assert(dashboard.isVisible === true, 'StoryDashboard.show() sets isVisible state to true');
dashboard.hide();
assert(dashboard.isVisible === false, 'StoryDashboard.hide() sets isVisible state to false');

// 5. OPENING BOOT SEQUENCE PIPELINE TEST
console.log('\n[Test 5] AAA Opening Boot Sequence Pipeline');
const bootSequence = new OpeningBootSequence();
let lastBootStage = null;

events.on('BOOT_STAGE_CHANGED', (data) => {
    lastBootStage = data.stage;
});

assert(bootSequence.stage === 'BOOT', 'BootSequence starts in BOOT stage');

bootSequence.startBootFlow();
assert(bootSequence.stage === 'BOOT', 'startBootFlow starts sequence at BOOT stage');
assert(lastBootStage === 'BOOT', 'BOOT_STAGE_CHANGED event fired for BOOT stage');

bootSequence.startNewGameSequence();
assert(bootSequence.stage === 'OPENING_CINEMATIC', 'startNewGameSequence transitions to OPENING_CINEMATIC stage');
assert(lastBootStage === 'OPENING_CINEMATIC', 'BOOT_STAGE_CHANGED event fired for OPENING_CINEMATIC stage');

// 6. SAVE / LOAD PERSISTENCE TEST
console.log('\n[Test 6] Save/Load Persistence of Bucket List State');
const saveManager = new SaveManager(mockEconomy);

// Complete another activity
bucketEngine.completeItem('bl_trv_01'); // "Marina Sunset Walk"
assert(bucketEngine.getCompletedCount() === 2, 'Completed count before save is 2');

const mockPlayer = { position: { x: 10, y: 0, z: 10 }, health: 100, armor: 50 };
const saveResult = saveManager.save(mockPlayer, null, null, null);
assert(saveResult === true, 'SaveManager.save() returned true success status');

const savedPayload = JSON.parse(localStorage.getItem(saveManager.SAVE_KEY));

assert(savedPayload && savedPayload.bucketListState && Array.isArray(savedPayload.bucketListState.completedItems), 'Save payload contains bucketListState.completedItems array');
assert(savedPayload.bucketListState.completedItems.length === 2, 'Save payload holds 2 completed bucket list items');
assert(savedPayload.bucketListState.completedItems.includes('bl_adv_01'), 'Save payload includes bl_adv_01');
assert(savedPayload.bucketListState.completedItems.includes('bl_trv_01'), 'Save payload includes bl_trv_01');

// Reset bucket engine and verify restore via load
bucketEngine.reset();
assert(bucketEngine.getCompletedCount() === 0, 'BucketListEngine reset to 0 items before load');

saveManager.load();
assert(bucketEngine.getCompletedCount() === 2, 'SaveManager.load() restored completed items to count 2');
assert(bucketEngine.isCompleted('bl_adv_01') === true, 'bl_adv_01 restored as completed');
assert(bucketEngine.isCompleted('bl_trv_01') === true, 'bl_trv_01 restored as completed');

// RESULTS SUMMARY
console.log(`\n=== PHASE 13 TEST RESULTS: ${passed}/${total} ASSERTS PASSED ===`);
if (passed === total) {
    console.log('✓ ALL PHASE 13 BUCKET LIST & MENU TESTS PASSED SUCCESSFULLY!');
} else {
    console.error(`✕ ${total - passed} TESTS FAILED.`);
    process.exit(1);
}
