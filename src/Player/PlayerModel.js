/**
 * Game FreeWorld - PlayerModel
 * Stylized articulated 3D protagonist character mesh with procedural skeletal animation blending
 */
import * as THREE from 'three';

export class PlayerModel {
  constructor() {
    this.root = new THREE.Group();

    // High-grade stylized materials
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.55 });
    this.jacketMat = new THREE.MeshStandardMaterial({ color: 0x1e2638, roughness: 0.45, metalness: 0.2 });
    this.shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    this.pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65 });
    this.shoesMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 }); // Stylish boots
    this.gearMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.6 });
    this.glassesMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9, roughness: 0.1 });

    this.buildRig();
    this.animTime = 0;
  }

  buildRig() {
    // Pelvis / Hips
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.0;
    this.root.add(this.pelvis);

    // Belt
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.1, 0.34), this.gearMat);
    belt.position.y = 0.05;
    this.pelvis.add(belt);

    // Torso (Jacket + Shirt)
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.68, 0.34), this.jacketMat);
    this.torso.position.y = 0.4;
    this.torso.castShadow = true;
    this.pelvis.add(this.torso);

    // Shirt insert
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.5, 0.04), this.shirtMat);
    shirt.position.set(0, 0.08, 0.16);
    this.torso.add(shirt);

    // Shoulder Straps / Holster
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.36), this.gearMat);
    strapL.position.set(-0.16, 0.02, 0);
    this.torso.add(strapL);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.32), this.skinMat);
    this.head.position.y = 0.54;
    this.head.castShadow = true;
    this.torso.add(this.head);

    // Hair / Undercut
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.14, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.8 })
    );
    hair.position.y = 0.14;
    this.head.add(hair);

    // Aviator sunglasses
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.06), this.glassesMat);
    glasses.position.set(0, 0.04, 0.17);
    this.head.add(glasses);

    // Left Arm Pivot
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.36, 0.28, 0);
    this.torso.add(this.leftArmPivot);

    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.18), this.jacketMat);
    leftArmMesh.position.y = -0.3;
    leftArmMesh.castShadow = true;
    this.leftArmPivot.add(leftArmMesh);

    // Right Arm Pivot (holds weapons)
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.36, 0.28, 0);
    this.torso.add(this.rightArmPivot);

    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.18), this.jacketMat);
    rightArmMesh.position.y = -0.3;
    rightArmMesh.castShadow = true;
    this.rightArmPivot.add(rightArmMesh);

    // Weapon Socket at Right Hand
    this.weaponSocket = new THREE.Group();
    this.weaponSocket.position.set(0, -0.58, 0.18);
    this.rightArmPivot.add(this.weaponSocket);

    // Left Leg
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.16, 0, 0);
    this.pelvis.add(this.leftLegPivot);

    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), this.pantsMat);
    leftLegMesh.position.y = -0.35;
    leftLegMesh.castShadow = true;
    this.leftLegPivot.add(leftLegMesh);

    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.32), this.shoesMat);
    leftShoe.position.set(0, -0.7, 0.06);
    this.leftLegPivot.add(leftShoe);

    // Right Leg
    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.16, 0, 0);
    this.pelvis.add(this.rightLegPivot);

    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), this.pantsMat);
    rightLegMesh.position.y = -0.35;
    rightLegMesh.castShadow = true;
    this.rightLegPivot.add(rightLegMesh);

    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.32), this.shoesMat);
    rightShoe.position.set(0, -0.7, 0.06);
    this.rightLegPivot.add(rightShoe);
  }

  animate(state, speed, delta, isAiming) {
    this.animTime += delta * (speed > 0.1 ? speed * 1.8 : 2);

    if (state === 'IN_VEHICLE') {
      this.pelvis.position.y = 0.52;
      this.leftLegPivot.rotation.x = -Math.PI / 2.6;
      this.rightLegPivot.rotation.x = -Math.PI / 2.6;
      this.leftArmPivot.rotation.x = -Math.PI / 4;
      this.rightArmPivot.rotation.x = -Math.PI / 4;
      this.leftArmPivot.rotation.z = 0.2;
      this.rightArmPivot.rotation.z = -0.2;
      return;
    }

    if (state === 'CROUCH') {
      this.pelvis.position.y = 0.65;
    } else {
      this.pelvis.position.y = 1.0;
    }

    if (speed > 0.1) {
      const swing = Math.sin(this.animTime * 1.8);
      this.leftLegPivot.rotation.x = swing * 0.75;
      this.rightLegPivot.rotation.x = -swing * 0.75;

      if (!isAiming) {
        this.leftArmPivot.rotation.x = -swing * 0.7;
        this.rightArmPivot.rotation.x = swing * 0.7;
      }
      this.torso.rotation.y = swing * 0.08;
    } else {
      const breath = Math.sin(this.animTime * 0.5) * 0.03;
      this.torso.position.y = 0.4 + breath;
      this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0, 0.1);
      this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, 0.1);

      if (!isAiming) {
        this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, 0, 0.1);
        this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0, 0.1);
      }
      this.torso.rotation.y = 0;
    }

    // Aiming pose overrides right arm and looks down camera vector
    if (isAiming) {
      this.rightArmPivot.rotation.x = -Math.PI / 2;
      this.rightArmPivot.rotation.z = 0.1;
      this.leftArmPivot.rotation.x = -Math.PI / 2.2;
      this.leftArmPivot.rotation.z = 0.4;
    }
  }
}
