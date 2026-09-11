/**
 * Game FreeWorld - InteractionSystem (v5.0 Phase 5)
 * Context-sensitive interaction engine supporting vehicle ownership, theft scenarios
 * (unlocked, locked, forced entry, hotwire, alarm, occupied driver ejection), ATMs, Shops, and Contacts.
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';
import { VehicleRegistry } from '../Vehicles/VehicleRegistry.js';

export class InteractionSystem {
  constructor() {
    this.currentPrompt = null;
    this.interactionCooldown = 0;
    this.theftInProgress = null; // { vehicle, type: 'FORCED_ENTRY'|'HOTWIRE', timer, maxTimer }
  }

  update(delta, playerPos, isDriving, vehicles, triggers) {
    if (!playerPos || typeof playerPos.x !== 'number') return;

    if (this.interactionCooldown > 0) {
      this.interactionCooldown -= delta;
    }

    // Process ongoing timed theft action (forced entry / hotwire)
    if (this.theftInProgress) {
      const theft = this.theftInProgress;
      theft.timer -= delta;
      const pct = Math.max(0, Math.ceil((1 - theft.timer / theft.maxTimer) * 100));
      this.setPrompt(`${theft.label} (${pct}%)`, 'HOLD E');

      if (theft.timer <= 0) {
        // Complete theft action
        const veh = theft.vehicle;
        veh.isLocked = false;
        veh.keys = true;
        this.theftInProgress = null;
        this.clearPrompt();
        events.emit('HUD_NOTIFICATION', {
          title: 'THEFT SUCCESS',
          message: `${theft.label} Complete!`
        });
      }
      return;
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
          const isLocked = veh.isLocked && !veh.keys && veh.ownerId !== 'player';
          const needsHotwire = !veh.keys && veh.ownerId !== 'player';

          let text = `Enter ${veh.displayName || 'Vehicle'}`;
          let actionType = 'ENTER';

          if (isCarjack) {
            text = `Carjack ${veh.displayName || 'Vehicle'}`;
            actionType = 'CARJACK';
          } else if (isLocked) {
            text = `Force Entry (${veh.displayName || 'Vehicle'})`;
            actionType = 'FORCE_ENTRY';
          } else if (needsHotwire) {
            text = `Hotwire ${veh.displayName || 'Vehicle'}`;
            actionType = 'HOTWIRE';
          }

          nearestAction = {
            type: 'VEHICLE',
            actionType,
            text,
            key: 'E / F',
            target: veh,
            isCarjack,
            isLocked,
            needsHotwire
          };
        }
      }
    }

    // 2. Check interactive world triggers (ATM, Shop, Contacts, Safehouse, Clue)
    if (Array.isArray(triggers)) {
      for (const trig of triggers) {
        if (!trig || !trig.position || typeof trig.position.x !== 'number') continue;
        const d = playerPos.distanceTo(trig.position);
        if (d <= (trig.radius || 3.0) && d < minDist) {
          minDist = d;
          nearestAction = {
            type: trig.type,
            text: trig.prompt || (trig.type === 'CLUE' ? `Inspect Clue (${trig.title || ''})` : 'Interact'),
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
        const veh = action.target;

        // Occupied Vehicle Driver Ejection & Carjacking
        if (action.isCarjack) {
          this.executeCarjack(player, veh);
          return true;
        }

        // Locked vehicle forced entry
        if (action.isLocked) {
          this.startTimedTheft(veh, 'FORCE_ENTRY', 'Forcing Lock', 2.0);
          return true;
        }

        // Unlocked but needs hotwire
        if (action.needsHotwire && !veh.driver) {
          this.startTimedTheft(veh, 'HOTWIRE', 'Hotwiring Ignition', 1.8);
          return true;
        }

        // Unlocked vehicle direct entry
        player.enterVehicle(veh);
        return true;
      } else if (action.type === 'CLUE') {
        if (typeof action.target.onInspect === 'function') {
          action.target.onInspect();
        }
        events.emit('CLUE_INSPECTED', action.target);
        return true;
      } else {
        events.emit('TRIGGER_ACTIVATED', action.target);
        return true;
      }
    }
    return false;
  }

  startTimedTheft(vehicle, type, label, duration) {
    this.theftInProgress = {
      vehicle,
      type,
      label,
      timer: duration,
      maxTimer: duration
    };

    // Trigger car alarm if vehicle has active alarm
    if (vehicle.alarm && !vehicle.alarmActive) {
      vehicle.triggerAlarm(15.0);
    }

    events.emit('CRIME_COMMITTED', {
      type: 'VEHICLE_THEFT',
      severity: 1,
      position: vehicle.position ? vehicle.position.clone() : new THREE.Vector3()
    });
  }

  executeCarjack(player, vehicle) {
    const driver = vehicle.driver;

    // Trigger alarm if equipped
    if (vehicle.alarm && !vehicle.alarmActive) {
      vehicle.triggerAlarm(15.0);
    }

    // Physical Driver Ejection onto ground
    if (driver) {
      driver.currentVehicle = null;
      vehicle.driver = null;

      // Eject driver 1.5m to left of vehicle
      const leftVector = new THREE.Vector3(-1.8, 0, 0).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        vehicle.mesh.rotation.y
      );
      const ejectPos = vehicle.position.clone().add(leftVector);
      ejectPos.y = 0.2;

      if (driver.position) driver.position.copy(ejectPos);
      if (driver.model && driver.model.root) driver.model.root.position.copy(ejectPos);

      // Notify owner AI of carjacking ejection
      events.emit('NPC_EJECTED_FROM_VEHICLE', {
        npc: driver,
        vehicle,
        ejector: player,
        position: ejectPos
      });
    }

    // Mark stolen in VehicleRegistry
    VehicleRegistry.get().reportStolen(vehicle.vehicleId, driver ? driver.id : 'civilian');

    events.emit('CRIME_COMMITTED', {
      type: 'CARJACKING',
      severity: 2,
      position: vehicle.position ? vehicle.position.clone() : new THREE.Vector3()
    });

    events.emit('HUD_NOTIFICATION', {
      title: 'CARJACKING',
      message: `Carjacked ${vehicle.displayName || 'Vehicle'}!`
    });

    player.enterVehicle(vehicle);
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
