import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View, Animated as RNAnimated, Easing, TouchableOpacity, Text } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import { usePlayerSkin, type PlayerSkin } from '@/hooks/usePlayerSkin'
import type { ThemeColors } from '@/theme/themes'
import { CassetteBody } from '@/components/cassette/CassetteBody'
import { VinylDisc } from '@/components/vinyl/VinylDisc'
import { Turntable } from '@/components/turntable/Turntable'
import { Jukebox } from '@/components/jukebox/Jukebox'

interface PlayerSkinViewProps {
  title: string
  artist: string
  isPlaying: boolean
  coverUrl?: string
}

export function PlayerSkinView({
  title,
  artist,
  isPlaying,
  coverUrl,
}: PlayerSkinViewProps) {
  const { colors } = useTheme()
  const { skin, setSkin, cycleSkin } = usePlayerSkin()
  const styles = useMemo(() => createStyles(colors), [colors])

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
            />
          </View>
        )
    }
  }

  return (
    <View style={styles.wrapper}>
      {/* Model Mode Switcher Tabs */}
      <View style={styles.selectorRow}>
        <TouchableOpacity
          style={[styles.selectorBtn, skin === 'cassette' && styles.selectorBtnActive]}
          onPress={() => setSkin('cassette')}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectorText, skin === 'cassette' && styles.selectorTextActive]}>
            📼 TAPE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.selectorBtn, skin === 'vinyl' && styles.selectorBtnActive]}
          onPress={() => setSkin('vinyl')}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectorText, skin === 'vinyl' && styles.selectorTextActive]}>
            💿 VINYL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.selectorBtn, skin === 'turntable' && styles.selectorBtnActive]}
          onPress={() => setSkin('turntable')}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectorText, skin === 'turntable' && styles.selectorTextActive]}>
            🎛 DECK
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.selectorBtn, skin === 'jukebox' && styles.selectorBtnActive]}
          onPress={() => setSkin('jukebox')}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectorText, skin === 'jukebox' && styles.selectorTextActive]}>
            🎶 JUKE
          </Text>
        </TouchableOpacity>
      </View>

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
    selectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 12,
      backgroundColor: colors.surfaceAlt,
      padding: 3,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectorBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 2,
    },
    selectorBtnActive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.accent,
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
