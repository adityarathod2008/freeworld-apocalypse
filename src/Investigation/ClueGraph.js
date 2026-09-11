/**
 * Game FreeWorld - ClueGraph (Phase 8)
 * Narrative Clue Graph linking: CLUE -> LOCATION -> CHARACTER -> STORY OBJECTIVE.
 * Connecting evidence nodes calculates conclusions, unlocks mission objectives, and advances StoryState.
 */
import { events } from '../Core/EventBus.js';
import { GameState } from '../Core/GameState.js';

export class ClueGraph {
  constructor() {
    this.nodes = new Map();
    this.connections = []; // { fromId, toId, type }
    this.unlockedObjectives = [];

    this.initDefaultGraph();
  }

  initDefaultGraph() {
    // 1. Locations
    this.addNode({ id: 'loc_bank_vault', type: 'LOCATION', title: 'Central Bank Vault' });
    this.addNode({ id: 'loc_police_hq', type: 'LOCATION', title: 'Police Headquarters' });
    this.addNode({ id: 'loc_armory', type: 'LOCATION', title: 'Apex Armory' });
    this.addNode({ id: 'loc_harbor', type: 'LOCATION', title: 'Marina Harbor' });
    this.addNode({ id: 'loc_metro', type: 'LOCATION', title: 'Metro Level 2' });

    // 2. Characters
    this.addNode({ id: 'char_marco', type: 'CHARACTER', title: 'Marco Rossi' });
    this.addNode({ id: 'char_miller', type: 'CHARACTER', title: 'Detective Miller' });
    this.addNode({ id: 'char_vance', type: 'CHARACTER', title: 'Dr. Vance' });
    this.addNode({ id: 'char_hayes', type: 'CHARACTER', title: 'Officer Hayes' });
    this.addNode({ id: 'char_sarah', type: 'CHARACTER', title: 'Sarah Jenkins' });

    // 3. Story Objectives
    this.addNode({
      id: 'obj_heist_vault',
      type: 'STORY_OBJECTIVE',
      title: 'Infiltrate Bank Vault Terminal',
      description: 'Breach Central Bank security using Marco\'s stolen codes.',
      targetPos: { x: -180, y: 0.5, z: -180 }
    });
    this.addNode({
      id: 'obj_armory_heist',
      type: 'STORY_OBJECTIVE',
      title: 'Investigate Armory Sabotage',
      description: 'Search Apex Armory for the missing EMP detonator.',
      targetPos: { x: 120, y: 0.5, z: -140 }
    });
    this.addNode({
      id: 'obj_harbor_evac',
      type: 'STORY_OBJECTIVE',
      title: 'Intercept Harbor Transport',
      description: 'Locate Detective Miller at Harbor Warehouse 4.',
      targetPos: { x: -120, y: 0.5, z: 120 }
    });
  }

  addNode(node) {
    this.nodes.set(node.id, {
      id: node.id,
      type: node.type, // 'CLUE' | 'LOCATION' | 'CHARACTER' | 'STORY_OBJECTIVE'
      title: node.title,
      description: node.description || '',
      targetPos: node.targetPos || null,
      unlocked: node.unlocked || false
    });
  }

  connectNodes(fromId, toId) {
    if (!this.nodes.has(fromId)) {
      this.addNode({ id: fromId, type: fromId.startsWith('clue_') ? 'CLUE' : 'NODE', title: fromId });
    }
    if (!this.nodes.has(toId)) {
      this.addNode({ id: toId, type: toId.startsWith('loc_') ? 'LOCATION' : toId.startsWith('char_') ? 'CHARACTER' : 'STORY_OBJECTIVE', title: toId });
    }

    // Avoid duplicate connection
    const exists = this.connections.some(c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId));
    if (!exists) {
      this.connections.push({ fromId, toId, timestamp: (typeof performance !== 'undefined' ? performance.now() : Date.now()) });
      events.emit('CLUE_GRAPH_CONNECTED', { fromId, toId });
      this.checkConclusions();
      return true;
    }
    return false;
  }

  connect(fromId, toId, type = null) {
    return this.connectNodes(fromId, toId);
  }

  getConnections(nodeId) {
    const direct = this.connections.filter(c => c.fromId === nodeId || c.toId === nodeId);
    const linkedIds = direct.map(c => c.fromId === nodeId ? c.toId : c.fromId);
    
    const locations = [];
    const characters = [];
    const objectives = [];

    linkedIds.forEach(id => {
      const node = this.nodes.get(id);
      if (node) {
        if (node.type === 'LOCATION') locations.push(id);
        else if (node.type === 'CHARACTER') characters.push(id);
        else if (node.type === 'STORY_OBJECTIVE' || node.type === 'objective') objectives.push(id);
      } else {
        if (id.startsWith('loc_')) locations.push(id);
        else if (id.startsWith('char_')) characters.push(id);
        else if (id.startsWith('obj_')) objectives.push(id);
      }
    });

    return { locations, characters, objectives, linkedIds };
  }

  checkConclusions() {
    // Conclusion Chain 1: clue_blood_bank -> loc_bank_vault -> char_marco -> obj_heist_vault
    const bankConnected = this.isConnected('clue_blood_bank', 'loc_bank_vault') &&
                          this.isConnected('loc_bank_vault', 'char_marco');
    if (bankConnected) {
      this.unlockObjective('obj_heist_vault');
    }

    // Conclusion Chain 2: clue_cctv_plaza -> loc_armory -> char_vance -> obj_armory_heist
    const armoryConnected = this.isConnected('clue_cctv_plaza', 'loc_armory') &&
                            this.isConnected('loc_armory', 'char_vance');
    if (armoryConnected) {
      this.unlockObjective('obj_armory_heist');
    }

    // Conclusion Chain 3: clue_radio_sos -> loc_harbor -> char_miller -> obj_harbor_evac
    const harborConnected = this.isConnected('clue_radio_sos', 'loc_harbor') &&
                            this.isConnected('loc_harbor', 'char_miller');
    if (harborConnected) {
      this.unlockObjective('obj_harbor_evac');
    }
  }

  isConnected(fromId, toId) {
    return this.connections.some(c => (c.fromId === fromId && c.toId === toId) || (c.fromId === toId && c.toId === fromId));
  }

  unlockObjective(objectiveId) {
    const objNode = this.nodes.get(objectiveId);
    if (objNode && !objNode.unlocked) {
      objNode.unlocked = true;
      if (!this.unlockedObjectives.includes(objectiveId)) {
        this.unlockedObjectives.push(objectiveId);
      }

      // Update GameState.storyState
      const gameState = GameState.get();
      if (gameState && gameState.storyState) {
        gameState.storyState.activeObjectives = gameState.storyState.activeObjectives || [];
        if (!gameState.storyState.activeObjectives.includes(objectiveId)) {
          gameState.storyState.activeObjectives.push(objectiveId);
        }
      }

      events.emit('STORY_OBJECTIVE_UNLOCKED', objNode);
      events.emit('HUD_NOTIFICATION', {
        title: 'NEW OBJECTIVE UNLOCKED',
        message: `${objNode.title}: ${objNode.description}`
      });
    }
  }
}
