import { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeColors, ThemeName } from '@/theme/themes'

type SettingsRowProps = {
  label: string
  value?: string
  accent?: boolean
}

function SettingsRow({ label, value, accent }: SettingsRowProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, accent && styles.rowLabelAccent]}>{label}</Text>
      {value != null && <Text style={styles.rowValue}>{value}</Text>}
    </View>
  )
}

const THEME_OPTIONS: { name: ThemeName; label: string }[] = [
  { name: 'tierra', label: 'TIERRA' },
  { name: 'arena', label: 'ARENA' },
  { name: 'neon', label: 'NEON' },
]

export default function SettingsScreen() {
  const { colors, themeName, setTheme } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>SETTINGS</Text>
          <View style={styles.headerLine} />
        </View>

        {/* Theme card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TEMA</Text>
          <View style={styles.cardSeparator} />
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(option => {
              const isActive = option.name === themeName
              return (
                <TouchableOpacity
                  key={option.name}
                  style={[styles.themeBtn, isActive && styles.themeBtnActive]}
                  activeOpacity={0.7}
                  onPress={() => setTheme(option.name)}
                >
                  <Text style={[styles.themeBtnText, isActive && styles.themeBtnTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Source card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>FUENTE DE MÚSICA</Text>
          <View style={styles.cardSeparator} />
          <View style={styles.accountInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>♪</Text>
            </View>
            <View style={styles.accountText}>
              <Text style={styles.accountName}>JAMENDO</Text>
              <Text style={styles.accountEmail}>Catálogo Creative Commons · streaming directo</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>READ-ONLY</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Audio quality card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>REPRODUCCIÓN</Text>
          <View style={styles.cardSeparator} />
          <SettingsRow label="STREAMING" value="MP3 VBR" />
        </View>

        {/* About card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ACERCA DE</Text>
          <View style={styles.cardSeparator} />
          <SettingsRow label="VERSIÓN" value="0.2.0" />
          <View style={styles.rowSep} />
          <SettingsRow label="BUILD" value="DEV" />
        </View>

        <Text style={styles.footer}>MAMADA REPRODUCTOR · v0.2</Text>

      </ScrollView>
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
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 32,
      gap: 16,
    },
    header: {
      marginBottom: 4,
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
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 0,
    },
    cardTitle: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.accent,
      letterSpacing: 1,
      marginBottom: 10,
    },
    cardSeparator: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 12,
    },
    // Theme picker
    themeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    themeBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    themeBtnActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    themeBtnText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    themeBtnTextActive: {
      color: colors.bg,
    },
    // Source
    accountInfo: {
      flexDirection: 'row',
      gap: 14,
      alignItems: 'center',
    },
    avatarPlaceholder: {
      width: 52,
      height: 52,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 16,
      color: colors.bg,
    },
    accountText: {
      flex: 1,
      gap: 4,
    },
    accountName: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 8,
      color: colors.text,
    },
    accountEmail: {
      fontFamily: 'VT323_400Regular',
      fontSize: 14,
      color: colors.textMuted,
    },
    tierBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accent,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginTop: 4,
    },
    tierText: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 5,
      color: colors.bg,
      letterSpacing: 0.5,
    },
    // Rows
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    rowLabel: {
      fontFamily: 'PressStart2P_400Regular',
      fontSize: 6,
      color: colors.text,
      letterSpacing: 0.3,
    },
    rowLabelAccent: {
      color: colors.accent,
    },
    rowValue: {
      fontFamily: 'VT323_400Regular',
      fontSize: 16,
      color: colors.textMuted,
      letterSpacing: 1,
    },
    rowSep: {
      height: 1,
      backgroundColor: colors.border,
      opacity: 0.4,
    },
    footer: {
      fontFamily: 'VT323_400Regular',
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      letterSpacing: 1,
      opacity: 0.5,
    },
  })
