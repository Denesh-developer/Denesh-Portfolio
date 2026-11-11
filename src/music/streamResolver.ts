/**
 * Resolves a playable stream for a track, preferring a FULL-length source when
 * one is configured (see providers/fullSongProvider.ts) and always falling back
 * to the iTunes 30-second PREVIEW. The returned `kind` drives the FULL/PREVIEW
 * label in the UI so a preview is never mislabelled as a full song.
 *
 * By default (no VITE_FULLSONG_API_URL) `fullProvider` is null, so this is just
 * the iTunes preview path — identical to the shipped behaviour.
 */
import { itunesProvider } from './providers/itunesProvider'
import { fullProvider } from './providers/fullSongProvider'
import type { ResolvedStream, Song } from './musicTypes'

export const fullSongEnabled = !!fullProvider

export async function resolveStream(song: Song, signal?: AbortSignal): Promise<ResolvedStream | null> {
  // 0. Local records (the "On repeat." wall) are complete files served from /public.
  if (song.source === 'local') return song.streamUrl ? { url: song.streamUrl, kind: 'full', source: 'local' } : null
  // 1. Try the optional full-length provider (never lets a failure block playback).
  if (fullProvider) {
    try {
      const full = await fullProvider.resolveFull(song, signal)
      if (full?.url) return full
    } catch {
      /* fall through to preview */
    }
  }
  // 2. iTunes preview (the reliable, always-available default).
  const url = await itunesProvider.resolveStream(song)
  return url ? { url, kind: 'preview', source: 'itunes' } : null
}
