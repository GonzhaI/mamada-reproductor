import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { colors } from '@/theme/colors'

// ─── Mock data — se reemplazará con datos reales en Fase 3/4 ───
const mockTrack = {
  title: 'TRACK NAME',
  artist: 'ARTIST NAME',
  album: 'ALBUM TITLE',
  duration: 213,
  currentTime: 87,
  quality: 'HiFi',
  isPlaying: false,
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function PlayerScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>▶ NOW PLAYING</Text>
          <Text style={styles.qualityBadge}>{mockTrack.quality}</Text>
        </View>

        {/* Cassette placeholder — será reemplazado por CassetteBody en feature/ui-cassette */}
        <View style={styles.cassettePlaceholder}>
          <View style={styles.cassetteBody}>
            {/* Label area */}
            <View style={styles.cassetteLabel}>
              <Text style={styles.cassetteLabelTitle} numberOfLines={1}>
                {mockTrack.title}
              </Text>
              <Text style={styles.cassetteLabelArtist} numberOfLines={1}>
                {mockTrack.artist}
              </Text>
              <Text style={styles.cassetteLabelTag}>C-90 · CHROME</Text>
            </View>

            {/* Reel windows */}
            <View style={styles.reelRow}>
              <View style={styles.reelWindow}>
                <View style={styles.reel}>
                  <View style={styles.reelHub} />
                </View>
              </View>
              <View style={styles.reelSpacer} />
              <View style={styles.reelWindow}>
                <View style={styles.reel}>
                  <View style={styles.reelHub} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Track info */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>{mockTrack.title}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{mockTrack.artist}</Text>
          <Text style={styles.trackAlbum} numberOfLines={1}>{mockTrack.album}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(mockTrack.currentTime / mockTrack.duration) * 100}%` },
              ]}
            />
            {/* pixel cursor */}
            <View
              style={[
                styles.progressCursor,
                { left: `${(mockTrack.currentTime / mockTrack.duration) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.progressTimes}>
            <Text style={styles.timeText}>{formatTime(mockTrack.currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(mockTrack.duration)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlBtn}>
            <Text style={styles.controlIcon}>⏮</Text>
          </View>
          <View style={[styles.controlBtn, styles.controlBtnPlay]}>
            <Text style={[styles.controlIcon, styles.controlIconPlay]}>
              {mockTrack.isPlaying ? '⏸' : '▶'}
            </Text>
          </View>
          <View style={styles.controlBtn}>
            <Text style={styles.controlIcon}>⏭</Text>
          </View>
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
    paddingBottom: 8,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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

  // ── Cassette placeholder ──
  cassettePlaceholder: {
    alignItems: 'center',
    marginBottom: 28,
  },
  cassetteBody: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 16,
    gap: 16,
  },
  cassetteLabel: {
    backgroundColor: colors.label,
    padding: 12,
    borderRadius: 2,
    gap: 4,
  },
  cassetteLabelTitle: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 7,
    color: colors.bg,
    letterSpacing: 0.5,
  },
  cassetteLabelArtist: {
    fontFamily: 'VT323_400Regular',
    fontSize: 16,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  cassetteLabelTag: {
    fontFamily: 'VT323_400Regular',
    fontSize: 12,
    color: colors.labelDark,
    letterSpacing: 1,
    textAlign: 'right',
  },
  reelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  reelWindow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.black,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reel: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.reel,
    borderWidth: 1,
    borderColor: colors.tape,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelHub: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reelSpacer: {
    flex: 1,
    height: 3,
    backgroundColor: colors.tape,
    marginHorizontal: 8,
  },

  // ── Track info ──
  trackInfo: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  trackTitle: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 9,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  trackArtist: {
    fontFamily: 'VT323_400Regular',
    fontSize: 22,
    color: colors.accent,
    textAlign: 'center',
    letterSpacing: 1,
  },
  trackAlbum: {
    fontFamily: 'VT323_400Regular',
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // ── Progress ──
  progressSection: {
    gap: 6,
    marginBottom: 32,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  progressCursor: {
    position: 'absolute',
    top: -3,
    width: 6,
    height: 12,
    backgroundColor: colors.text,
    marginLeft: -3,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontFamily: 'VT323_400Regular',
    fontSize: 16,
    color: colors.textMuted,
  },

  // ── Controls ──
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlBtn: {
    width: 52,
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    // pixel shadow
    shadowColor: colors.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  controlBtnPlay: {
    width: 68,
    height: 68,
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAlt,
  },
  controlIcon: {
    fontSize: 20,
    color: colors.text,
  },
  controlIconPlay: {
    fontSize: 26,
    color: colors.accent,
  },
})
