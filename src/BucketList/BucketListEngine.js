/**
 * FreeWorld Engine - Bucket List Engine (Phase 13)
 * Manages 100 activities, completion tracking, rewards, and save/load persistence.
 */

import { BUCKET_LIST_ITEMS, BUCKET_LIST_CATEGORIES } from './BucketListData.js';
import { events } from '../Core/EventBus.js';

export class BucketListEngine {
  static instance = null;

  constructor() {
    if (BucketListEngine.instance) return BucketListEngine.instance;
    BucketListEngine.instance = this;

    this.items = new Map();
    this.initItems();
  }

  static get() {
    if (!BucketListEngine.instance) new BucketListEngine();
    return BucketListEngine.instance;
  }

  initItems() {
    BUCKET_LIST_ITEMS.forEach(item => {
      this.items.set(item.id, {
        ...item,
        completed: false,
        completionTimestamp: null
      });
    });
  }

  /**
   * Completes a bucket list item by ID.
   * @param {string} itemId 
   * @returns {Object|null} Completed item record
   */
  completeItem(itemId) {
    const item = this.items.get(itemId);
    if (item && !item.completed) {
      item.completed = true;
      item.completionTimestamp = Date.now();

      events.emit('BUCKET_LIST_ITEM_COMPLETED', {
        itemId: item.id,
        item,
        reward: item.reward,
        completionPercentage: this.getCompletionPercentage()
      });

      events.emit('HUD_NOTIFICATION', {
        title: 'BUCKET LIST COMPLETED!',
        message: `${item.title} (+ $${item.reward.cash})`
      });

      return item;
    }
    return null;
  }

  getCategoryItems(category) {
    return Array.from(this.items.values()).filter(i => i.category === category);
  }

  getItem(itemId) {
    return this.items.get(itemId);
  }

  isCompleted(itemId) {
    const item = this.items.get(itemId);
    return item ? Boolean(item.completed) : false;
  }

  getAllItems() {
    return Array.from(this.items.values());
  }

  getCompletedItems() {
    return Array.from(this.items.values()).filter(i => i.completed);
  }

  getCompletionPercentage() {
    const completed = this.getCompletedItems().length;
    return Math.min(100, Math.round((completed / BUCKET_LIST_ITEMS.length) * 100));
  }

  toJSON() {
    const data = {};
    for (const [id, item] of this.items.entries()) {
      if (item.completed) {
        data[id] = { completed: true, timestamp: item.completionTimestamp };
      }
    }
    return data;
  }

  getCompletedCount() {
    return this.getCompletedItems().length;
  }

  reset() {
    this.items.forEach(item => {
      item.completed = false;
      item.completionTimestamp = null;
    });
  }

  fromJSON(data) {
    if (!data) return;
    for (const id in data) {
      if (this.items.has(id)) {
        const item = this.items.get(id);
        item.completed = data[id].completed || false;
        item.completionTimestamp = data[id].timestamp || null;
      }
    }
  }
}
