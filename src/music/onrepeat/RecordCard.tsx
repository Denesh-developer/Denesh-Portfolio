import type { CSSProperties } from 'react'
import { Vinyl } from './Vinyl'
import type { RepeatTrack } from './onRepeatTracks'

type Props = {
  track: RepeatTrack
  /** This record is on the turntable (its disc has left the sleeve). */
  current: boolean
  playing: boolean
  onPick: (track: RepeatTrack) => void
}

/**
 * A record sleeve pinned to the wall, with its disc peeking out to the right.
 * On desktop each card is placed absolutely (see the CSS vars set below and
 * consumed by the md: utilities); on small screens they flow in a grid. Picking
 * the current record's sleeve pulls the disc out (it's on the turntable), so a
 * faded disc doubles as the "now playing" marker.
 */
export function RecordCard({ track, current, playing, onPick }: Props) {
  const vars = {
    '--l': `${track.card.left}%`,
    '--t': `${track.card.top}%`,
    '--r': `${track.card.rotate}deg`,
  } as CSSProperties
  return (
    <button
      type="button"
      onClick={() => onPick(track)}
      aria-label={`${current ? (playing ? 'Now playing' : 'On the turntable') : 'Play'}: ${track.title} — ${track.artists.join(', ')}`}
      aria-pressed={current}
      style={vars}
      className={`group relative w-full cursor-pointer rounded-[8px] border-0 bg-transparent p-0 text-left outline-none md:absolute md:left-[var(--l)] md:top-[var(--t)] md:w-[clamp(150px,18.5vw,300px)] focus-visible:[box-shadow:0_0_0_3px_#7aa88d] ${
        current ? 'z-[2]' : 'z-[1]'
      }`}
    >
      {/* disc peeking from the sleeve */}
      <Vinyl
        className={`absolute left-[24%] top-[7%] h-[92%] w-[92%] transition-[opacity,transform] duration-500 ease-out ${
          current ? 'opacity-0 -translate-x-[8%] scale-90' : 'opacity-100 group-hover:translate-x-[3%]'
        }`}
        spinning={false}
      />
      {/* sleeve */}
      <div className="relative z-[1] rotate-[var(--r)] bg-[#f4f0e7] p-[4%] shadow-[0_18px_34px_-10px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.12)] transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-[6px] group-hover:shadow-[0_26px_44px_-12px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.12)] motion-reduce:transition-none">
        <img
          src={track.artwork}
          alt=""
          draggable={false}
          className="block aspect-square w-full object-cover [-webkit-user-drag:none]"
        />
      </div>
      {/* caption (hover / focus / current) */}
      <span
        className={`pointer-events-none absolute left-1/2 top-full mt-[10px] -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[2px] text-[#555] transition-opacity duration-200 ${
          current ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
        }`}
      >
        {current ? (playing ? '● now spinning' : '○ on the turntable') : track.title}
      </span>
    </button>
  )
}
