import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { sfx } from '@/services/sfxEngine'
import { getGenreTracks } from '@/services/jamendoApi'
import { type Track } from '@/services/types'
import { usePlayer } from '@/hooks/usePlayer'

interface RadioProps {
  isPlaying: boolean
  coverUrl?: string
  title?: string
  artist?: string
  accent?: string | null
}

interface Station {
  freq: number
  id: string // genreId o 'random'
  label: string
}

const FREQ_MIN = 88
const FREQ_MAX = 108

// Estaciones del dial: los géneros vivos de Jamendo + shuffle total.
const STATIONS: Station[] = [
  { freq: 89.1, id: 'lofi', label: 'LOFI CHILL' },
  { freq: 94.3, id: 'piano', label: 'PIANO NOCTURNO' },
  { freq: 99.9, id: 'downtempo', label: 'DOWNTEMPO' },
  { freq: 105.7, id: 'random', label: 'ALEATORIO FM' },
]

function nearestStation(freq: number): { station: Station; distance: number } {
  let best = STATIONS[0]!
  let bestDist = Math.abs(best.freq - freq)
  for (const s of STATIONS) {
    const d = Math.abs(s.freq - freq)
    if (d < bestDist) {
      best = s
      bestDist = d
    }
  }
  return { station: best, distance: bestDist }
}

/**
 * Skin RADIO FM: dial analógico arrastrable entre "estaciones" (géneros
 * Jamendo). Mientras la aguja está lejos de una estación se escucha estática
 * blanca sintetizada (sfxEngine) cuya intensidad sigue la distancia. El botón
 * SINTONIZAR carga la estación en el player y reproduce desde un tema random.
 */
export function Radio() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { playTrack, isPlaying, togglePlay } = usePlayer()

  const [freq, setFreq] = useState(STATIONS[0]!.freq)
  const [tuning, setTuning] = useState(false)
  const [loadingStation, setLoadingStation] = useState<string | null>(null)
  // última estación sintonizada con éxito (para el toggle pausa del botón)
  const [tunedStation, setTunedStation] = useState<string | null>(null)
  const barWidth = useRef(1)
  const dragRatio = useSharedValue(-1)

  const locked = nearestStation(freq)
  const isLockedOn = !tuning && locked.distance < 0.35

  // Estática proporcional a la distancia a la estación más cercana
  useEffect(() => {
    if (!tuning) {
      sfx.setStatic(isLockedOn ? 0 : 0.06)
      return undefined
    }
    const level = Math.min(0.22, 0.04 + locked.distance * 0.045)
    sfx.setStatic(level)
    return undefined
  }, [tuning, isLockedOn, locked.distance])

  // Al desmontar el skin: cortar estática
  useEffect(() => () => sfx.setStatic(0), [])

  // Durante el drag muestro frecuencia continua (sin snap).
  // IMPORT: declarar ANTES del gesto — reanimated captura las closures al
  // CREAR el worklet; una const de más abajo está en TDZ y revienta el mount.
  const setFreqLive = useCallback(
    (ratio: number) => {
      setFreq(ratio * (FREQ_MAX - FREQ_MIN) + FREQ_MIN)
    },
    []
  )

  const commitTune = useCallback(
    (ratio: number) => {
      dragRatio.value = -1
      setTuning(false)
      const snapped = nearestStation(ratio * (FREQ_MAX - FREQ_MIN) + FREQ_MIN).station.freq
      sfx.play('tick')
      setFreq(snapped)
    },
    [dragRatio]
  )

  const pan = Gesture.Pan()
    .hitSlop({ top: 12, bottom: 12 })
    .onBegin(e => {
      dragRatio.value = Math.min(1, Math.max(0, e.x / barWidth.current))
      runOnJS(setTuning)(true)
    })
    .onUpdate(e => {
      dragRatio.value = Math.min(1, Math.max(0, e.x / barWidth.current))
      runOnJS(setFreqLive)(Math.min(1, Math.max(0, e.x / barWidth.current)))
    })
    .onEnd(() => {
      runOnJS(commitTune)(dragRatio.value)
    })

  const needleStyle = useAnimatedStyle(() => {
    const r = dragRatio.value >= 0 ? dragRatio.value : (freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN)
    return { left: `${r * 100}%` }
  })

  const tuneIn = async () => {
    const station = nearestStation(freq).station
    if (loadingStation) return
    // Misma estación ya sonando => play/pause
    if (tunedStation === station.id && isPlaying) {
      sfx.play('clack')
      void togglePlay()
      return
    }
    sfx.play('load')
    setLoadingStation(station.id)
    try {
      const tracks = await getGenreTracksFor(station.id)
      if (!tracks.length) throw new Error('sin tracks')
      const start = Math.floor(Math.random() * tracks.length) // radio: entra donde agarre
      await playTrack(tracks[start]!, tracks, start)
      setTunedStation(station.id)
    } catch {
      // red caída: quedamos en estática, silencioso
    } finally {
      setLoadingStation(null)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.chassis}>
        {/* Display de frecuencia */}
        <View style={styles.displayRow}>
          <Text style={styles.displayFreq}>{freq.toFixed(1)}</Text>
          <Text style={styles.displayUnit}>MHz FM</Text>
          <View style={[styles.onAirDot, isPlaying && styles.onAirActive]} />
        </View>
        <Text style={styles.stationLabel}>
          {isLockedOn ? `◈ ${locked.station.label}` : tuning ? '··· SINTONIZANDO ···' : '— ESTÁTICA —'}
        </Text>

        {/* Dial */}
        <GestureDetector gesture={pan}>
          <View
            style={styles.dial}
            onLayout={e => {
              barWidth.current = Math.max(1, e.nativeEvent.layout.width)
            }}
          >
            {/* banda de frecuencias */}
            <View style={styles.dialBand} />
            {/* ticks */}
            <View style={styles.ticks}>
              {Array.from({ length: 21 }, (_, i) => (
                <View key={i} style={[styles.tick, i % 5 === 0 && styles.tickMajor]} />
              ))}
            </View>
            {/* marcadores de estación */}
            {STATIONS.map(s => (
              <View
                key={s.id}
                pointerEvents="none"
                style={[
                  styles.stationMark,
                  { left: `${((s.freq - FREQ_MIN) / (FREQ_MAX - FREQ_MIN)) * 100}%` },
                ]}
              />
            ))}
            {/* aguja */}
            <Animated.View pointerEvents="none" style={[styles.needle, needleStyle]} />
          </View>
        </GestureDetector>

        {/* Botón SINTONIZAR / PAUSA */}
        <TouchableOpacity
          style={[styles.tuneBtn, isLockedOn && styles.tuneBtnLocked]}
          activeOpacity={0.7}
          onPress={() => void tuneIn()}
          disabled={loadingStation != null}
        >
          <Text style={styles.tuneBtnText}>
            {loadingStation ? 'CARGANDO...' : isLockedOn && isPlaying ? '⏸ PAUSA' : '▶ SINTONIZAR'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.brand}>TRANSISTOR-6 · BANDA CITADINA</Text>
      </View>
    </View>
  )
}

