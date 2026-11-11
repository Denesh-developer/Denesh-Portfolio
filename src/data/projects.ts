/**
 * Content for the interactive board cards.
 *  - "build-innovate" (Works) is a project case study (placeholder copy).
 *  - "vinnora" (Experience) is a work-history TIMELINE, not a single case
 *    study: when `timeline` is present the modal renders the timeline layout.
 */
export type TimelineEntry = {
  company: string
  role: string
  /** Human date range, e.g. "Sep 2025 — Present". */
  period: string
  kind: 'Full-time' | 'Internship' | 'Freelance'
  /** One-line summary. DRAFT copy below — confirm/replace. */
  summary: string
  /** Marks the current role (highlighted marker + "Present" badge). */
  current?: boolean
}

export type Project = {
  id: string
  name: string
  tagline: string
  role: string
  year: string
  placeholder: boolean
  summary: string
  highlights: string[]
  image: string
  /** When set, the modal renders a work-history timeline instead of a case study. */
  timeline?: TimelineEntry[]
}

export const projects: Record<string, Project> = {
  'build-innovate': {
    id: 'build-innovate',
    name: 'CheyyarHub',
    tagline: 'Hyper-local Community Platform',
    role: 'Full-Stack & Android Developer',
    year: '2025',
    placeholder: false,
    summary:
      'A hyper-local social network platform built for the Cheyyar community featuring Google Authentication, live feeds, user stories, cloud media uploads, and companion Android client.',
    highlights: [
      'Google Authentication & Real-time Feeds powered by Firebase',
      'Media uploads & asset delivery with Cloudinary',
      'Companion native Android client for mobile community access',
      'Live in production on Vercel at cheyyar-hub.vercel.app',
    ],
    image: '/assets/works.svg',
  },
  'cheyyar-3d': {
    id: 'cheyyar-3d',
    name: 'Cheyyar 3D Town',
    tagline: 'Browser-based 3D Multiplayer Game',
    role: 'Creator & 3D Game Developer',
    year: '2025',
    placeholder: false,
    summary:
      'A browser-based 3D multiplayer open-world exploration game of Cheyyar featuring iconic local landmarks, drivable vehicles, collectible coins, and real-time multiplayer sync via Firebase.',
    highlights: [
      'Explorable 3D model of Cheyyar town with bus stand and I-MAX theatre lobby',
      'Interactive gameplay with box office ticketing, drivable vehicles, and coin points',
      'Real-time online multiplayer powered by Firebase Realtime Database',
      'Live in production on Vercel at cheyyar-3d.vercel.app',
    ],
    image: '/assets/works.svg',
  },
  vinnora: {
    id: 'vinnora',
    name: 'Experience',
    tagline: 'Work history',
    role: 'May 2026 — Present · System Admin & Dev',
    year: 'Present',
    placeholder: false,
    summary:
      'My journey across enterprise system administration at Voltech Engineers and indie web & mobile application engineering.',
    highlights: [],
    image: '/assets/experience.svg',
    timeline: [
      {
        company: 'Voltech Engineers Private Limited',
        role: 'System Administrator',
        period: 'May 2026 — Present',
        kind: 'Full-time',
        current: true,
        summary: 'Overseeing IT infrastructure, server reliability, workstation provisioning, and network workflows.',
      },
      {
        company: 'Community Software Projects',
        role: 'Full-Stack & Android Developer',
        period: '2024 — Present',
        kind: 'Freelance',
        summary: 'Architected CheyyarHub social network, Cheyyar 3D Town multiplayer game, and CheyyarBus transit departure tracking app.',
      },
      {
        company: 'Adhiparasakthi College of Arts and Science',
        role: 'BCA (Computer Applications)',
        period: '2022 — 2025',
        kind: 'Full-time',
        summary: 'Graduated with 76% distinction; won 1st prize in Paper Presentation & Web Designing symposia.',
      },
    ],
  },
}
