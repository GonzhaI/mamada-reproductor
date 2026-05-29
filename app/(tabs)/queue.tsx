import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/theme/colors'

const mockQueue = [
  { id: '1', title: 'BOHEMIAN RHAPSODY', artist: 'QUEEN',        duration: '5:55', isActive: true  },
  { id: '2', title: 'ANOTHER ONE BITES', artist: 'QUEEN',        duration: '3:34', isActive: false },
  { id: '3', title: 'HOTEL CALIFORNIA',  artist: 'EAGLES',       duration: '6:30', isActive: false },
  { id: '4', title: 'COMFORTABLY NUMB',  artist: 'PINK FLOYD',   duration: '6:22', isActive: false },
  { id: '5', title: 'WISH YOU WERE HERE',artist: 'PINK FLOYD',   duration: '5:35', isActive: false },
  { id: '6', title: 'STAIRWAY TO HEAVEN',artist: 'LED ZEPPELIN', duration: '8:02', isActive: false },
]

type QueueTrack = typeof mockQueue[number]

function QueueRow({ item, index }: { item: QueueTrack; index: number }) {
  return (
    <TouchableOpacity
      style={[styles.row, item.isActive && styles.rowActive]}
      activeOpacity={0.7}
    >
      <Text style={[styles.rowIndex, item.isActive && styles.rowIndexActive]}>
        {item.isActive ? '▶' : String(index + 1).padStart(2, '0')}
      </Text>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowTitle, item.isActive && styles.rowTitleActive]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowArtist}>{item.artist}</Text>
      </View>
      <Text style={styles.rowDuration}>{item.duration}</Text>
    </TouchableOpacity>
  )
}

export default function QueueScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QUEUE</Text>
          <View style={styles.headerLine} />
          <Text style={styles.headerSub}>{mockQueue.length} TRACKS</Text>
        </View>

        <FlatList
          data={mockQueue}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => <QueueRow item={item} index={index} />}
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
    gap: 6,
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
  headerSub: {
    fontFamily: 'VT323_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  list: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  rowActive: {
    backgroundColor: colors.surface,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  rowIndex: {
    fontFamily: 'VT323_400Regular',
    fontSize: 16,
    color: colors.textMuted,
    width: 24,
    textAlign: 'center',
  },
  rowIndexActive: {
    color: colors.accent,
    fontSize: 14,
  },
  rowInfo: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontFamily: 'PressStart2P_400Regular',
    fontSize: 6,
    color: colors.text,
    letterSpacing: 0.3,
  },
  rowTitleActive: {
    color: colors.accent,
  },
  rowArtist: {
    fontFamily: 'VT323_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  rowDuration: {
    fontFamily: 'VT323_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.4,
  },
})
