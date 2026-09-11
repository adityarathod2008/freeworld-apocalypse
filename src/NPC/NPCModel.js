/**
 * Game FreeWorld - NPCModel
 * Procedural civilian character mesh with random outfit palettes and walking animation
 */
import * as THREE from 'three';

export class NPCModel {
  constructor() {
    this.root = new THREE.Group();

    // Random civilian colors
    const skinColors = [0xf5d0b0, 0xd4a373, 0xa3704c, 0x664429];
    const shirtColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0xf8fafc];
    const pantsColors = [0x1e293b, 0x334155, 0x475569, 0x1e1b4b, 0x1c1917];

    const skin = skinColors[Math.floor(Math.random() * skinColors.length)];
    const shirt = shirtColors[Math.floor(Math.random() * shirtColors.length)];
    const pants = pantsColors[Math.floor(Math.random() * pantsColors.length)];

    this.skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.7 });
    this.shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.6 });
    this.pantsMat = new THREE.MeshStandardMaterial({ color: pants, roughness: 0.8 });

    this.buildMesh();
    this.animTime = Math.random() * 10;
  }

  buildMesh() {
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.9;
    this.root.add(this.pelvis);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.48, 0.6, 0.28);
    this.torso = new THREE.Mesh(torsoGeo, this.shirtMat);
    this.torso.position.y = 0.3;
    this.torso.castShadow = true;
    this.pelvis.add(this.torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.26, 0.28, 0.26);
    this.head = new THREE.Mesh(headGeo, this.skinMat);
    this.head.position.y = 0.46;
    this.head.castShadow = true;
    this.torso.add(this.head);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.15, 0.55, 0.15);
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.3, 0.22, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, this.shirtMat);
    leftArmMesh.position.y = -0.25;
    this.leftArm.add(leftArmMesh);
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.3, 0.22, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, this.shirtMat);
    rightArmMesh.position.y = -0.25;
    this.rightArm.add(rightArmMesh);
    this.torso.add(this.rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.62, 0.18);
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14, 0, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, this.pantsMat);
    leftLegMesh.position.y = -0.31;
    this.leftLeg.add(leftLegMesh);
    this.pelvis.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14, 0, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, this.pantsMat);
    rightLegMesh.position.y = -0.31;
    this.rightLeg.add(rightLegMesh);
    this.pelvis.add(this.rightLeg);
  }

  animate(isMoving, isFleeing, delta) {
    if (!isMoving) {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      return;
    }

    const speedMult = isFleeing ? 3.2 : 1.6;
    this.animTime += delta * speedMult;
    const swing = Math.sin(this.animTime * 4);

    this.leftLeg.rotation.x = swing * 0.6;
    this.rightLeg.rotation.x = -swing * 0.6;
    this.leftArm.rotation.x = -swing * 0.6;
    this.rightArm.rotation.x = swing * 0.6;

    if (isFleeing) {
      // Arms raised in panic
      this.leftArm.rotation.z = 0.5;
      this.rightArm.rotation.z = -0.5;
    } else {
      this.leftArm.rotation.z = 0;
      this.rightArm.rotation.z = 0;
    }
  }
}
