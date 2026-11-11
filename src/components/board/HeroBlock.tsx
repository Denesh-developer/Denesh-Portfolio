/**
 * Static hero text of the composition (heading + role pill). Feature titles
 * ("Works", "Experience", "On repeat"…) live in BoardLabels / data/featureLabels.
 * Rendered in composition coordinates and pointer-transparent so the board can
 * be panned by dragging over them. Not draggable (per spec).
 */

export function HeroBlock() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden={false}>
      {/* Logo is rendered as a fixed viewport overlay (see BoardViewport), not here. */}
      <h1
        className="absolute font-aeonik font-bold text-[42px] leading-none tracking-[-0.6px] text-white whitespace-nowrap"
        style={{ left: 490, top: 400 }}
      >
        From Concept To Code.
      </h1>

      <div
        className="absolute flex items-center justify-center px-[14px] bg-[#0B1A12] border border-solid border-[#00ff9c]/50 rounded-[8px] shadow-[0_4px_20px_rgba(0,255,156,0.2)] text-[#00ff9c] font-satoshi font-medium text-[15px] whitespace-nowrap"
        style={{ left: 468, top: 455, width: 495, height: 40 }}
      >
        Full-Stack Developer • Android Engineer • System Administrator
      </div>

    </div>
  )
}
