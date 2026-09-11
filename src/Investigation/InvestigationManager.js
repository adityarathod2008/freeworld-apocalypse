/**
 * FreeWorld Engine - Investigation Manager (Phase 8)
 * Integrates ClueSystem, ClueGraph, and CharacterRegistry with GameState to drive non-decorative story progression.
 */

import { ClueSystem } from './ClueSystem.js';
import { ClueGraph } from './ClueGraph.js';
import { CharacterRegistry } from './CharacterRegistry.js';

export class InvestigationManager {
    /**
     * @param {THREE.Scene} scene 
     * @param {Object} gameState Global game state instance
     */
    constructor(scene = null, gameState = null) {
        this.scene = scene;
        this.gameState = gameState;

        this.clueSystem = new ClueSystem(scene);
        this.clueGraph = new ClueGraph();
        this.characterRegistry = new CharacterRegistry();

        this.onObjectiveUnlockedCallbacks = [];
        this.onClueInspectedCallbacks = [];

        this.setupGraphConnections();
    }

    /**
     * Pre-populates narrative graph connections linking clues to locations, characters, and story objectives.
     */
    setupGraphConnections() {
        // Example Graph Connection: Harbor Crime Scene
        this.clueGraph.connect('clue_blood_docks', 'loc_docks_pier4', 'location');
        this.clueGraph.connect('clue_blood_docks', 'char_marco', 'character');
        this.clueGraph.connect('clue_blood_docks', 'obj_investigate_warehouse', 'objective');

        // Example Graph Connection: Metro BioLabs Leak
        this.clueGraph.connect('clue_cctv_biolabs', 'loc_biolabs_sublevel', 'location');
        this.clueGraph.connect('clue_cctv_biolabs', 'char_dr_vance', 'character');
        this.clueGraph.connect('clue_cctv_biolabs', 'obj_recover_patient_logs', 'objective');

        // Example Graph Connection: Precinct Security Breach
        this.clueGraph.connect('clue_note_precinct', 'loc_precinct_vault', 'location');
        this.clueGraph.connect('clue_note_precinct', 'char_miller', 'character');
        this.clueGraph.connect('clue_note_precinct', 'obj_confront_informant', 'objective');
    }

    /**
     * Updates clue detection around player position.
     * @param {Object} playerPosition Vector3 or {x, y, z}
     * @param {number} deltaTime 
     */
    update(playerPosition, deltaTime) {
        this.clueSystem.update(playerPosition, deltaTime);
    }

    /**
     * Inspects a clue by ID or nearby clue, adding it to evidence, processing graph links, and unlocking objectives.
     * @param {string} clueId 
     * @returns {Object|null} Inspected clue details
     */
    inspectClue(clueId) {
        const clue = this.clueSystem.inspectClue(clueId);
        if (!clue) return null;

        // Check graph connections
        const connections = this.clueGraph.getConnections(clue.id);

        // Update Character Trust if linked character exists
        if (connections.characters.length > 0) {
            connections.characters.forEach(charId => {
                this.characterRegistry.updateTrust(charId, 15);
                this.characterRegistry.recordMemory(charId, `Player inspected evidence: ${clue.title}`);
            });
        }

        // Check if graph node produces unlocked objectives
        connections.objectives.forEach(objId => {
            this.unlockObjective(objId, clue);
        });

        // Sync with global GameState if present
        if (this.gameState) {
            if (!this.gameState.investigationState) {
                this.gameState.investigationState = { discoveredClues: [], graphNodesUnlocked: [] };
            }
            if (!Array.isArray(this.gameState.investigationState.discoveredClues)) {
                this.gameState.investigationState.discoveredClues = [];
            }
            if (!this.gameState.investigationState.discoveredClues.includes(clue.id)) {
                this.gameState.investigationState.discoveredClues.push(clue.id);
            }
        }

        // Trigger callbacks
        this.onClueInspectedCallbacks.forEach(cb => cb(clue, connections));

        return { clue, connections };
    }

    /**
     * Unlocks a narrative story objective triggered by clue evidence.
     * @param {string} objectiveId 
     * @param {Object} sourceClue 
     */
    unlockObjective(objectiveId, sourceClue) {
        let title = "New Lead Discovered";
        let description = `Investigate connection from ${sourceClue.title}`;

        if (objectiveId === 'obj_investigate_warehouse') {
            title = 'Infiltrate Docks Warehouse';
            description = 'Blood evidence leads to the abandon warehouse on Pier 4.';
        } else if (objectiveId === 'obj_recover_patient_logs') {
            title = 'Recover BioLab Logs';
            description = 'CCTV tape confirms Dr. Vance\'s corrupted lab records are stored on sublevel 2.';
        } else if (objectiveId === 'obj_confront_informant') {
            title = 'Locate Marco Vance';
            description = 'Decoded encrypted note points to Marco\'s hideout in the Industrial District.';
        }

        const objectiveData = {
            id: objectiveId,
            title: title,
            description: description,
            sourceClueId: sourceClue.id,
            unlockedAt: Date.now()
        };

        if (this.gameState) {
            if (!this.gameState.storyState) {
                this.gameState.storyState = { activeObjectives: [], completedObjectives: [] };
            }
            if (!Array.isArray(this.gameState.storyState.activeObjectives)) {
                this.gameState.storyState.activeObjectives = [];
            }
            if (!this.gameState.storyState.activeObjectives.find(o => (typeof o === 'string' ? o : o.id) === objectiveId)) {
                this.gameState.storyState.activeObjectives.push(objectiveData);
            }
        }

        this.onObjectiveUnlockedCallbacks.forEach(cb => cb(objectiveData));
        return objectiveData;
    }

    /**
     * Interrogates / speaks with a character.
     * @param {string} charId 
     */
    interactWithCharacter(charId) {
        const char = this.characterRegistry.getCharacter(charId);
        if (!char) return null;

        const dialogue = this.characterRegistry.getAvailableDialogue(charId);
        return {
            character: char,
            availableDialogue: dialogue
        };
    }

    /**
     * Subscribe to objective unlock notifications.
     */
    onObjectiveUnlocked(callback) {
        this.onObjectiveUnlockedCallbacks.push(callback);
    }

    /**
     * Subscribe to clue inspection notifications.
     */
    onClueInspected(callback) {
        this.onClueInspectedCallbacks.push(callback);
    }
}
