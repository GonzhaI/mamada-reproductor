import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { audioPlayer } from '@/services/player'

/** 4 tornillos de esquina con ranura */
export function Screws({ size = 8 }: { size?: number }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, size), [colors, size])
  return (
    <>
      <View style={[styles.screw, styles.tl]}><View style={styles.slot} /></View>
      <View style={[styles.screw, styles.tr]}><View style={styles.slot} /></View>
      <View style={[styles.screw, styles.bl]}><View style={styles.slot} /></View>
      <View style={[styles.screw, styles.br]}><View style={styles.slot} /></View>
    </>
  )
}

/** LED de encendido con glow cuando está activo */
export function PowerLed({ on, color }: { on: boolean; color?: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, 8), [colors])
  const c = color ?? colors.accent
  return (
    <View style={styles.ledRow}>
      <View style={[styles.led, { backgroundColor: on ? c : colors.border, shadowColor: c, opacity: on ? 1 : 0.5 }]} />
    </View>
  )
}

/** Mini VU-meter estéreo reactivo (FFT real cuando hay, si no rebota suave) */
export function VuMeter({ isPlaying, width = 120 }: { isPlaying: boolean; width?: number }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, 8), [colors])
  const [levels, setLevels] = useState<[number, number]>([0, 0])
  const t = useRef(0)
  useEffect(() => {
    if (!isPlaying) {
      setLevels([0, 0])
      return undefined
    }
    const id = setInterval(() => {
      t.current += 0.35
      try {
        const lv = audioPlayer.getAudioLevels?.(4)
        if (lv && lv.length >= 2) {
          setLevels([lv[0] ?? 0, lv[1] ?? lv[0] ?? 0])
          return
        }
      } catch { /* fallback animado */ }
      // Fallback: rebote pseudo-aleatorio suave
      const a = 0.35 + 0.3 * Math.abs(Math.sin(t.current)) + 0.15 * Math.abs(Math.sin(t.current * 2.7))
      const b = 0.35 + 0.3 * Math.abs(Math.cos(t.current * 0.9)) + 0.15 * Math.abs(Math.sin(t.current * 1.7))
      setLevels([Math.min(1, a), Math.min(1, b)])
    }, 120)
    return () => clearInterval(id)
  }, [isPlaying])
  return (
    <View style={[styles.vu, { width }]}>
      {levels.map((v, i) => (
        <View key={i} style={styles.vuRow}>
          <View style={styles.vuTrack}>
            <View style={[styles.vuFill, { width: `${Math.round(v * 100)}%` }]} />
            <View style={[styles.vuNeedle, { left: `${Math.round(v * 100)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  )
}

const createStyles = (colors: ThemeColors, size: number) =>
  StyleSheet.create({
    screw: {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.black,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tl: { top: 4, left: 4 },
    tr: { top: 4, right: 4 },
    bl: { bottom: 4, left: 4 },
    br: { bottom: 4, right: 4 },
    slot: { width: size * 0.6, height: 1, backgroundColor: colors.textMuted, transform: [{ rotate: '40deg' }] },
    ledRow: { alignItems: 'flex-end' },
    led: {
      width: 8,
      height: 8,
      borderRadius: 4,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 6,
      elevation: 4,
    },
    vu: { gap: 4, backgroundColor: colors.black, borderWidth: 1, borderColor: colors.border, padding: 4 },
    vuRow: { height: 8 },
    vuTrack: { flex: 1, backgroundColor: colors.surfaceAlt, position: 'relative', overflow: 'hidden' },
    vuFill: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: colors.accent, opacity: 0.85 },
    vuNeedle: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#fff' },
  })
