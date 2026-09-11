/**
 * Game FreeWorld - PropPlacer
 * Places interactive street props: streetlights, traffic lights, ATMs, and shop trigger markers
 */
import * as THREE from 'three';

export class PropPlacer {
  constructor(scene) {
    this.scene = scene;
    this.streetLights = [];
    this.trafficLights = [];
    this.interactiveTriggers = [];
  }

  placeProps(cityData) {
    this.placeStreetlights();
    this.placeShopTriggers(cityData.landmarks);
    return {
      streetLights: this.streetLights,
      trafficLights: this.trafficLights,
      triggers: this.interactiveTriggers
    };
  }

  placeStreetlights() {
    const postMat = new THREE.MeshStandardMaterial({ color: 0x22262d, metalness: 0.8 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffeedd });

    // Place streetlamps around the city grid
    const coords = [-135, -45, 45, 135];
    for (const x of coords) {
      for (const z of coords) {
        // Lamp Post
        const postGeo = new THREE.CylinderGeometry(0.18, 0.25, 8, 8);
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(x + 9, 4, z + 9);
        this.scene.add(post);

        // Arm
        const armGeo = new THREE.BoxGeometry(3, 0.2, 0.2);
        const arm = new THREE.Mesh(armGeo, postMat);
        arm.position.set(x + 7.5, 7.8, z + 9);
        this.scene.add(arm);

        // Lamp head
        const headGeo = new THREE.ConeGeometry(0.6, 0.5, 8);
        const head = new THREE.Mesh(headGeo, bulbMat);
        head.rotation.x = Math.PI;
        head.position.set(x + 6, 7.6, z + 9);
        this.scene.add(head);

        // Actual Light
        const light = new THREE.PointLight(0xffddaa, 0, 32, 1.8);
        light.position.set(x + 6, 7.2, z + 9);
        this.scene.add(light);
        this.streetLights.push({ light, head, baseIntensity: 1.8 });
      }
    }
  }

  placeShopTriggers(landmarks) {
    // 1. Apex Armory Shop Trigger
    if (landmarks.armory) {
      const ringGeo = new THREE.RingGeometry(2.5, 3.0, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(landmarks.armory);
      ring.position.y = 0.05;
      this.scene.add(ring);

      this.interactiveTriggers.push({
        id: 'shop_armory',
        name: 'Apex Armory',
        position: landmarks.armory,
        radius: 4,
        type: 'shop',
        actionText: 'Open Weapon Shop'
      });
    }

    // 2. Safehouse Garage Trigger
    if (landmarks.safehouse) {
      const ringGeo = new THREE.RingGeometry(4.0, 4.6, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x55ff77,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(landmarks.safehouse);
      ring.position.y = 0.05;
      this.scene.add(ring);

      this.interactiveTriggers.push({
        id: 'safehouse',
        name: 'Safehouse Garage',
        position: landmarks.safehouse,
        radius: 5,
        type: 'safehouse',
        actionText: 'Enter Safehouse / Save Game'
      });
    }

    // 3. ATM Kiosks
    if (landmarks.bank) {
      const atmPos = landmarks.bank.clone().add(new THREE.Vector3(12, 0, 0));
      const atmGeo = new THREE.BoxGeometry(1.2, 2.4, 1.2);
      const atmMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
      const atm = new THREE.Mesh(atmGeo, atmMat);
      atm.position.set(atmPos.x, 1.2, atmPos.z);
      this.scene.add(atm);

      this.interactiveTriggers.push({
        id: 'atm_bank',
        name: 'Fleeca Bank ATM',
        position: atmPos,
        radius: 3,
        type: 'atm',
        actionText: 'Access Fleeca ATM'
      });
    }
  }

  updateLights(isNight) {
    const targetIntensity = isNight ? 1.8 : 0;
    for (const item of this.streetLights) {
      item.light.intensity = targetIntensity;
      item.head.material.color.setHex(isNight ? 0xffddaa : 0x444444);
    }
  }
}
