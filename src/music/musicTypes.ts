/**
 * Shared types for "Kesavan's DJ Booth". The React UI depends ONLY on these
 * normalized types — never on a provider's raw response shape — so the provider
 * (see musicProvider.ts) can be swapped without touching any component.
 */

export interface Song {
  id: string
  title: string
  artists: string[]
  album?: string
  artwork?: string
  /** Full-track seconds if the provider reports it (the player uses the audio
   *  element's own duration for the seek bar, which for previews is ~30s). */
  duration?: number
  language?: string
  year?: string | number
  /** Playable audio/preview URL (for iTunes this is a 30s preview). */
  streamUrl?: string
  /** Provider id, e.g. "itunes". */
  source: string
  /** Link to the track on the source (opens externally, never a download). */
  sourceUrl?: string
}

export interface MusicProvider {
  id: string
  label: string
  /** True if streams are 30s previews (for honest UI labelling). */
  previewOnly: boolean
  /** True if the audio CDN sends CORS headers → safe to tap it with a Web Audio
   *  AnalyserNode (real visualizer). If false, the visualizer degrades to a
   *  lightweight time-based animation and playback stays crossOrigin-free. */
  corsAudio: boolean
  /** Search the catalogue. `signal` lets the caller cancel a stale request. */
  search(query: string, signal?: AbortSignal): Promise<Song[]>
  /** Resolve a fresh playable URL for a song (re-resolves if a stored one is stale). */
  resolveStream(song: Song): Promise<string | null>
}

/** A resolved, playable stream + whether it's a full track or a short preview. */
export interface ResolvedStream {
  url: string
  kind: 'full' | 'preview'
  source: string
}

/**
 * An OPTIONAL full-length source (see providers/fullSongProvider.ts). It resolves
 * a full stream for a track already found via the search provider (iTunes). Kept
 * separate from MusicProvider so the whole full-song path is inert unless a
 * compatible endpoint is configured — the app never depends on it.
 */
export interface FullSongProvider {
  id: string
  label: string
  resolveFull(song: Song, signal?: AbortSignal): Promise<ResolvedStream | null>
}

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

/** A song plus the list it was played from, so next/prev can walk the list. */
export interface PlayContext {
  list: Song[]
  index: number
}
