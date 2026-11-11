/**
 * Data-driven board layout. Coordinates are in the original Figma composition
 * space (0..1440 x 0..1470); the canvas applies the virtual-board offset.
 * Preserving these x/y keeps exact Figma fidelity.
 */
export type HoverPreset = 'lift' | 'tilt' | 'bounce' | 'glow' | 'none'

export type BoardItemType =
  | 'image'
  | 'text'
  | 'animated'
  | 'project'
  | 'workflow'
  | 'dock'
  | 'decorative'

export type FrameDefinition = {
  src: string
  duration: number
}

export type BoardItemConfig = {
  id: string
  type: BoardItemType
  x: number
  y: number
  width: number
  height?: number
  rotation?: number
  zIndex?: number
  draggable?: boolean
  interactive?: boolean
  hoverPreset?: HoverPreset
  src?: string
  alt?: string
  /** For type "project": key into the projects map. */
  projectId?: string
  /** For type "project": the hover tooltip label (e.g. "Open Works"). */
  openLabel?: string
  /** A longer, poetic note revealed on hover (wraps into a soft card). Use \n for a line break. */
  hoverNote?: string
  /** For type "animated": idle image shown when no frame sequence is playing. */
  idleFrame?: string
  /** For type "animated": optional frame sequence (currently none exist). */
  frames?: FrameDefinition[]
  /** For type "animated": which normalized character frame set to drive. */
  character?: 'coding' | 'running' | 'dj'
}

export const boardItems: BoardItemConfig[] = [
  // ---- Project / experience cards (draggable + clickable) ----
  // (The workflow is rendered by <WorkflowSection>, not as a board item.)
  {
    id: 'works',
    type: 'project',
    x: 152,
    y: 330,
    width: 204.74,
    height: 285.98,
    zIndex: 3,
    draggable: true,
    interactive: true,
    hoverPreset: 'lift',
    projectId: 'build-innovate',
    src: '/assets/works.svg',
    alt: 'Works — CheyyarHub, Cheyyar 3D Town, and featured projects. Open case studies.',
  },
  {
    id: 'experience',
    type: 'project',
    x: 1108.3,
    y: 570,
    width: 335.3,
    height: 330.65,
    zIndex: 3,
    rotation: -10,
    draggable: true,
    interactive: true,
    hoverPreset: 'lift',
    projectId: 'vinnora',
    src: '/assets/experience.svg',
    alt: 'Experience — Voltech Engineers Private Limited. Open timeline.',
  },

  // ---- Character illustrations (normalized Figma frame sets; see characterAnimations.ts) ----
  // Dimensions follow each frame set's intrinsic aspect so `object-fit: contain`
  // fills the wrapper exactly (no letterbox, no per-frame reflow).
  {
    id: 'running',
    type: 'animated',
    character: 'running',
    x: 985,
    // Raised from 161: the normalized frame is taller (it reserves headroom for the
    // stand/Hi poses), so this keeps the grass platform near its original board Y
    // and clears the "this-is-fine" sticker below.
    y: 60,
    width: 400,
    height: 329, // 400 / (1200:988 aspect)
    zIndex: 4,
    draggable: true,
    // Click launches "Kesavan's Run"; dragging still moves the sticker (the
    // click-vs-drag threshold in BoardItem keeps the two from colliding).
    interactive: true,
    hoverPreset: 'none',
    openLabel: 'Play ▶',
    alt: "Play Denesh's Run — a pixel-art running mini game",
  },
  {
    id: 'coding',
    type: 'animated',
    character: 'coding',
    x: 363,
    y: 532,
    width: 300,
    height: 247, // 300 / (1000:823 aspect)
    zIndex: 4,
    draggable: true,
    hoverPreset: 'none',
    alt: 'Denesh coding at a desk — hover to say hi',
  },

  // ---- Fun stickers ----
  { id: 'this-is-fine', type: 'image', x: 700, y: 558, width: 100, height: 109.28, zIndex: 5, draggable: true, hoverPreset: 'bounce', src: '/assets/this-is-fine.svg', alt: 'This is fine sticker' },
  { id: 'keyboard', type: 'image', x: 453, y: 283, width: 100, height: 100, zIndex: 5, draggable: true, hoverPreset: 'tilt', src: '/assets/keyboard.webp', alt: 'Keyboard sticker' },
  { id: 'coffee', type: 'image', x: 666, y: 234, width: 100, height: 100, zIndex: 5, draggable: true, hoverPreset: 'lift', src: '/assets/coffee.webp', alt: 'Coffee fuel sticker' },
  { id: 'guitar', type: 'image', x: 884, y: 272, width: 100, height: 100, zIndex: 5, draggable: true, hoverPreset: 'tilt', src: '/assets/guitar.webp', alt: 'Guitar sticker' },
  { id: 'resume', type: 'image', x: 839.1, y: 550.5, width: 110, height: 110, rotation: 20, zIndex: 5, draggable: true, interactive: true, hoverPreset: 'lift', openLabel: 'View résumé ↗', src: '/assets/resume.svg', alt: 'Open my résumé (PDF)' },

  // ---- Personal easter-egg stickers ----
  // Winking-with-a-mug: hover reveals a poetic line about the coffee habit.
  {
    id: 'coffee-mug',
    type: 'image',
    x: 1306,
    y: 980,
    width: 242,
    height: 243,
    zIndex: 5,
    draggable: true,
    hoverPreset: 'lift',
    hoverNote: 'Some run on ambition.\nI run on coffee — the quiet co-author\nbehind every late-night build.',
    src: '/assets/Man_winking_holding_pixel_mug.svg',
    alt: 'Denesh winking with a coffee mug',
  },
  // SysAdmin life: hover labels it, click opens the modal.
  {
    id: 'law-student',
    type: 'image',
    x: -330,
    y: 920,
    width: 352,
    height: 454,
    zIndex: 5,
    draggable: true,
    interactive: true,
    hoverPreset: 'lift',
    openLabel: 'SysAdmin & Tech life',
    src: '/assets/denesh.svg',
    alt: 'Denesh the System Administrator — open to read about tech infrastructure life',
  },

  // Tic-tac-toe: a taped note doodle; click opens "One game before you go".
  // Sits beside the DJ, under its "Tic-tac-toe" title.
  {
    id: 'tictactoe',
    type: 'image',
    x: 1362,
    y: 1510,
    width: 136,
    height: 136,
    zIndex: 5,
    draggable: true,
    interactive: true,
    hoverPreset: 'lift',
    openLabel: 'One game before you go ▶',
    src: '/assets/tictactoe.svg',
    alt: 'Play one game of tic-tac-toe against me before you go',
  },
]
