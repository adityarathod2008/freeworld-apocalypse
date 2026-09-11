/**
 * FreeWorld Engine - Flashback System (Phase 12)
 * Manages 6 flashback modes: cinematic, playable, fragmented, environment-triggered, clue-triggered, character-triggered.
 */

import { StoryState } from './StoryState.js';
import { events } from '../Core/EventBus.js';

export const FLASHBACK_TYPES = {
  CINEMATIC: 'cinematic',
  PLAYABLE: 'playable',
  FRAGMENTED: 'fragmented',
  ENVIRONMENT_TRIGGERED: 'environment-triggered',
  CLUE_TRIGGERED: 'clue-triggered',
  CHARACTER_TRIGGERED: 'character-triggered'
};

export class FlashbackSystem {
  constructor() {
    this.storyState = StoryState.get();
    this.activeFlashback = null;
    this.bindTriggerListeners();
  }

  bindTriggerListeners() {
    // 1. Clue Triggered Flashback
    events.on('CLUE_INSPECTED', (clue) => {
      if (clue && clue.id === 'clue_cctv_biolabs') {
        this.triggerFlashback('fb_biolabs_spill', FLASHBACK_TYPES.CLUE_TRIGGERED, {
          title: 'Memory Fragment: BioLabs Containment Breach',
          subtitles: 'Dr. Vance: "The quarantine seals failed! Shut down the main power grid!"'
        });
      }
    });

    // 2. Character Triggered Flashback
    events.on('CHARACTER_TRUST_BOOSTED', ({ charId }) => {
      if (charId === 'char_marco') {
        this.triggerFlashback('fb_marco_betrayal', FLASHBACK_TYPES.CHARACTER_TRIGGERED, {
          title: 'Flashback: Security Chief Marco\'s Secret Meeting',
          subtitles: 'Marco: "Nexus Corp lied to us all. They planted the malware in Precinct 4."'
        });
      }
    });

    // 3. Environment Triggered Flashback (Bank Vault / Power Station)
    events.on('MASTER_POWER_GRID_CHANGED', ({ isOnline }) => {
      if (!isOnline) {
        this.triggerFlashback('fb_blackout_night', FLASHBACK_TYPES.ENVIRONMENT_TRIGGERED, {
          title: 'Memory Fragment: Night of the First Blackout',
          subtitles: 'Radio Host: "Skies are turning dark over the Industrial District... emergency protocols active."'
        });
      }
    });
  }

  /**
   * Triggers a narrative flashback event.
   * @param {string} flashbackId 
   * @param {string} type 
   * @param {Object} data { title, subtitles, duration }
   */
  triggerFlashback(flashbackId, type = FLASHBACK_TYPES.CINEMATIC, data = {}) {
    if (!this.storyState.flashbacksUnlocked.includes(flashbackId)) {
      this.storyState.flashbacksUnlocked.push(flashbackId);
    }

    this.activeFlashback = {
      id: flashbackId,
      type,
      title: data.title || 'Memory Fragment',
      subtitles: data.subtitles || '',
      startTime: Date.now()
    };

    events.emit('FLASHBACK_STARTED', this.activeFlashback);
    events.emit('SHOW_SUBTITLE', {
      speaker: 'FLASHBACK MEMORY',
      text: `${this.activeFlashback.title} - ${this.activeFlashback.subtitles}`
    });

    return this.activeFlashback;
  }
}
