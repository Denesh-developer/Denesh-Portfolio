/**
 * Layered workflow reconstruction. All coordinates are LOCAL to the workflow
 * section (origin = board 98,698), matching the original Figma layout.
 * Stickers are individual high-res assets; titles/descriptions/annotations are
 * live DOM text; connectors are SVG. Nothing here is a flattened screenshot.
 */
export const WORKFLOW_ORIGIN = { x: 80, y: 800 }
export const WORKFLOW_W = 860
export const WORKFLOW_H = 759

/** Paper panel (Figma 43:4). */
export const WORKFLOW_PANEL = { x: 46, y: 67, w: 785, h: 530 }

export type WorkflowStep = {
  id: string
  step: number
  title: string
  asset: string
  x: number
  y: number
  w: number
  h: number
  /** live text block position (section-local) */
  labelX: number
  labelY: number
  labelWidth: number
  description?: string
  descLines?: string[]
  rotation?: number
  /** optional colored label plate behind the text (for steps whose sticker has none) */
  plate?: { color: string; x: number; y: number; w: number; h: number }
  /** seat the text centered inside the sticker's OWN baked-in colored panel
   *  (idea/automate/deploy/monitor). Section-local box; nothing is rendered —
   *  it only constrains + centers the live text so it never spills off the note. */
  labelBox?: { x: number; y: number; w: number; h: number; padL?: number; padR?: number }
  /** per-step font overrides (px) for panels too small for the defaults */
  headingSize?: number
  descSize?: number
}

export const workflowSteps: WorkflowStep[] = [
  {
    id: 'idea',
    step: 1,
    title: 'IDEA',
    asset: '/assets/workflow/idea.webp',
    x: 161,
    y: 125,
    w: 93,
    h: 165,
    labelX: 184,
    labelY: 190,
    // small clockwise tilt to match the sticky note (positive = clockwise)
    rotation: -6,
    // heading stays anchored beside the baked-in lightbulb; narrower width keeps
    // the description from spilling past the note's right edge (panel right ≈ 235)
    labelWidth: 55,
    description: 'Understand the problem and the users.',
  },
  {
    id: 'plan',
    step: 2,
    title: 'PLAN',
    asset: '/assets/workflow/plan.webp',
    x: 377,
    y: 110,
    w: 120,
    h: 120,
    labelX: 416,
    labelY: 142,
    labelWidth: 74,
    descLines: ['User research', 'User flows', 'Features', 'Architecture'],
  },
  {
    id: 'design',
    step: 3,
    title: 'DESIGN',
    asset: '/assets/workflow/design.webp',
    x: 598,
    y: 128,
    w: 100,
    h: 100,
    labelX: 540,
    labelY: 224,
    labelWidth: 92,
    description: 'Wireframes, UI design and prototype.',
    plate: { color: '#e5d5f5', x: 600, y: 218, w: 96, h: 44 },
  },
  {
    id: 'build',
    step: 4,
    title: 'BUILD',
    asset: '/assets/workflow/build.webp',
    x: 498,
    y: 284,
    w: 122,
    h: 100,
    labelX: 492,
    labelY: 344,
    labelWidth: 92,
    description: 'Clean, scalable and performant code.',
    plate: { color: '#7AA88D', x: 510, y: 370, w: 96, h: 44 },
  },
  {
    id: 'automate',
    step: 5,
    title: 'AUTOMATE',
    asset: '/assets/workflow/automate.webp',
    x: 341,
    y: 216,
    w: 112,
    h: 168,
    labelX: 344,
    labelY: 300,
    labelWidth: 84,
    description: 'AI workflows, integrations and process automation.',
    // green panel on the sticker ≈ x333..408, y300..335
    headingSize: 9,
    descSize:6, 
    labelBox: { x: 355, y: 320, w: 75, h: 35 },
  },
  {
    id: 'deploy',
    step: 6,
    title: 'DEPLOY',
    asset: '/assets/workflow/deploy.webp',
    x: 140,
    y: 280,
    w: 112,
    h: 154,
    labelX: 140,
    labelY: 312,
    labelWidth: 84,
    description: 'Deploy to the cloud and make it live.',
    // blue note on the sticker ≈ x140..211, y303..350
    labelBox: { x: 160, y: 374, w: 71, h: 47 },
    headingSize: 8,
    descSize: 6,
  },
  {
    id: 'monitor',
    step: 7,
    title: 'MONITOR',
    asset: '/assets/workflow/monitor.webp',
    x: 270,
    y: 419,
    w: 129,
    h: 117,
    labelX: 194,
    labelY: 457,
    labelWidth: 90,
    description: 'Monitor performance',
    // purple strip is short (≈ x156..233, y428..450) — smaller type keeps the
    // full copy on two lines inside the note instead of spilling below/right
    labelBox: { x: 296, y: 504, w: 77, h: 23, padL: 4, padR: 3 },
    headingSize: 8,
    descSize: 6,
  },
]

export type WorkflowDecor = {
  id: string
  kind: 'image' | 'svg'
  asset: string
  x: number
  y: number
  w: number
  h: number
  rotation?: number
  zIndex?: number
  alt: string
}

