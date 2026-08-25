import { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors } from '@/theme/themes'

interface TauriWindow {
  minimize: () => Promise<void>
  toggleMaximize: () => Promise<void>
  close: () => Promise<void>
}

declare global {
  interface Window {
    __TAURI__?: {
      window: {
        getCurrentWindow: () => TauriWindow
      }
    }
  }
}

const getTauriWindow = (): TauriWindow | null => {
  if (typeof window === 'undefined' || !window.__TAURI__) return null
  return window.__TAURI__.window.getCurrentWindow()
}

function WindowButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <TouchableOpacity style={styles.winBtn} onPress={onPress} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8 }}>
      <Text style={[styles.winBtnText, label === '✕' && styles.winBtnClose]}>{label}</Text>
    </TouchableOpacity>
  )
}

export function TitleBar() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const win = getTauriWindow()
  if (!win) return null

  return (
    // data-tauri-drag-region: Tauri inyecta arrastre + doble-clic maximizar sobre este elemento
    <View
      style={styles.bar}
      {...({ dataSet: { 'tauri-drag-region': 'true' } } as object)}
    >
      <View style={styles.left}>
        <View style={styles.dot} />
        <Text style={styles.title}>MAMADA REPRODUCTOR</Text>
      </View>
      <View style={styles.right}>
        <WindowButton label="─" onPress={() => win.minimize()} />
        <WindowButton label="□" onPress={() => win.toggleMaximize()} />
        <WindowButton label="✕" onPress={() => win.close()} />
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 32,
      backgroundColor: colors.surface,
      borderBottomWidth: 2,
      borderBottomColor: colors.border,
      paddingLeft: 12,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    title: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    right: {
      flexDirection: 'row',
      height: '100%',
    },
    winBtn: {
      width: 44,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    winBtnText: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 16,
    },
    winBtnClose: {
      color: colors.accent,
    },
  })
