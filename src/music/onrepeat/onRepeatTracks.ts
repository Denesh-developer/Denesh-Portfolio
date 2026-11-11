/**
 * "On repeat." — the four records on the wall. EDIT THIS FILE to change songs.
 *
 * Drop your files into /public/music/ and point `src` (audio) + `artwork`
 * (square cover, ~600×600 jpg/png/webp) at them. `card` is where the sleeve
 * sits on the desktop wall: left/top are % of the stage, `rotate` is its tilt.
 * Order here = play order (the wall loops back to the first record at the end).
 *
 * `highlights` (optional) marks YOUR favourite stretch(es) of a song on the seek
 * bar: `from`/`to` as "m:ss" (or plain seconds), plus a short `note`. Leave
 * out `to` for a single moment. Click a mark to jump there; the note shows while
 * the song is inside it.
 */
import type { Song } from '../musicTypes'

/** A favourite stretch of a song — drawn as a ♥ mark on the progress bar. */
export type Highlight = {
  /** Start, as "m:ss" or seconds. */
  from: string | number
  /** End, as "m:ss" or seconds. Omit for a single moment. */
  to?: string | number
  /** Why you love it — shown on hover and while it plays. */
  note?: string
}

/** "1:02" → 62 (plain numbers pass through). */
export const toSeconds = (v: string | number): number =>
  typeof v === 'number' ? v : v.split(':').reduce((acc, part) => acc * 60 + (Number(part) || 0), 0)

export type RepeatTrack = {
  id: string
  title: string
  artists: string[]
  album?: string
  /** Audio file under /public/music (mp3 / m4a / ogg). */
  src: string
  /** Square cover under /public/music. */
  artwork: string
  /** Desktop placement of the sleeve on the wall. */
  card: { left: number; top: number; rotate: number }
  /** Favourite part(s) of the song, marked on the seek bar. */
  highlights?: Highlight[]
}

/** Shown in the top pill: name, place and the clock (your time zone, not the visitor's). */
export const OWNER = {
  name: 'Deneshraja',
  place: 'Chennai', // e.g. 'Chennai'
  timeZone: 'Asia/Kolkata',
  tzLabel: 'IST',
  avatar: '/assets/denesh.jpg',
}

export const REPEAT_TRACKS: RepeatTrack[] = [
  {
    id: 'repeat-1',
    title: 'Thooriga ',
    artists: ['Karthik'],
    src: '/music/track-1.mp3',
    artwork: '/music/cover-1.jpg',
    card: { left: 4.5, top: 19, rotate: -6 },
    // Your favourite bits, e.g.:
    highlights: [
      { from: '1:30', to: '2:00' },
    ],
  },
  {
    id: 'repeat-2',
    title: 'Duppattawaali',
    artists: ['Justin Varghese'],
    src: '/music/track-2.mp3',
    artwork: '/music/cover-2.jpg',
    card: { left: 14, top: 50, rotate: 4 },
    highlights: [
      { from: '1:58', to: '3:00' },
    ],
  },
  {
    id: 'repeat-3',
    title: 'Minnalvala',
    artists: ['Jakes Bejoy'],
    src: '/music/track-3.mp3',
    artwork: '/music/cover-3.jpg',
    card: { left: 73.5, top: 16, rotate: 5 },
    highlights: [
      { from: '1:44', to: '2:20' },
    ],
  },
  {
    id: 'repeat-4',
    title: 'Neeyum Naanum',
    artists: ['Hiphop Tamizha'],
    src: '/music/track-4.mp3',
    artwork: '/music/cover-4.jpg',
    card: { left: 66, top: 76, rotate: -5 },
    highlights: [
      { from: '1:48', to: '2:20' },
    ],
  },
]

/** Adapt a wall record to the player's normalized Song (see musicTypes.ts). */
export const toSong = (t: RepeatTrack): Song => ({
  id: t.id,
  title: t.title,
  artists: t.artists,
  album: t.album,
  artwork: t.artwork,
  streamUrl: t.src,
  source: 'local',
})

export const REPEAT_SONGS: Song[] = REPEAT_TRACKS.map(toSong)
