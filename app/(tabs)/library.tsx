import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLibrary } from '@/hooks/useLibrary'
import { usePlayer } from '@/hooks/usePlayer'
import { getPlaylistTracks } from '@/services/tidalApi'
import { colors } from '@/theme/colors'

type PlaylistItem = {
  id: string
  name: string
  count: number
  type: 'favorites' | 'playlist'
}

function PlaylistRow({ item, onPress }: { item: PlaylistItem; onPress: () => void }) {
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

export default function LibraryScreen() {
  const { favorites, playlists, loading, error, refresh } = useLibrary()
  const { playTrack } = usePlayer()

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
    { id: 'favorites', name: 'MIS FAVORITOS', count: favorites.length, type: 'favorites' },
    ...playlists.map(p => ({ id: p.id, name: p.name.toUpperCase(), count: p.trackCount, type: 'playlist' as const })),
  ]

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LIBRARY</Text>
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
            ItemSeparatorComponent={() => <View style={styles.separator} />}
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

const styles = StyleSheet.create({
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
