/**
 * FreeWorld Engine - Master Story Engine (Phase 12)
 * Coordinates 6-Chapter narrative structure, Branching Choices, Flashbacks, Cinematics, and Clue Graph Integration.
 */

import { StoryState } from './StoryState.js';
import { BranchingSystem } from './BranchingSystem.js';
import { FlashbackSystem } from './FlashbackSystem.js';
import { CinematicEngine } from './CinematicEngine.js';
import { events } from '../Core/EventBus.js';

export class StoryEngine {
  static instance = null;

  /**
   * @param {THREE.Camera} camera 
   */
  constructor(camera = null) {
    if (StoryEngine.instance) return StoryEngine.instance;
    StoryEngine.instance = this;

    this.camera = camera;
    this.storyState = StoryState.get();
    this.branchingSystem = new BranchingSystem();
    this.flashbackSystem = new FlashbackSystem();
    this.cinematicEngine = new CinematicEngine(camera);

    this.bindStoryListeners();
  }

  static get() {
    if (!StoryEngine.instance) new StoryEngine();
    return StoryEngine.instance;
  }

  bindStoryListeners() {
    // 1. Clue Graph objective unlocks advance story state
    events.on('STORY_OBJECTIVE_UNLOCKED', (objNode) => {
      if (objNode) {
        this.storyState.objectiveId = objNode.id;
        this.storyState.updateCompletion();
      }
    });

    // 2. Outbreak collapse severity advances story chapters
    events.on('DISTRICT_STATE_CHANGED', ({ newState }) => {
      if (newState === 'PANIC' && this.storyState.chapterId === 1) {
        this.advanceChapter(2);
      } else if (newState === 'EVACUATION' && this.storyState.chapterId === 2) {
        this.advanceChapter(3);
      } else if (newState === 'QUARANTINE' && this.storyState.chapterId === 3) {
        this.advanceChapter(4);
      } else if (newState === 'COLLAPSE' && this.storyState.chapterId === 4) {
        this.advanceChapter(5);
      } else if (newState === 'OVERRUN' && this.storyState.chapterId === 5) {
        this.advanceChapter(6);
      }
    });
  }

  /**
   * Advances narrative to target chapter (1 to 6).
   * @param {number} nextChapterId 
   */
  advanceChapter(nextChapterId) {
    if (nextChapterId > this.storyState.chapterId && nextChapterId <= 6) {
      const prev = this.storyState.chapterId;
      this.storyState.chapterId = nextChapterId;
      this.storyState.chapterStatus = 'ACTIVE';
      this.storyState.updateCompletion();

      events.emit('STORY_CHAPTER_ADVANCED', {
        prevChapterId: prev,
        newChapterId: nextChapterId,
        completion: this.storyState.storyCompletionPercentage
      });

      events.emit('HUD_NOTIFICATION', {
        title: `CHAPTER ${nextChapterId} UNLOCKED`,
        message: `Advanced to Chapter ${nextChapterId}!`
      });
    }
  }

  /**
   * Executes major narrative branching decision.
   */
  makeChoice(choiceId, optionKey) {
    return this.branchingSystem.makeDecision(choiceId, optionKey);
  }

  /**
   * Updates story engine & cinematic camera updates.
   * @param {number} delta 
   */
  update(delta) {
    this.cinematicEngine.update(delta);
    this.storyState.updateCompletion();
  }

  toJSON() {
    return this.storyState.toJSON();
  }

  fromJSON(data) {
    this.storyState.fromJSON(data);
  }
}
