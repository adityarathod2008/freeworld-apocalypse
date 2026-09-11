/**
 * Game FreeWorld - WeaponSystem
 * Original firearms and melee combat with recoil, dynamic spread, magazine reloads, and raycast hitscan
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export const WEAPON_CONFIGS = [
  {
    id: 0,
    name: 'FISTS',
    type: 'melee',
    damage: 25,
    fireRate: 0.45,
    range: 2.5,
    clipSize: Infinity,
    maxReserve: Infinity
  },
  {
    id: 1,
    name: 'VORTEX-9',
    type: 'pistol',
    damage: 38,
    fireRate: 0.22,
    range: 120,
    clipSize: 12,
    maxReserve: 60,
    spread: 0.012,
    recoil: 0.02
  },
  {
    id: 2,
    name: 'APEX CARBINE',
    type: 'rifle',
    damage: 32,
    fireRate: 0.095,
    range: 160,
    clipSize: 30,
    maxReserve: 150,
    spread: 0.025,
    recoil: 0.035
  },
  {
    id: 3,
    name: 'TITAN BREAKER',
    type: 'shotgun',
    damage: 18,
    pellets: 8,
    fireRate: 0.75,
    range: 50,
    clipSize: 8,
    maxReserve: 40,
    spread: 0.065,
    recoil: 0.08
  }
];

export class WeaponSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.weapons = WEAPON_CONFIGS.map(cfg => ({
      ...cfg,
      currentClip: cfg.clipSize,
      reserve: cfg.maxReserve
    }));

    this.currentWeaponIndex = 1; // Start with Vortex-9 Pistol
    this.lastFireTime = 0;
    this.isReloading = false;
    this.reloadTimer = 0;

    // Visual Muzzle Flash Light
    this.muzzleLight = new THREE.PointLight(0xffaa22, 0, 15, 2.0);
    this.scene.add(this.muzzleLight);
    this.muzzleFlashTimer = 0;

    this.setupEventListeners();
  }

  setupEventListeners() {
    events.on('SELECT_WEAPON', (index) => {
      this.switchWeapon(index);
    });

    events.on('BUY_AMMO', ({ weaponId, amount }) => {
      const w = this.weapons.find(w => w.id === weaponId);
      if (w && w.reserve !== Infinity) {
        w.reserve = Math.min(w.maxReserve * 2, w.reserve + amount);
        this.emitStats();
      }
    });
  }

  getCurrentWeapon() {
    return this.weapons[this.currentWeaponIndex];
  }

  switchWeapon(index) {
    if (index >= 0 && index < this.weapons.length && index !== this.currentWeaponIndex) {
      this.currentWeaponIndex = index;
      this.isReloading = false;
      this.emitStats();
      events.emit('WEAPON_SWITCHED', this.getCurrentWeapon());
    }
  }

  reload() {
    const w = this.getCurrentWeapon();
    if (w.type === 'melee' || this.isReloading || w.currentClip === w.clipSize || w.reserve <= 0) {
      return;
    }

    this.isReloading = true;
    this.reloadTimer = 1.6; // 1.6s reload time
    events.emit('HUD_NOTIFICATION', {
      title: 'RELOADING',
      message: `${w.name}...`
    });
  }

  update(delta, input, playerPos, isDriving, targets = []) {
    if (isDriving) return; // Cannot shoot while driving vertical slice

    // Weapon Switching via 1, 2, 3, 4
    if (input.isKeyPressed('Digit1')) this.switchWeapon(0);
    if (input.isKeyPressed('Digit2')) this.switchWeapon(1);
    if (input.isKeyPressed('Digit3')) this.switchWeapon(2);
    if (input.isKeyPressed('Digit4')) this.switchWeapon(3);

    // Reloading
    if (input.isKeyPressed('KeyR')) {
      this.reload();
    }

    if (this.isReloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        const w = this.getCurrentWeapon();
        const needed = w.clipSize - w.currentClip;
        const take = Math.min(needed, w.reserve);
        w.currentClip += take;
        w.reserve -= take;
        this.emitStats();
      }
    }

    // Muzzle Flash fade
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleLight.intensity = 0;
      }
    }

    // Firing Check
    const w = this.getCurrentWeapon();
    const wantsToShoot = (w.type === 'melee' || w.type === 'pistol' || w.type === 'shotgun')
      ? input.isMousePressed(0)
      : input.isMouseDown(0);

    const now = performance.now() / 1000;
    if (wantsToShoot && now - this.lastFireTime >= w.fireRate && !this.isReloading) {
      if (w.type !== 'melee' && w.currentClip <= 0) {
        this.reload();
        return;
      }

      this.lastFireTime = now;
      this.fire(playerPos, targets);
    }
  }

  fire(playerPos, targets) {
    const w = this.getCurrentWeapon();

    if (w.type !== 'melee') {
      w.currentClip--;

      events.emit('SOUND_EMITTED', {
        position: playerPos ? playerPos.clone() : new THREE.Vector3(),
        soundType: 'GUNSHOT',
        volumeMultiplier: 1.0
      });

      this.emitStats();

      // Muzzle Flash
      if (playerPos) {
        this.muzzleLight.position.copy(playerPos).add(new THREE.Vector3(0.4, 1.4, 0.6));
        this.muzzleLight.intensity = 4.0;
        this.muzzleFlashTimer = 0.05;
      }
    }

    // Emit sound & witness events
    events.emit('WEAPON_FIRED', {
      weapon: w,
      origin: playerPos ? playerPos.clone() : new THREE.Vector3()
    });

    // Raycast hitscan from camera center
    const raycaster = new THREE.Raycaster();
    const pelletCount = w.pellets || 1;

    for (let p = 0; p < pelletCount; p++) {
      let spreadX = (Math.random() - 0.5) * (w.spread || 0);
      let spreadY = (Math.random() - 0.5) * (w.spread || 0);

      raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), this.camera);
      raycaster.far = w.range;

      // Hit detection on targets (civilians, police, vehicles)
      this.checkRaycastHits(raycaster, w, playerPos, targets);
    }
  }

  checkRaycastHits(raycaster, weapon, origin, targets) {
    let closestHit = null;
    let closestDist = Infinity;

    // Raycast against NPCs
    if (targets.pedestrians) {
      for (const ped of targets.pedestrians) {
        if (ped.isDead) continue;
        const box = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(ped.position.x, ped.position.y + 0.9, ped.position.z),
          new THREE.Vector3(0.8, 1.8, 0.8)
        );
        const hitPoint = new THREE.Vector3();
        if (raycaster.ray.intersectBox(box, hitPoint)) {
          const d = origin.distanceTo(hitPoint);
          if (d < closestDist) {
            closestDist = d;
            closestHit = { type: 'npc', target: ped, point: hitPoint };
          }
        }
      }
    }

    // Raycast against Vehicles
    if (targets.vehicles) {
      for (const car of targets.vehicles) {
        const box = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(car.mesh.position.x, car.mesh.position.y + 0.8, car.mesh.position.z),
          new THREE.Vector3(2.5, 1.8, 4.8)
        );
        const hitPoint = new THREE.Vector3();
        if (raycaster.ray.intersectBox(box, hitPoint)) {
          const d = origin.distanceTo(hitPoint);
          if (d < closestDist) {
            closestDist = d;
            closestHit = { type: 'vehicle', target: car, point: hitPoint };
          }
        }
      }
    }

    // Apply Damage & Hit Reaction
    if (closestHit) {
      if (closestHit.type === 'npc') {
        closestHit.target.takeDamage(weapon.damage, { position: origin });
        events.emit('COMBAT_HIT', { type: 'npc', point: closestHit.point });
      } else if (closestHit.type === 'vehicle') {
        closestHit.target.takeDamage(weapon.damage * 0.7);
        events.emit('COMBAT_HIT', { type: 'vehicle', point: closestHit.point });
      }
    }
  }

  emitStats() {
    const w = this.getCurrentWeapon();
    events.emit('WEAPON_STATS_CHANGED', {
      name: w.name,
      currentClip: w.currentClip,
      reserve: w.reserve,
      type: w.type
    });
  }
}
