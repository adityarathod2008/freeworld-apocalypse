/**
 * Game FreeWorld - SearchSystem
 * Dynamic search radius at last known position, radar sweep, and evasion timer
 */
import * as THREE from 'three';

export class SearchSystem {
  constructor() {
    this.searchCenter = new THREE.Vector3();
    this.searchRadius = 60.0;
    this.isSearching = false;
  }

  startSearch(lastKnownPos, wantedLevel) {
    this.searchCenter.copy(lastKnownPos);
    this.searchRadius = 40.0 + wantedLevel * 15.0;
    this.isSearching = true;
  }

  isInsideSearchZone(playerPos) {
    if (!this.isSearching) return false;
    return this.searchCenter.distanceTo(playerPos) <= this.searchRadius;
  }

  clearSearch() {
    this.isSearching = false;
  }
}
