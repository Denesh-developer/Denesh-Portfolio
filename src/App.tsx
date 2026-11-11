import { MotionConfig } from 'framer-motion'
import { BoardProvider } from './board/BoardContext'
import { MusicProvider } from './music/MusicContext'
import { BoardViewport } from './components/board/BoardViewport'
import { AboutSeo } from './components/about/AboutSeo'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      {/* Music state lives ABOVE the board so the player's metadata (track, queue,
          favourites, volume) persists across opening/closing the booth. Closing
          pauses playback (see MusicContext.closeMusic). */}
      <MusicProvider>
        <BoardProvider>
          <BoardViewport />
        </BoardProvider>
      </MusicProvider>
      {/* Crawlable, always-present About content (the visible one is in a modal). */}
      <AboutSeo />
    </MotionConfig>
  )
}
