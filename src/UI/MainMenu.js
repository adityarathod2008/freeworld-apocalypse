/**
 * FreeWorld Engine - AAA Main Menu (Phase 13)
 * Full interactive main menu UI with support for:
 * NEW GAME, CONTINUE, CHAPTERS, BUCKET LIST, CHARACTERS, SETTINGS, EXIT.
 */

import { events } from '../Core/EventBus.js';
import { BucketListEngine } from '../BucketList/BucketListEngine.js';
import { StoryState } from '../Story/StoryState.js';

export const MENU_TABS = {
  MAIN: 'MAIN',
  CHAPTERS: 'CHAPTERS',
  BUCKET_LIST: 'BUCKET_LIST',
  CHARACTERS: 'CHARACTERS',
  SETTINGS: 'SETTINGS'
};

export class MainMenu {
  constructor() {
    this.activeTab = MENU_TABS.MAIN;
    this.isVisible = false;
    this.bucketListEngine = BucketListEngine.get();
    this.storyState = StoryState.get();

    this.createDOMOverlay();
  }

  createDOMOverlay() {
    if (typeof document === 'undefined') return;

    this.container = document.createElement('div');
    this.container.id = 'main-menu-overlay';
    this.container.style.cssText = `
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(10, 15, 26, 0.95);
      color: #f8fafc;
      font-family: 'Inter', sans-serif;
      display: none;
      z-index: 9999;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;

    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="font-size: 3.5rem; letter-spacing: 0.2rem; color: #38bdf8; margin: 0;">FREEWORLD</h1>
        <p style="font-size: 1.1rem; color: #94a3b8; letter-spacing: 0.1rem;">SURVIVAL APOCALYPSE SIMULATION</p>
      </div>

      <div id="menu-buttons-container" style="display: flex; flex-direction: column; gap: 1rem; width: 280px;">
        <button id="btn-new-game" class="menu-btn">NEW GAME</button>
        <button id="btn-continue" class="menu-btn">CONTINUE</button>
        <button id="btn-chapters" class="menu-btn">CHAPTERS</button>
        <button id="btn-bucket-list" class="menu-btn">BUCKET LIST (100)</button>
        <button id="btn-characters" class="menu-btn">CHARACTERS</button>
        <button id="btn-settings" class="menu-btn">SETTINGS</button>
        <button id="btn-exit" class="menu-btn">EXIT</button>
      </div>

      <div id="menu-subscreen" style="margin-top: 2rem; max-width: 600px; text-align: center; display: none;"></div>
    `;

    document.body.appendChild(this.container);
    this.bindDOMEvents();
  }

  bindDOMEvents() {
    if (typeof document === 'undefined') return;

    document.getElementById('btn-new-game')?.addEventListener('click', () => this.selectOption('NEW_GAME'));
    document.getElementById('btn-continue')?.addEventListener('click', () => this.selectOption('CONTINUE'));
    document.getElementById('btn-chapters')?.addEventListener('click', () => this.selectTab(MENU_TABS.CHAPTERS));
    document.getElementById('btn-bucket-list')?.addEventListener('click', () => this.selectTab(MENU_TABS.BUCKET_LIST));
    document.getElementById('btn-characters')?.addEventListener('click', () => this.selectTab(MENU_TABS.CHARACTERS));
    document.getElementById('btn-settings')?.addEventListener('click', () => this.selectTab(MENU_TABS.SETTINGS));
    document.getElementById('btn-exit')?.addEventListener('click', () => this.selectOption('EXIT'));
  }

  selectOption(optionKey) {
    events.emit('MAIN_MENU_OPTION_SELECTED', { optionKey });

    if (optionKey === 'NEW_GAME') {
      this.hide();
      events.emit('START_NEW_GAME_FLOW');
    } else if (optionKey === 'CONTINUE') {
      this.hide();
      events.emit('LOAD_GAME_STATE');
    } else if (optionKey === 'EXIT') {
      console.log('[MainMenu] Exiting Game FreeWorld...');
    }
  }

  selectTab(tab) {
    this.activeTab = tab;
    events.emit('MENU_TAB_CHANGED', { tab });

    const subscreen = document.getElementById('menu-subscreen');
    if (!subscreen) return;

    subscreen.style.display = 'block';
    if (tab === MENU_TABS.BUCKET_LIST) {
      const pct = this.bucketListEngine.getCompletionPercentage();
      subscreen.innerHTML = `<h3 style="color:#38bdf8;">100-ITEM BUCKET LIST</h3><p>Completion: ${pct}%</p><p>Total Activities: 100 original challenges across 12 categories.</p>`;
    } else if (tab === MENU_TABS.CHAPTERS) {
      subscreen.innerHTML = `<h3 style="color:#38bdf8;">CHAPTER SELECT</h3><p>Current Chapter: ${this.storyState.chapterId}</p>`;
    } else if (tab === MENU_TABS.CHARACTERS) {
      subscreen.innerHTML = `<h3 style="color:#38bdf8;">CHARACTER DOSSIERS</h3><p>Discovered Story Characters: 4</p>`;
    } else if (tab === MENU_TABS.SETTINGS) {
      subscreen.innerHTML = `<h3 style="color:#38bdf8;">GAME SETTINGS</h3><p>Graphics: AAA High Quality | Audio: 3D Spatial | Controls: WASD + Mouse</p>`;
    }
  }

  show() {
    this.isVisible = true;
    if (this.container) this.container.style.display = 'flex';
  }

  hide() {
    this.isVisible = false;
    if (this.container) this.container.style.display = 'none';
  }
}
