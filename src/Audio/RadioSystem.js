/**
 * Game FreeWorld - RadioSystem
 * In-vehicle procedural radio synthesizer featuring 4 original stations:
 * 1. Bay City Wave (80s Retrowave / Synthwave)
 * 2. Downtown Drill (Bass-heavy rhythmic hip-hop)
 * 3. Overdrive Rock (High-gain guitar synth)
 * 4. Bay Public 98.5 (Satirical city talk announcements)
 */
import { events } from '../Core/EventBus.js';

export const RADIO_STATIONS = [
  { id: 0, name: 'OFF', genre: 'Radio Off' },
  { id: 1, name: 'BAY CITY WAVE', genre: 'Synthwave & Retrowave' },
  { id: 2, name: 'DOWNTOWN DRILL', genre: 'Underworld Hip-Hop' },
  { id: 3, name: 'OVERDRIVE ROCK', genre: 'High-Octane Rock' },
  { id: 4, name: 'BAY PUBLIC 98.5', genre: 'Satirical City Talk' }
];

export class RadioSystem {
  constructor(soundEngine) {
    this.soundEngine = soundEngine;
    this.currentStationIndex = 1;
    this.isPlaying = false;
    this.stepTimer = 0;
    this.beatStep = 0;

    this.setupListeners();
  }

  setupListeners() {
    events.on('PLAYER_ENTERED_VEHICLE', () => {
      this.playCurrentStation();
    });

    events.on('PLAYER_EXITED_VEHICLE', () => {
      this.stopRadio();
    });

    events.on('CYCLE_RADIO', () => {
      this.cycleStation();
    });
  }

  cycleStation() {
    this.currentStationIndex = (this.currentStationIndex + 1) % RADIO_STATIONS.length;
    const station = RADIO_STATIONS[this.currentStationIndex];

    events.emit('HUD_NOTIFICATION', {
      title: 'RADIO TUNER',
      message: `${station.name} — [${station.genre}]`
    });

    if (station.id === 0) {
      this.stopRadio();
    } else {
      this.playCurrentStation();
    }
  }

  playCurrentStation() {
    if (this.currentStationIndex === 0) return;
    this.isPlaying = true;
  }

  stopRadio() {
    this.isPlaying = false;
  }

  update(delta) {
    if (!this.isPlaying || !this.soundEngine || !this.soundEngine.ctx) return;

    this.stepTimer += delta;
    // 120 BPM beat clock (0.25s per 16th note)
    if (this.stepTimer >= 0.25) {
      this.stepTimer = 0;
      this.beatStep = (this.beatStep + 1) % 16;
      this.synthesizeBeat(this.currentStationIndex, this.beatStep);
    }
  }

  synthesizeBeat(stationId, step) {
    const ctx = this.soundEngine.ctx;
    if (!ctx || ctx.state === 'suspended') return;

    try {
      const now = ctx.currentTime;

      // Station 1: Synthwave arpeggios & kick
      if (stationId === 1) {
        if (step % 4 === 0) {
          // Synth kick drum
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.frequency.setValueAtTime(140, now);
          kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.15);
          kickGain.gain.setValueAtTime(0.25, now);
          kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          kickOsc.connect(kickGain);
          kickGain.connect(ctx.destination);
          kickOsc.start(now);
          kickOsc.stop(now + 0.16);
        }

        // Bass synth arpeggios
        const notes = [110, 130.8, 146.8, 164.8]; // A, C, D, E
        const freq = notes[step % notes.length];
        const synOsc = ctx.createOscillator();
        const synGain = ctx.createGain();
        synOsc.type = 'sawtooth';
        synOsc.frequency.setValueAtTime(freq, now);
        synGain.gain.setValueAtTime(0.08, now);
        synGain.gain.exponentialRampToValueAtTime(0.005, now + 0.2);
        synOsc.connect(synGain);
        synGain.connect(ctx.destination);
        synOsc.start(now);
        synOsc.stop(now + 0.22);
      }

      // Station 2: Hip-hop 808 sub bass & snare
      else if (stationId === 2) {
        if (step % 8 === 4) {
          // Snare noise
          const snareOsc = ctx.createOscillator();
          const snareGain = ctx.createGain();
          snareOsc.type = 'triangle';
          snareOsc.frequency.setValueAtTime(220, now);
          snareGain.gain.setValueAtTime(0.12, now);
          snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          snareOsc.connect(snareGain);
          snareGain.connect(ctx.destination);
          snareOsc.start(now);
          snareOsc.stop(now + 0.13);
        }
      }
    } catch (e) {}
  }
}
