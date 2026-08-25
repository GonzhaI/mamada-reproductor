import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View, Animated as RNAnimated, Easing, Text } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { VinylDisc } from '@/components/vinyl/VinylDisc'

interface TurntableProps {
  isPlaying: boolean
  coverUrl?: string
  title?: string
  artist?: string
}

export function Turntable({
  isPlaying,
  coverUrl,
  title,
  artist,
}: TurntableProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  // Tonearm rotation angle animation
  // Pivote real = centro del gimbal (transformOrigin '50% 0%' sobre el contenedor alineado)
  // Rest position: -22deg (brazo levantado fuera del disco, hacia la derecha)
  // Playing position: +30deg (aguja cae sobre el surco medio, r~70px del centro)
  const armAnim = useRef(new RNAnimated.Value(isPlaying ? 1 : 0)).current

  useEffect(() => {
    RNAnimated.timing(armAnim, {
      toValue: isPlaying ? 1 : 0,
      duration: 700,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: false,
    }).start()
  }, [isPlaying, armAnim])

  const armRotation = armAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-22deg', '30deg'],
  })

  // Power / Strobe light blink animation
  const strobeAnim = useRef(new RNAnimated.Value(0.3)).current
  useEffect(() => {
    if (!isPlaying) {
      strobeAnim.setValue(0.3)
      return undefined
    }
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(strobeAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
        RNAnimated.timing(strobeAnim, { toValue: 0.4, duration: 250, useNativeDriver: false }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [isPlaying, strobeAnim])

  return (
    <View style={styles.deckContainer}>
      <View style={styles.chassis}>
        {/* Top wood/metal accent strip */}
        <View style={styles.topStrip}>
          <Text style={styles.brandText}>HI-FI DIRECT DRIVE</Text>
          <View style={styles.speedIndicator}>
            <Text style={[styles.speedText, isPlaying && styles.speedTextActive]}>33 ⅓</Text>
          </View>
        </View>

        {/* Main Deck Body */}
        <View style={styles.deckBody}>
          {/* Platter Wells & Vinyl */}
          <View style={styles.platterWell}>
            <View style={styles.platterRim}>
              <VinylDisc
                isPlaying={isPlaying}
                coverUrl={coverUrl}
                title={title}
                artist={artist}
                size={195}
              />
            </View>
          </View>

          {/* Right Side: Tonearm Assembly & Controls */}
          <View style={styles.rightAssembly}>
            {/* Tonearm Base / Pivot Pivot Point */}
            <View style={styles.tonearmBase}>
              <View style={styles.pivotGimbal} />
              <View style={styles.counterWeight} />

              {/* Animated Arm — pivota exactamente en el gimbal */}
              <RNAnimated.View
                style={[
                  styles.tonearmContainer,
                  {
                    transformOrigin: '50% 0%',
                    transform: [{ rotate: armRotation }],
                  },
                ]}
              >
                <View style={styles.tonearmRod} />
                <View style={styles.tonearmBend} />
                <View style={styles.headshell}>
                  <View style={styles.cartridge} />
                  <View style={styles.needle} />
                </View>
              </RNAnimated.View>
            </View>

            {/* Pitch / Speed Slider mock */}
            <View style={styles.pitchContainer}>
              <View style={styles.pitchTrack}>
                <View style={[styles.pitchKnob, { top: isPlaying ? 16 : 8 }]} />
              </View>
              <Text style={styles.pitchText}>PITCH</Text>
            </View>

            {/* Power / Strobe Lamp */}
            <View style={styles.strobeLampContainer}>
              <RNAnimated.View
                style={[
                  styles.strobeLamp,
                  {
                    opacity: strobeAnim,
                    backgroundColor: isPlaying ? colors.accent : colors.border,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Chassis bottom feet */}
        <View style={styles.bottomFeet}>
          <View style={styles.foot} />
          <View style={styles.powerSwitch}>
            <View style={[styles.switchDot, isPlaying && styles.switchDotActive]} />
            <Text style={styles.switchLabel}>POWER</Text>
          </View>
          <View style={styles.foot} />
        </View>
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    deckContainer: {
      alignItems: 'center',
      width: '100%',
      maxWidth: 340,
    },
    chassis: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: colors.border,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 10,
    },
    topStrip: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 6,
      marginBottom: 8,
    },
    brandText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    speedIndicator: {
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    speedText: {
      fontFamily: 'VT323_400Regular',
      fontSize: 12,
      color: colors.textMuted,
    },
    speedTextActive: {
      color: colors.accent,
    },
    deckBody: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      height: 205,
    },
    platterWell: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.black,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.border,
    },
    platterRim: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    rightAssembly: {
      flex: 1,
      height: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: 8,
      position: 'relative',
    },
    tonearmBase: {
      position: 'absolute',
      top: 12,
      left: 4,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    pivotGimbal: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.black,
      borderWidth: 1,
      borderColor: colors.border,
    },
    counterWeight: {
      position: 'absolute',
      top: -10,
      left: 9,
      width: 18,
      height: 8,
      backgroundColor: colors.labelDark,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tonearmContainer: {
      position: 'absolute',
      top: 18,
      left: 6,
      width: 24,
      height: 125,
      zIndex: 15,
    },
    tonearmRod: {
      width: 3,
      height: 95,
      backgroundColor: '#E0E0E0',
      borderWidth: 0.5,
      borderColor: '#999',
      alignSelf: 'center',
    },
    tonearmBend: {
      width: 12,
      height: 3,
      backgroundColor: '#E0E0E0',
      alignSelf: 'center',
      transform: [{ rotate: '-25deg' }],
      marginTop: -2,
    },
    headshell: {
      width: 10,
      height: 22,
      backgroundColor: colors.black,
      borderWidth: 1,
      borderColor: colors.accent,
      alignSelf: 'center',
      borderRadius: 2,
      alignItems: 'center',
      transform: [{ rotate: '-15deg' }],
    },
    cartridge: {
      width: 6,
      height: 10,
      backgroundColor: colors.accent,
      marginTop: 3,
    },
    needle: {
      width: 2,
      height: 4,
      backgroundColor: '#FFF',
    },
    pitchContainer: {
      alignItems: 'center',
      marginTop: 50,
      alignSelf: 'flex-end',
      marginRight: 6,
    },
    pitchTrack: {
      width: 8,
      height: 36,
      backgroundColor: colors.black,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      position: 'relative',
      alignItems: 'center',
    },
    pitchKnob: {
      position: 'absolute',
      width: 12,
      height: 5,
      backgroundColor: colors.accent,
      borderRadius: 1,
    },
    pitchText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 5,
      color: colors.textMuted,
      marginTop: 4,
    },
    strobeLampContainer: {
      alignSelf: 'flex-start',
      marginBottom: 6,
    },
    strobeLamp: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bottomFeet: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
      paddingHorizontal: 8,
    },
    foot: {
      width: 24,
      height: 6,
      backgroundColor: colors.black,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    powerSwitch: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    switchDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textMuted,
    },
    switchDotActive: {
      backgroundColor: colors.accent,
    },
    switchLabel: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 5,
      color: colors.textMuted,
    },
  })
