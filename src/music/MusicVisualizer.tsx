import { useEffect, useRef } from 'react'
import type { AudioEngine } from './musicAudio'

/**
 * Lightweight canvas visualizer. Reads the engine's AnalyserNode frequency bins
 * (real FFT — the iTunes CDN is CORS-enabled) and draws bars in a single rAF loop
 * that runs ONLY while playing. If no analyser is available it falls back to a
 * gentle time-based animation; reduced-motion shows a calm static strip. Drawing
 * is pure canvas — it never triggers a React re-render.
 */
export function MusicVisualizer({
  engine,
  playing,
  reducedMotion,
  className,
}: {
  engine: AudioEngine
  playing: boolean
  reducedMotion: boolean
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const BARS = 40
    const brand = '#7aa88d'

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = canvas.clientWidth || 300
      const h = canvas.clientHeight || 56
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = (t: number) => {
      const w = canvas.clientWidth || 300
      const h = canvas.clientHeight || 56
      ctx.clearRect(0, 0, w, h)
      const freq = engine.getFrequency()
      const gap = 2
      const bw = (w - gap * (BARS - 1)) / BARS
      for (let i = 0; i < BARS; i++) {
        let v: number
        if (freq && playing) {
          // sample across the low–mid range where music energy lives
          v = freq[Math.floor((i / BARS) * (freq.length * 0.7))] / 255
        } else if (playing && !reducedMotion) {
          v = 0.25 + 0.2 * (Math.sin(t / 240 + i * 0.5) * 0.5 + 0.5) // no analyser fallback
        } else {
          v = 0.08 + 0.04 * Math.sin(i * 0.6) // idle / reduced-motion resting strip
        }
        const bh = Math.max(2, v * h)
        ctx.fillStyle = brand
        ctx.globalAlpha = 0.35 + v * 0.55
        ctx.fillRect(i * (bw + gap), h - bh, bw, bh)
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }

    if (playing || !reducedMotion) {
      raf = requestAnimationFrame(draw)
    } else {
      draw(0) // one static frame
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [engine, playing, reducedMotion])

  return <canvas ref={canvasRef} aria-hidden className={className} style={{ display: 'block', width: '100%', height: '100%' }} />
}
