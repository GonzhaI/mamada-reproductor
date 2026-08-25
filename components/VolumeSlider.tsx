import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

interface VolumeSliderProps {
  value: number // 0..1
  onChange: (v: number) => void
  compact?: boolean
}

export function VolumeSlider({ value, onChange, compact = false }: VolumeSliderProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [barWidth, setBarWidth] = useState(0)
  const dragRatio = useSharedValue(-1)

  const commit = useCallback(
    (ratio: number) => {
      dragRatio.value = -1
      if (isFinite(ratio)) onChange(Math.min(1, Math.max(0, ratio)))
    },
    [onChange]
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
      runOnJS(commit)(dragRatio.value)
    })

  const animatedFillStyle = useAnimatedStyle(() => {
    const r = dragRatio.value >= 0 ? dragRatio.value : value
    return { width: `${r * 100}%` }
  })

  return (
    <View style={styles.container}>
      {!compact && <Text style={styles.icon}>♪</Text>}
      <GestureDetector gesture={pan}>
        <View
          style={compact ? styles.barCompact : styles.barContainer}
          onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.fill, animatedFillStyle]} />
        </View>
      </GestureDetector>
      {!compact && <Text style={styles.level}>{Math.round(value * 100)}</Text>}
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    icon: {
      fontSize: 14,
      color: colors.textMuted,
    },
    barContainer: {
      width: 140,
      height: 8,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
    },
    barCompact: {
      width: 90,
      height: 8,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.accent,
    },
    level: {
      fontFamily: 'VT323_400Regular',
      fontSize: 14,
      color: colors.textMuted,
      minWidth: 24,
      textAlign: 'right',
    },
  })
