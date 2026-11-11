/**
 * Active music provider selection. The whole app talks to `provider` through the
 * MusicProvider interface (musicTypes.ts) — swapping catalogues later is a
 * one-line change here, with ZERO impact on the UI or the audio engine.
 *
 * No server, no proxy, no key: the browser calls the public provider directly
 * (see providers/itunesProvider.ts for why iTunes satisfies that).
 */
import { localProvider } from './providers/localProvider'
import type { MusicProvider } from './musicTypes'

// "On repeat." plays the four local records in /public/music (see
// onrepeat/onRepeatTracks.ts). The iTunes provider is still here
// (providers/itunesProvider.ts) if a searchable catalogue is ever wanted again.
export const provider: MusicProvider = localProvider

/** Seed queries for the "Tamil Picks" discovery shelf (real results, no autoplay). */
export const DISCOVERY_QUERY = 'Tamil hits'
