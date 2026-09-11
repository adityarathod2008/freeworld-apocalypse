/**
 * Game FreeWorld - NPCPersonality (Phase 7)
 * Authoritative 8-trait human personality matrix driving distinct NPC decision-making:
 * bravery, fear, aggression, curiosity, loyalty, selfishness, discipline, riskTolerance.
 */

export class NPCPersonality {
  constructor(config = {}) {
    // 8 Core Personality Traits (0.0 to 1.0)
    this.bravery = config.bravery !== undefined ? config.bravery : Math.random();
    this.fear = config.fear !== undefined ? config.fear : Math.random();
    this.aggression = config.aggression !== undefined ? config.aggression : Math.random();
    this.curiosity = config.curiosity !== undefined ? config.curiosity : Math.random();
    this.loyalty = config.loyalty !== undefined ? config.loyalty : Math.random();
    this.selfishness = config.selfishness !== undefined ? config.selfishness : Math.random();
    this.discipline = config.discipline !== undefined ? config.discipline : Math.random();
    this.riskTolerance = config.riskTolerance !== undefined ? config.riskTolerance : Math.random();

    // Archetype Presets
    if (config.archetype) {
      this.applyArchetype(config.archetype);
    }
  }

  applyArchetype(archetype) {
    switch (archetype) {
      case 'SECURITY':
      case 'POLICE':
        this.bravery = 0.85; this.fear = 0.15; this.aggression = 0.70;
        this.discipline = 0.90; this.loyalty = 0.80; this.riskTolerance = 0.65;
        break;
      case 'CIVILIAN_FEARFUL':
        this.bravery = 0.15; this.fear = 0.85; this.aggression = 0.10;
        this.selfishness = 0.80; this.curiosity = 0.20; this.riskTolerance = 0.10;
        break;
      case 'CIVILIAN_CURIOUS':
        this.curiosity = 0.90; this.riskTolerance = 0.70; this.fear = 0.30;
        break;
      case 'AGGRESSIVE_STREET':
        this.aggression = 0.85; this.bravery = 0.75; this.discipline = 0.20;
        this.riskTolerance = 0.85; this.selfishness = 0.75;
        break;
    }
  }

  evaluateFightScore(threatSeverity = 1.0, hasWeapon = false) {
    let score = (this.bravery * 0.4) + (this.aggression * 0.4) + (this.riskTolerance * 0.2) - (this.fear * 0.5);
    if (hasWeapon) score += 0.3;
    score -= (threatSeverity * 0.2);
    return Math.max(0, Math.min(1, score));
  }

  evaluateFleeScore(threatSeverity = 1.0, traumaLevel = 0) {
    let score = (this.fear * 0.4) + (this.selfishness * 0.3) + (1.0 - this.bravery) * 0.3;
    score += (threatSeverity * 0.25) + (traumaLevel / 100 * 0.2);
    return Math.max(0, Math.min(1, score));
  }

  evaluateInvestigateScore(anomalyDistance = 10) {
    let score = (this.curiosity * 0.5) + (this.riskTolerance * 0.3) - (this.fear * 0.4);
    if (anomalyDistance > 25) score -= 0.3;
    return Math.max(0, Math.min(1, score));
  }

  evaluateCooperationScore(isFriend = false) {
    let score = (this.loyalty * 0.4) + (this.discipline * 0.3) - (this.selfishness * 0.4);
    if (isFriend) score += 0.35;
    return Math.max(0, Math.min(1, score));
  }
}
