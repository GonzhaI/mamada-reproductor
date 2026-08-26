import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { findActiveLine, type LyricLine } from '@/services/lrclibApi'

interface LyricsViewProps {
  lines: LyricLine[]
  /** Posición actual del track en segundos */
  position: number
  /** Color de la línea activa (accent dinámico o del tema) */
  accentColor?: string | null
  /** Tap en una línea = saltar a ese momento */
  onSeekLine?: (seconds: number) => void
}

/**
 * Letra sincronizada estilo karaoke pixel: auto-scroll a la línea activa,
 * líneas futuras/pasadas atenuadas. Cada fila mide su propio y (onLayout)
 * para que el scroll sea correcto aunque una línea ocupe dos renglones.
 */
export function LyricsView({ lines, position, accentColor, onSeekLine }: LyricsViewProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const activeIndex = findActiveLine(lines, position)

  const scrollRef = useRef<ScrollView>(null)
  const lineYs = useRef(new Map<number, number>())
  const viewHeight = useRef(0)
  const prevActive = useRef(-2)

  useEffect(() => {
    if (activeIndex === prevActive.current) return
    prevActive.current = activeIndex
    if (activeIndex < 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true })
      return
    }
    const y = lineYs.current.get(activeIndex)
    if (y == null || !viewHeight.current) return
    scrollRef.current?.scrollTo({
      y: Math.max(0, y - viewHeight.current * 0.35),
      animated: true,
    })
  }, [activeIndex])

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        onLayout={e => {
          viewHeight.current = e.nativeEvent.layout.height
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {lines.map((line, i) => (
          <TouchableOpacity
            key={`${i}-${line.time}`}
            activeOpacity={0.7}
            disabled={!onSeekLine}
            onPress={() => onSeekLine?.(line.time)}
            onLayout={e => {
              lineYs.current.set(i, e.nativeEvent.layout.y)
            }}
          >
            <Text
              style={[
                styles.line,
                i === activeIndex && [styles.lineActive, accentColor ? { color: accentColor } : null],
              ]}
            >
              {line.text || '♪'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingVertical: 12,
    },
    line: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      lineHeight: 21,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 14,
      opacity: 0.55,
    },
    lineActive: {
      fontSize: 19,
      lineHeight: 25,
      color: colors.accent,
      opacity: 1,
    },
  })
