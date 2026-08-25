import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { YtMiniPlayer } from '@/components/YtPlayer'
import { getAwesomeMix, type AwesomeMixMeta } from '@/services/awesomeMixData'

interface YtState {
  /** mix sonando ahora (null = YT parado) */
  mix: AwesomeMixMeta | null
  index: number
  playing: boolean
  position: number
  duration: number
  start: (mixId: string, trackIndex: number) => void
  stop: () => void
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  jumpTo: (index: number) => void
  next: () => void
  prev: () => void
  seekTo: (seconds: number) => void
}

const YtContext = createContext<YtState | null>(null)

export function useYt(): YtState {
  const ctx = useContext(YtContext)
  if (!ctx) throw new Error('useYt debe usarse dentro de <YtProvider>')
  return ctx
}

export function YtProvider({ children }: { children: React.ReactNode }) {
  const [mix, setMix] = useState<AwesomeMixMeta | null>(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  // índice en ref para que next/prev no dependan del closure desactualizado
  const indexRef = useRef(0)

  const start = useCallback((mixId: string, trackIndex: number) => {
    const m = getAwesomeMix(mixId)
    if (!m) return
    indexRef.current = trackIndex
    setMix(m)
    setIndex(trackIndex)
    setPlaying(true)
    setPosition(0)
    setDuration(0)
  }, [])

  const jumpTo = useCallback((i: number) => {
    indexRef.current = i
    setIndex(i)
    setPosition(0)
    setDuration(0)
  }, [])

  const next = useCallback(() => {
    if (!mix) return
    jumpTo((indexRef.current + 1) % mix.tracks.length)
  }, [mix, jumpTo])

  const prev = useCallback(() => {
    if (!mix) return
    jumpTo((indexRef.current - 1 + mix.tracks.length) % mix.tracks.length)
  }, [mix, jumpTo])

  const stop = useCallback(() => {
    setMix(null)
    setPlaying(false)
    setPosition(0)
    setDuration(0)
  }, [])

  const togglePlay = useCallback(() => setPlaying(p => !p), [])
  const setPlayingExternal = useCallback((v: boolean) => setPlaying(v), [])
  const handleTime = useCallback((pos: number, dur: number) => {
    setPosition(pos)
    if (dur > 0) setDuration(dur)
  }, [])

  // puente imperativo hacia el engine (el iframe vive fuera del árbol de este hook)
  const engineRef = useRef<{ seekTo: (seconds: number) => void } | null>(null)
  const seekTo = useCallback((seconds: number) => {
    engineRef.current?.seekTo(seconds)
    setPosition(seconds)
  }, [])

  const value = useMemo<YtState>(
    () => ({
      mix,
      index,
      playing,
      position,
      duration,
      start,
      stop,
      togglePlay,
      setPlaying: setPlayingExternal,
      jumpTo,
      next,
      prev,
      seekTo,
    }),
    [mix, index, playing, position, duration, start, stop, togglePlay, setPlayingExternal, jumpTo, next, prev, seekTo],
  )

  return (
    <YtContext.Provider value={value}>
      {children}
      {/* Mini-player persistente: sobrevive navegación entre tabs */}
      {mix && (
        <YtMiniPlayer
          listKey={mix.id}
          videoIds={mix.tracks.map(t => t.videoId)}
          startIndex={index}
          playing={playing}
          onEnded={next}
          onPlayingChange={setPlayingExternal}
          onTime={handleTime}
          onClose={stop}
          bind={engineRef}
        />
      )}
    </YtContext.Provider>
  )
}
