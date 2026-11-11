import moviesData from './movies.json'

/**
 * "From my watchlist" — crime & thriller recommendations, opened from the
 * Netflix sticker. CONTENT lives in `movies.json` (edit that file to change the
 * list, reasons, OTT and posters). This module types + exposes it.
 */

export type Movie = {
  id: string
  title: string
  year: string
  /** Must match a key in OTT_BADGES below. */
  ott: string
  /** Portrait poster in /assets/movies/ (~2:3). Missing → styled placeholder. */
  poster: string
  /** Short genre line, e.g. "Crime · Neo-noir". */
  tag: string
  /** Personal reason, shown beside the featured poster. */
  why: string
  /** Optional link to the title on the streaming service → "Watch on … ↗" button. */
  url?: string
}

/** Brand accent + logo per streaming service — drives the tag on the featured
 *  poster and the "streaming on" pill. `logo` is a transparent PNG in /public/assets/ott
 *  (trimmed + downsized copies of the uploaded brand files, shown on a white tag);
 *  services without one fall back to a
 *  coloured text chip. Add a service here before using it in movies.json. */
export const OTT_BADGES: Record<string, { label: string; bg: string; fg: string; logo?: string }> = {
  Netflix: { label: 'Netflix', bg: '#E50914', fg: '#ffffff', logo: '/assets/ott/netflix.png' },
  'Prime Video': { label: 'Prime Video', bg: '#00A8E1', fg: '#00121c', logo: '/assets/ott/prime-video.png' },
  JioHotstar: { label: 'JioHotstar', bg: '#0f1a4b', fg: '#ffffff', logo: '/assets/ott/jiohotstar.png' },
  SonyLIV: { label: 'SonyLIV', bg: '#111111', fg: '#ffffff' },
  'Apple TV+': { label: 'Apple TV+', bg: '#000000', fg: '#ffffff' },
  Theatre: { label: 'In theatres', bg: '#7aa88d', fg: '#ffffff' },
}

export const movies: Movie[] = (moviesData.movies ?? []) as Movie[]
