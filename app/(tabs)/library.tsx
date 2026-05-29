import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native'
import { colors } from '@/theme/colors'

const mockPlaylists = [
  { id: '1', name: 'MIS FAVORITOS',   count: 42, type: 'favorites' },
  { id: '2', name: 'CHILL VIBES',     count: 18, type: 'playlist'  },
  { id: '3', name: 'WORKOUT MIX',     count: 25, type: 'playlist'  },
  { id: '4', name: 'LATE NIGHT',      count: 11, type: 'playlist'  },
  { id: '5', name: 'ROAD TRIP',       count: 33, type: 'playlist'  },
]

type PlaylistItem = typeof mockPlaylists[number]

function PlaylistRow({ item }: { item: PlaylistItem }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
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
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LIBRARY</Text>
          <View style={styles.headerLine} />
        </View>

        <FlatList
          data={mockPlaylists}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PlaylistRow item={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
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
})
