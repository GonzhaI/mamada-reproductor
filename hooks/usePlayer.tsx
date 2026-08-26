import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { type Track } from '@/services/types'
import { audioPlayer } from '@/services/player'
import { Audio } from 'expo-av'
import { bumpPlays } from '@/services/playStats'

const FALLBACK_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

interface PlayerContextValue {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  isPlaying: boolean
  position: number
  duration: number
  isLoaded: boolean
  volume: number
  /** veces que la cola terminó de reproducirse completa (flip SIDE B del cassette) */
  queueCompleted: number
  playTrack: (track: Track, queue?: Track[], startIndex?: number) => Promise<void>
  togglePlay: () => Promise<void>
  seekTo: (seconds: number) => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  jumpToIndex: (index: number) => Promise<void>
  shuffleQueue: () => void
  setVolume: (volume: number) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

async function ensureAudioMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
  })
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [queue, setQueue] = useState<Track[]>([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [volume, setVolumeState] = useState(1)
  const [queueCompleted, setQueueCompleted] = useState(0)

  const loadingRef = useRef(false)
  // guarda anti doble-disparo del fin natural (el poll puede ver el final 2 veces)
  const endedGuard = useRef<string | null>(null)
  // --- red anti-track-mudo ---
  const currentTrackIdRef = useRef<string | null>(null)
  const watchdogTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const fallbackTried = useRef<Set<string>>(new Set())
  const nextRef = useRef<() => Promise<void>>(async () => {})

  /**
   * Watchdog de tracks muertos: el CDN de Jamendo omite ACAO al azar en algunas
   * respuestas -> el <audio crossOrigin> se bloquea y la canción queda muda.
   * t+2.5s: si sigue sin sonar Y en el arranque (pos<3s), recarga por la URL
   * de emergencia (una sola vez por track). t+5.5s: si sigue muda, next().
   */
  const armDeadTrackWatchdog = useCallback((trackId: string) => {
    watchdogTimers.current.forEach(clearTimeout)
    const check1 = setTimeout(() => {
      if (endedGuard.current === trackId) return
      if (audioPlayer.isPlaying || !audioPlayer.isLoaded) return
      if (currentTrackIdRef.current !== trackId) return
      if (audioPlayer.position > 3) return // pausa humana a mitad: no tocar
      if (!fallbackTried.current.has(trackId)) {
        fallbackTried.current.add(trackId)
        void (async () => {
          try {
            await audioPlayer.loadTrack(FALLBACK_AUDIO_URL)
            await audioPlayer.play()
          } catch {
            // check2 decide
          }
        })()
      }
    }, 2500)
    const check2 = setTimeout(() => {
      if (endedGuard.current === trackId) return
      if (audioPlayer.isPlaying || !audioPlayer.isLoaded) return
      if (currentTrackIdRef.current !== trackId) return
      if (audioPlayer.position > 3) return
      void nextRef.current()
    }, 5500)
    watchdogTimers.current = [check1, check2]
  }, [])

  useEffect(() => {
    ensureAudioMode()
  }, [])

  useEffect(() => {
    const unsub = audioPlayer.subscribe(status => {
      setPosition(status.position / 1000)
      setDuration(status.duration / 1000)
      setIsPlaying(status.isPlaying)
      setIsLoaded(status.isLoaded)
      if (!status.isPlaying && status.isLoaded && status.position > 0) {
        const diff = status.duration - status.position
        if (diff < 500) {
          const finished = queue[queueIndex]
          if (finished && endedGuard.current !== finished.id) {
            endedGuard.current = finished.id
            // patina: la canción se escuchó completa
            void bumpPlays(finished.id)
            const nextIdx = queueIndex + 1
            if (nextIdx < queue.length) {
              playTrackInternal(queue[nextIdx], queue, nextIdx)
            } else {
              // cola completa: señal para el flip SIDE B del cassette
              setQueueCompleted(c => c + 1)
            }
          }
        }
      }
    })
    return unsub
  }, [queueIndex, queue])

  const playTrackInternal = useCallback(async (
    track: Track,
    newQueue?: Track[],
    newIndex?: number
  ) => {
    if (loadingRef.current) return
    loadingRef.current = true
    endedGuard.current = null
    currentTrackIdRef.current = track.id
    try {
      if (newQueue) {
        setQueue(newQueue)
      }
      if (newIndex != null) {
        setQueueIndex(newIndex)
      } else {
        const idx = newQueue?.findIndex(t => t.id === track.id) ?? -1
        setQueueIndex(idx >= 0 ? idx : 0)
      }
      setCurrentTrack(track)

      await audioPlayer.loadTrack(track.audio ?? FALLBACK_AUDIO_URL)
      await audioPlayer.play()
      armDeadTrackWatchdog(track.id)
    } catch {
      setIsPlaying(false)
      setIsLoaded(false)
    } finally {
      loadingRef.current = false
    }
  }, [armDeadTrackWatchdog])

  const playTrack = useCallback(async (
    track: Track,
    newQueue?: Track[],
    startIndex?: number
  ) => {
    const q = newQueue ?? [track]
    const idx = startIndex ?? q.findIndex(t => t.id === track.id)
    await playTrackInternal(track, q, idx >= 0 ? idx : 0)
  }, [playTrackInternal])

  const togglePlay = useCallback(async () => {
    if (!isLoaded) return
    await audioPlayer.togglePlay()
  }, [isLoaded])

  const seekTo = useCallback(async (seconds: number) => {
    await audioPlayer.seek(seconds * 1000)
  }, [])

  const playAtIndex = useCallback(async (index: number) => {
    if (index < 0 || index >= queue.length) return
    const track = queue[index]
    await playTrackInternal(track, queue, index)
  }, [queue, playTrackInternal])

  const next = useCallback(async () => {
    const nextIdx = queueIndex + 1
    if (nextIdx < queue.length) {
      await playAtIndex(nextIdx)
    }
  }, [queueIndex, queue, playAtIndex])

  const previous = useCallback(async () => {
    if (position > 3) {
      await audioPlayer.seek(0)
      return
    }
    const prevIdx = queueIndex - 1
    if (prevIdx >= 0) {
      await playAtIndex(prevIdx)
    }
  }, [queueIndex, queue, position, playAtIndex])

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track])
  }, [])

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => {
      const next = prev.filter((_, i) => i !== index)
      if (index < queueIndex) {
        setQueueIndex(qi => qi - 1)
      } else if (index === queueIndex) {
        audioPlayer.unload()
        setCurrentTrack(null)
        setQueueIndex(-1)
        setIsPlaying(false)
        setIsLoaded(false)
      }
      return next
    })
  }, [queueIndex])

  const clearQueue = useCallback(async () => {
    await audioPlayer.unload()
    setQueue([])
    setQueueIndex(-1)
    setCurrentTrack(null)
    setIsPlaying(false)
    setIsLoaded(false)
  }, [])

  // Fisher-Yates sobre los tracks posteriores al actual (el que suena no se mueve)
  const shuffleQueue = useCallback(() => {
    setQueue(prev => {
      if (queueIndex < 0) return prev
      const head = prev.slice(0, queueIndex + 1)
      const tail = prev.slice(queueIndex + 1)
      for (let i = tail.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[tail[i], tail[j]] = [tail[j], tail[i]]
      }
      return [...head, ...tail]
    })
  }, [queueIndex])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
    audioPlayer.setVolume(v)
  }, [])

  // ref fresca para el watchdog de tracks muertos (evita closures stale)
  nextRef.current = next

  const value = useMemo<PlayerContextValue>(() => ({
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    position,
    duration,
    isLoaded,
    volume,
    queueCompleted,
    playTrack,
    togglePlay,
    seekTo,
    next,
    previous,
    addToQueue,
    removeFromQueue,
    clearQueue,
    jumpToIndex: playAtIndex,
    shuffleQueue,
    setVolume,
  }), [
    currentTrack, queue, queueIndex, isPlaying, position, duration, isLoaded, volume, queueCompleted,
    playTrack, togglePlay, seekTo, next, previous, addToQueue, removeFromQueue, clearQueue, playAtIndex, shuffleQueue, setVolume,
  ])

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer debe usarse dentro de <PlayerProvider>')
  return ctx
}
