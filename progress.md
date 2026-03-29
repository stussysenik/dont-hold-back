# Progress

> What's been built, what's been proven.

<br />

## v0.1.0 — The Foundation (2026-03-29)

The core ritual is alive.

### Done

- [x] **RedwoodJS scaffold** — project structure, routing, build pipeline
- [x] **p5.js canvas** — instance mode, 9:16 aspect ratio, centered on viewport
- [x] **State machine** — `waiting` > `holding` > `revealing` > `breathing`
- [x] **Pulsing ring** — meditation focus point, oscillating opacity on deep black
- [x] **Press & hold gesture** — 2-second arc fill, early release resets
- [x] **Spacebar support** — hold spacebar as alternative trigger
- [x] **Ink Bleed mode** — noise-driven per-character reveal with organic edges
- [x] **Single Breath mode** — simultaneous fade+scale, one slow inhale
- [x] **Vertical Cascade mode** — staggered word drop, haiku cadence
- [x] **Ambient breathing** — 4-second sine wave, 95-100% opacity cycle
- [x] **Singing bowl synthesis** — Web Audio API, 220Hz fundamental + overtones, exponential decay
- [x] **Hidden control panel** — hover bottom edge, auto-hide after 3s
- [x] **Mode toggle** — Ink / Breath / Cascade switching
- [x] **PNG export** — 1080x1920 still image download
- [x] **Video export** — MediaRecorder, 5-second WebM loop
- [x] **Instrument Serif** — Google Font, loaded via @fontsource
- [x] **Mobile viewport** — touch-action none, max-scale 1

### Verified via Chrome DevTools

| Test | Status |
|------|--------|
| Waiting state (black canvas + pulsing ring) | Pass |
| Ink Bleed reveal > breathing | Pass |
| Single Breath reveal > breathing | Pass |
| Vertical Cascade reveal > breathing | Pass |
| Controls panel rendering | Pass |
| Spacebar hold > full flow | Pass |
| Font loading (Instrument Serif) | Pass |
| Zero console errors | Pass |

### Known Limitations

- Touch hold gesture (mobile) untested on physical devices
- Video export produces WebM (not MP4) — some platforms prefer MP4
- No service worker / offline support yet
- Audio requires user gesture to initialize (browser policy, by design)
