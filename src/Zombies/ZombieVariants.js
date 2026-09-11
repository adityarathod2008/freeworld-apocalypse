/**
 * FreeWorld Engine - Zombie Variants (Phase 9)
 * Defines archetype variants: Walker, Runner, Crawler, Brute, Screamer.
 */

export const ZOMBIE_VARIANTS = {
  WALKER: {
    type: 'WALKER',
    health: 100,
    speedMult: 1.0,
    damageMult: 1.0,
    color: 0x475569, // Slate gray
    scale: { x: 1.0, y: 1.0, z: 1.0 }
  },
  RUNNER: {
    type: 'RUNNER',
    health: 65,
    speedMult: 2.2,
    damageMult: 1.2,
    color: 0x991b1b, // Crimson red
    scale: { x: 0.95, y: 1.02, z: 0.95 }
  },
  CRAWLER: {
    type: 'CRAWLER',
    health: 45,
    speedMult: 0.5,
    damageMult: 0.8,
    color: 0x3f6212, // Dark olive
    scale: { x: 1.1, y: 0.4, z: 1.1 }
  },
  BRUTE: {
    type: 'BRUTE',
    health: 350,
    speedMult: 0.85,
    damageMult: 2.2,
    color: 0x1e293b, // Dark navy
    scale: { x: 1.45, y: 1.3, z: 1.45 }
  },
  SCREAMER: {
    type: 'SCREAMER',
    health: 80,
    speedMult: 1.2,
    damageMult: 0.7,
    color: 0x6b21a8, // Deep purple
    scale: { x: 0.9, y: 1.1, z: 0.9 },
    canScream: true
  }
};
