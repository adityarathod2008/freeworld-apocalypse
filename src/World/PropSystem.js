/**
 * Game FreeWorld - PropSystem
 * Spawns street furniture, dynamic streetlamps, traffic signal poles, ATMs, and interactive triggers
 */
import * as THREE from 'three';
import { AssetManager } from '../Core/AssetManager.js';
import { events } from '../Core/EventBus.js';

export class PropSystem {
  constructor(scene) {
    this.scene = scene;
    this.streetLights = [];
    this.trafficLights = [];
    this.interactiveTriggers = [];
    this.colliders = [];
  }

  buildProps(cityData) {
    const half = 180;
    const blockSize = 90;
    const roadWidth = 14;

    // 1. Spawning Streetlamps along main roads
    this.spawnStreetLamps(half, blockSize, roadWidth);

    // 2. Traffic Signal Poles at 4-way intersections
    this.spawnIntersectionSignals(half, blockSize);

    // 3. Street Furniture (ATMs, Benches, Fire Hydrants, Trees)
    this.spawnStreetFurniture(half, blockSize, roadWidth);

    // 4. Interactive Shop & Safehouse Triggers
    this.spawnTriggers(cityData.landmarks);

    return {
      streetLights: this.streetLights,
      trafficLights: this.trafficLights,
      triggers: this.interactiveTriggers,
      colliders: this.colliders
    };
  }

