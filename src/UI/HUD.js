/**
 * Game FreeWorld - HUD
 * Coordinates the AAA minimalist HUD: health/armor/stamina bars, cash, wanted stars, speedometer
 */
import { events } from '../Core/EventBus.js';

export class HUD {
  constructor() {
    this.barHealth = document.getElementById('bar-health');
    this.barArmor = document.getElementById('bar-armor');
    this.barStamina = document.getElementById('bar-stamina');
    this.cashDisplay = document.getElementById('cash-display');
    this.speedometer = document.getElementById('speedometer-container');
    this.speedDigits = document.getElementById('speed-digits');
    this.rpmBar = document.getElementById('rpm-bar');
    this.gearIndicator = document.getElementById('gear-indicator');
    this.vehicleName = document.getElementById('vehicle-name');

    this.setupListeners();
  }

  setupListeners() {
    events.on('PLAYER_STATS_CHANGED', ({ health, armor, stamina }) => {
      if (this.barHealth) this.barHealth.style.width = `${Math.max(0, health)}%`;
      if (this.barArmor) this.barArmor.style.width = `${Math.max(0, armor)}%`;
      if (this.barStamina) this.barStamina.style.width = `${Math.max(0, stamina)}%`;
    });

    events.on('ECONOMY_CHANGED', ({ cash }) => {
      if (this.cashDisplay) {
        this.cashDisplay.textContent = `$${cash.toLocaleString()}`;
      }
    });

    events.on('VEHICLE_TELEMETRY', ({ speedKmh, rpm, gear, vehicleName }) => {
      if (this.speedometer) this.speedometer.style.display = 'block';
      if (this.speedDigits) this.speedDigits.textContent = Math.round(speedKmh);
      if (this.rpmBar) this.rpmBar.style.width = `${Math.min(100, (rpm / 7500) * 100)}%`;
      if (this.gearIndicator) this.gearIndicator.textContent = gear || 'D';
      if (this.vehicleName) this.vehicleName.textContent = vehicleName || 'VEHICLE';
    });

    events.on('PLAYER_EXITED_VEHICLE', () => {
      if (this.speedometer) this.speedometer.style.display = 'none';
    });
  }
}
