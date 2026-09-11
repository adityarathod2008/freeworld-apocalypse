/**
 * Game FreeWorld - ReputationSystem
 * 4-axis Underworld reputation: Street Rep, Police Heat, Syndicate Trust, and Business Standing
 */
import { events } from '../Core/EventBus.js';

export class ReputationSystem {
  constructor() {
    this.streetRep = 250; // 0 - 1000
    this.syndicateTrust = 300; // 0 - 1000
    this.policeHeatMultiplier = 1.0;

    this.setupListeners();
  }

  setupListeners() {
    events.on('MISSION_FINISHED', ({ success }) => {
      if (success) {
        this.addStreetRep(150);
        this.syndicateTrust = Math.min(1000, this.syndicateTrust + 100);
      }
    });
  }

  addStreetRep(amount) {
    this.streetRep = Math.min(1000, this.streetRep + amount);
    events.emit('HUD_NOTIFICATION', {
      title: 'RESPECT EARNED',
      message: `+ ${amount} Street Reputation`
    });
  }
}
