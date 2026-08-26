import { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, Image, Animated as RNAnimated, Easing } from 'react-native'
import { Reel } from './Reel'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

interface CassetteBodyProps {
  title: string
  artist: string
  isPlaying: boolean
  coverUrl?: string
  /** Progreso de la canción 0..1 (cinta pasando de un carrete al otro) */
  progress?: number
  /** Al cambiar su valor (>0), el cassette gira mostrando la otra cara */
  flipSignal?: number
}

export function CassetteBody({
  title,
  artist,
  isPlaying,
  coverUrl,
  progress = 0,
  flipSignal = 0,
}: CassetteBodyProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  // Flip SIDE A <-> SIDE B: gira hasta el canto (90°), cambia la etiqueta, vuelve.
  const [side, setSide] = useState<'A' | 'B'>('A')
  const flip = useRef(new RNAnimated.Value(0)).current
  const lastFlip = useRef(flipSignal)
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!flipSignal || flipSignal === lastFlip.current) return
    lastFlip.current = flipSignal
    RNAnimated.sequence([
      RNAnimated.timing(flip, {
        toValue: 1,
        duration: 260,
        easing: Easing.in(Easing.quad),
        useNativeDriver: false,
      }),
      RNAnimated.timing(flip, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start()
    pendingTimer.current = setTimeout(() => {
      setSide(s => (s === 'A' ? 'B' : 'A'))
    }, 260)
    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current)
    }
  }, [flipSignal, flip])

  const rotateY = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  })

  // En cara B la cinta fluye al revés
  const p = Math.min(1, Math.max(0, progress))
  const leftFill = side === 'A' ? 1 - p : p
  const rightFill = side === 'A' ? p : 1 - p

  return (
    <View style={styles.cassetteWrapper}>
      {/* Background/Base of Cassette */}
      <RNAnimated.View
        style={[
          styles.cassetteBase,
          { transform: [{ perspective: 900 }, { rotateY }] },
        ]}
      >
        {/* Cassette Top Details */}
        <View style={styles.topDetails}>
          <View style={styles.screw} />
          <View style={styles.screw} />
        </View>

        {/* Main Label Area */}
        <View style={styles.labelArea}>
          <View style={styles.labelHeader}>
            <Text style={styles.labelSide}>{side}</Text>
            <View style={styles.labelStripes}>
              <View style={styles.stripe} />
              <View style={styles.stripe} />
              <View style={styles.stripe} />
            </View>
            <Text style={styles.labelTag}>C-90</Text>
          </View>

          <View style={styles.trackInfo}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {artist}
            </Text>
          </View>

          {/* Cover art thumbnail */}
          {coverUrl && (
            <View style={styles.coverRow}>
              <Image source={{ uri: coverUrl }} style={styles.coverArt} />
            </View>
          )}

          {/* Reel Window cutout — carretes progresivos: la cinta pasa de lado */}
          <View style={styles.windowCutout}>
            <View style={styles.reelContainer}>
              <Reel isPlaying={isPlaying} speed={1} size={56} fill={leftFill} />
            </View>
            <View style={styles.windowCenter}>
              {/* Tape Path */}
              <View style={styles.tapePath} />
            </View>
            <View style={styles.reelContainer}>
              <Reel isPlaying={isPlaying} speed={1.05} size={56} fill={rightFill} />
            </View>
          </View>
        </View>

        {/* Cassette Bottom Area */}
        <View style={styles.bottomArea}>
          {/* Svg for the bottom shape cutouts */}
          <View style={styles.bottomShape}>
            <View style={styles.screw} />
            <View style={styles.screw} />
          </View>
        </View>
      </RNAnimated.View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    cassetteWrapper: {
      alignItems: 'center',
      width: '100%',
      maxWidth: 340,
      aspectRatio: 1.6, // Typical cassette ratio
    },
    cassetteBase: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: colors.border,
      padding: 12,
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 10,
    },
    topDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
    screw: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.black,
      borderWidth: 1,
      borderColor: colors.border,
    },
    labelArea: {
      flex: 1,
      backgroundColor: colors.label,
      marginVertical: 8,
      borderRadius: 6,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.labelDark,
    },
    labelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    labelSide: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 12,
      color: colors.bg,
    },
    labelStripes: {
      flex: 1,
      marginHorizontal: 16,
      gap: 4,
    },
    stripe: {
      height: 2,
      backgroundColor: colors.labelDark,
    },
    labelTag: {
      fontFamily: 'VT323_400Regular',
      fontSize: 18,
      color: colors.bg,
      backgroundColor: colors.labelDark,
      paddingHorizontal: 4,
    },
    trackInfo: {
      alignItems: 'center',
      marginBottom: 8,
    },
    coverRow: {
      alignItems: 'center',
      marginBottom: 8,
    },
    coverArt: {
      width: 64,
      height: 64,
      borderWidth: 1,
      borderColor: colors.labelDark,
    },
    title: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 10,
      color: colors.bg,
      textAlign: 'center',
      marginBottom: 4,
    },
    artist: {
      fontFamily: 'VT323_400Regular',
      fontSize: 18,
      color: colors.surface,
      textAlign: 'center',
    },
    windowCutout: {
      flexDirection: 'row',
      backgroundColor: colors.black,
      borderRadius: 30,
      padding: 4,
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 2,
      borderColor: colors.border,
    },
    reelContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    windowCenter: {
      flex: 1,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tapePath: {
      width: '100%',
      height: 20,
      backgroundColor: colors.tape,
      opacity: 0.8,
    },
    bottomArea: {
      alignItems: 'center',
    },
    bottomShape: {
      width: '70%',
      height: 24,
      backgroundColor: colors.surfaceAlt,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      borderWidth: 2,
      borderBottomWidth: 0,
      borderColor: colors.border,
    },
  })
