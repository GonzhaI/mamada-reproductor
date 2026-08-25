import { useMemo } from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

const TAB_CONFIG = [
  { name: 'index',   label: 'PLAY',  icon: '▶' },
  { name: 'library', label: 'MUSIC', icon: '◈' },
  { name: 'settings', label: 'SET',  icon: '⚙' },
]

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* top border pixel line */}
      <View style={styles.topBorder} />

      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const tab = TAB_CONFIG.find(t => t.name === route.name) ?? TAB_CONFIG[0]
          const isFocused = state.index === index

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {/* active indicator pixel block */}
              {isFocused && <View style={styles.activeIndicator} />}

              <Text style={[styles.icon, isFocused && styles.iconActive]}>
                {tab.icon}
              </Text>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 2,
    },
    topBorder: {
      height: 1,
      backgroundColor: colors.accent,
      opacity: 0.4,
    },
    tabRow: {
      flexDirection: 'row',
      height: 60,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      position: 'relative',
    },
    activeIndicator: {
      position: 'absolute',
      top: 0,
      left: '20%',
      right: '20%',
      height: 2,
      backgroundColor: colors.accent,
    },
    icon: {
      fontSize: 16,
      color: colors.textMuted,
    },
    iconActive: {
      color: colors.accent,
    },
    label: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 5,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    labelActive: {
      color: colors.accent,
    },
  })
