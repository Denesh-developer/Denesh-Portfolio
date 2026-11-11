import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'
import { useBoard } from '../../board/BoardContext'
import { useMusicDeck } from '../../music/MusicContext'
import { GRID_MAJOR, GRID_MINOR, MAX_SCALE, MIN_SCALE, computeFitTransform } from '../../board/constants'
import { BoardCanvas } from './BoardCanvas'
import { ZoomControls } from './ZoomControls'
import { Dock } from './Dock'
import { ProjectModal } from './ProjectModal'
import { ContactModal } from './ContactModal'
import { WorksGalleryModal } from './WorksGalleryModal'
import { ExperienceModal } from './ExperienceModal'
import { ResumeModal } from './ResumeModal'
import { LawModal } from './LawModal'

// Split the About modal into its own chunk; preloaded on idle (see below).
const AboutModal = lazy(() => import('../about/AboutModal'))
// The game (an easter egg) is its own chunk — nothing game-related loads until
// the running sticker is hovered (sprite preload) or clicked (this chunk).
const GameOverlay = lazy(() => import('../../game/GameOverlay'))
// "One game before you go" (tic-tac-toe) — its own chunk, loaded on sticker
// hover (preload) or click.
const TicTacToeOverlay = lazy(() => import('../../tictactoe/TicTacToeOverlay'))

export function BoardViewport() {
  const {
    registerControls,
    handleTransformed,
    fitContent,
    spacePanning,
    gameOpen,
    gameLauncherRef,
    closeGame,
    worksOpen,
    worksLauncherRef,
    closeWorks,
    experienceOpen,
    experienceLauncherRef,
    closeExperience,
    resumeOpen,
    resumeLauncherRef,
    closeResume,
    lawOpen,
    lawLauncherRef,
    closeLaw,
    moviesOpen,
    moviesLauncherRef,
    closeMovies,
    tttOpen,
    tttLauncherRef,
    closeTicTacToe,
  } = useBoard()
  // Light slice (open flag only) — doesn't re-render the board during playback.
  const { open: musicOpen } = useMusicDeck()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  // Fit the composition on the very first paint (no initial-scale flash): the
  // board opens at exactly the same level the Fit/Reset buttons produce.
  const initialFit = useMemo(() => computeFitTransform(window.innerWidth, window.innerHeight), [])

  // Warm the About chunk + profile image once the homepage goes idle, so the
  // modal opens instantly with a sharp character on first click.
  useEffect(() => {
    const run = () => {
      void import('../about/AboutModal')
      new Image().src = '/assets/about/profile.svg'
    }
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number
    }
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(run)
    } else {
      const t = window.setTimeout(run, 1200)
      return () => window.clearTimeout(t)
    }
  }, [])

  // Infinite grid: the grid lives on the fixed viewport (so it always fills the
  // screen) but its position/size track the board transform so it still pans
  // and zooms with the content.
  const updateGrid = (scale: number, x: number, y: number) => {
    const el = wrapperRef.current
    if (!el) return
    const mn = GRID_MINOR * scale
    const mj = GRID_MAJOR * scale
    el.style.backgroundPosition = `${x}px ${y}px`
    el.style.backgroundSize = `${mn}px ${mn}px, ${mn}px ${mn}px, ${mj}px ${mj}px, ${mj}px ${mj}px`
  }

  // Block browser page-zoom (ctrl/⌘ + wheel, trackpad pinch) only over the board.
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div
      ref={wrapperRef}
      className={`board-viewport fixed inset-0 w-screen h-screen overflow-hidden touch-none select-none${
        spacePanning ? ' cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <TransformWrapper
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        initialScale={initialFit.scale}
        initialPositionX={initialFit.x}
        initialPositionY={initialFit.y}
        limitToBounds={false}
        centerZoomedOut={false}
        doubleClick={{ disabled: true }}
        wheel={{ step: 0.08 }}
        pinch={{ step: 2 }}
        // A fast trackpad pinch used to overshoot maxScale (showing ~200% then
        // snapping back to 160%, which shifted the viewport). Disabling the
        // momentum + snap-back animations keeps the scale pinned to [min,max]
        // with no post-gesture drift.
        velocityAnimation={{ disabled: true }}
        zoomAnimation={{ disabled: true }}
        autoAlignment={{ disabled: true }}
        panning={{ excluded: spacePanning ? [] : ['no-pan'] }}
        onInit={(ref) => {
          registerControls(ref)
          window.setTimeout(() => fitContent(0), 0)
        }}
        onTransform={(_ref, state) => {
          handleTransformed(state.scale, state.positionX, state.positionY)
          updateGrid(state.scale, state.positionX, state.positionY)
        }}
      >
        <TransformComponent wrapperStyle={{ width: '100vw', height: '100vh' }}>
          <BoardCanvas />
        </TransformComponent>
        <ZoomControls />
        <Dock
          aboutOpen={aboutOpen}
          onAboutOpen={() => setAboutOpen(true)}
          contactOpen={contactOpen}
          onContactOpen={() => setContactOpen(true)}
          avatarRef={avatarRef}
        />
        <ProjectModal />
        <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
        <WorksGalleryModal open={worksOpen} onClose={closeWorks} triggerRef={worksLauncherRef} />
        <ExperienceModal open={experienceOpen} onClose={closeExperience} triggerRef={experienceLauncherRef} />
        {/* Résumé PDF viewer — portals to <body>, so it's viewport-fixed regardless
            of board zoom; opened from the résumé sticker or the dock résumé icon. */}
        <ResumeModal open={resumeOpen} onClose={closeResume} triggerRef={resumeLauncherRef} />
        <LawModal open={lawOpen} onClose={closeLaw} triggerRef={lawLauncherRef} />
      </TransformWrapper>

      <Suspense fallback={null}>
        <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} triggerRef={avatarRef} />
      </Suspense>

      {/* "Kesavan's Run" — a fixed full-screen layer ABOVE the board. Mounted only
          while open (so nothing ticks when closed); the board stays put underneath. */}
      {gameOpen && (
        <Suspense fallback={null}>
          <GameOverlay onClose={closeGame} launcher={gameLauncherRef.current} />
        </Suspense>
      )}

      {/* "One game before you go" — full-screen tic-tac-toe above the board. Mounted
          only while open, so no timers run when closed; the board stays put underneath. */}
      {tttOpen && (
        <Suspense fallback={null}>
          <TicTacToeOverlay onClose={closeTicTacToe} launcher={tttLauncherRef.current} />
        </Suspense>
      )}

      {/* Fixed brand logo — always top-left, never pans/zooms/drags */}
      <div className="fixed left-[24px] top-[18px] z-[1100] pointer-events-none">
        <div className="font-satoshi font-black text-[36px] leading-none text-white tracking-[-1.08px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
          Deneshraja
        </div>
        <div className="mt-[8px] font-satoshi font-medium text-[12px] leading-none text-[#00ff9c] tracking-[4.56px] drop-shadow-[0_0_8px_rgba(0,255,156,0.4)]">
          NEDUNCHEZHIAN
        </div>
      </div>
    </div>
  )
}
