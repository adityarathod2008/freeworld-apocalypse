/**
 * Game FreeWorld - NotificationSystem
 * Toast banners, mission alerts, splash notifications, and objective updates
 */
import { events } from '../Core/EventBus.js';

export class NotificationSystem {
  constructor() {
    this.container = document.getElementById('mission-notification');
    this.titleEl = document.getElementById('mission-notif-title');
    this.subEl = document.getElementById('mission-notif-sub');

    this.setupListeners();
  }

  setupListeners() {
    events.on('HUD_NOTIFICATION', ({ title, message }) => {
      this.showToast(title, message);
    });

    events.on('MISSION_SPLASH', ({ title, subtitle }) => {
      this.showSplash(title, subtitle);
    });
  }

  showToast(title, message) {
    if (!this.container) return;
    if (this.titleEl) this.titleEl.textContent = title;
    if (this.subEl) this.subEl.textContent = message;

    this.container.classList.add('active');
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.container.classList.remove('active');
    }, 3800);
  }

  showSplash(title, subtitle) {
    this.showToast(title, subtitle);
  }
}
