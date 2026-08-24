import { useMemo } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { CassetteBody } from '@/components/cassette/CassetteBody'
import { Equalizer } from '@/components/cassette/Equalizer'
import { Controls } from '@/components/Controls'
import { ProgressBar } from '@/components/ProgressBar'
import { MarqueeText } from '@/components/MarqueeText'
import { usePlayer } from '@/hooks/usePlayer'

export default function PlayerScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const {
    currentTrack,
    isPlaying,
    isLoaded,
    position,
    duration,
    togglePlay,
    seekTo,
    next,
    previous,
  } = usePlayer()

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏏</Text>
            <Text style={styles.emptyLabel}>NO TRACK SELECTED</Text>
            <Text style={styles.emptyHint}>SEARCH OR BROWSE YOUR LIBRARY</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>
            {isPlaying ? '▶ NOW PLAYING' : '⏸ PAUSED'}
          </Text>
          {currentTrack.album?.coverUrl && (
            <Image
              source={{ uri: currentTrack.album.coverUrl }}
              style={styles.coverThumb}
            />
          )}
        </View>

        {/* Cassette Area */}
        <View style={styles.cassetteContainer}>
          <CassetteBody
            title={currentTrack.title.toUpperCase()}
            artist={currentTrack.artists.map(a => a.name.toUpperCase()).join(', ')}
            isPlaying={isPlaying}
            coverUrl={currentTrack.album?.coverUrl ?? undefined}
          />
        </View>

        {/* Equalizer */}
        <View style={styles.eqContainer}>
          <Equalizer isPlaying={isPlaying} barCount={12} />
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <MarqueeText style={styles.trackTitle}>
            {currentTrack.title.toUpperCase()}
          </MarqueeText>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrack.artists.map(a => a.name).join(', ')}
          </Text>
          {currentTrack.album && (
            <Text style={styles.trackAlbum} numberOfLines={1}>
              {currentTrack.album.title.toUpperCase()}
            </Text>
          )}
        </View>

        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <ProgressBar currentTime={position} duration={duration} onSeek={seekTo} />
        </View>

        {/* Controls Section */}
        <View style={styles.controlsContainer}>
          <Controls
            isPlaying={isPlaying}
            onPlayPause={togglePlay}
            onNext={next}
            onPrevious={previous}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      justifyContent: 'space-between',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLabel: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.accent,
      letterSpacing: 1,
    },
    coverThumb: {
      width: 36,
      height: 36,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cassetteContainer: {
      alignItems: 'center',
      marginVertical: 16,
    },
    eqContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    trackInfo: {
      alignItems: 'center',
      gap: 8,
      marginBottom: 24,
    },
    trackTitle: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 10,
      color: colors.text,
      textAlign: 'center',
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    trackArtist: {
      fontFamily: 'VT323_400Regular',
      fontSize: 24,
      color: colors.accent,
      textAlign: 'center',
      letterSpacing: 1,
    },
    trackAlbum: {
      fontFamily: 'VT323_400Regular',
      fontSize: 18,
      color: colors.textMuted,
      textAlign: 'center',
    },
    progressContainer: {
      marginBottom: 24,
    },
    controlsContainer: {
      paddingBottom: 16,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    emptyIcon: {
      fontSize: 48,
      color: colors.border,
    },
    emptyLabel: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 8,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    emptyHint: {
      fontFamily: 'VT323_400Regular',
      fontSize: 14,
      color: colors.textMuted,
      letterSpacing: 1,
    },
  })
