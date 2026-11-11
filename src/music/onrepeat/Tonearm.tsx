type Props = {
  /** Arm down on the record (true) or lifted to its rest (false). */
  playing: boolean
  /** 0–1 through the track; the needle tracks inward as the song plays. */
  progress: number
}

/**
 * Turntable tonearm, positioned relative to a square turntable box whose side
 * is the CSS variable `--d` (the record's diameter). The pivot sits just off the
 * record's top-right; the arm hangs from it and swings clockwise onto the disc.
 * Angle 0 = straight down; ~8° rests beside the record, 30–46° rides the grooves
 * from the run-in to the label.
 */
export function Tonearm({ playing, progress }: Props) {
  const angle = playing ? 30 + 16 * Math.min(1, Math.max(0, progress)) : 8
  return (
    <div className="pointer-events-none absolute z-[3]" style={{ left: 'calc(var(--d) * 1.12)', top: 'calc(var(--d) * -0.02)' }} aria-hidden>
      {/* arm — rotates about the pivot (its top-centre) */}
      <div
        className="absolute transition-transform duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
        style={{
          left: 'calc(var(--d) * -0.011)',
          top: 0,
          width: 'calc(var(--d) * 0.022)',
          height: 'calc(var(--d) * 0.5)',
          transformOrigin: '50% 0',
          transform: `rotate(${angle}deg)`,
        }}
      >
        <div className="or-arm absolute inset-0 rounded-full shadow-[2px_3px_6px_rgba(0,0,0,0.25)]" />
        {/* headshell / cartridge */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-[3px] bg-[#232323] shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
          style={{ bottom: 'calc(var(--d) * -0.012)', width: 'calc(var(--d) * 0.04)', height: 'calc(var(--d) * 0.1)' }}
        >
          <div className="absolute inset-x-[25%] bottom-[10%] h-[18%] rounded-[1px] bg-[#8f8f8f]" />
        </div>
      </div>
      {/* pivot base (drawn last so it sits over the arm's root) */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_40%_35%,#6a6a6a,#2a2a2a_70%)] shadow-[0_10px_20px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,255,255,0.08)]"
        style={{ width: 'calc(var(--d) * 0.15)', height: 'calc(var(--d) * 0.15)' }}
      >
        <div className="absolute left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_40%_35%,#9a9a9a,#3b3b3b_75%)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
      </div>
    </div>
  )
}
