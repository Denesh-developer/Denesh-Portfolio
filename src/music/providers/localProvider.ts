/**
 * Local provider: the catalogue is the handful of files in /public/music (see
 * onrepeat/onRepeatTracks.ts). No network at all. `search` filters that list so
 * the (legacy) search UI and the context's discovery shelf stay inert but valid.
 * Same-origin audio is CORS-safe, so the analyser (visualizer) can tap it.
 */
import type { MusicProvider, Song } from '../musicTypes'
import { REPEAT_SONGS } from '../onrepeat/onRepeatTracks'

export const localProvider: MusicProvider = {
  id: 'local',
  label: 'On repeat',
  previewOnly: false,
  corsAudio: true,
  async search(query: string): Promise<Song[]> {
    const q = query.trim().toLowerCase()
    if (!q) return REPEAT_SONGS
    return REPEAT_SONGS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artists.some((a) => a.toLowerCase().includes(q)),
    )
  },
  async resolveStream(song: Song): Promise<string | null> {
    return song.streamUrl ?? REPEAT_SONGS.find((s) => s.id === song.id)?.streamUrl ?? null
  },
}
