import { useCallback, useMemo, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useLibrary } from '@/hooks/useLibrary'
import { usePlayerActions } from '@/hooks/usePlayer'
import { getPlaylistTracks } from '@/services/jamendoApi'
import { AWESOME_MIXES } from '@/services/awesomeMixData'
import { ART_COVERS, CASSETTE_COVERS, DITHERED_COVERS } from '@/services/mixCovers'
import { CrossfadeCover } from '@/components/CrossfadeCover'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

type PlaylistItem = {
  id: string
  name: string
  count: number
  type: 'favorites' | 'playlist'
}

function PlaylistRow({ item, onPress }: { item: PlaylistItem; onPress: () => void }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>
          {item.type === 'favorites' ? '♥' : '◈'}
        </Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.rowMeta}>{item.count} TRACKS</Text>
      </View>
      <Text style={styles.rowArrow}>▶</Text>
    </TouchableOpacity>
  )
}

function MixTile({ mixId, onPress }: { mixId: string; onPress: () => void }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const mix = AWESOME_MIXES[mixId]
  // ancho medido → alto cuadrado explícito (aspectRatio % no siempre propaga altura definida)
  const [tileW, setTileW] = useState(0)

  return (
    <TouchableOpacity
      style={styles.mixTile}
      activeOpacity={0.8}
      onPress={onPress}
      onLayout={e => setTileW(e.nativeEvent.layout.width)}
    >
      <View style={[styles.mixCoverFrame, { borderColor: mix.accent, height: tileW > 0 ? tileW : undefined }]}>
        <CrossfadeCover art={ART_COVERS[mixId]} overlay1={CASSETTE_COVERS[mixId]} overlay2={ART_COVERS[mixId]} />
      </View>
      <Text style={styles.mixName} numberOfLines={1}>
        {mix.title}
      </Text>
    </TouchableOpacity>
  )
}

function MixesSection() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.mixesSection}>
      <Text style={styles.sectionLabel}>GUARDIANS OF THE GALAXY</Text>
      <View style={styles.mixesGrid}>
        {Object.keys(AWESOME_MIXES).map(id => (
          <MixTile key={id} mixId={id} onPress={() => router.push(`/playlist/${id}`)} />
        ))}
      </View>
      <Text style={styles.sectionLabel2}>JAMENDO LO-FI</Text>
    </View>
  )
}

export default function LibraryScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { favorites, playlists, loading, error, refresh } = useLibrary()
  const { playTrack } = usePlayerActions()

  const handlePlayFavorites = () => {
    if (favorites.length > 0) {
      playTrack(favorites[0], favorites)
    }
  }

  const handlePlayPlaylist = async (playlistId: string) => {
    try {
      const tracks = await getPlaylistTracks(playlistId)
      if (tracks.length > 0) {
        playTrack(tracks[0], tracks)
      }
    } catch {
      // Silently fail — playlist might not be accessible
    }
  }

  const items: PlaylistItem[] = [
    { id: 'favorites', name: 'LOFI SELECT', count: favorites.length, type: 'favorites' },
    ...playlists
      .filter(p => p.trackCount > 0)
      .map(p => ({ id: p.id, name: p.name.toUpperCase(), count: p.trackCount, type: 'playlist' as const })),
  ]

  // identidad estable entre renders: sin esto cada tick de posición remonta los separadores
  const renderSeparator = useCallback(() => <View style={styles.separator} />, [styles])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MUSIC</Text>
          <View style={styles.headerLine} />
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh} activeOpacity={0.8}>
              <Text style={styles.retryText}>REINTENTAR</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <PlaylistRow
                item={item}
                onPress={item.type === 'favorites' ? handlePlayFavorites : () => handlePlayPlaylist(item.id)}
              />
            )}
            ItemSeparatorComponent={renderSeparator}
            ListHeaderComponent={<MixesSection />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={refresh}
            refreshing={loading}
          />
        )}
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
    },
    header: {
      marginBottom: 20,
      gap: 8,
    },
    headerTitle: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 10,
      color: colors.text,
      letterSpacing: 2,
    },
    headerLine: {
      height: 2,
      backgroundColor: colors.accent,
      width: 40,
    },
    list: {
      paddingBottom: 16,
    },
    mixesSection: {
      marginBottom: 20,
      gap: 12,
    },
    sectionLabel: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.textMuted,
      letterSpacing: 2,
    },
    sectionLabel2: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.textMuted,
      letterSpacing: 2,
      marginTop: 4,
    },
    mixesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
    },
    mixTile: {
      width: '48%',
      gap: 8,
    },
    mixCoverFrame: {
      width: '100%',
      borderWidth: 3,
      padding: 4,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      position: 'relative',
    },
    mixName: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.text,
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      gap: 12,
    },
    rowIcon: {
      width: 40,
      height: 40,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowIconText: {
      fontSize: 18,
      color: colors.accent,
    },
    rowInfo: {
      flex: 1,
      gap: 4,
    },
    rowName: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.text,
      letterSpacing: 0.5,
    },
    rowMeta: {
      fontFamily: 'VT323_400Regular',
      fontSize: 14,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    rowArrow: {
      fontSize: 10,
      color: colors.textMuted,
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
      gap: 16,
      paddingBottom: 80,
    },
    errorText: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    retryBtn: {
      borderWidth: 2,
      borderColor: colors.accent,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    retryText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 7,
      color: colors.accent,
      letterSpacing: 1,
    },
  })
