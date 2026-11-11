import worksData from './works.json'

/**
 * Works gallery + case studies. CONTENT lives in `works.json` (edit that file).
 * This module types + exposes it.
 */

export type MetaItem = { label: string; value: string }
export type NamedCard = { title: string; body: string }

export type CaseStudyBlock =
  | { type: 'section'; heading: string; body: string }
  | { type: 'cards'; variant: 'challenge' | 'outcome'; heading?: string; body?: string; cards: NamedCard[] }
  | { type: 'insight'; body: string }
  | { type: 'hmw'; eyebrow: string; question: string; note?: string }
  | { type: 'solution'; label: string; title: string; body: string; image?: string }
  | { type: 'reflection'; eyebrow: string; body: string; statement: string }

export type CaseStudy = {
  title: string
  hero: string[]
  meta: MetaItem[]
  intro: string
  goal: string
  blocks: CaseStudyBlock[]
}

export type WorkProject = {
  id: string
  /** Card index label, e.g. "01". */
  index: string
  /** Card date label, e.g. "2024" or "2022 TO PRESENT". */
  period: string
  title: string
  description: string
  /** Small label shown on the card by default (e.g. "Product Design"). */
  category: string
  /** Status/skill chips shown by default at the bottom of the card. */
  tags: string[]
  /** Marker color (hex) for the hover highlight note, e.g. "#a7d1f2". */
  highlight: string
  /** Handwritten note that animates in (over `highlight`) on card hover. "" hides it. */
  note: string
  featured: boolean
  placeholder: boolean
  caseStudy: CaseStudy
}

export const workProjects: WorkProject[] = (worksData.projects ?? []) as unknown as WorkProject[]
