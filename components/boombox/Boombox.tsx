import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View, Text, Image, Animated as RNAnimated, Easing } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { Screws, PowerLed, VuMeter } from '@/components/physical/Physical'

interface BoomboxProps {
  isPlaying: boolean
  coverUrl?: string
  title?: string
  artist?: string
  trackKey?: string
  accent?: string | null
}

/** 7mo modelo: BOOMBOX — doble parlante pulsante + ventana de cassette + VU estéreo */
export function Boombox({ isPlaying, coverUrl, title, artist, trackKey, accent }: BoomboxProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const glowColor = accent ?? colors.accent

  // Pulso de parlantes al reproducir (un solo loop maestro)
  const pulse = useRef(new RNAnimated.Value(0)).current
  useEffect(() => {
    if (!isPlaying) {
      pulse.setValue(0)
      return undefined
    }
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        RNAnimated.timing(pulse, { toValue: 0, duration: 420, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [isPlaying, pulse])

  // Flash de ventana al cambiar de track
  const flash = useRef(new RNAnimated.Value(0)).current
  const prevKey = useRef(trackKey)
  useEffect(() => {
    if (prevKey.current === trackKey) return
    prevKey.current = trackKey
    flash.setValue(0.6)
    RNAnimated.timing(flash, { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: false }).start()
  }, [trackKey, flash])

  const coneScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] })

  return (
    <View style={styles.box}>
      <Screws />
      <View style={styles.topRow}>
        <Text style={styles.brand}>BOOMBOX-90</Text>
        <PowerLed on={isPlaying} color={glowColor} />
      </View>
      <View style={styles.speakers}>
        {[0, 1].map(i => (
          <View key={i} style={styles.speaker}>
            <RNAnimated.View style={[styles.cone, { transform: [{ scale: coneScale }], borderColor: glowColor }]}>
              <View style={styles.coneInner} />
            </RNAnimated.View>
          </View>
        ))}
      </View>
      <View style={styles.deck}>
        <View style={styles.window}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.cover} />
          ) : (
            <View style={styles.coverFallback}>
              <Text style={styles.coverFallbackText}>♪</Text>
            </View>
          )}
          <RNAnimated.View style={[styles.flash, { opacity: flash, backgroundColor: glowColor }]} pointerEvents="none" />
        </View>
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>{(title ?? 'NO TAPE').toUpperCase()}</Text>
          <Text style={styles.artist} numberOfLines={1}>{artist ?? ''}</Text>
          <VuMeter isPlaying={isPlaying} width={150} />
        </View>
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    box: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      gap: 10,
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 10,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brand: { fontFamily: 'PressStart2P_400Regular', fontSize: 8, color: colors.text, letterSpacing: 2 },
    speakers: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    speaker: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.black,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cone: {
      width: 92,
      height: 92,
      borderRadius: 46,
      borderWidth: 3,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    coneInner: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.black, borderWidth: 2, borderColor: colors.border },
    deck: { flexDirection: 'row', gap: 12, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border, borderRadius: 6, padding: 10 },
    window: { width: 96, height: 96, backgroundColor: colors.black, borderWidth: 2, borderColor: colors.border, position: 'relative', overflow: 'hidden' },
    cover: { width: '100%', height: '100%' },
    coverFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
    coverFallbackText: { fontSize: 32, color: colors.textMuted },
    flash: { ...StyleSheet.absoluteFillObject },
    meta: { flex: 1, gap: 6, justifyContent: 'center' },
    title: { fontFamily: 'PressStart2P_400Regular', fontSize: 8, color: colors.text },
    artist: { fontFamily: 'VT323_400Regular', fontSize: 16, color: colors.textMuted },
  })
