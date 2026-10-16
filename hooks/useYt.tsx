import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { YtMiniPlayer } from '@/components/YtPlayer'
import { getAwesomeMix, type AwesomeMixMeta } from '@/services/awesomeMixData'
import { shuffledIndexes } from '@/services/mixStats'

const LAST_MIX_KEY = 'yt_last_mix'
const LAST_INDEX_KEY = 'yt_last_index'

export interface LastYtResume { mixId: string; index: number }

interface YtState {
  /** mix sonando ahora (null = YT parado) */
  mix: AwesomeMixMeta | null
  index: number
  playing: boolean
  position: number
  duration: number
  /** último mix+track persistido (para RESUME) */
  resume: LastYtResume | null
  /** true si next/prev siguen un orden aleatorio (tap manual vuelve a lineal) */
  shuffled: boolean
  shuffleStart: (mixId: string) => void
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
  // orden aleatorio activo (null = lineal); el tap manual lo limpia
  const orderRef = useRef<number[] | null>(null)
  const [shuffled, setShuffled] = useState(false)
  const [resume, setResume] = useState<LastYtResume | null>(null)

  useEffect(() => {
    AsyncStorage.multiGet([LAST_MIX_KEY, LAST_INDEX_KEY])
      .then(entries => {
        const map = Object.fromEntries(entries) as Record<string, string | null>
        const m = getAwesomeMix(map[LAST_MIX_KEY] ?? undefined)
        if (m) {
          const raw = Number(map[LAST_INDEX_KEY] ?? 0)
          const idx = Number.isFinite(raw) ? Math.min(Math.max(0, raw), m.tracks.length - 1) : 0
          setResume({ mixId: m.id, index: idx })
        }
      })
      .catch(() => {})
  }, [])

  const persist = useCallback((mixId: string, i: number) => {
    setResume({ mixId, index: i })
    void AsyncStorage.multiSet([[LAST_MIX_KEY, mixId], [LAST_INDEX_KEY, String(i)]])
  }, [])

  const start = useCallback((mixId: string, trackIndex: number) => {
    const m = getAwesomeMix(mixId)
    if (!m) return
    const safe = Math.min(Math.max(0, trackIndex), m.tracks.length - 1)
    indexRef.current = safe
    orderRef.current = null
    setShuffled(false)
    setMix(m)
    setIndex(safe)
    setPlaying(true)
    setPosition(0)
    setDuration(0)
    persist(mixId, safe)
  }, [persist])

  /** Arranca el mix en orden aleatorio; next/prev lo recorren (wrap) */
  const shuffleStart = useCallback((mixId: string) => {
    const m = getAwesomeMix(mixId)
    if (!m) return
    const order = shuffledIndexes(m.tracks.length, Math.floor(Math.random() * m.tracks.length))
    const first = order[0]!
    indexRef.current = first
    orderRef.current = order
    setShuffled(true)
    setMix(m)
    setIndex(first)
    setPlaying(true)
    setPosition(0)
    setDuration(0)
    persist(mixId, first)
  }, [persist])

  const jumpTo = useCallback((i: number) => {
    indexRef.current = i
    orderRef.current = null
    setShuffled(false)
    setIndex(i)
    setPosition(0)
    setDuration(0)
    if (mix) {
      const safe = Math.min(Math.max(0, i), mix.tracks.length - 1)
      persist(mix.id, safe)
    }
  }, [mix, persist])

  const step = useCallback((dir: 1 | -1) => {
    if (!mix) return
    const order = orderRef.current
    let nxt: number
    if (order) {
      const pos = order.indexOf(indexRef.current)
      nxt = order[(pos + dir + order.length) % order.length]!
    } else {
      nxt = (indexRef.current + dir + mix.tracks.length) % mix.tracks.length
    }
    indexRef.current = nxt
    setIndex(nxt)
    setPosition(0)
    setDuration(0)
    persist(mix.id, nxt)
  }, [mix, persist])

  const next = useCallback(() => step(1), [step])

  const prev = useCallback(() => step(-1), [step])

  const stop = useCallback(() => {
    orderRef.current = null
    setShuffled(false)
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
      resume,
      shuffled,
      shuffleStart,
      start,
      stop,
      togglePlay,
      setPlaying: setPlayingExternal,
      jumpTo,
      next,
      prev,
      seekTo,
    }),
    [mix, index, playing, position, duration, resume, shuffled, shuffleStart, start, stop, togglePlay, setPlayingExternal, jumpTo, next, prev, seekTo],
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
