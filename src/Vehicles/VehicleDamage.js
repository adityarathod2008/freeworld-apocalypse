/**
 * Game FreeWorld - VehicleDamage (v3.0)
 * Multi-zone vehicle durability, fuel leaks, smoldering fire, heat accumulation,
 * and rare catastrophic explosion sequence.
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class VehicleDamage {
  constructor(scene, vehicle = null, maxHealth = 1000) {
    this.scene = scene;
    this.vehicle = vehicle;
    this.health = maxHealth;
    this.maxHealth = maxHealth;

    // States: 'HEALTHY' | 'DAMAGED' | 'LEAKING' | 'BURNING' | 'EXPLODED'
    this.state = 'HEALTHY';
    this.temperature = 100; // Celsius (Normal engine ~90-100°C)
    this.isLeakingFuel = false;
    this.isDestroyed = false;

    this.fireTimer = 0;
    this.cookOffDuration = 8.0; // 8 seconds of fire before potential rare explosion

    // Particle pools
    this.smokePool = [];
    this.firePool = [];
    this.initParticlePools();
  }

  initParticlePools() {
    const smokeGeo = new THREE.SphereGeometry(0.28, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.5 });
    for (let i = 0; i < 20; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
      p.visible = false;
      this.scene.add(p);
      this.smokePool.push({ mesh: p, life: 0, maxLife: 1.1, velY: 1.6 });
    }

    const fireGeo = new THREE.SphereGeometry(0.22, 6, 6);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 16; i++) {
      const p = new THREE.Mesh(fireGeo, fireMat.clone());
      p.visible = false;
      this.scene.add(p);
      this.firePool.push({ mesh: p, life: 0, maxLife: 0.65, velY: 2.2 });
    }
  }

  applyZoneDamage(amount, zone = 'body', hitPoint = null) {
    if (this.isDestroyed) return;

    this.health = Math.max(0, this.health - amount);

    // Fuel Tank Hit (Rear Area): 15% probability of initiating fuel leak
    if (zone === 'fuel_tank' || zone === 'rear') {
      if (!this.isLeakingFuel && Math.random() < 0.35) {
        this.isLeakingFuel = true;
        this.state = 'LEAKING';
        events.emit('VEHICLE_FUEL_LEAK', { vehicle: this.vehicle, position: hitPoint });
        events.emit('HUD_NOTIFICATION', {
          title: 'FUEL TANK LEAK',
          message: 'Flammable fuel leaking from tank!'
        });
      }
    }

    // Engine Hit (Front Area): Increases heat rapidly
    if (zone === 'engine' || zone === 'front') {
      this.temperature += amount * 2.5;
    }

    // Ignition Check: If leaking fuel or high temp + gunfire, 15% chance of ignition
    if ((this.isLeakingFuel || this.temperature > 320 || this.health < this.maxHealth * 0.25) && this.state !== 'BURNING') {
      if (Math.random() < 0.25) {
        this.ignite();
      }
    }

    if (this.health <= 0 && this.state !== 'BURNING' && this.state !== 'EXPLODED') {
      this.ignite();
    }
  }

  ignite() {
    if (this.state === 'BURNING' || this.isDestroyed) return;

    this.state = 'BURNING';
    this.temperature = 450;
    this.fireTimer = 0;

    events.emit('VEHICLE_IGNITED', { vehicle: this.vehicle, temperature: this.temperature });
    events.emit('HUD_NOTIFICATION', {
      title: 'VEHICLE ON FIRE',
      message: 'Engine compartment ignited!'
    });
  }

  extinguish() {
    if (this.state === 'BURNING') {
      this.state = 'DAMAGED';
      this.temperature = 120;
      events.emit('HUD_NOTIFICATION', {
        title: 'FIRE EXTINGUISHED',
        message: 'Fire department extinguished blaze.'
      });
    }
  }

  update(delta, vehiclePos) {
    if (!vehiclePos) return;

    // Burning Progression: Accumulate heat over 8 seconds before rare explosion
    if (this.state === 'BURNING' && !this.isDestroyed) {
      this.fireTimer += delta;
      this.temperature += delta * 60; // Temp rises to ~850°C
      this.emitFireAndSmoke(vehiclePos);

      // Cook-off explosion trigger
      if (this.fireTimer >= this.cookOffDuration || this.temperature > 850) {
        this.explode(vehiclePos);
      }
    } else if (this.health < this.maxHealth * 0.45 && !this.isDestroyed) {
      // Radiator smoke
      this.emitSmoke(vehiclePos);
    }

    // Update particle pools
    this.updateParticles(delta);
  }

  emitSmoke(pos) {
    if (Math.random() > 0.4) return;
    const p = this.smokePool.find(item => !item.mesh.visible);
    if (p) {
      p.mesh.visible = true;
      p.life = 0;
      p.mesh.scale.set(1, 1, 1);
      p.mesh.position.set(pos.x + (Math.random() - 0.5) * 0.6, pos.y + 0.7, pos.z + (Math.random() - 0.5) * 0.6);
    }
  }

  emitFireAndSmoke(pos) {
    // Fire particles
    const f = this.firePool.find(item => !item.mesh.visible);
    if (f) {
      f.mesh.visible = true;
      f.life = 0;
      f.mesh.scale.set(1, 1, 1);
      f.mesh.position.set(pos.x + (Math.random() - 0.5) * 0.8, pos.y + 0.8, pos.z + (Math.random() - 0.5) * 0.8);
    }
    // Heavy black smoke
    this.emitSmoke(pos);
  }

  updateParticles(delta) {
    for (const p of this.smokePool) {
      if (p.mesh.visible) {
        p.life += delta;
        p.mesh.position.y += p.velY * delta;
        p.mesh.scale.addScalar(delta * 1.8);
        p.mesh.material.opacity = (1 - p.life / p.maxLife) * 0.5;
        if (p.life >= p.maxLife) p.mesh.visible = false;
      }
    }
    for (const f of this.firePool) {
      if (f.mesh.visible) {
        f.life += delta;
        f.mesh.position.y += f.velY * delta;
        f.mesh.scale.addScalar(delta * 1.2);
        f.mesh.material.opacity = (1 - f.life / f.maxLife) * 0.8;
        if (f.life >= f.maxLife) f.mesh.visible = false;
      }
    }
  }

  explode(pos) {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.state = 'EXPLODED';
    this.health = 0;

    // Char vehicle mesh black
    if (this.vehicle && this.vehicle.mesh) {
      this.vehicle.mesh.traverse(child => {
        if (child.isMesh && child.material) {
          child.material = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
        }
      });
    }

    events.emit('VEHICLE_EXPLODED', {
      vehicle: this.vehicle,
      position: pos.clone(),
      blastRadius: 14.0
    });

    events.emit('CRIME_COMMITTED', {
      type: 'EXPLOSION',
      severity: 4,
      position: pos.clone()
    });

    events.emit('HUD_NOTIFICATION', {
      title: 'VEHICLE EXPLOSION',
      message: 'Catastrophic fuel tank explosion!'
    });

    // Eject driver with blast impulse & damage if present
    if (this.vehicle && this.vehicle.driver) {
      this.vehicle.driver.takeDamage(75);
      this.vehicle.driver.exitVehicle();
    }
  }
}
