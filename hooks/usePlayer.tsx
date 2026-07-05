import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getTrackStreamUrl, type TidalTrack } from '@/services/tidalApi'
import { audioPlayer } from '@/services/player'
import { Audio } from 'expo-av'

interface PlayerContextValue {
  currentTrack: TidalTrack | null
  queue: TidalTrack[]
  queueIndex: number
  isPlaying: boolean
  position: number
  duration: number
  isLoaded: boolean
  playTrack: (track: TidalTrack, queue?: TidalTrack[], startIndex?: number) => Promise<void>
  togglePlay: () => Promise<void>
  seekTo: (seconds: number) => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  addToQueue: (track: TidalTrack) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  jumpToIndex: (index: number) => Promise<void>
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
  const [currentTrack, setCurrentTrack] = useState<TidalTrack | null>(null)
  const [queue, setQueue] = useState<TidalTrack[]>([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  const loadingRef = useRef(false)

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
          const nextIdx = queueIndex + 1
          if (nextIdx < queue.length) {
            playTrackInternal(queue[nextIdx], queue, nextIdx)
          }
        }
      }
    })
    return unsub
  }, [queueIndex, queue])

  const playTrackInternal = useCallback(async (
    track: TidalTrack,
    newQueue?: TidalTrack[],
    newIndex?: number
  ) => {
    if (loadingRef.current) return
    loadingRef.current = true
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

      const streamUrl = await getTrackStreamUrl(track.id)
      await audioPlayer.loadTrack(streamUrl.url)
      await audioPlayer.play()
    } catch {
      setIsPlaying(false)
      setIsLoaded(false)
    } finally {
      loadingRef.current = false
    }
  }, [])

  const playTrack = useCallback(async (
    track: TidalTrack,
    newQueue?: TidalTrack[],
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

  const addToQueue = useCallback((track: TidalTrack) => {
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

  const value = useMemo<PlayerContextValue>(() => ({
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    position,
    duration,
    isLoaded,
    playTrack,
    togglePlay,
    seekTo,
    next,
    previous,
    addToQueue,
    removeFromQueue,
    clearQueue,
    jumpToIndex: playAtIndex,
  }), [
    currentTrack, queue, queueIndex, isPlaying, position, duration, isLoaded,
    playTrack, togglePlay, seekTo, next, previous, addToQueue, removeFromQueue, clearQueue, playAtIndex,
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
