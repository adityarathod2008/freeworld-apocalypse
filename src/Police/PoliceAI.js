/**
 * Game FreeWorld - PoliceAI (v5.0 Phase 5)
 * Autonomous police cruiser pursuit AI utilizing VehicleAI pure pursuit,
 * ANPR plate scanning, siren controls, cruiser intercept stopping, and physical officer vehicle exit.
 */
import * as THREE from 'three';
import { VehicleFactory } from '../Vehicles/VehicleTypes.js';
import { VehicleAI } from '../Vehicles/VehicleAI.js';
import { events } from '../Core/EventBus.js';
import { PoliceOfficerAI } from './PoliceOfficerAI.js';
import { PoliceDatabase } from './PoliceDatabase.js';

export class PoliceAI {
  constructor(scene, navGraph, spawnPos) {
    this.scene = scene;
    this.navGraph = navGraph;

    this.cruiser = VehicleFactory.createPoliceCruiser(this.scene);
    this.cruiser.mesh.position.copy(spawnPos);
    if (this.cruiser.policeLights) this.cruiser.policeLights.active = true;

    this.position = this.cruiser.mesh.position;
    this.ai = new VehicleAI(this.cruiser, this.navGraph);
    this.ai.setCruiseMode();

    this.shootTimer = 0;
    this.anprScanTimer = 0;
    this.officerExited = false;
    this.officerInstance = null;
    this.isDestroyed = false;
  }

  update(delta, player, wantedLevel) {
    if (this.isDestroyed || !this.cruiser) return;

    const playerPos = player ? (player.position || player.mesh?.position) : null;
    const playerVehicle = player ? player.currentVehicle : null;

    if (wantedLevel === 0) {
      if (this.cruiser.policeLights) this.cruiser.policeLights.active = false;
      this.cruiser.speed = THREE.MathUtils.lerp(this.cruiser.speed, 0, delta * 3.0);
      if (this.officerInstance) {
        this.officerInstance.destroy();
        this.officerInstance = null;
        this.officerExited = false;
      }
      return;
    }

    if (this.cruiser.policeLights) this.cruiser.policeLights.active = true;

    // ANPR Automatic License Plate Scanner
    if (playerVehicle && playerVehicle.plate) {
      this.anprScanTimer += delta;
      if (this.anprScanTimer >= 1.0) {
        this.anprScanTimer = 0;
        const distToPlayer = this.position.distanceTo(playerPos);
        if (distToPlayer < 40) {
          const scan = PoliceDatabase.get().scanPlateANPR(playerVehicle.plate);
          if (scan.matched) {
            events.emit('ANPR_PLATE_MATCH', {
              plate: playerVehicle.plate,
              cruiserPos: this.position.clone(),
              report: scan.report
            });
            events.emit('WANTED_ESCALATION_REQUIRED', { confidence: 85, pos: playerPos.clone() });
            events.emit('HUD_NOTIFICATION', {
              title: 'ANPR ALERT',
              message: `Police ANPR matched stolen plate: ${playerVehicle.plate}!`
            });
          }
        }
      }
    }

    if (playerPos) {
      const dist = this.position.distanceTo(playerPos);
      const isPlayerStopped = !playerVehicle || Math.abs(playerVehicle.speed) < 2.5;

      // Interception: Stop cruiser and physically exit officer if close to target
      if (dist < 14.0 && isPlayerStopped && !this.officerExited) {
        this.cruiser.speed = THREE.MathUtils.lerp(this.cruiser.speed, 0, delta * 8.0);

        // Spawn 3D Physical Police Officer NPC entity exiting cruiser
        this.officerExited = true;
        this.officerInstance = new PoliceOfficerAI(this.scene, this.position);
        this.officerInstance.exitCruiser(this.position, this.cruiser.mesh.rotation.y);
        events.emit('POLICE_OFFICER_EXITED_VEHICLE', { officer: this.officerInstance, cruiser: this.cruiser });
      } else if (!this.officerExited) {
        this.ai.setPursuitTarget(playerPos);
        this.ai.update(delta, playerPos);
      }

      // Update physical officer AI if exited
      if (this.officerInstance) {
        const isSurrendering = player && player.isSurrendering;
        this.officerInstance.update(delta, playerPos, isPlayerStopped, isSurrendering, wantedLevel);
      }
    }
  }

  destroy() {
    this.isDestroyed = true;
    if (this.officerInstance) {
      this.officerInstance.destroy();
      this.officerInstance = null;
    }
    if (this.cruiser) {
      this.cruiser.destroy();
    }
  }
}
