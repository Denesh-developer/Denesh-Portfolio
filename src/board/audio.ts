/**
 * A short synthesized riff when the DJ is clicked — no audio asset needed.
 * Returns the total duration in ms so the caller can drive the DJ's performance
 * animation for exactly as long as sound is playing.
 */
export function playBeat(): number {
  const noteMs = 150
  // Two bars of a bouncy arpeggio so the performance loop is actually visible.
  const notes = [
    523.25, 659.25, 783.99, 1046.5, // C5 E5 G5 C6
    783.99, 659.25, 587.33, 659.25, // G5 E5 D5 E5
    523.25, 659.25, 783.99, 1046.5, // C5 E5 G5 C6
    987.77, 783.99, 659.25, 523.25, // B5 G5 E5 C5
  ]
  const totalMs = Math.round(notes.length * noteMs + 200)
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const now = ctx.currentTime
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = f
      const start = now + i * (noteMs / 1000)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + noteMs / 1000)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + noteMs / 1000 + 0.02)
    })
    setTimeout(() => ctx.close(), totalMs + 200)
  } catch {
    /* audio not available — ignore, but still drive the animation */
  }
  return totalMs
}
