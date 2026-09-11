/**
 * Game FreeWorld - WorldInspector
 * Visual debugging tools: wireframes, collision boxes, waypoint lines, search zones
 */
import * as THREE from 'three';

export class WorldInspector {
  constructor(scene) {
    this.scene = scene;
    this.debugGroup = new THREE.Group();
    this.scene.add(this.debugGroup);
    this.enabled = false;
  }

  toggle() {
    this.enabled = !this.enabled;
    this.debugGroup.visible = this.enabled;
  }
}
