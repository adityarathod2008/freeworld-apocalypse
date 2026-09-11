/**
 * Game FreeWorld - HumanMesh (Phase 6)
 * Articulated human 3D mesh foundation supporting realistic body proportions,
 * height/mass scaling, age variations, PBR skin materials, specular eye irises,
 * hair geometry, clothing palettes, and dynamic dirt & wetness parameters.
 */
import * as THREE from 'three';

export class HumanMesh {
  constructor(config = {}) {
    this.root = new THREE.Group();

    // Human Realism Parameters
    this.height = config.height !== undefined ? config.height : (0.9 + Math.random() * 0.25); // 0.9m to 1.15m height scale multiplier
    this.mass = config.mass !== undefined ? config.mass : (0.85 + Math.random() * 0.35); // 0.85 to 1.20 mass/width multiplier
    this.age = config.age !== undefined ? config.age : Math.floor(18 + Math.random() * 55); // Age 18 to 73
    this.physicalCondition = config.physicalCondition || (Math.random() < 0.3 ? 'athletic' : (Math.random() < 0.6 ? 'average' : 'heavy'));
    this.gender = config.gender || (Math.random() < 0.5 ? 'male' : 'female');

    // Environmental Parameters (0 to 100%)
    this.dirt = config.dirt !== undefined ? config.dirt : 0;
    this.wetness = config.wetness !== undefined ? config.wetness : 0;

    // Materials
    this.setupMaterials(config);

    // Build Rig
    this.buildRig();

    // Apply Proportions
    this.applyProportions();
  }

