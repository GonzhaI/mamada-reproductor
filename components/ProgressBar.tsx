import { StyleSheet, View, Text } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { colors } from '@/theme/colors'

interface ProgressBarProps {
  currentTime: number
  duration: number
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ProgressBar({ currentTime, duration }: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const animatedFillStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${progress}%`, { duration: 200, easing: Easing.linear }),
    }
  })

  const animatedCursorStyle = useAnimatedStyle(() => {
    return {
      left: withTiming(`${progress}%`, { duration: 200, easing: Easing.linear }),
    }
  })

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <Animated.View style={[styles.fill, animatedFillStyle]} />
        <Animated.View style={[styles.cursor, animatedCursorStyle]} />
      </View>
      <View style={styles.times}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
    marginLeft: -3, // Center it on the current progress
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
