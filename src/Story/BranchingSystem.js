/**
 * FreeWorld Engine - Branching System (Phase 12)
 * Manages major story decision trees, character trust adjustments, world consequences, and ending flags.
 */

import { StoryState } from './StoryState.js';
import { events } from '../Core/EventBus.js';

export const MAJOR_STORY_CHOICES = {
  CHOICE_SAVE_VANCE_DATA: {
    id: 'CHOICE_SAVE_VANCE_DATA',
    prompt: 'Save Dr. Vance\'s Lab Mutation Records or Evacuate Precinct 4 Civilians?',
    optionA: { label: 'Save Lab Records', consequence: 'CONSEQUENCE_NEXUS_DATA_SAVED', trustMod: { 'char_dr_vance': 25, 'char_miller': -10 } },
    optionB: { label: 'Evacuate Civilians', consequence: 'CONSEQUENCE_CIVILIANS_EVACUATED', trustMod: { 'char_miller': 25, 'char_dr_vance': -10 } }
  },
  CHOICE_TRUST_MARCO: {
    id: 'CHOICE_TRUST_MARCO',
    prompt: 'Trust Security Chief Marco Vance with the Decoded Encryption Cipher?',
    optionA: { label: 'Hand Over Cipher', consequence: 'CONSEQUENCE_MARCO_ALLIED', trustMod: { 'char_marco': 30 } },
    optionB: { label: 'Withhold Cipher', consequence: 'CONSEQUENCE_MARCO_SUSPICIOUS', trustMod: { 'char_marco': -25 } }
  },
  CHOICE_FINAL_DESTINY: {
    id: 'CHOICE_FINAL_DESTINY',
    prompt: 'Select Final Act Outcome during City Collapse:',
    optionA: { label: 'Broadcast Nexus Evidence Worldwide', endingFlag: 'ENDING_EXPOSE_NEXUS' },
    optionB: { label: 'Escort Survivors to Marina Harbor Helipad', endingFlag: 'ENDING_EVACUATE_SURVIVORS' },
    optionC: { label: 'Escape Bay City Alone in High-Speed Getaway', endingFlag: 'ENDING_LONE_WOLF' }
  }
};

export class BranchingSystem {
  constructor() {
    this.storyState = StoryState.get();
  }

  /**
   * Evaluates a major branching story decision.
   * @param {string} choiceId 
   * @param {string} optionKey 'optionA' | 'optionB' | 'optionC'
   */
  makeDecision(choiceId, optionKey = 'optionA') {
    const choiceConfig = MAJOR_STORY_CHOICES[choiceId];
    if (!choiceConfig || !choiceConfig[optionKey]) return null;

    const chosenOption = choiceConfig[optionKey];
    const record = {
      choiceId,
      label: chosenOption.label,
      timestamp: Date.now()
    };

    // Update Major Decisions Log
    this.storyState.majorDecisions.push(record);

    // Apply Relationship Trust Modifications
    if (chosenOption.trustMod) {
      for (const [charId, delta] of Object.entries(chosenOption.trustMod)) {
        this.storyState.relationships[charId] = Math.min(100, Math.max(0, (this.storyState.relationships[charId] || 50) + delta));
      }
    }

    // Apply World Consequence Flags
    if (chosenOption.consequence) {
      if (!this.storyState.worldConsequences.includes(chosenOption.consequence)) {
        this.storyState.worldConsequences.push(chosenOption.consequence);
      }
    }

    // Apply Final Ending Flags
    if (chosenOption.endingFlag) {
      if (!this.storyState.endingFlags.includes(chosenOption.endingFlag)) {
        this.storyState.endingFlags.push(chosenOption.endingFlag);
      }
    }

    this.storyState.updateCompletion();

    events.emit('STORY_DECISION_MADE', { record, option: chosenOption });
    events.emit('HUD_NOTIFICATION', {
      title: 'STORY CONSEQUENCE',
      message: `Choice Made: ${chosenOption.label}`
    });

    return record;
  }
}
