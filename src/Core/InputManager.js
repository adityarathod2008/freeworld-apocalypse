/**
 * Game FreeWorld - InputManager
 * Unified input abstraction with keyboard, mouse, pointer lock, and gamepad hooks
 */
import { events } from './EventBus.js';

export class InputManager {
  constructor(domElement) {
    this.domElement = domElement || document.body;
    this.keysDown = new Set();
    this.keysPressed = new Set();
    this.mouseButtonsDown = new Set();
    this.mouseButtonsPressed = new Set();
    
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseSensitivity = 0.0022;
    this.isPointerLocked = false;
    this.isInputBlocked = false;

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      // Dev console toggle with ~ (Backquote)
      if (e.code === 'Backquote' || e.key === '`') {
        e.preventDefault();
        events.emit('DEBUG_TOGGLE');
        return;
      }

      // F1 - F9 Diagnostic Overlays
      const fKeyMap = {
        'F1': 'F1_GAME_STATE',
        'F2': 'F2_EVENT_BUS',
        'F3': 'F3_NPC',
        'F4': 'F4_ZOMBIES',
        'F5': 'F5_VEHICLES',
        'F6': 'F6_POLICE',
        'F7': 'F7_STORY',
        'F8': 'F8_BUILDINGS',
        'F9': 'F9_PERFORMANCE'
      };

      if (fKeyMap[e.code]) {
        e.preventDefault();
        events.emit('DEBUG_TOGGLE_OVERLAY', fKeyMap[e.code]);
        return;
      }

      // Allow Map toggle with M
      if (e.code === 'KeyM') {
        events.emit('MAP_TOGGLE');
        return;
      }

      // Allow Phone toggle with P or ArrowUp
      if (e.code === 'KeyP' || e.code === 'ArrowUp') {
        events.emit('PHONE_TOGGLE');
        return;
      }

      if (!this.keysDown.has(e.code)) {
        this.keysPressed.add(e.code);
      }
      this.keysDown.add(e.code);

      // Prevent scrolling on Space / Arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });

    window.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('#debug-panel') || e.target.closest('#smartphone-container') || e.target.closest('#shop-modal') || e.target.closest('#map-modal')) {
        return;
      }

      if (!this.isPointerLocked && !this.isInputBlocked) {
        this.requestPointerLock();
      }

      if (!this.mouseButtonsDown.has(e.button)) {
        this.mouseButtonsPressed.add(e.button);
      }
      this.mouseButtonsDown.add(e.button);
    });

    window.addEventListener('mouseup', (e) => {
      this.mouseButtonsDown.delete(e.button);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked && !this.isInputBlocked) {
        this.mouseDelta.x += e.movementX || 0;
        this.mouseDelta.y += e.movementY || 0;
      }
    });

    window.addEventListener('contextmenu', (e) => {
      // Prevent context menu on right click in canvas
      if (e.target === this.domElement || e.target.closest('#canvas-container')) {
        e.preventDefault();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement || document.pointerLockElement === document.body;
      events.emit('POINTER_LOCK_CHANGED', this.isPointerLocked);
    });
  }

  requestPointerLock() {
    try {
      this.domElement.requestPointerLock();
    } catch (e) {
      console.warn('[InputManager] Pointer lock request failed:', e);
    }
  }

  exitPointerLock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  isKeyDown(code) {
    return this.keysDown.has(code);
  }

  isKeyPressed(code) {
    return this.keysPressed.has(code);
  }

  isMouseDown(button = 0) {
    return this.mouseButtonsDown.has(button);
  }

  isMousePressed(button = 0) {
    return this.mouseButtonsPressed.has(button);
  }

  isAiming() {
    return this.mouseButtonsDown.has(2); // Right click
  }

  isShooting() {
    return this.mouseButtonsDown.has(0); // Left click
  }

  getAndResetMouseDelta() {
    const delta = {
      x: this.mouseDelta.x * this.mouseSensitivity,
      y: this.mouseDelta.y * this.mouseSensitivity
    };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return delta;
  }

  endFrame() {
    this.keysPressed.clear();
    this.mouseButtonsPressed.clear();
  }
}
