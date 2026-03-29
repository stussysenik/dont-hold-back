import { useCallback } from 'react'

const EXPORT_WIDTH = 1080
const EXPORT_HEIGHT = 1920

/**
 * Exports the canvas as a PNG still at 1080x1920 (Instagram Stories).
 * Redraws the current breathing state onto an offscreen canvas at export resolution.
 */
export const useExportPNG = () => {
  const exportPNG = useCallback((sourceCanvas: HTMLCanvasElement | undefined) => {
    if (!sourceCanvas) return

    const offscreen = document.createElement('canvas')
    offscreen.width = EXPORT_WIDTH
    offscreen.height = EXPORT_HEIGHT
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    // Draw the source canvas scaled to export resolution
    ctx.drawImage(sourceCanvas, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT)

    offscreen.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dont-hold-back-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [])

  return exportPNG
}

/**
 * Records ~5 seconds of the canvas as a WebM video at 1080x1920.
 * Uses MediaRecorder API with canvas.captureStream().
 */
export const useExportVideo = () => {
  const exportVideo = useCallback((sourceCanvas: HTMLCanvasElement | undefined) => {
    if (!sourceCanvas) return

    // Check MediaRecorder support
    if (typeof MediaRecorder === 'undefined') {
      alert('Video export is not supported in this browser.')
      return
    }

    const stream = sourceCanvas.captureStream(30)
    const chunks: Blob[] = []

    // Try webm first, fall back to whatever the browser supports
    let mimeType = 'video/webm'
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        alert('Video export format not supported in this browser.')
        return
      }
    }

    const recorder = new MediaRecorder(stream, { mimeType })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      const ext = mimeType.includes('webm') ? 'webm' : 'mp4'
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dont-hold-back-${Date.now()}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    }

    recorder.start()

    // Record for 5 seconds (one breathing cycle + margin)
    setTimeout(() => {
      recorder.stop()
    }, 5000)
  }, [])

  return exportVideo
}
