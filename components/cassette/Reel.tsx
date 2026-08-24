import { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

interface ReelProps {
  isPlaying: boolean
  speed?: number
  size?: number
}

export function Reel({ isPlaying, speed = 1, size = 48 }: ReelProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const rotation = useSharedValue(0)

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 3000 / speed,
          easing: Easing.linear,
        }),
        -1, // Infinite repeat
        false
      )
    } else {
      cancelAnimation(rotation)
    }
  }, [isPlaying, speed])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    }
  })

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Animated.View style={[styles.reel, { width: size, height: size, borderRadius: size / 2 }, animatedStyle]}>
        {/* Spokes */}
        <View style={styles.spokeHorizontal} />
        <View style={styles.spokeVertical} />
        <View style={styles.spokeDiagonal1} />
        <View style={styles.spokeDiagonal2} />

        {/* Inner Hub */}
        <View style={styles.hubContainer}>
          <View style={styles.hub} />
        </View>
      </Animated.View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.tape,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    reel: {
      backgroundColor: colors.reel,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    hubContainer: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.black,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
    },
    hub: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    spokeHorizontal: {
      position: 'absolute',
      width: '100%',
      height: 2,
      backgroundColor: colors.tape,
    },
    spokeVertical: {
      position: 'absolute',
      width: 2,
      height: '100%',
      backgroundColor: colors.tape,
    },
    spokeDiagonal1: {
      position: 'absolute',
      width: '100%',
      height: 2,
      backgroundColor: colors.tape,
      transform: [{ rotate: '45deg' }],
    },
    spokeDiagonal2: {
      position: 'absolute',
      width: '100%',
      height: 2,
      backgroundColor: colors.tape,
      transform: [{ rotate: '-45deg' }],
    },
  })
