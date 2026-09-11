/**
 * Game FreeWorld - SaveSchema
 * Versioned save data schema with migration support
 */
export const SAVE_VERSION = 1;

export class SaveSchema {
  static createDefaultSave() {
    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      player: {
        health: 100,
        armor: 50,
        cash: 15400,
        bank: 45000,
        position: { x: 0, y: 0.5, z: 20 },
        weapons: [
          { id: 1, name: 'VORTEX-9', ammo: 48 },
          { id: 2, name: 'APEX CARBINE', ammo: 120 }
        ]
      },
      missions: {
        mainHeistCompleted: false,
        stage: 1
      },
      reputation: {
        streetRep: 250,
        syndicateTrust: 300
      },
      settings: {
        quality: 'HIGH',
        masterVolume: 1.0,
        subtitles: true
      }
    };
  }

  static migrate(data) {
    if (!data) return this.createDefaultSave();
    // In future versions, apply migrations: if (data.version === 0) { ... }
    return data;
  }
}
