/**
 * Game FreeWorld - PlayerController
 * Locomotion, stamina, health, jumping, vehicle entry/exit, and universal interaction
 */
import * as THREE from 'three';
import { PlayerModel } from './PlayerModel.js';
import { events } from '../Core/EventBus.js';
import { collision, COLLISION_LAYERS } from '../Core/CollisionSystem.js';

export class PlayerController {
  constructor(scene, inputManager, cameraController) {
    this.scene = scene;
    this.input = inputManager;
    this.camCtrl = cameraController;

    this.position = new THREE.Vector3(0, 0.5, 20); // Initial spawn at City Plaza
    this.velocity = new THREE.Vector3();
    this.rotationY = 0;
    this.isPlayer = true;

    this.health = 100;
    this.maxHealth = 100;
    this.armor = 50;
    this.maxArmor = 100;
    this.stamina = 100;
    this.maxStamina = 100;

    this.state = 'IDLE'; // 'IDLE' | 'WALK' | 'RUN' | 'SPRINT' | 'CROUCH' | 'JUMP' | 'IN_VEHICLE'
    this.isGrounded = true;
    this.isGodMode = false;
    this.currentVehicle = null;

    this.walkSpeed = 4.8;
    this.runSpeed = 8.5;
    this.sprintSpeed = 12.0;
    this.crouchSpeed = 2.4;

    this.model = new PlayerModel();
    this.model.root.position.copy(this.position);
    this.scene.add(this.model.root);

    this.colliderRadius = 0.45;
    this.nearbyInteractable = null;

    // Movement Debug Visualization
    this.debugEnabled = true;
    this.camArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(), 2.2, 0x0088ff);
    this.playerArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1.8, 0x00ff44);
    this.moveArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 2.0, 0xff2222);
    this.camArrow.visible = false;
    this.playerArrow.visible = false;
    this.moveArrow.visible = false;
    this.scene.add(this.camArrow);
    this.scene.add(this.playerArrow);
    this.scene.add(this.moveArrow);

    this.debugBox = document.getElementById('movement-debug-box');
    if (!this.debugBox) {
      this.debugBox = document.createElement('div');
      this.debugBox.id = 'movement-debug-box';
      this.debugBox.style.cssText = 'position:absolute; top:32px; left:12px; background:rgba(10,16,28,0.85); border:1px solid #00f0ff; border-radius:6px; padding:6px 10px; font-family:monospace; font-size:11px; color:#fff; z-index:100; pointer-events:none; line-height:1.4; box-shadow:0 4px 12px rgba(0,0,0,0.6);';
      document.body.appendChild(this.debugBox);
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('DEBUG_GOD_MODE', () => {
      this.isGodMode = !this.isGodMode;
      events.emit('HUD_NOTIFICATION', {
        title: 'GOD MODE',
        message: this.isGodMode ? 'Enabled' : 'Disabled'
      });
    });

    events.on('TELEPORT_PLAYER', (targetPos) => {
      this.teleport(targetPos);
    });
  }

  teleport(pos) {
    if (this.currentVehicle) {
      this.exitVehicle();
    }
    this.position.set(pos.x, pos.y || 0.5, pos.z);
    this.velocity.set(0, 0, 0);
    this.model.root.position.copy(this.position);
  }

  enterVehicle(vehicle) {
    if (!vehicle) return;

    // Check if vehicle has a civilian driver (Carjacking)
    if (vehicle.driver && vehicle.driver !== this) {
      const victim = vehicle.driver;
      vehicle.driver = null;

      // Eject victim onto pavement beside driver door
      const ejectOffset = new THREE.Vector3(-2.2, 0.45, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicle.mesh.rotation.y);
      if (victim.position) {
        victim.position.copy(vehicle.mesh.position).add(ejectOffset);
      }
      if (victim.ai) {
        victim.ai.state = 'FLEEING';
      }

      events.emit('CRIME_COMMITTED', {
        type: 'CARJACKING',
        severity: 2,
        position: vehicle.mesh.position.clone()
      });
      events.emit('HUD_NOTIFICATION', {
        title: 'GRAND THEFT AUTO',
        message: `Carjacked ${vehicle.displayName || 'Vehicle'}!`
      });
    }

    this.currentVehicle = vehicle;
    this.state = 'IN_VEHICLE';
    vehicle.driver = this;
    this.model.root.visible = false;
    this.camCtrl.setMode('VEHICLE');
    this.camCtrl.setVehicleTarget(vehicle);

    if (this.camArrow) this.camArrow.visible = false;
    if (this.playerArrow) this.playerArrow.visible = false;
    if (this.moveArrow) this.moveArrow.visible = false;
    if (this.debugBox) this.debugBox.style.display = 'none';

    events.emit('PLAYER_ENTERED_VEHICLE', vehicle);
  }

  exitVehicle() {
    if (!this.currentVehicle) return;
    const vehicle = this.currentVehicle;
    vehicle.driver = null;

    const speedKmh = Math.abs(vehicle.speed) * 3.6;
    const isHighSpeedBailout = speedKmh > 28;

    // Place player beside driver door
    const exitOffset = new THREE.Vector3(-2.2, 0.5, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicle.mesh.rotation.y);
    this.position.copy(vehicle.mesh.position).add(exitOffset);
    this.position.y = 0.5;

    if (isHighSpeedBailout) {
      // High-speed bail-out eject with tumble & fall damage
      this.velocity.set(exitOffset.x * 2.5, 4.0, exitOffset.z * 2.5);
      this.isGrounded = false;
      this.state = 'JUMP';
      const damage = Math.min(50, Math.round(speedKmh * 0.7));
      this.takeDamage(damage);
      events.emit('HUD_NOTIFICATION', {
        title: 'BAIL OUT',
        message: `Ejected at ${Math.round(speedKmh)} KM/H!`
      });
    } else {
      this.velocity.set(0, 0, 0);
      this.state = 'IDLE';
    }

    this.currentVehicle = null;
    this.model.root.visible = true;
    this.camCtrl.setMode('ON_FOOT');
    this.camCtrl.setVehicleTarget(null);

    if (this.debugBox && this.debugEnabled) this.debugBox.style.display = 'block';

    events.emit('PLAYER_EXITED_VEHICLE');
  }

  takeDamage(amount) {
    if (this.isGodMode) return;

    if (this.armor > 0) {
      const armorAbsorb = Math.min(this.armor, amount * 0.7);
      this.armor -= armorAbsorb;
      amount -= armorAbsorb;
    }
    this.health = Math.max(0, this.health - amount);
    events.emit('PLAYER_STATS_CHANGED', {
      health: this.health,
      maxHealth: this.maxHealth,
      armor: this.armor,
      maxArmor: this.maxArmor,
      stamina: this.stamina,
      maxStamina: this.maxStamina
    });

    if (this.health <= 0) {
      this.handleDeath();
    }
  }

  handleDeath() {
    events.emit('HUD_NOTIFICATION', {
      title: 'WASTED',
      message: 'Reviving at Bay City Central Hospital...'
    });
    setTimeout(() => {
      this.health = 100;
      this.armor = 50;
      this.teleport(new THREE.Vector3(0, 0.5, 20));
      events.emit('PLAYER_STATS_CHANGED', {
        health: this.health,
        maxHealth: this.maxHealth,
        armor: this.armor,
        maxArmor: this.maxArmor,
        stamina: this.stamina,
        maxStamina: this.maxStamina
      });
    }, 2500);
  }

  update(delta, colliders = [], vehicles = [], triggers = []) {
    // 1. In Vehicle Mode
    if (this.state === 'IN_VEHICLE' && this.currentVehicle) {
      this.position.copy(this.currentVehicle.mesh.position);
      if (this.input.isKeyPressed('KeyE') || this.input.isKeyPressed('KeyF')) {
        this.exitVehicle();
      }
      return;
    }

    // 2. Universal Interaction Check (Enter nearest vehicle or activate shop)
    this.checkInteractions(vehicles, triggers);

    if (this.nearbyInteractable && (this.input.isKeyPressed('KeyE') || this.input.isKeyPressed('KeyF'))) {
      if (this.nearbyInteractable.type === 'vehicle') {
        this.enterVehicle(this.nearbyInteractable.target);
        return;
      } else if (this.nearbyInteractable.type === 'shop' || this.nearbyInteractable.type === 'safehouse' || this.nearbyInteractable.type === 'atm') {
        events.emit('TRIGGER_ACTIVATED', this.nearbyInteractable);
        return;
      }
    }

    // Toggle Movement Debug with F3
    if (this.input.isKeyPressed('F3')) {
      this.debugEnabled = !this.debugEnabled;
      if (!this.debugEnabled) {
        if (this.camArrow) this.camArrow.visible = false;
        if (this.playerArrow) this.playerArrow.visible = false;
        if (this.moveArrow) this.moveArrow.visible = false;
        if (this.debugBox) this.debugBox.style.display = 'none';
      } else {
        if (this.debugBox) this.debugBox.style.display = 'block';
      }
    }

    // 3. Movement Direction from WASD + Authoritative Camera Facing Direction
    let inputForward = 0;
    let inputRight = 0;
    if (this.input.isKeyDown('KeyW') || this.input.isKeyDown('ArrowUp')) inputForward += 1;
    if (this.input.isKeyDown('KeyS') || this.input.isKeyDown('ArrowDown')) inputForward -= 1;
    if (this.input.isKeyDown('KeyD') || this.input.isKeyDown('ArrowRight')) inputRight += 1;
    if (this.input.isKeyDown('KeyA') || this.input.isKeyDown('ArrowLeft')) inputRight -= 1;

    const isMoving = inputForward !== 0 || inputRight !== 0;
    const isAiming = this.input.isAiming();
    const isCrouching = this.input.isKeyDown('KeyC');
    const isSprinting = this.input.isKeyDown('ShiftLeft') && isMoving && !isCrouching && this.stamina > 5;

    // Determine target speed
    let targetSpeed = this.runSpeed;
    if (isCrouching) {
      targetSpeed = this.crouchSpeed;
      this.state = 'CROUCH';
    } else if (isSprinting) {
      targetSpeed = this.sprintSpeed;
      this.state = 'SPRINT';
      this.stamina = Math.max(0, this.stamina - delta * 20);
    } else if (isMoving) {
      targetSpeed = this.walkSpeed;
      this.state = 'WALK';
    } else {
      targetSpeed = 0;
      this.state = 'IDLE';
    }

    // Regenerate stamina
    if (!isSprinting && this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + delta * 15);
    }

    // Authoritative Camera Forward & Right Vectors
    const camForward = new THREE.Vector3();
    this.camCtrl.camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();

    // Standard Three.js right-handed coordinate system: forward x (0, 1, 0) = right
    const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDir = new THREE.Vector3();
    if (isMoving) {
      moveDir.addScaledVector(camForward, inputForward);
      moveDir.addScaledVector(camRight, inputRight);
      moveDir.normalize(); // Normalized diagonal movement

      // Face movement direction, or face aim direction if aiming
      if (isAiming) {
        const targetAimAngle = Math.atan2(camForward.x, camForward.z);
        let diff = (targetAimAngle - this.rotationY) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;
        this.rotationY += diff * Math.min(1.0, delta * 18);
      } else {
        const targetRotY = Math.atan2(moveDir.x, moveDir.z);
        let diff = (targetRotY - this.rotationY) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;
        this.rotationY += diff * Math.min(1.0, delta * 14);
      }
    } else if (isAiming) {
      const targetAimAngle = Math.atan2(camForward.x, camForward.z);
      let diff = (targetAimAngle - this.rotationY) % (Math.PI * 2);
      if (diff < -Math.PI) diff += Math.PI * 2;
      if (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * Math.min(1.0, delta * 18);
    }

    // Jump & Gravity Physics
    if (this.isGrounded && this.input.isKeyPressed('Space')) {
      this.velocity.y = 8.2;
      this.isGrounded = false;
      this.state = 'JUMP';
    }

    if (!this.isGrounded) {
      this.velocity.y -= 22 * delta; // Gravity
    }

    // Horizontal velocity interpolation
    const targetVelX = moveDir.x * targetSpeed;
    const targetVelZ = moveDir.z * targetSpeed;
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, delta * 14);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, delta * 14);

    // Apply movement with collision resolution
    this.moveWithCollision(delta, colliders);

    // Update Model Visuals
    this.model.root.position.copy(this.position);
    this.model.root.rotation.y = this.rotationY;
    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    this.model.animate(this.state, currentSpeed, delta, isAiming);

    // Live Movement Debug Visualization & Telemetry
    if (this.debugEnabled && this.debugBox) {
      this.camArrow.visible = true;
      this.camArrow.position.copy(this.position).add(new THREE.Vector3(0, 0.2, 0));
      this.camArrow.setDirection(camForward);

      const playerFwd = new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY));
      this.playerArrow.visible = true;
      this.playerArrow.position.copy(this.position).add(new THREE.Vector3(0, 0.3, 0));
      this.playerArrow.setDirection(playerFwd);

      if (isMoving) {
        this.moveArrow.visible = true;
        this.moveArrow.position.copy(this.position).add(new THREE.Vector3(0, 0.4, 0));
        this.moveArrow.setDirection(moveDir);
      } else {
        this.moveArrow.visible = false;
      }

      const degPlayer = Math.round(((this.rotationY * 180) / Math.PI) % 360);
      const camYaw = this.camCtrl.getYaw();
      const degCam = Math.round(((camYaw * 180) / Math.PI) % 360);

      const wState = (this.input.isKeyDown('KeyW') || this.input.isKeyDown('ArrowUp')) ? 'ON' : 'OFF';
      const sState = (this.input.isKeyDown('KeyS') || this.input.isKeyDown('ArrowDown')) ? 'ON' : 'OFF';
      const aState = (this.input.isKeyDown('KeyA') || this.input.isKeyDown('ArrowLeft')) ? 'ON' : 'OFF';
      const dState = (this.input.isKeyDown('KeyD') || this.input.isKeyDown('ArrowRight')) ? 'ON' : 'OFF';

      this.debugBox.innerHTML = `
        <div style="color:#00f0ff; font-weight:700; margin-bottom:2px;">[MOVEMENT DEBUG]</div>
        <div>Input: W:<span style="color:${wState === 'ON' ? '#00ff66' : '#888'}">${wState}</span> S:<span style="color:${sState === 'ON' ? '#00ff66' : '#888'}">${sState}</span> A:<span style="color:${aState === 'ON' ? '#00ff66' : '#888'}">${aState}</span> D:<span style="color:${dState === 'ON' ? '#00ff66' : '#888'}">${dState}</span></div>
        <div>Cam Fwd: [${camForward.x.toFixed(2)}, ${camForward.z.toFixed(2)}] <span style="color:#00aaff;">(BLUE)</span></div>
        <div>Player Fwd: [${playerFwd.x.toFixed(2)}, ${playerFwd.z.toFixed(2)}] <span style="color:#00ff44;">(GREEN)</span></div>
        <div>Move Dir: [${moveDir.x.toFixed(2)}, ${moveDir.z.toFixed(2)}] <span style="color:#ff4444;">(RED)</span></div>
        <div>Rot: Player ${degPlayer}° | Cam ${degCam}°</div>
      `;
    }

    // Emit stats for UI bars
    events.emit('PLAYER_STATS_CHANGED', {
      health: this.health,
      maxHealth: this.maxHealth,
      armor: this.armor,
      maxArmor: this.maxArmor,
      stamina: this.stamina,
      maxStamina: this.maxStamina
    });
  }

  moveWithCollision(delta, colliders) {
    const nextPos = this.position.clone();
    nextPos.x += this.velocity.x * delta;
    nextPos.y += this.velocity.y * delta;
    nextPos.z += this.velocity.z * delta;

    // Ground plane check
    if (nextPos.y <= 0.5) {
      nextPos.y = 0.5;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Building / Prop box collisions via spatial hash grid
    const playerBox = new THREE.Box3(
      new THREE.Vector3(nextPos.x - this.colliderRadius, nextPos.y, nextPos.z - this.colliderRadius),
      new THREE.Vector3(nextPos.x + this.colliderRadius, nextPos.y + 1.8, nextPos.z + this.colliderRadius)
    );

    const hitColliders = collision.queryBox(playerBox, COLLISION_LAYERS.BUILDING | COLLISION_LAYERS.WORLD);
    for (const col of hitColliders) {
      // Simple slide collision: revert horizontal components that collide
      const testX = this.position.clone();
      testX.x += this.velocity.x * delta;
      const boxX = new THREE.Box3(
        new THREE.Vector3(testX.x - this.colliderRadius, testX.y, testX.z - this.colliderRadius),
        new THREE.Vector3(testX.x + this.colliderRadius, testX.y + 1.8, testX.z + this.colliderRadius)
      );
      if (boxX.intersectsBox(col.box)) {
        nextPos.x = this.position.x;
        this.velocity.x = 0;
      }

      const testZ = this.position.clone();
      testZ.z += this.velocity.z * delta;
      const boxZ = new THREE.Box3(
        new THREE.Vector3(testZ.x - this.colliderRadius, testZ.y, testZ.z - this.colliderRadius),
        new THREE.Vector3(testZ.x + this.colliderRadius, testZ.y + 1.8, testZ.z + this.colliderRadius)
      );
      if (boxZ.intersectsBox(col.box)) {
        nextPos.z = this.position.z;
        this.velocity.z = 0;
      }
    }

    this.position.copy(nextPos);
  }

  checkInteractions(vehicles, triggers) {
    this.nearbyInteractable = null;

    // 1. Check nearby vehicles
    let closestDist = 6.0;
    for (const car of vehicles) {
      const dist = this.position.distanceTo(car.mesh.position);
      if (dist < closestDist) {
        closestDist = dist;
        this.nearbyInteractable = {
          type: 'vehicle',
          target: car,
          actionText: `Enter ${car.displayName || 'Vehicle'}`
        };
      }
    }

    // 2. Check nearby triggers (shops, safehouse, ATM)
    if (!this.nearbyInteractable) {
      for (const trg of triggers) {
        const dist = this.position.distanceTo(trg.position);
        if (dist < trg.radius) {
          this.nearbyInteractable = trg;
          break;
        }
      }
    }

    events.emit('INTERACTION_PROMPT', this.nearbyInteractable);
  }
}
