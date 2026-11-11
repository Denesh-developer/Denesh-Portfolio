import { useMusic } from './MusicContext'
import { SongList } from './MusicSearch'

/** Tamil Picks / Recently Played / Favourites — all reuse the shared SongList. */
export function MusicLibrary({ tab }: { tab: 'picks' | 'recent' | 'favorites' }) {
  const { picks, picksLoading, recent, favorites } = useMusic()

  if (tab === 'picks') {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto pr-[2px]">
        {picksLoading ? (
          <p className="px-[8px] py-[10px] font-satoshi text-[12px] text-[#8a8375]">Loading Tamil picks…</p>
        ) : picks.length ? (
          <SongList songs={picks} />
        ) : (
          <p className="px-[8px] py-[10px] font-satoshi text-[12px] text-[#8a8375]">
            Couldn’t load picks. Try a search instead.
          </p>
        )}
      </div>
    )
  }

  const songs = tab === 'recent' ? recent : favorites
  const empty =
    tab === 'recent'
      ? 'Nothing played yet — search and hit play to fill this up.'
      : 'No favourites yet — tap the heart on any track.'

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pr-[2px]">
      {songs.length ? (
        <SongList songs={songs} />
      ) : (
        <p className="px-[8px] py-[10px] font-satoshi text-[12px] text-[#8a8375]">{empty}</p>
      )}
    </div>
  )
}
