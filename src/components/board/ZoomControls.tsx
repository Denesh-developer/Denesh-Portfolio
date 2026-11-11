import { useBoard } from '../../board/BoardContext'

const btn =
  'w-[30px] h-[30px] border-0 rounded-[8px] bg-transparent text-[20px] leading-none text-[#e8f5ee] cursor-pointer hover:bg-white/10 transition-colors'
// `zc-text` kept as a hook for the cdp-*.mjs verification scripts.
const text =
  'zc-text border-0 bg-transparent py-[6px] px-[8px] rounded-[8px] text-[12px] font-semibold text-[#e8f5ee] cursor-pointer hover:bg-white/10 transition-colors'

export function ZoomControls() {
  const { scalePct, zoomIn, zoomOut, fitContent } = useBoard()
  return (
    <div
      className="fixed right-[16px] bottom-[18px] z-[1000] flex items-center gap-[4px] py-[5px] px-[7px] bg-[#0B1410]/85 backdrop-blur-md border border-[rgba(0,255,156,0.25)] rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      role="group"
      aria-label="Board zoom controls"
    >
      <button type="button" className={btn} onClick={zoomOut} aria-label="Zoom out">
        −
      </button>
      <span
        className="zc-pct min-w-[46px] text-center text-[12px] font-semibold text-[#00ff9c] tabular-nums"
        role="status"
        aria-live="polite"
        aria-label={`Zoom level ${scalePct} percent`}
      >
        {scalePct}%
      </span>
      <button type="button" className={btn} onClick={zoomIn} aria-label="Zoom in">
        +
      </button>
      <span className="w-px h-[20px] bg-white/15 mx-[2px]" aria-hidden />
      <button type="button" className={text} onClick={() => fitContent(400)} aria-label="Fit board to view">
        Fit
      </button>
      <button type="button" className={text} onClick={() => fitContent(400)} aria-label="Reset view">
        Reset
      </button>
    </div>
  )
}
