import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import {
  MAX_SCALE,
  MIN_SCALE,
  computeFitTransform,
} from './constants'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

type TransformSnapshot = { positionX: number; positionY: number; scale: number }

type BoardContextValue = {
  scaleRef: React.MutableRefObject<number>
  scalePct: number
  spacePanning: boolean
  reducedMotion: boolean
  activeProject: string | null
  registerControls: (ref: ReactZoomPanPinchRef) => void
  handleTransformed: (scale: number, positionX: number, positionY: number) => void
  fitContent: (time?: number) => void
  zoomIn: () => void
  zoomOut: () => void
  focusItem: (id: string, scale?: number, time?: number) => void
  openProject: (projectId: string, node: HTMLElement | null) => void
  closeProject: () => void
  bringToFront: (id: string) => void
  getZ: (id: string, base: number) => number
  gameOpen: boolean
  /** Element focus is restored to when the game closes (the running sticker). */
  gameLauncherRef: React.MutableRefObject<HTMLElement | null>
  openGame: (launcher: HTMLElement | null) => void
  closeGame: () => void
  worksOpen: boolean
  /** Element focus is restored to when the works gallery closes (the Works card). */
  worksLauncherRef: React.MutableRefObject<HTMLElement | null>
  openWorks: (launcher: HTMLElement | null) => void
  closeWorks: () => void
  experienceOpen: boolean
  /** Element focus is restored to when the experience modal closes. */
  experienceLauncherRef: React.MutableRefObject<HTMLElement | null>
  openExperience: (launcher: HTMLElement | null) => void
  closeExperience: () => void
  resumeOpen: boolean
  /** Element focus is restored to when the résumé viewer closes (sticker or dock). */
  resumeLauncherRef: React.MutableRefObject<HTMLElement | null>
  openResume: (launcher: HTMLElement | null) => void
  closeResume: () => void
  lawOpen: boolean
  /** Element focus is restored to when the law-student modal closes. */
  lawLauncherRef: React.MutableRefObject<HTMLElement | null>
  openLaw: (launcher: HTMLElement | null) => void
  closeLaw: () => void
  moviesOpen: boolean
  /** Element focus is restored to when the movies modal closes (Netflix sticker). */
  moviesLauncherRef: React.MutableRefObject<HTMLElement | null>
  openMovies: (launcher: HTMLElement | null) => void
  closeMovies: () => void
  tttOpen: boolean
  /** Element focus is restored to when the tic-tac-toe overlay closes (its sticker). */
  tttLauncherRef: React.MutableRefObject<HTMLElement | null>
  openTicTacToe: (launcher: HTMLElement | null) => void
  closeTicTacToe: () => void
}

const BoardContext = createContext<BoardContextValue | null>(null)

export function useBoard() {
  const ctx = useContext(BoardContext)
  if (!ctx) throw new Error('useBoard must be used within <BoardProvider>')
  return ctx
}

