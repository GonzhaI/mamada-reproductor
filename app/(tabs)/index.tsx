import { useMemo, useState } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { PlayerSkinView } from '@/components/PlayerSkinView'
import { Equalizer } from '@/components/cassette/Equalizer'
import { Controls } from '@/components/Controls'
import { ProgressBar } from '@/components/ProgressBar'
import { MarqueeText } from '@/components/MarqueeText'
import { QueueList } from '@/components/QueueList'
import { VolumeSlider } from '@/components/VolumeSlider'
import { usePlayerActions, usePlayerData, usePlayerStatus } from '@/hooks/usePlayer'
import { useCoverAccent } from '@/hooks/useCoverAccent'
import { useLyrics } from '@/hooks/useLyrics'
import { useLyricsOffset } from '@/hooks/useLyricsOffset'
import { LyricsView } from '@/components/LyricsView'
import { sfx } from '@/services/sfxEngine'
import { usePlayCount } from '@/hooks/usePlayCount'

export default function PlayerScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [showQueue, setShowQueue] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const { currentTrack, volume, queueCompleted, playerError, resumeSession } = usePlayerData()
  const { isPlaying, position, duration } = usePlayerStatus()
  const {
    togglePlay,
    seekTo,
    next,
    previous,
    setVolume,
    retryCurrentTrack,
    clearPlayerError,
    resumePlayback,
    dismissResume,
  } = usePlayerActions()
  const coverUrl = currentTrack?.album?.coverUrl ?? undefined
  const accent = useCoverAccent(coverUrl)
  const playCount = usePlayCount(currentTrack?.id)
  const { lyrics, loading: lyricsLoading } = useLyrics(
    currentTrack?.artists.map(a => a.name).join(', ') ?? null,
    currentTrack?.title ?? null
  )
  const lyricsKey =
    currentTrack
      ? `${currentTrack.artists.map(a => a.name).join(', ')}|${currentTrack.title}`.toLowerCase()
      : null
  const { offset: lyricsOffset, nudgeOffset: nudgeLyricsOffset } = useLyricsOffset(lyricsKey)

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏏</Text>
            <Text style={styles.emptyLabel}>NO TRACK SELECTED</Text>
            {resumeSession ? (
              <View style={styles.resumeCard}>
                <Text style={styles.resumeLabel}>RESUME SESSION</Text>
                <Text style={styles.resumeTitle} numberOfLines={1}>
                  {resumeSession.currentTrack.title.toUpperCase()}
                </Text>
                <Text style={styles.resumeArtist} numberOfLines={1}>
                  {resumeSession.currentTrack.artists.map(a => a.name).join(', ')}
                </Text>
                <View style={styles.resumeActions}>
                  <TouchableOpacity style={styles.resumeButton} onPress={() => void resumePlayback()}>
                    <Text style={styles.resumeButtonText}>▶ CONTINUE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dismissButton} onPress={dismissResume}>
                    <Text style={styles.dismissButtonText}>DISMISS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyHint}>PICK SOMETHING FROM MUSIC</Text>
            )}
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
          <View style={styles.headerRight}>
            <VolumeSlider value={volume} onChange={setVolume} compact />
            {(lyrics || lyricsLoading) && (
              <TouchableOpacity
                style={[styles.lyricsBtn, showLyrics && styles.lyricsBtnActive]}
                onPress={() => setShowLyrics(v => !v)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.lyricsBtnIcon, showLyrics && styles.lyricsBtnIconActive]}>♪</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.queueBtn, showQueue && styles.queueBtnActive]}
              onPress={() => {
                sfx.play('tick')
                setShowQueue(v => !v)
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.queueBtnIcon, showQueue && styles.queueBtnIconActive]}>≡</Text>
            </TouchableOpacity>
            {currentTrack.album?.coverUrl && !showQueue && (
              <Image
                source={{ uri: currentTrack.album.coverUrl }}
                style={styles.coverThumb}
              />
            )}
          </View>
        </View>

        {showQueue ? (
          /* Queue View */
          <View style={styles.queueContainer}>
            <QueueList />
          </View>
        ) : (
          <>
            {/* Visualizer / Skin Model Area (Tape / Vinyl / Deck) */}
            <View style={styles.cassetteContainer}>
              <PlayerSkinView
                title={currentTrack.title.toUpperCase()}
                artist={currentTrack.artists.map(a => a.name.toUpperCase()).join(', ')}
                isPlaying={isPlaying}
                coverUrl={currentTrack.album?.coverUrl ?? undefined}
                trackKey={currentTrack.id}
                accent={accent}
                progress={duration > 0 ? position / duration : 0}
                flipSignal={queueCompleted}
                plays={playCount}
              />
              {/* Overlay de letra sincronizada sobre la zona del skin */}
              {showLyrics && (
                <View style={styles.lyricsOverlay}>
                  {lyrics ? (
                    <LyricsView
                      lines={lyrics.lines}
                      position={position}
                      accentColor={accent}
                      onSeekLine={s => void seekTo(s)}
                      offset={lyricsOffset}
                      onNudgeOffset={nudgeLyricsOffset}
                    />
                  ) : (
                    <Text style={styles.lyricsOverlayLoading}>BUSCANDO LETRA...</Text>
                  )}
                </View>
              )}
            </View>

            {/* Equalizer */}
            <View style={styles.eqContainer}>
              <Equalizer isPlaying={isPlaying} barCount={12} accent={accent} />
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
          </>
        )}

        {playerError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{playerError}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity onPress={() => void retryCurrentTrack()} style={styles.errorButton}>
                <Text style={styles.errorButtonText}>RETRY</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearPlayerError} style={styles.errorDismiss}>
                <Text style={styles.errorDismissText}>CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    queueBtn: {
      width: 32,
      height: 32,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    queueBtnActive: {
      borderColor: colors.accent,
      backgroundColor: colors.surfaceAlt,
    },
    queueBtnIcon: {
      fontSize: 16,
      lineHeight: 18,
      color: colors.textMuted,
    },
    queueBtnIconActive: {
      color: colors.accent,
    },
    lyricsBtn: {
      width: 32,
      height: 32,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lyricsBtnActive: {
      borderColor: colors.accent,
      backgroundColor: colors.surfaceAlt,
    },
    lyricsBtnIcon: {
      fontSize: 16,
      lineHeight: 18,
      color: colors.textMuted,
    },
    lyricsBtnIconActive: {
      color: colors.accent,
    },
    lyricsOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 4,
      backgroundColor: colors.bg,
      overflow: 'hidden',
    },
    lyricsOverlayLoading: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 40,
      letterSpacing: 1,
    },
    queueContainer: {
      flex: 1,
      marginVertical: 8,
    },
    cassetteContainer: {
      alignItems: 'center',
      marginVertical: 16,
      position: 'relative',
      width: '100%',
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
    resumeCard: {
      width: '100%',
      maxWidth: 340,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 6,
    },
    resumeLabel: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.accent,
      letterSpacing: 1,
    },
    resumeTitle: {
      fontFamily: 'VT323_400Regular',
      fontSize: 22,
      color: colors.text,
    },
    resumeArtist: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      color: colors.textMuted,
    },
    resumeActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
    },
    resumeButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    resumeButtonText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.bg,
    },
    dismissButton: {
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    dismissButtonText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.textMuted,
    },
    errorCard: {
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.surface,
      padding: 10,
      gap: 8,
    },
    errorText: {
      fontFamily: 'VT323_400Regular',
      fontSize: 17,
      color: colors.text,
    },
    errorActions: {
      flexDirection: 'row',
      gap: 14,
    },
    errorButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    errorButtonText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.bg,
    },
    errorDismiss: {
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    errorDismissText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.textMuted,
    },
  })
