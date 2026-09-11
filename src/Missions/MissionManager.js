/**
 * Game FreeWorld - MissionManager
 * Core mission state machine with checkpoints, GPS waypoints, dialogue subtitles, and rewards
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class MissionManager {
  constructor(scene) {
    this.scene = scene;
    this.activeMission = null;
    this.currentWaypoint = null;

    // Visual glowing 3D waypoint beacon ring in the world
    const beaconGeo = new THREE.CylinderGeometry(2.5, 2.5, 8, 32, 1, true);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xffb700,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    this.beaconMesh.visible = false;
    this.scene.add(this.beaconMesh);

    this.beaconFloorRing = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 2.8, 32),
      new THREE.MeshBasicMaterial({ color: 0xffb700, side: THREE.DoubleSide })
    );
    this.beaconFloorRing.rotation.x = -Math.PI / 2;
    this.beaconFloorRing.position.y = 0.1;
    this.beaconMesh.add(this.beaconFloorRing);

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('START_MISSION', (missionInstance) => {
      this.startMission(missionInstance);
    });
  }

  startMission(mission) {
    this.activeMission = mission;
    this.activeMission.start();
    this.updateWaypointDisplay();
  }

  setWaypoint(position) {
    if (position) {
      this.currentWaypoint = position.clone();
      this.beaconMesh.position.set(position.x, 4.0, position.z);
      this.beaconMesh.visible = true;
      events.emit('GPS_WAYPOINT_CHANGED', this.currentWaypoint);
    } else {
      this.currentWaypoint = null;
      this.beaconMesh.visible = false;
      events.emit('GPS_WAYPOINT_CHANGED', null);
    }
  }

  updateWaypointDisplay() {
    if (this.activeMission && this.activeMission.getCurrentTarget()) {
      this.setWaypoint(this.activeMission.getCurrentTarget());
    } else {
      this.setWaypoint(null);
    }
  }

  update(delta, playerPos) {
    if (this.beaconMesh.visible) {
      this.beaconMesh.rotation.y += delta * 1.5;
    }

    if (this.activeMission && !this.activeMission.isCompleted) {
      this.activeMission.update(delta, playerPos);
      this.updateWaypointDisplay();
    }
  }

  getCurrentWaypoint() {
    return this.currentWaypoint;
  }
}
