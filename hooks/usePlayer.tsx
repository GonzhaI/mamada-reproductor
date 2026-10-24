import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { type Track } from '@/services/types'
import { audioPlayer } from '@/services/player'
import { Audio } from 'expo-av'
import { bumpPlays } from '@/services/playStats'
import { partyCrossfadeConfig, hydratePartyCrossfade, fadeVolumeIn, cancelFade } from '@/hooks/usePartyCrossfade'

const FALLBACK_AUDIO_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

interface PlayerDataValue {
  currentTrack: Track | null
  queue: Track[]
  queueIndex: number
  volume: number
  queueCompleted: number
  playerError: string | null
  resumeSession: ResumeSession | null
}

interface PlayerStatusValue {
  isPlaying: boolean
  position: number
  duration: number
  isLoaded: boolean
}

interface PlayerPlaybackValue {
  isPlaying: boolean
  isLoaded: boolean
}

interface PlayerActionsValue {
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
  retryCurrentTrack: () => Promise<void>
  clearPlayerError: () => void
  resumePlayback: () => Promise<void>
  dismissResume: () => void
}

export type ResumeSession = {
  currentTrack: Track
  queue: Track[]
  queueIndex: number
  position: number
  volume: number
}

export type PlayerContextValue = PlayerDataValue & PlayerStatusValue & PlayerActionsValue

