/**
 * Game FreeWorld - ObjectiveSystem
 * Atomic mission objective descriptors: Travel, Infiltrate, Hack, Steal, Chase, Escape
 */
export const OBJECTIVE_TYPES = {
  TRAVEL: 'TRAVEL',
  TALK: 'TALK',
  STEAL_VEHICLE: 'STEAL_VEHICLE',
  INFILTRATE: 'INFILTRATE',
  COMBAT: 'COMBAT',
  ESCAPE_POLICE: 'ESCAPE_POLICE',
  DELIVER: 'DELIVER'
};

export class MissionObjective {
  constructor(config = {}) {
    this.id = config.id || 'obj';
    this.type = config.type || OBJECTIVE_TYPES.TRAVEL;
    this.title = config.title || 'Objective';
    this.description = config.description || '';
    this.targetPos = config.targetPos || null;
    this.radius = config.radius || 8.0;
    this.isCompleted = false;
    this.isFailed = false;
  }

  checkCompletion(playerPos, conditions = {}) {
    if (this.targetPos && playerPos) {
      if (playerPos.distanceTo(this.targetPos) <= this.radius) {
        this.isCompleted = true;
        return true;
      }
    }
    return false;
  }
}
