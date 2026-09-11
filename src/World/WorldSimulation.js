/**
 * Game FreeWorld - WorldSimulation
 * Manages the systemic city rhythm, store hours, business activities, and district density factors
 */
import { events } from '../Core/EventBus.js';

export class WorldSimulation {
  constructor() {
    this.gameHour = 12; // 0 - 24
    this.trafficScale = 1.0;
    this.pedestrianScale = 1.0;
    this.policeHeatMultiplier = 1.0;

    this.setupListeners();
  }

  setupListeners() {
    events.on('TIME_UPDATE', ({ hour }) => {
      this.gameHour = hour;
      this.updateCityRhythm(hour);
    });
  }

  updateCityRhythm(hour) {
    // Rush hour morning (7 - 9 AM) and evening (5 - 8 PM)
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20)) {
      this.trafficScale = 1.4;
      this.pedestrianScale = 1.3;
    } else if (hour >= 23 || hour <= 5) {
      // Late night: quiet roads, higher criminal activity & police suspicion
      this.trafficScale = 0.4;
      this.pedestrianScale = 0.3;
      this.policeHeatMultiplier = 1.3;
    } else {
      this.trafficScale = 1.0;
      this.pedestrianScale = 1.0;
      this.policeHeatMultiplier = 1.0;
    }
  }

  isShopOpen(shopType) {
    // Apex Armory open 8 AM - 10 PM, Banks 9 AM - 6 PM
    if (shopType === 'bank') return this.gameHour >= 9 && this.gameHour < 18;
    if (shopType === 'armory') return this.gameHour >= 8 && this.gameHour < 22;
    return true; // 24/7 safehouses and ATMs
  }
}
