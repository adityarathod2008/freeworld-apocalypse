/**
 * Game FreeWorld - UIManager
 * Coordinates on-screen HUD, status meters, weapon status, speedometer, and notifications
 */
import { events } from '../Core/EventBus.js';

export class UIManager {
  constructor() {
    this.crosshair = document.getElementById('crosshair');
    this.wantedStars = [
      document.getElementById('star-1'),
      document.getElementById('star-2'),
      document.getElementById('star-3'),
      document.getElementById('star-4'),
      document.getElementById('star-5')
    ];
    this.cashDisplay = document.getElementById('cash-display');
    this.weaponIcon = document.getElementById('weapon-icon');
    this.ammoClip = document.getElementById('ammo-clip');
    this.ammoReserve = document.getElementById('ammo-reserve');

    this.objBanner = document.getElementById('objective-banner');
    this.objType = document.getElementById('objective-type');
    this.objText = document.getElementById('objective-text');

    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.promptActionText = document.getElementById('prompt-action-text');

    this.dialogueBox = document.getElementById('dialogue-container');
    this.dialogueSpeaker = document.getElementById('dialogue-speaker');
    this.dialogueText = document.getElementById('dialogue-text');
    this.dialogueTimer = null;

    this.barHealth = document.getElementById('bar-health');
    this.barArmor = document.getElementById('bar-armor');
    this.barStamina = document.getElementById('bar-stamina');

    this.speedoContainer = document.getElementById('speedometer-container');
    this.speedDigits = document.getElementById('speed-digits');
    this.rpmBar = document.getElementById('rpm-bar');
    this.gearIndicator = document.getElementById('gear-indicator');
    this.vehicleName = document.getElementById('vehicle-name');

    this.missionNotif = document.getElementById('mission-notification');
    this.notifTitle = document.getElementById('mission-notif-title');
    this.notifSub = document.getElementById('mission-notif-sub');

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Player Stats
    events.on('PLAYER_STATS_CHANGED', ({ health, maxHealth, armor, maxArmor, stamina, maxStamina }) => {
      if (this.barHealth) this.barHealth.style.width = `${Math.max(0, (health / maxHealth) * 100)}%`;
      if (this.barArmor) this.barArmor.style.width = `${Math.max(0, (armor / maxArmor) * 100)}%`;
      if (this.barStamina) this.barStamina.style.width = `${Math.max(0, (stamina / maxStamina) * 100)}%`;
    });

    // Economy
    events.on('ECONOMY_CHANGED', ({ cash }) => {
      if (this.cashDisplay) this.cashDisplay.textContent = `$${cash.toLocaleString()}`;
    });

    // Wanted Stars
    events.on('WANTED_LEVEL_CHANGED', ({ level }) => {
      this.wantedStars.forEach((star, idx) => {
        if (star) {
          if (idx < level) star.classList.add('active');
          else star.classList.remove('active');
        }
      });
    });

    // Weapon HUD
    events.on('WEAPON_STATS_CHANGED', ({ name, currentClip, reserve, type }) => {
      if (this.weaponIcon) this.weaponIcon.textContent = name;
      if (this.ammoClip) this.ammoClip.textContent = type === 'melee' ? '∞' : currentClip;
      if (this.ammoReserve) this.ammoReserve.textContent = type === 'melee' ? '∞' : reserve;
    });

    // Objectives
    events.on('SET_OBJECTIVE', ({ type, text }) => {
      if (this.objType) this.objType.textContent = type;
      if (this.objText) this.objText.textContent = text;
    });

    // Contextual Prompt
    events.on('INTERACTION_PROMPT', (interactable) => {
      if (!this.interactionPrompt) return;
      if (interactable) {
        this.promptActionText.textContent = interactable.actionText;
        this.interactionPrompt.style.display = 'flex';
      } else {
        this.interactionPrompt.style.display = 'none';
      }
    });

    // Vehicle Speedometer HUD
    events.on('PLAYER_ENTERED_VEHICLE', () => {
      if (this.speedoContainer) this.speedoContainer.style.display = 'flex';
    });
    events.on('PLAYER_EXITED_VEHICLE', () => {
      if (this.speedoContainer) this.speedoContainer.style.display = 'none';
    });
    events.on('VEHICLE_TELEMETRY', ({ speedKmh, rpm, gear, name }) => {
      if (this.speedDigits) this.speedDigits.textContent = speedKmh;
      if (this.rpmBar) this.rpmBar.style.width = `${rpm * 100}%`;
      if (this.gearIndicator) this.gearIndicator.textContent = gear;
      if (this.vehicleName) this.vehicleName.textContent = name;
    });

    // Subtitles
    events.on('SHOW_SUBTITLE', ({ speaker, text }) => {
      this.showSubtitle(speaker, text);
    });

    // Mission Notification
    events.on('MISSION_COMPLETED', ({ title, rewardCash }) => {
      this.showMissionCompleted(title, rewardCash);
    });

    events.on('HUD_NOTIFICATION', ({ title, message }) => {
      this.showSubtitle(title, message, 3000);
    });
  }

  showSubtitle(speaker, text, duration = 4500) {
    if (!this.dialogueBox) return;
    this.dialogueSpeaker.textContent = speaker ? `${speaker}:` : '';
    this.dialogueText.textContent = `"${text}"`;
    this.dialogueBox.style.display = 'block';

    if (this.dialogueTimer) clearTimeout(this.dialogueTimer);
    this.dialogueTimer = setTimeout(() => {
      this.dialogueBox.style.display = 'none';
    }, duration);
  }

  showMissionCompleted(title, rewardCash) {
    if (!this.missionNotif) return;
    this.notifTitle.textContent = title;
    this.notifSub.textContent = `+$${rewardCash.toLocaleString()} CASH | REPUTATION INCREASED`;
    this.missionNotif.style.display = 'block';
    setTimeout(() => this.missionNotif.classList.add('show'), 50);

    setTimeout(() => {
      this.missionNotif.classList.remove('show');
      setTimeout(() => this.missionNotif.style.display = 'none', 500);
    }, 4500);
  }

  setAiming(isAiming) {
    if (this.crosshair) {
      if (isAiming) this.crosshair.classList.add('aiming');
      else this.crosshair.classList.remove('aiming');
    }
  }
}
