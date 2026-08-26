// Wrapper de navigator.mediaSession: teclas multimedia del SO + popup de
// controles de Windows. Todas las llamadas son no-op si la plataforma no
// soporta la API (nativo / navegadores viejos).

interface MediaMetadataInput {
  title: string
  artist: string
  album?: string
  /** URL https o asset require() (en web resuelve a string) */
  artworkUri?: string | number | null
}

export type MediaPlaybackState = 'playing' | 'paused' | 'none'

export interface MediaActionHandlers {
  play?: () => void
  pause?: () => void
  previousTrack?: () => void
  nextTrack?: () => void
  seekTo?: (seconds: number) => void
}

function supported(): boolean {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator
}

export function setMediaMetadata(meta: MediaMetadataInput | null): void {
  if (!supported()) return
  if (!meta || typeof window.MediaMetadata === 'undefined') {
    navigator.mediaSession.metadata = null
    return
  }
  const artwork =
    meta.artworkUri == null
      ? []
      : [{ src: String(meta.artworkUri), sizes: '512x512' }]
  try {
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: meta.title,
      artist: meta.artist,
      album: meta.album,
      artwork,
    })
  } catch {
    // metadata inválida: ignorar
  }
}

export function setMediaPlaybackState(state: MediaPlaybackState): void {
  if (!supported()) return
  navigator.mediaSession.playbackState = state
}

export function setMediaActionHandlers(handlers: MediaActionHandlers | null): void {
  if (!supported()) return
  const h = handlers ?? {}
  const simple: [MediaSessionAction, (() => void) | undefined][] = [
    ['play', h.play],
    ['pause', h.pause],
    ['previoustrack', h.previousTrack],
    ['nexttrack', h.nextTrack],
  ]
  for (const [action, fn] of simple) {
    try {
      navigator.mediaSession.setActionHandler(action, fn ?? null)
    } catch {
      // acción no soportada por la plataforma
    }
  }
  try {
    navigator.mediaSession.setActionHandler(
      'seekto',
      handlers?.seekTo
        ? details => {
            if (details.seekTime != null && !details.fastSeek) handlers.seekTo!(details.seekTime)
          }
        : null
    )
  } catch {
    // acción no soportada por la plataforma
  }
}
