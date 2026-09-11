/**
 * Game FreeWorld - SideActivities
 * Side Activity 1: Street Outlaw Drag Race
 * Side Activity 2: Underground Courier Delivery
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class StreetRaceActivity {
  constructor(landmarks) {
    this.title = 'STREET OUTLAW DRAG RACE';
    this.checkpoints = [
      new THREE.Vector3(landmarks.plaza.x + 40, 0.5, landmarks.plaza.z),
      new THREE.Vector3(landmarks.bank.x, 0.5, landmarks.bank.z - 30),
      new THREE.Vector3(landmarks.armory.x, 0.5, landmarks.armory.z - 40),
      new THREE.Vector3(landmarks.safehouse.x, 0.5, landmarks.safehouse.z + 10)
    ];
    this.currentIdx = 0;
    this.isCompleted = false;
    this.timer = 55.0; // 55 seconds to complete circuit
  }

  start() {
    this.currentIdx = 0;
    this.isCompleted = false;
    this.timer = 55.0;
    events.emit('SET_OBJECTIVE', {
      type: 'STREET RACE',
      text: `Hit Checkpoint 1/4 (${Math.ceil(this.timer)}s remaining)`
    });
  }

  getCurrentTarget() {
    if (this.isCompleted || this.currentIdx >= this.checkpoints.length) return null;
    return this.checkpoints[this.currentIdx];
  }

  update(delta, playerPos) {
    if (this.isCompleted) return;

    this.timer -= delta;
    if (this.timer <= 0) {
      this.isCompleted = true;
      events.emit('HUD_NOTIFICATION', {
        title: 'RACE FAILED',
        message: 'Time expired!'
      });
      events.emit('SET_OBJECTIVE', { type: 'FREE ROAM', text: 'Explore Bay City' });
      return;
    }

    events.emit('SET_OBJECTIVE', {
      type: 'STREET RACE',
      text: `Hit Checkpoint ${this.currentIdx + 1}/4 (${Math.ceil(this.timer)}s)`
    });

    const target = this.checkpoints[this.currentIdx];
    if (playerPos.distanceTo(target) < 10) {
      this.currentIdx++;
      if (this.currentIdx >= this.checkpoints.length) {
        this.isCompleted = true;
        events.emit('MISSION_COMPLETED', {
          title: 'STREET RACE WON!',
          rewardCash: 6500,
          respect: 40
        });
      }
    }
  }
}

export class CourierBountyActivity {
  constructor(landmarks) {
    this.title = 'COURIER BOUNTY';
    this.destination = new THREE.Vector3(landmarks.harbor.x, 0.5, landmarks.harbor.z + 20);
    this.timer = 45.0;
    this.isCompleted = false;
  }

  start() {
    this.isCompleted = false;
    this.timer = 45.0;
    events.emit('SET_OBJECTIVE', {
      type: 'COURIER DROP',
      text: `Deliver package to Harbor drop-off point (${Math.ceil(this.timer)}s)`
    });
  }

  getCurrentTarget() {
    if (this.isCompleted) return null;
    return this.destination;
  }

  update(delta, playerPos) {
    if (this.isCompleted) return;

    this.timer -= delta;
    if (this.timer <= 0) {
      this.isCompleted = true;
      events.emit('HUD_NOTIFICATION', { title: 'COURIER FAILED', message: 'Package timed out' });
      events.emit('SET_OBJECTIVE', { type: 'FREE ROAM', text: 'Explore Bay City' });
      return;
    }

    events.emit('SET_OBJECTIVE', {
      type: 'COURIER DROP',
      text: `Deliver to Harbor Drop (${Math.ceil(this.timer)}s)`
    });

    if (playerPos.distanceTo(this.destination) < 8) {
      this.isCompleted = true;
      events.emit('MISSION_COMPLETED', {
        title: 'COURIER DELIVERED',
        rewardCash: 8000,
        respect: 50
      });
    }
  }
}
