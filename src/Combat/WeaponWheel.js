/**
 * Game FreeWorld - WeaponWheel
 * Interactive HUD selector for weapons with bullet-time slowdown
 */
import { events } from '../Core/EventBus.js';

export class WeaponWheel {
  constructor(inputManager) {
    this.input = inputManager;
    this.container = document.getElementById('weapon-wheel-container');
    this.isOpen = false;

    this.setupListeners();
  }

  setupListeners() {
    if (!this.container) return;

    const slots = this.container.querySelectorAll('.wheel-slot');
    slots.forEach(slot => {
      slot.addEventListener('click', () => {
        const id = parseInt(slot.dataset.weapon, 10);
        events.emit('SELECT_WEAPON', id);
        this.close();
      });
    });

    events.on('WEAPON_SWITCHED', (weapon) => {
      slots.forEach(slot => {
        const id = parseInt(slot.dataset.weapon, 10);
        if (id === weapon.id) {
          slot.classList.add('active');
        } else {
          slot.classList.remove('active');
        }
      });
    });
  }

  open() {
    if (this.isOpen || !this.container) return;
    this.isOpen = true;
    this.container.style.display = 'flex';
  }

  close() {
    if (!this.isOpen || !this.container) return;
    this.isOpen = false;
    this.container.style.display = 'none';
  }

  update() {
    if (this.input.isKeyDown('Tab')) {
      if (!this.isOpen) this.open();
    } else {
      if (this.isOpen) this.close();
    }
  }
}
