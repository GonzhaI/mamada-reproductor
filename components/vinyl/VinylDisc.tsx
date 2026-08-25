import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View, Image, Animated as RNAnimated, Easing, Text } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

interface VinylDiscProps {
  isPlaying: boolean
  coverUrl?: string
  title?: string
  artist?: string
  size?: number
}

export function VinylDisc({
  isPlaying,
  coverUrl,
  title,
  artist,
  size = 230,
}: VinylDiscProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const rotation = useRef(new RNAnimated.Value(0)).current

  useEffect(() => {
    if (!isPlaying) return undefined
    const loop = RNAnimated.loop(
      RNAnimated.timing(rotation, {
        toValue: 360,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    )
    loop.start()
    return () => loop.stop()
  }, [isPlaying, rotation])

  const spin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  })

  const labelSize = Math.round(size * 0.38)
  const centerHoleSize = Math.max(10, Math.round(size * 0.05))

  return (
    <View style={[styles.discContainer, { width: size, height: size, borderRadius: size / 2 }]}>
      <RNAnimated.View
        style={[
          styles.disc,
          { width: size, height: size, borderRadius: size / 2 },
          { transform: [{ rotate: spin }] },
        ]}
      >
        {/* Vinyl Grooves (Surcos) */}
        <View style={[styles.groove, { width: size - 16, height: size - 16, borderRadius: (size - 16) / 2 }]} />
        <View style={[styles.groove, { width: size - 36, height: size - 36, borderRadius: (size - 36) / 2 }]} />
        <View style={[styles.groove, { width: size - 56, height: size - 56, borderRadius: (size - 56) / 2 }]} />
        <View style={[styles.groove, { width: size - 76, height: size - 76, borderRadius: (size - 76) / 2 }]} />
        <View style={[styles.groove, { width: size - 96, height: size - 96, borderRadius: (size - 96) / 2 }]} />

        {/* Light reflection sheen / gloss */}
        <View style={styles.sheenTop} />
        <View style={styles.sheenBottom} />

        {/* Center Label (Etiqueta central) */}
        <View
          style={[
            styles.label,
            { width: labelSize, height: labelSize, borderRadius: labelSize / 2 },
          ]}
        >
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} />
          ) : (
            <View style={styles.labelFallback}>
              <Text style={styles.labelText} numberOfLines={1}>
                {artist || 'VINYL'}
              </Text>
              <Text style={styles.labelSubText} numberOfLines={1}>
                33 RPM
              </Text>
            </View>
          )}

          {/* Center spindle hole */}
          <View
            style={[
              styles.centerHole,
              {
                width: centerHoleSize,
                height: centerHoleSize,
                borderRadius: centerHoleSize / 2,
              },
            ]}
          />
        </View>
      </RNAnimated.View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    discContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 12,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.black,
    },
    disc: {
      backgroundColor: '#111115',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    groove: {
      position: 'absolute',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    sheenTop: {
      position: 'absolute',
      top: -20,
      left: '20%',
      width: '60%',
      height: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      transform: [{ rotate: '35deg' }],
    },
    sheenBottom: {
      position: 'absolute',
      bottom: -20,
      right: '20%',
      width: '60%',
      height: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      transform: [{ rotate: '35deg' }],
    },
    label: {
      backgroundColor: colors.label,
      borderWidth: 2,
      borderColor: colors.labelDark,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    },
    coverImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    labelFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
    },
    labelText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.bg,
      textAlign: 'center',
    },
    labelSubText: {
      fontFamily: 'VT323_400Regular',
      fontSize: 12,
      color: colors.labelDark,
      textAlign: 'center',
    },
    centerHole: {
      position: 'absolute',
      backgroundColor: colors.bg,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
  })
