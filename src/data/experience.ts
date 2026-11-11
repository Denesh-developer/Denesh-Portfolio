import experienceData from './experience.json'

/**
 * Experience timeline. CONTENT lives in `experience.json` (edit that file to
 * update your work history). This module types + exposes it.
 */

export type ExperienceRole = {
  id: string
  company: string
  /** Logo in /assets/experience/. Empty string → the company name is shown instead. */
  logo: string
  role: string
  period: string
  /** Employment type (Full-time | Internship | Freelance) — shown beside the period. */
  kind?: string
  /** Optional skill/tech tags (kept grounded in each role's own description — never
   *  fabricated). Rendered only when present; add/edit them in experience.json. */
  tags?: string[]
  bullets: string[]
}

export const experienceRoles: ExperienceRole[] = (experienceData.roles ?? []) as ExperienceRole[]
