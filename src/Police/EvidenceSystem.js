/**
 * Game FreeWorld - EvidenceSystem (v3.0)
 * Multi-factor crime evidence & investigation confidence tracker:
 * - Witness statements (eye-witness direct identification)
 * - CCTV street cameras (fixed security camera cones)
 * - Vehicle description (make, model, color)
 * - Acoustic gunshot sensors (triangulated location)
 * - Forensic evidence (blood pools, spent shell casings, abandoned stolen vehicles)
 * - Investigation Confidence Score (0% - 100%) driving law enforcement escalation
 */
import * as THREE from 'three';
import { events } from '../Core/EventBus.js';

export class EvidenceSystem {
  static instance = null;

  constructor() {
    if (EvidenceSystem.instance) return EvidenceSystem.instance;
    EvidenceSystem.instance = this;

    this.evidenceNodes = [];
    this.confidenceScore = 0; // 0 to 100
    this.activeSearchPos = new THREE.Vector3();

    // CCTV Security Camera sensors around landmarks
    this.cctvCameras = [
      { id: 'cctv_bank', name: 'Central Bank CCTV', position: new THREE.Vector3(-180, 5, -180), radius: 35 },
      { id: 'cctv_armory', name: 'Apex Armory CCTV', position: new THREE.Vector3(120, 5, -140), radius: 30 },
      { id: 'cctv_plaza', name: 'City Plaza CCTV', position: new THREE.Vector3(0, 5, 0), radius: 40 },
      { id: 'cctv_harbor', name: 'Marina Harbor CCTV', position: new THREE.Vector3(-120, 5, 120), radius: 35 }
    ];

    this.setupEventListeners();
  }

  static get() {
    if (!EvidenceSystem.instance) new EvidenceSystem();
    return EvidenceSystem.instance;
  }

  setupEventListeners() {
    events.on('WEAPON_FIRED', ({ origin, weapon }) => {
      if (weapon && weapon.type !== 'melee') {
        this.addEvidence({
          type: 'ACOUSTIC_GUNSHOT',
          weight: 25,
          position: origin,
          description: `Gunshot acoustic report (${weapon.name})`
        });
      }
    });

    events.on('WITNESS_REPORT', ({ type, position }) => {
      this.addEvidence({
        type: 'WITNESS_STATEMENT',
        weight: 35,
        position,
        description: `911 Citizen Witness Report: ${type}`
      });
    });

    events.on('CRIME_COMMITTED', ({ type, position }) => {
      this.checkCCTVOverlap(position, type);
    });
  }

  checkCCTVOverlap(pos, crimeType) {
    if (!pos) return;
    for (const cam of this.cctvCameras) {
      if (cam.position.distanceTo(pos) <= cam.radius) {
        this.addEvidence({
          type: 'CCTV_RECORDING',
          weight: 40,
          position: pos,
          description: `Security Video Footage from ${cam.name}: ${crimeType}`
        });
        events.emit('HUD_NOTIFICATION', {
          title: 'CCTV DETECTED',
          message: `Captured on ${cam.name}!`
        });
        break;
      }
    }
  }

  addEvidence(node) {
    this.evidenceNodes.push({
      id: this.evidenceNodes.length + 1,
      type: node.type,
      weight: node.weight || 20,
      position: node.position ? node.position.clone() : new THREE.Vector3(),
      description: node.description || 'Crime scene evidence',
      timestamp: performance.now()
    });

    this.activeSearchPos.copy(node.position);

    // Recalculate Investigation Confidence Score (clamped 0 to 100%)
    let totalWeight = 0;
    for (const ev of this.evidenceNodes) {
      totalWeight += ev.weight;
    }
    this.confidenceScore = Math.min(100, totalWeight);

    events.emit('EVIDENCE_UPDATED', {
      confidenceScore: this.confidenceScore,
      searchPos: this.activeSearchPos,
      latestEvidence: node.description
    });

    // Escalate Wanted Level if Confidence >= 70%
    if (this.confidenceScore >= 70) {
      events.emit('WANTED_ESCALATION_REQUIRED', { confidence: this.confidenceScore, pos: this.activeSearchPos });
    }
  }

  resetEvidence() {
    this.evidenceNodes = [];
    this.confidenceScore = 0;
    events.emit('EVIDENCE_UPDATED', { confidenceScore: 0, searchPos: null, latestEvidence: '' });
  }

  update(delta) {
    // Decay confidence slowly over time if no new evidence added
    if (this.confidenceScore > 0 && this.evidenceNodes.length > 0) {
      this.confidenceScore = Math.max(0, this.confidenceScore - delta * 0.8);
    }
  }
}

export const evidenceSystem = new EvidenceSystem();