export function BoardProvider({ children }: { children: ReactNode }) {
  const controlsRef = useRef<ReactZoomPanPinchRef | null>(null)
  const scaleRef = useRef(1)
  const stateRef = useRef<TransformSnapshot>({ positionX: 0, positionY: 0, scale: 1 })
  const restoreRef = useRef<TransformSnapshot | null>(null)

  const [scalePct, setScalePct] = useState(100)
  const [spacePanning, setSpacePanning] = useState(false)
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [zMap, setZMap] = useState<Record<string, number>>({})
  const topZRef = useRef(50)
  const [gameOpen, setGameOpen] = useState(false)
  const gameLauncherRef = useRef<HTMLElement | null>(null)
  const [worksOpen, setWorksOpen] = useState(false)
  const worksLauncherRef = useRef<HTMLElement | null>(null)
  const [experienceOpen, setExperienceOpen] = useState(false)
  const experienceLauncherRef = useRef<HTMLElement | null>(null)
  const [resumeOpen, setResumeOpen] = useState(false)
  const resumeLauncherRef = useRef<HTMLElement | null>(null)
  const [lawOpen, setLawOpen] = useState(false)
  const lawLauncherRef = useRef<HTMLElement | null>(null)
  const [moviesOpen, setMoviesOpen] = useState(false)
  const moviesLauncherRef = useRef<HTMLElement | null>(null)
  const [tttOpen, setTttOpen] = useState(false)
  const tttLauncherRef = useRef<HTMLElement | null>(null)

  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  const registerControls = useCallback((ref: ReactZoomPanPinchRef) => {
    controlsRef.current = ref
  }, [])

  const handleTransformed = useCallback(
    (scale: number, positionX: number, positionY: number) => {
      scaleRef.current = scale
      stateRef.current = { scale, positionX, positionY }
      setScalePct(Math.round(scale * 100))
    },
    [],
  )

  const fitContent = useCallback((time = 400) => {
    const c = controlsRef.current
    if (!c) return
    const { x, y, scale } = computeFitTransform(window.innerWidth, window.innerHeight)
    c.setTransform(x, y, scale, time)
  }, [])

  const zoomIn = useCallback(() => controlsRef.current?.zoomIn(0.25), [])
  const zoomOut = useCallback(() => controlsRef.current?.zoomOut(0.25), [])

  const focusItem = useCallback((id: string, scale = 1, time = 500) => {
    const c = controlsRef.current
    const node = document.getElementById(`board-item-${id}`)
    if (c && node) c.zoomToElement(node, clamp(scale, MIN_SCALE, MAX_SCALE), time)
  }, [])

  const openProject = useCallback((projectId: string, node: HTMLElement | null) => {
    const c = controlsRef.current
    if (c) {
      restoreRef.current = { ...stateRef.current }
      if (node) c.zoomToElement(node, clamp(1.4, MIN_SCALE, MAX_SCALE), 600)
    }
    setActiveProject(projectId)
  }, [])

  const closeProject = useCallback(() => {
    setActiveProject(null)
    const c = controlsRef.current
    const snap = restoreRef.current
    if (c && snap) c.setTransform(snap.positionX, snap.positionY, snap.scale, 500)
    restoreRef.current = null
  }, [])

  const bringToFront = useCallback((id: string) => {
    topZRef.current += 1
    const z = topZRef.current
    setZMap((prev) => (prev[id] === z ? prev : { ...prev, [id]: z }))
  }, [])

  // The game is a fixed overlay layered ABOVE the board — opening it never
  // touches the transform, so pan/zoom/sticker positions are exactly preserved.
  const openGame = useCallback((launcher: HTMLElement | null) => {
    gameLauncherRef.current = launcher
    setGameOpen(true)
  }, [])
  const closeGame = useCallback(() => setGameOpen(false), [])

  // Works gallery — a fixed overlay above the board (same as the game: opening
  // it never touches the transform, so the board state is preserved underneath).
  const openWorks = useCallback((launcher: HTMLElement | null) => {
    worksLauncherRef.current = launcher
    setWorksOpen(true)
  }, [])
  const closeWorks = useCallback(() => setWorksOpen(false), [])

  const openExperience = useCallback((launcher: HTMLElement | null) => {
    experienceLauncherRef.current = launcher
    setExperienceOpen(true)
  }, [])
  const closeExperience = useCallback(() => setExperienceOpen(false), [])

  // Résumé viewer — a fixed overlay above the board (opening never touches the
  // transform, so pan/zoom/sticker positions are preserved underneath).
  const openResume = useCallback((launcher: HTMLElement | null) => {
    resumeLauncherRef.current = launcher
    setResumeOpen(true)
  }, [])
  const closeResume = useCallback(() => setResumeOpen(false), [])

  // Law-student modal — a fixed overlay above the board (like the others).
  const openLaw = useCallback((launcher: HTMLElement | null) => {
    lawLauncherRef.current = launcher
    setLawOpen(true)
  }, [])
  const closeLaw = useCallback(() => setLawOpen(false), [])

  // "From my watchlist" movies modal — a fixed overlay above the board (opened
  // from the Netflix sticker; opening never touches the transform).
  const openMovies = useCallback((launcher: HTMLElement | null) => {
    moviesLauncherRef.current = launcher
    setMoviesOpen(true)
  }, [])
  const closeMovies = useCallback(() => setMoviesOpen(false), [])

  // "One game before you go" (tic-tac-toe) — a fixed overlay above the board,
  // like the run game: opening never touches the transform.
  const openTicTacToe = useCallback((launcher: HTMLElement | null) => {
    tttLauncherRef.current = launcher
    setTttOpen(true)
  }, [])
  const closeTicTacToe = useCallback(() => setTttOpen(false), [])

  const getZ = useCallback((id: string, base: number) => zMap[id] ?? base, [zMap])

  // Spacebar-to-pan (ignore while typing in a field).
  useEffect(() => {
    const isTyping = (el: EventTarget | null) => {
      const t = el as HTMLElement | null
      return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
    }
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping(e.target)) {
        e.preventDefault()
        setSpacePanning(true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePanning(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const value = useMemo<BoardContextValue>(
    () => ({
      scaleRef,
      scalePct,
      spacePanning,
      reducedMotion,
      activeProject,
      registerControls,
      handleTransformed,
      fitContent,
      zoomIn,
      zoomOut,
      focusItem,
      openProject,
      closeProject,
      bringToFront,
      getZ,
      gameOpen,
      gameLauncherRef,
      openGame,
      closeGame,
      worksOpen,
      worksLauncherRef,
      openWorks,
      closeWorks,
      experienceOpen,
      experienceLauncherRef,
      openExperience,
      closeExperience,
      resumeOpen,
      resumeLauncherRef,
      openResume,
      closeResume,
      lawOpen,
      lawLauncherRef,
      openLaw,
      closeLaw,
      moviesOpen,
      moviesLauncherRef,
      openMovies,
      closeMovies,
      tttOpen,
      tttLauncherRef,
      openTicTacToe,
      closeTicTacToe,
    }),
    [
      scalePct,
      spacePanning,
      reducedMotion,
      activeProject,
      registerControls,
      handleTransformed,
      fitContent,
      zoomIn,
      zoomOut,
      focusItem,
      openProject,
      closeProject,
      bringToFront,
      getZ,
      gameOpen,
      openGame,
      closeGame,
      worksOpen,
      openWorks,
      closeWorks,
      experienceOpen,
      openExperience,
      closeExperience,
      resumeOpen,
      openResume,
      closeResume,
      lawOpen,
      openLaw,
      closeLaw,
      moviesOpen,
      openMovies,
      closeMovies,
      tttOpen,
      openTicTacToe,
      closeTicTacToe,
    ],
  )

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}