  setupMaterials(config) {
    const skinTones = [0xf5d0b0, 0xe0ac69, 0xc68642, 0x8d5524, 0x513829];
    const baseSkinColor = config.skinColor || skinTones[Math.floor(Math.random() * skinTones.length)];

    // Hair colors scale with age
    let hairColor = 0x221811; // Dark brown
    if (this.age > 55) hairColor = 0x999999; // Graying
    if (this.age > 65) hairColor = 0xdddddd; // White

    const shirtColors = [0x1e3a8a, 0x991b1b, 0x065f46, 0x7c2d12, 0x4c1d95, 0x111827, 0xf3f4f6];
    const pantsColors = [0x1e293b, 0x334155, 0x475569, 0x1e1b4b, 0x1c1917];

    const shirtColor = config.shirtColor || shirtColors[Math.floor(Math.random() * shirtColors.length)];
    const pantsColor = config.pantsColor || pantsColors[Math.floor(Math.random() * pantsColors.length)];

    this.skinMat = new THREE.MeshStandardMaterial({
      color: baseSkinColor,
      roughness: 0.6,
      metalness: 0.05
    });

    this.eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.1
    });

    this.irisMat = new THREE.MeshStandardMaterial({
      color: config.eyeColor || (Math.random() < 0.5 ? 0x2563eb : (Math.random() < 0.5 ? 0x15803d : 0x78350f)),
      roughness: 0.2,
      metalness: 0.3
    });

    this.hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.85
    });

    this.shirtMat = new THREE.MeshStandardMaterial({
      color: shirtColor,
      roughness: 0.65
    });

    this.pantsMat = new THREE.MeshStandardMaterial({
      color: pantsColor,
      roughness: 0.8
    });

    this.shoesMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.5
    });
  }

  buildRig() {
    // Pelvis / Hips Root
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.95;
    this.root.add(this.pelvis);

    // Torso & Spine
    const torsoWidth = this.physicalCondition === 'heavy' ? 0.54 : (this.physicalCondition === 'athletic' ? 0.50 : 0.46);
    const torsoGeo = new THREE.BoxGeometry(torsoWidth, 0.62, 0.28);
    this.torso = new THREE.Mesh(torsoGeo, this.shirtMat);
    this.torso.position.y = 0.35;
    this.torso.castShadow = true;
    this.pelvis.add(this.torso);

    // Chest & Breathing Group
    this.chest = new THREE.Group();
    this.chest.position.y = 0.1;
    this.torso.add(this.chest);

    // Head & Neck
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.48;
    this.torso.add(this.headGroup);

    const headGeo = new THREE.BoxGeometry(0.26, 0.28, 0.26);
    this.head = new THREE.Mesh(headGeo, this.skinMat);
    this.head.castShadow = true;
    this.headGroup.add(this.head);

    // Hair Mesh
    const hairGeo = new THREE.BoxGeometry(0.28, 0.1, 0.28);
    this.hair = new THREE.Mesh(hairGeo, this.hairMat);
    this.hair.position.y = 0.12;
    this.head.add(this.hair);

    // Eyes (Left & Right)
    this.eyesGroup = new THREE.Group();
    this.eyesGroup.position.set(0, 0.04, 0.13);
    this.head.add(this.eyesGroup);

    const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const irisGeo = new THREE.SphereGeometry(0.02, 8, 8);

    this.leftEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.leftEye.position.set(-0.065, 0, 0);
    const leftIris = new THREE.Mesh(irisGeo, this.irisMat);
    leftIris.position.set(0, 0, 0.02);
    this.leftEye.add(leftIris);
    this.eyesGroup.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.rightEye.position.set(0.065, 0, 0);
    const rightIris = new THREE.Mesh(irisGeo, this.irisMat);
    rightIris.position.set(0, 0, 0.02);
    this.rightEye.add(rightIris);
    this.eyesGroup.add(this.rightEye);

    // Eyelids for Blinking Morphing
    const eyelidGeo = new THREE.BoxGeometry(0.04, 0.025, 0.02);
    this.leftEyelid = new THREE.Mesh(eyelidGeo, this.skinMat);
    this.leftEyelid.position.set(-0.065, 0.025, 0.025);
    this.eyesGroup.add(this.leftEyelid);

    this.rightEyelid = new THREE.Mesh(eyelidGeo, this.skinMat);
    this.rightEyelid.position.set(0.065, 0.025, 0.025);
    this.eyesGroup.add(this.rightEyelid);

    // Mouth Mesh for Lip-Sync
    const mouthGeo = new THREE.BoxGeometry(0.1, 0.03, 0.02);
    this.mouth = new THREE.Mesh(mouthGeo, new THREE.MeshBasicMaterial({ color: 0x5c2c2c }));
    this.mouth.position.set(0, -0.08, 0.135);
    this.head.add(this.mouth);

    // Shoulders & Arms (Left & Right Pivots)
    const armWidth = 0.15 * (this.physicalCondition === 'athletic' ? 1.15 : 1.0);
    const armGeo = new THREE.BoxGeometry(armWidth, 0.58, armWidth);

    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.32, 0.24, 0);
    this.torso.add(this.leftArmPivot);
    this.leftArmMesh = new THREE.Mesh(armGeo, this.shirtMat);
    this.leftArmMesh.position.y = -0.25;
    this.leftArmMesh.castShadow = true;
    this.leftArmPivot.add(this.leftArmMesh);

    // Left Hand Socket
    const handGeo = new THREE.BoxGeometry(0.1, 0.12, 0.1);
    this.leftHand = new THREE.Mesh(handGeo, this.skinMat);
    this.leftHand.position.y = -0.52;
    this.leftArmPivot.add(this.leftHand);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.32, 0.24, 0);
    this.torso.add(this.rightArmPivot);
    this.rightArmMesh = new THREE.Mesh(armGeo, this.shirtMat);
    this.rightArmMesh.position.y = -0.25;
    this.rightArmMesh.castShadow = true;
    this.rightArmPivot.add(this.rightArmMesh);

    // Right Hand Socket
    this.rightHand = new THREE.Mesh(handGeo, this.skinMat);
    this.rightHand.position.y = -0.52;
    this.rightArmPivot.add(this.rightHand);

    // Legs (Left & Right Pivots)
    const legWidth = 0.18 * (this.physicalCondition === 'heavy' ? 1.2 : 1.0);
    const legGeo = new THREE.BoxGeometry(legWidth, 0.64, legWidth);

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.14, 0, 0);
    this.pelvis.add(this.leftLegPivot);
    this.leftLegMesh = new THREE.Mesh(legGeo, this.pantsMat);
    this.leftLegMesh.position.y = -0.32;
    this.leftLegMesh.castShadow = true;
    this.leftLegPivot.add(this.leftLegMesh);

    // Left Foot Socket
    const footGeo = new THREE.BoxGeometry(0.16, 0.12, 0.28);
    this.leftFoot = new THREE.Mesh(footGeo, this.shoesMat);
    this.leftFoot.position.set(0, -0.62, 0.05);
    this.leftLegPivot.add(this.leftFoot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.14, 0, 0);
    this.pelvis.add(this.rightLegPivot);
    this.rightLegMesh = new THREE.Mesh(legGeo, this.pantsMat);
    this.rightLegMesh.position.y = -0.32;
    this.rightLegMesh.castShadow = true;
    this.rightLegPivot.add(this.rightLegMesh);

    // Right Foot Socket
    this.rightFoot = new THREE.Mesh(footGeo, this.shoesMat);
    this.rightFoot.position.set(0, -0.62, 0.05);
    this.rightLegPivot.add(this.rightFoot);
  }

  applyProportions() {
    this.root.scale.set(this.mass, this.height, this.mass);
  }

  setEnvironmentalConditions(dirtPct, wetnessPct) {
    this.dirt = Math.max(0, Math.min(100, dirtPct));
    this.wetness = Math.max(0, Math.min(100, wetnessPct));

    const wetFactor = this.wetness / 100;
    const dirtFactor = this.dirt / 100;

    // Wetness increases specular sheen (reduces roughness)
    this.skinMat.roughness = THREE.MathUtils.lerp(0.6, 0.25, wetFactor);
    this.shirtMat.roughness = THREE.MathUtils.lerp(0.65, 0.35, wetFactor);
    this.pantsMat.roughness = THREE.MathUtils.lerp(0.8, 0.45, wetFactor);

    // Dirt darkens base color slightly
    if (dirtFactor > 0) {
      this.skinMat.color.offsetHSL(0, 0, -dirtFactor * 0.15);
    }
  }
}
