import { useEffect, useRef, useCallback, useState } from 'react'

import gsap from 'gsap'
import p5 from 'p5'

import ControlPanel from 'src/components/ControlPanel/ControlPanel'
import { useSingingBowl } from 'src/hooks/useSingingBowl'

type ExperienceState = 'waiting' | 'holding' | 'revealing' | 'breathing'
export type AnimationMode = 'ink' | 'breath' | 'cascade'

const BG_COLOR = '#0A0A0A'
const TEXT_COLOR = '#F5F0EB'
const HOLD_DURATION = 2000 // ms
const WORDS = ['DON\'T', 'HOLD', 'BACK']

const P5Canvas = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5 | null>(null)
  const stateRef = useRef<ExperienceState>('waiting')
  const modeRef = useRef<AnimationMode>('ink')
  const holdStartRef = useRef<number>(0)
  const holdProgressRef = useRef<number>(0)
  const holdPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const fontLoadedRef = useRef<boolean>(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  // Animation state driven by GSAP
  const animRef = useRef({
    wordOpacities: [0, 0, 0],
    wordScales: [1, 1, 1],
    wordOffsets: [0, 0, 0],
    bleedProgress: [0, 0, 0],
    ringScale: 1,
    ringOpacity: 1,
    breathingOpacity: 1,
  })

  const [mode, setMode] = useState<AnimationMode>('ink')
  const { play: playSingingBowl, init: initAudio } = useSingingBowl()

  const resetAnimState = useCallback(() => {
    const a = animRef.current
    a.wordOpacities = [0, 0, 0]
    a.wordScales = [1, 1, 1]
    a.wordOffsets = [0, 0, 0]
    a.bleedProgress = [0, 0, 0]
    a.ringScale = 1
    a.ringOpacity = 1
    a.breathingOpacity = 1
  }, [])

  const startReveal = useCallback(() => {
    stateRef.current = 'revealing'
    playSingingBowl()

    const a = animRef.current
    if (timelineRef.current) {
      timelineRef.current.kill()
    }

    const tl = gsap.timeline({
      onComplete: () => {
        stateRef.current = 'breathing'
      },
    })

    // Ring dissolve
    tl.to(a, { ringScale: 3, ringOpacity: 0, duration: 0.5, ease: 'power2.out' }, 0)

    const currentMode = modeRef.current

    if (currentMode === 'ink') {
      // Ink bleed: stagger bleedProgress 0→1
      tl.to(a.bleedProgress, { 0: 1, duration: 2, ease: 'power1.inOut' }, 0.1)
      tl.to(a.bleedProgress, { 1: 1, duration: 2, ease: 'power1.inOut' }, 0.7)
      tl.to(a.bleedProgress, { 2: 1, duration: 2, ease: 'power1.inOut' }, 1.3)
    } else if (currentMode === 'breath') {
      // Single breath: all together
      tl.to(a.wordOpacities, { 0: 1, 1: 1, 2: 1, duration: 3, ease: 'power2.out' }, 0.2)
      tl.to(a.wordScales, { 0: 1, 1: 1, 2: 1, duration: 3, ease: 'power2.out' }, 0.2)
      // Start scales from 0.95
      a.wordScales = [0.95, 0.95, 0.95]
    } else if (currentMode === 'cascade') {
      // Vertical cascade: staggered
      for (let i = 0; i < 3; i++) {
        a.wordOffsets[i] = -20
        tl.to(a.wordOpacities, { [i]: 1, duration: 0.8, ease: 'power2.out' }, 0.2 + i * 0.8)
        tl.to(a.wordOffsets, { [i]: 0, duration: 0.8, ease: 'power2.out' }, 0.2 + i * 0.8)
      }
    }

    timelineRef.current = tl
  }, [playSingingBowl])

  const handleModeChange = useCallback((newMode: AnimationMode) => {
    setMode(newMode)
    modeRef.current = newMode
    stateRef.current = 'waiting'
    holdProgressRef.current = 0
    resetAnimState()
    if (timelineRef.current) {
      timelineRef.current.kill()
      timelineRef.current = null
    }
  }, [resetAnimState])

  const getCanvasRef = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (p5Ref.current as any)?.drawingContext?.canvas as HTMLCanvasElement | undefined
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    // Wait for font to load
    document.fonts.ready.then(() => {
      fontLoadedRef.current = true
    })

    const sketch = (p: p5) => {
      let canvasW = 0
      let canvasH = 0

      const calcSize = () => {
        const aspect = 9 / 16
        if (window.innerHeight / window.innerWidth > 16 / 9) {
          canvasW = window.innerWidth
          canvasH = canvasW / aspect
        } else {
          canvasH = window.innerHeight
          canvasW = canvasH * aspect
        }
      }

      p.setup = () => {
        calcSize()
        const canvas = p.createCanvas(canvasW, canvasH)
        canvas.parent(containerRef.current!)
        canvas.style('display', 'block')
        canvas.style('margin', '0 auto')
        p.textFont('Instrument Serif')
        p.textAlign(p.CENTER, p.CENTER)
        p.noStroke()

        // Test API for Chrome DevTools verification
        ;(window as any).__DHB = {
          getState: () => stateRef.current,
          triggerReveal: () => {
            initAudio()
            holdPosRef.current = { x: canvasW / 2, y: canvasH / 2 }
            startReveal()
          },
          reset: () => {
            stateRef.current = 'waiting'
            holdProgressRef.current = 0
            resetAnimState()
            if (timelineRef.current) {
              timelineRef.current.kill()
              timelineRef.current = null
            }
          },
          setMode: (m: string) => {
            modeRef.current = m as AnimationMode
          },
        }
      }

      p.windowResized = () => {
        calcSize()
        p.resizeCanvas(canvasW, canvasH)
      }

      p.draw = () => {
        p.background(BG_COLOR)

        if (!fontLoadedRef.current) return

        const state = stateRef.current
        const a = animRef.current
        const cx = canvasW / 2
        const cy = canvasH / 2

        // Text sizing relative to canvas
        const fontSize = canvasW * 0.18
        const lineHeight = fontSize * 1.4

        if (state === 'waiting') {
          drawWaitingRing(p, cx, cy, canvasW)
        } else if (state === 'holding') {
          drawWaitingRing(p, cx, cy, canvasW)
          drawHoldCircle(p, canvasW)
        } else if (state === 'revealing') {
          const currentMode = modeRef.current

          if (currentMode === 'ink') {
            drawInkBleed(p, cx, cy, fontSize, lineHeight, a, canvasW)
          } else if (currentMode === 'breath') {
            drawBreath(p, cx, cy, fontSize, lineHeight, a)
          } else if (currentMode === 'cascade') {
            drawCascade(p, cx, cy, fontSize, lineHeight, a)
          }

          // Fading ring
          if (a.ringOpacity > 0.01) {
            const ringR = 20 * (canvasW / 400) * a.ringScale
            p.noFill()
            p.stroke(245, 240, 235, a.ringOpacity * 255 * 0.3)
            p.strokeWeight(1)
            p.ellipse(cx, cy, ringR * 2, ringR * 2)
            p.noStroke()
          }
        } else if (state === 'breathing') {
          // Breathing: 4-second sine wave, 95–100% opacity
          const breathCycle = p.sin(p.frameCount * p.TWO_PI / (4 * 60))
          const opacity = 0.95 + 0.05 * breathCycle
          a.breathingOpacity = opacity

          p.fill(245, 240, 235, opacity * 255)
          p.textSize(fontSize)
          for (let i = 0; i < WORDS.length; i++) {
            const y = cy + (i - 1) * lineHeight
            p.text(WORDS[i], cx, y)
          }
        }
      }

      // --- Drawing helpers ---

      const drawWaitingRing = (p: p5, cx: number, cy: number, cw: number) => {
        const pulseOpacity = 0.15 + 0.20 * (0.5 + 0.5 * p.sin(p.frameCount * 0.02))
        const ringR = 20 * (cw / 400)
        p.noFill()
        p.stroke(245, 240, 235, pulseOpacity * 255)
        p.strokeWeight(1)
        p.ellipse(cx, cy, ringR * 2, ringR * 2)
        p.noStroke()
      }

      const drawHoldCircle = (p: p5, cw: number) => {
        const now = p.millis()
        const elapsed = now - holdStartRef.current
        let progress = Math.min(elapsed / HOLD_DURATION, 1)

        // Smooth the progress for display
        holdProgressRef.current = progress

        if (progress >= 1) {
          startReveal()
          return
        }

        const hx = holdPosRef.current.x
        const hy = holdPosRef.current.y
        const radius = 25 * (cw / 400)

        p.noFill()
        p.stroke(245, 240, 235, 0.4 * 255)
        p.strokeWeight(2)
        p.arc(hx, hy, radius * 2, radius * 2, -p.HALF_PI, -p.HALF_PI + progress * p.TWO_PI)
        p.noStroke()
      }

      const drawInkBleed = (
        p: p5,
        cx: number,
        cy: number,
        fontSize: number,
        lineHeight: number,
        a: typeof animRef.current,
        cw: number
      ) => {
        // For each word, use noise-based reveal
        p.textSize(fontSize)

        for (let i = 0; i < WORDS.length; i++) {
          const progress = a.bleedProgress[i]
          if (progress <= 0) continue

          const y = cy + (i - 1) * lineHeight

          // Create offscreen buffer for this word if needed
          // Simplified ink bleed: use noise to modulate opacity per-character
          // and overall word opacity fades in with organic timing
          const noiseScale = 0.008 * (cw / 400)
          const word = WORDS[i]

          for (let c = 0; c < word.length; c++) {
            const charX = cx - p.textWidth(word) / 2 + p.textWidth(word.substring(0, c)) + p.textWidth(word[c]) / 2
            // Noise-based threshold for each character
            const n = p.noise(charX * noiseScale, y * noiseScale, progress * 3)
            // Character appears when noise value falls below progress threshold
            const charOpacity = Math.max(0, Math.min(1, (progress - (1 - n)) * 4))

            if (charOpacity > 0) {
              // Add slight blur effect via multiple draws at decreasing opacity
              const blurAmount = Math.max(0, 1 - progress * 1.5)

              if (blurAmount > 0.1) {
                // Fuzzy edge phase
                p.fill(245, 240, 235, charOpacity * 0.3 * 255)
                p.text(word[c], charX + p.random(-1, 1) * blurAmount * 2, y + p.random(-1, 1) * blurAmount * 2)
              }

              p.fill(245, 240, 235, charOpacity * 255)
              p.text(word[c], charX, y)
            }
          }
        }
      }

      const drawBreath = (
        p: p5,
        cx: number,
        cy: number,
        fontSize: number,
        lineHeight: number,
        a: typeof animRef.current
      ) => {
        for (let i = 0; i < WORDS.length; i++) {
          const opacity = a.wordOpacities[i]
          const scale = a.wordScales[i]
          if (opacity <= 0) continue

          const y = cy + (i - 1) * lineHeight
          p.fill(245, 240, 235, opacity * 255)
          p.textSize(fontSize * scale)
          p.text(WORDS[i], cx, y)
        }
      }

      const drawCascade = (
        p: p5,
        cx: number,
        cy: number,
        fontSize: number,
        lineHeight: number,
        a: typeof animRef.current
      ) => {
        p.textSize(fontSize)
        for (let i = 0; i < WORDS.length; i++) {
          const opacity = a.wordOpacities[i]
          const offset = a.wordOffsets[i]
          if (opacity <= 0) continue

          const y = cy + (i - 1) * lineHeight + offset
          p.fill(245, 240, 235, opacity * 255)
          p.text(WORDS[i], cx, y)
        }
      }

      // --- Input handlers ---

      p.mousePressed = () => {
        initAudio()
        if (stateRef.current === 'waiting') {
          stateRef.current = 'holding'
          holdStartRef.current = p.millis()
          holdPosRef.current = { x: p.mouseX, y: p.mouseY }
        }
        return false
      }

      p.mouseReleased = () => {
        if (stateRef.current === 'holding') {
          stateRef.current = 'waiting'
          holdProgressRef.current = 0
        }
        return false
      }

      p.keyPressed = () => {
        // Spacebar as alternative trigger — press to start hold, release to cancel
        if (p.keyCode === 32) {
          initAudio()
          if (stateRef.current === 'waiting') {
            stateRef.current = 'holding'
            holdStartRef.current = p.millis()
            holdPosRef.current = { x: canvasW / 2, y: canvasH / 2 }
          }
          return false
        }
      }

      p.keyReleased = () => {
        if (p.keyCode === 32 && stateRef.current === 'holding') {
          stateRef.current = 'waiting'
          holdProgressRef.current = 0
          return false
        }
      }

      // p5 touch handlers — cast to any to bypass incomplete type defs
      ;(p as any).touchStarted = () => {
        initAudio()
        if (stateRef.current === 'waiting' && p.touches.length > 0) {
          stateRef.current = 'holding'
          holdStartRef.current = p.millis()
          const touch = p.touches[0] as { x: number; y: number }
          holdPosRef.current = { x: touch.x, y: touch.y }
        }
        return false // prevent default
      }

      ;(p as any).touchEnded = () => {
        if (stateRef.current === 'holding') {
          stateRef.current = 'waiting'
          holdProgressRef.current = 0
        }
        return false
      }
    }

    const instance = new p5(sketch)
    p5Ref.current = instance

    return () => {
      instance.remove()
      p5Ref.current = null
    }
  }, [startReveal, initAudio])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BG_COLOR,
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <div ref={containerRef} />
      <ControlPanel
        mode={mode}
        onModeChange={handleModeChange}
        getCanvas={getCanvasRef}
        experienceState={stateRef}
      />
    </div>
  )
}

export default P5Canvas
