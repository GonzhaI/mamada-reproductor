import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View, Animated as RNAnimated, Easing, TouchableOpacity, Text } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { usePlayerSkin, type PlayerSkin } from '@/hooks/usePlayerSkin'
import type { ThemeColors } from '@/theme/themes'
import { CassetteBody } from '@/components/cassette/CassetteBody'
import { VinylDisc } from '@/components/vinyl/VinylDisc'
import { Turntable } from '@/components/turntable/Turntable'
import { Jukebox } from '@/components/jukebox/Jukebox'
import { Radio } from '@/components/radio/Radio'
import { Oscilloscope } from '@/components/scope/Oscilloscope'
import { sfx } from '@/services/sfxEngine'

/** Metadatos del rack de máquinas (orden = orden del selector) */
const SKIN_META: { id: PlayerSkin; icon: string; label: string }[] = [
  { id: 'cassette', icon: '📼', label: 'TAPE' },
  { id: 'vinyl', icon: '💿', label: 'VINYL' },
  { id: 'turntable', icon: '🎛', label: 'DECK' },
  { id: 'jukebox', icon: '🎶', label: 'JUKE' },
  { id: 'radio', icon: '📻', label: 'RADIO' },
  { id: 'scope', icon: '📺', label: 'SCOPE' },
]

interface PlayerSkinViewProps {
  title: string
  artist: string
  isPlaying: boolean
  coverUrl?: string
  /** Identidad del track actual: al cambiar dispara la animación de cambio de disco */
  trackKey?: string
  /** Color dinámico extraído de la carátula; null = accent del tema */
  accent?: string | null
}

