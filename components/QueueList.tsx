import { useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { usePlayerActions, usePlayerData } from '@/hooks/usePlayer'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'
import { sfx } from '@/services/sfxEngine'

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function QueueList() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { queue, queueIndex } = usePlayerData()
  const { jumpToIndex, shuffleQueue } = usePlayerActions()

  if (queue.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>◈</Text>
        <Text style={styles.emptyText}>QUEUE IS EMPTY</Text>
        <Text style={styles.emptyHint}>PICK SOMETHING FROM MUSIC</Text>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.headerCount}>{queue.length} TRACKS</Text>
        <TouchableOpacity
          style={styles.shuffleBtn}
          onPress={() => {
            sfx.play('switch')
            shuffleQueue()
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.shuffleText}>⇄ SHUFFLE</Text>
        </TouchableOpacity>
      </View>
      <FlatList
      data={queue}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={[styles.row, index === queueIndex && styles.rowActive]}
          activeOpacity={0.7}
          onPress={() => {
            sfx.play('track')
            jumpToIndex(index)
          }}
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
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    headerCount: {
      fontFamily: 'VT323_400Regular',
      fontSize: 14,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    shuffleBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    shuffleText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.accent,
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
