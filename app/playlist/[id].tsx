import { useMemo, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { getAwesomeMix, type AwesomeMixTrack } from '@/services/awesomeMixData'
import { ART_COVERS, DITHERED_COVERS } from '@/services/mixCovers'
import { openExternal } from '@/services/openExternal'
import { CrossfadeCover } from '@/components/CrossfadeCover'
import { ProgressBar } from '@/components/ProgressBar'
import { LyricsView } from '@/components/LyricsView'
import { useYt } from '@/hooks/useYt'
import { useLyrics } from '@/hooks/useLyrics'
import { useLyricsOffset } from '@/hooks/useLyricsOffset'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

function TrackRow({
  track,
  active,
  playing,
  onPress,
}: {
  track: AwesomeMixTrack
  active: boolean
  playing: boolean
  onPress: () => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <TouchableOpacity style={styles.trackRow} activeOpacity={0.7} onPress={onPress}>
      <Text style={[styles.trackNum, active && { color: colors.accent }]}>
        {active && playing ? '▶' : String(track.n).padStart(2, '0')}
      </Text>
      <View style={styles.trackInfo}>
        <Text style={[styles.trackTitle, active && { color: colors.accent }]} numberOfLines={1}>
          {track.title.toUpperCase()}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          if (track.videoId) return
          void openExternal(
            `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.artist} ${track.title}`)}`,
          )
        }}
        disabled={!!track.videoId}
        activeOpacity={0.7}
      >
        <Text style={styles.trackMeta}>{track.duration || (!track.videoId ? 'YT ↗' : '')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

export default function PlaylistScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { id } = useLocalSearchParams<{ id: string }>()
  const mix = getAwesomeMix(id)
  const yt = useYt()
  const [showLyrics, setShowLyrics] = useState(false)

  // Letra del track sonando (hooks antes de cualquier early-return)
  const playingArtist = yt.mix ? yt.mix.tracks[yt.index]?.artist ?? null : null
  const playingTitle = yt.mix ? yt.mix.tracks[yt.index]?.title ?? null : null
  const { lyrics, loading: lyricsLoading } = useLyrics(playingArtist, playingTitle)
  const lyricsKey =
    playingArtist && playingTitle ? `${playingArtist}|${playingTitle}`.toLowerCase() : null
  const { offset: lyricsOffset, nudgeOffset: nudgeLyricsOffset } = useLyricsOffset(lyricsKey)

  if (!mix) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.centerState}>
          <Text style={styles.errorText}>MIX NO ENCONTRADO</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>← VOLVER</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const isActiveMix = yt.mix?.id === mix.id
  const currentIndex = isActiveMix ? yt.index : -1
  const current = isActiveMix ? mix.tracks[yt.index] : null

  const handleTrackPress = (_track: AwesomeMixTrack, i: number) => {
    if (isActiveMix) {
      if (yt.index === i) {
        yt.togglePlay()
      } else {
        yt.jumpTo(i)
      }
    } else {
      yt.start(mix.id, i)
    }
  }

  const handlePrevNext = (dir: 1 | -1) => {
    if (isActiveMix) {
      if (dir === 1) yt.next()
      else yt.prev()
    } else {
      yt.start(mix.id, dir === 1 ? 0 : mix.tracks.length - 1)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={mix.tracks}
        keyExtractor={t => String(t.n)}
        renderItem={({ item, index }) => (
          <TrackRow
            track={item}
            active={index === currentIndex}
            playing={isActiveMix && yt.playing}
            onPress={() => handleTrackPress(item, index)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                <Text style={styles.backBtnText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.screenTitle} numberOfLines={1}>
                {mix.title}
              </Text>
              <View style={{ width: 32 }} />
            </View>

            {/* Carátula + info */}
            <View style={styles.coverBlock}>
              <View style={[styles.coverFrame, { borderColor: mix.accent }]}>
                <CrossfadeCover art={ART_COVERS[mix.id]} overlay1={DITHERED_COVERS[mix.id]} overlay2={ART_COVERS[mix.id]} />
              </View>
              <Text style={[styles.mixMovie, { color: mix.accent }]}>{mix.movie.toUpperCase()}</Text>
              <Text style={styles.mixMeta}>
                {mix.year} · {mix.tracks.length} TRACKS
              </Text>
            </View>

            {/* Controles del reproductor YT */}
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={() => handlePrevNext(-1)} activeOpacity={0.7}>
                <Text style={styles.ctrlBtn}>⏮</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.playBtn, { borderColor: colors.accent }]}
                onPress={() => (isActiveMix ? yt.togglePlay() : yt.start(mix.id, Math.max(currentIndex, 0)))}
                activeOpacity={0.7}
              >
                <Text style={[styles.playIcon, { color: colors.accent }]}>
                  {isActiveMix && yt.playing ? '❚❚' : '▶'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handlePrevNext(1)} activeOpacity={0.7}>
                <Text style={styles.ctrlBtn}>⏭</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.nowPlaying} numberOfLines={1}>
              {current ? `${current.n}. ${current.title} — ${current.artist}` : 'TOCA UNA CANCIÓN PARA EMPEZAR'}
            </Text>

            {/* Seek de la canción activa (mismo widget que el player Jamendo) */}
            {isActiveMix && yt.duration > 0 && (
              <View style={styles.seekWrap}>
                <ProgressBar currentTime={yt.position} duration={yt.duration} onSeek={yt.seekTo} />
              </View>
            )}

            {/* Toggle de letra sincronizada (solo si LRCLIB tiene la canción) */}
            {isActiveMix && (lyrics || lyricsLoading) && (
              <TouchableOpacity
                style={[styles.lyricsToggle, showLyrics && styles.lyricsToggleActive]}
                onPress={() => setShowLyrics(v => !v)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.lyricsToggleText,
                    showLyrics && [styles.lyricsToggleTextActive, { color: mix.accent }],
                  ]}
                >
                  ♪ {showLyrics ? 'OCULTAR LETRA' : 'LETRA SINCRONIZADA'}
                </Text>
              </TouchableOpacity>
            )}
            {isActiveMix && showLyrics && (
              <View style={styles.lyricsPanel}>
                {lyrics ? (
                  <LyricsView
                    lines={lyrics.lines}
                    position={yt.position}
                    accentColor={mix.accent}
                    onSeekLine={yt.seekTo}
                    offset={lyricsOffset}
                    onNudgeOffset={nudgeLyricsOffset}
                  />
                ) : (
                  <Text style={styles.lyricsLoading}>BUSCANDO LETRA...</Text>
                )}
              </View>
            )}

            <View style={styles.sectionLine} />
            <Text style={styles.sectionLabel}>TRACKLIST OFICIAL</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    list: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    header: {
      gap: 12,
      marginBottom: 12,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
    },
    backBtn: {
      width: 32,
      height: 32,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    backBtnText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 10,
      color: colors.text,
    },
    screenTitle: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 9,
      color: colors.text,
      letterSpacing: 1,
      flex: 1,
      textAlign: 'center',
    },
    coverBlock: {
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    coverFrame: {
      width: 200,
      height: 200,
      borderWidth: 3,
      padding: 4,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      position: 'relative',
    },
    mixMovie: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 8,
      letterSpacing: 1,
      textAlign: 'center',
    },
    mixMeta: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 28,
      paddingVertical: 6,
    },
    ctrlBtn: {
      fontSize: 20,
      color: colors.text,
    },
    playBtn: {
      width: 56,
      height: 56,
      borderWidth: 3,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    playIcon: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 12,
    },
    nowPlaying: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      color: colors.textMuted,
      letterSpacing: 1,
      textAlign: 'center',
      paddingHorizontal: 12,
    },
    seekWrap: {
      paddingHorizontal: 24,
    },
    lyricsToggle: {
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 3,
    },
    lyricsToggleActive: {
      borderColor: colors.accent,
    },
    lyricsToggleText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    lyricsToggleTextActive: {
      color: colors.accent,
    },
    lyricsPanel: {
      height: 190,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 4,
      backgroundColor: colors.bg,
      overflow: 'hidden',
    },
    lyricsLoading: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 24,
      letterSpacing: 1,
    },
    sectionLine: {
      height: 1,
      backgroundColor: colors.border,
      opacity: 0.5,
    },
    sectionLabel: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.textMuted,
      letterSpacing: 2,
    },
    trackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      gap: 12,
    },
    trackNum: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      color: colors.textMuted,
      width: 26,
    },
    trackInfo: {
      flex: 1,
      gap: 2,
    },
    trackTitle: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.text,
      letterSpacing: 0.5,
    },
    trackArtist: {
      fontFamily: 'VT323_400Regular',
      fontSize: 14,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    trackMeta: {
      fontFamily: 'VT323_400Regular',
      fontSize: 14,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      opacity: 0.5,
    },
    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    },
    errorText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1,
    },
  })
