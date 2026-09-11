/**
 * Game FreeWorld - TimeManager (v3.0)
 * Layered urban lighting system:
 * Sunset (Golden Hour) -> Blue Hour (Twilight) -> Night (Cinematic, atmospheric readability with Moonlight, City Glow, Street Lamps, Emissive Windows) -> Dawn.
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class TimeManager {
  constructor(scene) {
    this.scene = scene;

    // Time representation (0 to 24 hours)
    this.timeOfDay = 12.0; // Starts at 12:00 PM noon
    this.timeScale = 0.05; // ~20 seconds per game hour

    // Sun / Moon Directional Light
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 400;
    this.sunLight.shadow.camera.left = -150;
    this.sunLight.shadow.camera.right = 150;
    this.sunLight.shadow.camera.top = 150;
    this.sunLight.shadow.camera.bottom = -150;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // Celestial Hemisphere Light (Sky Zenith vs Urban Ground Bounce)
    this.hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x1c2430, 0.7);
    this.scene.add(this.hemiLight);

    // City Glow Ambient Fill Light for Night Readability
    this.cityGlowLight = new THREE.AmbientLight(0x283850, 0.45);
    this.scene.add(this.cityGlowLight);

    this.isNight = false;

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('DEBUG_SET_TIME', (hour) => {
      this.timeOfDay = hour;
    });
  }

  update(delta, playerPos, propPlacer) {
    this.timeOfDay = (this.timeOfDay + delta * this.timeScale) % 24;

    const hours = Math.floor(this.timeOfDay);
    const minutes = Math.floor((this.timeOfDay % 1) * 60);
    const night = this.timeOfDay < 5.8 || this.timeOfDay > 18.8;

    if (night !== this.isNight) {
      this.isNight = night;
      if (propPlacer) {
        if (typeof propPlacer.updateLights === 'function') {
          propPlacer.updateLights(this.isNight);
        } else if (typeof propPlacer.setNightMode === 'function') {
          propPlacer.setNightMode(this.isNight);
        }
      }
      events.emit('NIGHT_STATE_CHANGED', this.isNight);
    }

    // Solar / Lunar orbital position
    const sunAngle = ((this.timeOfDay - 6) / 24) * Math.PI * 2;
    const sunX = Math.cos(sunAngle) * 220;
    const sunY = Math.sin(sunAngle) * 220;
    const sunZ = Math.sin(sunAngle * 0.5) * 70;

    const center = playerPos ? playerPos : new THREE.Vector3();
    this.sunLight.position.set(center.x + sunX, Math.max(20, center.y + sunY), center.z + sunZ);
    this.sunLight.target.position.copy(center);
    this.sunLight.target.updateMatrixWorld();

    // Layered Sky, Sun, and City Glow Colors
    if (this.timeOfDay >= 6.5 && this.timeOfDay < 17.0) {
      // 1. Full Daylight (Noon)
      this.sunLight.color.setHex(0xfffaed);
      this.sunLight.intensity = 2.2;
      this.scene.background.setHex(0x1e2f47);
      this.scene.fog.color.setHex(0x1e2f47);
      this.hemiLight.color.setHex(0xb1e1ff);
      this.hemiLight.groundColor.setHex(0x222b38);
      this.hemiLight.intensity = 0.75;
      this.cityGlowLight.intensity = 0.2;
    } else if (this.timeOfDay >= 17.0 && this.timeOfDay < 19.0) {
      // 2. Sunset / Golden Hour
      this.sunLight.color.setHex(0xff7733);
      this.sunLight.intensity = 1.8;
      this.scene.background.setHex(0x361f3d);
      this.scene.fog.color.setHex(0x361f3d);
      this.hemiLight.color.setHex(0xffaa66);
      this.hemiLight.groundColor.setHex(0x1a1224);
      this.hemiLight.intensity = 0.6;
      this.cityGlowLight.intensity = 0.35;
    } else if (this.timeOfDay >= 19.0 && this.timeOfDay < 20.2) {
      // 3. Blue Hour / Twilight Transition
      this.sunLight.color.setHex(0x4466aa);
      this.sunLight.intensity = 0.9;
      this.scene.background.setHex(0x121a2c);
      this.scene.fog.color.setHex(0x121a2c);
      this.hemiLight.color.setHex(0x3a5585);
      this.hemiLight.groundColor.setHex(0x111622);
      this.hemiLight.intensity = 0.5;
      this.cityGlowLight.intensity = 0.55;
    } else if (this.timeOfDay >= 20.2 || this.timeOfDay < 5.2) {
      // 4. Midnight (Atmospheric, Cinematic, Readable with Moonlight & City Glow)
      this.sunLight.color.setHex(0x3a5485); // Cool blue moonlight
      this.sunLight.intensity = 0.75;
      this.scene.background.setHex(0x0c1220); // Dark indigo sky (not pitch black)
      this.scene.fog.color.setHex(0x0c1220);
      this.hemiLight.color.setHex(0x2b3e63);
      this.hemiLight.groundColor.setHex(0x141a26);
      this.hemiLight.intensity = 0.45;
      this.cityGlowLight.intensity = 0.65; // Warm sodium street ambient fill
    } else {
      // 5. Dawn / Sunrise
      this.sunLight.color.setHex(0xffaa55);
      this.sunLight.intensity = 1.4;
      this.scene.background.setHex(0x2b2238);
      this.scene.fog.color.setHex(0x2b2238);
      this.hemiLight.color.setHex(0xffcc88);
      this.hemiLight.groundColor.setHex(0x1c1724);
      this.hemiLight.intensity = 0.55;
      this.cityGlowLight.intensity = 0.4;
    }

    // Clock string emit
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    events.emit('TIME_TICK', {
      timeStr,
      timeOfDay: this.timeOfDay,
      isNight: this.isNight
    });
  }
}
