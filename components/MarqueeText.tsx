import { useEffect } from 'react'
import { StyleSheet, Text, View, type TextProps } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

interface MarqueeTextProps extends TextProps {
  speed?: number
}

// Ticker continuo: dos copias del texto, scroll lineal en loop sobre -50%
// (una copia exacta por ciclo → seamlesss). Una copia oculta en flujo normal
// le da la altura al contenedor. Textos cortos quedan estáticos centrados
// (heurística por longitud: Press Start 2P es monoespaciada).
export function MarqueeText({ children, style, speed = 1, ...rest }: MarqueeTextProps) {
  const x = useSharedValue<`${number}%`>('0%')
  const text = String(children ?? '')
  const fits = text.length <= 26

  useEffect(() => {
    if (fits) return
    x.value = '0%'
    const duration = Math.max(text.length * 400 / speed, 8000)
    x.value = withDelay(
      1200,
      withRepeat(withTiming('-50%', { duration, easing: Easing.linear }), -1, false)
    )
    return () => cancelAnimation(x)
  }, [text])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }))

  if (fits) {
    return (
      <View style={styles.container}>
        <Text style={style} numberOfLines={1} {...rest}>
          {children}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={[style, styles.sizer]} numberOfLines={1} {...rest}>
        {children}
      </Text>
      <Animated.View style={[styles.row, animatedStyle]}>
        <Text style={[style, styles.copy]} numberOfLines={1} {...rest}>
          {children}
        </Text>
        <Text style={[style, styles.copy]} numberOfLines={1} {...rest}>
          {children}
        </Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
    alignItems: 'center',
  },
  sizer: {
    opacity: 0,
  },
  row: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: {
    paddingRight: 32,
  },
})
