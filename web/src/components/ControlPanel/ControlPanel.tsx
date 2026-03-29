import { useState, useEffect, useRef, useCallback } from 'react'

import type { AnimationMode } from 'src/components/P5Canvas/P5Canvas'
import { useExportPNG, useExportVideo } from 'src/hooks/useExport'

interface ControlPanelProps {
  mode: AnimationMode
  onModeChange: (mode: AnimationMode) => void
  getCanvas: () => HTMLCanvasElement | undefined
  experienceState: React.MutableRefObject<string>
}

const MODES: { key: AnimationMode; label: string }[] = [
  { key: 'ink', label: 'Ink' },
  { key: 'breath', label: 'Breath' },
  { key: 'cascade', label: 'Cascade' },
]

const ControlPanel = ({
  mode,
  onModeChange,
  getCanvas,
  experienceState,
}: ControlPanelProps) => {
  const [visible, setVisible] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exportPNG = useExportPNG()
  const exportVideo = useExportVideo()

  const showControls = useCallback(() => {
    setVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setVisible(false), 3000)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY > window.innerHeight - 60) {
        showControls()
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch && touch.clientY > window.innerHeight - 80) {
        showControls()
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchstart', handleTouchStart)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [showControls])

  const canExport = experienceState.current === 'breathing'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
        zIndex: 10,
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: 8,
        padding: '8px 16px',
        border: '1px solid rgba(245, 240, 235, 0.08)',
      }}
      onMouseEnter={showControls}
    >
      {/* Mode toggle */}
      {MODES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onModeChange(key)}
          style={{
            background: 'none',
            border: 'none',
            color: mode === key ? '#F5F0EB' : 'rgba(245, 240, 235, 0.3)',
            fontFamily: 'Instrument Serif, serif',
            fontSize: 14,
            cursor: 'pointer',
            padding: '4px 8px',
            transition: 'color 0.2s ease',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </button>
      ))}

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 16,
          background: 'rgba(245, 240, 235, 0.12)',
        }}
      />

      {/* Export buttons */}
      <button
        onClick={() => canExport && exportPNG(getCanvas())}
        style={{
          background: 'none',
          border: 'none',
          color: canExport ? 'rgba(245, 240, 235, 0.5)' : 'rgba(245, 240, 235, 0.15)',
          fontFamily: 'Instrument Serif, serif',
          fontSize: 13,
          cursor: canExport ? 'pointer' : 'default',
          padding: '4px 8px',
          transition: 'color 0.2s ease',
        }}
      >
        PNG
      </button>
      <button
        onClick={() => canExport && exportVideo(getCanvas())}
        style={{
          background: 'none',
          border: 'none',
          color: canExport ? 'rgba(245, 240, 235, 0.5)' : 'rgba(245, 240, 235, 0.15)',
          fontFamily: 'Instrument Serif, serif',
          fontSize: 13,
          cursor: canExport ? 'pointer' : 'default',
          padding: '4px 8px',
          transition: 'color 0.2s ease',
        }}
      >
        MP4
      </button>
    </div>
  )
}

export default ControlPanel
