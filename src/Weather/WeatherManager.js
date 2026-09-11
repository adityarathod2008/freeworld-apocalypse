/**
 * Game FreeWorld - WeatherManager
 * Dynamic weather conditions: Clear sky, Fog, and Rain with particle storm & thunder flashes
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class WeatherManager {
  constructor(scene) {
    this.scene = scene;
    this.currentWeather = 'CLEAR'; // 'CLEAR' | 'RAIN' | 'FOG'

    // Rain Particle System
    this.rainCount = 1500;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(this.rainCount * 3);

    for (let i = 0; i < this.rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 120;
      rainPos[i * 3 + 1] = Math.random() * 60;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.28,
      transparent: true,
      opacity: 0.65
    });

    this.rainMesh = new THREE.Points(rainGeo, rainMat);
    this.rainMesh.visible = false;
    this.scene.add(this.rainMesh);

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('DEBUG_TOGGLE_RAIN', () => {
      this.setWeather(this.currentWeather === 'RAIN' ? 'CLEAR' : 'RAIN');
    });
  }

  setWeather(weather) {
    this.currentWeather = weather;
    this.rainMesh.visible = this.currentWeather === 'RAIN';

    if (this.currentWeather === 'RAIN') {
      this.scene.fog.density = 0.006;
      events.emit('HUD_NOTIFICATION', {
        title: 'WEATHER ALERT',
        message: 'Precipitation detected in Bay City'
      });
    } else {
      this.scene.fog.density = 0.0035;
      events.emit('HUD_NOTIFICATION', {
        title: 'WEATHER ALERT',
        message: 'Clear skies'
      });
    }

    events.emit('WEATHER_CHANGED', this.currentWeather);
  }

  update(delta, playerPos) {
    if (this.currentWeather === 'RAIN') {
      const posAttr = this.rainMesh.geometry.attributes.position;
      const arr = posAttr.array;
      const origin = playerPos || new THREE.Vector3();

      this.rainMesh.position.x = origin.x;
      this.rainMesh.position.z = origin.z;

      for (let i = 0; i < this.rainCount; i++) {
        arr[i * 3 + 1] -= delta * 45; // Rain fall speed
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 60;
        }
      }
      posAttr.needsUpdate = true;
    }
  }
}
