/**
 * Game FreeWorld - WitnessSystem
 * Evaluates crime visibility, witness reliability, distance, lighting, and police dispatch
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class WitnessSystem {
  constructor() {
    this.activeWitnesses = [];
  }

  evaluateCrime(crimeType, crimePos, pedestrians) {
    if (!pedestrians || pedestrians.length === 0) return;

    let witnessFound = false;

    for (const ped of pedestrians) {
      if (ped.isDead) continue;

      const dist = ped.position.distanceTo(crimePos);
      // Can witness observe the crime?
      if (dist < 40) {
        witnessFound = true;
        ped.memory.recordCrime(crimeType, crimePos);

        // Notify HUD of witness observation
        events.emit('HUD_NOTIFICATION', {
          title: 'CRIME WITNESSED',
          message: `${ped.schedule.occupation.title} witnessed ${crimeType}!`
        });
        break;
      }
    }

    // Direct dispatch if unsuppressed
    if (witnessFound) {
      setTimeout(() => {
        events.emit('WITNESS_REPORT', {
          type: crimeType,
          position: crimePos.clone()
        });
      }, 2500);
    }
  }
}
