import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '@/hooks/useTheme'

// Tipos mínimos de la IFrame API de YouTube (sin @types/youtube)
interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  loadVideoById(videoId: string): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  mute(): void
  unMute(): void
  destroy(): void
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      width?: number | string
      height?: number | string
      videoId?: string
      playerVars?: Record<string, string | number>
      events?: {
        onReady?: () => void
        onStateChange?: (e: { data: number }) => void
        onError?: (e: { data: number }) => void
      }
    },
  ) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

// Estados de la API: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
const YT_ENDED = 0
const YT_PLAYING = 1
const YT_BUFFERING = 3

function loadYTApi(onReady: () => void) {
  if (window.YT?.Player) {
    onReady()
    return
  }
  const prev = window.onYouTubeIframeAPIReady
  window.onYouTubeIframeAPIReady = () => {
    prev?.()
    onReady()
  }
  if (!document.getElementById('yt-iframe-api')) {
    const tag = document.createElement('script')
    tag.id = 'yt-iframe-api'
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  }
}

interface YtEngineProps {
  /** cambia cuando se carga otro mix → fuerza recreación del player */
  listKey: string
  videoIds: string[]
  startIndex: number
  playing: boolean
  onEnded: () => void
  onPlayingChange: (playing: boolean) => void
  onTime: (position: number, duration: number) => void
  /** puente imperativo hacia el player (seek) — lo llena el propio engine */
  bind?: React.MutableRefObject<{ seekTo: (seconds: number) => void } | null>
}

/** Motor crudo del iframe de YouTube. Un video por vez; el auto-advance lo maneja el contexto. */
function YtEngine({ listKey, videoIds, startIndex, playing, onEnded, onPlayingChange, onTime, bind }: YtEngineProps) {
  const containerRef = useRef<View>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const loadedIndexRef = useRef(startIndex)
  // refs espejo para callbacks frescos sin recrear el player
  const endedCb = useRef(onEnded)
  const playStateCb = useRef(onPlayingChange)
  const timeCb = useRef(onTime)
  const wantPlay = useRef(playing)
  // timers del helper de reanudación (limpiados al desmontar/recrear player)
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  endedCb.current = onEnded
  playStateCb.current = onPlayingChange
  timeCb.current = onTime
  wantPlay.current = playing

  // Reanudación garantizada bajo autoplay policy: el primer play fue muted-autoplay,
  // así que un playVideo() posterior sobre el player sin mute puede ser bloqueado
  // (WebView2/Chrome sin MEI ni activación delegada al iframe). Si a los ~500ms no
  // arrancó, truco infalible: mute+play (siempre permitido) y unMute ya sonando.
  const guaranteedPlay = () => {
    const p = playerRef.current
    if (!p) return
    try {
      p.playVideo()
    } catch {
      // noop
    }
    pendingTimers.current.push(
      setTimeout(() => {
        const p2 = playerRef.current
        if (!p2 || !wantPlay.current) return
        let state = -99
        try {
          state = p2.getPlayerState()
        } catch {
          return
        }
        if (state === YT_PLAYING) return
        try {
          p2.mute()
          p2.playVideo()
        } catch {
          // noop
        }
        pendingTimers.current.push(
          setTimeout(() => {
            try {
              playerRef.current?.unMute()
            } catch {
              // noop
            }
          }, 350),
        )
      }, 500),
    )
  }

  const clearPendingTimers = () => {
    pendingTimers.current.forEach(clearTimeout)
    pendingTimers.current = []
  }

  useEffect(() => {
    let disposed = false
    let poll: ReturnType<typeof setInterval> | null = null
    loadedIndexRef.current = startIndex

    const create = () => {
      if (disposed || !window.YT || !containerRef.current) return
      const el = containerRef.current as unknown as HTMLElement
      // YT.Player REEMPLAZA el nodo host por un iframe → hijo dedicado
      const host = document.createElement('div')
      el.appendChild(host)

      const player = new window.YT.Player(host, {
        width: 176,
        height: 99,
        videoId: videoIds[startIndex],
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          rel: 0,
          playsinline: 1,
          mute: 1, // bypass autoplay policy: unmute after first play
        },
        events: {
          onReady: () => {
            if (bind) bind.current = { seekTo: s => { try { player.seekTo(s, true) } catch { /* noop */ } } }
            if (wantPlay.current) guaranteedPlay()
            poll = setInterval(() => {
              try {
                timeCb.current(player.getCurrentTime(), player.getDuration())
              } catch {
                // player aún inicializando
              }
            }, 500)
          },
          onStateChange: e => {
            // 3=BUFFERING (disparado por seek/load): no reportarlo como pausa
            // ni dejar que el efecto [playing] pauseVideo() durante el buffer
            if (e.data === YT_BUFFERING) return
            playStateCb.current(e.data === YT_PLAYING)
            if (e.data === YT_ENDED) endedCb.current()
          },
          onError: e => {
            // Only skip on fatal errors: 100 (removed), 101/150 (embed blocked), 5 (HTML5 error)
            // Error 2 (invalid param) is transient during load — don't skip
            const fatal = e.data === 100 || e.data === 101 || e.data === 150 || e.data === 5
            if (fatal) {
              console.warn('[YtPlayer] fatal error', e.data, '→ skip')
              endedCb.current()
            }
          },
        },
      })
      playerRef.current = player
    }

    loadYTApi(create)

    return () => {
      disposed = true
      if (poll) clearInterval(poll)
      clearPendingTimers()
      if (bind) bind.current = null
      try {
        playerRef.current?.destroy()
      } catch {
        // noop
      }
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey])

  // Salto manual a otra canción del mismo mix
  useEffect(() => {
    const p = playerRef.current
    if (!p || startIndex === loadedIndexRef.current) return
    loadedIndexRef.current = startIndex
    try {
      p.loadVideoById(videoIds[startIndex])
      if (wantPlay.current) guaranteedPlay()
    } catch {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startIndex])

  // Estado deseado play/pause
  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    try {
      if (playing) guaranteedPlay()
      else p.pauseVideo()
    } catch {
      // noop
    }
  }, [playing])

  return (
    // pointerEvents none: ni clicks ni teclado llegan al iframe — todo via botones de la app
    <View
      ref={containerRef}
      style={{ width: 176, height: 99 }}
      pointerEvents="none"
    />
  )
}

// ref auxiliar compartida por instancia para el guard del salto manual

/**
 * Mini-player flotante: iframe real de YouTube con controles nativos,
 * anclado arriba del TabBar. Persiste entre tabs (vive en YtProvider).
 */
export function YtMiniPlayer(props: YtEngineProps & { onClose: () => void }) {
  const { colors } = useTheme()
  const { onClose, bind, ...engine } = props

  return (
    <View style={[styles.frame, { borderColor: colors.border, backgroundColor: colors.bg }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.textMuted }]}>AWESOME MIX</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} activeOpacity={0.7}>
          <Text style={[styles.close, { color: colors.accent }]}>✕</Text>
        </TouchableOpacity>
      </View>
      <YtEngine {...engine} bind={bind} />
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    bottom: 64,
    right: 10,
    borderWidth: 2,
    padding: 3,
    gap: 2,
    zIndex: 1000,
    elevation: 1000,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 6,
    letterSpacing: 1,
  },
  close: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 8,
    paddingHorizontal: 4,
  },
})
