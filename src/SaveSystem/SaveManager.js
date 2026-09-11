/**
 * Game FreeWorld - SaveManager (v5.0)
 * Deep structured LocalStorage persistence:
 * Versioned save schema, validation, automatic migration, and GameState reconstruction.
 */
import { events } from '../Core/EventBus.js';
import { GameState } from '../Core/GameState.js';
import { SaveSchema } from './SaveSchema.js';
import { BucketListEngine } from '../BucketList/BucketListEngine.js';

export class SaveManager {
  constructor(economyManager) {
    this.economy = economyManager;
    this.SAVE_KEY = 'GAME_FREEWORLD_SAVE_V5';
    this.gameState = GameState.get();

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
      // 1. Synchronize live subsystem parameters into GameState
      if (player) {
        this.gameState.playerState.health = player.health;
        this.gameState.playerState.armor = player.armor;
        this.gameState.playerState.stamina = player.stamina;
        if (player.position) {
          this.gameState.playerState.position = { x: player.position.x, y: player.position.y, z: player.position.z };
        }
      }

      const bucketListEngine = BucketListEngine.get();
      if (bucketListEngine) {
        this.gameState.bucketListState.completedItems = Object.keys(bucketListEngine.toJSON());
      }

      if (this.economy) {
        this.gameState.playerState.cash = this.economy.cash;
        this.gameState.playerState.bank = this.economy.bank;
      }

      if (wantedSystem) {
        this.gameState.policeState.wantedLevel = wantedSystem.wantedLevel;
      }

      if (timeManager) {
        this.gameState.worldState.timeOfDay = timeManager.timeOfDay;
      }

      this.gameState.persistenceState.saveCount++;
      this.gameState.persistenceState.lastSaveTime = Date.now();

      // 2. Serialize GameState
      const serialized = this.gameState.toJSON();

      // 3. Validate serialized state
      if (!SaveSchema.validate(serialized)) {
        console.error('[SaveManager] Serialized state failed schema validation. Aborting save.');
        return false;
      }

      // 4. Persist to storage
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(serialized));

      events.emit('HUD_NOTIFICATION', {
        title: 'GAME SAVED',
        message: `Version ${serialized.saveVersion} world state persisted.`
      });

      return true;
    } catch (e) {
      console.warn('[SaveManager] Save operation failed:', e);
      return false;
    }
  }

  load(player = null, weaponSystem = null, wantedSystem = null, timeManager = null) {
    try {
      // Check current V5 save key or legacy V3 save key
      let raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) {
        raw = localStorage.getItem('GAME_FREEWORLD_SAVE_V3');
      }

      if (!raw) return null;

      const parsed = JSON.parse(raw);

      // 1. Validate incoming save payload
      if (!SaveSchema.validate(parsed)) {
        console.warn('[SaveManager] Raw save payload invalid or corrupt');
        return null;
      }

      // 2. Migrate data
      const migrated = SaveSchema.migrate(parsed);

      // 3. Reconstruct GameState
      this.gameState.fromJSON(migrated);

      // 4. Reconstruct Live Subsystems
      if (this.economy && migrated.playerState) {
        if (migrated.playerState.cash !== undefined) this.economy.cash = migrated.playerState.cash;
        if (migrated.playerState.bank !== undefined) this.economy.bank = migrated.playerState.bank;
        this.economy.emitChange();
      }

      if (player && migrated.playerState) {
        if (migrated.playerState.health !== undefined) player.health = migrated.playerState.health;
        if (migrated.playerState.armor !== undefined) player.armor = migrated.playerState.armor;
        if (migrated.playerState.stamina !== undefined) player.stamina = migrated.playerState.stamina;
        if (migrated.playerState.position && player.teleport) {
          player.teleport(migrated.playerState.position);
        }
      }

      if (wantedSystem && migrated.policeState) {
        wantedSystem.setWantedLevel(migrated.policeState.wantedLevel || 0);
      }

      if (timeManager && migrated.worldState) {
        if (migrated.worldState.timeOfDay !== undefined) {
          timeManager.timeOfDay = migrated.worldState.timeOfDay;
        }
      }

      const bucketListEngine = BucketListEngine.get();
      if (bucketListEngine && migrated.bucketListState && Array.isArray(migrated.bucketListState.completedItems)) {
        migrated.bucketListState.completedItems.forEach(id => bucketListEngine.completeItem(id));
      }

      events.emit('HUD_NOTIFICATION', {
        title: 'GAME LOADED',
        message: `Version ${migrated.saveVersion} save restored successfully.`
      });

      return migrated;
    } catch (e) {
      console.warn('[SaveManager] Load operation failed:', e);
      return null;
    }
  }
}

