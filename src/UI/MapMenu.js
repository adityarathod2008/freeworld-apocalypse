/**
 * Game FreeWorld - MapMenu
 * Fullscreen interactive district map with pan, zoom, and custom GPS waypoint placement
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class MapMenu {
  constructor(navGraph, landmarks) {
    this.navGraph = navGraph;
    this.landmarks = landmarks;
    this.modal = document.getElementById('map-modal');
    this.canvas = document.getElementById('big-map-canvas');
    this.closeBtn = document.getElementById('map-close-btn');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.isOpen = false;
    this.cameraOffset = { x: 0, y: 0 };
    this.zoom = 1.6;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    this.playerPos = new THREE.Vector3();
    this.customWaypoint = null;

    this.setupListeners();
  }

  setupListeners() {
    events.on('MAP_TOGGLE', () => {
      this.toggle();
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click: pan
        this.isDragging = true;
        this.dragStart.x = e.clientX - this.cameraOffset.x;
        this.dragStart.y = e.clientY - this.cameraOffset.y;
      } else if (e.button === 2) { // Right click: set waypoint
        this.setWaypointFromScreen(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging && this.isOpen) {
        this.cameraOffset.x = e.clientX - this.dragStart.x;
        this.cameraOffset.y = e.clientY - this.dragStart.y;
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      this.zoom = Math.max(0.6, Math.min(4.0, this.zoom * zoomFactor));
      this.render();
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    if (this.isOpen || !this.modal) return;
    this.isOpen = true;
    this.modal.style.display = 'flex';
    this.resizeCanvas();
    this.render();
  }

  close() {
    if (!this.isOpen || !this.modal) return;
    this.isOpen = false;
    this.modal.style.display = 'none';
  }

  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
    }
  }

  setWaypointFromScreen(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = this.canvas.width / 2 + this.cameraOffset.x;
    const cy = this.canvas.height / 2 + this.cameraOffset.y;

    const mx = (screenX - rect.left - cx) / this.zoom;
    const mz = (screenY - rect.top - cy) / this.zoom;

    this.customWaypoint = new THREE.Vector3(mx, 0.5, mz);
    events.emit('GPS_WAYPOINT_CHANGED', this.customWaypoint);
    events.emit('HUD_NOTIFICATION', {
      title: 'GPS WAYPOINT SET',
      message: 'Custom destination marked on radar'
    });
    this.render();
  }

  updatePlayerPos(pos) {
    this.playerPos.copy(pos);
    if (this.isOpen) this.render();
  }

  render() {
    if (!this.ctx || !this.isOpen) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2 + this.cameraOffset.x;
    const cy = h / 2 + this.cameraOffset.y;

    ctx.clearRect(0, 0, w, h);

    // Background Grid
    ctx.fillStyle = '#06090e';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Draw Roads
    if (this.navGraph && this.navGraph.roadNodes) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 14 * this.zoom;
      ctx.lineCap = 'round';

      for (const node of this.navGraph.roadNodes) {
        for (const conn of node.connections) {
          ctx.beginPath();
          ctx.moveTo(node.position.x * this.zoom, node.position.z * this.zoom);
          ctx.lineTo(conn.position.x * this.zoom, conn.position.z * this.zoom);
          ctx.stroke();
        }
      }
    }

    // 2. Landmarks
    const drawIcon = (pos, color, label) => {
      if (!pos) return;
      const ix = pos.x * this.zoom;
      const iy = pos.z * this.zoom;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ix, iy, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Segoe UI, sans-serif';
      ctx.fillText(label, ix + 10, iy + 3);
    };

    drawIcon(this.landmarks.bank, '#ffb700', 'Central Bank');
    drawIcon(this.landmarks.armory, '#00f0ff', 'Apex Armory');
    drawIcon(this.landmarks.safehouse, '#55ff77', 'Safehouse');
    drawIcon(this.landmarks.plaza, '#a855f7', 'City Plaza');
    drawIcon(this.landmarks.harbor, '#f97316', 'Harbor Docks');

    // 3. Custom Waypoint
    if (this.customWaypoint) {
      const wx = this.customWaypoint.x * this.zoom;
      const wy = this.customWaypoint.z * this.zoom;
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(wx, wy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText('TARGET GPS', wx + 10, wy + 4);
    }

    // 4. Player Marker
    const px = this.playerPos.x * this.zoom;
    const py = this.playerPos.z * this.zoom;
    ctx.fillStyle = '#00f0ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
