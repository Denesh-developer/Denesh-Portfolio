# Works screenshots

Drop your project screenshots here, then reference them from `src/data/works.json`.

- Reference with a **leading slash**, e.g. `/assets/works/vinnora-hero.webp`
- Formats: `.webp` (smallest), `.png`, or `.jpg`
- Two places per project use images:
  - `caseStudy.hero`: an array — **1 image** = full-width banner, **2 images** = side-by-side (only the first 2 are shown). Best aspect ~16:9 / 16:10, ~1600px wide.
  - each `caseStudy.blocks[]` of `type: "solution"` has an `"image"` field shown beside its text (renders ~200px tall, `object-cover`, any aspect).
- Leave `hero: []` or `image: ""` to show the neutral "SCREENSHOT" placeholder frame.

Suggested naming: `<project-id>-hero.webp`, `<project-id>-<label>.webp`
(e.g. `vinnora-hero.webp`, `vinnora-architecture.webp`).
