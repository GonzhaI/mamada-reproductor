import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View, Animated as RNAnimated, Easing } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

interface ReelProps {
  isPlaying: boolean
  speed?: number
  size?: number
  /** Cuánta cinta tiene enrollada este carrete, 0..1 (afina/engorda el spool) */
  fill?: number
}

const SPOOL_MIN = 20

export function Reel({ isPlaying, speed = 1, size = 48, fill = 0.5 }: ReelProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const rotation = useRef(new RNAnimated.Value(0)).current

  const clamped = Math.min(1, Math.max(0, fill))
  const spoolMax = size - 8
  // Área de cinta proporcional al fill (el radio crece con la raíz, como cinta real)
  const spoolSize = Math.round(SPOOL_MIN + (spoolMax - SPOOL_MIN) * Math.sqrt(clamped))

  useEffect(() => {
    if (!isPlaying) return undefined
    const loop = RNAnimated.loop(
      RNAnimated.timing(rotation, {
        toValue: 360,
        duration: 3000 / speed,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    )
    loop.start()
    return () => loop.stop()
  }, [isPlaying, speed, rotation])

  const spin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {/* Tape rings — visible spool that rotates; su tamaño = cinta restante */}
      <RNAnimated.View
        style={[
          styles.reel,
          { width: spoolSize, height: spoolSize, borderRadius: spoolSize / 2 },
          { transform: [{ rotate: spin }] },
        ]}
      >
        {/* Spokes */}
        <View style={styles.spokeHorizontal} />
        <View style={styles.spokeVertical} />
        <View style={styles.spokeDiagonal1} />
        <View style={styles.spokeDiagonal2} />

        {/* Inner Hub */}
        <View style={styles.hubContainer}>
          <View style={styles.hub} />
        </View>
      </RNAnimated.View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.black,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    reel: {
      backgroundColor: colors.reel,
      borderWidth: 3,
      borderColor: colors.tape,
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
      backgroundColor: colors.accent,
    },
    spokeHorizontal: {
      position: 'absolute',
      width: '100%',
      height: 4,
      backgroundColor: colors.tape,
    },
    spokeVertical: {
      position: 'absolute',
      width: 4,
      height: '100%',
      backgroundColor: colors.tape,
    },
    spokeDiagonal1: {
      position: 'absolute',
      width: '100%',
      height: 4,
      backgroundColor: colors.labelDark,
      opacity: 0.7,
      transform: [{ rotate: '45deg' }],
    },
    spokeDiagonal2: {
      position: 'absolute',
      width: '100%',
      height: 4,
      backgroundColor: colors.labelDark,
      opacity: 0.7,
      transform: [{ rotate: '-45deg' }],
    },
  })
