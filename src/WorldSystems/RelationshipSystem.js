/**
 * Game FreeWorld - RelationshipSystem
 * Underworld faction standings: The Syndicate, Bay City Police Department, Civilians
 */
export class RelationshipSystem {
  constructor() {
    this.factions = {
      syndicate: { name: 'The Syndicate', standing: 75 },
      police: { name: 'Bay City PD', standing: -20 },
      civilians: { name: 'Civilians', standing: 50 }
    };
  }

  getStanding(factionKey) {
    return this.factions[factionKey] ? this.factions[factionKey].standing : 0;
  }
}
