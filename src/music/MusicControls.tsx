import { useMusic } from './MusicContext'

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function Icon({ path, size = 20 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={path} />
    </svg>
  )
}
const P = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
  prev: 'M6 6h2v12H6zm3.5 6 8.5 6V6z',
  next: 'M16 6h2v12h-2zM6 18l8.5-6L6 6z',
  heart: 'M12 21s-7.5-4.9-10-9.2C.6 9.1 1.7 5.9 5 5.2 7 4.8 9 5.9 12 8.6 15 5.9 17 4.8 19 5.2c3.3.7 4.4 3.9 3 6.6C19.5 16.1 12 21 12 21z',
  vol: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z',
  mute: 'M3 9v6h4l5 5V4L7 9H3zm18-2-1.4-1.4L17 8.2 14.4 5.6 13 7l2.6 2.6L13 12.2l1.4 1.4L17 11l2.6 2.6L21 12l-2.6-2.6L21 7z',
}

/** Transport row: prev / play-pause / next, seek, volume, favourite. */
export function MusicControls() {
  const {
    status,
    current,
    currentTime,
    duration,
    volume,
    muted,
    togglePlay,
    next,
    prev,
    seekTo,
    setVolume,
    toggleMute,
    toggleFavorite,
    isFavorite,
  } = useMusic()

  const playing = status === 'playing'
  const loading = status === 'loading'
  const disabled = !current
  const fav = current ? isFavorite(current.id) : false

  const btn =
    'flex items-center justify-center rounded-full text-[#2b2a28] transition-colors hover:bg-black/5 disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]'

  return (
    <div className="flex w-full flex-col gap-[10px]">
      {/* seek */}
      <div className="flex items-center gap-[10px]">
        <span className="w-[38px] shrink-0 text-right font-satoshi text-[11px] tabular-nums text-[#8a8375]">
          {fmt(currentTime)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 30}
          step={0.1}
          value={Math.min(currentTime, duration || 30)}
          onChange={(e) => seekTo(Number(e.target.value))}
          disabled={disabled}
          aria-label="Seek"
          className="dj-range h-[4px] flex-1 cursor-pointer disabled:cursor-default"
        />
        <span className="w-[38px] shrink-0 font-satoshi text-[11px] tabular-nums text-[#8a8375]">
          {fmt(duration)}
        </span>
      </div>

      {/* transport */}
      <div className="flex items-center justify-center gap-[6px]">
        <button type="button" className={`${btn} h-[38px] w-[38px]`} onClick={prev} disabled={disabled} aria-label="Previous">
          <Icon path={P.prev} />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          disabled={disabled}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#2b2a28] text-[#f6f1e7] transition-transform hover:scale-[1.04] active:scale-95 disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7aa88d]"
        >
          {loading ? (
            <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-[#f6f1e7]/40 border-t-[#f6f1e7]" />
          ) : (
            <Icon path={playing ? P.pause : P.play} size={24} />
          )}
        </button>
        <button type="button" className={`${btn} h-[38px] w-[38px]`} onClick={next} disabled={disabled} aria-label="Next">
          <Icon path={P.next} />
        </button>
      </div>

      {/* volume + favourite */}
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          className={`${btn} h-[30px] w-[30px]`}
          onClick={toggleMute}
          disabled={disabled}
          aria-label={muted ? 'Unmute' : 'Mute'}
          aria-pressed={muted}
        >
          <Icon path={muted ? P.mute : P.vol} size={18} />
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Volume"
          className="dj-range h-[4px] w-[92px] cursor-pointer"
        />
        <div className="flex-1" />
        <button
          type="button"
          className={`${btn} h-[32px] w-[32px] ${fav ? 'text-[#a1465a] hover:bg-[#a1465a]/10' : ''}`}
          onClick={() => current && toggleFavorite(current)}
          disabled={disabled}
          aria-pressed={fav}
          aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Icon path={P.heart} size={19} />
        </button>
      </div>
    </div>
  )
}
