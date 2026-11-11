/**
 * Tiny Web Audio SFX for the game — jump / collect / hit / game-over. No audio
 * files: every sound is synthesized, so there is nothing to download.
 *
 * The AudioContext is created lazily on the FIRST sound (which only ever fires
 * after a user gesture — starting/jumping), never on overlay open. A master gain
 * lets the mute toggle silence everything instantly, and dispose() tears the
 * context down on close so no audio graph lingers.
 */

type Win = Window & { webkitAudioContext?: typeof AudioContext }

export class GameAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private muted: boolean

  constructor(muted: boolean) {
    this.muted = muted
  }

  private ensure(): AudioContext | null {
    if (this.muted) return null
    if (this.ctx) return this.ctx
    try {
      const AC = window.AudioContext || (window as Win).webkitAudioContext
      if (!AC) return null
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.5
      this.master.connect(this.ctx.destination)
    } catch {
      this.ctx = null
    }
    return this.ctx
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (muted && this.ctx) void this.ctx.suspend()
    else if (!muted && this.ctx) void this.ctx.resume()
  }

  /** Resume a context suspended by the browser's autoplay policy (call on start/jump). */
  resume() {
    if (!this.muted && this.ctx?.state === 'suspended') void this.ctx.resume()
  }

  private blip(
    type: OscillatorType,
    from: number,
    to: number,
    dur: number,
    peak = 0.5,
    delay = 0,
  ) {
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const t0 = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(from, t0)
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(gain).connect(this.master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }

  jump() {
    this.resume()
    this.blip('square', 420, 720, 0.12, 0.32)
  }

  collect() {
    this.resume()
    // Two quick rising notes — a bright, non-annoying "ding".
    this.blip('triangle', 880, 880, 0.08, 0.34)
    this.blip('triangle', 1320, 1320, 0.1, 0.34, 0.07)
  }

  /** Soft, quiet touch-down thud when the player lands. */
  land() {
    this.blip('sine', 240, 150, 0.09, 0.14)
  }

  /** Cheerful rising arpeggio for a new best score. */
  newBest() {
    this.resume()
    this.blip('triangle', 660, 660, 0.1, 0.3, 0.0)
    this.blip('triangle', 880, 880, 0.1, 0.3, 0.1)
    this.blip('triangle', 1175, 1175, 0.18, 0.32, 0.2)
  }

  hit() {
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    // Low body + a short noise burst = a soft thud.
    this.blip('sawtooth', 180, 60, 0.22, 0.4)
    const t0 = ctx.currentTime
    const len = Math.floor(ctx.sampleRate * 0.16)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = ctx.createBufferSource()
    const g = ctx.createGain()
    g.gain.value = 0.25
    src.buffer = buf
    src.connect(g).connect(this.master)
    src.start(t0)
  }

  gameOver() {
    // Short descending three-note motif.
    this.blip('triangle', 660, 660, 0.16, 0.3, 0.0)
    this.blip('triangle', 520, 520, 0.16, 0.3, 0.14)
    this.blip('triangle', 392, 300, 0.34, 0.3, 0.28)
  }

  dispose() {
    if (this.ctx) {
      void this.ctx.close().catch(() => {})
      this.ctx = null
      this.master = null
    }
  }
}
