import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View, Animated as RNAnimated, Easing } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

interface EqualizerProps {
  isPlaying: boolean
  barCount?: number
}

function EqBar({ isPlaying }: { isPlaying: boolean }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const height = useRef(new RNAnimated.Value(4)).current

  useEffect(() => {
    if (!isPlaying) {
      RNAnimated.timing(height, {
        toValue: 4,
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
        RNAnimated.timing(height, { toValue: 4, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [isPlaying, height])

  return (
    <View style={styles.barContainer}>
      <RNAnimated.View style={[styles.bar, { height }]} />
    </View>
  )
}

export function Equalizer({ isPlaying, barCount = 10 }: EqualizerProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const bars = Array.from({ length: barCount }, (_, i) => i)

  return (
    <View style={styles.container}>
      {bars.map((i) => (
        <EqBar key={i} isPlaying={isPlaying} />
      ))}
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
      minHeight: 4,
    },
  })