export function PlayerSkinView({
  title,
  artist,
  isPlaying,
  coverUrl,
  trackKey,
  accent,
}: PlayerSkinViewProps) {
  const { colors } = useTheme()
  const { skin, setSkin, cycleSkin } = usePlayerSkin()
  const styles = useMemo(() => createStyles(colors), [colors])

  // Rack desplegable de skins
  const [rackOpen, setRackOpen] = useState(false)
  const rackAnims = useRef(SKIN_META.map(() => new RNAnimated.Value(0))).current

  /** Entrada escalonada: fade + slide-up por máquina */
  const startRackStagger = () => {
    rackAnims.forEach((v, i) => {
      v.setValue(0)
      RNAnimated.timing(v, {
        toValue: 1,
        duration: 220,
        delay: i * 45,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start()
    })
  }

  const rackAnimStyle = (i: number) => ({
    opacity: rackAnims[i],
    transform: [
      {
        translateY: rackAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  })

  // Animation values for smooth crossfade & scale/slide transitions between models
  const animValue = useRef(new RNAnimated.Value(1)).current
  const currentSkinRef = useRef<PlayerSkin>(skin)

  useEffect(() => {
    if (currentSkinRef.current !== skin) {
      currentSkinRef.current = skin
      animValue.setValue(0.7)
      RNAnimated.spring(animValue, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: false,
      }).start()
    }
  }, [skin, animValue])

  // Cambio de canción: pop sutil del modelo (cada skin además hace su propia coreografía)
  const currentTrackRef = useRef(trackKey)
  useEffect(() => {
    if (currentTrackRef.current === trackKey) return
    currentTrackRef.current = trackKey
    animValue.setValue(0.85)
    RNAnimated.spring(animValue, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: false,
    }).start()
  }, [trackKey, animValue])

  const renderCurrentModel = () => {
    switch (skin) {
      case 'vinyl':
        return (
          <View style={styles.modelContainer}>
            <VinylDisc
              isPlaying={isPlaying}
              coverUrl={coverUrl}
              title={title}
              artist={artist}
              size={230}
              trackKey={trackKey}
              accent={accent}
            />
          </View>
        )
      case 'turntable':
        return (
          <View style={styles.modelContainer}>
            <Turntable
              isPlaying={isPlaying}
              coverUrl={coverUrl}
              title={title}
              artist={artist}
              trackKey={trackKey}
              accent={accent}
            />
          </View>
        )
      case 'cassette':
      default:
        return (
          <View style={styles.modelContainer}>
            <CassetteBody
              title={title}
              artist={artist}
              isPlaying={isPlaying}
              coverUrl={coverUrl}
            />
          </View>
        )
      case 'jukebox':
        return (
          <View style={styles.modelContainer}>
            <Jukebox
              isPlaying={isPlaying}
              coverUrl={coverUrl}
              title={title}
              artist={artist}
              trackKey={trackKey}
              accent={accent}
            />
          </View>
        )
      case 'radio':
        return (
          <View style={styles.modelContainer}>
            <Radio />
          </View>
        )
      case 'scope':
        return (
          <View style={styles.modelContainer}>
            <Oscilloscope isPlaying={isPlaying} coverUrl={coverUrl} title={title} artist={artist} accent={accent} />
          </View>
        )
    }
  }

  return (
    <View style={styles.wrapper}>
      {/* Selector: botón único que despliega el rack de máquinas */}
      <TouchableOpacity
        style={[styles.selectorBtn, styles.rackTrigger]}
        onPress={() => {
          sfx.play('switch')
          setRackOpen(v => !v)
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectorText, styles.selectorTextActive]}>
          {SKIN_META.find(m => m.id === skin)?.icon} {SKIN_META.find(m => m.id === skin)?.label} ▾
        </Text>
      </TouchableOpacity>

      {/* Rack de skins (overlay animado) */}
      {rackOpen && (
        <View style={styles.rackBackdrop}>
          <TouchableOpacity style={styles.rackBackdropTouch} activeOpacity={1} onPress={() => setRackOpen(false)} />
          <View style={styles.rackPanel} onLayout={() => startRackStagger()}>
            <Text style={styles.rackTitle}>ELEGÍ LA MÁQUINA</Text>
            <View style={styles.rackGrid}>
              {SKIN_META.map((meta, i) => {
                const isActive = meta.id === skin
                return (
                  <RNAnimated.View key={meta.id} style={[styles.rackItemWrap, rackAnimStyle(i)]}>
                    <TouchableOpacity
                      style={[styles.rackItem, isActive && styles.rackItemActive]}
                      activeOpacity={0.7}
                      onPress={() => {
                        sfx.play('switch')
                        void setSkin(meta.id)
                        setRackOpen(false)
                      }}
                    >
                      <Text style={styles.rackIcon}>{meta.icon}</Text>
                      <Text
                        style={[styles.rackLabel, isActive && [styles.rackLabelActive, accent ? { color: accent } : null]]}
                      >
                        {meta.label}
                      </Text>
                    </TouchableOpacity>
                  </RNAnimated.View>
                )
              })}
            </View>
          </View>
        </View>
      )}

      {/* Visual Model Container with Spring animation */}
      <RNAnimated.View
        style={[
          styles.animationWrapper,
          {
            opacity: animValue,
            transform: [
              {
                scale: animValue.interpolate({
                  inputRange: [0.7, 1],
                  outputRange: [0.92, 1],
                }),
              },
            ],
          },
        ]}
      >
        {renderCurrentModel()}
      </RNAnimated.View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
      alignItems: 'center',
    },
    selectorBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 2,
    },
    selectorText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    selectorTextActive: {
      color: colors.accent,
    },
    rackTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rackBackdrop: {
      position: 'absolute',
      top: -8,
      left: -40,
      right: -40,
      bottom: -240,
      zIndex: 100,
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    rackBackdropTouch: {
      ...StyleSheet.absoluteFillObject,
    },
    rackPanel: {
      marginTop: 34,
      width: 300,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.accent,
      borderRadius: 6,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.6,
      shadowRadius: 14,
      elevation: 14,
    },
    rackTitle: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.textMuted,
      letterSpacing: 2,
      textAlign: 'center',
      marginBottom: 10,
    },
    rackGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
    },
    rackItemWrap: {
      width: 86,
    },
    rackItem: {
      width: '100%',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderRadius: 4,
      alignItems: 'center',
      paddingVertical: 10,
      gap: 6,
    },
    rackItemActive: {
      borderColor: colors.accent,
      backgroundColor: colors.surfaceAlt,
    },
    rackIcon: {
      fontSize: 20,
      lineHeight: 24,
    },
    rackLabel: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    rackLabelActive: {
      color: colors.accent,
    },
    animationWrapper: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 220,
    },
    modelContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
