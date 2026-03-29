import { useRef, useCallback } from 'react'

/**
 * Synthesizes a singing bowl tone using Web Audio API.
 * Fundamental at 220Hz (A3) with soft overtones at 2x, 3x, 5x.
 * Instant attack, exponential decay over ~2 seconds.
 */
export const useSingingBowl = () => {
  const ctxRef = useRef<AudioContext | null>(null)

  const init = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }
  }, [])

  const play = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    // Harmonics: fundamental + overtones
    const harmonics = [
      { freq: 220, gain: 0.25 },   // fundamental A3
      { freq: 440, gain: 0.12 },   // 2nd harmonic
      { freq: 660, gain: 0.06 },   // 3rd harmonic
      { freq: 1100, gain: 0.03 },  // 5th harmonic
    ]

    // Master gain for overall envelope
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(1, now)
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5)
    masterGain.connect(ctx.destination)

    harmonics.forEach(({ freq, gain: level }) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)
      gainNode.gain.setValueAtTime(level, now)

      osc.connect(gainNode)
      gainNode.connect(masterGain)

      osc.start(now)
      osc.stop(now + 3)
    })
  }, [])

  return { play, init }
}
