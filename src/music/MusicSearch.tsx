import { memo, useEffect, useRef, useState } from 'react'
import { useMusic } from './MusicContext'
import type { Song } from './musicTypes'

/** A single result/library row. Memoized so the 4×/s playhead updates never
 *  reconcile long lists (its props only change per-track / per-favourite). */
export const SongRow = memo(function SongRow({
  song,
  active,
  playing,
  isFav,
  onPlay,
  onFav,
  onQueue,
}: {
  song: Song
  active: boolean
  playing: boolean
  isFav: boolean
  onPlay: () => void
  onFav: () => void
  onQueue?: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-song-row
      onClick={onPlay}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPlay()
        }
      }}
      className={`group flex cursor-pointer items-center gap-[10px] rounded-[10px] px-[8px] py-[6px] text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7aa88d] ${
        active ? 'bg-[#7aa88d]/14' : 'hover:bg-black/[0.045]'
      }`}
    >
      <div className="relative h-[44px] w-[44px] shrink-0 overflow-hidden rounded-[7px] bg-[#e7e0d1]">
        {song.artwork ? (
          <img src={song.artwork} alt="" loading="lazy" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#b3a98f]">♪</div>
        )}
        {active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-[#f6f1e7]">
            {playing ? (
              <span className="flex items-end gap-[2px]">
                <span className="h-[10px] w-[2px] animate-[dj-eq_0.7s_ease-in-out_infinite] bg-current" />
                <span className="h-[14px] w-[2px] animate-[dj-eq_0.7s_ease-in-out_infinite_0.2s] bg-current" />
                <span className="h-[8px] w-[2px] animate-[dj-eq_0.7s_ease-in-out_infinite_0.4s] bg-current" />
              </span>
            ) : (
              <span className="text-[12px]">❚❚</span>
            )}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className={`truncate font-satoshi text-[13px] font-semibold ${active ? 'text-[#3f7256]' : 'text-[#2b2a28]'}`}>
          {song.title}
        </div>
        <div className="truncate font-satoshi text-[11px] text-[#8a8375]">
          {song.artists.join(', ')}
          {song.album ? ` · ${song.album}` : ''}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-[2px] opacity-70 transition-opacity group-hover:opacity-100">
        {onQueue && (
          <button
            type="button"
            title="Add to queue"
            aria-label={`Add ${song.title} to queue`}
            onClick={(e) => {
              e.stopPropagation()
              onQueue()
            }}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-[#5f594e] hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7aa88d]"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M4 6h11v2H4zm0 4h11v2H4zm0 4h7v2H4zm13-4h2v4h4v2h-4v4h-2v-4h-4v-2h4z" />
            </svg>
          </button>
        )}
        <button
          type="button"
          title={isFav ? 'Unfavourite' : 'Favourite'}
          aria-label={isFav ? `Remove ${song.title} from favourites` : `Add ${song.title} to favourites`}
          aria-pressed={isFav}
          onClick={(e) => {
            e.stopPropagation()
            onFav()
          }}
          className={`flex h-[30px] w-[30px] items-center justify-center rounded-full hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7aa88d] ${
            isFav ? 'text-[#a1465a]' : 'text-[#5f594e]'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 21s-7.5-4.9-10-9.2C.6 9.1 1.7 5.9 5 5.2 7 4.8 9 5.9 12 8.6 15 5.9 17 4.8 19 5.2c3.3.7 4.4 3.9 3 6.6C19.5 16.1 12 21 12 21z" />
          </svg>
        </button>
      </div>
    </div>
  )
})

/** A reusable list of SongRows wired to the player. */
export function SongList({ songs }: { songs: Song[] }) {
  const { current, status, playSong, toggleFavorite, isFavorite, enqueue } = useMusic()
  return (
    <div className="flex flex-col gap-[2px]">
      {songs.map((song, i) => (
        <SongRow
          key={song.id + ':' + i}
          song={song}
          active={current?.id === song.id}
          playing={status === 'playing'}
          isFav={isFavorite(song.id)}
          onPlay={() => playSong(song, songs, i)}
          onFav={() => toggleFavorite(song)}
          onQueue={() => enqueue(song)}
        />
      ))}
    </div>
  )
}

/** Search box (Enter to search + 400ms debounce) and its results. */
export function MusicSearch() {
  const { query, runSearch, results, searching, searchError } = useMusic()
  const [text, setText] = useState(query)
  const debounce = useRef<number | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => window.clearTimeout(debounce.current), [])

  const submit = (v: string) => {
    window.clearTimeout(debounce.current)
    runSearch(v)
  }
  const onChange = (v: string) => {
    setText(v)
    window.clearTimeout(debounce.current)
    debounce.current = window.setTimeout(() => runSearch(v), 400)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[10px]">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(text)
        }}
        className="relative shrink-0"
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-[#8a8375]"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          type="search"
          inputMode="search"
          lang="ta"
          placeholder="Search songs, artists, albums…"
          aria-label="Search songs, artists, albums"
          className="w-full rounded-[11px] border border-black/10 bg-white/80 py-[10px] pl-[36px] pr-[12px] font-satoshi text-[13px] text-[#2b2a28] outline-none placeholder:text-[#9a927f] focus:border-[#7aa88d] focus:ring-2 focus:ring-[#7aa88d]/25"
        />
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto pr-[2px]">
        {searching ? (
          <p className="px-[8px] py-[10px] font-satoshi text-[12px] text-[#8a8375]">Searching…</p>
        ) : searchError ? (
          <div className="px-[8px] py-[10px]">
            <p className="font-satoshi text-[12px] text-[#a1465a]">{searchError}</p>
            <button
              type="button"
              onClick={() => submit(text)}
              className="mt-[6px] rounded-[8px] border border-[#2b2a28]/25 px-[10px] py-[5px] font-satoshi text-[12px] font-semibold text-[#2b2a28] hover:bg-black/5"
            >
              Retry
            </button>
          </div>
        ) : results.length ? (
          <SongList songs={results} />
        ) : query.trim() ? (
          <p className="px-[8px] py-[10px] font-satoshi text-[12px] text-[#8a8375]">
            No results. Try another search.
          </p>
        ) : (
          <p className="px-[8px] py-[10px] font-satoshi text-[12px] text-[#8a8375]">
            Try “Anirudh”, “A R Rahman”, “Aasa Kooda”, or “தமிழ் பாடல்கள்”.
          </p>
        )}
      </div>
    </div>
  )
}
