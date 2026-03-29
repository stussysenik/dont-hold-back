# DON'T HOLD BACK — Design Spec

## Purpose

A digital ritual — a minimal zen experience you bookmark and return to for years. The text "DON'T HOLD BACK" is a motivational touchstone: brief, potent, stays with you. Like a cigarette you reach for — not a spectacle, but a moment. Exportable as Instagram-ready vertical media.

## Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | RedwoodJS | React-based fullstack framework, single page |
| Creative canvas | p5.js (instance mode) | Canvas rendering, typography animation, breathing |
| Animation timeline | GSAP | Precise choreography for reveal sequences |
| Audio | Web Audio API | Synthesized singing bowl tone |
| Export (image) | Canvas `toDataURL()` / `toBlob()` | 1080×1920 PNG for Instagram Stories |
| Export (video) | CCapture.js or MediaRecorder API | ~5s MP4/WebM loop at 1080×1920 |
| Font | Instrument Serif (Google Fonts) | Serif, poetic, timeless |

## Visual Design

- **Canvas**: Full viewport, 9:16 portrait aspect ratio centered on desktop, full-screen on mobile
- **Background**: Deep black `#0A0A0A`
- **Text color**: Off-white cream `#F5F0EB`
- **Typography**: Instrument Serif, stacked vertically — "DON'T" / "HOLD" / "BACK" — each word on its own line, centered
- **Nothing else on screen** during the experience. Pure void + text.

## Experience Flow

### State 1: Waiting (Initial Load)

The canvas is a deep black void. At center, a subtle pulsing ring (thin stroke, cream-colored, opacity oscillating 0.15–0.35 on a ~3s cycle). This is the only element — a meditation focus point. No text, no instructions except the ring's silent invitation.

On mobile: the ring serves as the touch target.

### State 2: Holding (Ritual Gesture)

User presses and holds anywhere on the canvas. A thin circle begins to fill clockwise around the cursor/touch point over **2 seconds**. The fill uses the cream color at low opacity (~0.4).

- **Releasing early** resets the circle to empty — smooth ease-out back to nothing
- **Completing the 2-second hold** triggers the reveal

The irony is intentional: you must "hold" to unlock "don't hold back."

### State 3: Reveal (Animation)

The hold completes. Three things happen simultaneously:

1. **The pulsing ring** expands and fades to nothing (GSAP, ~0.5s)
2. **The singing bowl tone** plays — a warm, resonant synthesized tone, ~2 seconds, fading to silence
3. **The text reveal** begins via the active animation mode (see Animation Modes below)

### State 4: Ambient (Breathing)

The text is fully revealed. It lives on screen in a perpetual gentle breathing cycle:
- Opacity oscillates between **95% and 100%** on a **4-second sine wave** cycle
- No mouse/touch interaction. No parallax. No glow. Just breathing.
- This state persists until the user closes the tab or reloads.

Clicking/tapping during this state does nothing — the ritual is complete. The experience simply *is*.

## Animation Modes

Three reveal animations, selectable via hidden toggle. All animations target the same final state: three words, centered, fully opaque, at rest.

### Mode 1: Ink Bleed

Each word appears as if ink is bleeding onto paper. Implemented via p5.js noise-driven alpha masking:
- Each word starts fully transparent
- A noise-based mask expands outward from the word's center, revealing the text with organic, imperfect edges
- The mask settles into full opacity over ~2 seconds per word
- Words are staggered: "DON'T" starts at t=0, "HOLD" at t=0.6s, "BACK" at t=1.2s
- Total duration: ~3.2 seconds

### Mode 2: Single Breath

All three words appear together in one slow inhale:
- Text starts at opacity 0, scale 0.95
- Opacity rises 0→1 and scale 0.95→1.0 over **3 seconds** with a smooth ease-out curve
- No staggering — everything moves as one body
- The simplest, most zen option

### Mode 3: Vertical Cascade

Words fall into place one by one, like a haiku being read aloud:
- Each word starts 20px above its final position, at opacity 0
- Animates to final position with ease-out, opacity 0→1
- Staggered: "DON'T" at t=0, "HOLD" at t=0.8s, "BACK" at t=1.6s
- Each word's animation takes ~0.8s
- Total duration: ~2.4 seconds

## Audio: Singing Bowl Synthesis

Synthesized via Web Audio API — no external audio files.

- **Fundamental frequency**: ~220Hz (A3) — warm, grounding
- **Overtones**: Soft harmonics at 2x, 3x, 5x with decreasing amplitude
- **Envelope**: Instant attack, slow exponential decay over ~2 seconds
- **Implementation**: OscillatorNode(s) + GainNode with exponential ramp to zero
- **Triggered at**: The exact moment the 2-second hold completes

## Controls (Hidden)

Controls are invisible by default. They appear when the user:
- **Desktop**: Hovers the mouse within 60px of the bottom edge
- **Mobile**: Taps the bottom edge area

Controls fade in (0.3s) and auto-hide after **3 seconds** of no interaction.

### Toggle: Animation Mode
Three small dots or text labels (Ink / Breath / Cascade) — clicking switches the active mode. The next trigger uses the selected mode. Switching mode resets to State 1 (waiting).

### Export: Still Image
Button labeled "PNG" or a camera icon. Captures the current canvas state at **1080×1920** resolution and triggers a download. Only available during State 4 (ambient breathing).

### Export: Video Loop
Button labeled "MP4" or a video icon. Records **5 seconds** of the breathing state at 1080×1920 and triggers a download. Uses CCapture.js (frame-by-frame for consistent quality) or MediaRecorder API (simpler but variable quality).

## RedwoodJS Architecture

### Route Structure
Single route: `/` → `HomePage`

### Component Tree
```
HomePage
└── DontHoldBackExperience (main wrapper)
    ├── P5Canvas (p5.js instance mode, handles all rendering)
    ├── SingingBowl (Web Audio synthesis hook)
    ├── ExportControls (hidden panel, PNG + video export)
    └── ModeToggle (hidden panel, animation mode selector)
```

### Key Implementation Details

- **p5.js instance mode**: Create p5 sketch as a function, attach to a React ref. This avoids global namespace pollution and works within React's lifecycle.
- **GSAP integration**: GSAP timelines are created once and replayed on each trigger. They run alongside the p5 draw loop — GSAP handles easing/timing, p5 reads the animated values in its draw function.
- **State management**: Simple React state (`useState`/`useRef`) — no need for global state. States: `waiting`, `holding`, `revealing`, `breathing`. Current animation mode stored in state.
- **Font loading**: Preload Instrument Serif via `@fontsource/instrument-serif` or Google Fonts CSS link before mounting the canvas. Use p5's `textFont()` to render with it.
- **Responsive sizing**: Canvas always renders at 9:16 aspect ratio. On desktop, centered with black bars. On mobile portrait, full screen. Calculate dimensions on mount and resize.

## Export Specifications

| Property | Still (PNG) | Video (MP4/WebM) |
|----------|------------|-------------------|
| Resolution | 1080 × 1920 | 1080 × 1920 |
| Format | PNG (lossless) | WebM (or MP4 via MediaRecorder) |
| Duration | N/A | ~5 seconds (breathing loop) |
| Frame rate | N/A | 30fps |
| Content | Snapshot of breathing state | Loop of breathing cycle |

For export, the p5 canvas is temporarily resized to 1080×1920 (if not already), the frame is captured, then restored to viewport size.

## What This Is NOT

- Not a generative art piece — same experience every visit
- Not interactive after the reveal — no mouse effects, no gamification
- Not a spectacle — restraint is the design principle
- Not a splash page for something else — the experience IS the product
