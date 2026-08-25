import { useEffect, useRef } from 'react'
import { Animated, Image, StyleSheet, View } from 'react-native'

interface CrossfadeCoverProps {
  art: number
  overlay1: number
  overlay2: number
  intervalMs?: number
}

/**
 * Alterna tres imágenes en loop: art → overlay1 → overlay2 → art.
 * Ciclo: 5s visible → 800ms crossfade × 3 pasos, luego reset.
 * Animated built-in de RN (reanimated vetado para loops en web).
 */
export function CrossfadeCover({ art, overlay1, overlay2, intervalMs = 5000 }: CrossfadeCoverProps) {
  const o1 = useRef(new Animated.Value(0)).current
  const o2 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const seq = Animated.loop(
      Animated.sequence([
        // art visible, fade in overlay1
        Animated.delay(intervalMs),
        Animated.timing(o1, { toValue: 1, duration: 800, useNativeDriver: false }),
        // overlay1 visible, fade in overlay2
        Animated.delay(intervalMs),
        Animated.timing(o2, { toValue: 1, duration: 800, useNativeDriver: false }),
        // overlay2 visible, fade out both → art
        Animated.delay(intervalMs),
        Animated.parallel([
          Animated.timing(o1, { toValue: 0, duration: 800, useNativeDriver: false }),
          Animated.timing(o2, { toValue: 0, duration: 800, useNativeDriver: false }),
        ]),
      ]),
    )
    seq.start()
    return () => seq.stop()
  }, [o1, o2, intervalMs])

  return (
    <View style={styles.container}>
      <Image source={art} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: o1 }]}>
        <Image source={overlay1} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: o2 }]}>
        <Image source={overlay2} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
})
