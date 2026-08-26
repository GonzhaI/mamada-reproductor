import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { sfx } from '@/services/sfxEngine'

interface ProgressBarProps {
  currentTime: number
  duration: number
  onSeek?: (seconds: number) => void
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [barWidth, setBarWidth] = useState(0)
  const progress = duration > 0 ? currentTime / duration : 0

  // -1 = sin drag activo; si no, ratio 0..1 del arrastre
  const dragRatio = useSharedValue(-1)

  const commitSeek = useCallback(
    (ratio: number) => {
      dragRatio.value = -1
      if (onSeek && duration > 0 && isFinite(ratio)) {
        sfx.play('tick')
        onSeek(Math.min(1, Math.max(0, ratio)) * duration)
      }
    },
    [onSeek, duration]
  )

  const pan = Gesture.Pan()
    .hitSlop({ top: 12, bottom: 12 })
    .onBegin(e => {
      dragRatio.value = Math.min(1, Math.max(0, e.x / barWidth))
    })
    .onUpdate(e => {
      dragRatio.value = Math.min(1, Math.max(0, e.x / barWidth))
    })
    .onEnd(() => {
      runOnJS(commitSeek)(dragRatio.value)
    })

  const animatedFillStyle = useAnimatedStyle(() => {
    const r = dragRatio.value >= 0 ? dragRatio.value : progress
    if (dragRatio.value >= 0) return { width: `${r * 100}%` }
    return { width: withTiming(`${r * 100}%`, { duration: 200, easing: Easing.linear }) }
  })

  const animatedCursorStyle = useAnimatedStyle(() => {
    const r = dragRatio.value >= 0 ? dragRatio.value : progress
    if (dragRatio.value >= 0) return { left: `${r * 100}%` }
    return { left: withTiming(`${r * 100}%`, { duration: 200, easing: Easing.linear }) }
  })

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pan}>
        <View
          style={styles.barContainer}
          onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.fill, animatedFillStyle]} />
          <Animated.View style={[styles.cursor, animatedCursorStyle]} />
        </View>
      </GestureDetector>
      <View style={styles.times}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: '100%',
      gap: 8,
    },
    barContainer: {
      height: 8,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      position: 'relative',
      justifyContent: 'center',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.accent,
    },
    cursor: {
      position: 'absolute',
      width: 6,
      height: 16,
      backgroundColor: colors.text,
      marginLeft: -3,
      borderWidth: 1,
      borderColor: colors.black,
    },
    times: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    timeText: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      color: colors.textMuted,
    },
  })
