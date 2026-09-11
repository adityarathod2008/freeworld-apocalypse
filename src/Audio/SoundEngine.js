/**
 * Game FreeWorld - SoundEngine
 * High-fidelity procedural Web Audio synthesizer: engine revs, police sirens, gunshots, and tire screeches
 */
import { events } from '../Core/EventBus.js';

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;

    // Engine Audio Nodes
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.isEngineRunning = false;

    // Police Siren Nodes
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenTimer = 0;
    this.isSirenRunning = false;

    this.setupListeners();
  }

  initAudio() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    } catch (e) {
      console.warn('[SoundEngine] Web Audio not supported:', e);
    }
  }

  setupListeners() {
    // Resume/initialize audio on first user click or keydown
    const unlock = () => {
      this.initAudio();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);

    events.on('WEAPON_FIRED', ({ weapon }) => {
      this.playGunshot(weapon);
    });

    events.on('VEHICLE_TELEMETRY', ({ rpm, speedKmh }) => {
      this.updateEnginePitch(rpm, speedKmh);
    });

    events.on('PLAYER_ENTERED_VEHICLE', () => {
      this.startEngineAudio();
    });

    events.on('PLAYER_EXITED_VEHICLE', () => {
      this.stopEngineAudio();
    });

    events.on('WANTED_LEVEL_CHANGED', ({ level }) => {
      if (level > 0) {
        this.startPoliceSiren();
      } else {
        this.stopPoliceSiren();
      }
    });

    events.on('VEHICLE_CRASH', ({ intensity }) => {
      this.playCrash(intensity);
    });
  }

  startEngineAudio() {
    if (!this.ctx || this.isEngineRunning) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(350, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch (e) {}
  }

  stopEngineAudio() {
    if (!this.isEngineRunning) return;
    try {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      setTimeout(() => {
        if (this.engineOsc) this.engineOsc.stop();
        this.isEngineRunning = false;
      }, 120);
    } catch (e) {
      this.isEngineRunning = false;
    }
  }

  updateEnginePitch(rpm, speedKmh) {
    if (!this.isEngineRunning || !this.engineOsc) return;
    try {
      const freq = 45 + rpm * 160 + (speedKmh / 200) * 80;
      this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
      this.engineFilter.frequency.setTargetAtTime(300 + rpm * 650, this.ctx.currentTime, 0.05);
    } catch (e) {}
  }

  startPoliceSiren() {
    if (!this.ctx || this.isSirenRunning) return;
    try {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenOsc.type = 'sine';

      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.setValueAtTime(0.14, this.ctx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);

      this.sirenOsc.start();
      this.isSirenRunning = true;
    } catch (e) {}
  }

  stopPoliceSiren() {
    if (!this.isSirenRunning || !this.sirenGain) return;
    try {
      this.sirenGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      setTimeout(() => {
        if (this.sirenOsc) this.sirenOsc.stop();
        this.isSirenRunning = false;
      }, 250);
    } catch (e) {
      this.isSirenRunning = false;
    }
  }

  update(delta) {
    if (this.isSirenRunning && this.sirenOsc && this.ctx) {
      this.sirenTimer += delta * 2.8;
      // Oscillate siren pitch between 650Hz and 1050Hz
      const freq = 850 + Math.sin(this.sirenTimer) * 200;
      this.sirenOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    }
  }

  playGunshot(weapon) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Noise burst for mechanical gunshot
      const bufferSize = this.ctx.sampleRate * (weapon.type === 'shotgun' ? 0.25 : 0.12);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = weapon.type === 'shotgun' ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(weapon.type === 'shotgun' ? 800 : 1800, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + bufferSize / this.ctx.sampleRate);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
    } catch (e) {}
  }

  playCrash(intensity = 10) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(Math.min(0.5, intensity * 0.03), now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }
}
