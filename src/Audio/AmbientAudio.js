/**
 * Game FreeWorld - AmbientAudio
 * Ambient soundscape: city traffic drone, wind, rain pitter-patter, harbor foghorn
 */
export class AmbientAudio {
  constructor(soundEngine) {
    this.soundEngine = soundEngine;
    this.ambientGain = null;
  }

  playFoghorn() {
    if (!this.soundEngine || !this.soundEngine.ctx) return;
    try {
      const ctx = this.soundEngine.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 3.1);
    } catch (e) {}
  }
}
