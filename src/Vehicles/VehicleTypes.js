/**
 * Game FreeWorld - VehicleTypes
 * 5 Original driveable vehicles + Police interceptor cruiser with custom 3D procedural meshes
 */
import * as THREE from 'three';
import { VehicleBase } from './VehicleBase.js';

export class VehicleFactory {
  static createWheel(radius = 0.38, width = 0.28) {
    const wheelGroup = new THREE.Group();
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 16);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width + 0.02, 8);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    return wheelGroup;
  }

  // 1. APEX GT-X (Supercar)
  static createApexGTX(scene) {
    const car = new VehicleBase(scene, {
      displayName: 'Apex GT-X',
      type: 'car',
      maxSpeed: 52, // ~190 km/h
      acceleration: 36,
      brakingForce: 42,
      steeringSensitivity: 2.6,
      mass: 1300
    });

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      metalness: 0.85,
      roughness: 0.15
    });
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a101d, metalness: 0.9, roughness: 0.1 });

    // Lower Chassis
    const lowerGeo = new THREE.BoxGeometry(2.0, 0.45, 4.4);
    const lower = new THREE.Mesh(lowerGeo, bodyMat);
    lower.position.y = 0.35;
    lower.castShadow = true;
    car.mesh.add(lower);

    // Cockpit / Cabin
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.42, 2.0);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 0.72, -0.2);
    cabin.castShadow = true;
    car.mesh.add(cabin);

    // Rear Spoiler
    const spoilerGeo = new THREE.BoxGeometry(1.9, 0.08, 0.4);
    const spoiler = new THREE.Mesh(spoilerGeo, carbonMat);
    spoiler.position.set(0, 0.92, -2.0);
    car.mesh.add(spoiler);

    // Spoiler struts
    for (const sx of [-0.6, 0.6]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.15), carbonMat);
      strut.position.set(sx, 0.75, -2.0);
      car.mesh.add(strut);
    }

    // Attach 4 wheels
    const wheelPositions = [
      { x: -1.05, z: 1.35, isFront: true },
      { x: 1.05, z: 1.35, isFront: true },
      { x: -1.05, z: -1.35, isFront: false },
      { x: 1.05, z: -1.35, isFront: false }
    ];

    for (const wp of wheelPositions) {
      const pivot = new THREE.Group();
      pivot.position.set(wp.x, 0.38, wp.z);
      const wheel = VehicleFactory.createWheel(0.38, 0.28);
      pivot.add(wheel);
      car.mesh.add(pivot);

      car.wheels.push(wheel);
      if (wp.isFront) car.frontWheels.push(pivot);
    }

    car.setupLights(2.2, -2.2, 0.75, 0.4);
    return car;
  }

  // 2. VINDICATOR V8 (Muscle Car)
  static createVindicatorV8(scene) {
    const car = new VehicleBase(scene, {
      displayName: 'Vindicator V8',
      type: 'car',
      maxSpeed: 46,
      acceleration: 32,
      brakingForce: 30,
      steeringSensitivity: 2.0,
      mass: 1650
    });

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe65100, roughness: 0.3, metalness: 0.4 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.9, roughness: 0.1 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.65, 4.6), bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    car.mesh.add(body);

    // Rally stripes on hood/roof
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.66, 4.6), stripeMat);
    stripe.position.y = 0.51;
    car.mesh.add(stripe);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 2.2), glassMat);
    cabin.position.set(0, 1.05, -0.3);
    cabin.castShadow = true;
    car.mesh.add(cabin);

    // Hood scoop
    const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.6), stripeMat);
    scoop.position.set(0, 0.88, 1.2);
    car.mesh.add(scoop);

    // Attach wheels
    const wheelPositions = [
      { x: -1.08, z: 1.4, isFront: true },
      { x: 1.08, z: 1.4, isFront: true },
      { x: -1.08, z: -1.4, isFront: false },
      { x: 1.08, z: -1.4, isFront: false }
    ];
    for (const wp of wheelPositions) {
      const pivot = new THREE.Group();
      pivot.position.set(wp.x, 0.42, wp.z);
      const wheel = VehicleFactory.createWheel(0.42, 0.32);
      pivot.add(wheel);
      car.mesh.add(pivot);
      car.wheels.push(wheel);
      if (wp.isFront) car.frontWheels.push(pivot);
    }

    car.setupLights(2.3, -2.3, 0.82, 0.55);
    return car;
  }

  // 3. KESTREL EXECUTIVE (Sedan)
  static createKestrelSedan(scene) {
    const car = new VehicleBase(scene, {
      displayName: 'Kestrel Executive',
      type: 'car',
      maxSpeed: 42,
      acceleration: 26,
      brakingForce: 34,
      steeringSensitivity: 2.2,
      mass: 1550
    });

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 4.5), bodyMat);
    body.position.y = 0.48;
    body.castShadow = true;
    car.mesh.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.55, 2.5), glassMat);
    cabin.position.set(0, 1.0, -0.1);
    cabin.castShadow = true;
    car.mesh.add(cabin);

    const wheelPositions = [
      { x: -1.02, z: 1.35, isFront: true },
      { x: 1.02, z: 1.35, isFront: true },
      { x: -1.02, z: -1.35, isFront: false },
      { x: 1.02, z: -1.35, isFront: false }
    ];
    for (const wp of wheelPositions) {
      const pivot = new THREE.Group();
      pivot.position.set(wp.x, 0.38, wp.z);
      const wheel = VehicleFactory.createWheel(0.38, 0.26);
      pivot.add(wheel);
      car.mesh.add(pivot);
      car.wheels.push(wheel);
      if (wp.isFront) car.frontWheels.push(pivot);
    }

    car.setupLights(2.25, -2.25, 0.78, 0.5);
    return car;
  }

  // 4. GOLIATH HEAVY 6x6 (Armored Truck)
  static createGoliathTruck(scene) {
    const car = new VehicleBase(scene, {
      displayName: 'Goliath 6x6',
      type: 'truck',
      maxSpeed: 34,
      acceleration: 20,
      brakingForce: 40,
      steeringSensitivity: 1.6,
      mass: 4200,
      maxHealth: 2500
    });

    const armorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });

    // Main chassis & bed
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 5.8), armorMat);
    bed.position.y = 1.1;
    bed.castShadow = true;
    car.mesh.add(bed);

    // Front Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.3, 2.2), armorMat);
    cab.position.set(0, 1.7, 1.4);
    cab.castShadow = true;
    car.mesh.add(cab);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.6, 0.2), glassMat);
    windshield.position.set(0, 1.9, 2.5);
    car.mesh.add(windshield);

    // Bullbar
    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.3), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    bullbar.position.set(0, 0.8, 3.0);
    car.mesh.add(bullbar);

    // 6 Wheels
    const wheelPositions = [
      { x: -1.25, z: 1.8, isFront: true },
      { x: 1.25, z: 1.8, isFront: true },
      { x: -1.25, z: -0.8, isFront: false },
      { x: 1.25, z: -0.8, isFront: false },
      { x: -1.25, z: -2.2, isFront: false },
      { x: 1.25, z: -2.2, isFront: false }
    ];
    for (const wp of wheelPositions) {
      const pivot = new THREE.Group();
      pivot.position.set(wp.x, 0.58, wp.z);
      const wheel = VehicleFactory.createWheel(0.58, 0.38);
      pivot.add(wheel);
      car.mesh.add(pivot);
      car.wheels.push(wheel);
      if (wp.isFront) car.frontWheels.push(pivot);
    }

    car.setupLights(2.9, -2.9, 1.0, 0.9);
    return car;
  }

  // 5. PHANTOM SHADOW (Motorcycle)
  static createPhantomBike(scene) {
    const bike = new VehicleBase(scene, {
      displayName: 'Phantom Shadow',
      type: 'bike',
      maxSpeed: 56, // ~200 km/h
      acceleration: 44,
      brakingForce: 38,
      steeringSensitivity: 3.2,
      mass: 450,
      maxHealth: 600
    });

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.8 });
    const fairingMat = new THREE.MeshStandardMaterial({ color: 0xd946ef, roughness: 0.2, metalness: 0.4 });

    // Main Body Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 1.6), frameMat);
    frame.position.y = 0.65;
    bike.mesh.add(frame);

    // Fairing & Tank
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.35, 0.8), fairingMat);
    tank.position.set(0, 0.9, 0.2);
    bike.mesh.add(tank);

    // Handlebars
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), frameMat);
    handle.position.set(0, 1.05, 0.5);
    bike.mesh.add(handle);

    // Wheels (Front & Rear)
    const frontPivot = new THREE.Group();
    frontPivot.position.set(0, 0.36, 1.1);
    const fWheel = VehicleFactory.createWheel(0.36, 0.16);
    frontPivot.add(fWheel);
    bike.mesh.add(frontPivot);
    bike.wheels.push(fWheel);
    bike.frontWheels.push(frontPivot);

    const rearPivot = new THREE.Group();
    rearPivot.position.set(0, 0.36, -1.0);
    const rWheel = VehicleFactory.createWheel(0.36, 0.22);
    rearPivot.add(rWheel);
    bike.mesh.add(rearPivot);
    bike.wheels.push(rWheel);

    bike.setupLights(1.3, -1.2, 0.15, 0.7);
    return bike;
  }

  // 6. METROPOLIS POLICE CRUISER
  static createPoliceCruiser(scene) {
    const car = new VehicleBase(scene, {
      displayName: 'Police Interceptor',
      type: 'car',
      maxSpeed: 48,
      acceleration: 34,
      brakingForce: 38,
      steeringSensitivity: 2.4,
      mass: 1600
    });

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.62, 4.6), whiteMat);
    body.position.y = 0.5;
    body.castShadow = true;
    car.mesh.add(body);

    // Black doors
    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.58, 2.0), blackMat);
    leftDoor.position.set(-1.03, 0.5, 0);
    car.mesh.add(leftDoor);

    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.58, 2.0), blackMat);
    rightDoor.position.set(1.03, 0.5, 0);
    car.mesh.add(rightDoor);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.55, 2.3), glassMat);
    cabin.position.set(0, 1.05, -0.15);
    car.mesh.add(cabin);

    // Lightbar on roof (Blue & Red)
    const barFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.25), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    barFrame.position.set(0, 1.36, -0.15);
    car.mesh.add(barFrame);

    const blueLight = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.22), new THREE.MeshBasicMaterial({ color: 0x0088ff }));
    blueLight.position.set(-0.35, 1.4, -0.15);
    car.mesh.add(blueLight);

    const redLight = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.22), new THREE.MeshBasicMaterial({ color: 0xff0022 }));
    redLight.position.set(0.35, 1.4, -0.15);
    car.mesh.add(redLight);

    car.policeLights = { blue: blueLight, red: redLight, timer: 0, active: false };

    const wheelPositions = [
      { x: -1.04, z: 1.35, isFront: true },
      { x: 1.04, z: 1.35, isFront: true },
      { x: -1.04, z: -1.35, isFront: false },
      { x: 1.04, z: -1.35, isFront: false }
    ];
    for (const wp of wheelPositions) {
      const pivot = new THREE.Group();
      pivot.position.set(wp.x, 0.4, wp.z);
      const wheel = VehicleFactory.createWheel(0.4, 0.26);
      pivot.add(wheel);
      car.mesh.add(pivot);
      car.wheels.push(wheel);
      if (wp.isFront) car.frontWheels.push(pivot);
    }

    car.setupLights(2.3, -2.3, 0.8, 0.52);
    return car;
  }
}