export const workflowDecor: WorkflowDecor[] = [
  { id: 'title-paper', kind: 'image', asset: '/assets/workflow/title-paper.webp', x: 0, y: 38, w: 140, h: 101, alt: '' },
  { id: 'tagline-note', kind: 'image', asset: '/assets/workflow/tagline.webp', x: 400, y: 427, w: 172, h: 121, alt: '' },
  { id: 'developer', kind: 'image', asset: '/assets/workflow/developer.webp', x: 584, y: 457, w: 83, h: 144, zIndex: 6, alt: 'Developer character' },
  { id: 'works-on-my-machine', kind: 'svg', asset: '/assets/workflow/works-on-my-machine.svg', x: 680, y: 530, w: 200, h: 100, zIndex: 6, alt: 'It works on my machine' },
]

export type WorkflowAnnotation = {
  id: string
  text: string
  x: number
  y: number
  rotation?: number
  size?: number
  align?: 'left' | 'center'
  color?: string
}

/** Handwritten (Caveat) annotations — live text, not baked into an image. */
export const workflowAnnotations: WorkflowAnnotation[] = [
  { id: 'start-here', text: 'Start\nHere', x: 226, y: 94, size: 10, align: 'center' },
  { id: 'plan-smart', text: 'Plan\nSmart', x: 515, y: 200, size: 10, align: 'center' },
  { id: 'make-beautiful', text: 'make it\nbeautiful', x: 728, y: 166, size: 10, color: '#0f0a16' },
  { id: 'focus-build', text: 'focus\n&\nbuild', x: 700, y: 310, size: 10, align: 'center', color: '#0f0a16' },
  { id: 'iterate', text: 'iterate.\nimprove.\nrepeat.', x: 230, y: 435, size: 10, align: 'center', color: '#0f0a16' },
  { id: 'work-smarter', text: 'Work\nSmarter\nwith AI', x: 281, y: 230, rotation: -8, size: 10, align: 'center', color: '#0f0a16' },
  { id: 'ship-it', text: 'ship it', x: 100, y: 248, size: 10, align: 'center', color: '#0f0a16' },
  { id: 'data-growth', text: 'data\ndriven\ngrowth', x: 100, y: 356, size: 10, align: 'center', color: '#0f0a16' },
]

export type WorkflowConnector = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  /** perpendicular curvature of the control point (px) */
  curve: number
}

/** Dashed hand-drawn arrows connecting the steps in sequence (SVG). */
export const workflowConnectors: WorkflowConnector[] = [
  { id: 'idea-plan', x1: 258, y1: 180, x2: 378, y2: 168, curve: -38 },
  { id: 'plan-design', x1: 496, y1: 160, x2: 596, y2: 168, curve: -29 },
  { id: 'design-build', x1: 664, y1: 270, x2: 632, y2: 320, curve: -22 },
  { id: 'build-automate', x1: 500, y1: 330, x2: 446, y2: 320, curve: -14 },
  { id: 'automate-deploy', x1: 339, y1: 288, x2: 240, y2: 320, curve: 30 },
  { id: 'deploy-monitor', x1: 190, y1: 432, x2: 270, y2: 490, curve: 40 },
]

/** Restored decorative doodles — exact Figma assets (SVG vectors + one PNG
 *  rocket). Positions are section-local (abs − 98,698). */
export type WorkflowDecoration = {
  id: string
  asset: string
  x: number
  y: number
  w: number
  h: number
  rotation?: number
  zIndex?: number
}

const DEC = '/assets/workflow/decorations'
export const workflowDecorations: WorkflowDecoration[] = [
  { id: 'rocket', asset: `${DEC}/rocket.webp`, x: 104, y: 250, w: 28, h: 28, zIndex: 5, rotation: 90 }, // 48:148 near "ship it"
  { id: 'heart-doodle', asset: `${DEC}/heart-doodle.svg`, x: 728, y: 188, w: 22, h: 22, zIndex: 5 }, // 47:93 near "make it beautiful"
  { id: 'arrow9', asset: `${DEC}/startherearrow.svg`, x: 230, y: 118, w: 12, h: 22, zIndex: 5 }, // 46:84 near IDEA/Start
  { id: 'underline-1', asset: `${DEC}/line1.svg`, x: 700, y: 344, w: 15, h: 3, zIndex: 5 }, // 47:119
  { id: 'underline-2', asset: `${DEC}/line2.svg`, x: 703, y: 346, w: 10, h: 2, zIndex: 5 }, // 47:121
  { id: 'mark-plan', asset: `${DEC}/vector6.svg`, x: 519, y: 222, w: 20, h: 7, zIndex: 5 }, // 47:91
  { id: 'mark-automate', asset: `${DEC}/vector6.svg`, x: 280, y: 264, w: 20, h: 7, zIndex: 5 }, // 48:154
  { id: 'mark-deploy', asset: `${DEC}/vector6.svg`, x: 100, y: 390, w: 20, h: 7, zIndex: 5 }, // 48:151
  { id: 'pin', asset: `${DEC}/pin.svg`, x: 53, y: 91, w: 17, h: 10, zIndex: 6, rotation: 16 }, // 47:93
]
