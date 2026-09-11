/**
 * Game FreeWorld - MissionGraph
 * Directed acyclic graph for branching multi-stage open-world missions with choices & consequences
 */
import { events } from '../Core/EventBus.js';

export class MissionGraph {
  constructor(missionTitle) {
    this.title = missionTitle;
    this.nodes = new Map();
    this.currentNodeId = null;
    this.isFinished = false;
  }

  addNode(id, nodeData) {
    this.nodes.set(id, {
      id,
      objective: nodeData.objective,
      targetPos: nodeData.targetPos,
      dialogue: nodeData.dialogue,
      onEnter: nodeData.onEnter || (() => {}),
      onComplete: nodeData.onComplete || (() => {}),
      nextNodes: nodeData.nextNodes || [] // [ { targetNodeId, condition: () => boolean } ]
    });
    return this;
  }

  start(initialNodeId) {
    this.currentNodeId = initialNodeId;
    const node = this.nodes.get(initialNodeId);
    if (node) {
      if (node.onEnter) node.onEnter();
      this.emitCurrentObjective(node);
    }
  }

  advance(chosenBranch = null) {
    const current = this.nodes.get(this.currentNodeId);
    if (!current) return;

    if (current.onComplete) current.onComplete();

    if (current.nextNodes.length === 0) {
      this.isFinished = true;
      events.emit('MISSION_FINISHED', { title: this.title, success: true });
      return;
    }

    let nextId = current.nextNodes[0].targetNodeId;
    if (chosenBranch) {
      const match = current.nextNodes.find(n => n.branch === chosenBranch);
      if (match) nextId = match.targetNodeId;
    }

    this.currentNodeId = nextId;
    const nextNode = this.nodes.get(nextId);
    if (nextNode) {
      if (nextNode.onEnter) nextNode.onEnter();
      this.emitCurrentObjective(nextNode);
    }
  }

  emitCurrentObjective(node) {
    events.emit('OBJECTIVE_UPDATED', {
      title: this.title,
      text: node.objective,
      targetPos: node.targetPos
    });
    if (node.dialogue) {
      events.emit('SHOW_SUBTITLE', node.dialogue);
    }
  }

  getCurrentNode() {
    return this.nodes.get(this.currentNodeId);
  }
}
