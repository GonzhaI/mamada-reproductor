import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { audioPlayer } from '@/services/player'

const BAR_COUNT = 18
const FRAME_MS = 55

export function ReactiveVisualizer({ isPlaying, accent }: { isPlaying: boolean; accent?: string | null }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [levels, setLevels] = useState<number[]>([])

  useEffect(() => {
    if (!isPlaying) {
      setLevels([])
      return undefined
    }
    let raf = 0
    let last = 0
    const tick = (time: number) => {
      raf = requestAnimationFrame(tick)
      if (time - last < FRAME_MS) return
      last = time
      const next = audioPlayer.getAudioLevels(BAR_COUNT)
      if (next) setLevels(next)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying])

  const bars = levels.length === BAR_COUNT ? levels : Array.from({ length: BAR_COUNT }, (_, i) => 0.12 + ((i * 13) % 5) / 30)

  return (
    <View style={styles.wrap} pointerEvents="none">
      {bars.map((level, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            { height: Math.max(3, Math.round(level * 28)), opacity: isPlaying ? 0.45 + level * 0.55 : 0.25 },
            accent ? { backgroundColor: accent } : null,
          ]}
        />
      ))}
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bar: { width: 4, minHeight: 3, backgroundColor: colors.accent },
})
