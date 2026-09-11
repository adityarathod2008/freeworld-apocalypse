/**
 * Game FreeWorld - ArrestSystem (v3.0)
 * Complete law enforcement arrest state machine & BUSTED sequence:
 * Detect -> Pursue -> Intercept -> Block -> Surround -> Order Stop -> Surrender Window -> Handcuff -> BUSTED Transition -> Reset
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class ArrestSystem {
  constructor() {
    this.state = 'NONE'; // 'NONE' | 'SURRENDER_WINDOW' | 'HANDCUFFING' | 'BUSTED_SCREEN'
    this.surrenderTimer = 0;
    this.surrenderWindowDuration = 3.5; // 3.5 seconds to surrender
    this.bustedOverlay = null;

    this.createBustedUI();
    this.setupEventListeners();
  }

  createBustedUI() {
    if (typeof document === 'undefined') return;
    let overlay = document.getElementById('busted-screen-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'busted-screen-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: radial-gradient(circle, rgba(140, 0, 0, 0.85) 0%, rgba(10, 0, 0, 0.95) 100%);
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        font-family: 'Outfit', sans-serif;
        color: #ffffff;
        pointer-events: none;
        transition: opacity 0.5s ease;
      `;
      overlay.innerHTML = `
        <h1 style="font-size: 84px; font-weight: 900; letter-spacing: 12px; color: #ff2233; text-shadow: 0 0 30px #ff0000; margin: 0;">BUSTED</h1>
        <p style="font-size: 22px; font-weight: 600; letter-spacing: 4px; color: #dddddd; margin-top: 12px;">IN POLICE CUSTODY — ALL WEAPONS CONFISCATED</p>
        <div id="busted-fine-text" style="font-size: 18px; color: #ffaa00; margin-top: 8px;">FINE DEDUCTED: $1,500</div>
      `;
      document.body.appendChild(overlay);
    }
    this.bustedOverlay = overlay;
  }

  setupEventListeners() {
    events.on('PLAYER_ATTACKED_POLICE', () => {
      if (this.state === 'SURRENDER_WINDOW') {
        this.cancelSurrender();
      }
    });

    events.on('POLICE_PHYSICAL_ARREST_INITIATED', ({ officer, dist }) => {
      if (this.state === 'NONE' || this.state === 'SURRENDER_WINDOW') {
        events.emit('SHOW_SUBTITLE', {
          speaker: 'POLICE OFFICER',
          text: '"You are under arrest! Put your hands behind your back!"'
        });
      }
    });
  }

  update(delta, player, activePolice, wantedLevel) {
    if (wantedLevel === 0 || !player || !activePolice || activePolice.length === 0) {
      if (this.state === 'SURRENDER_WINDOW') this.cancelSurrender();
      return;
    }

    const playerPos = player.position;
    if (!playerPos) return;

    // Count police units surrounding player within 7 meters
    let closePoliceCount = 0;
    for (const cop of activePolice) {
      if (cop && cop.position && cop.position.distanceTo(playerPos) < 7.5) {
        closePoliceCount++;
      }
    }

    const playerStopped = !player.currentVehicle || Math.abs(player.currentVehicle.speed) < 2.0;

    if (this.state === 'NONE') {
      // Trigger surrender window if player is surrounded and stopped
      if (closePoliceCount >= 1 && playerStopped && !player.input?.isMouseDown(0)) {
        this.startSurrenderWindow(player, wantedLevel);
      }
    } else if (this.state === 'SURRENDER_WINDOW') {
      this.surrenderTimer -= delta;

      // Check if player presses 'F' to surrender
      if (player.input && (player.input.isKeyPressed('KeyF') || player.input.isKeyPressed('KeyE'))) {
        this.executeArrest(player, wantedLevel);
        return;
      }

      // Check if player fled or moved out of range
      if (closePoliceCount === 0 || !playerStopped) {
        this.cancelSurrender();
        return;
      }

      if (this.surrenderTimer <= 0) {
        // Window expired -> execute arrest directly if still surrounded
        this.executeArrest(player, wantedLevel);
      } else {
        events.emit('UPDATE_INTERACTION_PROMPT', {
          visible: true,
          text: `Surrender to Police (${Math.ceil(this.surrenderTimer)}s)`,
          key: 'F'
        });
      }
    }
  }

  startSurrenderWindow(player, wantedLevel) {
    this.state = 'SURRENDER_WINDOW';
    this.surrenderTimer = this.surrenderWindowDuration;

    events.emit('SHOW_SUBTITLE', {
      speaker: 'POLICE OFFICER',
      text: 'Freeze! Hands where I can see them! Press F to Surrender!'
    });
  }

  cancelSurrender() {
    this.state = 'NONE';
    events.emit('UPDATE_INTERACTION_PROMPT', { visible: false, text: '', key: '' });
  }

  executeArrest(player, wantedLevel) {
    this.state = 'BUSTED_SCREEN';
    this.cancelSurrender();

    const fine = Math.min(3000, 500 * wantedLevel);
    const fineText = document.getElementById('busted-fine-text');
    if (fineText) fineText.innerText = `FINE DEDUCTED: $${fine}`;

    if (this.bustedOverlay) {
      this.bustedOverlay.style.display = 'flex';
      this.bustedOverlay.style.opacity = '1';
    }

    events.emit('HUD_NOTIFICATION', {
      title: 'ARRESTED',
      message: `Busted by Police. Fine: $${fine}`
    });

    events.emit('PLAYER_ARRESTED', { fineAmount: fine });

    // After 3.5 seconds, fade out BUSTED screen, reset wanted, and respawn at Police Station
    setTimeout(() => {
      if (this.bustedOverlay) {
        this.bustedOverlay.style.display = 'none';
      }

      // Teleport player to Downtown Police Station entrance
      if (player.teleport) {
        player.teleport(new THREE.Vector3(10, 0.5, 45));
      }

      // Clear wanted level & evidence
      events.emit('DEBUG_WANTED_CLEAR');
      this.state = 'NONE';
    }, 3500);
  }
}
