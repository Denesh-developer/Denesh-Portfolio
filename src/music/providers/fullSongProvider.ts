/**
 * OPTIONAL full-length provider — a Piped-compatible adapter (Piped is the
 * open-source YouTube API that Musify-style clients use). It is **inert by
 * default**: only active when VITE_FULLSONG_API_URL is set to a Piped-compatible
 * endpoint. Nothing here runs, and no network call is made, unless you opt in.
 *
 * ── Why it's opt-in and unverified ──────────────────────────────────────────
 * Musify streams FULL songs from YouTube. Tested from a real browser (2026):
 *   • YouTube's InnerTube API is CORS-blocked → cannot be called browser-direct.
 *   • Public Piped instances are CORS-enabled for search, but YouTube's anti-bot
 *     ("Sign in to confirm you're not a bot") currently breaks stream resolution
 *     on their datacenter IPs, so /streams returns 500.
 * There is therefore NO keyless, CORS-enabled, browser-direct endpoint that
 * reliably yields full commercial (incl. Tamil) audio today. This adapter exists
 * so that IF you point VITE_FULLSONG_API_URL at a working Piped-compatible API,
 * full songs light up automatically — with iTunes preview as the guaranteed
 * fallback. It intentionally adds no server/proxy of its own.
 *
 * Strategy (spec §7): iTunes is the metadata/search source; this resolves the
 * SAME track to a full stream by fuzzy-matching normalized title + artist
 * (Tamil-safe) + duration similarity.
 */
import type { FullSongProvider, ResolvedStream, Song } from '../musicTypes'

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {}
const BASE = env.VITE_FULLSONG_API_URL?.replace(/\/$/, '')

/** Normalize a title/artist for matching. Keeps Tamil (Unicode letters), drops
 *  punctuation, parentheticals, "(From ...)", "feat.", remix/OST tags. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ') // (From "..."), [Remix], etc.
    .replace(/\bfeat\.?.*$/i, ' ')
    .replace(/\b(official|video|audio|lyrical?|remix|ost|from|soundtrack|single)\b/gi, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // punctuation (Unicode-aware)
    .replace(/\s+/g, ' ')
    .trim()
}
function tokenSet(s: string): Set<string> {
  return new Set(normalize(s).split(' ').filter((w) => w.length > 1))
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let inter = 0
  for (const w of a) if (b.has(w)) inter++
  return inter / (a.size + b.size - inter)
}

interface PipedItem {
  url?: string
  title?: string
  uploaderName?: string
  uploader?: string
  duration?: number
}
interface PipedAudio {
  url: string
  bitrate?: number
  mimeType?: string
}

function videoId(item: PipedItem): string | null {
  if (!item.url) return null
  const m = item.url.match(/[?&]v=([\w-]{6,})/)
  return m ? m[1] : item.url.replace(/^\/(watch\?v=)?/, '').split(/[?&]/)[0] || null
}

async function resolveFull(song: Song, signal?: AbortSignal): Promise<ResolvedStream | null> {
  if (!BASE) return null
  // 1. find the same track on the full-song catalogue
  const q = `${song.title} ${song.artists[0] ?? ''}`.trim()
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}&filter=music_songs`, { signal })
  if (!res.ok) return null
  const data = (await res.json()) as { items?: PipedItem[] }
  const items = data.items ?? []
  if (!items.length) return null

  // 2. fuzzy-match by normalized title+artist (+ duration bonus)
  const target = tokenSet(`${song.title} ${song.artists.join(' ')}`)
  let best: PipedItem | null = null
  let bestScore = 0
  for (const it of items) {
    let score = jaccard(target, tokenSet(`${it.title ?? ''} ${it.uploaderName ?? it.uploader ?? ''}`))
    if (song.duration && it.duration && Math.abs(song.duration - it.duration) <= 5) score += 0.2
    if (score > bestScore) {
      bestScore = score
      best = it
    }
  }
  if (!best || bestScore < 0.3) return null // not confident → let iTunes preview handle it
  const id = videoId(best)
  if (!id) return null

  // 3. resolve the actual audio stream
  const sres = await fetch(`${BASE}/streams/${id}`, { signal })
  if (!sres.ok) return null
  const sdata = (await sres.json()) as { audioStreams?: PipedAudio[] }
  const audio = (sdata.audioStreams ?? []).slice().sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0]
  return audio?.url ? { url: audio.url, kind: 'full', source: 'piped' } : null
}

/** Null unless VITE_FULLSONG_API_URL is configured → the full-song path is fully off. */
export const fullProvider: FullSongProvider | null = BASE
  ? { id: 'piped', label: 'Full song', resolveFull }
  : null
