/**
 * FreeWorld Engine - Story Dashboard (Phase 13)
 * Full telemetry view displaying story %, chapter, active objectives, clues, flashbacks,
 * character relationships, decisions, world consequences, and bucket list %.
 */

import { StoryState } from '../Story/StoryState.js';
import { BucketListEngine } from '../BucketList/BucketListEngine.js';

export class StoryDashboard {
  constructor() {
    this.storyState = StoryState.get();
    this.bucketListEngine = BucketListEngine.get();
    this.isVisible = false;

    this.createDOMOverlay();
  }

  createDOMOverlay() {
    if (typeof document === 'undefined') return;

    this.container = document.createElement('div');
    this.container.id = 'story-dashboard-overlay';
    this.container.style.cssText = `
      position: absolute;
      top: 5%; left: 5%; width: 90%; height: 90%;
      background: rgba(15, 23, 42, 0.96);
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      border: 1px solid #0284c7;
      border-radius: 8px;
      display: none;
      z-index: 9998;
      padding: 2rem;
      box-sizing: border-box;
      overflow-y: auto;
    `;

    document.body.appendChild(this.container);
  }

  renderTelemetry() {
    const s = this.storyState.getState();
    const blPct = this.bucketListEngine.getCompletionPercentage();

    return {
      storyCompletionPercentage: s.storyCompletionPercentage,
      chapterId: s.chapterId,
      chapterName: s.chapterName,
      missionId: s.missionId,
      objectiveId: s.objectiveId,
      cluesCount: s.cluesFound.length,
      flashbacksCount: s.flashbacksUnlocked.length,
      charactersCount: s.charactersDiscovered.length,
      relationships: s.relationships,
      decisionsCount: s.majorDecisions.length,
      worldConsequencesCount: s.worldConsequences.length,
      bucketListPercentage: blPct
    };
  }

  show() {
    this.isVisible = true;
    if (this.container) {
      const data = this.renderTelemetry();
      this.container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 1rem;">
          <h2 style="color: #38bdf8; margin: 0;">STORY DASHBOARD & TELEMETRY</h2>
          <span style="font-size: 1.2rem; color: #f59e0b;">Story Completion: ${data.storyCompletionPercentage}% | Bucket List: ${data.bucketListPercentage}%</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
          <div>
            <h4 style="color: #94a3b8;">CURRENT CHAPTER</h4>
            <p><strong>${data.chapterName}</strong></p>
            <p>Active Objective: ${data.objectiveId}</p>
            <h4 style="color: #94a3b8; margin-top: 1rem;">DISCOVERIES & RECOLLECTION</h4>
            <p>Clues Found: ${data.cluesCount} / 11</p>
            <p>Flashbacks Unlocked: ${data.flashbacksCount} / 6</p>
          </div>
          <div>
            <h4 style="color: #94a3b8;">CHARACTER RELATIONSHIPS</h4>
            <p>Marco Vance: ${data.relationships['char_marco'] || 30}% Trust</p>
            <p>Dr. Elena Vance: ${data.relationships['char_dr_vance'] || 20}% Trust</p>
            <p>Detective Miller: ${data.relationships['char_miller'] || 40}% Trust</p>
            <h4 style="color: #94a3b8; margin-top: 1rem;">DECISION CONSEQUENCES</h4>
            <p>Major Decisions Made: ${data.decisionsCount}</p>
            <p>Active World Consequences: ${data.worldConsequencesCount}</p>
          </div>
        </div>
      `;
      this.container.style.display = 'block';
    }
  }

  hide() {
    this.isVisible = false;
    if (this.container) this.container.style.display = 'none';
  }
}