// caché por estación: ALEATORIO hace 3 fetches (cada uno con reintentos
// internos) — sin caché, cada click en SINTONIZAR dispara hasta 9 requests
const stationCache = new Map<string, Track[]>()

async function getGenreTracksFor(id: string) {
  const cached = stationCache.get(id)
  if (cached) return cached
  let tracks: Track[]
  if (id === 'random') {
    const [a, b, c] = await Promise.all([
      getGenreTracks('lofi'),
      getGenreTracks('piano'),
      getGenreTracks('downtempo'),
    ])
    const all = [...a, ...b, ...c]
    // Fisher-Yates total: radio aleatoria
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[all[i], all[j]] = [all[j]!, all[i]!]
    }
    tracks = all
  } else {
    tracks = await getGenreTracks(id)
  }
  stationCache.set(id, tracks)
  return tracks
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      width: '100%',
    },
    chassis: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
    displayRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    displayFreq: {
      fontFamily: 'VT323_400Regular',
      fontSize: 44,
      lineHeight: 48,
      color: colors.accent,
      letterSpacing: 2,
    },
    displayUnit: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.textMuted,
    },
    onAirDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginLeft: 4,
    },
    onAirActive: {
      backgroundColor: '#E5533D',
    },
    stationLabel: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.text,
      letterSpacing: 1,
      marginTop: 4,
      marginBottom: 12,
    },
    dial: {
      width: '100%',
      height: 44,
      justifyContent: 'center',
    },
    dialBand: {
      position: 'absolute',
      top: 16,
      left: 0,
      right: 0,
      height: 12,
      backgroundColor: colors.black,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 2,
    },
    ticks: {
      position: 'absolute',
      top: 30,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    tick: {
      width: 1,
      height: 5,
      backgroundColor: colors.border,
    },
    tickMajor: {
      height: 9,
      backgroundColor: colors.textMuted,
    },
    stationMark: {
      position: 'absolute',
      top: 13,
      width: 5,
      height: 5,
      marginLeft: -2,
      borderRadius: 1,
      backgroundColor: colors.label,
    },
    needle: {
      position: 'absolute',
      top: 8,
      width: 3,
      height: 28,
      marginLeft: -1.5,
      backgroundColor: colors.accent,
      borderRadius: 1,
    },
    tuneBtn: {
      marginTop: 14,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 4,
    },
    tuneBtnLocked: {
      borderColor: colors.accent,
    },
    tuneBtnText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.text,
      letterSpacing: 1,
    },
    brand: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 5,
      color: colors.textMuted,
      letterSpacing: 1,
      marginTop: 12,
    },
  })
