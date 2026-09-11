/**
 * Game FreeWorld - MainMission1
 * 'The Syndicate Contract: High Stakes Vault'
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class MainMission1 {
  constructor(landmarks) {
    this.landmarks = landmarks;
    this.title = 'THE SYNDICATE CONTRACT';
    this.stage = 0;
    this.isCompleted = false;

    this.stages = [
      {
        text: 'Meet contact Marco at Downtown Harbor Docks',
        target: landmarks.harbor,
        radius: 8
      },
      {
        text: 'Acquire a fast getaway vehicle',
        target: null, // Any car
        check: (player) => !!player.currentVehicle
      },
      {
        text: 'Drive to District Central Bank rear vault alley',
        target: landmarks.bank_vault_alley,
        radius: 8
      },
      {
        text: 'Breach the security vault terminal [E]',
        target: landmarks.bank_vault_alley,
        radius: 5
      },
      {
        text: 'Lose the 3-Star police pursuit!',
        target: null,
        check: (player, wantedLevel) => wantedLevel === 0
      },
      {
        text: 'Deliver the heist payload to Safehouse Garage',
        target: landmarks.safehouse,
        radius: 8
      }
    ];
  }

  start() {
    this.stage = 0;
    this.isCompleted = false;
    this.emitCurrentObjective();
    events.emit('SHOW_SUBTITLE', {
      speaker: 'MARCO',
      text: 'Glad you made it. Meet me down at the docks, kid. I have high-stakes business for you.'
    });
  }

  getCurrentTarget() {
    if (this.isCompleted || this.stage >= this.stages.length) return null;
    return this.stages[this.stage].target;
  }

  emitCurrentObjective() {
    if (this.stage < this.stages.length) {
      events.emit('SET_OBJECTIVE', {
        type: 'MAIN MISSION',
        text: this.stages[this.stage].text
      });
    }
  }

  update(delta, playerPos) {
    if (this.isCompleted) return;

    const curr = this.stages[this.stage];

    // Stage 0: Meet Marco at Harbor
    if (this.stage === 0) {
      if (playerPos.distanceTo(curr.target) < curr.radius) {
        this.stage++;
        this.emitCurrentObjective();
        events.emit('SHOW_SUBTITLE', {
          speaker: 'MARCO',
          text: 'The Central Bank vault server holds bearer bonds. Grab a fast ride and get over there.'
        });
      }
    }
    // Stage 1: Get into vehicle
    else if (this.stage === 1) {
      // Checked externally via player.currentVehicle
    }
    // Stage 2: Drive to Bank Vault Alley
    else if (this.stage === 2) {
      if (playerPos.distanceTo(curr.target) < curr.radius) {
        this.stage++;
        this.emitCurrentObjective();
        events.emit('SHOW_SUBTITLE', {
          speaker: 'MARCO',
          text: 'The terminal is right there. Hack into it now!'
        });
      }
    }
    // Stage 3: Breach Terminal (triggered when interacting)
    // Stage 4: Evade police (waiting for wanted level to reach 0)
    // Stage 5: Deliver to Safehouse
    else if (this.stage === 5) {
      if (playerPos.distanceTo(curr.target) < curr.radius) {
        this.completeMission();
      }
    }
  }

  onPlayerEnterCar() {
    if (this.stage === 1) {
      this.stage = 2;
      this.emitCurrentObjective();
      events.emit('SHOW_SUBTITLE', {
        speaker: 'MARCO',
        text: 'Good choice. Now head straight to the Central Bank rear alley before security sweeps.'
      });
    }
  }

  onBreachTerminal() {
    if (this.stage === 3) {
      this.stage = 4;
      this.emitCurrentObjective();
      // Sound alarm and trigger 3 stars!
      events.emit('CRIME_COMMITTED', {
        type: 'BANK_HEIST',
        severity: 3,
        position: this.landmarks.bank_vault_alley
      });
      events.emit('SHOW_SUBTITLE', {
        speaker: 'POLICE DISPATCH',
        text: '10-99 in progress! Bank vault alarm triggered! All units converge!'
      });
    }
  }

  onWantedCleared() {
    if (this.stage === 4) {
      this.stage = 5;
      this.emitCurrentObjective();
      events.emit('SHOW_SUBTITLE', {
        speaker: 'MARCO',
        text: 'You shook the heat! Get to the Safehouse garage and stash the loot!'
      });
    }
  }

  completeMission() {
    this.isCompleted = true;
    events.emit('MISSION_COMPLETED', {
      title: 'HEIST CONTRACT COMPLETED',
      rewardCash: 25000,
      respect: 100
    });
    events.emit('SET_OBJECTIVE', {
      type: 'FREE ROAM',
      text: 'Explore Bay City, take side activities, or buy gear'
    });
  }
}
