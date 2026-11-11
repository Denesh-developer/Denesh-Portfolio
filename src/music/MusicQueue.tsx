import { useMusic } from './MusicContext'

/** "Up next" — the manual queue, with remove + clear. Metadata only (localStorage). */
export function MusicQueue() {
  const { queue, removeFromQueue, clearQueue, playSong } = useMusic()

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-[8px] flex shrink-0 items-center justify-between px-[2px]">
        <h3 className="font-satoshi text-[11px] font-bold uppercase tracking-[1.4px] text-[#8a8375]">
          Up next
          {queue.length > 0 && (
            <span className="ml-[6px] rounded-full bg-black/[0.06] px-[7px] py-[1px] text-[10px] text-[#6b6456]">
              {queue.length}
            </span>
          )}
        </h3>
        {queue.length > 0 && (
          <button
            type="button"
            onClick={clearQueue}
            className="rounded-full px-[8px] py-[3px] font-satoshi text-[11px] font-semibold text-[#8a8375] transition-colors hover:bg-black/5 hover:text-[#a1465a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7aa88d]"
          >
            Clear
          </button>
        )}
      </div>

      {queue.length === 0 ? (
        <p className="px-[2px] font-satoshi text-[12px] leading-[1.5] text-[#b3a98f]">
          Queue is empty — tap the <span className="font-semibold">＋</span> on any track to line it up.
        </p>
      ) : (
        <ul className="flex min-h-0 flex-col gap-[1px] overflow-y-auto pr-[2px]">
          {queue.map((song, i) => (
            <li
              key={song.id + ':' + i}
              className="group flex items-center gap-[10px] rounded-[9px] px-[6px] py-[6px] transition-colors hover:bg-black/[0.045]"
            >
              <span className="w-[14px] shrink-0 text-center font-satoshi text-[11px] tabular-nums text-[#b3a98f]">
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => playSong(song, [song], 0)}
                className="flex min-w-0 flex-1 items-center gap-[9px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#7aa88d]"
                aria-label={`Play ${song.title}`}
              >
                <div className="relative h-[36px] w-[36px] shrink-0 overflow-hidden rounded-[7px] bg-[#e7e0d1]">
                  {song.artwork ? (
                    <img src={song.artwork} alt="" loading="lazy" className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[#b3a98f]">♪</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-satoshi text-[12px] font-semibold leading-tight text-[#2b2a28]">
                    {song.title}
                  </div>
                  <div className="truncate font-satoshi text-[10.5px] leading-tight text-[#8a8375]">
                    {song.artists.join(', ')}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => removeFromQueue(i)}
                aria-label={`Remove ${song.title} from queue`}
                className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[#8a8375] opacity-0 transition-[opacity,background-color,color] hover:bg-black/5 hover:text-[#a1465a] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7aa88d] group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
