/**
 * Game FreeWorld - LODManager (v5.0)
 * Multi-Tier Simulation LOD Controller
 * Classifies entities into Near, Mid, Far, and Unloaded simulation tiers:
 * - NEAR (<75m): Full 3D, physics, IK animation, shadows, spatial audio, raycasts.
 * - MID (75–180m): Kinematic physics, instanced geometry, reduced update rate.
 * - FAR (180–320m): Macro statistical simulation, vector movement, scheduled updates.
 * - UNLOADED (>320m): Serialized state, persistent timetables, background state ticks.
 */
export class LODManager {
  static NEAR_DIST = 75;
  static MID_DIST = 180;
  static FAR_DIST = 320;

  static getLODLevel(entityPos, playerPos) {
    if (!playerPos || !entityPos) return 'FAR';
    const distSq = entityPos.distanceToSquared(playerPos);

    if (distSq < this.NEAR_DIST * this.NEAR_DIST) {
      return 'NEAR';
    } else if (distSq < this.MID_DIST * this.MID_DIST) {
      return 'MID';
    } else if (distSq < this.FAR_DIST * this.FAR_DIST) {
      return 'FAR';
    }
    return 'UNLOADED';
  }

  static getLODDistance(entityPos, playerPos) {
    if (!playerPos || !entityPos) return Infinity;
    return entityPos.distanceTo(playerPos);
  }

  static isVisible(lodLevel) {
    return lodLevel !== 'UNLOADED';
  }

  static isFullPhysics(lodLevel) {
    return lodLevel === 'NEAR';
  }

  static getUpdateInterval(lodLevel) {
    switch (lodLevel) {
      case 'NEAR': return 1;       // 60 Hz
      case 'MID': return 2;        // 30 Hz
      case 'FAR': return 6;        // 10 Hz
      case 'UNLOADED': return 30;  // 2 Hz
      default: return 1;
    }
  }

  static getLODInfo(entityPos, playerPos) {
    const dist = this.getLODDistance(entityPos, playerPos);
    let lodTier = 'UNLOADED';
    if (dist < this.NEAR_DIST) lodTier = 'NEAR';
    else if (dist < this.MID_DIST) lodTier = 'MID';
    else if (dist < this.FAR_DIST) lodTier = 'FAR';

    return {
      lodTier,
      distance: dist,
      isVisible: lodTier !== 'UNLOADED',
      isFullPhysics: lodTier === 'NEAR',
      updateInterval: this.getUpdateInterval(lodTier)
    };
  }
}

