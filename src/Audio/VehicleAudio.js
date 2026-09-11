/**
 * Game FreeWorld - VehicleAudio
 * Procedural synthesis for engine revs, gear changes, tire skids, and turbo whistles
 */
export class VehicleAudio {
  constructor(soundEngine) {
    this.soundEngine = soundEngine;
  }

  updateEngineSound(rpm, speedKmh) {
    if (this.soundEngine) {
      this.soundEngine.updateEnginePitch(rpm, speedKmh);
    }
  }
}
