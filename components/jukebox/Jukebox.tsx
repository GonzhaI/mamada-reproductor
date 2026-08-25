import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View, Image, Animated as RNAnimated, Easing, Text } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

interface JukeboxProps {
  isPlaying: boolean
  coverUrl?: string
  title?: string
  artist?: string
}

const BUBBLES = 4

export function Jukebox({
  isPlaying,
  coverUrl,
  title,
  artist,
}: JukeboxProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  // Un solo valor maestro → onda viajera por las burbujas (loop seamless)
  const wave = useRef(new RNAnimated.Value(0)).current
  useEffect(() => {
    if (!isPlaying) return undefined
    const loop = RNAnimated.loop(
      RNAnimated.timing(wave, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    )
    loop.start()
    return () => loop.stop()
  }, [isPlaying, wave])

  // Brillo del arco superior
  const glow = useRef(new RNAnimated.Value(0.15)).current
  useEffect(() => {
    if (!isPlaying) {
      glow.setValue(0.15)
      return undefined
    }
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(glow, { toValue: 0.7, duration: 1100, useNativeDriver: false }),
        RNAnimated.timing(glow, { toValue: 0.35, duration: 1100, useNativeDriver: false }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [isPlaying, glow])

  const bubbleOpacity = (i: number) =>
    wave.interpolate({
      inputRange: [0, 0.25, 0.5, 0.75, 1],
      outputRange: [0, 1, 2, 3, 4].map(k => 0.25 + 0.75 * (0.5 - 0.5 * Math.cos(2 * Math.PI * ((k / 4) - i / BUBBLES)))),
    })

  return (
    <View style={styles.container}>
      <View style={styles.chassis}>
        {/* Glow del arco */}
        <RNAnimated.View style={[styles.archGlow, { opacity: glow }]} />

        {/* Cabina con burbujas y ventana del disco */}
        <View style={styles.cabin}>
          <BubbleTube styles={styles} opacityFor={bubbleOpacity} />
          <View style={styles.window}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={styles.cover} />
            ) : (
              <View style={styles.windowFallback}>
                <Text style={styles.windowTitle} numberOfLines={2}>{title}</Text>
              </View>
            )}
            <View style={styles.windowShine} />
          </View>
          <BubbleTube styles={styles} opacityFor={bubbleOpacity} />
        </View>

        {/* Placa de título */}
        <View style={styles.titlePlate}>
          <Text style={styles.plateLabel} numberOfLines={1}>NOW PLAYING</Text>
          <Text style={styles.plateArtist} numberOfLines={1}>
            {artist || 'FREE JUKEBOX'}
          </Text>
        </View>

        {/* Botonera */}
        <View style={styles.buttonRow}>
          {['#E5533D', '#EBA937', '#3FA34D', '#3E7CB1', '#8E5AA8'].map(c => (
            <View key={c} style={[styles.button, isPlaying && { backgroundColor: c }]}>
              <View style={styles.buttonDot} />
            </View>
          ))}
        </View>

        {/* Rejilla inferior */}
        <View style={styles.grille}>
          <View style={styles.grilleLine} />
          <View style={styles.grilleLine} />
          <View style={styles.grilleLine} />
        </View>
      </View>

      {/* Patas */}
      <View style={styles.feetRow}>
        <View style={styles.foot} />
        <View style={styles.foot} />
      </View>
    </View>
  )
}

function BubbleTube({
  styles,
  opacityFor,
}: {
  styles: ReturnType<typeof createStyles>
  opacityFor: (i: number) => RNAnimated.AnimatedInterpolation<number>
}) {
  return (
    <View style={styles.tube}>
      {Array.from({ length: BUBBLES }, (_, i) => (
        <RNAnimated.View key={i} style={[styles.bubble, { opacity: opacityFor(i) }]} />
      ))}
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      width: '100%',
      maxWidth: 300,
    },
    chassis: {
      width: '100%',
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.border,
      borderTopLeftRadius: 80,
      borderTopRightRadius: 80,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      paddingTop: 24,
      paddingHorizontal: 14,
      paddingBottom: 10,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 10,
    },
    archGlow: {
      position: 'absolute',
      top: 6,
      alignSelf: 'center',
      width: 140,
      height: 60,
      borderRadius: 70,
      backgroundColor: colors.accent,
    },
    cabin: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    tube: {
      width: 16,
      height: 120,
      borderRadius: 8,
      backgroundColor: colors.black,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'space-evenly',
      paddingVertical: 6,
    },
    bubble: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    window: {
      width: 130,
      height: 130,
      borderRadius: 65,
      borderWidth: 3,
      borderColor: colors.labelDark,
      overflow: 'hidden',
      backgroundColor: colors.black,
    },
    cover: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    windowFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
    },
    windowTitle: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 8,
      color: colors.label,
      textAlign: 'center',
      lineHeight: 13,
    },
    windowShine: {
      position: 'absolute',
      top: -30,
      left: -20,
      width: 90,
      height: 70,
      borderRadius: 45,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      transform: [{ rotate: '30deg' }],
    },
    titlePlate: {
      marginTop: 12,
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 3,
      paddingHorizontal: 12,
      paddingVertical: 5,
      minWidth: 170,
    },
    plateLabel: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 5,
      color: colors.textMuted,
      letterSpacing: 1,
      marginBottom: 3,
    },
    plateArtist: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      color: colors.accent,
      letterSpacing: 1,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 10,
    },
    button: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.black,
    },
    grille: {
      width: '82%',
      marginTop: 10,
      gap: 3,
    },
    grilleLine: {
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.border,
    },
    feetRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '76%',
      marginTop: 2,
    },
    foot: {
      width: 22,
      height: 6,
      borderRadius: 2,
      backgroundColor: colors.black,
      borderWidth: 1,
      borderColor: colors.border,
    },
  })
