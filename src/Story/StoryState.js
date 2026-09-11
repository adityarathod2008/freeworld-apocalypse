/**
 * FreeWorld Engine - Story State (Phase 12)
 * Authoritative narrative state schema tracking chapters, missions, clues, flashbacks,
 * character relationships, major decision consequences, and ending flags.
 */

export const CHAPTER_DEFINITIONS = [
  { id: 1, name: 'Chapter 1: Pre-Apocalypse', description: 'Peaceful Bay City before the Nexus Corp bio-spill.' },
  { id: 2, name: 'Chapter 2: Outbreak Chaos', description: 'Initial infection outbreak and Downtown panic.' },
  { id: 3, name: 'Chapter 3: Freedom', description: 'Escaping initial containment zone and police blockade.' },
  { id: 4, name: 'Chapter 4: Mystery', description: 'Investigating Nexus Corp chemical leaks via clue graph.' },
  { id: 5, name: 'Chapter 5: Survivors', description: 'Forming survivor alliance with Marco, Dr. Vance & Detective Miller.' },
  { id: 6, name: 'Chapter 6: City Collapse', description: 'Final confrontation during total district overrun.' }
];

export class StoryState {
  static instance = null;

  constructor() {
    if (StoryState.instance) return StoryState.instance;
    StoryState.instance = this;

    this.chapterId = 1;
    this.missionId = 'm_ch1_intro';
    this.objectiveId = 'obj_meet_marco';
    this.missionStatus = 'IN_PROGRESS'; // 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
    this.chapterStatus = 'ACTIVE';

    this.cluesFound = [];
    this.flashbacksUnlocked = [];
    this.charactersDiscovered = ['char_marco', 'char_dr_vance', 'char_miller', 'char_hayes'];
    this.relationships = {
      'char_marco': 30,
      'char_dr_vance': 20,
      'char_miller': 40,
      'char_hayes': 50
    };

    this.majorDecisions = [];
    this.worldConsequences = [];
    this.endingFlags = [];
    this.bucketListProgress = 15;
    this.storyCompletionPercentage = 10;
  }

  static get() {
    if (!StoryState.instance) new StoryState();
    return StoryState.instance;
  }

  /**
   * Recalculates story completion percentage (0-100%).
   */
  updateCompletion() {
    const chapterWeight = (this.chapterId - 1) * 15;
    const clueWeight = Math.min(20, this.cluesFound.length * 2);
    const decisionWeight = Math.min(10, this.majorDecisions.length * 3);
    this.storyCompletionPercentage = Math.min(100, Math.round(chapterWeight + clueWeight + decisionWeight));
    return this.storyCompletionPercentage;
  }

  getState() {
    return {
      chapterId: this.chapterId,
      chapterName: CHAPTER_DEFINITIONS[this.chapterId - 1]?.name || `Chapter ${this.chapterId}`,
      missionId: this.missionId,
      objectiveId: this.objectiveId,
      missionStatus: this.missionStatus,
      chapterStatus: this.chapterStatus,
      cluesFound: [...this.cluesFound],
      flashbacksUnlocked: [...this.flashbacksUnlocked],
      charactersDiscovered: [...this.charactersDiscovered],
      relationships: { ...this.relationships },
      majorDecisions: [...this.majorDecisions],
      worldConsequences: [...this.worldConsequences],
      endingFlags: [...this.endingFlags],
      bucketListProgress: this.bucketListProgress,
      storyCompletionPercentage: this.updateCompletion()
    };
  }

  toJSON() {
    return this.getState();
  }

  fromJSON(data) {
    if (!data) return;
    this.chapterId = data.chapterId || 1;
    this.missionId = data.missionId || 'm_ch1_intro';
    this.objectiveId = data.objectiveId || 'obj_meet_marco';
    this.missionStatus = data.missionStatus || 'IN_PROGRESS';
    this.chapterStatus = data.chapterStatus || 'ACTIVE';
    this.cluesFound = data.cluesFound || [];
    this.flashbacksUnlocked = data.flashbacksUnlocked || [];
    this.charactersDiscovered = data.charactersDiscovered || [];
    this.relationships = data.relationships || {};
    this.majorDecisions = data.majorDecisions || [];
    this.worldConsequences = data.worldConsequences || [];
    this.endingFlags = data.endingFlags || [];
    this.bucketListProgress = data.bucketListProgress || 0;
    this.storyCompletionPercentage = data.storyCompletionPercentage || 0;
  }
}
