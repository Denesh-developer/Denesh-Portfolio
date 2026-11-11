import { useMusic } from './MusicContext'
import { MusicControls } from './MusicControls'
import { MusicVisualizer } from './MusicVisualizer'

/** The "now playing" deck: cover, live visualizer, metadata, transport. */
export function MusicPlayer({ reducedMotion }: { reducedMotion: boolean }) {
  const { current, status, playbackError, currentKind, engine } = useMusic()
  const playing = status === 'playing'

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-[14px] border border-black/10 bg-[#e7e0d1] shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
        {current?.artwork ? (
          <img src={current.artwork} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[52px] text-[#c3b89b]">♪</div>
        )}
        {/* live visualizer strip along the bottom of the cover */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40px] bg-gradient-to-t from-black/45 to-transparent px-[8px] pb-[6px]">
          <MusicVisualizer engine={engine} playing={playing} reducedMotion={reducedMotion} />
        </div>
        {current && currentKind && (
          <span
            className={`absolute right-[8px] top-[8px] rounded-full px-[8px] py-[2px] font-satoshi text-[10px] font-semibold uppercase tracking-[0.5px] text-[#f6f1e7] ${
              currentKind === 'full' ? 'bg-[#3f7256]' : 'bg-black/55'
            }`}
          >
            {currentKind === 'full' ? 'Full song' : '30s preview'}
          </span>
        )}
      </div>

      <div className="min-h-[46px] text-center">
        {current ? (
          <>
            <div className="truncate font-aeonik text-[17px] font-bold text-[#2b2a28]">{current.title}</div>
            <div className="truncate font-satoshi text-[12px] text-[#6b6456]">
              {current.artists.join(', ')}
              {current.album ? ` · ${current.album}` : ''}
              {current.year ? ` · ${current.year}` : ''}
            </div>
          </>
        ) : (
          <div className="font-satoshi text-[13px] text-[#8a8375]">Pick a track to start the set.</div>
        )}
      </div>

      {playbackError && (
        <p className="rounded-[9px] bg-[#fff3f4] px-[10px] py-[7px] text-center font-satoshi text-[12px] text-[#a1465a]">
          {playbackError}
        </p>
      )}

      <MusicControls />

      {current?.sourceUrl && (
        <a
          href={current.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center font-satoshi text-[11px] text-[#8a8375] underline decoration-dotted underline-offset-2 hover:text-[#3f7256]"
        >
          View on Apple Music ↗
        </a>
      )}
    </div>
  )
}
