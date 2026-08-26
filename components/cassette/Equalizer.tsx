import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View, Animated as RNAnimated, Easing } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { audioPlayer } from '@/services/player'

interface EqualizerProps {
  isPlaying: boolean
  barCount?: number
  /** Color dinámico de la carátula; null = eqBar del tema */
  accent?: string | null
}

const BAR_MIN_PX = 4
const BAR_MAX_PX = 26
const REACTIVE_FRAME_MS = 45

function EqBar({ isPlaying, accent }: { isPlaying: boolean; accent?: string | null }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const height = useRef(new RNAnimated.Value(BAR_MIN_PX)).current

  useEffect(() => {
    if (!isPlaying) {
      RNAnimated.timing(height, {
        toValue: BAR_MIN_PX,
        duration: 300,
        useNativeDriver: false,
      }).start()
      return undefined
    }

    // Random per-bar rhythm so bars don't move in sync
    const dur = 200 + Math.random() * 200
    const maxH = 20 + Math.random() * 10
    const midH = 5 + Math.random() * 15

    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(height, { toValue: maxH, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        RNAnimated.timing(height, { toValue: midH, duration: dur * 0.8, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        RNAnimated.timing(height, { toValue: BAR_MIN_PX, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [isPlaying, height])

  return (
    <View style={styles.barContainer}>
      <RNAnimated.View style={[styles.bar, { height }, accent ? { backgroundColor: accent } : null]} />
    </View>
  )
}

export function Equalizer({ isPlaying, barCount = 10, accent }: EqualizerProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const bars = Array.from({ length: barCount }, (_, i) => i)

  // Modo reactivo: si el motor de audio expone FFT real (web + CORS ok),
  // las barras siguen la música; si no, cada barra cae a su loop random.
  const [levels, setLevels] = useState<number[] | null>(null)
  useEffect(() => {
    if (!isPlaying) {
      setLevels(null)
      return undefined
    }
    let raf = 0
    let last = 0
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick)
      if (t - last < REACTIVE_FRAME_MS) return
      last = t
      setLevels(audioPlayer.getAudioLevels(barCount))
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      setLevels(null)
    }
  }, [isPlaying, barCount])

  const reactive = levels !== null && levels.length === barCount

  return (
    <View style={styles.container}>
      {bars.map((i) =>
        reactive ? (
          <View
            key={i}
            style={[
              styles.bar,
              { height: Math.max(BAR_MIN_PX, Math.round((levels![i] ?? 0) * BAR_MAX_PX)) },
              accent ? { backgroundColor: accent } : null,
            ]}
          />
        ) : (
          <EqBar key={i} isPlaying={isPlaying} accent={accent} />
        )
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 4,
      height: 30,
      backgroundColor: colors.black,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 4,
    },
    barContainer: {
      width: 6,
      height: '100%',
      justifyContent: 'flex-end',
    },
    bar: {
      width: '100%',
      backgroundColor: colors.eqBar,
      minHeight: BAR_MIN_PX,
    },
  })