  spawnStreetLamps(half, blockSize, roadWidth) {
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x222a36, roughness: 0.6, metalness: 0.5 });
    const armGeo = new THREE.BoxGeometry(0.1, 0.1, 2.2);
    const bulbGeo = new THREE.SphereGeometry(0.25, 8, 8);

    for (let i = -half + 30; i <= half - 30; i += 45) {
      for (let j = -half + 30; j <= half - 30; j += 45) {
        if (Math.abs(i) < 15 || Math.abs(j) < 15) {
          const lampGroup = new THREE.Group();
          lampGroup.position.set(i + (i > 0 ? 8.5 : -8.5), 0, j);

          const pole = new THREE.Mesh(poleGeo, poleMat);
          pole.position.y = 3.75;
          pole.castShadow = true;
          lampGroup.add(pole);

          const arm = new THREE.Mesh(armGeo, poleMat);
          arm.position.set(0, 7.3, 1.0);
          lampGroup.add(arm);

          const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe6aa });
          const bulb = new THREE.Mesh(bulbGeo, bulbMat);
          bulb.position.set(0, 7.1, 2.0);
          lampGroup.add(bulb);

          // SpotLight pointing down
          const spot = new THREE.SpotLight(0xffdd99, 0, 26, Math.PI / 4, 0.4, 1.2);
          spot.position.set(0, 7.0, 2.0);
          spot.target.position.set(0, 0, 2.0);
          lampGroup.add(spot);
          lampGroup.add(spot.target);

          this.scene.add(lampGroup);
          this.streetLights.push({ group: lampGroup, bulb: bulbMat, light: spot });
          this.colliders.push({ box: new THREE.Box3().setFromObject(pole), type: 'prop' });
        }
      }
    }
  }

  spawnIntersectionSignals(half, blockSize) {
    // 4 major road intersections
    const intersections = [
      { x: 0, z: 0 },
      { x: -blockSize, z: 0 },
      { x: blockSize, z: 0 },
      { x: 0, z: -blockSize },
      { x: 0, z: blockSize }
    ];

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7 });
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x111827 });

    for (const inter of intersections) {
      for (const corner of [[-8, -8], [8, 8], [-8, 8], [8, -8]]) {
        const sigGroup = new THREE.Group();
        sigGroup.position.set(inter.x + corner[0], 0, inter.z + corner[1]);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 6.0, 8), poleMat);
        pole.position.y = 3.0;
        sigGroup.add(pole);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.4), boxMat);
        head.position.set(0, 5.2, 0);
        sigGroup.add(head);

        // Red, Yellow, Green bulbs
        const redBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x440000 }));
        redBulb.position.set(0, 5.6, 0.22);
        sigGroup.add(redBulb);

        const yellowBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x444400 }));
        yellowBulb.position.set(0, 5.2, 0.22);
        sigGroup.add(yellowBulb);

        const greenBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00ff66 }));
        greenBulb.position.set(0, 4.8, 0.22);
        sigGroup.add(greenBulb);

        this.scene.add(sigGroup);
        this.trafficLights.push({
          red: redBulb,
          yellow: yellowBulb,
          green: greenBulb,
          state: 'GREEN'
        });
      }
    }
  }

  spawnStreetFurniture(half, blockSize, roadWidth) {
    const hydrantGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 12);
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });

    const benchGeo = new THREE.BoxGeometry(2.2, 0.45, 0.7);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

    const atmGeo = new THREE.BoxGeometry(1.2, 2.2, 0.9);
    const atmMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 });

    // Place ATMs at convenient sidewalk spots
    const atmPositions = [
      new THREE.Vector3(-42, 1.1, -12),
      new THREE.Vector3(42, 1.1, -12),
      new THREE.Vector3(-12, 1.1, 42),
      new THREE.Vector3(12, 1.1, 42)
    ];

    for (const pos of atmPositions) {
      const atm = new THREE.Mesh(atmGeo, atmMat);
      atm.position.copy(pos);
      atm.castShadow = true;
      this.scene.add(atm);
      this.colliders.push({ box: new THREE.Box3().setFromObject(atm), type: 'prop' });

      // Screen glow
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      screen.position.set(pos.x, pos.y + 0.3, pos.z + 0.46);
      this.scene.add(screen);

      this.interactiveTriggers.push({
        id: 'atm',
        type: 'atm',
        position: new THREE.Vector3(pos.x, 0.5, pos.z + 1.2),
        radius: 2.2,
        prompt: 'Use Fleeca ATM (E)'
      });
    }

    // Fire hydrants on street corners
    for (let h = 0; h < 8; h++) {
      const hydrant = new THREE.Mesh(hydrantGeo, hydrantMat);
      const angle = (h / 8) * Math.PI * 2;
      hydrant.position.set(Math.cos(angle) * 75 + 8, 0.4, Math.sin(angle) * 75 + 8);
      hydrant.castShadow = true;
      this.scene.add(hydrant);
      this.colliders.push({ box: new THREE.Box3().setFromObject(hydrant), type: 'prop' });
    }
  }

  spawnTriggers(landmarks) {
    // Gun Shop Trigger (Apex Armory)
    if (landmarks.armory) {
      this.interactiveTriggers.push({
        id: 'armory',
        type: 'shop',
        position: landmarks.armory.clone(),
        radius: 3.5,
        prompt: 'Access Apex Armory (E)'
      });

      // Visual floating glowing marker
      this.createGroundMarker(landmarks.armory, 0xff0055);
    }

    // Safehouse Trigger
    if (landmarks.safehouse) {
      this.interactiveTriggers.push({
        id: 'safehouse',
        type: 'safehouse',
        position: landmarks.safehouse.clone(),
        radius: 4.0,
        prompt: 'Enter Safehouse Penthouse (E)'
      });
      this.createGroundMarker(landmarks.safehouse, 0x00ff88);
    }

    // Bank Vault Alley / Heist terminal Trigger
    if (landmarks.bank_vault_alley) {
      this.interactiveTriggers.push({
        id: 'bank_heist',
        type: 'heist',
        position: landmarks.bank_vault_alley.clone(),
        radius: 4.0,
        prompt: 'Infiltrate Vault Security (E)'
      });
      this.createGroundMarker(landmarks.bank_vault_alley, 0xffbb00);
    }

    // Harbor Contact Marco Trigger
    if (landmarks.harbor) {
      this.interactiveTriggers.push({
        id: 'harbor_contact',
        type: 'contact',
        position: landmarks.harbor.clone(),
        radius: 4.0,
        prompt: 'Speak with Marco (E)'
      });
      this.createGroundMarker(landmarks.harbor, 0x00d4ff);
    }
  }

  createGroundMarker(pos, colorHex) {
    const ringGeo = new THREE.RingGeometry(1.6, 2.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.08, pos.z);
    this.scene.add(ring);

    // Glowing core
    const coreGeo = new THREE.CircleGeometry(1.5, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.x = -Math.PI / 2;
    core.position.set(pos.x, 0.07, pos.z);
    this.scene.add(core);
  }

  updateLights(isNight) {
    this.setNightMode(isNight);
  }

  setNightMode(isNight) {
    for (const lamp of this.streetLights) {
      if (lamp.light) lamp.light.intensity = isNight ? 1.6 : 0;
      if (lamp.bulb) lamp.bulb.color.setHex(isNight ? 0xfff0cc : 0x444033);
    }
  }
}