const PlayerDataContext = createContext<PlayerDataValue | null>(null)
const PlayerStatusContext = createContext<PlayerStatusValue | null>(null)
const PlayerPlaybackContext = createContext<PlayerPlaybackValue | null>(null)
const PlayerActionsContext = createContext<PlayerActionsValue | null>(null)
const PLAYER_SESSION_KEY = 'player_session_v1'
const PLAYER_VOLUME_KEY = 'player_volume_v1'

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
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [resumeSession, setResumeSession] = useState<ResumeSession | null>(null)

  const loadingRef = useRef(false)
  // guarda anti doble-disparo del fin natural (el poll puede ver el final 2 veces)
  const endedGuard = useRef<string | null>(null)
  // --- red anti-track-mudo ---
  const currentTrackIdRef = useRef<string | null>(null)
  // el track ya arrancó a sonar => una pausa posterior es humana, no track mudo
  const everPlayedRef = useRef<string | null>(null)
  const watchdogTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const fallbackTried = useRef<Set<string>>(new Set())
  const nextRef = useRef<() => Promise<void>>(async () => {})
  const resumeHydrated = useRef(false)
  const currentTrackRef = useRef<Track | null>(null)
  const queueRef = useRef<Track[]>([])
  const queueIndexRef = useRef(-1)
  const positionRef = useRef(0)
  const volumeRef = useRef(1)

  const saveSession = useCallback(async () => {
    const track = currentTrackRef.current
    const savedQueue = queueRef.current
    if (!track || savedQueue.length === 0) return
    const snapshot: ResumeSession = {
      currentTrack: track,
      queue: savedQueue,
      queueIndex: queueIndexRef.current,
      position: Math.max(0, positionRef.current),
      volume: volumeRef.current,
    }
    await AsyncStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(snapshot))
    await AsyncStorage.setItem(PLAYER_VOLUME_KEY, String(volumeRef.current))
  }, [])

  useEffect(() => {
    currentTrackRef.current = currentTrack
    queueRef.current = queue
    queueIndexRef.current = queueIndex
    positionRef.current = position
    volumeRef.current = volume
  }, [currentTrack, queue, queueIndex, position, volume])

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
      if (everPlayedRef.current === trackId) return // sonó y lo pausaron: humano
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
      if (everPlayedRef.current === trackId) return
      if (audioPlayer.isPlaying || !audioPlayer.isLoaded) return
      if (currentTrackIdRef.current !== trackId) return
      if (audioPlayer.position > 3) return
      void nextRef.current()
    }, 5500)
    watchdogTimers.current = [check1, check2]
  }, [])

  useEffect(() => {
    ensureAudioMode()
    void hydratePartyCrossfade()
    void (async () => {
      try {
        const [sessionRaw, volumeRaw] = await AsyncStorage.multiGet([PLAYER_SESSION_KEY, PLAYER_VOLUME_KEY])
        const parsed = sessionRaw[1] ? JSON.parse(sessionRaw[1]) as ResumeSession : null
        if (parsed?.currentTrack && Array.isArray(parsed.queue) && parsed.queue.length > 0) {
          const safeIndex = Math.min(Math.max(0, parsed.queueIndex), parsed.queue.length - 1)
          setResumeSession({ ...parsed, queueIndex: safeIndex })
        }
        const storedVolume = Number(volumeRaw[1])
        if (Number.isFinite(storedVolume)) setVolumeState(Math.min(1, Math.max(0, storedVolume)))
      } catch {
        // A corrupt resume snapshot must not prevent the player from loading.
        await AsyncStorage.removeItem(PLAYER_SESSION_KEY).catch(() => {})
      } finally {
        resumeHydrated.current = true
      }
    })()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      if (resumeHydrated.current && currentTrackRef.current) {
        void saveSession().catch(() => {})
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [saveSession])

  const previousPlayingRef = useRef(false)
  useEffect(() => {
    if (previousPlayingRef.current && !isPlaying) {
      void saveSession().catch(() => {})
    }
    previousPlayingRef.current = isPlaying
  }, [isPlaying, saveSession])

  useEffect(() => {
    const unsub = audioPlayer.subscribe(status => {
      setPosition(status.position / 1000)
      setDuration(status.duration / 1000)
      setIsPlaying(status.isPlaying)
      setIsLoaded(status.isLoaded)
      if (status.didJustFinish) {
        const finished = queue[queueIndex]
          if (finished && endedGuard.current !== finished.id) {
            endedGuard.current = finished.id
            // patina: la canción se escuchó completa
            void bumpPlays(finished.id)
            const nextIdx = queueIndex + 1
            if (nextIdx < queue.length) {
              playTrackInternal(queue[nextIdx], queue, nextIdx)
            } else if (partyCrossfadeConfig.party && queue.length > 0) {
              // PARTY MODE: reshuffle de la cola y sigue desde el arranque
              const copy = [...queue]
              for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
              }
              setQueue(copy)
              setQueueCompleted(c => c + 1)
              playTrackInternal(copy[0]!, copy, 0)
            } else {
              // cola completa: señal para el flip SIDE B del cassette
              setQueueCompleted(c => c + 1)
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
    setPlayerError(null)
    setResumeSession(null)
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
      // Crossfade de entrada: rampa desde ~0 al volumen actual (single-flight)
      if (partyCrossfadeConfig.crossfade) {
        const target = audioPlayer.volume ?? 1
        fadeVolumeIn(v => void audioPlayer.setVolume(v), target, Math.min(1200, partyCrossfadeConfig.sec * 400))
      }
      await audioPlayer.play()
      everPlayedRef.current = track.id
      armDeadTrackWatchdog(track.id)
    } catch {
      setPlayerError('NO SE PUDO REPRODUCIR ESTE TRACK')
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
    try {
      await audioPlayer.togglePlay()
    } catch {
      setPlayerError('NO SE PUDO CAMBIAR EL ESTADO DE REPRODUCCIÓN')
    }
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
    // side effects FUERA del updater (un updater debe ser puro: StrictMode lo invoca 2x)
    setQueue(prev => prev.filter((_, i) => i !== index))
    if (index < queueIndex) {
      setQueueIndex(qi => qi - 1)
    } else if (index === queueIndex) {
      void audioPlayer.unload()
      void AsyncStorage.removeItem(PLAYER_SESSION_KEY).catch(() => {})
      setCurrentTrack(null)
      setQueueIndex(-1)
      setIsPlaying(false)
      setIsLoaded(false)
    }
  }, [queueIndex])

  const clearQueue = useCallback(async () => {
    await audioPlayer.unload()
    await AsyncStorage.removeItem(PLAYER_SESSION_KEY).catch(() => {})
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
    cancelFade() // el gesto manual manda sobre la rampa del crossfade
    setVolumeState(v)
    audioPlayer.setVolume(v)
    void AsyncStorage.setItem(PLAYER_VOLUME_KEY, String(Math.min(1, Math.max(0, v)))).catch(() => {})
  }, [])

  const retryCurrentTrack = useCallback(async () => {
    if (!currentTrack) return
    await playTrackInternal(currentTrack, queue, queueIndex >= 0 ? queueIndex : 0)
  }, [currentTrack, queue, queueIndex, playTrackInternal])

  const clearPlayerError = useCallback(() => setPlayerError(null), [])

  const resumePlayback = useCallback(async () => {
    const snapshot = resumeSession
    if (!snapshot) return
    await playTrackInternal(snapshot.currentTrack, snapshot.queue, snapshot.queueIndex)
    if (snapshot.position > 0) {
      await audioPlayer.seek(snapshot.position * 1000)
    }
  }, [resumeSession, playTrackInternal])

  const dismissResume = useCallback(() => {
    setResumeSession(null)
    void AsyncStorage.removeItem(PLAYER_SESSION_KEY).catch(() => {})
  }, [])

  // ref fresca para el watchdog de tracks muertos (evita closures stale)
  nextRef.current = next

  const dataValue = useMemo<PlayerDataValue>(() => ({
    currentTrack,
    queue,
    queueIndex,
    volume,
    queueCompleted,
    playerError,
    resumeSession,
  }), [currentTrack, queue, queueIndex, volume, queueCompleted, playerError, resumeSession])

  const statusValue = useMemo<PlayerStatusValue>(() => ({
    isPlaying,
    position,
    duration,
    isLoaded,
  }), [isPlaying, position, duration, isLoaded])

  const actionsValue = useMemo<PlayerActionsValue>(() => ({
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
    retryCurrentTrack,
    clearPlayerError,
    resumePlayback,
    dismissResume,
  }), [
    playTrack, togglePlay, seekTo, next, previous, addToQueue, removeFromQueue, clearQueue,
    playAtIndex, shuffleQueue, setVolume, retryCurrentTrack, clearPlayerError, resumePlayback, dismissResume,
  ])

  const playbackValue = useMemo<PlayerPlaybackValue>(() => ({
    isPlaying,
    isLoaded,
  }), [isPlaying, isLoaded])

  return (
    <PlayerDataContext.Provider value={dataValue}>
      <PlayerStatusContext.Provider value={statusValue}>
        <PlayerPlaybackContext.Provider value={playbackValue}>
          <PlayerActionsContext.Provider value={actionsValue}>
            {children}
          </PlayerActionsContext.Provider>
        </PlayerPlaybackContext.Provider>
      </PlayerStatusContext.Provider>
    </PlayerDataContext.Provider>
  )
}

export function usePlayer(): PlayerContextValue {
  return { ...usePlayerData(), ...usePlayerStatus(), ...usePlayerActions() }
}

export function usePlayerData(): PlayerDataValue {
  const ctx = useContext(PlayerDataContext)
  if (!ctx) throw new Error('usePlayerData debe usarse dentro de <PlayerProvider>')
  return ctx
}

export function usePlayerStatus(): PlayerStatusValue {
  const ctx = useContext(PlayerStatusContext)
  if (!ctx) throw new Error('usePlayerStatus debe usarse dentro de <PlayerProvider>')
  return ctx
}

export function usePlayerPlayback(): PlayerPlaybackValue {
  const ctx = useContext(PlayerPlaybackContext)
  if (!ctx) throw new Error('usePlayerPlayback debe usarse dentro de <PlayerProvider>')
  return ctx
}

export function usePlayerActions(): PlayerActionsValue {
  const ctx = useContext(PlayerActionsContext)
  if (!ctx) throw new Error('usePlayerActions debe usarse dentro de <PlayerProvider>')
  return ctx
}
