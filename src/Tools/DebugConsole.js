/**
 * Game FreeWorld - DebugConsole
 * Developer tools, teleportation, cheats, weather/time overrides, and live performance metrics
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class DebugConsole {
  constructor(landmarks) {
    this.landmarks = landmarks;
    this.panel = document.getElementById('debug-panel');
    this.closeBtn = document.getElementById('debug-close-btn');
    this.isOpen = false;

    // Telemetry text elements
    this.fpsEl = document.getElementById('dbg-fps');
    this.drawCallsEl = document.getElementById('dbg-drawcalls');
    this.npcsEl = document.getElementById('dbg-npcs');
    this.carsEl = document.getElementById('dbg-cars');
    this.posEl = document.getElementById('dbg-pos');
    this.miniFps = document.getElementById('fps-counter-mini');

    this.setupListeners();
  }

  setupListeners() {
    events.on('DEBUG_TOGGLE', () => this.toggle());

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    // Telemetry updates
    events.on('TELEMETRY_UPDATE', ({ fps, drawCalls }) => {
      if (this.fpsEl) this.fpsEl.textContent = fps;
      if (this.drawCallsEl) this.drawCallsEl.textContent = drawCalls;
      if (this.miniFps) this.miniFps.textContent = `FPS: ${fps} | Calls: ${drawCalls}`;
    });

    // Cheat buttons
    document.getElementById('dbg-btn-god')?.addEventListener('click', () => events.emit('DEBUG_GOD_MODE'));
    document.getElementById('dbg-btn-cash')?.addEventListener('click', () => events.emit('DEBUG_ADD_CASH', 10000));
    document.getElementById('dbg-btn-wanted-clear')?.addEventListener('click', () => events.emit('DEBUG_WANTED_CLEAR'));
    document.getElementById('dbg-btn-wanted-max')?.addEventListener('click', () => events.emit('DEBUG_WANTED_MAX'));

    // Time & Weather
    document.getElementById('dbg-time-day')?.addEventListener('click', () => events.emit('DEBUG_SET_TIME', 12));
    document.getElementById('dbg-time-sunset')?.addEventListener('click', () => events.emit('DEBUG_SET_TIME', 18));
    document.getElementById('dbg-time-night')?.addEventListener('click', () => events.emit('DEBUG_SET_TIME', 0));
    document.getElementById('dbg-weather-rain')?.addEventListener('click', () => events.emit('DEBUG_TOGGLE_RAIN'));

    // Vehicle Spawns
    document.querySelectorAll('[data-spawn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.spawn;
        events.emit('SPAWN_VEHICLE', { type });
      });
    });

    // Teleport Buttons
    document.querySelectorAll('[data-tp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const loc = btn.dataset.tp;
        if (this.landmarks && this.landmarks[loc]) {
          events.emit('TELEPORT_PLAYER', this.landmarks[loc]);
        }
      });
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (this.isOpen || !this.panel) return;
    this.isOpen = true;
    this.panel.style.display = 'block';
  }

  close() {
    if (!this.isOpen || !this.panel) return;
    this.isOpen = false;
    this.panel.style.display = 'none';
  }

  updatePlayerPos(pos, npcsCount = 0, carsCount = 0) {
    if (this.posEl && pos) {
      this.posEl.textContent = `${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`;
    }
    if (this.npcsEl) this.npcsEl.textContent = npcsCount;
    if (this.carsEl) this.carsEl.textContent = carsCount;
  }
}
