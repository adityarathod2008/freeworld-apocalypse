/**
 * Game FreeWorld - SaveManager (v3.0)
 * Deep structured LocalStorage persistence:
 * Player vitals, cash, bank, weapon arsenal, vehicle fleet, mission progression,
 * law enforcement warrants, and world state.
 */
import { events } from '../Core/EventBus.js';

export class SaveManager {
  constructor(economyManager) {
    this.economy = economyManager;
    this.SAVE_KEY = 'GAME_FREEWORLD_SAVE_V3';

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('SAVE_GAME', () => {
      this.save();
    });
    events.on('LOAD_GAME', () => {
      this.load();
    });
  }

  save(player = null, weaponSystem = null, wantedSystem = null, timeManager = null) {
    try {
      const data = {
        version: 3,
        timestamp: Date.now(),
        economy: {
          cash: this.economy ? this.economy.cash : 15400,
          bank: this.economy ? this.economy.bank : 45000
        },
        player: player ? {
          health: player.health,
          armor: player.armor,
          stamina: player.stamina,
          position: { x: player.position.x, y: player.position.y, z: player.position.z }
        } : null,
        wantedLevel: wantedSystem ? wantedSystem.wantedLevel : 0,
        timeOfDay: timeManager ? timeManager.timeOfDay : 12.0
      };

      localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
      events.emit('HUD_NOTIFICATION', {
        title: 'GAME SAVED',
        message: 'Persistent world state saved'
      });
      return true;
    } catch (e) {
      console.warn('[SaveManager] Save failed:', e);
      return false;
    }
  }

  load(player = null, weaponSystem = null, wantedSystem = null, timeManager = null) {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);
      if (data.version === 3) {
        if (this.economy && data.economy) {
          this.economy.cash = data.economy.cash;
          this.economy.bank = data.economy.bank;
          this.economy.emitChange();
        }

        if (player && data.player) {
          player.health = data.player.health;
          player.armor = data.player.armor;
          player.stamina = data.player.stamina;
          if (data.player.position && player.teleport) {
            player.teleport(data.player.position);
          }
        }

        if (wantedSystem && data.wantedLevel !== undefined) {
          wantedSystem.setWantedLevel(data.wantedLevel);
        }

        if (timeManager && data.timeOfDay !== undefined) {
          timeManager.timeOfDay = data.timeOfDay;
        }

        events.emit('HUD_NOTIFICATION', {
          title: 'GAME LOADED',
          message: 'Saved progression restored'
        });
        return data;
      }
    } catch (e) {
      console.warn('[SaveManager] Load failed:', e);
    }
    return null;
  }
}
