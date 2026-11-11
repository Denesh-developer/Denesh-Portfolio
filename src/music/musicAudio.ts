/**
 * Audio engine for the DJ booth: exactly ONE HTMLAudioElement for its whole
 * lifetime, plus a lazily-created Web Audio graph (MediaElementSource → Analyser
 * → destination) for the visualizer. High-frequency data (frequency bins, the
 * playhead) is pulled on demand — it never drives React state directly.
 *
 * The AudioContext + graph are created on the FIRST play() (a user gesture), so
 * nothing violates browser autoplay policy and nothing is spun up on open.
 */
import type { PlayerStatus } from './musicTypes'

type Win = Window & { webkitAudioContext?: typeof AudioContext }

export interface AudioEvents {
  onStatus?: (s: PlayerStatus) => void
  onTime?: (current: number, duration: number) => void
  onEnded?: () => void
  onError?: () => void
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export class AudioEngine {
  readonly el: HTMLAudioElement
  private corsEnabled: boolean
  private ev: AudioEvents = {}
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private srcNode: MediaElementAudioSourceNode | null = null
  private freq: Uint8Array<ArrayBuffer> | null = null
  private disposed = false

  constructor(corsAudio: boolean) {
    this.corsEnabled = corsAudio
    this.el = new Audio()
    this.el.preload = 'auto'
    // crossOrigin is REQUIRED for the AnalyserNode to read samples; only safe when
    // the stream CDN sends CORS (iTunes does). Setting it otherwise breaks loads.
    if (corsAudio) this.el.crossOrigin = 'anonymous'
    this.attach()
  }

  setEvents(ev: AudioEvents) {
    this.ev = ev
  }

  private handlers: Record<string, EventListener> = {}
  private attach() {
    const on = (name: string, fn: EventListener) => {
      this.handlers[name] = fn
      this.el.addEventListener(name, fn)
    }
    on('timeupdate', () => this.ev.onTime?.(this.el.currentTime, this.duration()))
    on('loadedmetadata', () => this.ev.onTime?.(this.el.currentTime, this.duration()))
    on('durationchange', () => this.ev.onTime?.(this.el.currentTime, this.duration()))
    on('play', () => this.ev.onStatus?.('playing'))
    on('playing', () => this.ev.onStatus?.('playing'))
    on('pause', () => {
      if (!this.el.ended) this.ev.onStatus?.('paused')
    })
    on('waiting', () => this.ev.onStatus?.('loading'))
    on('ended', () => this.ev.onEnded?.())
    on('error', () => {
      this.ev.onStatus?.('error')
      this.ev.onError?.()
    })
  }

  private duration(): number {
    const d = this.el.duration
    return Number.isFinite(d) ? d : 0
  }

  /** Point the single element at a new stream. */
  load(url: string, autoplay: boolean) {
    this.ev.onStatus?.('loading')
    this.el.src = url
    this.el.load()
    if (autoplay) void this.play()
  }

  async play(): Promise<void> {
    // Start playback FIRST (never block it on the Web Audio graph), then wire the
    // analyser best-effort — so the visualizer can never hold up or break audio.
    try {
      await this.el.play()
    } catch {
      // Autoplay block or a load error — surfaced via the 'error' event / caller.
    }
    void this.ensureGraph()
  }

  /** Test-only diagnostics (reached via the DEV window handle). */
  debug() {
    return {
      paused: this.el.paused,
      readyState: this.el.readyState,
      networkState: this.el.networkState,
      error: this.el.error?.code ?? null,
      ctx: this.ctx?.state ?? 'none',
      hasAnalyser: !!this.analyser,
      src: this.el.currentSrc ? new URL(this.el.currentSrc).host : null,
      currentTime: Number(this.el.currentTime.toFixed(2)),
    }
  }
  pause() {
    this.el.pause()
  }
  toggle() {
    if (this.el.paused) void this.play()
    else this.pause()
  }
  seek(t: number) {
    const d = this.duration()
    if (d > 0) this.el.currentTime = clamp(t, 0, d)
  }
  seekBy(delta: number) {
    this.seek(this.el.currentTime + delta)
  }
  setVolume(v: number) {
    this.el.volume = clamp(v, 0, 1)
  }
  setMuted(m: boolean) {
    this.el.muted = m
  }

  /** Build the Web Audio graph once (only when the CDN is CORS-enabled). */
  private async ensureGraph() {
    if (!this.corsEnabled || this.disposed) return
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || (window as Win).webkitAudioContext
        if (!AC) return
        this.ctx = new AC()
        this.srcNode = this.ctx.createMediaElementSource(this.el)
        this.analyser = this.ctx.createAnalyser()
        this.analyser.fftSize = 128
        this.analyser.smoothingTimeConstant = 0.8
        this.freq = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount))
        this.srcNode.connect(this.analyser)
        this.analyser.connect(this.ctx.destination)
      } catch {
        this.ctx = null // analyser unavailable → visualizer falls back
      }
    }
    if (this.ctx?.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        /* ignore */
      }
    }
  }

  /** Latest frequency bins for the visualizer, or null if the analyser is unavailable. */
  getFrequency(): Uint8Array | null {
    if (this.analyser && this.freq) {
      this.analyser.getByteFrequencyData(this.freq)
      return this.freq
    }
    return null
  }

  dispose() {
    this.disposed = true
    for (const [name, fn] of Object.entries(this.handlers)) this.el.removeEventListener(name, fn)
    this.handlers = {}
    try {
      this.el.pause()
    } catch {
      /* ignore */
    }
    this.el.src = ''
    try {
      void this.ctx?.close()
    } catch {
      /* ignore */
    }
    this.ctx = null
    this.analyser = null
    this.srcNode = null
    this.freq = null
  }
}
