/**
 * Game FreeWorld - InteractionSystem
 * Detects context-sensitive interactions: Enter Vehicle, Use ATM, Access Armory, Talk to Marco
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class InteractionSystem {
  constructor() {
    this.currentPrompt = null;
    this.interactionCooldown = 0;
  }

  update(delta, playerPos, isDriving, vehicles, triggers) {
    if (!playerPos || typeof playerPos.x !== 'number') return;

    if (this.interactionCooldown > 0) {
      this.interactionCooldown -= delta;
    }

    if (isDriving) {
      this.setPrompt('Exit Vehicle', 'E / F');
      return;
    }

    let nearestAction = null;
    let minDist = 4.5;

    // 1. Check nearby vehicle entry
    if (Array.isArray(vehicles)) {
      for (const veh of vehicles) {
        if (!veh) continue;
        const vehPos = veh.position || veh.mesh?.position;
        if (!vehPos || typeof vehPos.x !== 'number') continue;
        const d = playerPos.distanceTo(vehPos);
        if (d < 4.0 && d < minDist) {
          minDist = d;
          const isCarjack = veh.driver && !veh.driver.isPlayer;
          nearestAction = {
            type: 'VEHICLE',
            text: isCarjack ? `Carjack ${veh.displayName || 'Vehicle'}` : `Enter ${veh.displayName || 'Vehicle'}`,
            key: 'E / F',
            target: veh,
            isCarjack
          };
        }
      }
    }

    // 2. Check interactive world triggers (ATM, Shop, Contacts, Safehouse)
    if (Array.isArray(triggers)) {
      for (const trig of triggers) {
        if (!trig || !trig.position || typeof trig.position.x !== 'number') continue;
        const d = playerPos.distanceTo(trig.position);
        if (d <= (trig.radius || 3.0) && d < minDist) {
          minDist = d;
          nearestAction = {
            type: trig.type,
            text: trig.prompt || 'Interact',
            key: 'E',
            target: trig
          };
        }
      }
    }

    if (nearestAction) {
      this.setPrompt(nearestAction.text, nearestAction.key);
      this.currentAction = nearestAction;
    } else {
      this.clearPrompt();
      this.currentAction = null;
    }
  }

  handleInteract(input, player) {
    if (this.interactionCooldown > 0 || !this.currentAction) return false;

    if (input.isKeyPressed('KeyE') || input.isKeyPressed('KeyF')) {
      this.interactionCooldown = 0.4;
      const action = this.currentAction;

      if (action.type === 'VEHICLE') {
        player.enterVehicle(action.target);
        return true;
      } else {
        events.emit('TRIGGER_ACTIVATED', action.target);
        return true;
      }
    }
    return false;
  }

  setPrompt(text, key = 'E') {
    if (this.currentPrompt !== text) {
      this.currentPrompt = text;
      events.emit('UPDATE_INTERACTION_PROMPT', { visible: true, text, key });
    }
  }

  clearPrompt() {
    if (this.currentPrompt !== null) {
      this.currentPrompt = null;
      events.emit('UPDATE_INTERACTION_PROMPT', { visible: false, text: '', key: '' });
    }
  }
}
