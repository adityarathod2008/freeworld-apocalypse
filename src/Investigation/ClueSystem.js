/**
 * Game FreeWorld - ClueSystem (Phase 8)
 * Authoritative mystery & investigation layer managing 11 interactive clue types:
 * blood_trails, phones, CCTV, notes, photos, radio_broadcasts, broken_doors,
 * damaged_buildings, medical_records, survivor_testimony, abandoned_vehicles.
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export const CLUE_TYPES = {
  BLOOD_TRAILS: 'blood_trails',
  PHONES: 'phones',
  CCTV: 'CCTV',
  NOTES: 'notes',
  PHOTOS: 'photos',
  RADIO_BROADCASTS: 'radio_broadcasts',
  BROKEN_DOORS: 'broken_doors',
  DAMAGED_BUILDINGS: 'damaged_buildings',
  MEDICAL_RECORDS: 'medical_records',
  SURVIVOR_TESTIMONY: 'survivor_testimony',
  ABANDONED_VEHICLES: 'abandoned_vehicles'
};

export class ClueSystem {
  static instance = null;

  constructor(scene) {
    if (ClueSystem.instance) return ClueSystem.instance;
    ClueSystem.instance = this;

    this.scene = scene;
    this.clues = new Map();
    this.discoveredClues = [];
    this.evidenceStore = [];

    this.initDefaultCityClues();
  }

  static get() {
    if (!ClueSystem.instance) new ClueSystem(null);
    return ClueSystem.instance;
  }

  initDefaultCityClues() {
    const defaultClues = [
      {
        id: 'clue_blood_bank',
        type: CLUE_TYPES.BLOOD_TRAILS,
        title: 'Fresh Blood Trail',
        description: 'A trail of fresh blood leading into the Central Bank alleyway.',
        location: 'Downtown Bank Alley',
        position: new THREE.Vector3(-175, 0.45, -170),
        relatedCharacterId: 'char_marco',
        relatedLocation: 'loc_bank_vault'
      },
      {
        id: 'clue_phone_encrypted',
        type: CLUE_TYPES.PHONES,
        title: 'Burner Phone',
        description: 'An encrypted burner phone displaying a voicemail from Detective Miller.',
        location: 'City Plaza Bench',
        position: new THREE.Vector3(5, 0.45, -10),
        relatedCharacterId: 'char_miller',
        relatedLocation: 'loc_police_hq'
      },
      {
        id: 'clue_cctv_plaza',
        type: CLUE_TYPES.CCTV,
        title: 'Plaza Security Footage',
        description: 'CCTV footage recording a black sedan leaving Apex Armory before the blackout.',
        location: 'City Plaza Security Desk',
        position: new THREE.Vector3(-5, 0.45, 5),
        relatedCharacterId: 'char_vance',
        relatedLocation: 'loc_armory'
      },
      {
        id: 'clue_note_journal',
        type: CLUE_TYPES.NOTES,
        title: 'Torn Journal Page',
        description: 'Handwritten note mentioning vaccine samples stored at Metro Station Level 2.',
        location: 'Safehouse Desk',
        position: new THREE.Vector3(12, 0.45, 42),
        relatedCharacterId: 'char_sarah',
        relatedLocation: 'loc_metro'
      },
      {
        id: 'clue_photo_outbreak',
        type: CLUE_TYPES.PHOTOS,
        title: 'Surveillance Photo',
        description: 'Photograph showing armory gates breached by unknown armed squad.',
        location: 'Apex Armory Office',
        position: new THREE.Vector3(118, 0.45, -138),
        relatedCharacterId: 'char_hayes',
        relatedLocation: 'loc_armory'
      },
      {
        id: 'clue_radio_sos',
        type: CLUE_TYPES.RADIO_BROADCASTS,
        title: 'Emergency Radio Log',
        description: 'Recorded audio log broadcasting 911 distress frequency from Harbor Tower.',
        location: 'Radio Station Studio',
        position: new THREE.Vector3(-115, 0.45, 115),
        relatedCharacterId: 'char_miller',
        relatedLocation: 'loc_harbor'
      },
      {
        id: 'clue_door_breached',
        type: CLUE_TYPES.BROKEN_DOORS,
        title: 'Forced Vault Door',
        description: 'Heavy steel reinforced door blasted off hinges with C4 charges.',
        location: 'Central Bank Vault',
        position: new THREE.Vector3(-182, 0.45, -182),
        relatedCharacterId: 'char_marco',
        relatedLocation: 'loc_bank_vault'
      },
      {
        id: 'clue_building_charred',
        type: CLUE_TYPES.DAMAGED_BUILDINGS,
        title: 'Substation Burn Patterns',
        description: 'Scorched circuit breakers indicating deliberate EMP sabotage.',
        location: 'District Power Station',
        position: new THREE.Vector3(220, 0.45, 220),
        relatedCharacterId: 'char_vance',
        relatedLocation: 'loc_power_station'
      },
      {
        id: 'clue_medical_chart',
        type: CLUE_TYPES.MEDICAL_RECORDS,
        title: 'Patient Medical File',
        description: 'Hospital patient chart describing initial Stage 1 pathogen symptoms.',
        location: 'General Hospital ER',
        position: new THREE.Vector3(-60, 0.45, -80),
        relatedCharacterId: 'char_sarah',
        relatedLocation: 'loc_hospital'
      },
      {
        id: 'clue_survivor_tape',
        type: CLUE_TYPES.SURVIVOR_TESTIMONY,
        title: 'Survivor Audio Tape',
        description: 'Tape recording of dock worker witnessing military quarantine transport.',
        location: 'Harbor Warehouse 4',
        position: new THREE.Vector3(-125, 0.45, 125),
        relatedCharacterId: 'char_hayes',
        relatedLocation: 'loc_harbor'
      },
      {
        id: 'clue_vehicle_abandoned',
        type: CLUE_TYPES.ABANDONED_VEHICLES,
        title: 'Abandoned Patrol Cruiser',
        description: 'Police Cruiser FW-9941-NY left idling with bullet-riddled windshield.',
        location: 'Highway Overpass',
        position: new THREE.Vector3(80, 0.45, -200),
        relatedCharacterId: 'char_hayes',
        relatedLocation: 'loc_highway'
      }
    ];

    for (const cData of defaultClues) {
      this.registerClue(cData);
    }
  }

  registerClue(config) {
    const clue = {
      id: config.id || `clue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: config.type || CLUE_TYPES.NOTES,
      title: config.title || 'Evidence Clue',
      description: config.description || 'An inspectable piece of evidence.',
      location: config.location || 'Unknown Location',
      position: config.position
        ? (typeof config.position.clone === 'function' ? config.position.clone() : new THREE.Vector3(config.position.x || 0, config.position.y || 0, config.position.z || 0))
        : new THREE.Vector3(),
      relatedCharacterId: config.relatedCharacterId || null,
      relatedLocation: config.relatedLocation || null,
      discovered: config.discovered || false,
      inspected: config.inspected || false,
      connectedNodes: config.connectedNodes || []
    };

    // 3D Visual Mesh representation in scene
    if (this.scene) {
      const geo = new THREE.SphereGeometry(0.35, 12, 12);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        roughness: 0.3
      });
      clue.mesh = new THREE.Mesh(geo, mat);
      clue.mesh.position.copy(clue.position);
      clue.mesh.position.y += 0.4;
      this.scene.add(clue.mesh);
    }

    this.clues.set(clue.id, clue);
    return clue;
  }

  discoverClue(clueId) {
    const clue = this.clues.get(clueId);
    if (clue && !clue.discovered) {
      clue.discovered = true;
      if (!this.discoveredClues.includes(clueId)) {
        this.discoveredClues.push(clueId);
      }

      events.emit('CLUE_DISCOVERED', clue);
      events.emit('HUD_NOTIFICATION', {
        title: 'CLUE DISCOVERED',
        message: `${clue.title} added to Evidence Ledger!`
      });
      return true;
    }
    return false;
  }

  inspectClue(clueId) {
    const clue = this.clues.get(clueId);
    if (clue) {
      clue.discovered = true;
      clue.inspected = true;
      if (!this.evidenceStore.includes(clue)) {
        this.evidenceStore.push(clue);
      }
      events.emit('CLUE_INSPECTED', clue);
      return clue;
    }
    return null;
  }

  update(playerPosition, deltaTime) {
    if (!playerPosition || typeof playerPosition.x !== 'number') return;
    const posVector = typeof playerPosition.clone === 'function' ? playerPosition : new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);

    for (const clue of this.clues.values()) {
      if (!clue.discovered && clue.position) {
        const dist = posVector.distanceTo(clue.position);
        if (dist <= 8.0) {
          this.discoverClue(clue.id);
        }
      }
    }
  }

  getClue(clueId) {
    return this.clues.get(clueId);
  }

  getAllClues() {
    return Array.from(this.clues.values());
  }

  getDiscoveredClues() {
    return this.discoveredClues.map(id => this.clues.get(id)).filter(Boolean);
  }
}
