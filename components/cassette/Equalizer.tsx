import { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

interface EqualizerProps {
  isPlaying: boolean
  barCount?: number
}

function EqBar({ isPlaying }: { isPlaying: boolean; index: number; totalBars: number }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const height = useSharedValue(4) // initial small height

  useEffect(() => {
    if (isPlaying) {
      // Create a random but somewhat rhythmic animation for each bar
      const randomDuration = 200 + Math.random() * 300
      const randomMaxHeight = 10 + Math.random() * 20
      const randomMidHeight = 5 + Math.random() * 15

      height.value = withRepeat(
        withSequence(
          withTiming(randomMaxHeight, { duration: randomDuration, easing: Easing.inOut(Easing.ease) }),
          withTiming(randomMidHeight, { duration: randomDuration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(4, { duration: randomDuration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    } else {
      cancelAnimation(height)
      height.value = withTiming(4, { duration: 300 }) // settle down when paused
    }
  }, [isPlaying])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    }
  })

  return (
    <View style={styles.barContainer}>
      <Animated.View style={[styles.bar, animatedStyle]} />
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
        <EqBar key={i} isPlaying={isPlaying} index={i} totalBars={barCount} />
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
