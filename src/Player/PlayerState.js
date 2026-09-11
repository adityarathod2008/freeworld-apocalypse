/**
 * Game FreeWorld - PlayerState
 * Manages player status: Health, Armor, Stamina, Weapons, Ammo, and persistent flags
 */
import { events } from '../Core/EventBus.js';

export class PlayerState {
  constructor() {
    this.health = 100;
    this.maxHealth = 100;
    this.armor = 50;
    this.maxArmor = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.isDead = false;

    this.weapons = [
      { id: 0, name: 'FISTS', clip: Infinity, reserve: Infinity },
      { id: 1, name: 'VORTEX-9', clip: 12, reserve: 48 },
      { id: 2, name: 'APEX CARBINE', clip: 30, reserve: 120 },
      { id: 3, name: 'TITAN BREAKER', clip: 8, reserve: 32 }
    ];
    this.activeWeaponIndex = 1;

    this.setupListeners();
  }

  setupListeners() {
    events.on('RESTORE_HEALTH', () => {
      this.health = this.maxHealth;
      this.emitChange();
    });

    events.on('RESTORE_ARMOR', () => {
      this.armor = this.maxArmor;
      this.emitChange();
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;

    // Armor absorbs 70% of damage first
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, amount * 0.7);
      this.armor -= absorbed;
      amount -= absorbed;
    }

    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.isDead = true;
      events.emit('PLAYER_DIED');
      events.emit('HUD_NOTIFICATION', {
        title: 'WASTED',
        message: 'You have been neutralized. Respawning at Safehouse...'
      });
    }

    this.emitChange();
  }

  useStamina(amount) {
    this.stamina = Math.max(0, this.stamina - amount);
    this.emitChange();
    return this.stamina > 0;
  }

  regenStamina(delta) {
    if (this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * 25);
      this.emitChange();
    }
  }

  emitChange() {
    events.emit('PLAYER_STATS_CHANGED', {
      health: this.health,
      armor: this.armor,
      stamina: this.stamina,
      isDead: this.isDead
    });
  }
}
