/**
 * Game FreeWorld - RandomEvents
 * Systemic procedural events: ATM muggings, street encounters, courier opportunities
 */
import { events } from '../Core/EventBus.js';

export class RandomEvents {
  constructor(economy) {
    this.economy = economy;
    this.eventCooldown = 45.0; // Seconds between random world opportunities
    this.activeEvent = null;
  }

  update(delta, playerPos) {
    if (this.eventCooldown > 0) {
      this.eventCooldown -= delta;
      if (this.eventCooldown <= 0) {
        this.triggerRandomEvent(playerPos);
      }
    }
  }

  triggerRandomEvent(playerPos) {
    this.eventCooldown = 90.0 + Math.random() * 60.0;

    const eventList = [
      {
        title: 'COURIER OPPORTUNITY',
        message: 'A high-value priority package dropped nearby. Deliver to Safehouse for $2,500.',
        reward: 2500
      },
      {
        title: 'STREET ENCOUNTER',
        message: 'Underworld informant tipped off a cash drop in the Harbor alleys!',
        reward: 3500
      }
    ];

    const ev = eventList[Math.floor(Math.random() * eventList.length)];
    this.activeEvent = ev;

    events.emit('HUD_NOTIFICATION', {
      title: ev.title,
      message: ev.message
    });
  }
}
