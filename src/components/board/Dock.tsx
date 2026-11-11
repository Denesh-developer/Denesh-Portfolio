import { useBoard } from '../../board/BoardContext'

type DockProps = {
  aboutOpen: boolean
  onAboutOpen: () => void
  contactOpen: boolean
  onContactOpen: () => void
  avatarRef: React.RefObject<HTMLButtonElement>
}

// `dock-btn` is kept purely as a hook for the `::after` data-tip tooltip in
// board.css (attr() content can't be a utility); all visible styling is utilities.
const dockBtn =
  'dock-btn relative border-0 p-0 cursor-pointer focus-visible:[outline:2px_solid_#7aa88d] focus-visible:[outline-offset:3px] focus-visible:rounded-[8px]'

/** Fixed to the viewport (never scales with the canvas). The avatar opens the
 *  About modal; the icon buttons drive pan/zoom actions on the board. */
export function Dock({ aboutOpen, onAboutOpen, contactOpen, onContactOpen, avatarRef }: DockProps) {
  const { focusItem, openResume } = useBoard()

  return (
    <nav
      className="fixed left-1/2 bottom-[20px] -translate-x-1/2 z-[1000] flex items-center gap-[20px] pt-[8px] pr-[20px] pb-[8px] pl-[10px] bg-[#0B1410]/90 backdrop-blur-md border border-[rgba(0,255,156,0.25)] rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-[640px]:gap-[16px] max-[640px]:pr-[16px] max-[640px]:pl-[8px]"
      aria-label="Primary"
    >
      <button
        ref={avatarRef}
        type="button"
        // Keeps a 46px-tall footprint (so the bar height is unchanged) while the
        // transparent cutout below is anchored to the bottom and spills over the
        // bar's top edge — the head pops out and stands on the dock.
        className={`dock-avatar ${dockBtn} bg-transparent relative w-[80px] h-[32px] overflow-visible`}
        // Never let the press reach the board (no pan / no sticker drag).
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onAboutOpen}
        aria-label="Open About Me"
        aria-haspopup="dialog"
        aria-expanded={aboutOpen}
        data-tip="About"
      >
        <img
          src="/assets/avatar.svg"
          alt="Deneshraja N"
          draggable={false}
          className="absolute left-1/2 bottom-[-4px] w-[38px] h-[38px] rounded-full border-2 border-brand shadow-[0_2px_10px_rgba(0,0,0,0.18)] -translate-x-1/2 object-cover [-webkit-user-drag:none]"
        />
      </button>
      <span className="w-px h-[30px] bg-white/15" aria-hidden />
      <div className="flex gap-[22px]">
        <button
          type="button"
          className={`${dockBtn} bg-transparent w-[24px] h-[24px] transition-[scale] duration-150 ease-[ease] hover:scale-[1.18]`}
          onClick={() => focusItem('works', 1.1, 600)}
          aria-label="Go to Work"
          data-tip="Work"
        >
          <img src="/assets/nav1.svg" alt="" draggable={false} className="w-full h-full object-contain brightness-0 invert opacity-90" />
        </button>
        <button
          type="button"
          className={`${dockBtn} bg-transparent w-[24px] h-[24px] transition-[scale] duration-150 ease-[ease] hover:scale-[1.18]`}
          onClick={(e) => openResume(e.currentTarget)}
          aria-haspopup="dialog"
          aria-label="Open résumé"
          data-tip="Resume"
        >
          <img src="/assets/nav2.svg" alt="" draggable={false} className="w-full h-full object-contain brightness-0 invert opacity-90" />
        </button>
        <button
          type="button"
          className={`${dockBtn} bg-transparent w-[26px] h-[26px] transition-[scale] duration-150 ease-[ease] hover:scale-[1.18]`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onContactOpen}
          aria-label="Open contact"
          aria-haspopup="dialog"
          aria-expanded={contactOpen}
          data-tip="Contact"
        >
          <img src="/assets/nav3.svg" alt="" draggable={false} className="w-full h-full object-contain brightness-0 invert opacity-90" />
        </button>
      </div>
    </nav>
  )
}
