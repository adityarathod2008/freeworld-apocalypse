/**
 * FreeWorld Engine - AAA Opening Boot Sequence (Phase 13)
 * Controls the authentic boot pipeline:
 * Boot -> Loading Screen -> Main Menu -> Opening Cinematic -> Playable Prologue.
 */

import { events } from '../Core/EventBus.js';

export const BOOT_STAGES = {
  BOOT: 'BOOT',
  LOADING: 'LOADING',
  MENU: 'MENU',
  OPENING_CINEMATIC: 'OPENING_CINEMATIC',
  PLAYABLE_PROLOGUE: 'PLAYABLE_PROLOGUE'
};

export class OpeningBootSequence {
  constructor() {
    this.stage = BOOT_STAGES.BOOT;
    this.stageTimer = 0;
  }

  startBootFlow() {
    this.stage = BOOT_STAGES.BOOT;
    events.emit('BOOT_STAGE_CHANGED', { stage: this.stage });

    // Transition to loading after 1 second
    setTimeout(() => {
      this.stage = BOOT_STAGES.LOADING;
      events.emit('BOOT_STAGE_CHANGED', { stage: this.stage });

      // Transition to Menu after loading assets
      setTimeout(() => {
        this.stage = BOOT_STAGES.MENU;
        events.emit('BOOT_STAGE_CHANGED', { stage: this.stage });
        events.emit('SHOW_MAIN_MENU');
      }, 1500);
    }, 1000);
  }

  startNewGameSequence() {
    this.stage = BOOT_STAGES.OPENING_CINEMATIC;
    events.emit('BOOT_STAGE_CHANGED', { stage: this.stage });

    events.emit('SHOW_SUBTITLE', {
      speaker: 'RADIO ANNOUNCER',
      text: 'Good morning Bay City! Weather is 72°F in Downtown. Authorities report minor power fluctuations near District Substation 4.'
    });

    // Transition to Playable Prologue after opening cutscene
    setTimeout(() => {
      this.stage = BOOT_STAGES.PLAYABLE_PROLOGUE;
      events.emit('BOOT_STAGE_CHANGED', { stage: this.stage });

      events.emit('HUD_NOTIFICATION', {
        title: 'PROLOGUE STARTED',
        message: 'Normal life in Bay City... locate Marco at Pier 4.'
      });
    }, 3000);
  }
}
