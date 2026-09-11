/**
 * Game FreeWorld - CityBuilder
 * Generates Downtown Bay City: Skyscrapers with procedural window maps,
 * Financial Center Bank, Apex Armory, Car Dealership, Gas Station, Marina Harbor,
 * and Residential Safehouse Penthouse.
 */
import * as THREE from 'three';
import { AssetManager } from '../Core/AssetManager.js';
import { CityImporter } from './CityImporter.js';

export class CityBuilder {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.landmarks = {};
    this.districtSize = 360;
    this.blockCount = 4;
    this.blockSize = this.districtSize / this.blockCount;
    this.roadWidth = 14;
    this.sidewalkWidth = 4;
    this.cityImporter = new CityImporter();
    this.cityGraph = null;
  }

  build(geoJsonData = null, sectorManager = null) {
    this.cityGraph = this.cityImporter.importCity(geoJsonData, sectorManager);

    this.createGround();
    this.createRoadGrid();
    this.createCityBlocks();
    this.createSpecialLandmarks();

    return {
      colliders: this.colliders,
      landmarks: this.landmarks,
      cityGraph: this.cityGraph
    };
  }

  createGround() {
    // Large terrain base
    const groundGeo = new THREE.PlaneGeometry(this.districtSize * 1.8, this.districtSize * 1.8);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f1520,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Harbor water basin on South-West edge
    const waterGeo = new THREE.PlaneGeometry(160, 160);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x051d2d,
      roughness: 0.1,
      metalness: 0.85,
      transparent: true,
      opacity: 0.9
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-130, -0.02, 130);
    this.scene.add(water);
  }

  createRoadGrid() {
    const half = this.districtSize / 2;
    const roadTex = AssetManager.getRoadTexture();
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x3a424e,
      roughness: 0.75,
      metalness: 0.25,
      map: roadTex
    });

    const markYellowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const markWhiteMat = new THREE.MeshBasicMaterial({ color: 0xdddddd });

    for (let i = 0; i <= this.blockCount; i++) {
      const pos = -half + i * this.blockSize;

      // East-West road strip
      const roadEWGeo = new THREE.PlaneGeometry(this.districtSize, this.roadWidth);
      const roadEW = new THREE.Mesh(roadEWGeo, roadMat);
      roadEW.rotation.x = -Math.PI / 2;
      roadEW.position.set(0, 0.02, pos);
      roadEW.receiveShadow = true;
      this.scene.add(roadEW);

      // Yellow double centerline for EW road
      const lineEW = new THREE.Mesh(new THREE.PlaneGeometry(this.districtSize, 0.35), markYellowMat);
      lineEW.rotation.x = -Math.PI / 2;
      lineEW.position.set(0, 0.03, pos);
      this.scene.add(lineEW);

      // North-South road strip
      const roadNSGeo = new THREE.PlaneGeometry(this.roadWidth, this.districtSize);
      const roadNS = new THREE.Mesh(roadNSGeo, roadMat);
      roadNS.rotation.x = -Math.PI / 2;
      roadNS.position.set(pos, 0.02, 0);
      roadNS.receiveShadow = true;
      this.scene.add(roadNS);

      // Yellow double centerline for NS road
      const lineNS = new THREE.Mesh(new THREE.PlaneGeometry(0.35, this.districtSize), markYellowMat);
      lineNS.rotation.x = -Math.PI / 2;
      lineNS.position.set(pos, 0.03, 0);
      this.scene.add(lineNS);

      // Intersection Crosswalk Zebra Stripes
      for (let j = 0; j <= this.blockCount; j++) {
        const crossZ = -half + j * this.blockSize;
        this.createCrosswalk(pos, crossZ);
      }
    }
  }

  createCrosswalk(x, z) {
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
    // 4 crosswalk strips around intersection
    const offsets = [
      { x: 0, z: -9, w: 10, h: 2 },
      { x: 0, z: 9, w: 10, h: 2 },
      { x: -9, z: 0, w: 2, h: 10 },
      { x: 9, z: 0, w: 2, h: 10 }
    ];

    for (const off of offsets) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(off.w, off.h), whiteMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x + off.x, 0.035, z + off.z);
      this.scene.add(stripe);
    }
  }

  createCityBlocks() {
    const half = this.districtSize / 2;
    const swTex = AssetManager.getSidewalkTexture();
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x717c8d,
      roughness: 0.65,
      metalness: 0.15,
      map: swTex
    });

    const bldgTextureComm = AssetManager.getBuildingTexture('commercial');
    const bldgTextureFin = AssetManager.getBuildingTexture('financial');

    for (let i = 0; i < this.blockCount; i++) {
      for (let j = 0; j < this.blockCount; j++) {
        // Reserved landmark blocks:
        // (1, 1): Central Plaza
        // (0, 0): District Central Bank
        // (3, 0): Apex Armory & Dealership
        // (0, 3): Harbor Docks
        // (3, 3): Safehouse Penthouse
        // (2, 0): Gas Station
        if (
          (i === 1 && j === 1) ||
          (i === 0 && j === 0) ||
          (i === 3 && j === 0) ||
          (i === 0 && j === 3) ||
          (i === 3 && j === 3) ||
          (i === 2 && j === 0)
        ) {
          continue;
        }

        const blockCenterX = -half + i * this.blockSize + this.blockSize / 2;
        const blockCenterZ = -half + j * this.blockSize + this.blockSize / 2;
        const blockInnerSize = this.blockSize - this.roadWidth;

        // Elevated sidewalk foundation slab
        const swGeo = new THREE.BoxGeometry(blockInnerSize, 0.45, blockInnerSize);
        const swMesh = new THREE.Mesh(swGeo, sidewalkMat);
        swMesh.position.set(blockCenterX, 0.22, blockCenterZ);
        swMesh.receiveShadow = true;
        this.scene.add(swMesh);

        // Subdivide block into 4 distinct skyscraper plots
        const subSize = (blockInnerSize - 6) / 2;
        const subOffsets = [
          [-subSize / 2, -subSize / 2],
          [subSize / 2, -subSize / 2],
          [-subSize / 2, subSize / 2],
          [subSize / 2, subSize / 2]
        ];

        const isFinancialZone = i < 2 && j < 2;

        for (let s = 0; s < 4; s++) {
          const bx = blockCenterX + subOffsets[s][0];
          const bz = blockCenterZ + subOffsets[s][1];
          const height = (isFinancialZone ? 60 : 35) + Math.random() * (isFinancialZone ? 70 : 45);
          const bWidth = subSize - 2;
          const bDepth = subSize - 2;

          const bMat = new THREE.MeshStandardMaterial({
            map: isFinancialZone ? bldgTextureFin : bldgTextureComm,
            roughness: 0.4,
            metalness: 0.5
          });

          // Tiered modern skyscraper geometry with setback
          const lowerH = height * 0.7;
          const upperH = height * 0.3;

          const lowerGeo = new THREE.BoxGeometry(bWidth, lowerH, bDepth);
          const lower = new THREE.Mesh(lowerGeo, bMat);
          lower.position.set(bx, lowerH / 2 + 0.45, bz);
          lower.castShadow = true;
          lower.receiveShadow = true;
          this.scene.add(lower);

          const upperGeo = new THREE.BoxGeometry(bWidth * 0.8, upperH, bDepth * 0.8);
          const upper = new THREE.Mesh(upperGeo, bMat);
          upper.position.set(bx, lowerH + upperH / 2 + 0.45, bz);
          upper.castShadow = true;
          upper.receiveShadow = true;
          this.scene.add(upper);

          // Combined collider box
          const bBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(bx, height / 2 + 0.45, bz),
            new THREE.Vector3(bWidth, height, bDepth)
          );
          this.colliders.push({ box: bBox, type: 'building' });

          // Rooftop Architectural Crown / Antennas
          if (Math.random() > 0.4) {
            const mastGeo = new THREE.CylinderGeometry(0.2, 0.45, 14, 8);
            const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
            const mast = new THREE.Mesh(mastGeo, mastMat);
            mast.position.set(bx, height + 7.45, bz);
            this.scene.add(mast);

            // Blinking red aviation warning beacon
            const beacon = new THREE.Mesh(
              new THREE.SphereGeometry(0.5, 8, 8),
              new THREE.MeshBasicMaterial({ color: 0xff0033 })
            );
            beacon.position.set(bx, height + 14.5, bz);
            this.scene.add(beacon);
          }
        }
      }
    }
  }

  createSpecialLandmarks() {
    const half = this.districtSize / 2;

    // 1. CENTRAL PLAZA (Block 1, 1)
    this.createCentralPlaza(half);

    // 2. DISTRICT CENTRAL BANK & VAULT ALLEY (Block 0, 0)
    this.createCentralBank(half);

    // 3. APEX ARMORY & DEALERSHIP (Block 3, 0)
    this.createArmoryAndDealership(half);

    // 4. BAY CITY SAFEHOUSE PENTHOUSE & GARAGE (Block 3, 3)
    this.createSafehousePenthouse(half);

    // 5. MARINA HARBOR & DOCKS (Block 0, 3)
    this.createMarinaHarbor(half);

    // 6. GAS STATION & CONVENIENCE STORE (Block 2, 0)
    this.createGasStation(half);
  }

  createCentralPlaza(half) {
    const px = -half + 1 * this.blockSize + this.blockSize / 2;
    const pz = -half + 1 * this.blockSize + this.blockSize / 2;
    const pSize = this.blockSize - this.roadWidth;

    const swTex = AssetManager.getSidewalkTexture();
    const plazaBase = new THREE.Mesh(
      new THREE.BoxGeometry(pSize, 0.45, pSize),
      new THREE.MeshStandardMaterial({ color: 0x5a6578, roughness: 0.5, map: swTex })
    );
    plazaBase.position.set(px, 0.22, pz);
    plazaBase.receiveShadow = true;
    this.scene.add(plazaBase);

    // Grand 2-tier Fountain
    const fLower = new THREE.Mesh(
      new THREE.CylinderGeometry(12, 13, 1.8, 32),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3 })
    );
    fLower.position.set(px, 1.1, pz);
    fLower.castShadow = true;
    this.scene.add(fLower);
    this.colliders.push({ box: new THREE.Box3().setFromObject(fLower), type: 'prop' });

    // Water basin
    const fWater = new THREE.Mesh(
      new THREE.CylinderGeometry(11.4, 11.4, 0.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x00d4ff, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 })
    );
    fWater.position.set(px, 1.95, pz);
    this.scene.add(fWater);

    // Central Obelisk / Spire
    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 2.2, 16, 8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
    );
    spire.position.set(px, 9.5, pz);
    spire.castShadow = true;
    this.scene.add(spire);

    // Plaza benches and planter boxes
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const bx = px + Math.cos(angle) * 22;
      const bz = pz + Math.sin(angle) * 22;
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.5, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      bench.position.set(bx, 0.5, bz);
      this.scene.add(bench);
      this.colliders.push({ box: new THREE.Box3().setFromObject(bench), type: 'prop' });
    }

    this.landmarks['plaza'] = new THREE.Vector3(px, 0.5, pz + 18);
  }

  createCentralBank(half) {
    const bx = -half + 0 * this.blockSize + this.blockSize / 2;
    const bz = -half + 0 * this.blockSize + this.blockSize / 2;

    // Classical Stone Bank Facade
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.3 });
    const bankMain = new THREE.Mesh(new THREE.BoxGeometry(56, 44, 52), bankMat);
    bankMain.position.set(bx, 22.45, bz);
    bankMain.castShadow = true;
    bankMain.receiveShadow = true;
    this.scene.add(bankMain);
    this.colliders.push({ box: new THREE.Box3().setFromObject(bankMain), type: 'building' });

    // Grand Corinthian Pillars
    const colMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.2, metalness: 0.2 });
    for (let p = -3; p <= 3; p += 2) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 20, 16), colMat);
      col.position.set(bx + p * 6.5, 10.45, bz + 27);
      col.castShadow = true;
      this.scene.add(col);
      this.colliders.push({ box: new THREE.Box3().setFromObject(col), type: 'prop' });
    }

    // Grand Entrance Archway & Steps
    const steps = new THREE.Mesh(new THREE.BoxGeometry(32, 1.2, 8), colMat);
    steps.position.set(bx, 0.6, bz + 30);
    this.scene.add(steps);

    // Glowing Neon Bank Sign
    const signTex = AssetManager.createNeonSignTexture('FLEECA CENTRAL BANK', 'FINANCIAL RESERVE', '#ffcc00', '#ffffff');
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 9),
      new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
    );
    sign.position.set(bx, 24, bz + 26.6);
    this.scene.add(sign);

    this.landmarks['bank'] = new THREE.Vector3(bx, 0.5, bz + 35);
    this.landmarks['bank_vault_alley'] = new THREE.Vector3(bx - 32, 0.5, bz - 6);
  }

  createArmoryAndDealership(half) {
    const ax = -half + 3 * this.blockSize + this.blockSize / 2;
    const az = -half + 0 * this.blockSize + this.blockSize / 2;

    // Gun Shop (Apex Armory)
    const armoryMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5, metalness: 0.7 });
    const armory = new THREE.Mesh(new THREE.BoxGeometry(34, 18, 30), armoryMat);
    armory.position.set(ax - 18, 9.45, az);
    armory.castShadow = true;
    this.scene.add(armory);
    this.colliders.push({ box: new THREE.Box3().setFromObject(armory), type: 'building' });

    // Neon Weapon Store Sign
    const armorySignTex = AssetManager.createNeonSignTexture('APEX ARMORY', 'FIREARMS & TACTICAL GEAR', '#ff0055', '#ffaa00');
    const armorySign = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 6),
      new THREE.MeshBasicMaterial({ map: armorySignTex, transparent: true })
    );
    armorySign.position.set(ax - 18, 14, az + 15.2);
    this.scene.add(armorySign);

    // Dealership Showroom
    const dealerMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.1, metalness: 0.9 });
    const showroom = new THREE.Mesh(new THREE.BoxGeometry(32, 14, 30), dealerMat);
    showroom.position.set(ax + 18, 7.45, az);
    showroom.castShadow = true;
    this.scene.add(showroom);
    this.colliders.push({ box: new THREE.Box3().setFromObject(showroom), type: 'building' });

    const dealerSignTex = AssetManager.createNeonSignTexture('APEX LUXURY MOTORS', 'NEW & EXOTIC VEHICLES', '#00f0ff', '#ffffff');
    const dealerSign = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 6),
      new THREE.MeshBasicMaterial({ map: dealerSignTex, transparent: true })
    );
    dealerSign.position.set(ax + 18, 12, az + 15.2);
    this.scene.add(dealerSign);

    this.landmarks['armory'] = new THREE.Vector3(ax - 18, 0.5, az + 20);
    this.landmarks['dealership'] = new THREE.Vector3(ax + 18, 0.5, az + 20);
  }

  createSafehousePenthouse(half) {
    const sx = -half + 3 * this.blockSize + this.blockSize / 2;
    const sz = -half + 3 * this.blockSize + this.blockSize / 2;

    const bldgTexture = AssetManager.getBuildingTexture('financial');
    const safeMat = new THREE.MeshStandardMaterial({ map: bldgTexture, roughness: 0.3, metalness: 0.6 });

    // Ultra-tall Penthouse Tower (105m)
    const tower = new THREE.Mesh(new THREE.BoxGeometry(40, 105, 40), safeMat);
    tower.position.set(sx, 52.95, sz);
    tower.castShadow = true;
    tower.receiveShadow = true;
    this.scene.add(tower);
    this.colliders.push({ box: new THREE.Box3().setFromObject(tower), type: 'building' });

    // Rooftop Helipad
    const heliGeo = new THREE.CylinderGeometry(14, 14, 1.2, 24);
    const heliMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const helipad = new THREE.Mesh(heliGeo, heliMat);
    helipad.position.set(sx, 106.0, sz);
    this.scene.add(helipad);

    // Large 'H' on Helipad
    const hMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const hBar1 = new THREE.Mesh(new THREE.PlaneGeometry(2, 12), hMat);
    hBar1.rotation.x = -Math.PI / 2;
    hBar1.position.set(sx - 3, 106.65, sz);
    this.scene.add(hBar1);

    const hBar2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 12), hMat);
    hBar2.rotation.x = -Math.PI / 2;
    hBar2.position.set(sx + 3, 106.65, sz);
    this.scene.add(hBar2);

    const hCross = new THREE.Mesh(new THREE.PlaneGeometry(6, 2), hMat);
    hCross.rotation.x = -Math.PI / 2;
    hCross.position.set(sx, 106.65, sz);
    this.scene.add(hCross);

    // Luxury Garage Entrance at ground level
    const garageFrame = new THREE.Mesh(
      new THREE.BoxGeometry(14, 5, 2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
    );
    garageFrame.position.set(sx, 2.5, sz + 21);
    this.scene.add(garageFrame);

    const safeSignTex = AssetManager.createNeonSignTexture('BAYSIDE SAFEHOUSE', 'EXECUTIVE RESIDENCE', '#00ff88', '#ffffff');
    const safeSign = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 5),
      new THREE.MeshBasicMaterial({ map: safeSignTex, transparent: true })
    );
    safeSign.position.set(sx, 6.5, sz + 21.2);
    this.scene.add(safeSign);

    this.landmarks['safehouse'] = new THREE.Vector3(sx, 0.5, sz + 26);
  }

  createMarinaHarbor(half) {
    const hx = -half + 0 * this.blockSize + this.blockSize / 2;
    const hz = -half + 3 * this.blockSize + this.blockSize / 2;

    // Concrete Waterfront Pier Docks
    const dockGeo = new THREE.BoxGeometry(65, 2.4, 70);
    const dockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const dock = new THREE.Mesh(dockGeo, dockMat);
    dock.position.set(hx, 1.2, hz);
    dock.receiveShadow = true;
    dock.castShadow = true;
    this.scene.add(dock);
    this.colliders.push({ box: new THREE.Box3().setFromObject(dock), type: 'prop' });

    // Harbor Warehouse
    const whMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.4 });
    const warehouse = new THREE.Mesh(new THREE.BoxGeometry(36, 14, 45), whMat);
    warehouse.position.set(hx + 12, 8.2, hz);
    warehouse.castShadow = true;
    this.scene.add(warehouse);
    this.colliders.push({ box: new THREE.Box3().setFromObject(warehouse), type: 'building' });

    // Harbor Logistics Sign
    const whSignTex = AssetManager.createNeonSignTexture('HARBOR LOGISTICS 04', 'CARGO & DOCKYARD', '#00d4ff', '#ff8800');
    const whSign = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 6),
      new THREE.MeshBasicMaterial({ map: whSignTex, transparent: true })
    );
    whSign.position.set(hx + 12, 13, hz + 22.6);
    this.scene.add(whSign);

    // Shipping Containers Stacked
    const cColors = [0xdc2626, 0x2563eb, 0x16a34a, 0xd97706, 0x475569];
    for (let c = 0; c < 8; c++) {
      const cMat = new THREE.MeshStandardMaterial({ color: cColors[c % cColors.length], roughness: 0.5, metalness: 0.4 });
      const cMesh = new THREE.Mesh(new THREE.BoxGeometry(13, 4.8, 5), cMat);
      const row = Math.floor(c / 2);
      const col = c % 2;
      cMesh.position.set(hx - 15 + col * 7, 3.6 + (c >= 4 ? 4.8 : 0), hz - 15 + (row % 2) * 16);
      cMesh.castShadow = true;
      this.scene.add(cMesh);
      this.colliders.push({ box: new THREE.Box3().setFromObject(cMesh), type: 'prop' });
    }

    // Industrial Crane Boom
    const craneTower = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 32, 3.5),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 })
    );
    craneTower.position.set(hx - 24, 17, hz - 24);
    craneTower.castShadow = true;
    this.scene.add(craneTower);

    const craneArm = new THREE.Mesh(
      new THREE.BoxGeometry(26, 2.5, 2.5),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 })
    );
    craneArm.position.set(hx - 14, 32, hz - 24);
    this.scene.add(craneArm);

    this.landmarks['harbor'] = new THREE.Vector3(hx - 12, 0.5, hz + 22);
  }

  createGasStation(half) {
    const gx = -half + 2 * this.blockSize + this.blockSize / 2;
    const gz = -half + 0 * this.blockSize + this.blockSize / 2;

    // Fuel Station Canopy
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.3 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(32, 1.2, 22), canopyMat);
    canopy.position.set(gx, 6.5, gz);
    canopy.castShadow = true;
    this.scene.add(canopy);

    // 4 Canopy support pillars
    const pilMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5 });
    for (const px of [-10, 10]) {
      for (const pz of [-7, 7]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6.5, 12), pilMat);
        p.position.set(gx + px, 3.25, gz + pz);
        p.castShadow = true;
        this.scene.add(p);
        this.colliders.push({ box: new THREE.Box3().setFromObject(p), type: 'prop' });
      }
    }

    // Fuel Pump Islands
    for (const px of [-6, 6]) {
      const pump = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.4, 4),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 })
      );
      pump.position.set(gx + px, 1.2, gz);
      pump.castShadow = true;
      this.scene.add(pump);
      this.colliders.push({ box: new THREE.Box3().setFromObject(pump), type: 'prop' });
    }

    // Convenience Store Building behind pumps
    const store = new THREE.Mesh(
      new THREE.BoxGeometry(28, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    );
    store.position.set(gx, 3.0, gz - 18);
    store.castShadow = true;
    this.scene.add(store);
    this.colliders.push({ box: new THREE.Box3().setFromObject(store), type: 'building' });

    // Neon Gas Station Sign
    const gasSignTex = AssetManager.createNeonSignTexture('OCTANE FUEL & MART', '24HR DOWNTOWN', '#ff2200', '#ffea00');
    const gasSign = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 5),
      new THREE.MeshBasicMaterial({ map: gasSignTex, transparent: true })
    );
    gasSign.position.set(gx, 5.0, gz - 9.8);
    this.scene.add(gasSign);

    this.landmarks['gas_station'] = new THREE.Vector3(gx, 0.5, gz + 16);
  }
}
