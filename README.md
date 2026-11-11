# Deneshraja Nedunchezhian — Portfolio Board

An interactive scrapbook / infinite-canvas personal portfolio for **Deneshraja Nedunchezhian (Deneshraja N)** — Full-Stack Developer, Android Developer, and System Administrator.

- **Developer:** Deneshraja Nedunchezhian ([GitHub](https://github.com/Denesh-developer) · [LinkedIn](https://www.linkedin.com/in/deneshraja-n-a28666304))
- **Key Projects:** CheyyarHub, CheyyarBus, Personal Matrix Portfolio, HackTech
- **Stack:** Vite + React 18 + TypeScript + Tailwind CSS v4 + Framer Motion + React Zoom Pan Pinch

## Getting Started

```bash
npm install
npm run dev      # Start dev server on http://localhost:5173
npm run build    # Typecheck + production build to dist/
npm run preview  # Preview the production build
```

## How it works

An interactive, Figma-style board. The composition is authored on a fixed
**1440 × 1470** coordinate space, centered inside a larger virtual canvas
(`src/board/constants.ts`) so there is empty grid to pan into.

- **Pan / zoom** (`react-zoom-pan-pinch`) — wheel/trackpad zoom, pinch zoom,
  drag-empty-space to pan, spacebar+drag to pan anywhere. `BoardViewport`
  hosts the `TransformWrapper`; the CSS grid lives on `BoardCanvas` so it
  pans/zooms with the board.
- **Draggable stickers** (`BoardItem`) — scale-compensated pointer dragging
  (framer-motion motion values), a click-vs-drag threshold, bring-to-front,
  and `stopPropagation` so dragging a sticker never pans the board.
- **Fixed UI** — the dock (`Dock`) and zoom controls (`ZoomControls`) live
  outside the transform, so they never scale.
- **Project cards** open an accessible modal (`ProjectModal`, focus-trapped,
  Escape to close) and zoom-to the card, restoring the prior view on close.
- **Workflow** is fully layered (`src/components/workflow/`, `src/data/workflowItems.ts`):
  individual high-res sticker assets, **live DOM text** for every title /
  description / annotation, and **SVG** connector arrows — sharp at any zoom.
- **Frame animation engine** (`FrameAnimation`) is built and wired, but the
  character **frame sequences do not exist yet** — see below. Characters show
  a subtle idle motion, not fake frames.
- **Data-driven** — all items live in `src/data/boardItems.ts`.

### Missing animation frames (drop-in ready)

`FrameAnimation` will animate as soon as these frames are exported (from Figma)
into `public/assets/` and added to the item's `frames[]` in `boardItems.ts`:

- **running:** `run-1, run-2, stop, turn, hi, return`
- **coding:** `typing, looking, smiling, wave-1, wave-2, typing-return`
- **dj:** `head-left, head-right, scratch, hand-up` (idle when music stopped)

### Fonts

- **Aeonik (trial)** — the hero typeface, self-hosted from `public/fonts/`
  (`@font-face` in `src/board.css`). Satoshi is kept as a fallback.
- **Satoshi** (Fontshare) and **Caveat / Dosis / Dekko / Baloo 2 /
  Edu SA Beginner** (Google Fonts) are loaded via CDN in `index.html`.

> The bundled Aeonik files are the **trial** version. Swap in your licensed
> Aeonik files (same filenames) before any public/commercial deployment.

## Scripts

- `node scripts/optimize-images.mjs` — regenerate WebP from any PNGs in
  `public/assets/` (originals are optimized to WebP; ~90% smaller).
- `node scripts/cdp-test.mjs` — drive the running dev server through the
  DevTools Protocol to smoke-test zoom/drag/modal/console (needs Edge running
  with `--remote-debugging-port=9222` and the dev server on :5173).

## Notes / possible follow-ups

- Export the character animation frames (listed above) to bring the characters
  to life.
- Replace the placeholder case-study copy in `src/data/projects.ts`.
- Fine-tune workflow hotspot rectangles in `src/data/workflowHotspots.ts`.
