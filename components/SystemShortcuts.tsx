import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { usePlayerActions, usePlayerData, usePlayerStatus } from '@/hooks/usePlayer'
import { useYt } from '@/hooks/useYt'
import {
  setMediaActionHandlers,
  setMediaMetadata,
  setMediaPlaybackState,
} from '@/services/mediaSession'
import { sfx } from '@/services/sfxEngine'
import { ART_COVERS } from '@/services/mixCovers'

const SEEK_STEP = 5
const VOLUME_STEP = 0.1

/**
 * Puente entre el sistema y el player activo:
 * - Atajos de teclado (web/Tauri): Espacio = play/pause, ←→ = seek ±5s, ↑↓ = volumen.
 * - mediaSession: metadata + teclas multimedia del SO sobre el motor activo.
 *
 * El motor activo es YouTube si hay un mix cargado; si no, Jamendo.
 */
export function SystemShortcuts() {
  const playerData = usePlayerData()
  const playerStatus = usePlayerStatus()
  const playerActions = usePlayerActions()
  const yt = useYt()

  // Preferencias + precarga de samples de foley (web only)
  useEffect(() => {
    void sfx.init()
  }, [])

  const ytActive = yt.mix !== null

  // Acciones siempre frescas via ref: los listeners/handlers se registran una vez
  const actionsRef = useRef({
    playPause: () => {},
    next: () => {},
    prev: () => {},
    seekBy: (_delta: number) => {},
    bumpVolume: (_delta: number) => {},
  })
  actionsRef.current = {
    playPause: () => (ytActive ? yt.togglePlay() : playerActions.togglePlay()),
    next: () => (ytActive ? yt.next() : void playerActions.next()),
    prev: () => (ytActive ? yt.prev() : void playerActions.previous()),
    seekBy: delta => {
      if (ytActive && yt.mix) {
        const target = Math.min(Math.max(yt.position + delta, 0), Math.max(yt.duration - 1, 0))
        yt.seekTo(target)
      } else if (!ytActive && playerStatus.isLoaded) {
        const target = Math.min(Math.max(playerStatus.position + delta, 0), Math.max(playerStatus.duration - 1, 0))
        void playerActions.seekTo(target)
      }
    },
    bumpVolume: delta => {
      const v = Math.min(1, Math.max(0, Number((playerData.volume + delta).toFixed(2))))
      playerActions.setVolume(v)
    },
  }

  // --- Teclado ---
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (!e.repeat) actionsRef.current.playPause()
          break
        case 'ArrowRight':
          e.preventDefault()
          actionsRef.current.seekBy(SEEK_STEP)
          break
        case 'ArrowLeft':
          e.preventDefault()
          actionsRef.current.seekBy(-SEEK_STEP)
          break
        case 'ArrowUp':
          e.preventDefault()
          actionsRef.current.bumpVolume(VOLUME_STEP)
          break
        case 'ArrowDown':
          e.preventDefault()
          actionsRef.current.bumpVolume(-VOLUME_STEP)
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // --- mediaSession: handlers fijos que delegan en el ref ---
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined
    setMediaActionHandlers({
      play: () => actionsRef.current.playPause(),
      pause: () => actionsRef.current.playPause(),
      nextTrack: () => actionsRef.current.next(),
      previousTrack: () => actionsRef.current.prev(),
      seekTo: seconds => actionsRef.current.seekBy(seconds - (ytActive ? yt.position : playerStatus.position)),
    })
    return () => setMediaActionHandlers(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- mediaSession: metadata del track activo ---
  useEffect(() => {
    if (Platform.OS !== 'web') return
    if (ytActive && yt.mix) {
      const t = yt.mix.tracks[yt.index]
      setMediaMetadata({
        title: t.title,
        artist: t.artist,
        album: `${yt.mix.title} — ${yt.mix.movie}`,
        artworkUri: ART_COVERS[yt.mix.id],
      })
    } else if (playerData.currentTrack) {
      const t = playerData.currentTrack
      setMediaMetadata({
        title: t.title,
        artist: t.artists.map(a => a.name).join(', '),
        album: t.album?.title ?? undefined,
        artworkUri: t.album?.coverUrl ?? null,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytActive, yt.mix?.id, yt.index, playerData.currentTrack?.id])

  // --- mediaSession: estado de reproducción ---
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const playing = ytActive ? yt.playing : playerStatus.isPlaying && playerStatus.isLoaded
    setMediaPlaybackState(playing ? 'playing' : 'paused')
  }, [ytActive, yt.playing, playerStatus.isPlaying, playerStatus.isLoaded])

  return null
}
