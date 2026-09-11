/**
 * FreeWorld Engine - Outbreak Director (Phase 11)
 * Authoritative AI director tracking city-wide apocalypse metrics:
 * outbreakLevel, infectedPopulation, zombiePopulation, survivorPopulation,
 * policeCapacity, hospitalCapacity, infrastructureDamage.
 */

import { events } from '../Core/EventBus.js';

export class OutbreakDirector {
  static instance = null;

  constructor() {
    if (OutbreakDirector.instance) return OutbreakDirector.instance;
    OutbreakDirector.instance = this;

    // Telemetry Metrics
    this.outbreakLevel = 15.0;            // 0% (Peaceful) to 100% (Total Extinction)
    this.infectedPopulation = 12;
    this.zombiePopulation = 8;
    this.survivorPopulation = 150;
    this.policeCapacity = 100.0;           // 100% (Full force) to 0% (Wiped out)
    this.hospitalCapacity = 90.0;          // 100% (Operational) to 0% (Overrun)
    this.infrastructureDamage = 5.0;       // 0% (Pristine) to 100% (Destroyed)

    this.autonomousEventTimer = 0;
    this.bindEvents();
  }

  static get() {
    if (!OutbreakDirector.instance) new OutbreakDirector();
    return OutbreakDirector.instance;
  }

  bindEvents() {
    events.on('NPC_TRANSFORMED_TO_ZOMBIE', () => {
      this.zombiePopulation++;
      this.infectedPopulation = Math.max(0, this.infectedPopulation - 1);
      this.outbreakLevel = Math.min(100.0, this.outbreakLevel + 0.8);
    });

    events.on('ENTITY_INFECTED', () => {
      this.infectedPopulation++;
      this.outbreakLevel = Math.min(100.0, this.outbreakLevel + 0.4);
    });

    events.on('CRIME_COMMITTED', ({ severity }) => {
      if (severity >= 2) {
        this.policeCapacity = Math.max(0.0, this.policeCapacity - 1.2);
      }
    });

    events.on('MASTER_POWER_GRID_CHANGED', ({ isOnline }) => {
      if (!isOnline) {
        this.infrastructureDamage = Math.min(100.0, this.infrastructureDamage + 15.0);
        this.outbreakLevel = Math.min(100.0, this.outbreakLevel + 5.0);
      }
    });
  }

  /**
   * Main Director update loop advancing autonomous city outbreak simulation.
   * @param {number} delta 
   */
  update(delta) {
    // Natural outbreak progression
    const growthRate = (this.outbreakLevel > 50 ? 0.25 : 0.1) * (1.0 + (100 - this.policeCapacity) / 100);
    this.outbreakLevel = Math.min(100.0, this.outbreakLevel + growthRate * delta);

    // Autonomous event trigger timer
    this.autonomousEventTimer += delta;
    if (this.autonomousEventTimer >= 20.0) { // Every 20 seconds, Director triggers unscripted systemic event
      this.autonomousEventTimer = 0;
      this.triggerAutonomousEvent();
    }

    // Emit telemetry updates
    events.emit('OUTBREAK_TELEMETRY_UPDATED', this.getTelemetry());
  }

  /**
   * Triggers an unscripted autonomous emergency event based on current outbreak severity.
   */
  triggerAutonomousEvent() {
    const eventTypes = [
      'ZOMBIE_OUTBREAK',
      'POWER_FAILURE',
      'TRAFFIC_COLLAPSE',
      'FIRE_HAZARD',
      'EVACUATION_NOTICE',
      'BUILDING_LOCKDOWN'
    ];

    const idx = Math.floor(Math.random() * eventTypes.length);
    const chosenType = eventTypes[idx];

    events.emit('SYSTEMIC_EMERGENCY_EVENT', {
      type: chosenType,
      origin: {
        x: (Math.random() - 0.5) * 300,
        y: 0.5,
        z: (Math.random() - 0.5) * 300
      },
      severity: Math.ceil(this.outbreakLevel / 25)
    });
  }

  getTelemetry() {
    return {
      outbreakLevel: Math.round(this.outbreakLevel),
      infectedPopulation: this.infectedPopulation,
      zombiePopulation: this.zombiePopulation,
      survivorPopulation: this.survivorPopulation,
      policeCapacity: Math.round(this.policeCapacity),
      hospitalCapacity: Math.round(this.hospitalCapacity),
      infrastructureDamage: Math.round(this.infrastructureDamage)
    };
  }

  toJSON() {
    return this.getTelemetry();
  }

  fromJSON(data) {
    if (!data) return;
    this.outbreakLevel = data.outbreakLevel || 15.0;
    this.infectedPopulation = data.infectedPopulation || 12;
    this.zombiePopulation = data.zombiePopulation || 8;
    this.survivorPopulation = data.survivorPopulation || 150;
    this.policeCapacity = data.policeCapacity !== undefined ? data.policeCapacity : 100.0;
    this.hospitalCapacity = data.hospitalCapacity !== undefined ? data.hospitalCapacity : 90.0;
    this.infrastructureDamage = data.infrastructureDamage || 5.0;
  }
}
