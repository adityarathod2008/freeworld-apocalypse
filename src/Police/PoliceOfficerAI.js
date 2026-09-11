/**
 * Game FreeWorld - PoliceOfficerAI (Phase 5)
 * Physical 3D Police Officer entity that physically exits police cruisers,
 * approaches suspects on foot, draws weapons, yells verbal commands, and executes live arrests or tactical combat.
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class PoliceOfficerAI {
  constructor(scene, initialPos) {
    this.scene = scene;
    this.position = initialPos ? initialPos.clone() : new THREE.Vector3();
    this.position.y = 0.45;

    this.state = 'APPROACHING'; // 'APPROACHING' | 'COMMANDING' | 'HANDCUFFING' | 'PURSUING' | 'FIRING' | 'DEAD'
    this.stateTimer = 0;
    this.shootTimer = 0;
    this.commandTimer = 0;
    this.health = 120;
    this.isDead = false;

    this.buildMesh();
    this.scene.add(this.root);
  }

  buildMesh() {
    this.root = new THREE.Group();
    this.root.position.copy(this.position);

    // Materials: Police Uniform Palette
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.7 });
    const uniformShirtMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }); // Dark blue police shirt
    const uniformPantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }); // Black/dark navy pants
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 }); // Gold Police Badge

    // Torso & Badge
    const torsoGeo = new THREE.BoxGeometry(0.48, 0.6, 0.28);
    this.torso = new THREE.Mesh(torsoGeo, uniformShirtMat);
    this.torso.position.y = 0.9;
    this.torso.castShadow = true;
    this.root.add(this.torso);

    const badgeGeo = new THREE.BoxGeometry(0.08, 0.09, 0.02);
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(-0.14, 0.12, 0.15);
    this.torso.add(badge);

    // Head & Police Cap
    const headGeo = new THREE.BoxGeometry(0.26, 0.28, 0.26);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 0.46;
    this.torso.add(this.head);

    const capGeo = new THREE.BoxGeometry(0.3, 0.1, 0.32);
    const cap = new THREE.Mesh(capGeo, uniformPantsMat);
    cap.position.y = 0.16;
    this.head.add(cap);

    // Arms & Weapon Mesh
    const armGeo = new THREE.BoxGeometry(0.15, 0.55, 0.15);
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.3, 0.22, 0);
    const lMesh = new THREE.Mesh(armGeo, uniformShirtMat);
    lMesh.position.y = -0.25;
    this.leftArm.add(lMesh);
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.3, 0.22, 0);
    const rMesh = new THREE.Mesh(armGeo, uniformShirtMat);
    rMesh.position.y = -0.25;
    this.rightArm.add(rMesh);
    this.torso.add(this.rightArm);

    // Service Pistol
    const gunGeo = new THREE.BoxGeometry(0.06, 0.12, 0.22);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.3 });
    this.weaponMesh = new THREE.Mesh(gunGeo, gunMat);
    this.weaponMesh.position.set(0, -0.4, 0.12);
    this.weaponMesh.rotation.x = Math.PI / 2;
    this.rightArm.add(this.weaponMesh);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.62, 0.18);
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14, 0, 0);
    const llMesh = new THREE.Mesh(legGeo, uniformPantsMat);
    llMesh.position.y = -0.31;
    this.leftLeg.add(llMesh);
    this.root.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14, 0, 0);
    const rlMesh = new THREE.Mesh(legGeo, uniformPantsMat);
    rlMesh.position.y = -0.31;
    this.rightLeg.add(rlMesh);
    this.root.add(this.rightLeg);

    this.animTime = 0;
  }

  exitCruiser(cruiserPos, headingAngle) {
    // Offset 1.8m to left or right of cruiser
    const sideOffset = new THREE.Vector3(-1.8, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), headingAngle);
    this.position.copy(cruiserPos).add(sideOffset);
    this.position.y = 0.45;
    this.root.position.copy(this.position);
    this.root.rotation.y = headingAngle;
    this.state = 'APPROACHING';

    events.emit('SHOW_SUBTITLE', {
      speaker: 'POLICE OFFICER',
      text: '"Step out of the vehicle! Hands where I can see them!"'
    });
  }

  update(delta, playerPos, isPlayerStopped, isPlayerSurrendering, wantedLevel) {
    if (this.isDead || !playerPos) return;

    const dist = this.position.distanceTo(playerPos);
    this.commandTimer += delta;

    // Face player
    const dir = new THREE.Vector3().subVectors(playerPos, this.position);
    dir.y = 0;
    const targetAngle = Math.atan2(-dir.x, -dir.z);
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, targetAngle, delta * 8.0);

    // State Evaluation
    if (wantedLevel >= 3 || (!isPlayerStopped && dist > 15)) {
      this.state = 'FIRING';
    } else if (dist <= 4.0 && (isPlayerStopped || isPlayerSurrendering)) {
      this.state = 'COMMANDING';
    } else if (dist > 2.2 && dist < 35) {
      this.state = 'APPROACHING';
    } else {
      this.state = 'PURSUING';
    }

    // Command Subtitles
    if (this.commandTimer > 4.0 && dist < 20) {
      this.commandTimer = 0;
      const lines = [
        '"Police! Freeze where you are!"',
        '"Hands in the air! Do not move!"',
        '"Get down on the ground now!"'
      ];
      const line = lines[Math.floor(Math.random() * lines.length)];
      events.emit('SHOW_SUBTITLE', { speaker: 'POLICE OFFICER', text: line });
    }

    // Execution
    if (this.state === 'APPROACHING' || this.state === 'PURSUING') {
      const moveSpeed = this.state === 'PURSUING' ? 5.2 : 2.8;
      dir.normalize();
      this.position.addScaledVector(dir, moveSpeed * delta);
      this.root.position.copy(this.position);

      // Walking/running leg swing animation
      this.animTime += delta * 6;
      const swing = Math.sin(this.animTime * 4);
      this.leftLeg.rotation.x = swing * 0.5;
      this.rightLeg.rotation.x = -swing * 0.5;

      // Arm aiming weapon forward
      this.rightArm.rotation.x = -Math.PI / 2 + 0.2;
    } else if (this.state === 'COMMANDING') {
      // Stopped facing suspect, gun raised
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.rightArm.rotation.x = -Math.PI / 2;

      if (isPlayerSurrendering || (isPlayerStopped && dist < 2.0)) {
        events.emit('POLICE_PHYSICAL_ARREST_INITIATED', { officer: this, dist });
      }
    } else if (this.state === 'FIRING') {
      this.rightArm.rotation.x = -Math.PI / 2;
      this.shootTimer += delta;
      if (this.shootTimer >= 1.2) {
        this.shootTimer = 0;
        events.emit('POLICE_FIRED', { origin: this.position.clone() });
        if (Math.random() < 0.35) {
          events.emit('PLAYER_TAKE_DAMAGE', 18);
        }
      }
    }
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
      this.state = 'DEAD';
      this.root.rotation.x = -Math.PI / 2;
      this.root.position.y = 0.2;
      events.emit('CRIME_COMMITTED', { type: 'OFFICER_DOWN', severity: 4, position: this.position.clone() });
    }
  }

  destroy() {
    this.scene.remove(this.root);
  }
}
