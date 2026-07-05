import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSearch } from '@/hooks/useSearch'
import { usePlayer } from '@/hooks/usePlayer'
import type { TidalTrack } from '@/services/tidalApi'
import { colors } from '@/theme/colors'

const QUALITY_COLORS: Record<string, string> = {
  HI_RES_LOSSLESS: colors.accent,
  LOSSLESS: colors.label,
  HIGH: colors.textMuted,
  LOW: colors.border,
}

const QUALITY_LABELS: Record<string, string> = {
  HI_RES_LOSSLESS: 'MASTER',
  LOSSLESS: 'HIFI',
  HIGH: 'HIGH',
  LOW: 'NORMAL',
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function TrackRow({ item, onPress }: { item: TidalTrack; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.trackRow} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{item.title.toUpperCase()}</Text>
        <Text style={styles.trackArtist}>{item.artists.map(a => a.name).join(', ')}</Text>
      </View>
      <View style={styles.trackMeta}>
        <Text style={[styles.qualityTag, { color: QUALITY_COLORS[item.quality] ?? colors.textMuted }]}>
          {QUALITY_LABELS[item.quality] ?? item.quality}
        </Text>
        <Text style={styles.duration}>{formatDuration(item.durationSeconds)}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function SearchScreen() {
  const { query, setQuery, results, loading, error } = useSearch()
  const { playTrack } = usePlayer()
  const showResults = query.length > 0

  const handlePlayTrack = (track: TidalTrack) => {
    playTrack(track, results)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SEARCH</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Search input */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>⌕</Text>
          <TextInput
            style={styles.input}
            placeholder="TYPE TO SEARCH..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Results / empty state */}
        {showResults && loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : showResults && error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : showResults ? (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <TrackRow item={item} onPress={() => handlePlayTrack(item)} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>SIN RESULTADOS</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⌕</Text>
            <Text style={styles.emptyText}>SEARCH FOR TRACKS,{'\n'}ARTISTS OR ALBUMS</Text>
          </View>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 20,
  },
  inputIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 7,
    color: colors.text,
    letterSpacing: 0.5,
  },
  clearBtn: {
    fontSize: 14,
    color: colors.textMuted,
  },
  list: {
    paddingBottom: 16,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  trackInfo: {
    flex: 1,
    gap: 4,
  },
  trackTitle: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 6,
    color: colors.text,
    letterSpacing: 0.3,
  },
  trackArtist: {
    fontFamily: 'VT323_400Regular',
    fontSize: 16,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  trackMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  qualityTag: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 5,
    letterSpacing: 0.5,
  },
  duration: {
    fontFamily: 'VT323_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 80,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.border,
  },
  emptyText: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 7,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
})
