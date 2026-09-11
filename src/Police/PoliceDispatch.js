/**
 * Game FreeWorld - PoliceDispatch
 * Police radio scanner announcements, escalation tiers, tactical road block coordination
 */
import { events } from '../Core/EventBus.js';

export const DISPATCH_VOICELINES = [
  'All units, suspect spotted Downtown. Engage with caution.',
  '10-4, suspect is actively evading line of sight.',
  'Requesting immediate backup on the boulevard!',
  'Suspect vehicle description broadcast to all patrol units.',
  'Code 3 authorized. Spike strips and roadblocks deployed.'
];

export class PoliceDispatch {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    events.on('WANTED_LEVEL_CHANGED', ({ level }) => {
      if (level > 0) {
        const line = DISPATCH_VOICELINES[Math.min(level - 1, DISPATCH_VOICELINES.length - 1)];
        events.emit('SHOW_SUBTITLE', {
          speaker: 'POLICE DISPATCH',
          text: `"${line}"`
        });
      }
    });
  }
}
