/**
 * Game FreeWorld - Engine
 * Main rendering loop, scene graph, Three.js renderer configuration, and tick dispatch
 */
import * as THREE from 'three';
import { events } from './EventBus.js';

export class Engine {
  constructor(containerId = 'canvas-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container #${containerId} not found`);
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1424);
    this.scene.fog = new THREE.FogExp2(0x0c1424, 0.0035);

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1200
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.updatables = [];
    this.isRunning = false;

    // Performance tracking
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.fps = 60;
    this.drawCalls = 0;

    this.setupResizeHandler();
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      events.emit('VIEWPORT_RESIZE', {
        width: window.innerWidth,
        height: window.innerHeight
      });
    });
  }

  registerUpdatable(system) {
    if (system && typeof system.update === 'function') {
      this.updatables.push(system);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  stop() {
    this.isRunning = false;
  }

  animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(() => this.animate());

    let delta = this.clock.getDelta();
    // Cap delta time to prevent physics explosions on background tab
    if (delta > 0.1) delta = 0.1;

    // Tick all registered updatable systems
    for (let i = 0; i < this.updatables.length; i++) {
      try {
        this.updatables[i].update(delta);
      } catch (err) {
        console.error(`[Engine] Error updating system #${i}:`, err);
      }
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);

    // Track FPS & telemetry
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      this.drawCalls = this.renderer.info.render.calls;

      events.emit('TELEMETRY_UPDATE', {
        fps: this.fps,
        drawCalls: this.drawCalls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures
      });
    }
  }
}
