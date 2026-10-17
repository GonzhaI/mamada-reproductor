import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { sfx } from '@/services/sfxEngine'

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
  isMuted(): boolean
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
  const startIndexRef = useRef(startIndex)
  // refs espejo para callbacks frescos sin recrear el player
  const endedCb = useRef(onEnded)
  const playStateCb = useRef(onPlayingChange)
  const timeCb = useRef(onTime)
  const wantPlay = useRef(playing)
  // timers del helper de reanudación (limpiados al desmontar/recrear player)
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  // single-flight: cada guaranteedPlay invalida los timers de la anterior
  const playGen = useRef(0)
  // watchdog de audio: reintenta unMute mientras suena muteado (fix v5)
  const auditTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  endedCb.current = onEnded
  playStateCb.current = onPlayingChange
  timeCb.current = onTime
  wantPlay.current = playing
  startIndexRef.current = startIndex

  const stopAudioAudit = () => {
    if (auditTimer.current) {
      clearInterval(auditTimer.current)
      auditTimer.current = null
    }
  }

  // FIX v5 — auto-advance mudo: el unMute post-mute-trick corre en un setTimeout,
  // SIN activación de usuario. Si pasaron >5s desde el último click (auto-advance),
  // Chromium/WebView2 lo IGNORA y el track queda sonando sin audio.
  // Watchdog: mientras quiera reproducir y esté muteado, reintenta unMute cada ~800ms.
  // Se autodetiene al lograr audio, al pausar o si el player desaparece. Barato:
  // dos llamadas IPC al iframe por tick, solo durante el estado problemático.
  // Bonus: cuando el MEI del perfil acumula reproducción, la política se relaja
  // sola y este loop aprovecha el primer tick en que pasa a estar permitido.
  const ensureAudible = () => {
    if (auditTimer.current) return
    auditTimer.current = setInterval(() => {
      const p = playerRef.current
      if (!p || !wantPlay.current) {
        stopAudioAudit()
        return
      }
      try {
        if (p.getPlayerState() !== YT_PLAYING) {
          stopAudioAudit()
          return
        }
        if (p.isMuted()) p.unMute()
        else stopAudioAudit()
      } catch {
        stopAudioAudit()
      }
    }, 800)
  }

  // Reanudación garantizada bajo autoplay policy: el primer play fue muted-autoplay,
  // así que un playVideo() posterior sobre el player sin mute puede ser bloqueado
  // (WebView2/Chrome sin MEI ni activación delegada al iframe). Si a los ~500ms no
  // arrancó, truco infalible: mute+play (siempre permitido) y watchdog de unMute.
  // Single-flight: una llamada nueva incrementa la generación y limpia los timers
  // de la anterior — las 3 entradas (onReady, efecto [playing], post-loadVideoById)
  // ya no pueden interleavearse entre sí.
  const guaranteedPlay = () => {
    const p = playerRef.current
    if (!p) return
    const gen = ++playGen.current
    clearPendingTimers()
    try {
      p.playVideo()
    } catch {
      // noop
    }
    pendingTimers.current.push(
      setTimeout(() => {
        if (gen !== playGen.current) return
        const p2 = playerRef.current
        if (!p2 || !wantPlay.current) return
        let state = -99
        try {
          state = p2.getPlayerState()
        } catch {
          return
        }
        ensureAudible()
        if (state === YT_PLAYING) return
        try {
          p2.mute()
          p2.playVideo()
        } catch {
          // noop
        }
      }, 500),
    )
  }

  const clearPendingTimers = () => {
    pendingTimers.current.forEach(clearTimeout)
    pendingTimers.current = []
    stopAudioAudit()
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
            // race: salto manual antes de que cargue iframe_api → create() usó el
            // startIndex viejo; aplicar el salto pendiente ahora
            if (startIndexRef.current !== loadedIndexRef.current) {
              loadedIndexRef.current = startIndexRef.current
              try { player.loadVideoById(videoIds[startIndexRef.current]) } catch { /* noop */ }
            }
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

    // FIX v5 — rescate por gesto: con activación de usuario real el unMute SIEMPRE
    // se honra. Cualquier click en cualquier parte de la app recupera el audio de un
    // track que hubiera quedado mudo tras un auto-advance.
    const rescueAudio = () => {
      const p = playerRef.current
      if (!p || !wantPlay.current) return
      try {
        if (p.getPlayerState() === YT_PLAYING && p.isMuted()) p.unMute()
      } catch {
        // noop
      }
    }
    document.addEventListener('pointerdown', rescueAudio, true)

    return () => {
      disposed = true
      if (poll) clearInterval(poll)
      clearPendingTimers()
      stopAudioAudit()
      document.removeEventListener('pointerdown', rescueAudio, true)
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
        <TouchableOpacity
          onPress={() => {
            sfx.play('eject')
            onClose()
          }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          activeOpacity={0.7}
        >
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
