/**
 * iTunes Search API provider — the default for "Kesavan's DJ Booth".
 *
 * WHY THIS ONE (verified from a real browser origin, not just a README):
 *  - Responds with `Access-Control-Allow-Origin: *` → the browser can fetch it
 *    DIRECTLY. No server, no proxy, no API key, no account.
 *  - Tamil Unicode queries work without transliteration (e.g. "தமிழ் பாடல்கள்").
 *  - Broad Indian/Tamil catalogue (Anirudh, A. R. Rahman, Ilaiyaraaja, …).
 *  - 30-second AAC previews stream in an <audio> element, and the preview CDN
 *    (audio-ssl.itunes.apple.com) ALSO sends CORS `*`, so a real Web Audio
 *    AnalyserNode visualizer works (corsAudio: true).
 *
 * Limitation: previews are 30s (Apple does not expose full tracks) — acceptable
 * per the spec ("playable audio OR preview URLs"). The provider is isolated
 * behind the MusicProvider interface so it can be swapped in one line later.
 */
import type { MusicProvider, Song } from '../musicTypes'

interface ItunesTrack {
  trackId?: number
  trackName?: string
  artistName?: string
  collectionName?: string
  artworkUrl100?: string
  artworkUrl60?: string
  previewUrl?: string
  trackViewUrl?: string
  releaseDate?: string
  trackTimeMillis?: number
  kind?: string
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {}
const API_BASE = env.VITE_MUSIC_API_URL || 'https://itunes.apple.com/search'
// Storefront — "IN" gives the best Tamil/Indian coverage; override via env if desired.
const COUNTRY = env.VITE_MUSIC_COUNTRY || 'IN'
const LIMIT = 24

/** iTunes artwork comes at 100×100; bump the size token for a crisp cover. */
function upscaleArtwork(url?: string): string | undefined {
  if (!url) return undefined
  return url.replace(/\/\d+x\d+bb\./, '/300x300bb.')
}

function toSong(t: ItunesTrack): Song | null {
  if (!t.trackId || !t.previewUrl) return null // must be playable
  return {
    id: String(t.trackId),
    title: t.trackName ?? 'Unknown',
    artists: t.artistName ? [t.artistName] : [],
    album: t.collectionName,
    artwork: upscaleArtwork(t.artworkUrl100) ?? t.artworkUrl60,
    duration: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : undefined,
    year: t.releaseDate ? t.releaseDate.slice(0, 4) : undefined,
    streamUrl: t.previewUrl,
    source: 'itunes',
    sourceUrl: t.trackViewUrl,
  }
}

async function searchItunes(query: string, signal?: AbortSignal): Promise<Song[]> {
  const q = query.trim()
  if (!q) return []
  const url =
    `${API_BASE}?term=${encodeURIComponent(q)}` +
    `&media=music&entity=song&limit=${LIMIT}&country=${encodeURIComponent(COUNTRY)}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`iTunes ${res.status}`)
  const data = (await res.json()) as { results?: ItunesTrack[] }
  const songs: Song[] = []
  for (const t of data.results ?? []) {
    const s = toSong(t)
    if (s) songs.push(s)
  }
  return songs
}

export const itunesProvider: MusicProvider = {
  id: 'itunes',
  label: 'Apple Music preview',
  previewOnly: true,
  corsAudio: true,
  search: searchItunes,
  async resolveStream(song: Song): Promise<string | null> {
    // Prefer the URL we already have; if a stored/favorited track lacks one (or it
    // has gone stale), re-resolve by searching for the same track and matching id.
    if (song.streamUrl) return song.streamUrl
    try {
      const results = await searchItunes(`${song.title} ${song.artists[0] ?? ''}`)
      const match = results.find((r) => r.id === song.id) ?? results[0]
      return match?.streamUrl ?? null
    } catch {
      return null
    }
  },
}
