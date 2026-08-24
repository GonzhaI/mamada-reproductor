import { useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { usePlayer } from '@/hooks/usePlayer'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function QueueScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { queue, queueIndex, jumpToIndex, currentTrack } = usePlayer()

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QUEUE</Text>
          <View style={styles.headerLine} />
          <Text style={styles.headerSub}>{queue.length} TRACKS</Text>
        </View>

        {queue.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◈</Text>
            <Text style={styles.emptyText}>QUEUE IS EMPTY</Text>
            <Text style={styles.emptyHint}>SEARCH OR BROWSE YOUR LIBRARY</Text>
          </View>
        ) : (
          <FlatList
            data={queue}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.row, index === queueIndex && styles.rowActive]}
                activeOpacity={0.7}
                onPress={() => jumpToIndex(index)}
              >
                <Text style={[styles.rowIndex, index === queueIndex && styles.rowIndexActive]}>
                  {index === queueIndex ? '▶' : String(index + 1).padStart(2, '0')}
                </Text>
                <View style={styles.rowInfo}>
                  <Text style={[styles.rowTitle, index === queueIndex && styles.rowTitleActive]} numberOfLines={1}>
                    {item.title.toUpperCase()}
                  </Text>
                  <Text style={styles.rowArtist}>
                    {item.artists.map(a => a.name).join(', ')}
                  </Text>
                </View>
                <Text style={styles.rowDuration}>{formatDuration(item.durationSeconds)}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
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
