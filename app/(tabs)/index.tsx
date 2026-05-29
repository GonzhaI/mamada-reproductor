import { useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { colors } from '@/theme/colors'
import { CassetteBody } from '@/components/cassette/CassetteBody'
import { Equalizer } from '@/components/cassette/Equalizer'
import { Controls } from '@/components/Controls'
import { ProgressBar } from '@/components/ProgressBar'

// ─── Mock data — se reemplazará con datos reales en Fase 3/4 ───
const mockTrack = {
  title: 'BOHEMIAN RHAPSODY',
  artist: 'QUEEN',
  album: 'A NIGHT AT THE OPERA',
  duration: 355,
  currentTime: 87,
  quality: 'Master',
}

export default function PlayerScreen() {
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>
            {isPlaying ? '▶ NOW PLAYING' : '⏸ PAUSED'}
          </Text>
          <Text style={styles.qualityBadge}>{mockTrack.quality}</Text>
        </View>

        {/* Cassette Area */}
        <View style={styles.cassetteContainer}>
          <CassetteBody
            title={mockTrack.title}
            artist={mockTrack.artist}
            isPlaying={isPlaying}
          />
        </View>

        {/* Equalizer */}
        <View style={styles.eqContainer}>
          <Equalizer isPlaying={isPlaying} barCount={12} />
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {mockTrack.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {mockTrack.artist}
          </Text>
          <Text style={styles.trackAlbum} numberOfLines={1}>
            {mockTrack.album}
          </Text>
        </View>

        {/* Progress Section */}
        <View style={styles.progressContainer}>
          <ProgressBar
            currentTime={mockTrack.currentTime}
            duration={mockTrack.duration}
          />
        </View>

        {/* Controls Section */}
        <View style={styles.controlsContainer}>
          <Controls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={() => console.log('Next')}
            onPrevious={() => console.log('Prev')}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
  qualityBadge: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 6,
    color: colors.bg,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 3,
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
})
