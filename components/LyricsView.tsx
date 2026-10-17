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
  /** Desfase aplicado (segundos): la letra se adelanta si es negativa */
  offset?: number
  /** Calibración ±1s; si no se pasa, no se muestran los controles */
  onNudgeOffset?: (delta: number) => void
}

/**
 * Letra sincronizada estilo karaoke pixel: auto-scroll a la línea activa,
 * líneas futuras/pasadas atenuadas. Cada fila mide su propio y (onLayout)
 * para que el scroll sea correcto aunque una línea ocupe dos renglones.
 */
export function LyricsView({
  lines,
  position,
  accentColor,
  onSeekLine,
  offset = 0,
  onNudgeOffset,
}: LyricsViewProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const activeIndex = findActiveLine(lines, position - offset)

  const scrollRef = useRef<ScrollView>(null)
  const lineYs = useRef(new Map<number, number>())
  const viewHeight = useRef(0)
  const prevActive = useRef(-2)

  // Canción nueva: resetear posiciones medidas y estado de scroll
  useEffect(() => {
    lineYs.current.clear()
    prevActive.current = -2
  }, [lines])

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
      {onNudgeOffset && (
        <View style={styles.offsetRow}>
          <TouchableOpacity
            style={styles.offsetBtn}
            onPress={() => onNudgeOffset(-1)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.offsetBtnText}>-1s</Text>
          </TouchableOpacity>
          <Text
            style={[
              styles.offsetValue,
              offset !== 0 && [styles.offsetValueNonZero, accentColor ? { color: accentColor } : null],
            ]}
            numberOfLines={1}
          >
            {offset > 0 ? `+${offset}s` : `${offset}s`}
          </Text>
          <TouchableOpacity
            style={styles.offsetBtn}
            onPress={() => onNudgeOffset(1)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.offsetBtnText}>+1s</Text>
          </TouchableOpacity>
        </View>
      )}
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
    offsetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingTop: 6,
      paddingBottom: 2,
    },
    offsetBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: 2,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    offsetBtnText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.textMuted,
    },
    offsetValue: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.border,
      minWidth: 34,
      textAlign: 'center',
    },
    offsetValueNonZero: {
      color: colors.accent,
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
