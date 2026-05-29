import { StyleSheet, View, TouchableOpacity, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { colors } from '@/theme/colors'

interface ControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  onNext: () => void
  onPrevious: () => void
}

function ControlButton({
  icon,
  onPress,
  isPlayBtn = false,
  isActive = false,
}: {
  icon: string
  onPress: () => void
  isPlayBtn?: boolean
  isActive?: boolean
}) {
  const scale = useSharedValue(1)
  const translateY = useSharedValue(0)

  const handlePressIn = () => {
    scale.value = withSpring(0.95)
    translateY.value = withTiming(2, { duration: 50 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1)
    translateY.value = withTiming(0, { duration: 100 })
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
    }
  })

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={1} // Handled by reanimated
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.btn,
          isPlayBtn && styles.btnPlay,
          isActive && styles.btnActive,
        ]}
      >
        <Text
          style={[
            styles.icon,
            isPlayBtn && styles.iconPlay,
            isActive && styles.iconActive,
          ]}
        >
          {icon}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

export function Controls({
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
}: ControlsProps) {
  return (
    <View style={styles.container}>
      <ControlButton icon="⏮" onPress={onPrevious} />
      <ControlButton
        icon={isPlaying ? "⏸" : "▶"}
        onPress={onPlayPause}
        isPlayBtn
        isActive={isPlaying}
      />
      <ControlButton icon="⏭" onPress={onNext} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  btn: {
    width: 56,
    height: 56,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  btnPlay: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.accent,
  },
  btnActive: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    shadowOffset: { width: 0, height: 1 }, // Pressed state shadow
  },
  icon: {
    fontSize: 24,
    color: colors.text,
  },
  iconPlay: {
    fontSize: 32,
    color: colors.accent,
  },
  iconActive: {
    color: colors.accent,
  },
})
